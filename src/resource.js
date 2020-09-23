/* eslint-disable no-console */
/* eslint-disable guard-for-in */
/* eslint-disable no-restricted-syntax */

const { constants } = require('./constants');
const Operation = require('./operation');
const Relationship = require('./relationship');
const utils = require('./utils');

class Resource {
  constructor(name, operations, relationShips) {
    this.name = name;
    this.operations = operations;
    this.relationShips = relationShips;
  }

  static detectResource(path) {
    const segments = path.split('/');
    const lastSegment = segments[segments.length - 1];
    let resourceSegment = null;
    while (!resourceSegment || resourceSegment.endsWith('}')) {
      resourceSegment = segments.pop();

      if (resourceSegment) {
        if (resourceSegment.endsWith('s')) {
          resourceSegment = resourceSegment.replace(/s$/, '');
        } else if (lastSegment.endsWith('}')) {
          resourceSegment = lastSegment.replace(/[{}]/g, '').replace(/(Id|Key)s?/, '');
        } else {
          resourceSegment = null;
        }
      } else {
        break;
      }
    }
    return (resourceSegment && resourceSegment.length > 0) ? resourceSegment.charAt(0).toUpperCase() + resourceSegment.substr(1) : null;
  }

  static parseResources(paths, schemas, verbose) {
    const allReferencedFiles = [];
    const allParsedResources = {};

    for (const [pathKey, path] of Object.entries(paths)) {
      if (verbose) console.log(`\n\n############################### path :: ${pathKey} ###############################`);

      const [referencedFiles, operations] = Operation.parseOperations(pathKey, path, path.parameters, verbose);
      utils.addValuesOfArrayToOtherArrayIfNotExist(referencedFiles, allReferencedFiles);

      for (const operation of operations) {
        const resourceName = this.detectResource(operation.path) || 'Unknown';
        const resource = allParsedResources[resourceName] || new Resource(resourceName, [], []);
        allParsedResources[resourceName] = resource;
        resource.operations.push(operation);

        for (const [responseCode, response] of Object.entries(operation.responses)) {
          if (Number(responseCode) < 400) {
            const description = `${operation.deprecated ? 'DEPRECATED ' : ''}${responseCode} ${operation.method.toUpperCase()} ${operation.path}`;
            resource.relationShips.push(new Relationship(resourceName, response.itemType || response.type, description, constants.RELATIONSHIP_USE, '1', response.itemType ? '0..*' : '1'));
          }
        }
      }
    }

    return [allReferencedFiles, allParsedResources];
  }
}

module.exports = Resource;

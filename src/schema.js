/* eslint-disable no-console */
/* eslint-disable guard-for-in */
/* eslint-disable no-restricted-syntax */

const util = require('util');
const Property = require('./property');
const utils = require('./utils');

class Schema {
  constructor(title, name, properties, description, relationShips, parents) {
    this.title = title;
    this.name = name;
    this.properties = properties;
    this.description = description;
    this.relationShips = relationShips;
    this.parents = parents;
  }

  static parseSchemas(schemas, verbose) {
    const allReferencedFiles = [];
    const allParsedSchemas = {};

    for (const [name, schema] of Object.entries(schemas)) {
      let { title } = schema;
      if (!title) {
        title = name;
      }
      const parents = [];
      const { description } = schema;

      if (verbose) console.log(`\n\n############################### schema name :: ${title || name} ###############################`);

      const reference = schema.$ref || (schema.items || {}).$ref;
      if (reference) {
        utils.processReferences([reference], allReferencedFiles, verbose);
      } else if (schema.allOf !== undefined) {
        const [referencedFiles, parsedSchemas] = this.processInheritance(schema, name, schema.allOf, verbose);

        utils.mergeObjects(parsedSchemas, allParsedSchemas);
        utils.addValuesOfArrayToOtherArrayIfNotExist(referencedFiles, allReferencedFiles);
      } else if (schema.type === 'object' || schema.properties !== undefined) {
        // parse properties of this schema
        const [parsedProperties, relationShips, referencedFiles] = Property.parseProperties(schema.properties, schema.required, name, verbose);
        if (allParsedSchemas[name] === undefined) {
          allParsedSchemas[name] = new Schema(title, name, parsedProperties, description, relationShips, parents);

          utils.addValuesOfArrayToOtherArrayIfNotExist(referencedFiles, allReferencedFiles);
        }
      } else if (verbose) console.log(`!!!!!!!!!!!!!!!! unparseable schema definition :: ${JSON.stringify(schema)}`);
    }
    return [allReferencedFiles, allParsedSchemas];
  }

  static processInheritance(schema, name, allOf, verbose) {
    if (verbose) console.log(`***************** name :: ${name}`);
    const parsedSchemas = {};
    const parents = [];
    const allReferencedFiles = [];
    const { description } = schema;

    if (verbose) console.log(`fullschema: ${util.inspect(schema, { showHidden: false, depth: null })}`);

    let parsedProperties;
    let relationShips;
    let referencedFiles;

    for (const attribute of allOf) {
      if (verbose) console.log('********************************************************************');
      if (verbose) console.log(`***************** attribute: ${util.inspect(attribute, { showHidden: false, depth: null })}`);

      if (attribute.$ref) {
        parents.push(utils.lastToken(attribute.$ref, '/'));
        if (verbose) console.log(`***************** parents :: ${parents}`);
      }

      if (attribute.type !== undefined && attribute.type === 'object' && attribute.properties !== undefined) {
        if (verbose) console.log(`***************** type :: ${attribute.type}`);
        if (verbose) console.log(`***************** type.properties :: ${attribute.properties}`);

        [parsedProperties, relationShips, referencedFiles] = Property.parseProperties(attribute.properties, attribute.required, name, verbose);
        utils.addValuesOfArrayToOtherArrayIfNotExist(referencedFiles, allReferencedFiles);
      }
    }
    if (parsedSchemas[name] === undefined) {
      if (verbose) console.log(`***************** creating schema :: ${name}`);

      parsedSchemas[name] = new Schema(schema.title, name, parsedProperties, description, relationShips, parents);
    }

    return [allReferencedFiles, parsedSchemas];
  }
}

module.exports = Schema;

/* eslint-disable no-console */
/* eslint-disable guard-for-in */
/* eslint-disable no-restricted-syntax */

const Parameter = require('./parameter');
const Response = require('./response');
const utils = require('./utils');

class Operation {
  constructor(path, method, deprecated, parameters, responses) {
    this.path = path;
    this.method = method;
    this.deprecated = deprecated;
    this.parameters = parameters;
    this.responses = responses;
  }

  static parseOperations(path, methods, topLevelParams, verbose) {
    const allReferencedFiles = [];
    const allParsedOperations = [];
    const allParsedSchemas = {};

    for (const [methodKey, operation] of Object.entries(methods)) {
      if (['delete', 'get', 'head', 'options', 'patch', 'post', 'put', 'trace'].includes(methodKey)) {
        if (verbose) console.log(`\n\n############################### operation :: ${methodKey.toUpperCase()} ${path} ###############################`);

        const params = {};
        let [referencedFiles, parsedParameters, parsedSchemas] = Parameter.parseParameters(topLevelParams, verbose);
        utils.processReferences(referencedFiles, allReferencedFiles, verbose);
        utils.mergeObjects(parsedParameters, params);
        utils.mergeObjects(parsedSchemas, allParsedSchemas);

        [referencedFiles, parsedParameters, parsedSchemas] = Parameter.parseParameters(operation.parameters, verbose);
        utils.processReferences(referencedFiles, allReferencedFiles, verbose);
        utils.mergeObjects(parsedParameters, params);
        utils.mergeObjects(parsedSchemas, allParsedSchemas);

        [referencedFiles, parsedParameters, parsedSchemas] = Parameter.parseRequestBody(operation.requestBody, verbose);
        utils.processReferences(referencedFiles, allReferencedFiles, verbose);
        utils.mergeObjects(parsedParameters, params);
        utils.mergeObjects(parsedSchemas, allParsedSchemas);

        const [referencedFiles2, parsedResponses, parsedSchemas2] = Response.parseResponses(operation.responses, verbose);
        utils.processReferences(referencedFiles2, allReferencedFiles, verbose);
        utils.mergeObjects(parsedSchemas2, allParsedSchemas);

        allParsedOperations.push(new Operation(path, methodKey, operation.deprecated, params, parsedResponses));
      }
    }
    return [allReferencedFiles, allParsedOperations];
  }
}

module.exports = Operation;

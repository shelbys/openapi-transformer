/* eslint-disable no-console */
/* eslint-disable guard-for-in */
/* eslint-disable no-restricted-syntax */

const Schema = require('./schema');
const utils = require('./utils');

class Parameter {
  constructor(name, required, kind, deprecated, description, type, itemType, schemas) {
    this.name = name;
    this.required = required;
    this.kind = kind;
    this.deprecated = deprecated;
    this.description = description;
    this.type = type;
    this.itemType = itemType;
    this.schemas = schemas;
  }

  static parseParameters(params, verbose) {
    const allReferencedFiles = [];
    const allParsedParameters = {};
    const allParsedSchemas = {};

    for (const param of params || []) {
      let paramName = param.name;
      if (!paramName && param.$ref) {
        paramName = param.$ref.replace(/.*\//g, '');
      }
      if (verbose) console.log(`\n\n############################### param :: ${paramName} ###############################`);

      let parsedSchemas = {};
      let { type } = (param.schema || {});
      const itemType = ((param.schema || {}).items || {}).type;
      if (param.$ref) {
        type = param.$ref;
      } else if (param.schema) {
        if (!param.schema.title) {
          param.schema.title = 'RequestBody';
        }
        let referencedFiles;
        [referencedFiles, parsedSchemas] = Schema.parseSchemas([param.schema], verbose);

        utils.processReferences(referencedFiles, allReferencedFiles, verbose);
        utils.mergeObjects(parsedSchemas, allParsedSchemas);
      }

      allParsedParameters[paramName] = new Parameter(paramName, param.required, param.in, param.deprecated, param.description, type, itemType, parsedSchemas);
    }
    return [allReferencedFiles, allParsedParameters, allParsedSchemas];
  }

  static parseRequestBody(requestBody, verbose) {
    const allReferencedFiles = [];
    const allParsedParameters = {};
    const allParsedSchemas = {};

    if (requestBody) {
      if (verbose) console.log('\n\n############################### requestBody ###############################');

      const { content } = requestBody;
      if (requestBody.$ref) {
        allParsedParameters.body = new Parameter('body', requestBody.required, 'body', requestBody.deprecated, requestBody.description, requestBody.$ref, null, {});
      } else {
        for (const mime of Object.values(content)) {
          const [referencedFiles, parsedSchemas] = Schema.parseSchemas([mime.schema], verbose);
          utils.processReferences(referencedFiles, allReferencedFiles, verbose);
          utils.mergeObjects(parsedSchemas, allParsedSchemas);

          let { type } = (mime.schema || {});
          let itemType = ((mime.schema || {}).items || {}).type;
          if (!type && mime.schema && mime.schema.$ref) {
            type = mime.schema.$ref.replace(/.*\//g, '');
          }
          if (!itemType && mime.schema && mime.schema.items && mime.schema.items.$ref) {
            itemType = mime.schema.items.$ref.replace(/.*\//g, '');
          }
          allParsedParameters.body = new Parameter('body', requestBody.required, 'body', requestBody.deprecated, requestBody.description, type, itemType, parsedSchemas);
        }
      }
    }
    return [allReferencedFiles, allParsedParameters, allParsedSchemas];
  }
}

module.exports = Parameter;

/* eslint-disable no-console */
/* eslint-disable guard-for-in */
/* eslint-disable no-restricted-syntax */

const Schema = require('./schema');
const utils = require('./utils');

class Response {
  constructor(code, description, mime, type, itemType, schemas) {
    this.code = code;
    this.description = description;
    this.mime = mime;
    this.type = type;
    this.itemType = itemType;
    this.schemas = schemas;
  }

  static parseResponses(responses, verbose) {
    const allReferencedFiles = [];
    const allParsedResponses = {};
    const allParsedSchemas = {};

    for (const [responseCode, response] of Object.entries(responses)) {
      let { content } = response;
      if (verbose) console.log(`\n\n############################### response :: ${responseCode} ###############################`);

      if (!content && response.schema) {
        content = { '*/*' : { schema: response.schema } };
      }

      for (const [mimeKey, mime] of Object.entries(content || {})) {
        if (!mime.schema.title) {
          mime.schema.title = `Response${responseCode}`;
        }

        const [referencedFiles, parsedSchemas] = Schema.parseSchemas([mime.schema], verbose);
        let { type } = (mime.schema || {});
        let itemType = ((mime.schema || {}).items || {}).type;
        if (!type && mime.schema && mime.schema.$ref) {
          type = mime.schema.$ref.replace(/.*\//g, '');
        }
        if (!itemType && mime.schema && mime.schema.items && mime.schema.items.$ref) {
          itemType = mime.schema.items.$ref.replace(/.*\//g, '');
        }
        allParsedResponses[responseCode] = new Response(responseCode, response.description, mimeKey, type, itemType, parsedSchemas);

        utils.processReferences(referencedFiles, allReferencedFiles, verbose);
        utils.mergeObjects(parsedSchemas, allParsedSchemas);
      }
    }
    return [allReferencedFiles, allParsedResponses, allParsedSchemas];
  }
}

module.exports = Response;

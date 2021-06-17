/* eslint-disable no-console */
/* eslint-disable guard-for-in */
/* eslint-disable no-restricted-syntax */
const YAML = require('yaml');
const fs = require('fs');
const path = require('path');
const http = require('http');
const https = require('https');
const Schema = require('./schema');
const Resource = require('./resource');
const utils = require('./utils');

const allLoadedFiles = [];

async function loadUrl(url) {
  return new Promise((resolve, reject) => {
    const httpLib = url.startsWith('https') ? https : http;
    const request = httpLib.request(url, (res) => {
      let data = '';

      res.on('data', (chunk) => {
        data += chunk;
      });

      res.on('end', () => {
        res.body = data;
        resolve(res);
      });
    });

    request.on('error', (error) => {
      reject(error);
    });

    request.end();
  });
}

async function loadYamlFile(rawFileOrUrl, verbose) {
  let fileOrUrl = rawFileOrUrl.startsWith('http') ? rawFileOrUrl : path.resolve(rawFileOrUrl);
  if (allLoadedFiles.includes(fileOrUrl)) {
    if (verbose) console.log(`@@@@@@@@@@@@@@@@ already loaded :: ${fileOrUrl}; skipping`);
    return [];
  }

  if (verbose) console.log(`***************** processing fileOrUrl :: ${fileOrUrl}`);
  const allParsedSchemas = {};
  const allParsedResources = {};

  let loadedFile;
  let basePath;
  if (fileOrUrl.startsWith('http')) {
    basePath = fileOrUrl;
    if (verbose) console.log(`**************** base http path :: ${basePath}`);
    const response = await loadUrl(fileOrUrl);
    if (response.body) {
      loadedFile = response.body;
    } else {
      throw response;
    }
  } else {
    // determine base to resolve other file references from
    basePath = path.dirname(fileOrUrl);
    if (verbose) console.log(`**************** base file path :: ${basePath}`);

    loadedFile = fs.readFileSync(fileOrUrl, 'UTF-8');
  }
  const myYaml = YAML.parse(loadedFile);
  allLoadedFiles.push(fileOrUrl);
  if (verbose) console.log(`@@@@@@@@@@@@@@@@ loaded files :: ${allLoadedFiles}`);

  if (myYaml !== undefined) {
    if ((myYaml.components !== undefined && myYaml.components.schemas !== undefined) ||
        myYaml.definitions !== undefined) {
      let { schemas } = myYaml.components || {};
      if (!schemas) {
        schemas = myYaml.definitions;
      }

      const [referencedFiles, parsedSchemas] = Schema.parseSchemas(schemas, verbose);

      utils.mergeObjects(parsedSchemas, allParsedSchemas);

      if (referencedFiles !== undefined && referencedFiles.length > 0) {
        referencedFiles.forEach(async (referencedFile) => {
          const [referencedParsedSchemas, referencedParsedResources] = await loadYamlFile(`${basePath}/${referencedFile}`, verbose);

          utils.mergeObjects(referencedParsedSchemas, allParsedSchemas);
          utils.mergeObjects(referencedParsedResources, allParsedResources);
        });
      }
    }

    if (myYaml.paths !== undefined) {
      const { paths } = myYaml;
      const [referencedFiles, parsedResources] = Resource.parseResources(paths, allParsedSchemas, verbose);

      utils.mergeObjects(parsedResources, allParsedResources);

      if (referencedFiles !== undefined && referencedFiles.length > 0) {
        referencedFiles.forEach(async (referencedFile) => {
          const [referencedParsedSchemas, referencedParsedResources] = await loadYamlFile(`${basePath}/${referencedFile}`, verbose);

          utils.mergeObjects(referencedParsedSchemas, allParsedSchemas);
          utils.mergeObjects(referencedParsedResources, allParsedResources);
        });
      }
    }
  }
  // clean allLoadedFiles (for testing)
  allLoadedFiles.length = 0;
  return [allParsedSchemas, allParsedResources];
}
module.exports.loadYamlFile = loadYamlFile;

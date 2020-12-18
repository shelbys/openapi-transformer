#!/usr/bin/env node
/* eslint-disable no-console */

const fs = require('fs');
const program = require('commander');
const { version } = require('../package.json');
const plantUmlTransformer = require('./plantUmlTransformer');
const markdownTransformer = require('./markdownTransformer');
const jsonSchemaTransformer = require('./jsonSchemaTransformer');
const mermaidTransformer = require('./mermaidTransformer');
const openApiGenerator = require('./index.js');

program
  .version(version)
  .usage('[options] <inputfile>')
  .description('At least 1 output type must be selected: jsonschema, markdown, mermaid, or plantuml!')
  .option('-d, --details', 'Show extra attribute details')
  .option('-p, --plantuml <plantuml file>', 'Transform to plantuml')
  .option('-m, --markdown <markdown file>', 'Transform to markdown')
  .option('-e, --mermaid <mermaid file>', 'Transform to mermaid')
  .option('-j, --jsonschema <jsonschema file>', 'Transform to json schema')
  .option('-o, --linkoperation <url>', 'Pattern for link to operation in portal'
    + ', `{RESOURCE}` will be replaced with Resource.name'
    + ', `{METHOD}` will be replaced with Operation.method'
    + ', `{PATH}` will be replaced with Operation.path'
    + ', `{ID}` will be replaced with Operation.operationId'
    + ', `{REDOC}` will be replaced with a ReDoc style anchor'
    + ', `{SWAGGER}` will be replaced with SwaggerUI style anchor')
  .option('-s, --linkschema <url>', 'Pattern for link to schema in portal'
    + ', `{NAME}` will be replaced with Schema.name')
  .option('-v, --verbose', 'Show verbose debug output')
  .parse(process.argv);

if (!program.args.length || (program.plantuml == null && program.markdown == null && program.mermaid == null && program.jsonschema == null)) {
  program.help();
} else {
  const { verbose } = program;

  if (verbose) console.log('Reading openAPI...');
  (async () => {
    const [allParsedSchemas, allParsedResources] = await openApiGenerator.loadYamlFile(program.args[0], verbose);

    if (program.plantuml !== undefined) {
      if (verbose) console.log('Writing plantuml...');
      let uml = '';
      if (program.details === undefined) {
        uml = plantUmlTransformer.generate(allParsedSchemas, false);
      } else {
        uml = plantUmlTransformer.generate(allParsedSchemas, true);
      }
      fs.writeFileSync(program.plantuml, uml, 'utf8');
    }

    if (program.markdown !== undefined) {
      if (verbose) console.log('Writing markdown...');
      const md = markdownTransformer.generate(allParsedSchemas);
      fs.writeFileSync(program.markdown, md, 'utf8');
    }

    if (program.mermaid !== undefined) {
      if (verbose) console.log('Writing mermaid...');
      const includeDetails = (program.details !== undefined);
      const mermaid = mermaidTransformer.generate(allParsedSchemas, allParsedResources, includeDetails, program.linkoperation, program.linkschema);
      fs.writeFileSync(program.mermaid, mermaid, 'utf8');
    }

    if (program.jsonschema !== undefined) {
      if (verbose) console.log('Writing JSON Schema...');
      const js = jsonSchemaTransformer.generate(allParsedSchemas);
      fs.writeFileSync(program.jsonschema, js, 'utf8');
    }

    if (verbose) console.log('Finished rendering documentation!');
  })();
}

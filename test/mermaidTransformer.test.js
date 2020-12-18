const { assert, expect } = require('chai');
const fs = require('fs');
const mermaidTransformer = require('../src/mermaidTransformer');

const openApiGenerator = require('../src/index.js');


describe('openApiGenerator - test mermaid transformer', () => {
  it('Test with no reference.', async () => {
    console.log(" ******************************************")
    console.log(" ******************************************")
    console.log(" ******************************************")
    const [loadedSchemas, loadedResources] = await openApiGenerator.loadYamlFile('./test/resources/propertyNoRelationShipNoReferences.yaml', true);
    assert.isDefined(loadedSchemas);

    const result = mermaidTransformer.generate(loadedSchemas, loadedResources, true, 'http://example.com{REDOC}', 'http://example.com#model-{NAME}');
    const expectedResult = fs.readFileSync('./test/resources/expectedResultMermaidPropertyNoRelationShipNoReferences.mmd');

    expect(result).to.deep.equal(expectedResult.toString());
  });
  it('Test with references.', async () => {
    const [loadedSchemas, loadedResources] = await openApiGenerator.loadYamlFile('./test/resources/propertyFiveRelationShipThreeReferencesUsingExtension.test.yaml', true);
    assert.isDefined(loadedSchemas);

    const result = mermaidTransformer.generate(loadedSchemas, loadedResources, true, 'http://example.com{SWAGGER}', 'http://example.com#tag/model-{NAME}');
    const expectedResult = fs.readFileSync('./test/resources/expectedPropertyFiveRelationShipThreeReferencesUsingExtension.mmd');

    console.log('======== result: ' + result);
    expect(result).to.deep.equal(expectedResult.toString());
  });
});

const { assert } = require('chai');
const openApiGenerator = require('../src/index.js');

function assertRelationShip(relationShip, expectedFrom, expectedTo, expectedDescription, expectedType) {
  assert.equal(relationShip.from, expectedFrom);
  assert.equal(relationShip.to, expectedTo);
  assert.equal(relationShip.description, expectedDescription);
  assert.equal(relationShip.type, expectedType);
}

describe('openApiGenerator - loadYamlFile - one relationship - transitive $refs from child to parent', async () => {
  it('Load two schema objects from a parent reference file.', async () => {
    const [loadedSchemas, loadedResources] = await openApiGenerator.loadYamlFile('./test/resources/generatorPathRefs/petstore.yaml', false);

    assert.isDefined(loadedSchemas);
    assert.equal(Object.keys(loadedSchemas).length, 2);

    assert.isDefined(loadedResources);
    assert.equal(Object.keys(loadedResources).length, 2);
  });

  it('Check relationship: $refs across files', async () => {
    const [loadedSchemas, loadedResources] = await openApiGenerator.loadYamlFile('./test/resources/generatorPathRefs/petstore.yaml', false);

    assertRelationShip(loadedSchemas.Pet.relationShips[0], 'Pet', 'Category', 'category', 'use');
    assertRelationShip(loadedResources.Pet.relationShips[0], 'Pet', 'Pet', '200 GET /pet/{petId}', 'use');
  });
});

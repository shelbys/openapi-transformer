const { assert } = require('chai');
const YAML = require('yaml');
const fs = require('fs');
const Property = require('../src/property');

function getTestData(testYamlFile) {
  const loadedFile = fs.readFileSync(testYamlFile, 'UTF-8');
  return YAML.parse(loadedFile);
}

function assertRelationShip(relationShip, expectedFrom, expectedTo, expectedDescription, expectedType) {
  assert.equal(relationShip.from, expectedFrom);
  assert.equal(relationShip.to, expectedTo);
  assert.equal(relationShip.description, expectedDescription);
  assert.equal(relationShip.type, expectedType);
}

describe('properties - parseProperties - two relationships - one references to other files', () => {
  const testData = getTestData('./test/resources/propertyThreeRelationShipTwoReferences.yaml');

  const { properties } = testData.components.schemas.owner;
  const { required } = testData.components.schemas.owner;
  const verbose = false;

  const arrayUnderTest = Property.parseProperties(properties, required, 'owner', verbose);
  assert.isDefined(arrayUnderTest);
  it('Reponse is array of sub-arrays of which the first one contains properties and the second one the ', () => {
    assert.equal(arrayUnderTest.length, 3);
    assert.equal(arrayUnderTest[0].length, 4); // properties
    assert.equal(arrayUnderTest[1].length, 3); // relation ships
    assert.equal(arrayUnderTest[2].length, 2); // external files
  });
  it('Check property: name', () => {
    const property = arrayUnderTest[0][0];
    assert.equal(property.name, 'name');
    assert.equal(property.type, 'string');
    assert.equal(property.required, false);
    assert.equal(property.description, 'the name of the owner');
    assert.equal(property.example, 'John Doe');

    assert.equal(property.details.length, 0);
  });
  it('Check property: partner', () => {
    const property = arrayUnderTest[0][1];
    assert.equal(property.name, 'partner');
    assert.equal(property.type, 'partner');
    assert.equal(property.required, true);
    assert.equal(property.description, 'partner of the owner');
    assert.equal(property.example, undefined);

    assert.equal(property.details.length, 0);
  });
  it('Check property: children', () => {
    const property = arrayUnderTest[0][2];
    assert.equal(property.name, 'children');
    assert.equal(property.type, 'array');
    assert.equal(property.itemType, 'child');
    assert.equal(property.required, false);
    assert.equal(property.description, 'children of the owner');
    assert.equal(property.example, undefined);

    assert.equal(property.details.length, 0);
  });
  it('Check property: parents', () => {
    const property = arrayUnderTest[0][3];
    assert.equal(property.name, 'parents');
    assert.equal(property.type, 'array');
    assert.equal(property.itemType, 'parent');
    assert.equal(property.description, 'parents of the owner');
    assert.equal(property.example, undefined);

    assert.equal(property.details.length, 0);
  });
  it('Check relationship: partner', () => {
    assertRelationShip(arrayUnderTest[1][0], 'owner', 'partner', 'partner', 'use');
  });

  it('Check relationship: children', () => {
    assertRelationShip(arrayUnderTest[1][1], 'owner', 'child', 'children', 'composition');
  });

  it('Check relationship: parents', () => {
    assertRelationShip(arrayUnderTest[1][2], 'owner', 'parent', 'parents', 'composition');
  });
  it('Check external file: child', () => {
    const file = arrayUnderTest[2][0];
    assert.equal(file, 'child.yaml');
  });
  it('Check external file: parent', () => {
    const file = arrayUnderTest[2][1];
    assert.equal(file, 'parent.yaml');
  });
});

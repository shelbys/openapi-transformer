const { assert } = require('chai');
const sinon = require('sinon');
const Property = require('../src/property');
const Schema = require('../src/schema');

// console.log('*** Schemas: ' + util.inspect(schemas, { showHidden: false, depth: null }));


function sizeOfArray(array) {
  let count = 0;
  // eslint-disable-next-line no-restricted-syntax
  // eslint-disable-next-line guard-for-in
  // eslint-disable-next-line no-empty-pattern
  for (const { } in array) {
    count += 1;
  }
  return count;
}
let sandbox = null;
describe('schemas - parseSchemas - two relationships - two references to other files', () => {
  // Mock the properties
  const mockedRelationShips = ['parent', 'child', 'parent'];
  const mockedReferencedFiles = ['parent.yaml', 'child.yml'];
  const mockedProperties = [new Property('fake', 'string')];
  const propertiesResponse = [mockedProperties, mockedRelationShips, mockedReferencedFiles];

  beforeEach(async () => {
    sandbox = sinon.sandbox.create();
  });
  afterEach(async () => {
    sandbox.restore();
  });

  // mock the schema
  const mockedSchemas = {};
  const mockedOwner = {};
  mockedOwner.title = 'Owner';
  mockedOwner.description = 'Owner information';
  mockedOwner.type = 'object';
  mockedOwner.properties = {};
  // property only added to trigger sinon mock
  mockedOwner.properties.name = {};
  mockedOwner.properties.name.description = 'the name of the owner';

  mockedSchemas.owner = mockedOwner;

  const verbose = false;

  it('should return 2 referencedfiles', () => {
    sandbox.stub(Property, 'parseProperties').returns(propertiesResponse);
    const arrayUnderTest = Schema.parseSchemas(mockedSchemas, verbose);

    assert.isDefined(arrayUnderTest);
    assert.equal(arrayUnderTest.length, 2);
    assert.equal(arrayUnderTest[0].length, 2);
  });
  it('should return 1 parsedSchema', () => {
    sandbox.stub(Property, 'parseProperties').returns(propertiesResponse);
    const arrayUnderTest = Schema.parseSchemas(mockedSchemas, verbose);

    assert.isDefined(arrayUnderTest);
    assert.equal(arrayUnderTest.length, 2);
    assert.equal(sizeOfArray(arrayUnderTest[1]), 1);
  });

  it('validate schema', () => {
    sandbox.stub(Property, 'parseProperties').returns(propertiesResponse);
    const arrayUnderTest = Schema.parseSchemas(mockedSchemas, verbose);

    assert.isDefined(arrayUnderTest);
    assert.equal(arrayUnderTest.length, 2);

    const schema = arrayUnderTest[1].owner;
    assert.equal(schema.name, 'owner');
    assert.equal(schema.description, 'Owner information');
    assert.equal(schema.properties.length, mockedProperties.length);
    assert.equal(schema.relationShips.length, 3);
    assert.isUndefined(schema.parent);
  });
});

const { assert } = require('chai');
const Relationship = require('../src/relationship');

describe('Test constructor', () => {
  it('Test constructor', () => {
    const expectedFrom = 'some-from';
    const expectedTo = 'some-to';
    const expectedDescription = 'some-description';
    const expectedType = 'some-type';
    const expectedFromCard = '2';
    const expectedToCard = '2..*';
    const detail = new Relationship(expectedFrom, expectedTo, expectedDescription, expectedType, expectedFromCard, expectedToCard);
    assert.equal(detail.from, expectedFrom);
    assert.equal(detail.to, expectedTo);
    assert.equal(detail.description, expectedDescription);
    assert.equal(detail.type, expectedType);
    assert.equal(detail.fromCard, expectedFromCard);
    assert.equal(detail.toCard, expectedToCard);
  });
});

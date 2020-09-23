/* eslint-disable no-console */
/* eslint-disable guard-for-in */
/* eslint-disable no-restricted-syntax */
const { constants } = require('./constants');
const utils = require('./utils');
const Detail = require('./detail');
const RelationShip = require('./relationship');

class Property {
  constructor(name, type, typeRefs, itemType, itemTypeRefs, required, isEnum, details, description, example) {
    this.name = name;
    this.type = type;
    this.typeRefs = typeRefs;
    this.itemType = itemType;
    this.itemTypeRefs = itemTypeRefs;
    this.required = required;
    this.isEnum = isEnum;
    this.details = details;
    this.description = description;
    this.example = example;
  }

  static parseDetails(property) {
    const details = [];
    let typeAfterDetailsParsing;
    let isEnum;

    if (property.default !== undefined) details.push(new Detail('default', property.default));
    if (property.deprecated !== undefined) details.push(new Detail('deprecated', property.deprecated));
    if (property.format !== undefined) details.push(new Detail('format', property.format));
    if (property.nullable !== undefined) details.push(new Detail('nullable', property.nullable));
    if (property.readOnly !== undefined) details.push(new Detail('readOnly', property.readOnly));
    if (property.writeOnly !== undefined) details.push(new Detail('writeOnly', property.writeOnly));

    if (property.type === 'string') {
      if (property.minLength !== undefined) details.push(new Detail('minLength', property.minLength));
      if (property.maxLength !== undefined) details.push(new Detail('maxLength', property.maxLength));
      if (property.pattern !== undefined) details.push(new Detail('pattern', property.pattern));

      if (property.enum !== undefined) {
        isEnum = true;
        for (const value of property.enum) {
          details.push(new Detail('enumvalue', value));
        }
      }
    } else if (property.type === 'number' || property.type === 'integer') {
      if (property.minimum !== undefined) details.push(new Detail('minimum', property.minimum));
      if (property.maximum !== undefined) details.push(new Detail('maximum', property.maximum));
      if (property.multipleOf !== undefined) details.push(new Detail('multipleOf', property.multipleOf));
    } else if (property.type === 'array') {
      if (property.minItems !== undefined) details.push(new Detail('minItems', property.minItems));
      if (property.maxItems !== undefined) details.push(new Detail('maxItems', property.maxItems));
      if (property.uniqueItems !== undefined) details.push(new Detail('uniqueItems', property.uniqueItems));
    }

    return [typeAfterDetailsParsing, details, isEnum];
  }

  static parseProperty(name, property, required, schemaName, verbose) {
    const relationShips = [];
    const referencedFiles = [];

    const isRequired = (required || []).includes(name);
    const fromCard = isRequired ? '1' : '0';
    let toCard = '';
    if (property.minItems != null || property.maxItems != null) {
      if (property.minItems === property.maxItems) {
        toCard = `${property.minItems}`;
      } else {
        toCard = `${property.minItems || ''}..${property.maxItems || '*'}`;
      }
    } else {
      toCard = '*';
    }
    let { type } = property;
    const typeRefs = [];
    let itemType = (property.items || {}).type || '';
    const itemTypeRefs = [];
    const { description } = property;
    const { example } = property;
    if (verbose) console.log(`***************** processing property :: [${name}] of type ::  [${type}]`);

    if (type == null && (property.$ref != null || property.allOf != null || property.anyOf != null || property.oneOf != null)) {
      // reference to other object, maybe in other file
      for (const ref of property.allOf || property.anyOf || property.oneOf || [property]) {
        const reference = ref.$ref;
        if (reference) {
          typeRefs.push(reference);
          utils.processReference(reference, referencedFiles, verbose);

          if (!reference.match(/\/properties\//)) {
            const to = utils.lastToken(reference, '/');
            type = to;
            relationShips.push(new RelationShip(schemaName, to, name, constants.RELATIONSHIP_USE, fromCard, fromCard));
          }
        }
      }
    } else if (type === 'array') {
      type = 'array';
      let first = true;

      for (const [itemKey, item] of Object.entries(property.items || {})) {
        if (itemKey === '$ref' || itemKey === 'allOf' || itemKey === 'anyOf' || itemKey === 'oneOf') {
          // process array of specific schema
          let refs = item;
          if (typeof refs === 'string') {
            refs = [{ $ref: refs }];
          }
          for (const ref of (refs || [])) {
            const reference = ref.$ref;
            if (typeof reference === 'string') {
              itemTypeRefs.push(reference);
              // add relationShip
              const objectName = utils.lastToken(reference, '/');
              relationShips.push(new RelationShip(schemaName, objectName, name, constants.RELATIONSHIP_COMPOSITION, fromCard, toCard));

              if (!first) {
                itemType += '|';
              }
              first = false;

              itemType += objectName;

              // is it a reference to an external file?
              utils.processReference(reference, referencedFiles, verbose);
            }
          }
        }
      }
    }

    if (name) {
      const pkMatch = name.match(/^(.*)(Id|Ids|Key|Keys)$/);
      if (pkMatch) {
        const foreignName = pkMatch[1].charAt(0).toUpperCase() + pkMatch[1].substr(1);
        if (foreignName !== schemaName) {
          relationShips.push(new RelationShip(schemaName, foreignName, name, constants.RELATIONSHIP_AGGREGATION, fromCard, toCard));
        }
      }
    }

    const [typeAfterDetailsParsing, details, isEnum] = this.parseDetails(property);

    if (typeAfterDetailsParsing !== undefined) itemType = typeAfterDetailsParsing;
    const requiredProperty = (required === undefined ? undefined : isRequired);

    return [new Property(name, type, typeRefs, itemType, itemTypeRefs, requiredProperty, isEnum, details, description, example), relationShips, referencedFiles];
  }

  static parseProperties(properties, required, schemaName, verbose) {
    const parsedProperties = [];
    const allRelationShips = [];
    const allReferencedFiles = [];

    for (const [name, property] of Object.entries(properties || {})) {
      const [parsedProperty, relationShips, referencedFiles] = this.parseProperty(name, property, required, schemaName, verbose);
      parsedProperties.push(parsedProperty);

      utils.addValuesOfArrayToOtherArrayIfNotExist(relationShips, allRelationShips);
      utils.addValuesOfArrayToOtherArrayIfNotExist(referencedFiles, allReferencedFiles);
    }

    return [parsedProperties, allRelationShips, allReferencedFiles];
  }
}


module.exports = Property;

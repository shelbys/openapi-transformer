const { constants } = require('./constants');
const Property = require('./property');

function sanitize(name) {
  if (!name) {
    return name;
  }

  let newName = name.replace(/[(){}]/g, '');
  if (/-/.test(newName)) {
    return '`' + newName + '`';
  } else {
    return newName;
  }
}

function generateParents(schemaName, parents) {
  let mermaid = '';
  for (const parent of (parents || [])) {
    mermaid += `  ${sanitize(parent)} <|-- ${sanitize(schemaName)} : extends`;
    mermaid += '\n';
  }
  return mermaid;
}

function generateRelationShips(relationShips) {
  let mermaid = '';
  if (relationShips !== undefined) {
    relationShips.forEach((relationShip) => {
      let type = '';
      switch (relationShip.type) {
        case constants.RELATIONSHIP_USE:
          type = '<--';
          break;
        case constants.RELATIONSHIP_AGGREGATION:
          type = 'o--';
          break;
        case constants.RELATIONSHIP_COMPOSITION:
          type = '*--';
          break;
        case constants.RELATIONSHIP_EXTENSION:
          type = '<|--';
          break;
        default:
      }
      let fromCard = '';
      if (relationShip.fromCard) {
        fromCard = `"${relationShip.fromCard}" `;
      }
      let toCard = '';
      if (relationShip.toCard) {
        toCard = ` "${relationShip.toCard}"`;
      }
      mermaid += `  ${sanitize(relationShip.from)} ${fromCard}${type}${toCard} ${sanitize(relationShip.to)} : ${relationShip.description}\n`;
    });
  }
  return mermaid;
}

function resolvePropertyFromRefs(refs, schemas) {
  const allSchemas = {
    components: {
      schemas,
    },
  };
  let parsedProperty;
  let mergedProperty;
  for (const reference of refs) {
    let typeSchema = allSchemas;
    let schemaName = '';
    const levels = reference.replace(/[^#]*#\//, '').split('/');
    while (levels.length > 0) {
      const level = levels.shift();
      if (Array.isArray(typeSchema)) {
        for (const item of typeSchema) {
          if (item.name === level || item.title === level) {
            typeSchema = item;
            break;
          }
        }
      } else {
        typeSchema = typeSchema[level];
      }
      if (typeSchema && typeSchema.name) {
        schemaName = typeSchema.name || typeSchema.title;
      }
      if (!typeSchema) {
        break;
      }
    }

    if (typeSchema && typeSchema !== allSchemas) {
      if (typeSchema.constructor.name === 'Property') {
        parsedProperty = typeSchema;
      } else {
        [parsedProperty] = Property.parseProperty(typeSchema.name, typeSchema, typeSchema.required ? [typeSchema.name] : [], schemaName, false);
      }
      if (mergedProperty) {
        Object.assign(parsedProperty, mergedProperty);
      } else {
        mergedProperty = parsedProperty;
      }
    }
  }
  return mergedProperty;
}

function generateProperty(sourceProperty, schemas, generateExtraDetails) {
  let property = resolvePropertyFromRefs(sourceProperty.typeRefs, schemas) || sourceProperty;
  if (property !== sourceProperty) {
    property = new Property(sourceProperty.name, property.type, property.typeRefs,
      property.itemType, property.itemTypeRefs, property.required, property.isEnum,
      property.details, property.description, property.example);
  }
  let type = property.type || (sourceProperty || {}).type;
  const itemTypeProperty = resolvePropertyFromRefs(sourceProperty.itemTypeRefs, schemas);
  const itemType = property.itemType || (itemTypeProperty || {}).itemType;
  const required = property.required ? '*' : '';
  let defaultValue = '';
  let deprecated = '';
  let enums = '';
  let format = '';
  let len = '';
  let nullable = '';
  let pattern = '';
  let range = '';
  let readOnly = '';
  let writeOnly = '';

  if (generateExtraDetails) {
    property.details.forEach((detail) => {
      switch (detail.name) {
        case 'default':
          defaultValue = `=${detail.value}`;
          break;
        case 'deprecated':
          deprecated = '!';
          break;
        case 'enumvalue':
          if (enums.length > 0) {
            enums += ',';
          }
          enums += sanitize(detail.value);
          break;
        case 'format':
          format = `~${detail.value}~`;
          break;
        case 'maxLength':
          if (len.length > 0) {
            len = `${len}${detail.value}`;
          } else {
            len = `..${detail.value}`;
          }
          break;
        case 'minLength':
          if (len.length > 0) {
            len = `${detail.value}${len}`;
          } else {
            len = `${detail.value}..`;
          }
          break;
        case 'maxItems':
          if (len.length > 0) {
            len = `${len}${detail.value}`;
          } else {
            len = `..${detail.value}`;
          }
          break;
        case 'minItems':
          if (len.length > 0) {
            len = `${detail.value}${len}`;
          } else {
            len = `${detail.value}..`;
          }
          break;
        case 'maximum':
          if (range.length > 0) {
            range = `${range}${detail.value}`;
          } else {
            range = `..${detail.value}`;
          }
          break;
        case 'minimum':
          if (range.length > 0) {
            range = `${detail.value}${range}`;
          } else {
            range = `${detail.value}..`;
          }
          break;
        case 'nullable':
          nullable = '?';
          break;
        case 'pattern':
          pattern = 'PATTERN';
          break;
        case 'readOnly':
          readOnly = '>';
          break;
        case 'writeOnly':
          writeOnly = '<';
          break;
        default:
      }
    });

    if (enums.length > 32) {
      enums = `${enums.slice(0, 32)}...`;
    }
  }

  if (itemType) {
    if (len) {
      type = `${type}~${itemType}, ${len}~`;
    } else {
      type = `${type}~${itemType}~`;
    }
  } else if (len) {
    type = `${type}[${len}]`;
  }
  let details = [];
  if (defaultValue.length > 0) {
    details.push(defaultValue);
  }
  if (enums.length > 0) {
    details.push(enums);
  }
  if (pattern.length > 0) {
    details.push(pattern);
  }
  if (range.length > 0) {
    details.push(range);
  }
  if (details.length > 0) {
    details = `[${details.join(',')}]`;
  } else {
    details = '';
  }

  let mermaid = `    +${type}${format}${details} ${deprecated}${property.name}${required}${nullable}${readOnly}${writeOnly}`;

  mermaid += '\n';

  return mermaid;
}

function generateOperations(operations, generateExtraDetails) {
  let mermaid = '';
  for (const operation of operations) {
    let result = '';
    for (const response of Object.values(operation.responses || {})) {
      if (['200', '201', '202', '203', '207'].includes(response.code)) {
        result += response.type;
        if (response.itemType) {
          result += `~${response.itemType}~`;
        }
      }
    }
    let params = '';
    if (generateExtraDetails) {
      for (const [paramName, param] of Object.entries(operation.parameters || {})) {
        if (['body', 'header', 'query'].includes(param.kind)) {
          if (params.length > 0) {
            params += ',';
          }
          params += `${param.deprecated ? '!' : ''}${paramName}${param.required ? '*' : ''}`;
        }
      }
    }
    const path = operation.path.replace(/\{([^}]+)\}/g, ':$1');
    mermaid += `    +${operation.deprecated ? 'DEPRECATED_' : ''}${operation.method.toUpperCase()}_${path.replace(/[/:]/g, '_')}(${params})${result ? ' ' + result : ''}\n`;
  }
  return mermaid;
}

const METHOD_PRIORITY = {
  GET: 1,
  PATCH: 2,
  PUT: 3,
  POST: 4,
  DELETE: 5,
  HEAD: 6,
  OPTIONS: 7,
  TRACE: 8,
};

function generateLink(schema, resource, linkOperation, linkSchema) {
  let result = '';
  if (linkOperation && resource) {
    const sortedOperations = [...resource.operations];
    // Sort by not deprecated first, then METHOD_PRIORITY ascending, then path length ascending
    sortedOperations.sort((a, b) => {
      let order = Number(a.deprecated || false) - Number(b.deprecated || false);
      if (order === 0) {
        order = (METHOD_PRIORITY[a.method.toUpperCase()] || METHOD_PRIORITY.length + 1) - (METHOD_PRIORITY[b.method.toUpperCase()] || METHOD_PRIORITY.length + 1);
        if (order === 0) {
          order = a.path.length - b.path.length;
        }
      }
      return order;
    });

    const operation = sortedOperations[0];
    let link = linkOperation.replace(/\{RESOURCE\}/g, sanitize(resource.name));
    link = link.replace(/\{METHOD\}/g, operation.method);
    link = link.replace(/\{PATH\}/g, operation.path);
    link = link.replace(/\{ID\}/g, operation.operationId);
    let anchorRedoc;
    if (operation.operationId) {
      anchorRedoc = `#operation/${operation.operationId}`;
    } else if (operation.tags && operation.tags.length > 0) {
      anchorRedoc = `#tag/${operation.tags[0].replace(/ /g, '-')}/paths/${operation.path.replace(/\//g, '~1')}/${operation.method}`;
    } else {
      anchorRedoc = `#/paths/${operation.path.replace(/\//g, '~1')}/${operation.method}`;
    }
    link = link.replace(/\{REDOC\}/g, anchorRedoc);
    let anchorSwagger;
    const tag = (operation.tags || ['default'])[0];
    if (operation.operationId) {
      anchorSwagger = `#operations-${encodeURIComponent(tag)}-${operation.operationId}`;
    } else {
      anchorSwagger = `#operations-${encodeURIComponent(tag)}-${operation.method}${operation.path.replace(/[/{}]/g, '_')}`;
    }
    link = link.replace(/\{SWAGGER\}/g, anchorSwagger);
    result = `  link ${sanitize(resource.name)} "${link}" "Go to Portal for ${resource.name}"\n`;
  } else if (linkSchema && schema) {
    const link = linkSchema.replace(/\{NAME\}/g, schema.name);
    result = `  link ${sanitize(schema.name)} "${link}" "Go to Portal for ${schema.name}"\n`;
  }
  return result;
}

function generateSchema(schema, resource, schemas, generateExtraDetails, linkOperation, linkSchema) {
  let mermaid = '\n';
  mermaid += `  class ${sanitize(schema.name)}{\n`;
  mermaid += `    ${resource ? '<<Resource>>' : '<<Schema>>'}\n`;

  if (schema.properties !== undefined) {
    schema.properties.forEach((property) => {
      mermaid += generateProperty(property, schemas, generateExtraDetails);
    });
  }

  if (resource) {
    mermaid += generateOperations(resource.operations, generateExtraDetails);
  }

  mermaid += '  }';
  mermaid += '\n';

  mermaid += generateRelationShips(schema.relationShips);
  if (resource) {
    mermaid += generateRelationShips(resource.relationShips);
  }
  mermaid += generateParents(schema.name, schema.parents);

  mermaid += generateLink(schema, resource, linkOperation, linkSchema);

  return mermaid;
}

function generateResource(resource, generateExtraDetails, linkOperation) {
  let mermaid = '\n';
  mermaid += `  class ${sanitize(resource.name)}{\n`;
  mermaid += '    <<Resource>>\n';
  mermaid += generateOperations(resource.operations, generateExtraDetails);
  mermaid += '  }';
  mermaid += '\n';

  mermaid += generateRelationShips(resource.relationShips);

  mermaid += generateLink(null, resource, linkOperation, null);

  return mermaid;
}

function generate(schemas, resources, generateExtraDetails, linkOperation, linkSchema) {
  let mermaid = 'classDiagram';
  // eslint-disable-next-line no-restricted-syntax
  for (const [schemaKey, schema] of Object.entries(schemas)) {
    const resourceKey = schemaKey.charAt(0).toUpperCase() + schemaKey.substr(1);
    mermaid += generateSchema(schema, resources[schemaKey] || resources[resourceKey], schemas, generateExtraDetails, linkOperation, linkSchema);
  }

  for (const [resourceKey, resource] of Object.entries(resources)) {
    if (!schemas[resourceKey] && !schemas[resourceKey.toLowerCase()]) {
      mermaid += generateResource(resource, generateExtraDetails, linkOperation);
    }
  }
  return mermaid;
}

module.exports = { generate };

/* eslint-disable guard-for-in */
/* eslint-disable no-restricted-syntax */

/*
  Split the value based on the token and get the value behing the last token
*/
function lastToken(value, token) {
  const xs = value.split(token);
  return xs.length > 1 ? xs.pop() : null;
}

function addValueToArrayIfNotExists(array, value) {
  if (!array.includes(value)) {
    array.push(value);
  }
}
function addValuesOfArrayToOtherArrayIfNotExist(sourceArray, targetArray) {
  for (const sourceArrayIndex in sourceArray) {
    const value = sourceArray[sourceArrayIndex];
    this.addValueToArrayIfNotExists(targetArray, value);
  }
}

/**
 * Merge 2 objects, but only if not already defined in target.
 * @param {*} sourceObject
 * @param {*} targetObject
 */
function mergeObjects(sourceObject, targetObject) {
  if (sourceObject === undefined) return;
  if (targetObject === undefined) throw new Error('targetObject is undefined');

  Object.keys(sourceObject).forEach((attributeName) => {
    if (!Object.keys(targetObject).includes(attributeName)) {
      // eslint-disable-next-line no-param-reassign
      targetObject[attributeName] = sourceObject[attributeName];
    }
  });
}

function processReference(reference, allReferencedFiles, verbose) {
  if (reference) {
    if (verbose) console.log(`***************** found ref :: ${reference}`);

    const referencedFile = reference.match('^.*ya?ml');
    if (referencedFile != null && referencedFile.length === 1 && !allReferencedFiles.includes(referencedFile[0])) {
      if (verbose) console.log(`**************** matched schema $ref [${referencedFile}]`);
      allReferencedFiles.push(referencedFile[0]);
    }
  }
}

function processReferences(references, allReferencedFiles, verbose) {
  if (references && references.length > 0) {
    for (const reference of references) {
      this.processReference(reference, allReferencedFiles, verbose);
    }
  }
}

function resolveFormat(details) {
  let format;
  details.forEach((detail) => {
    if (detail.name === 'format') {
      format = detail.value;
    }
  });
  return format;
}

module.exports = {
  lastToken,
  addValueToArrayIfNotExists,
  addValuesOfArrayToOtherArrayIfNotExist,
  mergeObjects,
  processReference,
  processReferences,
  resolveFormat,
};

import { getPropertyValue } from './util/propertyUtil';


/**
 * Based on conditions, remove properties from the template.
 */
export function applyConditions(element, elementTemplate) {
  const { properties } = elementTemplate;

  const filteredProperties = properties.filter(property => {
    return isConditionMet(element, properties, property);
  });

  return {
    ...elementTemplate,
    properties: filteredProperties
  };
}

export function elementMeetsTemplateConditions(element, elementTemplate) {
  const { properties } = elementTemplate;
  const conditionsNotMet = [];

  properties.forEach(property => {
    if (!isConditionMet(element, properties, property)) {
      conditionsNotMet.push(property);
    }
  });

  // template = {
  //   properties: [
  //     {
  //       id: 'method'
  //       /** GET => 1 condition not met, POST => OK */
  //     },
  //     {
  //       id: 'body',
  //       condition: {
  //         property: 'method',
  //         oneOf: [ 'POST', 'PUT', 'PATCH', 'DELETE' ]
  //     }
  //   ]
  // }

  return !conditionsNotMet.length;
}

function isConditionMet(element, properties, property) {
  const { condition } = property;

  // If no condition is defined, return true.
  if (!condition) {
    return true;
  }

  return isSimpleConditionMet(element, properties, condition);
}

function isSimpleConditionMet(element, properties, condition) {
  const { property, equals, oneOf } = condition;

  const propertyValue = getValue(element, properties, property);

  if (equals) {
    return propertyValue === equals;
  }

  if (oneOf) {
    return oneOf.includes(propertyValue);
  }

  return false;
}

function getValue(element, properties, propertyId) {
  const property = properties.find(p => p.id === propertyId);

  if (!property) {
    return;
  }

  return getPropertyValue(element, property);
}
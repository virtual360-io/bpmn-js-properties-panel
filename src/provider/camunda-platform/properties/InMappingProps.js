import {
  filter
} from 'min-dash';

import {
  getBusinessObject,
  is
} from 'bpmn-js-8/lib/util/ModelUtil';

import {
  isAny
} from 'bpmn-js-8/lib/features/modeling/util/ModelingUtil';

import {
  getSignalEventDefinition
} from '../../bpmn/utils/EventDefinitionUtil';

import {
  getExtensionElementsList
} from '../utils/ExtensionElementsUtil';

import {
  createElement
} from '../../../utils/ElementUtil';

import InOutMapping from './InOutMapping';

/**
 * Cf. https://docs.camunda.org/manual/latest/reference/bpmn20/custom-extensions/extension-elements/#in
 */
export function InMappingProps({ element, injector }) {
  if (!areInMappingsSupported(element)) {
    return null;
  }

  const variableMappings = getInMappings(element) || [];

  const bpmnFactory = injector.get('bpmnFactory'),
        commandStack = injector.get('commandStack');

  const items = variableMappings.map((mapping, index) => {
    const id = element.id + '-inMapping-' + index;

    return {
      id,
      label: mapping.get('target') || '',
      entries: InOutMapping({
        idPrefix: id,
        element,
        mapping
      }),
      autoFocusEntry: id + '-target',
      remove: removeFactory({ commandStack, element, mapping })
    };
  });

  return {
    items,
    add: addFactory({ bpmnFactory, commandStack, element })
  };
}

function removeFactory({ commandStack, element, mapping }) {
  return function(event) {
    event.stopPropagation();

    const businessObject = getSignalEventDefinition(element) || getBusinessObject(element);
    const extensionElements = businessObject.get('extensionElements');

    commandStack.execute('properties-panel.update-businessobject-list', {
      element: element,
      currentObject: extensionElements,
      propertyName: 'values',
      objectsToRemove: [ mapping ]
    });
  };
}

function addFactory({ bpmnFactory, commandStack, element }) {
  return function(event) {

    event.stopPropagation();

    let commands = [];

    const businessObject = getSignalEventDefinition(element) || getBusinessObject(element);

    let extensionElements = businessObject.get('extensionElements');

    // (1) ensure extension elements
    if (!extensionElements) {
      extensionElements = createElement(
        'bpmn:ExtensionElements',
        { values: [] },
        businessObject,
        bpmnFactory
      );

      commands.push({
        cmd: 'properties-panel.update-businessobject',
        context: {
          element: element,
          businessObject: businessObject,
          properties: { extensionElements }
        }
      });
    }

    // (2) create in mapping
    const newMapping = createElement('camunda:In', {
      source: '', // source is the default type
    }, extensionElements, bpmnFactory);

    // (3) add mapping to list
    commands.push({
      cmd: 'properties-panel.update-businessobject-list',
      context: {
        element: element,
        currentObject: extensionElements,
        propertyName: 'values',
        objectsToAdd: [ newMapping ]
      }
    });

    // (4) commit all updates
    commandStack.execute('properties-panel.multi-command-executor', commands);
  };
}

// helper ///////////////

function getInMappings(element) {
  const businessObject = getBusinessObject(element);
  const signalEventDefinition = getSignalEventDefinition(businessObject);
  const mappings = getExtensionElementsList(signalEventDefinition || businessObject, 'camunda:In');

  // only retrieve relevant mappings here, others are handled in other groups
  // mapping.businessKey => camunda-platform/CallAvtivityProps
  // mapping.variables => camunda-platform/InMappingPropagationProps
  return filter(mappings, function(mapping) {
    return !mapping.businessKey && !(mapping.variables && mapping.variables === 'all');
  });
}

function areInMappingsSupported(element) {
  const signalEventDefinition = getSignalEventDefinition(element);

  if (signalEventDefinition) {
    return isAny(element, [
      'bpmn:IntermediateThrowEvent',
      'bpmn:EndEvent'
    ]);
  }

  return is(element, 'bpmn:CallActivity');
}

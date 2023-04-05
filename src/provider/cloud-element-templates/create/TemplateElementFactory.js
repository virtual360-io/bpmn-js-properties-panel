import {
  getBusinessObject
} from 'bpmn-js/lib/util/ModelUtil';

import PropertyBindingProvider from './PropertyBindingProvider';
import TaskDefinitionTypeBindingProvider from './TaskDefinitionTypeBindingProvider';
import InputBindingProvider from './InputBindingProvider';
import OutputBindingProvider from './OutputBindingProvider';
import TaskHeaderBindingProvider from './TaskHeaderBindingProvider';
import ZeebePropertiesProvider from './ZeebePropertiesProvider';
import { MessagePropertyBindingProvider } from './MessagePropertyBindingProvider';
import { MessageZeebeSubscriptionBindingProvider } from './MessageZeebeSubscriptionBindingProvider';

import {
  MESSAGE_PROPERTY_TYPE,
  MESSAGE_ZEEBE_SUBSCRIPTION_PROPERTY_TYPE,
  PROPERTY_TYPE,
  ZEEBE_TASK_DEFINITION_TYPE_TYPE,
  ZEBBE_INPUT_TYPE,
  ZEEBE_OUTPUT_TYPE,
  ZEEBE_TASK_HEADER_TYPE,
  ZEBBE_PROPERTY_TYPE
} from '../util/bindingTypes';

import { applyConditions } from '../Condition';

export default class TemplateElementFactory {

  constructor(bpmnFactory, elementFactory) {
    this._bpmnFactory = bpmnFactory;
    this._elementFactory = elementFactory;

    this._providers = {
      [PROPERTY_TYPE]: PropertyBindingProvider,
      [ZEEBE_TASK_DEFINITION_TYPE_TYPE]: TaskDefinitionTypeBindingProvider,
      [ZEBBE_PROPERTY_TYPE]: ZeebePropertiesProvider,
      [ZEBBE_INPUT_TYPE]: InputBindingProvider,
      [ZEEBE_OUTPUT_TYPE]: OutputBindingProvider,
      [ZEEBE_TASK_HEADER_TYPE]: TaskHeaderBindingProvider,
      [MESSAGE_PROPERTY_TYPE]: MessagePropertyBindingProvider,
      [MESSAGE_ZEEBE_SUBSCRIPTION_PROPERTY_TYPE]: MessageZeebeSubscriptionBindingProvider
    };
  }

  /**
   * Create an element based on an element template.
   *
   * @param {ElementTemplate} template
   * @returns {djs.model.Base}
   */
  create(template) {

    const bpmnFactory = this._bpmnFactory;
    const providers = this._providers;

    // (1) base shape
    const element = this._createShape(template);

    // (2) apply template
    this._setModelerTemplate(element, template);

    // (3) apply icon
    if (hasIcon(template)) {
      this._setModelerTemplateIcon(element, template);
    }

    const { properties } = applyConditions(element, template);

    // (4) apply properties
    properties.forEach(function(property) {

      const {
        binding
      } = property;

      const {
        type: bindingType
      } = binding;

      const bindingProvider = providers[bindingType];

      bindingProvider.create(element, {
        property,
        bpmnFactory,
        template
      });
    });

    return element;
  }

  _createShape(template) {
    const {
      appliesTo,
      elementType = {}
    } = template;
    const elementFactory = this._elementFactory;

    const attrs = {
      type: elementType.value || appliesTo[0]
    };

    // apply eventDefinition
    if (elementType.eventDefinition) {
      attrs.eventDefinitionType = elementType.eventDefinition;
    }

    const element = elementFactory.createShape(attrs);

    return element;
  }

  _setModelerTemplate(element, template) {
    const {
      id,
      version
    } = template;

    const businessObject = getBusinessObject(element);

    businessObject.set('zeebe:modelerTemplate', id);
    businessObject.set('zeebe:modelerTemplateVersion', version);
  }

  _setModelerTemplateIcon(element, template) {
    const {
      icon
    } = template;

    const {
      contents
    } = icon;

    const businessObject = getBusinessObject(element);

    businessObject.set('zeebe:modelerTemplateIcon', contents);
  }
}

TemplateElementFactory.$inject = [ 'bpmnFactory', 'elementFactory' ];


// helper ////////////////

function hasIcon(template) {
  const {
    icon
  } = template;

  return !!(icon && icon.contents);
}
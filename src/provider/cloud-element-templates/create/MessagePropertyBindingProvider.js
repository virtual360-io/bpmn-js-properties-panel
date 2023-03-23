import { getBusinessObject, is } from 'bpmn-js/lib/util/ModelUtil';

import { createElement } from '../../../utils/ElementUtil';

export class MessagePropertyBindingProvider {
  static create(element, options) {
    const {
      bpmnFactory,
      property
    } = options;

    const {
      binding,
      value
    } = property;

    const {
      name
    } = binding;

    let businessObject = getBusinessObject(element);

    if (is(businessObject, 'bpmn:Event')) {
      businessObject = businessObject.get('eventDefinitions')[0];
    }

    let message = businessObject.get('messageRef');

    if (!message) {
      message = createElement('bpmn:Message', {}, businessObject, bpmnFactory);
      businessObject.set('messageRef', message);
    }

    message.set(name, value);
  }
}

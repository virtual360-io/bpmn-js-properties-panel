import TestContainer from 'mocha-test-container-support';

import {
  bootstrapModeler,
  inject
} from 'test/TestHelper';

import { find } from 'min-dash';

import {
  getBusinessObject
} from 'bpmn-js/lib/util/ModelUtil';

import coreModule from 'bpmn-js/lib/core';
import elementTemplatesModule from 'src/provider/cloud-element-templates';
import modelingModule from 'bpmn-js/lib/features/modeling';

import zeebeModdlePackage from 'zeebe-bpmn-moddle/resources/zeebe';

import {
  findExtension,
  findInputParameter,
  findMessage,
  findOutputParameter,
  findTaskHeader,
  findZeebeProperty,
  findZeebeSubscription
} from 'src/provider/cloud-element-templates/Helper';

import diagramXML from '../fixtures/simple.bpmn';

import templates from './TemplatesElementFactory.json';


describe('provider/cloud-element-templates - TemplateElementFactory', function() {

  let container;

  beforeEach(function() {
    container = TestContainer.get(this);
  });

  beforeEach(bootstrapModeler(diagramXML, {
    container: container,
    modules: [
      coreModule,
      elementTemplatesModule,
      modelingModule,
      {
        propertiesPanel: [ 'value', { registerProvider() {} } ]
      }
    ],
    moddleExtensions: {
      zeebe: zeebeModdlePackage
    }
  }));


  it('should create element', inject(function(templateElementFactory) {

    // given
    const elementTemplate = findTemplate('example.camunda.ServiceWorker');

    // when
    const element = templateElementFactory.create(elementTemplate);

    const extensionElements = getBusinessObject(element).get('extensionElements');

    // then
    expect(element).to.exist;
    expect(extensionElements).to.exist;
    expect(extensionElements.get('values')).to.have.length(3);
  }));


  it('should set type (appliesTo)', inject(function(templateElementFactory) {

    // given
    const elementTemplate = findTemplate('example.camunda.MultipleTypes');

    // when
    const element = templateElementFactory.create(elementTemplate);

    // then
    expect(element.type).to.equal('bpmn:ServiceTask');
  }));


  it('should set type (elementType)', inject(function(templateElementFactory) {

    // given
    const elementTemplate = findTemplate('example.camunda.ElementType');

    // when
    const element = templateElementFactory.create(elementTemplate);

    // then
    expect(element.type).to.equal('bpmn:ServiceTask');
  }));


  it('should apply <modelerTemplate> and <modelerTemplateVersion>', inject(function(templateElementFactory) {

    // given
    const elementTemplate = findTemplate('example.camunda.ServiceWorker');

    // when
    const element = templateElementFactory.create(elementTemplate);

    const businessObject = getBusinessObject(element);

    // then
    expect(businessObject.get('zeebe:modelerTemplate')).to.equal('example.camunda.ServiceWorker');
    expect(businessObject.get('zeebe:modelerTemplateVersion')).to.equal(1);
  }));


  it('should apply <modelerTemplateIcon>', inject(function(templateElementFactory) {

    // given
    const elementTemplate = findTemplate('example.camunda.IconTemplate');

    // when
    const element = templateElementFactory.create(elementTemplate);

    const icon = getBusinessObject(element).get('zeebe:modelerTemplateIcon');

    // then
    expect(icon).to.exist;
    expect(icon).to.equal("data:image/svg+xml,%3Csvg width='24' height='24'%3C/svg%3E");
  }));


  it('should apply <modelerTemplate> on templated message (bpmn:Message#property)',
    inject(function(templateElementFactory) {

      // given
      const elementTemplate = findTemplate('example.camunda.MessageTemplate');

      // when
      const element = templateElementFactory.create(elementTemplate);

      const businessObject = getBusinessObject(element);
      const message = findMessage(businessObject);

      // then
      expect(message.get('zeebe:modelerTemplate')).to.equal('example.camunda.MessageTemplate');
    })
  );


  it('should apply <modelerTemplate> on templated message (bpmn:Message#zeebe:subscription#property',
    inject(function(templateElementFactory) {

      // given
      const elementTemplate = findTemplate('example.camunda.SubscriptionMessageTemplate');

      // when
      const element = templateElementFactory.create(elementTemplate);

      const businessObject = getBusinessObject(element);
      const message = findMessage(businessObject);

      // then
      expect(message.get('zeebe:modelerTemplate')).to.equal('example.camunda.SubscriptionMessageTemplate');
    })
  );


  describe('providers', function() {


    it('should NOT create extension elements - not needed', inject(function(templateElementFactory) {

      // given
      const elementTemplate = findTemplate('example.camunda.PropertyBinding');

      // when
      const element = templateElementFactory.create(elementTemplate);

      const businessObject = getBusinessObject(element);

      // then
      expect(businessObject.get('extensionElements')).to.not.exist;
    }));


    it('should handle <property>', inject(function(templateElementFactory) {

      // given
      const elementTemplate = findTemplate('example.camunda.PropertyBinding');

      // when
      const element = templateElementFactory.create(elementTemplate);

      const businessObject = getBusinessObject(element);

      // then
      expect(businessObject.get('name')).to.equal('name');
    }));


    it('should handle <zeebe:property>', inject(function(templateElementFactory) {

      // given
      const elementTemplate = findTemplate('example.camunda.ZeebePropertyBinding');

      // when
      const element = templateElementFactory.create(elementTemplate);

      const zeebeProperties = findExtension(element, 'zeebe:Properties');
      const properties = zeebeProperties.properties;

      // then
      expect(properties).to.exist;
      expect(properties).to.jsonEqual([
        {
          $type: 'zeebe:Property',
          name: 'customPropertyName',
          value: 'propertyValue'
        }
      ]);
    }));


    it('should handle <zeebe:taskDefinition:type>', inject(function(templateElementFactory) {

      // given
      const elementTemplate = findTemplate('example.camunda.TaskDefinitionTypeBinding');

      // when
      const element = templateElementFactory.create(elementTemplate);

      const taskDefinition = findExtension(element, 'zeebe:TaskDefinition');

      // then
      expect(taskDefinition).to.exist;
      expect(taskDefinition.get('type')).to.equal('job-type');
    }));


    it('should handle <zeebe:input>', inject(function(templateElementFactory) {

      // given
      const elementTemplate = findTemplate('example.camunda.InputBinding');

      // when
      const element = templateElementFactory.create(elementTemplate);

      const ioMapping = findExtension(element, 'zeebe:IoMapping');
      const inputParameters = ioMapping.get('inputParameters');

      // then
      expect(inputParameters).to.exist;
      expect(inputParameters).to.jsonEqual([
        {
          $type: 'zeebe:Input',
          source: 'input-1-value',
          target: 'input-1'
        },
        {
          $type: 'zeebe:Input',
          source: 'input-2-value',
          target: 'input-2'
        },
        {
          $type: 'zeebe:Input',
          source: 'input-3-value',
          target: 'input-3'
        }
      ]);
    }));


    it('should handle <zeebe:output>', inject(function(templateElementFactory) {

      // given
      const elementTemplate = findTemplate('example.camunda.OutputBinding');

      // when
      const element = templateElementFactory.create(elementTemplate);

      const ioMapping = findExtension(element, 'zeebe:IoMapping');
      const outputParameters = ioMapping.get('outputParameters');

      // then
      expect(outputParameters).to.exist;
      expect(outputParameters).to.jsonEqual([
        {
          $type: 'zeebe:Output',
          source: 'output-1',
          target: 'output-1-value'
        },
        {
          $type: 'zeebe:Output',
          source: 'output-2',
          target: 'output-2-value'
        },
        {
          $type: 'zeebe:Output',
          source: 'output-3',
          target: 'output-3-value'
        }
      ]);
    }));


    it('should NOT create optional inputs and outputs', inject(function(templateElementFactory) {

      // given
      const elementTemplate = findTemplate('example.camunda.OptionalInputOutput');

      // when
      const element = templateElementFactory.create(elementTemplate);

      const ioMapping = findExtension(element, 'zeebe:IoMapping');
      const inputParameters = ioMapping.get('inputParameters');
      const outputParameters = ioMapping.get('outputParameters');

      // then
      expect(inputParameters).to.exist;
      expect(inputParameters).to.jsonEqual([
        {
          $type: 'zeebe:Input',
          source: 'input-2-value',
          target: 'input-2'
        }
      ]);

      expect(outputParameters).to.exist;
      expect(outputParameters).to.jsonEqual([
        {
          $type: 'zeebe:Output',
          source: 'output-1',
          target: 'output-1-value'
        }
      ]);
    }));



    it('should handle <zeebe:taskHeader>', inject(function(templateElementFactory) {

      // given
      const elementTemplate = findTemplate('example.camunda.TaskHeaderBinding');

      // when
      const element = templateElementFactory.create(elementTemplate);

      const taskHeaders = findExtension(element, 'zeebe:TaskHeaders');
      const headers = taskHeaders.get('values');

      // then
      expect(headers).to.exist;
      expect(headers).to.jsonEqual([
        {
          $type: 'zeebe:Header',
          key: 'header-1',
          value: 'header-1-value'
        },
        {
          $type: 'zeebe:Header',
          key: 'header-2',
          value: 'header-2-value'
        },
        {
          $type: 'zeebe:Header',
          key: 'header-3',
          value: 'header-3-value'
        }
      ]);
    }));


    it('should handle <bpmn:Message#property>', inject(function(templateElementFactory) {

      // given
      const elementTemplate = findTemplate('example.camunda.MessageTemplate');

      // when
      const element = templateElementFactory.create(elementTemplate);
      const bo = getBusinessObject(element);

      const eventDefinition = bo.get('eventDefinitions')[0];
      const message = eventDefinition.get('messageRef');

      // then
      expect(message).to.exist;
      expect(message).to.have.property('name', 'hard-coded');
    }));


    it('should handle <bpmn:Message#zeebe:subscription>', inject(function(templateElementFactory) {

      // given
      const elementTemplate = findTemplate('example.camunda.SubscriptionMessageTemplate');

      // when
      const element = templateElementFactory.create(elementTemplate);
      const bo = getBusinessObject(element);

      const eventDefinition = bo.get('eventDefinitions')[0];
      const message = eventDefinition.get('messageRef');
      const subscription = findExtension(message, 'zeebe:Subscription');

      // then
      expect(subscription).to.exist;
      expect(subscription).to.jsonEqual({
        $type: 'zeebe:Subscription',
        correlationKey: '=variable'
      });
    }));
  });


  describe('generated value', function() {


    it('should apply generated values on task (uuid)', inject(function(templateElementFactory) {

      // given
      const uuidRegex = /^[\w\d]{8}(-[\w\d]{4}){3}-[\w\d]{12}$/;
      const elementTemplate = findTemplate('generatedTask');

      // when
      const element = templateElementFactory.create(elementTemplate);

      // then
      const bo = getBusinessObject(element);
      expect(bo.get('name')).to.match(uuidRegex, 'name is not a uuid');

      const zeebeProperties = findExtension(bo, 'zeebe:Properties');
      const property = findZeebeProperty(zeebeProperties, { name: 'property' });
      expect(property.get('value')).to.match(uuidRegex, 'zeebe property is not a uuid');

      const ioMapping = findExtension(bo, 'zeebe:IoMapping');
      const input = findInputParameter(ioMapping, { name: 'input' });
      expect(input.get('source')).to.match(uuidRegex, 'input parameter is not a uuid');

      const output = findOutputParameter(ioMapping, { source: 'source' });
      expect(output.get('target')).to.match(uuidRegex, 'output parameter is not a uuid');

      const taskHeaders = findExtension(bo, 'zeebe:TaskHeaders');
      const taskHeader = findTaskHeader(taskHeaders, { key: 'header' });
      expect(taskHeader.get('value')).to.match(uuidRegex, 'task header is not a uuid');

      const taskDefinition = findExtension(bo, 'zeebe:TaskDefinition');
      expect(taskDefinition.get('type')).to.match(uuidRegex, 'task definition type is not a uuid');
    }));


    it('should apply generated values on message (uuid)', inject(function(templateElementFactory) {

      // given
      const uuidRegex = /^[\w\d]{8}(-[\w\d]{4}){3}-[\w\d]{12}$/;
      const elementTemplate = findTemplate('generatedEvent');

      // when
      const element = templateElementFactory.create(elementTemplate);

      // then
      const bo = getBusinessObject(element);

      const message = findMessage(bo);
      expect(message.get('name')).to.match(uuidRegex, 'message name is not a uuid');

      const subscription = findZeebeSubscription(message);
      expect(subscription.get('correlationKey')).to.match(uuidRegex, 'correlation key is not a uuid');
    }));
  });

});


// helper ////////////////

function findTemplate(id) {
  return find(templates, t => t.id === id);
}
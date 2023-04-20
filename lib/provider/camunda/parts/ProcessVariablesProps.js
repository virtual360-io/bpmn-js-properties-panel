'use strict';

var isAny = require('bpmn-js-8/lib/features/modeling/util/ModelingUtil').isAny,
    is = require('bpmn-js-8/lib/util/ModelUtil').is,
    getBusinessObject = require('bpmn-js-8/lib/util/ModelUtil').getBusinessObject;

var processVariables = require('./implementation/ProcessVariables');

module.exports = function(group, element, translate) {
  if (canHaveOverview(element)) {
    var processVariablesEntries = processVariables(element, translate);

    group.entries = group.entries.concat(processVariablesEntries);
  }
};


// helpers //////////

function canHaveOverview(element) {
  var businessObject = getBusinessObject(element);

  return (
    isAny(element, ['bpmn:Process', 'bpmn:SubProcess']) ||
    (is(element, 'bpmn:Participant') && businessObject.get('processRef'))
  );
}

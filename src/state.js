import _ from 'lodash';
import { Handlers } from 'js-util';


var state = {
  namespaces: [],
  currentSuite: null,
  currentSection: null,
  suites: {},
  onlySuites: {},
  skippedSuites: {},
  skippedSpecs: {},
  onSuiteCreatedHandlers: new Handlers(),

  reset() {
    state.namespaces = [];
    state.currentSuite = null;
    state.currentSection = null;
    state.onSuiteCreatedHandlers = new Handlers();

    resetObject(state.suites);
    resetObject(state.onlySuites);
    resetObject(state.skippedSuites);
    resetObject(state.skippedSpecs);
  }
};



var resetObject = (obj) => {
  _.keys(obj).forEach((key) => delete obj[key]);
};



export default state;

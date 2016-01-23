import Handlers from 'js-util/lib/Handlers';
const resetObject = (obj) => Object.keys(obj).forEach((key) => delete obj[key]);


const state = {
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
  },
};


export default state;

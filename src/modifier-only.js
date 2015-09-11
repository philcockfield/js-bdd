import state from "./state";


export const describeOnly = (suite) => {
  suite.isOnly = true;
  state.onlySuites[suite.id] = suite;
};


export const itOnly = (spec) => {
  spec.isOnly = true;
  state.onlySuites[spec.parentSuite.id] = spec.parentSuite;
};

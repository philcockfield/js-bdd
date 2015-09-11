import _ from "lodash";
import state from "./state";

const markSpecAsSkipped = (spec) => {
  var parentSuite = spec.parentSuite;
  spec.isSkipped = true;
  state.skippedSpecs[spec.id] = spec;
  state.skippedSuites[parentSuite.id] = parentSuite;
  if (!_.includes(parentSuite.skippedSpecs, spec)) {
    parentSuite.skippedSpecs.push(spec);
  }
  return spec;
};


const markSuiteAsSkipped = (suite) => {
  suite.isSkipped = true;
  state.skippedSuites[suite.id] = suite;
  suite.specs.forEach((item) => markSpecAsSkipped(item));
  suite.childSuites.forEach((item) => markSuiteAsSkipped(item)); // <== RECURSION.
  return suite;
};




export const describeSkip = (suite) => { markSuiteAsSkipped(suite); };
export const itSkip = (spec) => { markSpecAsSkipped(spec); };

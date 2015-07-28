import _ from "lodash";
import state from "./state";
import * as localUtil from "./util";


const markSuiteAsSkipped = (suite) => {
  suite.isSkipped = true;
  state.skippedSuites[suite.id] = suite;
  suite.specs.forEach((item) => markSpecAsSkipped(item));
  suite.childSuites.forEach((item) => markSuiteAsSkipped(item)); // <== RECURSION.
  return suite;
};



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






export const describeSkip = (describe) => {
  return (name, func) => {
      let result = describe(name, func);
      let suite;

      // Check whether a nested hierarchy was specified
      // and if so update the state on the lowest descendent.
      if (name && name.indexOf("::") < 0) {
        suite = result;
      } else {
        suite = state.suites[localUtil.formatId(name)];
      }

      // Store state.
      markSuiteAsSkipped(suite);
      return result;

  };
};


export const itSkip = (it) => {
  return (name, func) => {
      let spec = it(name, func);
      markSpecAsSkipped(spec);
      return spec;
  };
};

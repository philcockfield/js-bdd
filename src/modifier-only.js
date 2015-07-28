import state from "./state";
import * as localUtil from "./util";



export const describeOnly = (describe) => {
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
      suite.isOnly = true;
      state.onlySuites[suite.id] = suite;
      return result;
  };
};



export const itOnly = (it) => {
  return (name, func) => {
      let result = it(name, func);
      result.isOnly = true;
      state.onlySuites[result.parentSuite.id] = result.parentSuite;
      return result;
  };
};

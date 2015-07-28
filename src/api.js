/* global global window */
/* eslint no-use-before-define:0 */

import _ from "lodash";
import * as util from "js-util";
import * as localUtil from "./util";
import state from "./state";
import suiteImport from "./suite";
import specImport from "./spec";
import sectionImport from "./section";
import { describeOnly, itOnly } from "./modifier-only";
import { describeSkip, itSkip } from "./modifier-skip";

const suiteModule = suiteImport(state);
const specModule = specImport(state);
const sectionModule = sectionImport(state);



const namespaceMethod = function(namespace, invokeWithin) {
  var self = (this === api) ? (global || window) : this;

  // Format and store the namespace.
  if (util.isBlank(namespace)) { namespace = null; }
  if (namespace === null) {
    state.namespaces = [];
  } else {
    namespace = _.trim(namespace);
    namespace = _.trim(namespace, ":");
    state.namespaces.push(namespace);
  }

  // Invoke the scoped function if specified.
  if (_.isFunction(invokeWithin)) {
    invokeWithin.call(self);
    namespaceMethod.pop();
  }

  // Finish up.
  return api;
};
namespaceMethod.pop = () => state.namespaces.pop();



// ----------------------------------------------------------------------------


const api = {
  /*
  The filtered set of suites (after .only and .skip have been evalutated).
  @returns array.
  */
  suites() {
    var suites = _.isEmpty(state.onlySuites) ? state.suites : state.onlySuites;
    var result = [];
    _.keys(suites).forEach((key) => {
          let suite = suites[key];
          if (!suite.isSkipped) { result.push(suite); }
        });
    return _.uniq(result);
  },


  /*
  An object containing the set of all suites.
  */
  allSuites: state.suites,


  /*
  An object containing the set of suites marked with `.only`
  */
  onlySuites: state.onlySuites,


  /*
  An object containing the set of skipped suites.
  */
  skippedSuites: state.skippedSuites,


  /*
  An object containing the set of skipped specs.
  */
  skippedSpecs: state.skippedSpecs,


  /*
  Registers a namespace within which to place suites ("describe").

  @param namespace:     The namespace.
                        Use "::" notation for nesting.
                        Pass null to reset.

  @param invokeWithin:  Optional. A function to invoke that registers Suites to be
                        declared within the namespace.  If specified the namespace
                        is reset after invoking.
  */
  namespace: namespaceMethod,


  /*
  Clears all stored state.
  */
  reset() {
    state.reset();
    this.contextFactory = () => (global || window);
  },


  /*
  A factory function used to generate the [this] context for "describe" blocks.
  @returns type: String representing the type
                  - "suite"
                  - "spec"
                  - "section" etc
  @returns object.
  */
  contextFactory() { return (global || window); },


  /*
  Registers a callback to invoke when a new suite is created.
  @param func: The callback function to register.
  */
  onSuiteCreated(func) { state.onSuiteCreatedHandlers.push(func); },


  /*
  Declares a Suite ("describe").
  @param name: The name of the suite.
  @param func: The describe block.
  */
  describe(name, func) {
    var self = api.contextFactory("suite");

    // Prepend the namespace for root suites (if there is one).
    var isRoot = !state.currentSuite;
    if (state.namespaces.length > 0 && isRoot) {
      var namespace = state.namespaces.join("::");
      name = `${ namespace }::${ name }`;
    }

    // Register the suite.
    return suiteModule.describe(self, name, func);
  },


  /*
  Invoked at the beginning of a suite"s execution.
  */
  before(func) { return suiteModule.before(func); },


  /*
  Registers a section to place child elements
  (suites, specs) within.
  @param name: The name of the section.
  @param func: The function that when invoked containes the child elements.
  @returns the section object.
  */
  section(name, func) {
    var suite = state.currentSuite;
    var self = api.contextFactory("section");
    return sectionModule.create(self, suite, name, func);
  },


  /*
  Declares a single spec/test.

  @param name: The name/description of the spec.
  @param func:  The function.
                A function with no parameters is considered synchronous.
                A function with a parameter is considered an async callback, eg:

                    (done) -> // Callback.

  @returns the Spec model.
  */
  it(name, func) { return specModule.it(name, func); }
};


// Modifiers -------------------------------------------------------------------


/**
 * The `.only` modifer that narrows the scope of Suites.
 *
 *    This is cumulative, meaning that all Suites/Specs declared
 *    as `.only` will be included in the set.
 *
 */
api.describe.only = describeOnly(api.describe);
api.it.only = itOnly(api.it);


/**
 * The `.skip` modifer that excludes the suites/specs.
 */
api.describe.skip = describeSkip(api.describe);
api.it.skip = itSkip(api.it);



// EXPORT ----------------------------------------------------------------------------
api.reset();
export default api;

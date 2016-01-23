/* global global window */
/* eslint no-use-before-define:0 */

import R from 'ramda';
import { isBlank } from 'js-util';
import state from './state';
import suiteImport from './suite';
import specImport from './spec';
import sectionImport from './section';
import * as localUtil from './util';
import { describeOnly, itOnly } from './modifier-only';
import { describeSkip, itSkip } from './modifier-skip';

const suiteModule = suiteImport(state);
const specModule = specImport(state);
const sectionModule = sectionImport(state);


const namespaceMethod = (namespace, invokeWithin) => {
  const self = (this === api) ? (global || window) : this;

  // Format and store the namespace.
  if (isBlank(namespace)) { namespace = null; }
  if (namespace === null) {
    state.namespaces = [];
  } else {
    namespace = namespace
                    .trim()
                    .replace(/^:+/, '')
                    .replace(/:+$/, '');
    state.namespaces.push(namespace);
  }

  // Invoke the scoped function if specified.
  if (R.is(Function, invokeWithin)) {
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
    const suites = Object.keys(state.onlySuites).length === 0 ? state.suites : state.onlySuites;
    const result = [];
    Object.keys(suites).forEach((key) => {
      const suite = suites[key];
      if (!suite.isSkipped) { result.push(suite); }
    });
    return R.uniq(result);
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
  Registers a namespace within which to place suites ('describe').

  @param namespace:     The namespace.
                        Use '::' notation for nesting.
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
  A factory function used to generate the [this] context for 'describe' blocks.
  @returns type: String representing the type
                  - 'suite'
                  - 'spec'
                  - 'section' etc
  @returns object.
  */
  contextFactory() { return (global || window); },


  /*
  Registers a callback to invoke when a new suite is created.
  @param func: The callback function to register.
  */
  onSuiteCreated(func) { state.onSuiteCreatedHandlers.push(func); },


  /*
  Declares a Suite ('describe').
  @param name: The name of the suite.
  @param func: The describe block.
  */
  describe(name, func) {
    const self = api.contextFactory('suite');

    // Prepend the namespace for root suites (if there is one).
    const isRoot = !state.currentSuite;
    if (state.namespaces.length > 0 && isRoot) {
      const namespace = state.namespaces.join('::');
      name = `${ namespace }::${ name }`;
    }

    // Register the suite.
    return suiteModule.describe(self, name, func);
  },


  /*
  Invoked at the beginning of a suite's execution.
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
    const suite = state.currentSuite;
    const self = api.contextFactory('section');

    // Store the suite on the [this] object
    // as long as it's not the [global] namespace.
    if (self !== (global || window)) { self.suite = state.currentSuite; }

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
  it(name, func) { return specModule.it(name, func); },



  extend: {
    /**
     * Adds an extension to the 'describe' statement.
     * @param {string} extension:         The name of the extension to apply (eg. 'only' or 'skip').
     * @param {function} handler(suite):  The function that is invoked upon upon creation.
     */
    describe(extension, handler) {
      if (!R.is(String, extension)) {
        throw new Error(`A 'describe/suite' extension name must be provided.`);
      }
      if (!R.is(Function, handler)) {
        throw new Error(`A 'describe.${ extension }' extension handler must be provided.`);
      }
      if (api.describe[extension]) {
        throw new Error(`A 'describe' (suite) extension named '${ extension }' already exists.`);
      }

      api.describe[extension] = (name, func) => {
        const result = api.describe(name, func);

        // Check whether a nested hierarchy was specified
        // and if so update retrieve the lowest descendent.
        let suite;
        suite = (name && name.indexOf('::') < 0)
              ? result
              : state.suites[localUtil.formatId(name)];

        // Pass the suite to the handler.
        handler(suite);
        return result;
      };
    },


    /**
     * Adds an extension to the 'it' statement.
     * @param {string} extension:         The name of the extension to apply (eg. 'only' or 'skip').
     * @param {function} handler(suite):  The function that is invoked upon upon creation.
     */
    it(extension, handler) {
      if (!R.is(String, extension)) {
        throw new Error(`An 'it/spec' extension name must be provided.`);
      }
      if (!R.is(Function, handler)) {
        throw new Error(`An 'it.${ extension }' extension handler must be provided.`);
      }
      if (api.it[extension]) {
        throw new Error(`An 'it' (spec) extension named '${ extension }' already exists.`);
      }
      api.it[extension] = (name, func) => {
        const spec = api.it(name, func);
        handler(spec);
        return spec;
      };
    },
  },
};


// Modifiers -------------------------------------------------------------------


/**
 * The `.only` modifer that narrows the scope of Suites.
 *
 *    This is cumulative, meaning that all Suites/Specs declared
 *    as `.only` will be included in the set.
 *
 */
api.extend.describe('only', describeOnly);
api.extend.it('only', itOnly);



/**
 * The `.skip` modifer that excludes the suites/specs.
 */
api.extend.describe('skip', describeSkip);
api.extend.it('skip', itSkip);




// EXPORT ----------------------------------------------------------------------------
api.reset();
export default api;

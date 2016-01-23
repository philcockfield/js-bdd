/* eslint consistent-return:0 */

import R from 'ramda';
import { isBlank, functionParameters } from 'js-util';
import * as localUtil from './util';


const invokerFunction = (suite, handlers) => (context, ...args) => {
  handlers.forEach((func) => {
    if (R.is(Function, func)) { func.apply(context, args); }
  });
};


const isFuzzyMatch = (text, pattern) => {
  pattern = pattern.toUpperCase();
  text = text.toUpperCase();
  if (pattern === text) { return true; }

  let index = -1; // Remembers the position of last found character.

  // Consider each pattern character one at a time.
  for (const i in pattern) {
    if ({}.hasOwnProperty.call(pattern, i)) {
      const char = pattern[i];
      if (char === ' ') { continue; } // Ignore spaces.
      index = text.indexOf(char, index + 1);
      if (index === -1) { return false; }
    }
  }

  // Matched.
  return true;
};



const filterSuite = (suite, pattern, options = {}) => {
  if (isBlank(pattern)) { return; }
  pattern = pattern.trim();

  // Clone the suite.
  suite = R.clone(suite);
  suite.childSuites = R.clone(suite.childSuites);

  // Check if the suite is a match.
  if (isFuzzyMatch(suite.name, pattern)) { return suite; }

  // Check for matches on child suites.
  const childSuites = suite.childSuites;
  suite.childSuites = [];

  let isChildMatched = false;
  childSuites.forEach((childSuite) => {
    const childMatched = filterSuite(childSuite, pattern, options);
    if (childMatched) {
      isChildMatched = true;
      suite.childSuites.push(childSuite);
    }
  });

  // Finish up.
  return isChildMatched ? suite : undefined;
};


const walkSuite = (suite, func) => {
  if (suite.isSkipped) { return; }
  func.call(suite.meta.thisContext, suite);
  suite.childSuites.forEach((childSuite) => walkSuite(childSuite, func)); // <== RECURSION.
};



// ----------------------------------------------------------------------------


export default function (state) {
  const createSuite = (self, name, func) => {
    // Setup initial conditions.
    const parent = state.currentSuite;

    // Build the unique ID.
    let id = name;
    if (parent) { id = `${ parent.id }::${ id }`; }
    id = localUtil.formatId(id);

    // Check if the suite already exists.
    // Note: This may be because it has been declared across several files.
    let suite = state.suites[id];

    let isNew = false;
    let thisContext;
    if (!suite) {
      isNew = true;

      // Create the suite object.
      suite = {
        id,
        name,
        params: functionParameters(func),
        meta: {}, // Object for consumers to store arbitrary meta-data on the suite.
        beforeHandlers: [],
        childSuites: [],
        specs: [],
        skippedSpecs: [],
        parentSuite: undefined,
        filter(pattern, options = {}) {
          return filterSuite(suite, pattern, options);
        },
        walk(callback) {
          if (R.is(Function, callback)) { walkSuite(suite, callback); }
        },
      };

      // Attach handlers.
      suite.beforeHandlers.invoke = invokerFunction(suite, suite.beforeHandlers);

      // Store parent references.
      if (parent) {
        suite.parentSuite = parent;
        parent.childSuites.push(suite);
      }

      // Store cross references between the suite and the [this] context
      // (only if a custom context was passed).
      if (self !== (global || window)) { self.suite = suite; }
      suite.meta.thisContext = self;
    }

    // Invoke the suite definition.
    if (R.is(Function, func)) {
      state.currentSuite = suite;
      thisContext = suite.meta.thisContext || (global || window);
      func.call(thisContext);
    }

    // Store state.
    state.suites[id] = suite;
    state.currentSuite = parent;

    // Invoke 'onSuiteCreated' callbacks.
    if (isNew) {
      state.onSuiteCreatedHandlers.context = thisContext;
      state.onSuiteCreatedHandlers.invoke(suite);
    }

    // Finish up.
    if (state.currentSection) { suite.section = state.currentSection; }
    return suite;
  };

  const module = {
    /*
    Declares a Suite ('describe').
    @param self: The [this] context.
    @param name: The name of the suite.
    @param func: The describe block.
    */
    describe(self, name, func) {
      // Setup initial conditions.
      name = name || 'Unnamed';

      // Check for [::] and put into distinct 'describe' blocks.
      let suite;
      if (name.indexOf('::') !== -1) {
        // This allows common suite structures to be
        // declared concisely.
        // For example:
        //
        //     describe 'Root::Child::GrandChild', ->
        //
        const startingSuite = state.currentSuite;
        const names = name.replace(/^::/, '').replace(/::$/, '').split('::');
        const addDescribeAt = (index) => {
          const isLast = index === names.length - 1;
          let levelName = names[index];
          if (levelName) { levelName = levelName.trim(); }
          let fn;
          if (isLast) { fn = func; }
          const currentSuite = createSuite(self, levelName, fn);
          state.currentSuite = currentSuite;
          if (!isLast) { addDescribeAt(index + 1); } // <== RECURSION.
          return currentSuite;
        };
        suite = addDescribeAt(0);
        state.currentSuite = startingSuite;
      } else {
        // Simple suite name.
        suite = createSuite(self, name, func);
      }

      // Finish up.
      return suite;
    },


    /*
    Registers a function to run at the start of the suite.
    */
    before(func) {
      if (R.is(Function, func) && state.currentSuite) {
        state.currentSuite.beforeHandlers.push(func);
      }
    },
  };

  // Finish up.
  return module;
}

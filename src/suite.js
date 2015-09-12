/* eslint consistent-return:0 */
import _ from "lodash";
import * as util from "js-util";
import * as localUtil from "./util";


var invokerFunction = (suite, handlers) => {
  return (context, ...args) => {
    handlers.forEach((func) => {
        if (_.isFunction(func)) { func.apply(context, args); }
    });
  };
};


var isFuzzyMatch = (text, pattern) => {
  pattern = pattern.toUpperCase();
  text = text.toUpperCase();
  if (pattern === text) { return true; }

  var index = -1; // Remembers the position of last found character.

  // Consider each pattern character one at a time.
  for (var i in pattern) {
    let char = pattern[i];
    if (char === " ") { continue; } // Ignore spaces.
    index = text.indexOf(char, index + 1);
    if (index === -1) { return false; }
  }

  // Matched.
  return true;
};



var filterSuite = (suite, pattern, options = {}) => {
  if(util.isBlank(pattern)) { return; }
  pattern = _.trim(pattern);

  // Clone the suite.
  suite = _.clone(suite);
  suite.childSuites = _.clone(suite.childSuites);

  // Check if the suite is a match.
  if (isFuzzyMatch(suite.name, pattern)) { return suite; }

  // Check for matches on child suites.
  var childSuites = suite.childSuites;
  suite.childSuites = [];

  var isChildMatched = false;
  childSuites.forEach((childSuite) => {
        let childMatched = filterSuite(childSuite, pattern, options);
        if (childMatched) {
          isChildMatched = true;
          suite.childSuites.push(childSuite);
        }
      });

  // Finish up.
  return isChildMatched ? suite : undefined;
};


var walkSuite = (suite, func) => {
  if (suite.isSkipped) { return; }
  func.call(suite.meta.thisContext, suite);
  suite.childSuites.forEach((childSuite) => walkSuite(childSuite, func)); // <== RECURSION.
};



// ----------------------------------------------------------------------------


export default function(state) {
  var createSuite = (self, name, func) => {
    // Setup initial conditions.
    var parent = state.currentSuite;

    // Build the unique ID.
    var id = name;
    if (parent) { id = `${ parent.id }::${ id }`; }
    id = localUtil.formatId(id);

    // Check if the suite already exists.
    // Note: This may be because it has been declared across several files.
    var suite = state.suites[id];

    if (!suite) {
      // Create the suite object.
      var isNew = true;
      suite = {
        id: id,
        name: name,
        params: util.functionParameters(func),
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
          if (_.isFunction(callback)) { walkSuite(suite, callback); }
        }
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
    if (_.isFunction(func)) {
      state.currentSuite = suite;
      var thisContext = suite.meta.thisContext || (global || window);
      func.call(thisContext);
    }

    // Store state.
    state.suites[id] = suite;
    state.currentSuite = parent;

    // Invoke "onSuiteCreated" callbacks.
    if (isNew) {
      state.onSuiteCreatedHandlers.context = thisContext;
      state.onSuiteCreatedHandlers.invoke(suite);
    }

    // Finish up.
    if (state.currentSection) { suite.section = state.currentSection; }
    return suite;
  };

  let module = {
    /*
    Declares a Suite ("describe").
    @param self: The [this] context.
    @param name: The name of the suite.
    @param func: The describe block.
    */
    describe(self, name, func) {
      // Setup initial conditions.
      name = name || "Unnamed";

      // Check for [::] and put into distinct "describe" blocks.
      if (name.indexOf("::") !== -1) {
        // This allows common suite structures to be
        // declared concisely.
        // For example:
        //
        //     describe "Root::Child::GrandChild", ->
        //
        var startingSuite = state.currentSuite;
        var names = name.replace(/^::/, "").replace(/::$/, "").split("::");
        var addDescribeAt = (index) => {
              let isLast = index === names.length - 1;
              let levelName = names[index];
              if (levelName) { levelName = levelName.trim(); }
              let fn;
              if (isLast) { fn = func; }
              let currentSuite = createSuite(self, levelName, fn);
              state.currentSuite = currentSuite;
              if (!isLast) { addDescribeAt(index + 1); } // <== RECURSION.
              return currentSuite;
            };
        var suite = addDescribeAt(0);
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
      if (_.isFunction(func) && state.currentSuite) {
        state.currentSuite.beforeHandlers.push(func);
      }
    }
  };

  // Finish up.
  return module;
}

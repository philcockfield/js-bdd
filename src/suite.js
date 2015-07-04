import _ from 'lodash';
import * as util from 'js-util';
import * as localUtil from './util';



export default function(state) {
  var _createSuite = (self, name, func) => {
    // Setup initial conditions.
    var parent = state.currentSuite;
    var isRoot = !parent;

    // Build the unique ID.
    var id = name;
    if (parent) id = `${ parent.id }::${ id }`;
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
        meta: {}, // Object for consumers to store arbitrary meta-data on the suite.
        beforeHandlers: [],
        childSuites: [],
        specs: [],
        skippedSpecs: [],
        filter(pattern, options = {}) { return _filterSuite(suite, pattern, options) },
        walk(func) { if (_.isFunction(func)) _walkSuite(suite, func) }
      };

      // Attach handlers.
      suite.beforeHandlers.invoke = _invokerFunction(suite, suite.beforeHandlers);

      // Store parent references.
      if (parent) {
        suite.parentSuite = parent;
        parent.childSuites.push(suite);
      }

      // Store cross references between the suite and the [this] context
      // (only if a custom context was passed).
      if (self !== (global || window)) self.suite = suite;
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
    if (state.currentSection) suite.section = state.currentSection;
    return suite;
  };


  return module = {
    /*
    Declares a Suite ("describe").
    @param self: The [this] context.
    @param name: The name of the suite.
    @param func: The describe block.
    */
    describe(self, name, func) {
      // Setup initial conditions.
      name = name || 'Unnamed';

      // Check for [::] and put into distinct "describe" blocks.
      if (name.indexOf('::') !== -1) {
        // This allows common suite structures to be
        // declared concisely.
        // For example:
        //
        //     describe 'Root::Child::GrandChild', ->
        //
        var startingSuite = state.currentSuite;
        var names = name.replace(/^::/, '').replace(/::$/, '').split('::');
        var addDescribeAt = (index) => {
              let isLast = index === names.length - 1
              let name = names[index];
              if (name) name = name.trim();
              let fn;
              if (isLast) fn = func;
              let currentSuite = _createSuite(self, name, fn);
              state.currentSuite = currentSuite;
              if (!isLast) addDescribeAt(index + 1); // <== RECURSION.
              return currentSuite;
            };
        var suite = addDescribeAt(0);
        state.currentSuite = startingSuite;

      } else {
        // Simple suite name.
        suite = _createSuite(self, name, func);
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
};

// HELPERS ----------------------------------------------------------------------------


var _invokerFunction = (suite, handlers) => {
  return (context, ...args) => {
    handlers.forEach((func) => {
        if (_.isFunction(func)) func.apply(context, args);
    });
  };
};


var _isFuzzyMatch = (text, pattern) => {
  pattern = pattern.toUpperCase();
  text = text.toUpperCase();
  if (pattern === text) return true;

  var index = -1 // Remembers the position of last found character.

  // Consider each pattern character one at a time.
  for (var i in pattern) {
    let char = pattern[i];
    if (char === ' ') continue; // Ignore spaces.
    index = text.indexOf(char, index+1);
    if (index === -1) return false;
  }

  // Matched.
  return true;
};



var _filterSuite = (suite, pattern, options = {}) => {
  if(util.isBlank(pattern)) return;
  pattern = _.trim(pattern);

  // Clone the suite.
  suite = _.clone(suite);
  suite.childSuites = _.clone(suite.childSuites);

  // Check if the suite is a match.
  if (_isFuzzyMatch(suite.name, pattern)) return suite;

  // Check for matches on child suites.
  var childSuites = suite.childSuites;
  suite.childSuites = [];

  var isChildMatched = false;
  childSuites.forEach((childSuite) => {
        let childMatched = _filterSuite(childSuite, pattern, options)
        if (childMatched) {
          isChildMatched = true;
          suite.childSuites.push(childSuite);
        }
      });

  // Finish up.
  return isChildMatched ? suite : undefined;
};


var _walkSuite = (suite, func) => {
  if (suite.isSkipped) return;
  func.call(suite.meta.thisContext, suite);
  suite.childSuites.forEach((childSuite) => _walkSuite(childSuite, func)); // <== RECURSION.
};

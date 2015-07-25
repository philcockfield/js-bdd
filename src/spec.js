/* eslint consistent-return:0 */

import _ from "lodash";
import * as util from "js-util";
import * as localUtil from "./util";



export default function(state) {
  let module = {
    /*
    Declares a single spec/test.

    @param name: The name/description of the spec.
    @param func:  The function.
                  A function with no parameters is considered synchronous.
                  A function with a parameter is considered an async callback, eg:

                      (done) => // Callback.

    @returns the Spec model.
    */
    it(name, func) {
      // Setup initial conditions.
      var parentSuite = state.currentSuite;
      if (!parentSuite){ throw new Error("No current suite."); }
      name = name || "Unnamed";

      // Determine if the spec is asynchronous.
      var isAsync = false;
      if (_.isFunction(func)) {
        isAsync = util.functionParameters(func).length > 0;
      }

      // Generate the ID.
      var id = localUtil.formatId(name);
      id = `spec|${ parentSuite.id }//${ id }`;

      // Increment the ID of any matching specs.
      var existingSpecs = _.filter(parentSuite.specs, (item) => item.id === id);
      if (existingSpecs.length > 0) {

        var i = 0;
        existingSpecs.forEach((item) => {
              item.id = `${ item.id }(${ i })`;
              i += 1;
            });
        id = `${ id }(${ existingSpecs.length })`;
      }

      // The [Spec] model.
      var spec = {
        id: id,
        name: name,
        parentSuite: parentSuite,
        isAsync: isAsync,
        meta: {}, // Object for consumers to store arbitrary meta-data on the spec.

        /*
        Invokes the specification.
        @param self:     The [this] context.
        @param options:
                  - args: An array of arguments to pass.
        @param callback: Invoked upon completion.
                         Immediately if the spec is not asynchronous.
        */
        invoke(self, options = {}, callback) {
          if (!self) { throw new Error("Must have a [this] context"); }

          // Wrangle optional parameters.
          if (!callback) {
            if (_.isFunction(options)) {
              callback = options;
              options = {};
            }
          }

          // Ensure there is a dummy callback to invoke (below) if none was passed.
          // NB: Saves multiple checks below.
          if (!_.isFunction(callback)) { callback = () => {}; }

          // Don"t continue if there is no function for the spec.
          if (!_.isFunction(func)) {
            callback();
            return;
          }

          // Invoke.
          if (isAsync) {
            var args = options.args || [];
            args.push(callback);
            func.apply(self, args);
          } else {
            func.call(self);
            callback();
          }

          return this;
        }
      };

      // Finish up.
      if (state.currentSection) { spec.section = state.currentSection; }
      parentSuite.specs.push(spec);
      return spec;
    }
  };
  return module;
}

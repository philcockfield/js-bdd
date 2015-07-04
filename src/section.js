import _ from 'lodash';
var util = require('core-util');



/*
Represents a section within a Suite.
*/
export default function(state) {
  return module = {
    /*
    Creates a new section model.
    */
    create: (self, suite, name, func) => {
      if (!suite) { throw new Error(`Section must be declared within a suite. See section named '${ name }.'`); }
      if (state.currentSection) { throw new Error(`Cannot nest sections. See section named '${ name }.'`); }
      if (util.isBlank(name)) {
        name = 'Unnamed';
      }

      let formatItems = (...items) => {
          // console.log('items ||----', items);
          items = _.flatten(items);
          items = _.filter(items, (item) => { return !item.isSkipped });
          return items;
      };

      let getSuites = () => {
        return  _.filter(suite.childSuites, (item) => { return item.section === section })
      };
      let getSpecs = () => {
        return _.filter(suite.specs, (item) => { return item.section === section })
      };

      // Define the section object.
      let section = {
        suite: suite,
        name: name,
        items:  () => { return formatItems(getSuites(), getSpecs()) },
        suites: () => { return formatItems(getSuites()) },
        specs:  () => { return formatItems(getSpecs()) },
      };

      // Store the section on the suite.
      suite.sections = suite.sections || [];
      suite.sections.push(section);

      // Invoke the function to load in the child "describe/it" blocks.
      if (_.isFunction(func)) {
        state.currentSection = section;
        func.call(self);
        state.currentSection = null;
      }

      // Finish up.
      return section;
    }
  };
};

import R from 'ramda';
import { isBlank } from 'js-util';




/*
Represents a section within a Suite.
*/
export default function (state) {
  const module = {
    /*
    Creates a new section model.
    */
    create: (self, suite, name, func) => {
      if (!suite) {
        throw new Error(`Section must be declared within a suite. See section named '${ name }.'`);
      }
      if (state.currentSection) {
        throw new Error(`Cannot nest sections. See section named '${ name }.'`);
      }
      if (isBlank(name)) {
        name = 'Unnamed';
      }

      const formatItems = (...items) => {
        items = R.flatten(items);
        items = items.filter(item => !item.isSkipped);
        return items;
      };

      let section;
      const getSuites = () => suite.childSuites.filter(item => item.section === section);
      const getSpecs = () => suite.specs.filter(item => item.section === section);

      // Define the section object.
      const index = suite.sections ? suite.sections.length : 0;
      section = {
        id: `${ suite.name }[section-${ index + 1 }]`,
        suite,
        name,
        items() { return formatItems(getSuites(), getSpecs()); },
        suites() { return formatItems(getSuites()); },
        specs() { return formatItems(getSpecs()); },
      };

      // Store the section on the suite.
      suite.sections = suite.sections || [];
      suite.sections.push(section);

      // Invoke the function to load in the child 'describe/it' blocks.
      if (R.is(Function, func)) {
        state.currentSection = section;
        func.call(self);
        state.currentSection = null;
      }

      // Finish up.
      return section;
    },
  };
  return module;
}

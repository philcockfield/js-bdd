import { expect } from "chai";
import bdd from "../src";


describe("BDD extensions", function() {
  beforeEach(() => {
    bdd.reset();
    delete bdd.describe.foo;
    delete bdd.it.foo;
  });

  describe("extend.describe", function() {
    it("throws if a handler was not specified", () => {
      let fn = () => { bdd.extend.describe("foo"); };
      expect(fn).to.throw();
    });

    it("throws if the extension already exists", () => {
      let fn = () => {
        bdd.describe.foo = () => {};
        bdd.extend.describe("foo", (suite) => {});
      };
      expect(fn).to.throw();
    });

    it("it invokes the registered handler with a root suite", () => {
      let suite;
      bdd.extend.describe("foo", (s) => { suite = s; });
      const result = bdd.describe.foo("does something", () => {});
      expect(result).to.equal(suite);
    });

    it("it invokes the registered handler with a descendent suite", () => {
      let suite;
      bdd.extend.describe("foo", (s) => { suite = s; });
      const root = bdd.describe.foo("root::child", () => {});
      expect(suite.parentSuite).to.equal(root);
    });
  });



  describe("extend.it", function() {
    it("throws if a handler was not specified", () => {
      let fn = () => { bdd.extend.it("foo"); };
      expect(fn).to.throw();
    });

    it("throws if the extension already exists", () => {
      let fn = () => {
        bdd.it.foo = () => {};
        bdd.extend.it("foo", (suite) => {});
      };
      expect(fn).to.throw();
    });

    it("it invokes the registered handler with the spec", () => {
      let callbackSpec;
      let spec;
      bdd.extend.it("foo", (s) => { callbackSpec = s; });
      const suite = bdd.describe("something", () => {
        spec = bdd.it.foo("does it", () => {});
      });
      expect(callbackSpec).to.equal(spec);
      expect(spec.parentSuite).to.equal(suite);
    });

  });

});

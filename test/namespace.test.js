import R from "ramda";
import _ from "lodash";
import { expect } from "chai";
import bdd from "../src";



describe("ns (namespace)", function() {
  beforeEach(() => bdd.reset());


  it("returns the BDD api", () => {
    expect(bdd.namespace()).to.equal(bdd);
  });

  it("prefixes the namespace to a suite", () => {
    bdd.namespace("MyNamespace");
    const suite = bdd.describe ("Foo", () => {});
    expect(suite.name).to.equal("MyNamespace");
    expect(suite.childSuites[0].name).to.equal("Foo");
  });

  it("prefixes the namespace to multiple suites suite", () => {
    bdd.namespace("MyNamespace");
    let suite;
    suite = bdd.describe("Foo", () => {});
    suite = bdd.describe("Bar", () => {});
    expect(suite.childSuites[0].name).to.equal("Foo");
    expect(suite.childSuites[1].name).to.equal("Bar");
  });

  it("does not prefix the namespace to non-root suites suite", () => {
    bdd.namespace("MyNamespace");
    const suite = bdd.describe("Foo", () => {
      bdd.describe("Child");
    });
    expect(suite.childSuites[0].childSuites[0].name).to.equal("Child");
  });


  it("clears namespace on `bdd.reset`", () => {
    bdd.namespace("MyNamespace");
    bdd.reset();
    const suite = bdd.describe("Foo", () => {})
    expect(suite.name).to.equal("Foo");
  });

  it("resets the namespace with `null`", () => {
    bdd.namespace("MyNamespace");
    const suite1 = bdd.describe("Foo", () => {});
    bdd.namespace(null);
    const suite2 = bdd.describe("Foo", () => {});
    expect(suite1.name).to.equal("MyNamespace");
    expect(suite2.name).to.equal("Foo");
  });

  describe("trims", function() {
    it("whitespace", () => {
      bdd.namespace("    NS          ");
      const suite = bdd.describe("Foo", () => {});
      expect(suite.name).to.equal("NS");
    });

    it("double-colons (::)", () => {
      bdd.namespace("::ns:::");
      const suite = bdd.describe("Foo", () => {});
      expect(suite.name).to.equal("ns");
    });

    it("single-colons (::)", () => {
      bdd.namespace("ns:");
      const suite = bdd.describe("Foo", () => {});
      expect(suite.name).to.equal("ns");
    });
  });



  describe("does not add namespace", function() {
    it("when empty-string", () => {
      bdd.namespace("              ");
      const suite = bdd.describe("Foo", () => {});
      expect(suite.name).to.equal("Foo");
    });

    it("when null", () => {
      bdd.namespace(null);
      const suite = bdd.describe("Foo", () => {});
      expect(suite.name).to.equal("Foo");
    });

    it("when undefined", () => {
      bdd.namespace();
      const suite = bdd.describe("Foo", () => {});
      expect(suite.name).to.equal("Foo");
    });
  });


  describe("(::) hierarchy", function() {
    it("builds a namespace hierarchy", () => {
      bdd.namespace("Root::Child");
      const suite = bdd.describe("Foo", () => {});
      expect(suite.name).to.equal("Root");
      expect(suite.childSuites[0].name).to.equal("Child");
      expect(suite.childSuites[0].childSuites[0].name).to.equal("Foo");
    });

    it("trims (:)", () => {
      bdd.namespace("::Root::Child:")
      const suite = bdd.describe("Foo", () => {});
      expect(suite.name).to.equal("Root");
      expect(suite.childSuites[0].name).to.equal("Child");
      expect(suite.childSuites[0].childSuites[0].name).to.equal("Foo");
    });

    it("trims (:::)", () => {
      bdd.namespace("::::Root::Child::::::::")
      const suite = bdd.describe("Foo", () => {});
      expect(suite.name).to.equal("Root");
      expect(suite.childSuites[0].name).to.equal("Child");
      expect(suite.childSuites[0].childSuites[0].name).to.equal("Foo");
    });
  });


  describe("stacking up multiple levels", function() {
    it("stacks up namespaces", () => {
      bdd.namespace("One");
      bdd.namespace("Two");
      const suite = bdd.describe("Foo", () => {});
      expect(suite.name).to.equal("One");
      expect(suite.childSuites[0].name).to.equal("Two");
      expect(suite.childSuites[0].childSuites[0].name).to.equal("Foo");
    });

    it("`pops` out of a namespace", () => {
      bdd.namespace("One");
      bdd.namespace("Two");
      const suite1 = bdd.describe("Foo", () => {})
      bdd.namespace.pop();
      const suite2 = bdd.describe("Bar", () => {})

      expect(suite1.name).to.equal("One");
      expect(suite1.childSuites[0].name).to.equal("Two");
      expect(suite1.childSuites[0].childSuites[0].name).to.equal("Foo");

      expect(suite2.name).to.equal("One");
      expect(suite2.childSuites[1].name).to.equal("Bar");
    });

    it("`pops` up to the root (no namespace)", () => {
      bdd.namespace("One");
      bdd.namespace("Two");
      bdd.namespace.pop();
      bdd.namespace.pop();
      const suite = bdd.describe("Foo", () => {});
      expect(suite.name).to.equal("Foo");
    });

    it("can `pop` with no namespace (safe)", () => {
      bdd.namespace.pop();
      bdd.namespace.pop();
      bdd.namespace.pop();
    });
  });


  describe("`invokeWithin` function", function() {
    it("invokes describe blocks within the given function", () => {
      let suite = null;
      bdd.namespace("MyNS", () => {
        suite = bdd.describe("Foo", () => {});
      });
      expect(suite.name).to.equal("MyNS");
    });

    it("resets the namespace once completed", () => {
      bdd.namespace("MyNS", () => {
        bdd.describe("Foo", () => {});
      });
      const suite = bdd.describe("Foo", () => {});
      expect(suite.name).to.equal("Foo");
    });

    it("declares another namespace within the given function", () => {
      let suite1 = null;
      let suite2 = null;

      bdd.namespace("ns1", () => {
        suite1 = bdd.describe("Foo", () => {});
        bdd.namespace("ns2", () => {
          suite2 = bdd.describe("Bar", () => {});
        });
      });

      expect(suite1.name).to.equal("ns1");
      expect(suite1.childSuites[0].name).to.equal("Foo");

      expect(suite2.name).to.equal("ns1");
      expect(suite2.childSuites[1].name).to.equal("ns2");
      expect(suite2.childSuites[1].childSuites[0].name).to.equal("Bar");
    });


    it("pops up a level in the namespace once complete", () => {
      let suite1 = null;
      let suite2 = null;
      let suite3 = null;

      bdd.namespace("ns1", () => {
        suite1 = bdd.describe("Foo", () => {});
        bdd.namespace("ns2", () => {
          suite2 = bdd.describe("Bar", () => {});
        });
        suite3 = bdd.describe("Baz", () => {});
      });

      expect(suite3.name).to.equal("ns1");
      expect(suite3.childSuites[2].name).to.equal("Baz");
    });



    it("invokes with no (null) namespace", () => {
      let suite = null;
      bdd.namespace("Yo");
      bdd.namespace(null, () => {
        suite = bdd.describe("Foo", () => {});
      });
      expect(suite.name).to.equal("Foo");
    });
  });
});

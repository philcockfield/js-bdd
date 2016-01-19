import { expect } from "chai";
import bdd from "../src";



describe("Filter", function() {
  beforeEach(() => bdd.reset());

  describe("fuzzy matching", function() {
    const getMatch = (name, pattern) => bdd.describe(name).filter(pattern);

    it("does not match empty", () => {
      expect(getMatch("Root", "")).to.equal(undefined);
      expect(getMatch("Root", " ")).to.equal(undefined);
      expect(getMatch("Root", null)).to.equal(undefined);
      expect(getMatch("Root")).to.equal(undefined);
      expect(getMatch("Root", undefined)).to.equal(undefined);
    });

    it("matches exact text", () => {
      const match = bdd.describe("Root").filter("Root");
      expect(match).not.to.equal(undefined);
    });

    it("matches case difference", () => {
      const match = bdd.describe("Root").filter("rOOT");
      expect(match).not.to.equal(undefined);
    });

    it("matches two words", () => {
      const match = bdd.describe("One Two").filter("one two")
      expect(match).not.to.equal(undefined);
    });

    it("matches trimmed filter pattern", () => {
      const match = bdd.describe("Root").filter("   Root        ");
      expect(match).not.to.equal(undefined);
    });

    it("matches beginning and end", () => {
      const match = bdd.describe("Root").filter("rT");
      expect(match).not.to.equal(undefined);
    });

    it("not a matche because of suffix", () => {
      const match = bdd.describe("Root").filter("rT1");
      expect(match).to.equal(undefined);
    });
  });



  describe("on a single suite", function() {
    it("does not match on the suite name", () => {
      const suite = bdd.describe("Root", () => {});
      const match = suite.filter("z");
      expect(match).to.eql(undefined);
    });


    it("matches on the suite name (case insensitive)", () => {
      const suite = bdd.describe("Root", () => {});
      const result = suite.filter("oT")
      expect(result.id).to.equal(suite.id);
    });


    it("returns a clone", () => {
      const suite = bdd.describe("Root", () => {
        bdd.describe("Child");
      });

      const result = suite.filter("oT");
      expect(result).not.to.equal(suite); // It is a clone.
      expect(result.childSuites).not.to.equal(suite.childSuites); // The child array is a clone.
    });


    it("returns the filtered suite when a child matches", () => {
      let childMatch = null
      const suite = bdd.describe("Root", () => {
        bdd.describe("Foo"); // No match.
        childMatch = bdd.describe("Jordan");
        bdd.describe("Bar"); // No match.
      });

      const result = suite.filter("oRd");
      expect(result.name).to.equal("Root");
      expect(result.childSuites).to.eql([childMatch]);
    });


    it("includes all children of the matched suite", () => {
      const suite = bdd.describe("Root", () => {

        bdd.describe("Foo") // No match.
        const childMatch = bdd.describe("Jordan", () => {
          bdd.describe("a");
          bdd.describe("b", () => {
            bdd.describe("c");
          });
        });
      });

      const result = suite.filter("oRd")
      expect(result.childSuites[0].childSuites[0].name).to.equal("a");
      expect(result.childSuites[0].childSuites[1].name).to.equal("b");
      expect(result.childSuites[0].childSuites[1].childSuites[0].name).to.equal("c");
    });
  });
});

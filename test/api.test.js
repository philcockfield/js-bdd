import { expect } from "chai";
import bdd from "../src";


describe("bdd", function() {
  beforeEach(() => bdd.reset());

  it("removes all suites when `reset`", () => {

    bdd.describe("parent", () => {
      bdd.describe("child", () => {
        bdd.describe("grand-child");
      });
    });

    let keys;
    keys = Object.keys(bdd.suites());
    expect(keys.length).to.equal(3);

    bdd.reset();

    keys = Object.keys(bdd.suites());
    expect(keys.length).to.equal(0);
  });
});

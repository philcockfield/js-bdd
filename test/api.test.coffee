expect = require('chai').expect
bdd = require('../src')




describe 'bdd', ->
  it 'removes all suites when `reset`', ->
    bdd.describe 'parent', ->
      bdd.describe 'child', ->
        bdd.describe 'grand child'

    keys = (key for key, value of bdd.suites())
    expect(keys.length).to.equal 3

    bdd.reset()

    keys = (key for key, value of bdd.suites())
    expect(keys.length).to.equal 0

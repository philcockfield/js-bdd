_ = require('lodash')
expect = require('chai').expect
bdd = require('../')



describe 'Skipping', ->
  beforeEach ->
    bdd.reset()


  describe 'describe.skip (Suite)', ->
    it 'has no skipped specs', ->
      suite = bdd.describe 'Foo', ->
      expect(suite.skippedSpecs).to.eql []


    it 'returns a suite', ->
      fn = ->
      suite = bdd.describe.skip 'Foo', ->
        bdd.before(fn)
      expect(suite.id).to.equal 'Foo'
      expect(suite.isSkipped).to.equal true
      expect(suite.beforeHandlers[0]).to.equal fn


    it 'skips child suites/specs', ->
      spec1 = null
      spec2 = null
      suite2 = null
      suite3 = null
      suite1 = bdd.describe.skip 'Foo1', ->
        spec1 = bdd.it 'Yo1', ->
        suite2 = bdd.describe 'Foo2', ->
          suite3 = bdd.describe 'Foo3', ->
            spec2 = bdd.it 'Yo2', ->

      expect(suite1.isSkipped).to.equal true
      expect(suite2.isSkipped).to.equal true
      expect(suite3.isSkipped).to.equal true
      expect(spec1.isSkipped).to.equal true
      expect(spec2.isSkipped).to.equal true
      expect(spec1.parentSuite).to.equal suite1
      expect(spec2.parentSuite).to.equal suite3


    it 'stores a reference to the skipped suite', ->
      suite = bdd.describe.skip 'Foo', ->
      expect(bdd.skippedSuites['Foo']).to.equal suite


    it 'places the `.skip` on the lowest descendent from a "::" declared hierarchy', ->
      suite = bdd.describe.skip 'Parent::Child(Foo)', ->
      descendent = suite.childSuites[0]
      expect(suite.id).to.equal 'Parent'
      expect(suite.isSkipped).not.to.equal true
      expect(descendent.isSkipped).to.equal true
      expect(bdd.skippedSuites['Parent::Child[Foo]']).to.equal descendent


    it 'excludes the skipped suite', ->
      suite1 = null
      suite2 = null
      suite3 = null
      suite4 = null
      suite5 = null
      suite1 = bdd.describe 'Foo1', ->
        suite2 = bdd.describe.skip 'Foo2', ->
          suite3 = bdd.describe 'Foo3', ->
        suite4 = bdd.describe.skip 'Foo4', ->
        suite5 = bdd.describe 'Foo5', ->
      expect(bdd.suites()).to.eql [suite5, suite1]


    it 'updates a composite suite to being skipped', ->
      suite1 = bdd.describe 'Foo', ->
      bdd.describe.skip 'Foo', ->
      expect(suite1.isSkipped).to.equal true


    it 'updates a composite suite to being skipped', ->
      suite2 = null
      suite3 = null
      spec = null
      suite1 = bdd.describe 'Bar', ->
        suite2 = bdd.describe 'Child', ->
          suite3 = bdd.describe 'GrandChild', ->
            spec = bdd.it 'Yo'

      yo = null
      bdd.describe 'Bar', ->
        bdd.describe 'Child', ->
          bdd.describe.skip 'GrandChild', ->
            bdd.it 'Yo'

      expect(suite3.isSkipped).to.equal true
      expect(spec.isSkipped).to.equal true



  describe 'it.skip (Spec)', ->
    it 'returns a spec', ->
      spec = null
      suite = bdd.describe 'Foo', ->
        spec = bdd.it.skip 'Bar', ->
      expect(spec.name).to.equal 'Bar'
      expect(spec.isSkipped).to.equal true
      expect(spec.parentSuite).to.equal suite


    it 'stores a reference to the skipped spec', ->
      spec1 = null
      spec2 = null
      suite = bdd.describe 'Foo', ->
        spec1 = bdd.it.skip 'Bar1', ->
        spec2 = bdd.it 'Bar2', ->
      expect(suite.skippedSpecs).to.eql [spec1]
      expect(bdd.skippedSpecs['spec|Foo//Bar1']).to.equal spec1

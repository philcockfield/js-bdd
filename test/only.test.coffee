_ = require('lodash')
expect = require('chai').expect
bdd = require('../src')



describe '.only (filtering)', ->
  describe 'describe.only (Suite)', ->
    beforeEach ->
      bdd.reset()


    it 'returns a `describe.only` Suite', ->
      fn = ->
      suite = bdd.describe.only 'Foo', ->
        bdd.before(fn)
      expect(suite.id).to.equal 'Foo'
      expect(suite.isOnly).to.equal true
      expect(suite.beforeHandlers[0]).to.equal fn


    it 'invokes the `describe.only` suite with the global context', ->
      context1 = null
      context2 = null
      suite2 = null
      bdd.describe.only 'Foo', ->
        context1 = @
        bdd.describe.only 'Bar', ->
          context2 = @
      expect(context1).to.equal (global ? window)
      expect(context2).to.equal (global ? window)


    it 'places the `.only` on the lowest descendent from a "::" declared hierarchy', ->
      suite = bdd.describe.only 'Parent::Child(Foo)', ->
      descendent = suite.childSuites[0]
      expect(suite.id).to.equal 'Parent'
      expect(suite.isOnly).not.to.equal true
      expect(descendent.isOnly).to.equal true
      expect(bdd.onlySuites['Parent::Child[Foo]']).to.equal descendent



    describe 'custom context', ->
      afterEach ->
        bdd.contextFactory = -> (global ? window)

      it 'invokes the `descibe.only` suite with the specified context', ->
        customContext = { foo:123 }
        bdd.contextFactory = -> customContext
        context = null
        bdd.describe.only 'Foo', ->
          context = @
        expect(context).to.equal customContext


      it 'invokes the `descibe.only` suite with the specified context (deep)', ->
        customContext = { foo:123 }
        bdd.contextFactory = -> customContext
        context = null
        bdd.describe.only 'Foo', ->
          bdd.describe.only 'Bar', ->
            context = @
        expect(context).to.equal customContext


    it 'does not have any `descibe.only` suites stored', ->
      bdd.reset()
      expect(bdd.onlySuites).to.eql {}


    it 'stores the `descibe.only` Suite on the main module API.', ->
      suite1 = bdd.describe.only 'Foo1', ->
      suite2 = bdd.describe 'Foo2', ->
      expect(bdd.onlySuites.Foo1).to.equal suite1
      expect(bdd.suites()).to.eql [suite1]


    it 'updates a composite suite to being `.only`', ->
      suite = bdd.describe 'Foo', ->
      bdd.describe.only 'Foo', ->
      expect(bdd.onlySuites.Foo).to.equal suite
      expect(bdd.suites()).to.eql [suite]


    it 'is cumulative', ->
      suite1 = bdd.describe.only 'Foo1', ->
      suite2 = bdd.describe 'Foo2', ->
      suite3 = bdd.describe.only 'Foo3', ->
      expect(bdd.onlySuites.Foo1).to.equal suite1
      expect(bdd.onlySuites.Foo2).to.equal undefined
      expect(bdd.onlySuites.Foo3).to.equal suite3
      expect(bdd.suites()).to.eql [suite1, suite3]



      # TODO:


  # ----------------------------------------------------------------------------


  describe 'it.only (Spec)', ->
    beforeEach ->
      bdd.reset()

    it 'returns a Spec from `it.only` within a standard Suite', ->
      spec = null
      suite = bdd.describe 'Foo', ->
        spec = bdd.it.only 'Bar', ->
      expect(spec.name).to.equal 'Bar'
      expect(spec.isOnly).to.equal true
      expect(spec.parentSuite).to.equal suite


    it 'returns a Spec from `it.only` within a `describe.only` Suite', ->
      spec = null
      suite = bdd.describe.only 'Foo', ->
        spec = bdd.it.only 'Bar', ->
      expect(spec.name).to.equal 'Bar'
      expect(spec.isOnly).to.equal true
      expect(spec.parentSuite).to.equal suite


    it 'stores the Suite for the `it.only` Spec on the main module API.', ->
      suite = bdd.describe 'Foo', ->
        spec = bdd.it.only 'Bar', ->
      expect(bdd.onlySuites.Foo).to.equal suite

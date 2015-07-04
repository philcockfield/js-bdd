expect = require('chai').expect
util = require('core-util')
bdd = require('../')



describe 'Spec ("it")', ->
  beforeEach ->
    bdd.reset()



  it 'throws if there is no current [Suite]', ->
    fn = ->
      bdd.it('Foo')
    expect(fn).to.throw(/No current suite./)



  it 'creates a default name for the spec', ->
    spec = null
    bdd.describe 'Foo', ->
      spec = bdd.it()
    expect(spec.name).to.equal 'Unnamed'
    expect(spec.func).to.equal undefined
    expect(spec.meta).to.eql {}



  it 'creates a [Spec] within the current [Suite]', ->
    spec = null
    suite = bdd.describe 'Foo', ->
      spec = bdd.it 'Does something', ->
    expect(spec.name).to.equal 'Does something'



  it 'stores a reference the parent suite (shallow)', ->
    spec = null
    suite = bdd.describe 'Foo', ->
      spec = bdd.it 'Does something', ->
    expect(spec.name).to.equal 'Does something'
    expect(spec.parentSuite).to.equal suite



  it 'stores a reference to the spec in the parent [Suite]', ->
    spec1 = null
    spec2 = null
    suite = bdd.describe 'Foo', ->
      spec1 = bdd.it 'Does something', ->
      spec2 = bdd.it 'Does something', ->
    expect(suite.specs[0]).to.equal spec1
    expect(suite.specs[1]).to.equal spec2


  it 'stores a reference to the parent suite (deep)', ->
    spec = null
    suite = null
    bdd.describe 'Foo', ->
      suite = bdd.describe 'Bar', ->
        spec = bdd.it 'Does something', ->
    expect(spec.parentSuite).to.equal suite


  describe 'Unique identifier (ID)', ->
    it 'has a unique ID on a deeply nested spec', ->
      spec = null
      bdd.describe 'Foo', ->
        bdd.describe 'Bar', ->
          spec = bdd.it 'Does something', ->
      expect(spec.id).to.equal 'spec|Foo::Bar//Does-something'

    it 'escapes parentheses', ->
      spec = null
      suite = bdd.describe '(Foo)', ->
        spec = bdd.it 'Bar (1)', ->
      expect(spec.id).to.equal 'spec|[Foo]//Bar-[1]'

    it 'creates unique incrementers for identically named specs', ->
      spec1 = null
      spec2 = null
      suite = bdd.describe 'Foo (hello)', ->
        spec1 = bdd.it 'Bar', ->
        spec2 = bdd.it 'Bar', ->
      expect(spec1.id).to.equal 'spec|Foo-[hello]//Bar(0)'
      expect(spec2.id).to.equal 'spec|Foo-[hello]//Bar(1)'



  describe 'asynchronous specs ("done" callback)', ->
    describe 'is asynchronous', ->
      it 'single "done" callback', ->
        spec = null
        suite = bdd.describe 'Foo', ->
          spec = bdd.it 'Does something', (done) ->
        expect(spec.isAsync).to.equal true

      it 'multiple params with "done" being the last callback', ->
        spec = null
        suite = bdd.describe 'Foo', ->
          spec = bdd.it 'Does something', (p1, p2, done) ->
        expect(spec.isAsync).to.equal true


    describe 'is NOT asynchronous', ->
      it 'no callback parameter', ->
        spec = null
        suite = bdd.describe 'Foo', ->
          spec = bdd.it 'Does something', ->
        expect(spec.isAsync).to.equal false



  describe 'invoking a Spec', ->
    it 'calls back immediately if there is no function for the spec', (done) ->
      spec = null
      suite = bdd.describe 'Foo', ->
        spec = bdd.it 'Does something'
      spec.invoke @, -> done()


    describe 'synchonously', ->
      it 'invokes the spec', (done) ->
        spec = null
        context = null
        suite = bdd.describe 'Foo', ->
          spec = bdd.it 'Does something', ->
            context = @

        spec.invoke { foo:123 }, ->
          expect(context).to.eql { foo:123 }
          done()

    describe 'asynchonously', ->
      it 'invokes the spec without arguments', (done) ->
        spec = null
        context = null
        suite = bdd.describe 'Foo', ->
          spec = bdd.it 'Does something', (callback) ->
            context = @
            callback()

        spec.invoke { context:'foo' }, ->
          expect(context).to.eql { context:'foo' }
          util.delay 5, -> done()


      it 'invokes the spec with arguments', (done) ->
        spec = null
        context = null
        args = {}
        suite = bdd.describe 'Foo', ->
          spec = bdd.it 'Does something', (p1, p2, callback) ->
            context = @
            args.p1 = p1
            args.p2 = p2
            callback()

        spec.invoke { context:'foo' }, { args:[123, 'foo'] }, ->
          expect(context).to.eql { context:'foo' }
          expect(args.p1).to.equal 123
          expect(args.p2).to.equal 'foo'
          done()

_ = require('lodash')
expect = require('chai').expect
bdd = require('../src')


describe 'ns (namespace)', ->
  beforeEach ->
    bdd.reset()

  it 'returns the BDD api', ->
    expect(bdd.namespace()).to.equal bdd

  it 'prefixes the namespace to a suite', ->
    bdd.namespace 'MyNamespace'
    suite = bdd.describe 'Foo', ->
    expect(suite.name).to.equal 'MyNamespace'
    expect(suite.childSuites[0].name).to.equal 'Foo'

  it 'prefixes the namespace to multiple suites suite', ->
    bdd.namespace 'MyNamespace'
    suite = bdd.describe 'Foo', ->
    suite = bdd.describe 'Bar', ->
    expect(suite.childSuites[0].name).to.equal 'Foo'
    expect(suite.childSuites[1].name).to.equal 'Bar'

  it 'does not prefix the namespace to non-root suites suite', ->
    bdd.namespace 'MyNamespace'
    suite = bdd.describe 'Foo', ->
      bdd.describe 'Child'
    expect(suite.childSuites[0].childSuites[0].name).to.equal 'Child'


  it 'clears namespace on `bdd.reset`', ->
    bdd.namespace 'MyNamespace'
    bdd.reset()
    suite = bdd.describe 'Foo', ->
    expect(suite.name).to.equal 'Foo'

  it 'resets the namespace with `null`', ->
    bdd.namespace('MyNamespace')
    suite1 = bdd.describe 'Foo', ->
    bdd.namespace(null)
    suite2 = bdd.describe 'Foo', ->
    expect(suite1.name).to.equal 'MyNamespace'
    expect(suite2.name).to.equal 'Foo'

  describe 'trims', ->
    it 'whitespace', ->
      bdd.namespace '    NS          '
      suite = bdd.describe 'Foo', ->
      expect(suite.name).to.equal 'NS'

    it 'double-colons (::)', ->
      bdd.namespace '::ns:::'
      suite = bdd.describe 'Foo', ->
      expect(suite.name).to.equal 'ns'

    it 'single-colons (::)', ->
      bdd.namespace 'ns:'
      suite = bdd.describe 'Foo', ->
      expect(suite.name).to.equal 'ns'


  describe 'does not add namespace', ->
    it 'when empty-string', ->
      bdd.namespace '              '
      suite = bdd.describe 'Foo', ->
      expect(suite.name).to.equal 'Foo'

    it 'when null', ->
      bdd.namespace null
      suite = bdd.describe 'Foo', ->
      expect(suite.name).to.equal 'Foo'

    it 'when undefined', ->
      bdd.namespace()
      suite = bdd.describe 'Foo', ->
      expect(suite.name).to.equal 'Foo'


  describe '(::) hierarchy', ->
    it 'builds a namespace hierarchy', ->
      bdd.namespace('Root::Child')
      suite = bdd.describe 'Foo', ->
      expect(suite.name).to.equal 'Root'
      expect(suite.childSuites[0].name).to.equal 'Child'
      expect(suite.childSuites[0].childSuites[0].name).to.equal 'Foo'

    it 'trims (:)', ->
      bdd.namespace('::Root::Child:')
      suite = bdd.describe 'Foo', ->
      expect(suite.name).to.equal 'Root'
      expect(suite.childSuites[0].name).to.equal 'Child'
      expect(suite.childSuites[0].childSuites[0].name).to.equal 'Foo'

    it 'trims (:::)', ->
      bdd.namespace('::::Root::Child::::::::')
      suite = bdd.describe 'Foo', ->
      expect(suite.name).to.equal 'Root'
      expect(suite.childSuites[0].name).to.equal 'Child'
      expect(suite.childSuites[0].childSuites[0].name).to.equal 'Foo'


  describe 'stacking up multiple levels', ->
    it 'stacks up namespaces', ->
      bdd.namespace 'One'
      bdd.namespace 'Two'
      suite = bdd.describe 'Foo', ->
      expect(suite.name).to.equal 'One'
      expect(suite.childSuites[0].name).to.equal 'Two'
      expect(suite.childSuites[0].childSuites[0].name).to.equal 'Foo'

    it '`pops` out of a namespace', ->
      bdd.namespace 'One'
      bdd.namespace 'Two'
      suite1 = bdd.describe 'Foo', ->
      bdd.namespace.pop()
      suite2 = bdd.describe 'Bar', ->

      expect(suite1.name).to.equal 'One'
      expect(suite1.childSuites[0].name).to.equal 'Two'
      expect(suite1.childSuites[0].childSuites[0].name).to.equal 'Foo'

      expect(suite2.name).to.equal 'One'
      expect(suite2.childSuites[1].name).to.equal 'Bar'

    it '`pops` up to the root (no namespace)', ->
      bdd.namespace 'One'
      bdd.namespace 'Two'
      bdd.namespace.pop()
      bdd.namespace.pop()
      suite = bdd.describe 'Foo', ->
      expect(suite.name).to.equal 'Foo'

    it 'can `pop` with no namespace (safe)', ->
      bdd.namespace.pop()
      bdd.namespace.pop()
      bdd.namespace.pop()



  describe '`invokeWithin` function', ->
    it 'invokes describe blocks within the given function', ->
      suite = null
      bdd.namespace 'MyNS', ->
        suite = bdd.describe 'Foo', ->
      expect(suite.name).to.equal 'MyNS'

    it 'resets the namespace once completed', ->
      bdd.namespace 'MyNS', ->
        bdd.describe 'Foo', ->
      suite = bdd.describe 'Foo', ->
      expect(suite.name).to.equal 'Foo'

    it 'declares another namespace within the given function', ->
      suite1 = null
      suite2 = null

      bdd.namespace 'ns1', ->
        suite1 = bdd.describe 'Foo', ->
        bdd.namespace 'ns2', ->
          suite2 = bdd.describe 'Bar', ->

      expect(suite1.name).to.equal 'ns1'
      expect(suite1.childSuites[0].name).to.equal 'Foo'

      expect(suite2.name).to.equal 'ns1'
      expect(suite2.childSuites[1].name).to.equal 'ns2'
      expect(suite2.childSuites[1].childSuites[0].name).to.equal 'Bar'


    it 'pops up a level in the namespace once complete', ->
      suite1 = null
      suite2 = null
      suite3 = null

      bdd.namespace 'ns1', ->
        suite1 = bdd.describe 'Foo', ->
        bdd.namespace 'ns2', ->
          suite2 = bdd.describe 'Bar', ->
        suite3 = bdd.describe 'Baz', ->

      expect(suite3.name).to.equal 'ns1'
      expect(suite3.childSuites[2].name).to.equal 'Baz'


    it 'invokes with the global context', ->
      self = null
      bdd.namespace 'MyNS', -> self = @
      suite = bdd.describe 'Foo', ->
      expect(self).to.equal (global ? window)


    it 'invokes with the given context', ->
      self = null
      context = { foo:123 }
      bdd.namespace.call context, 'MyNS', -> self = @
      suite = bdd.describe 'Foo', ->
      expect(self == context).to.equal true


    it 'invokes with no (null) namespace', ->
      suite = null
      bdd.namespace('Yo')
      bdd.namespace null, ->
        suite = bdd.describe 'Foo', ->
      expect(suite.name).to.equal 'Foo'

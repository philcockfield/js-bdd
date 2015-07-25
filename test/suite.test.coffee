expect = require('chai').expect
bdd = require('../src')


# ----------------------------------------------------------------------------


describe 'Suite ("describe")', ->
  beforeEach ->
    bdd.reset()

  it 'has default values', ->
    suite = bdd.describe('foo')
    expect(suite.name).to.equal('foo')
    expect(suite.parentSuite).to.equal(undefined)
    expect(suite.childSuites).to.eql([])
    expect(suite.specs).to.eql([])
    expect(suite.skippedSpecs).to.eql([])
    expect(suite.sections).to.equal(undefined)


  it 'returns an "Unnamed" suite', ->
    suite = bdd.describe()
    expect(suite.name).to.equal('Unnamed')


  describe 'Invoking the Suite', ->
    it 'invokes the "describe" block with the default context', ->
      self = null
      bdd.describe 'foo', -> self = @
      expect(self).to.equal (global ? window)
      expect(self.suite).to.equal undefined

    it 'does not store a reference to the invoke context when it is global', ->
      suite = bdd.describe 'foo', ->
      expect(suite.meta.thisContext).to.equal global

    it 'invokes the "describe" block with a [this] generated from a factory', ->
      context = { foo:123 }
      type = null
      bdd.contextFactory = (t) ->
        type = t
        context
      self = null
      suite = bdd.describe 'foo', -> self = @
      expect(self).to.equal context
      expect(self.suite).to.equal suite
      expect(type).to.equal 'suite'
      bdd.contextFactory = -> (global ? window) # Reset the factory.


  # ----------------------------------------------------------------------------


  describe 'Unique identifier (ID)', ->
    it 'has a unique ID on a deeply nested suite', ->
      child = null
      grandChild = null
      parent = bdd.describe 'parent', ->
        child = bdd.describe 'child', ->
          grandChild = bdd.describe 'grand child'
      expect(parent.id).to.equal('parent')
      expect(child.id).to.equal('parent::child')
      expect(grandChild.id).to.equal('parent::child::grand-child')

    it 'escapes parentheses', ->
      suite = bdd.describe 'Foo (123)', ->
      expect(suite.id).to.equal 'Foo-[123]'


  # ----------------------------------------------------------------------------


  it 'stores all suites on the BDD module', ->
    child = null
    parent1 = bdd.describe 'parent1', ->
    parent2 = bdd.describe 'parent2', ->
      child = bdd.describe 'child', ->
    expect(bdd.allSuites.parent1).to.equal(parent1)
    expect(bdd.allSuites.parent2).to.equal(parent2)
    expect(bdd.allSuites[child.id]).to.equal(child)
    expect(bdd.suites()).to.eql [parent1, child, parent2]



  it 'embeds a child suites', ->
    child = null
    grandChild = null
    parent = bdd.describe 'parent', ->
      child = bdd.describe 'child', ->
        grandChild = bdd.describe 'grandChild'

    expect(parent.name).to.equal('parent')
    expect(child.name).to.equal('child')
    expect(grandChild.name).to.equal('grandChild')

    expect(child.parentSuite).to.equal(parent)
    expect(grandChild.parentSuite).to.equal(child)

    expect(parent.childSuites[0]).to.equal(child)
    expect(child.childSuites[0]).to.equal(grandChild)
    expect(grandChild.childSuites).to.eql([])



  it 'creates two root suites', ->
    suite1 = bdd.describe('foo1')
    suite2 = bdd.describe('foo2', ->)
    expect(suite1).not.to.equal(suite2)
    expect(suite1.parentSuite).to.equal(undefined)
    expect(suite2.parentSuite).to.equal(undefined)


  it 'creates sibling child suites', ->
    suite1 = null
    suite2 = null
    suite3 = null
    root = bdd.describe 'root', ->
      suite1 = bdd.describe('foo1', -> )
      suite2 = bdd.describe('foo2')
      suite3 = bdd.describe 'foo3', -> bdd.describe 'grandChild'
    expect(root.childSuites).to.eql [suite1, suite2, suite3]


  it 'creates sibling grand-child suites', ->
    suite1 = null
    suite2 = null
    suite3 = null
    child = null
    root = bdd.describe 'root', ->
      child = bdd.describe 'child', ->
        suite1 = bdd.describe('foo1', -> )
        suite2 = bdd.describe('foo2')
        suite3 = bdd.describe 'foo3', -> bdd.describe 'grandChild'
    expect(child.childSuites).to.eql [suite1, suite2, suite3]


  it 'splits "::" into nested describe blocks', ->
    suite = bdd.describe('::root::child::grandChild::')
    console.log 'suite.name', suite.name
    expect(suite.name).to.equal('root')
    expect(suite.childSuites[0].name).to.equal('child')
    expect(suite.childSuites[0].childSuites[0].name).to.equal('grandChild')


  # ----------------------------------------------------------------------------


  describe 'consolidating similarly named and nested Suites', ->
    it 'returns the same Suite', ->
      suite1 = bdd.describe 'Foo', ->
      suite2 = bdd.describe 'Foo', ->
      expect(suite1).to.equal suite2


    it 'appends [before] handlers from different declarations to the same Suite', ->
      fn1 = ->
      fn2 = ->
      suite1 = bdd.describe 'Foo', ->
        bdd.before(fn1)
      suite2 = bdd.describe 'Foo', ->
        bdd.before(fn2)

      expect(suite1).to.equal suite2
      expect(suite1.beforeHandlers[0]).to.equal fn1
      expect(suite1.beforeHandlers[1]).to.equal fn2



    it 'appends [specs] different declarations to the same Suite', ->
      spec1 = null
      spec2 = null
      suite1 = bdd.describe 'Foo', ->
        spec1 = bdd.it 'foo'
      suite2 = bdd.describe 'Foo', ->
        spec2 = bdd.it 'foo'

      expect(suite1).to.equal suite2
      expect(suite1.specs[0]).to.equal spec1
      expect(suite1.specs[1]).to.equal spec2


  # ----------------------------------------------------------------------------


  describe '[onSuiteCreated] callback', ->
    it 'invokes the callback and returns the suite', ->
      suite = null
      bdd.onSuiteCreated (s) -> suite = s
      bdd.describe 'Foo', ->
      expect(suite.name).to.equal 'Foo'

    it 'invokes callback with the custom context', ->
      context = { foo:123 }
      bdd.contextFactory = -> context
      self = null
      bdd.onSuiteCreated (s) -> self = @
      bdd.describe 'foo', ->
      expect(self).to.equal context

    it 'invokes callback for entire hierarchy', ->
      suites = []
      bdd.onSuiteCreated (suite) -> suites.push(suite)
      bdd.describe 'root::child::grandChild'
      expect(suites.length).to.equal 3
      expect(suites[0].name).to.equal 'root'
      expect(suites[1].name).to.equal 'child'
      expect(suites[2].name).to.equal 'grandChild'

    it 'clears the handlers on reset', ->
      suite = null
      bdd.onSuiteCreated (s) -> suite = s
      bdd.reset()
      bdd.describe 'Foo', ->
      expect(suite).to.equal null



  # ----------------------------------------------------------------------------


  describe '[suite.walk] method', ->
    it 'does not invoke specs', ->
      spec = null
      count = 0
      suite = bdd.describe 'foo', ->
        spec = bdd.it 'does', -> count += 1
      suite.walk ->
      expect(count).to.equal 0


    it 'does not get invoked', ->
      count = 0
      suite = null
      root = bdd.describe('foo')
      root.walk (s) ->
          suite = s
          count += 1
      expect(count).to.equal 1
      expect(suite).to.equal root


    it 'invokes with the [global] context', ->
      self = null
      root = bdd.describe 'root', ->
      root.walk -> self = @
      expect(self).to.equal global


    it 'invokes with the factory [this] context', ->
      self = null
      custom = { foo:123 }
      bdd.contextFactory = -> custom
      root = bdd.describe 'root', ->
      root.walk -> self = @
      expect(self).to.equal custom


    it 'invokes child suites', ->
      invoked = []
      suite1 = null
      suite2 = null
      suite3 = null
      root = bdd.describe 'root', ->
        suite1 = bdd.describe 'one'
        suite2 = bdd.describe 'two'
        suite3 = bdd.describe 'three'
      root.walk (suite) -> invoked.push(suite)
      expect(invoked).to.eql [root, suite1, suite2, suite3]


    it 'invokes grand-child suites (deep)', ->
      invoked = []
      suite1 = null
      suite2 = null
      suite3 = null
      root = bdd.describe 'root', ->
        suite1 = bdd.describe 'one', ->
          suite2 = bdd.describe 'two', ->
            suite3 = bdd.describe 'three'
      root.walk (suite) -> invoked.push(suite)
      expect(invoked).to.eql [root, suite1, suite2, suite3]


    it 'does not invoke a skipped suite', ->
      invoked = []
      suite1 = null
      suite2 = null
      suite3 = null
      root = bdd.describe 'root', ->
        suite1 = bdd.describe 'one', ->
          suite2 = bdd.describe.skip 'two', ->
            suite3 = bdd.describe 'three'
      root.walk (suite) -> invoked.push(suite)
      expect(invoked).to.eql [root, suite1]

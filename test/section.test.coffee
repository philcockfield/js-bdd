_ = require('lodash')
expect = require('chai').expect
bdd = require('../src')



describe 'section', ->
  beforeEach ->
    bdd.reset()

  it 'throw an error if not declared within a suite', ->
    fn = ->
      bdd.section 'Fail', ->
    expect(fn).to.throw(/Section must be declared within a suite/)


  it 'does not have a [sections] array', ->
    suite = bdd.describe 'Foo'
    expect(suite.sections).to.equal undefined


  it 'return a section model', ->
    section = null
    suite = bdd.describe 'Foo', ->
      section = bdd.section 'MySection'
    expect(section.name).to.equal 'MySection'
    expect(section.suite).to.equal suite

  it 'ensures the section is named', ->
    section1 = null
    section2 = null
    section3 = null
    suite = bdd.describe 'Foo', ->
      section1 = bdd.section()
      section2 = bdd.section(null)
      section3 = bdd.section('  ')
    expect(section1.name).to.equal 'Unnamed'
    expect(section2.name).to.equal 'Unnamed'
    expect(section3.name).to.equal 'Unnamed'


  it 'stores a reference to the `section` on the child spec', ->
    section = null
    spec = null
    suite = bdd.describe 'Foo', ->
      section = bdd.section 'MySection', ->
        spec = bdd.it 'does something'
    expect(spec.section).to.equal section
    expect(suite.specs).to.eql [spec]


  it 'stores a reference to the `section` on the child suite', ->
    section = null
    childSuite = null
    suite = bdd.describe 'Foo', ->
      section = bdd.section 'MySection', ->
        childSuite = bdd.describe 'Child'
    expect(childSuite.section).to.equal section
    expect(suite.childSuites).to.eql [childSuite]


  it 'stores the sections on the parent suite', ->
    suite = bdd.describe 'Foo', ->
      bdd.section 'one', ->
      bdd.section 'two', ->
    expect(suite.sections.length).to.equal 2
    expect(suite.sections[0].name).to.equal 'one'
    expect(suite.sections[1].name).to.equal 'two'


  it 'throw an error if a section is created within a section', ->
    fn = ->
      bdd.describe 'Foo', ->
        bdd.section 'one', ->
          bdd.section 'two', ->
    expect(fn).to.throw(/Cannot nest sections/)


  it 'invokes with the default context', ->
    self = null
    bdd.describe 'Foo', ->
      bdd.section 'MySection', ->
        self = @
    expect(self).to.equal (global ? window)


  it 'invokes with a custom context', ->
    self = null
    type = null
    bdd.contextFactory = (t) ->
      type = t
      { foo:123 }
    self = null
    suite = bdd.describe 'Foo', ->
      bdd.section 'MySection', ->
        self = @
    expect(type).to.equal 'section'
    expect(self).to.eql { foo:123, suite:suite }


  # ----------------------------------------------------------------------------


  describe '`items` method', ->
    it 'retrieves all child items (specs and suites)', ->
      section = null
      childSpec = null
      childSuite = null
      suite = bdd.describe 'Foo', ->
        bdd.it 'Foo'
        bdd.describe 'Bar'
        section = bdd.section 'MySection', ->
          childSuite = bdd.describe 'Child Suite'
          childSpec  = bdd.it 'Child Spec'
          bdd.it.skip 'Skipped'
      items = section.items()
      expect(items).to.eql [childSuite, childSpec]


    it 'retrieves child specs only', ->
      spec = null
      section = null
      bdd.describe 'Foo', ->
        section = bdd.section 'MySection', ->
          bdd.describe 'Child Suite'
          spec = bdd.it 'Child Spec'
          bdd.it.skip 'Skipped'
      expect(section.specs()).to.eql [spec]

    it 'retrieves child suites only', ->
      suite = null
      section = null
      bdd.describe 'Foo', ->
        section = bdd.section 'MySection', ->
          suite = bdd.describe 'Child Suite'
          bdd.describe.skip 'Skipped'
          bdd.it 'Child Spec1'
      expect(section.suites()).to.eql [suite]


    it 'does not include skipped items', ->
      section = null
      bdd.describe 'Foo', ->
        section = bdd.section 'MySection', ->
          bdd.describe.skip 'Child Suite'
          bdd.it.skip 'Child Spec'
      expect(section.items()).to.eql []

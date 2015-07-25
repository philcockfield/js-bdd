expect = require('chai').expect
bdd = require('../src')



describe 'Filter', ->
  beforeEach ->
    bdd.reset()


  describe 'fuzzy matching', ->
    getMatch = (name, pattern) -> bdd.describe(name).filter(pattern)

    it 'does not match empty', ->
      expect(getMatch('Root', '')).to.equal undefined
      expect(getMatch('Root', ' ')).to.equal undefined
      expect(getMatch('Root', null)).to.equal undefined
      expect(getMatch('Root')).to.equal undefined
      expect(getMatch('Root', undefined)).to.equal undefined

    it 'matches exact text', ->
      match = bdd.describe('Root').filter('Root')
      expect(match).not.to.equal undefined

    it 'matches case difference', ->
      match = bdd.describe('Root').filter('rOOT')
      expect(match).not.to.equal undefined

    it 'matches two words', ->
      match = bdd.describe('One Two').filter('one two')
      expect(match).not.to.equal undefined

    it 'matches trimmed filter pattern', ->
      match = bdd.describe('Root').filter('   Root        ')
      expect(match).not.to.equal undefined

    it 'matches beginning and end', ->
      match = bdd.describe('Root').filter('rT')
      expect(match).not.to.equal undefined

    it 'not a matche because of suffix', ->
      match = bdd.describe('Root').filter('rT1')
      expect(match).to.equal undefined




  describe 'on a single suite', ->
    it 'does not match on the suite name', ->
      suite = bdd.describe 'Root', ->
      match = suite.filter('z')
      expect(match).to.eql undefined


    it 'matches on the suite name (case insensitive)', ->
      suite = bdd.describe 'Root', ->
      result = suite.filter('oT')
      expect(result.id).to.equal suite.id


    it 'returns a clone', ->
      suite = bdd.describe 'Root', ->
        bdd.describe 'Child'
      result = suite.filter('oT')
      expect(result).not.to.equal suite # It is a clone.
      expect(result.childSuites).not.to.equal suite.childSuites # The child array is a clone.


    it 'returns the filtered suite when a child matches', ->
      childMatch = null
      suite = bdd.describe 'Root', ->
        bdd.describe 'Foo' # No match.
        childMatch = bdd.describe 'Jordan'
        bdd.describe 'Bar' # No match.
      result = suite.filter('oRd')
      expect(result.name).to.equal 'Root'
      expect(result.childSuites).to.eql [childMatch]


    it 'includes all children of the matched suite', ->
      suite = bdd.describe 'Root', ->
        bdd.describe 'Foo' # No match.
        childMatch = bdd.describe 'Jordan', ->
          bdd.describe 'a'
          bdd.describe 'b', ->
            bdd.describe 'c'
      result = suite.filter('oRd')
      expect(result.childSuites[0].childSuites[0].name).to.equal 'a'
      expect(result.childSuites[0].childSuites[1].name).to.equal 'b'
      expect(result.childSuites[0].childSuites[1].childSuites[0].name).to.equal 'c'

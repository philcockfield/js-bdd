expect = require('chai').expect
bdd = require('../src')


# ----------------------------------------------------------------------------


describe '[before] handler', ->
  it 'stores a [before] handler', ->
    fn = ->
    suite = bdd.describe 'foo', -> bdd.before(fn)
    expect(suite.beforeHandlers[0]).to.equal fn


  it 'invokes a before handler with no context and no args', ->
    context = null
    args = null
    fn = (a...) ->
      context = @
      args = a
    suite = bdd.describe 'foo', -> bdd.before(fn)
    suite.beforeHandlers.invoke()
    expect(context).to.equal global
    expect(args).to.eql []


  it 'invokes a before handler with the given context and args', ->
    context = null
    args = null
    fn = (a...) ->
      context = @
      args = a
    suite = bdd.describe 'foo', -> bdd.before(fn)
    suite.beforeHandlers.invoke({foo:123}, 'hello')
    expect(context).to.eql {foo:123}
    expect(args).to.eql ['hello']

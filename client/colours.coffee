prefs = require './prefs'
{join} = require './util'

@defaults = defaults = [
  ['number',           '#888888']
  ['string',           '#008888']
  ['zilde',            '#000088']
  ['name',             '#888888']
  ['global-name',      '#000000']
  ['quad-name',        '#880088']
  ['function',         '#000088']
  ['monadic-operator', '#0000ff']
  ['dyadic-operator',  '#0000ff']
  ['namespace',        '#888888']
  ['assignment',       '#0000ff']
  ['diamond',          '#0000ff']
  ['paren',            '#0000ff']
  ['bracket',          '#0000ff']
  ['semicolon',        '#0000ff']
  ['dfn',              '#0000ff']
  ['dfn1',             '#0000ff']
  ['dfn2',             '#0000ff']
  ['dfn3',             '#0000ff']
  ['tradfn',           '#888888']
  ['keyword',          '#880000']
  ['idiom',            '#0000ff']
  ['comment',          '#008888']
  ['error',            '#ff0000']
]

prefs.colours updateStyle = (h = {}) ->
  $('#col-style').text join defaults.map ([x, d]) -> ".cm-apl-#{x}{color:#{h[x] || d}}"
  return

updateStyle()

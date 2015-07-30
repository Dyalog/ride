# a kitchen sink for small generic functions and jQuery plugins

@inherit = (x) -> (F = ->):: = x; new F # JavaScript's prototypal inheritance
@cat = (x) -> [].concat x...            # array  concatenation, like ⊃,/ in APL
@join = (a) -> a.join ''                # string concatenation, like ⊃,/ in APL
@dict = (pairs) -> r = {}; (for [k, v] in pairs then r[k] = v); r # construct a dictionary from key-value pairs
@chr = String.fromCharCode              # convert code point to character, like chr() in Python or ⎕ucs N in APL
@ord = (x) -> x.charCodeAt 0            # convert character to code point, like ord() in Python or ⎕ucs'' in APL
@zip = (a, b) -> n = Math.min a.length, b.length; i = -1; while ++i < n then [a[i], b[i]] # like zip() in Python or ,¨ in APL
@hex = (x, n = 0) -> s = x.toString 16; (while s.length < n then s = '0' + s); s.toUpperCase()
@qw = (s) -> s.split /[ \r\n]+/         # "quoted words" like in Perl
@delay = (n, f) -> setTimeout f, n      # setTimeout⍨ is much more convenient than setTimeout
@spc = (n) -> Array(n + 1).join ' '
@last = (a) -> a[a.length - 1]

htmlChars = '<': '&lt;', '>': '&gt;', '&': '&amp;', "'": '&amp;', '"': '&quot;'
@esc = (s) -> s.replace /[<>&'"]/g, (x) -> htmlChars[x]

@onCodeMirrorDoubleClick = (cm, f) ->
  # CodeMirror supports 'dblclick' events but they are unreliable and seem to require rather a short time between the two clicks
  # So, let's track clicks manually:
  lct = lcx = lcy = 0 # last click's timestamp, x, and y
  cm.on 'mousedown', (cm, e) ->
    if e.timeStamp - lct < 400 && Math.abs(lcx - e.x) + Math.abs(lcy - e.y) < 10 &&
          !$(e.target).closest('.CodeMirror-gutter-wrapper').length
      f e
    lct = e.timeStamp; lcx = e.x; lcy = e.y; return

$.alert = (message, title, callback) ->
  $('<p>').text(message).dialog modal: 1, title: title, buttons: [
    text: 'OK', click: -> $(@).dialog 'close'; callback?(); return
  ]
  return

$.fn.insert = (s) -> @each -> # replace selection in an <input> or <textarea> with s
  if !@readOnly
    if (i = @selectionStart)? && (j = @selectionEnd)? # TODO: IE
      @value = @value[...i] + s + @value[j..]; @selectionStart = @selectionEnd = i + s.length
  return

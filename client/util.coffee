# a kitchen sink for small generic functions and jQuery plugins

@inherit = (x) -> (F = ->):: = x; new F # JavaScript's prototypal inheritance
@cat = (x) -> [].concat x... # ⊃,/
@dict = (pairs) -> r = {}; (for [k, v] in pairs then r[k] = v); r
@chr = String.fromCharCode
@ord = (x) -> x.charCodeAt 0
@join = (a) -> a.join ''                                                           
@zip = (a, b) -> n = Math.min a.length, b.length; i = -1; while ++i < n then [a[i], b[i]]
@hex = (x, n = 0) -> s = x.toString 16; (while s.length < n then s = '0' + s); s.toUpperCase()

htmlChars = '<': '&lt;', '>': '&gt;', '&': '&amp;'
@esc = (s) -> s.replace /[<>&]/g, (x) -> htmlChars[x]

@onCodeMirrorDoubleClick = (cm, f) ->
  # CodeMirror supports 'dblclick' events but they are unreliable and seem to require rather a short time between the two clicks
  # So, let's track clicks manually:
  lct = lcx = lcy = 0 # last click's timestamp, x, and y
  cm.on 'mousedown', (cm, e) ->
    if e.timeStamp - lct < 400 && Math.abs(lcx - e.x) + Math.abs(lcy - e.y) < 10 then f e
    lct = e.timeStamp; lcx = e.x; lcy = e.y; return
  return

$.alert = (message, title, callback) ->
  $('<p>').text(message).dialog modal: 1, title: title, buttons: [
    text: 'OK', click: -> $(@).dialog 'close'; callback?(); return
  ]
  return

$.fn.insert = (s) -> @each -> # replace selection in an <input> or <textarea> with "s"
  if (x = @selectionStart)? && (y = @selectionEnd)?
    @value = @value[...x] + s + @value[y..]; @selectionStart = @selectionEnd = x + s.length
  return # TODO: IE

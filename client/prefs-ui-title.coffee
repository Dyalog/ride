prefs = require './prefs'

$wt = null
@name = 'Title'
@init = ($e) ->
  $e.html """
    Window title: <input class=text-field>
    <pre>
    <a href=#>{WSID}</a>            workspace name
    <a href=#>{HOST}</a>:<a href='#'>{PORT}</a>     interpreter's TCP endpoint
    <a href=#>{PID}</a>             PID of the interpreter process
    <a href=#>{CHARS}</a>           Unicode or Classic
    <a href=#>{BITS}</a>            64 or 32
    <a href=#>{VER}</a>             interpreter version
      <a href=#>{VER_A}</a>           major
      <a href=#>{VER_B}</a>           minor
      <a href=#>{VER_C}</a>           svn revision
    <a href=#>{RIDE_VER}</a>        RIDE version
      <a href=#>{RIDE_VER_A}</a>      major
      <a href=#>{RIDE_VER_B}</a>      minor
      <a href=#'>{RIDE_VER_C}</a>      git commit number
    </pre>
  """
  $e.on 'click', 'pre a', (e) -> $wt.insert $(e.target).text(); return
  $('pre a', $e).attr 'title', 'Insert'; $wt = $ 'input', $e; return
@load = -> $wt.val prefs.windowTitle(); return
@save = -> prefs.windowTitle $wt.val(); return

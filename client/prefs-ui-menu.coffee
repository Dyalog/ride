prefs = require './prefs'
@name = 'Menu'
@init = ($e) -> $e.html '<textarea id=prefs-menu wrap=off></textarea><label>*requires restart</label>'; return
@load = -> $('#prefs-menu').val prefs.menu(); return
@save = -> prefs.menu $('#prefs-menu').val(); return

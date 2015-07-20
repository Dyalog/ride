# converted to CoffeeScript from node_modules/codemirror/addon/fold/foldgutter.js

CodeMirror.defineOption 'foldGutter', false, (cm, val, old) ->
  if old && old != CodeMirror.Init
    cm.clearGutter cm.state.foldGutter.options.gutter
    cm.state.foldGutter = null
    cm.off 'gutterClick', onGutterClick
    cm.off 'change', onChange
    cm.off 'viewportChange', onViewportChange
    cm.off 'fold', onFold
    cm.off 'unfold', onFold
    cm.off 'swapDoc', updateInViewport
  if val
    cm.state.foldGutter = new State parseOptions val
    updateInViewport cm
    cm.on 'gutterClick', onGutterClick
    cm.on 'change', onChange
    cm.on 'viewportChange', onViewportChange
    cm.on 'fold', onFold
    cm.on 'unfold', onFold
    cm.on 'swapDoc', updateInViewport
  return

{Pos} = CodeMirror

State = (@options) -> @from = @to = 0; return

parseOptions = (opts) ->
  if opts == true then opts = {}
  if !opts.gutter?          then opts.gutter          = 'CodeMirror-foldgutter'
  if !opts.indicatorOpen?   then opts.indicatorOpen   = 'CodeMirror-foldgutter-open'
  if !opts.indicatorFolded? then opts.indicatorFolded = 'CodeMirror-foldgutter-folded'
  opts

isFolded = (cm, line) ->
  for m in cm.findMarksAt Pos line when m.__isFold && m.find().from.line == line then return m
  return

marker = (spec) ->
  if typeof spec == 'string'
    elt = document.createElement 'div'
    elt.className = spec + ' CodeMirror-guttermarker-subtle'
    elt
  else
    spec.cloneNode true

updateFoldInfo = (cm, from, to) ->
  opts = cm.state.foldGutter.options; cur = from
  minSize = cm.foldOption opts, 'minFoldSize'
  func = cm.foldOption opts, 'rangeFinder'
  cm.eachLine from, to, (line) ->
    mark = null
    if isFolded cm, cur
      mark = marker opts.indicatorFolded
    else
      pos = Pos cur, 0; range = func && func cm, pos
      if range && range.to.line - range.from.line >= minSize then mark = marker opts.indicatorOpen
    cm.setGutterMarker line, opts.gutter, mark
    ++cur
    return
  return

updateInViewport = (cm) ->
  vp = cm.getViewport(); state = cm.state.foldGutter
  if state then cm.operation(-> updateFoldInfo cm, vp.from, vp.to; return); state.from = vp.from; state.to = vp.to
  return

onGutterClick = (cm, line, gutter) ->
  state = cm.state.foldGutter; if !state then return
  opts = state.options; if gutter != opts.gutter then return
  folded = isFolded cm, line; if folded then folded.clear() else cm.foldCode Pos(line, 0), opts.rangeFinder
  return

onChange = (cm) ->
  state = cm.state.foldGutter; if !state then return
  opts = state.options; state.from = state.to = 0; clearTimeout state.changeUpdate
  state.changeUpdate = setTimeout (-> updateInViewport cm; return), opts.foldOnChangeTimeSpan || 600
  return

onViewportChange = (cm) ->
  state = cm.state.foldGutter; if !state then return
  opts = state.options; clearTimeout state.changeUpdate
  state.changeUpdate = setTimeout(
    ->
      vp = cm.getViewport()
      if state.from == state.to || vp.from - state.to > 20 || state.from - vp.to > 20
        updateInViewport cm
      else
        cm.operation ->
          if vp.from < state.from then updateFoldInfo cm, vp.from, state.from; state.from = vp.from
          if vp.to   > state.to   then updateFoldInfo cm, state.to,     vp.to; state.to   = vp.to
          return
      return
    opts.updateViewportTimeSpan || 400
  )
  return

onFold = (cm, from) ->
  state = cm.state.foldGutter; if !state then return
  {line} = from
  if line >= state.from && line < state.to then updateFoldInfo cm, line, line + 1
  return

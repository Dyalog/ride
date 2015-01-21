D.about = ->
  v = D.versionInfo; i = D.remoteIdentification || {}; u = 'unknown'
  info = """
    IDE version: #{v.version || u}
    IDE date: #{v.date || u}

    IDE git commit: #{v.rev || u}
    Platform: #{navigator.platform || u}
    User agent: #{navigator.userAgent || u}
    Interpreter version: #{i.version || u}
    Interpreter edition: #{i.arch || u}
  """
  buttons = []
  if D.nwjs then buttons.push text: 'Copy', click: ->
    require('nw.gui').Clipboard.get().set $('textarea', @).val(), 'text'; return
  buttons.push text: 'Close', click: -> $(@).dialog 'close'
  $("""
    <div class="about">
      <div class="logo">
        <div class="contact-info">
          <span title="Dyalog's UK phone number">+44 (0)1256 830030</span><br>
          <a href="mailto:support@dyalog.com?subject=IDE&body=#{escape '\n--\n' + info}"
             title="Populate an email draft with the information below">support@dyalog.com</a><br>
          <a href="http://www.dyalog.com/" target="_blank"
             title="Open Dyalog's website in a new window">www.dyalog.com</a>
        </div>
      </div>
      <div class="textarea-wrapper">
        <textarea readonly wrap="off"></textarea>
      </div>
    </div>
  """)
    .dialog
      modal: 1, title: 'About', width: 500, height: 400, buttons: buttons
      open: -> $(@).find('textarea').focus()
    .find('textarea').val(info).select()
  return

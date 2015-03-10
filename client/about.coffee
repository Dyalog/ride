module.exports = ->
  v = D.versionInfo; i = D.remoteIdentification || {}; u = 'unknown'
  info = """
    IDE:
      Version: #{v.version || u}
      Platform: #{navigator.platform || u}
      Date: #{v.date || u}
      Git commit: #{v.rev || u}
      User agent: #{navigator.userAgent || u}

    Interpreter:
      Version: #{i.version || u}
      Platform: #{i.platform || u}
      Edition: #{i.arch || u}
      Date: #{if i.date then i.date else u}
  """
  buttons = []
  if D.clipboardCopy then buttons.push text: 'Copy', click: -> D.clipboardCopy $('textarea', @).val(), 'text'; return
  buttons.push text: 'Close', click: -> $(@).dialog 'close'
  $("""
    <div class="about">
      <div class="logo">
        <div class="contact-info">
          <span title="Dyalog's UK phone number">+44 (0)1256 830030</span><br>
          <a href="mailto:support@dyalog.com?subject=RIDE&body=#{escape '\n--\n' + info}"
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
      modal: 1, title: 'About', width: 520, height: 410, buttons: buttons
      open: -> $(@).find('textarea').focus()
    .find('textarea').val(info).select()
  return

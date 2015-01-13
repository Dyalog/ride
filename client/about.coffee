Dyalog.about = ->
  v = Dyalog.versionInfo
  info = """
    IDE version: #{v.version}
    Date: #{v.date}
    Git commit: #{v.rev}
    Platform: #{navigator.platform}
    User agent: #{navigator.userAgent}
  """
  buttons = []
  if require? then buttons.push text: 'Copy', click: ->
    require('nw.gui').Clipboard.get().set($('textarea', @).val(), 'text'); return
  buttons.push text: 'Close', click: -> $(@).dialog 'close'
  $("""
    <div class="about">
      <div class="logo">
        <div class="contact-info">
          +44 (0)1256 830030<br>
          <a href="mailto:support@dyalog.com?body=#{escape info}">support@dyalog.com</a><br>
          <a href="http://www.dyalog.com/" target="_blank">www.dyalog.com</a>
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

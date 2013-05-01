$(document).ready(function () {
  var messages = $('.chat-window .messages')
    , messageBox = $('.chat-window .message-box textarea')

  // autoresize the text area when text starts to fill it up
  messageBox.autosize()

  // connect to the chat socket
  var chat = io.connect('http://' + __oolong__wshost + '/chat')

  messageBox.bind('enterKey', function (e) {
    e.preventDefault()
    chat.emit('messageSent', {text: $(messageBox).val()})
    $(messageBox).val('')
  })

  // enter key sends the message, set up the trigger
  messageBox.keyup(function (e) {
    if (e.keyCode == 13) $(this).trigger('enterKey')
  })

  chat.on('message', function (data) {
    messages.append('<p>' + data.text + '</p>')
  })
})

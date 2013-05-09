$(document).ready(function () {
  var messages = $('.chat-window .messages')
    , messageBox = $('.chat-window .message-box textarea')
    , user_source = $('#user-template').html()
    , user_template = Handlebars.templates.user
    , users = $('.app-container .sidebar .users')

  // autoresize the text area when text starts to fill it up
  messageBox.autosize()

  // connect to the chat socket
  var chat = io.connect('http://' + __oolong__wshost + '/chat')
  
  messageBox.bind('enterKey', function (e) {
    e.preventDefault()
    chat.emit('message.sent', {text: $(messageBox).val()})
    $(messageBox).val('')
  })

  // enter key sends the message, set up the trigger
  messageBox.keyup(function (e) {
    if (e.keyCode == 13) $(this).trigger('enterKey')
  })
  
  chat.on('connect', function () {
    chat.emit('user.ping')
    console.dir(USER_SESSION)
    console.log(user_template(USER_SESSION))
    users.append(user_template(USER_SESSION))
  })

  // chat.on('user.pong', function (user) {
  //   users.append(user_template(user))
  // })
  // 
  // chat.on('user.left', function (user_id) {
  //   $('div [data-user-id='+user_id+']')
  // })

  chat.on('message.received', function (data) {
    messages.append('<p>' + data.text + '</p>')
  })
})

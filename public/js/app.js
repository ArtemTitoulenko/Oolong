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
    chat.emit('message.sent', {text: $(messageBox).val(), user: __oolong__user_session})
    $(messageBox).val('')
  })

  // enter key sends the message, set up the trigger
  messageBox.keyup(function (e) {
    if (e.keyCode == 13) $(this).trigger('enterKey')
  })

  chat.on('connect', function () {
    chat.emit('user.ping', __oolong__user_session.id, function (confirmation) {
      if (confirmation !== true) {
        console.error('could not authenticate')
      }
    })
  })

  chat.on('user.list', function (user_list) {
    users.empty()

    for (var user in user_list) {
      (function (user) {
        var compiled_user = user_template(user)

        $('img', compiled_user).bind('load', function () {
          users.append(compiled_user)
        })
      })(user_list[user])
    }
  })

  chat.on('user.left', function (user_id) {
    $('div [data-user-id='+user_id+']').remove()
  })

  chat.on('user.join', function (user) {
    var compiled_user = user_template(user)

    $('img', compiled_user).bind('load', function () {
      users.append(compiled_user)
    })
  })

  chat.on('message.received', function (data) {
    messages.append('<p><b>' + data.user.name + ':</b> ' + data.text + '</p>')
  })
})

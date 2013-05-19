var express = require('express')
  , crypto = require('crypto')
  , routes = require('./routes')
  , user = require('./routes/user')
  , http = require('http')
  , path = require('path')
  , _ = require('underscore')
  , passport = require('passport')
  , LocalStrategy = require('passport-local').Strategy


var app = express()
  , server = http.Server(app)
  , io = require('socket.io').listen(server)

// all environments
app.set('port', process.env.PORT || 3000)
app.set('views', __dirname + '/views')
app.set('view engine', 'jade')
app.use(express.favicon())
app.use(express.logger('dev'))
app.use(express.bodyParser())
app.use(express.methodOverride())
app.use(express.cookieParser())
app.use(express.session({secret: '460ddf6eb1ea6353dedefbb435067e6a5a46ba4b'}))
app.use(passport.initialize())
app.use(passport.session())
app.use(app.router)
app.use(express.static(path.join(__dirname, 'public')))

// development only
if ('development' == app.get('env')) {
  app.use(express.errorHandler())
}

app.set('users'
  , [
      { password: 'foo', email: 'artem.titoulenko@gmail.com', name: 'Artem', id: 1 }
    , { password: 'bar', email: 'maltz@yelp.com', name: 'Jon', id: 2}
    , { password: 'baz', email: 'grardb@etsy.com', name: 'Gerard', id: 3}
    , { password: 'cats', email: 'kruzinova@gmail.com', name: 'Karina', id: 4}
])

// Passport configuration
passport.use(new LocalStrategy(
  function (email, password, done) {
    var user = _.findWhere(app.get('users'), {email: email, password: password})

    if ( _.isObject(user) ) {
      done(null, user)
    } else {
      done(null, false, { message: 'That email/password combination doens\'t seem to exist' })
    }
  }
))

passport.serializeUser(function(user, done) {
  done(null, user.id)
})

passport.deserializeUser(function(id, done) {
  var user = _.findWhere(app.get('users'), {id: id})
  done(null, user)
})

// Actual routes
app.get('/', routes.index)
app.get('/room', ensureAuthenticated, routes.room)

app.get('/login', routes.login)
app.post('/login', passport.authenticate('local', { failureRedirect: '/login' }), function (req, res) {
  if (req.user.photo == null) {
    var md5dgst = crypto.createHash('md5')

    md5dgst.update(req.user.email)
    req.user.photo = 'http://gravatar.com/avatar/' + md5dgst.digest('hex')
  }

  res.redirect('/room')
})

app.get('/logout', function (req,res) {
  req.logout()
  res.redirect('/')
})

var connected_users = []

var chat = io
  .of('/chat')
  .on('connection', function (socket) {

  socket.on('user.ping', function (id, fn) {
    var user = _.findWhere(app.get('users'), {id: id})

    if (user === null) {
      fn(false)
      socket.close()
    }

    if (!_.contains(connected_users, user)) {
      socket.set('user', user, function () {
        connected_users.push(user)
        socket.emit('user.list', connected_users)
        socket.broadcast.emit('user.join', user)
      })
    } else {
      fn(false)
    }
  })

  socket.on('message.sent', function (data) {
    chat.emit('message.received', {text: data.text, user: data.user})
  })

  socket.on('disconnect', function () {
    socket.get('user', function (err, user) {
      console.log(user.email + ' is leaving')
      connected_users = _.without(connected_users, user)

      console.dir(connected_users)

      chat.emit('user.left', user.id)
    })
  })
})

server.listen(app.get('port'), function(){
  console.log('Express server listening on port ' + app.get('port'))
})

function ensureAuthenticated(req, res, next) {
  if (req.isAuthenticated()) { return next() }
  res.redirect('/login')
}

var express = require('express')
  , crypto = require('crypto')
  , md5dgst = crypto.createHash('md5')
  , routes = require('./routes')
  , user = require('./routes/user')
  , http = require('http')
  , path = require('path')
  , _ = require('underscore')
  , passport = require('passport')
  , LocalStrategy = require('passport-local').Strategy;


var app = express()
  , server = http.Server(app)
  , io = require('socket.io').listen(server)

// all environments
app.set('port', process.env.PORT || 3000);
app.set('views', __dirname + '/views');
app.set('view engine', 'jade');
app.use(express.favicon());
app.use(express.logger('dev'));
app.use(express.bodyParser());
app.use(express.methodOverride());
app.use(express.cookieParser());
app.use(express.session({secret: '460ddf6eb1ea6353dedefbb435067e6a5a46ba4b'}));
app.use(passport.initialize());
app.use(passport.session());
app.use(app.router);
app.use(express.static(path.join(__dirname, 'public')));

// development only
if ('development' == app.get('env')) {
  app.use(express.errorHandler());
}

app.set('users'
  , [
      { password: 'foo', email: 'artem.titoulenko@gmail.com', id: 1 }
    , { password: 'bar', email: 'maltz@yelp.com', id: 2}
    , { password: 'baz', email: 'grardb@etsy.com', id: 3}
    , { password: 'cats', email: 'kruzinova@gmail.com', id: 4}
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
app.get('/', routes.index);
app.get('/room', ensureAuthenticated, routes.room);

app.get('/login', routes.login)
app.post('/login', passport.authenticate('local', { failureRedirect: '/login' }), function (req, res) {
  if (req.user.photo == null) {
    md5dgst.update(req.user.email)
    var d = md5dgst.digest('hex')
    
    http.get('http://www.gravatar.com/' + d + '.json', function (get_result) {
      if (get_result.statusCode == 200) {
        var user = JSON.parse(get_result.body);
        
        console.log('got a 200')
        req.user.photo = user.entry[0].thumbnailUrl;
        console.log('setting ' + req.user.email + '\'s photo to: ' + req.user.photo)
      } else {
        console.log('result: ')
        console.dir(get_result.body)
      }
    })
  }

  res.redirect('/room')
})

app.get('/logout', function (req,res) {
  req.logout()
  res.redirect('/')
})

var chat = io
  .of('/chat')
  .on('connection', function (socket) {
  socket.on('messageSent', function (data) {
    chat.emit('message', {text: data.text})
  })
})

server.listen(app.get('port'), function(){
  console.log('Express server listening on port ' + app.get('port'));
});

function ensureAuthenticated(req, res, next) {
  if (req.isAuthenticated()) { return next(); }
  res.redirect('/login')
}

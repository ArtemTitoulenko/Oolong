var _ = require('underscore')

exports.index = function(req, res){
  res.render('index')
}

exports.login = function (req, res) {
  res.render('login', {})
}

exports.room = function (req, res) {
  var user = _.omit(req.user, 'password')
  res.render('room', {user: user, host: req.headers.host})
}

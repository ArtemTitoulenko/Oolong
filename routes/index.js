exports.index = function(req, res){
  res.render('index')
}

exports.login = function (req, res) {
  res.render('login', {})
}

exports.room = function (req, res) {
  console.log('user: ' + req.user)
  var user = req.user

  res.render('room', {user: req.user})
}

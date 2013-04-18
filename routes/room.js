

exports.index = function (req, res) {
  var user = {name: 'Artem Titoulenko'}

  res.render('room', {user: user})
}

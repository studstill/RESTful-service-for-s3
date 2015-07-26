var express = require('express');
var app = express();
var mongoose = require('mongoose');
var port = process.env.PORT || 3000;

mongoose.connect(process.env.MONGOLAB_URI || 'mongodb://localhost/users');

var userRouter = express.Router();
require('./routers/user-router')(userRouter);
app.use('/users', userRouter);

catchAllMessage = {msg: 'Please direct your URI to a valid endpoint.',
  endpoints: ['/users']};


app.all('*', function(req, res) {
  catchAllMessage.error = '404 Not found';
  res.status(404).json(catchAllMessage);
});


app.listen(port, function() {
  console.log('server is listening at ' + port);
});

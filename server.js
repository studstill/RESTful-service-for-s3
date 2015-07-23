var express = require('express');
var app = express();
var mongoose = require('mongoose');
var port = process.env.PORT || 3000;
var userRouter = express.Router();

mongoose.connection(process.env.MONGOLAB_URI || 'mongodb://localhost/users');

require('./user-router')(userRouter);
app.use('/api', userRouter);


app.listen(port, function() {
  console.log('server is listening at ' + port);
});

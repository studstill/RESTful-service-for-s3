var express = require('express');
var app = express();
var mongoose = require('mongoose');
var port = process.env.PORT || 3000;
var userRouter = require('./routers/user-router');


mongoose.connect(process.env.MONGOLAB_URI || 'mongodb://localhost/users');


app.use('/users', userRouter);


app.listen(port, function() {
  console.log('server is listening at ' + port);
});

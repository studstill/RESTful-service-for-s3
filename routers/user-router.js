var mongoose = require('mongoose');
var bodyParser = require('body-parser');
var EventEmitter = require('events').EventEmitter;
var ee = new EventEmitter();
var User = require('../models/User');
var File = require('../models/File');
var AWS = require('aws-sdk');
var s3 = new AWS.S3();
var ourBucket = 'vihjayjay';

module.exports = function(router) {
  router.use(bodyParser.json());

  // list of Variables
  // router, mongoose, bodyParser, EventEmitter, ee, User, File, AWS, s3, ourBucket

  AWS.config.loadFromPath(__dirname + '/../config.json');

  // Handle GET and POST on /users
  require('./user-sub-routes/users.js')(router, mongoose, bodyParser,
    EventEmitter, ee, User, File, AWS, s3, ourBucket);

  // Handle GET, PUT, and DELETE on users/:user
  require('./user-sub-routes/users-user.js')(router, mongoose, bodyParser,
    EventEmitter, ee, User, File, AWS, s3, ourBucket);

  // Handle GET, POST, and DELETE on users/:user/files
  require('./user-sub-routes/users-user-files.js')(router, mongoose, bodyParser,
    EventEmitter, ee, User, File, AWS, s3, ourBucket);

  // Handle GET, PUT, and DELETE on users/:user/files
  require('./user-sub-routes/users-user-files-file.js')(router, mongoose,
    bodyParser, EventEmitter, ee, User, File, AWS, s3, ourBucket);

}


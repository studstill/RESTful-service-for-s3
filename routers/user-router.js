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

  AWS.config.loadFromPath(__dirname + '/../config.json');

  router.route('/')
    .get(function(req, res) {
      User.find({}, function(err, users) {
        if (err) {
          return res.status(500).json({msg: 'could not find users'});
        }
        res.json(users);
      });
    })
    .post(function(req, res) {
      var user = new User(req.body);
      user.save(function(err, user) {
        if (err) {
          return res.status(500).json({msg: 'user save did not work'});
        }
        res.json(user);
      });
    });

  router.route('/:user')
    .get(function(req, res) {
      var userId = req.params.user;
      User.findOne({username: userId}, function(err, user) {
        if (err) {
          return res.status(500).json({msg: 'could not find' + userId});
        }
        if(user) {
          res.json(user);
        } else {
          res.status(404).json({msg: '/user/' + userId + ' was not found'});
        }
      });
    })
    .put(function(req, res) {
      var userId = req.params.user;
      //rename a user and users bucket
      User.update({username: userId}, {$set: req.body}, function(err, user) {
        if (err) {
          return res.status(404).json({msg: 'could not update' + userId});
        }
        res.json(user);
      });
      //TODO USER BUCKET
    })
    .delete(function(req, res) {
      var userId = req.params.user;
      User.findOne({username: userId}, function(err, data) {
        if (err) {
          return res.status(500).json({msg: 'server error at /user/' + userId});
        }
        if(data) {
          data.remove();
          res.json({msg: 'user was deleted'});
        } else {
          res.status(404).json({msg: 'user was not found'});
        }
      })
    });

  router.route('/:user/files')
    .get(function(req, res) {
      var userId = req.params.user
      var info = [];
      User.findOne({username: userId}, function(err, user) {
        if (err) return console.log(err);
        console.log(user);
        for (var i = 0; i < user.files.length; i++) {
          (function(i) {
            var fileName = user.files[i];
            File.findById(fileName, function(err, file) {
              if (err) return console.log(err);
              info.push(file.fileName);
              if (i === user.files.length - 1) {
                ee.emit('listFiles', info);
              }
            });
          })(i);
        }
      });
      ee.on('listFiles', function(filesList) {
        res.json({files: filesList});
      });
    })
    .post(function(req, res) {
      var userId = req.params.user;
      var file = new File(req.body);

      User.findOne({username: userId}, function(err, user) {
        if (err) return console.log(err);
        user.files.push(file._id);
        user.save();
        console.log(user);
      });

      var params = {Bucket: ourBucket, Key: userId + '/' + file.fileName, Body: file.content };
      var url = s3.getSignedUrl('putObject', params, function(err, url) {
        if (err) return console.log(err);
        file.url = url;
      });
      
      s3.putObject(params, function(err, data) {
        if (err) return console.log(err);
        console.log('we did It!!!!!!');
      });

      file.save(function(err, file) {
        if (err) console.log(err);
        console.log(file);
      });

      // res.json({msg: 'got the /users/' +user + '/file post route!'});
    })
    .delete(function(req, res) {
      var userId = req.params.user;
      res.json({msg: 'got the /users/' +userId + '/file delete route!'});
    });


  router.route('/:user/files/:file')
    .get(function(req, res) {
      // var user = req.params.user
      // var file = req.params.file
      var userId = req.params.user
      var info;
      User.findOne({username: userId}, function(err, user) {
        for (var i = 0; i < user.files.length; i++) {
          (function(i) {
            var fileName = user.files[i];
            File.findById(fileName, function(err, file) {
              var params = {Bucket: ourBucket, Key: userId + '/' + file.fileName};
              s3.getObject(params, function(err, data) {
                if (err) return console.log(err);
                console.log(data.Body.toString());
              }); 
            });
          })(i);
        }
      });
      res.json({msg: 'got the /users/' + user + '/file/' + file + ' get route!'});
    })
    .put(function(req, res) {
      var user = req.params.user
      var file = req.params.file
      res.json({msg: 'got the /users/' +user + '/file/' + file +  ' put route!'});
    })
    .delete(function(req, res) {
      var user = req.params.user
      var file = req.params.file
      res.json({msg: 'got the /users/' +user + '/file/' + file +  ' delete route!'});
    });

}


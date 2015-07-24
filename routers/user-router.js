var mongoose = require('mongoose');
var bodyParser = require('body-parser');
var User = require('../models/User');
var File = require('../models/File');
var AWS = require('aws-sdk');
var s3 = new AWS.S3();


module.exports = function(router) {
  router.use(bodyParser.json());

/ / AWS.config.loadFromPath(__dirname + '/../config.json');

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
      /*User.remove({username: userId}, function(err) {
        if (err) {
          return res.status(500).json({msg: 'could not delete' + userId});
        }
        res.json({msg: 'deleted the /users/' + userId});
      });*/
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
      res.json({msg: 'got the /users/' + userId + '/file get route!'});
    })
    .post(function(req, res) {
      var userId = req.params.user

        var params = {Bucket: 'vihjayjay', Key: userId + '/' + req.body.fileName, Body: req.body.content };
        s3.putObject(params, function(err, data) {
          if (err) return console.log(err);
          console.log('we did It!!!!!!');
        });

      // res.json({msg: 'got the /users/' +user + '/file post route!'});
    })
    .delete(function(req, res) {
      var userId = req.params.user
      res.json({msg: 'got the /users/' +userId + '/file delete route!'});
    });


  router.route('/:user/files/:file')
    .get(function(req, res) {
      var user = req.params.user
      var file = req.params.file
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


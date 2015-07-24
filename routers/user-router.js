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

  router.route('/')
    /* DONE */
    .get(function(req, res) {
      User.find({}, function(err, users) {
        if (err) {
          return res.status(500).json({msg: 'could not find users'});
        }
        res.json(users);
      });
    })
    /* DONE */
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
    /* DONE */
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
      var currUserId = req.params.user;
      var newUserId = req.body.username;
      //rename a user and users bucket
      // ** We need to retrieve the file(s) that is already saved to this users
      // bucket/key, then we need to save the old file(s) to the new bucket/key
      // and delete the old bucket/key


      // Copy over old objects to new username
      var params = {
        Bucket: ourBucket, /* required */
        CopySource: ourBucket + '/' + currUserId, /* required */
        Key: newUserId, /* required */
      };
      s3.copyObject(params, function(err, data) {
        if (err) console.log(err, err.stack); // an error occurred
        else     console.log(data);           // successful response
      });

      var params = {
        Bucket: ourBucket, /* required */
        Marker: currUserId,
        MaxKeys: 1
      };
      s3.listObjects(params, function(err, data) {
        if (err) console.log(err, err.stack); // an error occurred
        var oldFileNames = [];
        var oldKeys = [];
        if (data) {
          for (var i = 0; i < data.Contents.length; i++) {
            var currFile = data.Contents[i].Key.split('/');
            oldFileNames.push(currFile[1]);
            oldKeys.push(data.Contents[i].Key);
            // currFile[1] === theOldFileName
          }
        }
        ee.emit('getOldFiles', oldFileNames, oldKeys);
      });

      ee.on('getOldFiles', function(oldFileNames, oldKeys) {
        console.log(oldFileNames);
        console.log(oldKeys);
        for (var i = 0; i < oldFileNames.length; i++) {
          (function(i) {
            s3.getObject({Bucket: ourBucket, Key: oldKeys[i]}, function(err, data) {
              if (err) return console.log(err);
              console.log(data.Body);
              console.log(oldFileNames[i]);
              var params = {Bucket: ourBucket, Key: newUserId + '/' + oldFileNames[i], Body: data.Body};

              s3.putObject(params, function(err, data) {
                if (err) return console.log(err);
                console.log(data);
              });
            });
          })(i);
        }
        ee.emit('deleteOldObject')
      });

      ee.on('deleteOldObject', function() {
        var params = {
          Bucket: ourBucket, /* required */
          Delete: { /* required */
            Objects: [ /* required */
              {
                Key: currUserId, /* required */
              }
            ]
          }
        };
        s3.deleteObjects(params, function(err, data) {
          if (err) console.log(err, err.stack); // an error occurred
          else     console.log(data);           // successful response
        });
      });

           // successful response

        // console.log(oldFileContents);

        // for (var i = 0; i < oldFileNames.length; i++) {
        //   var params = {Bucket: ourBucket, Key: newUserId + '/' + oldFileNames[i], Body: oldFileContents[i]};
        //   console.log(params);
        //   s3.putObject(params, function(err, data) {
        //     if (err) return console.log(err);
        //     console.log(data);
        //   });
      User.update({username: currUserId}, {$set: {username: newUserId}}, function(err, user) {
        if (err) {
          return res.status(404).json({msg: user});
        }
        res.json(user);
      });
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
      var currUserId = req.params.user;
      var params = {
        Bucket: ourBucket, /* required */
        Prefix: currUserId
      };
      s3.listObjects(params, function(err, data) {
        if (err) console.log(err, err.stack); // an error occurred
        res.json({data: data.Contents});
      });
    })
    // .get(function(req, res) {
    //   var userId = req.params.user
    //   var info;
    //   User.findOne({username: userId}, function(err, user) {
    //     for (var i = 0; i < user.files.length; i++) {
    //       (function(i) {
    //         var fileName = user.files[i];
    //         File.findById(fileName, function(err, file) {
    //           var params = {Bucket: 'vihjayjay', Key: userId + '/' + file.fileName};
    //           s3.getObject(params, function(err, data) {
    //             if (err) return console.log(err);
    //             console.log(msg: 'File contents: ' + data.Body.toString())
    //             // res.json({msg: 'File contents: ' + data.Body.toString()});
    //           });
    //         })
    //       })(i);

    //     }
    //     // res.json(info.data);
    //   });
    //   // s3.listObjects({Bucket: 'vihjayjay'}, function(err, data) {
    //   //   if (err) return console.log(err);
    //   //   console.log(data);
    //   // });
    //   // res.json({msg: 'got the /users/' + userId + '/file get route!'});
    // })
    .post(function(req, res) {
      var userId = req.params.user
      var file = new File(req.body);

      file.save(function(err, file) {
        if (err) console.log(err);
        console.log(file);
      });

      User.update({username: userId}, {$set: {files: file}}, {upsert: true}, function(err, user) {
        if (err) return console.log(err);
        console.log(user);
      });

      var params = {Bucket: ourBucket, Key: userId + '/' + file.fileName, Body: file.content };
      s3.putObject(params, function(err, data) {
        if (err) return console.log(err);
        console.log('we did It!!!!!!');
      });

      // res.json({msg: 'got the /users/' +user + '/file post route!'});
    })
    .delete(function(req, res) {
      var userId = req.params.user

      var params = {
        Bucket: ourBucket,
        Prefix: userId
      };

      s3.listObjects(params, function(err, data) {
        if (err) return console.log(err);

        params = {Bucket: ourBucket};
        params.Delete = {};
        params.Delete.Objects = [];

        data.Contents.forEach(function(content) {
          params.Delete.Objects.push({Key: content.Key});
        });

        s3.deleteObjects(params, function(err, data) {
          if (err) return console.log(err);

          return console.log(data.Deleted.length);
        });
      });


      res.json({msg: 'got the /users/' + userId + '/file delete route!'});
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


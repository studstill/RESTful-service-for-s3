module.exports = function(router, mongoose, bodyParser, EventEmitter, ee, User,
  File, AWS, s3, ourBucket) {

  router.route('/:user/files')
    .get(function(req, res) {
      var currUserId = req.params.user;
      var params = {
        Bucket: ourBucket, /* required */
        Prefix: currUserId
      };
      s3.listObjects(params, function(err, data) {
        if (err) console.log(err, err.stack); // an error occurred
        console.log(data.Contents);
      });
      var userId = req.params.user;
      var info = [];
      User.findOne({username: userId}, function(err, user) {
        if (err) return console.log(err);
        if (user.files.length > 0) {
          for (var i = 0; i < user.files.length; i++) {
            (function(i, info) {
              var fileName = user.files[i];
              console.log(fileName);
              File.findById(fileName, function(err, file) {
                if (err) return console.log(err);
                info.push(fileName);
                if (i === user.files.length - 1) {
                  sendResponse(info);
                }
              });
            })(i, info);
          }
        } else {
          sendResponse(info);
        }
      });
      function sendResponse(filesList) {
        res.json({files: filesList});
      };
    })
    .post(function(req, res) {
      var currUserId = req.params.user;
      var file = new File(req.body);

      var params = {
        Bucket: ourBucket,
        Prefix: currUserId
      };
      s3.listObjects(params, function(err, data) {
        if (err) {
          return console.log(err, err.stack);
        }
        for (var i = 0; i < data.Contents.length; i++) {
          (function(i) {
            var currFile = data.Contents[i].Key;
            console.log(currFile);
            console.log(currUserId + '/' + file.fileName);
            if (currFile == currUserId + '/' + file.fileName) {
              return res.status(400).json({msg: 'That filename already exists!'});
            } else {
              User.findOne({username: currUserId}, function(err, user) {
                if (err) {
                  return console.log('Error');
                }
                user.files.push(file._id);
                user.save();
                console.log(user);
              });

              var params = {Bucket: ourBucket, Key: currUserId + '/' + file.fileName,
                Body: file.content };
              var url = s3.getSignedUrl('putObject', params, function(err, url) {
                if (err) return console.log(err);
                file.url = url;
              });

              s3.putObject(params, function(err, data) {
                if (err) return console.log(err);
                console.log(data);
              });

              file.save(function(err, file) {
                if (err) console.log(err);
                console.log(file);
              });

              return res.json({msg: 'File successfully uploaded using ' + currUserId +
                '/file post route!'});
            }
          })(i);
        }
      });

      // if (existingFile === true) {
      // } else {
      //   User.findOne({username: currUserId}, function(err, user) {
      //     if (err) {
      //       return console.log('Error');
      //     }
      //     user.files.push(file._id);
      //     user.save();
      //     // console.log(user);
      //   });

      //   var params = {Bucket: ourBucket, Key: currUserId + '/' + file.fileName,
      //     Body: file.content };
      //   var url = s3.getSignedUrl('putObject', params, function(err, url) {
      //     if (err) return console.log(err);
      //     file.url = url;
      //   });

      //   s3.putObject(params, function(err, data) {
      //     if (err) return console.log(err);
      //     console.log(data);
      //   });

      //   file.save(function(err, file) {
      //     if (err) console.log(err);
      //     console.log(file);
      //   });

      //   return res.json({msg: 'File successfully uploaded using ' + currUserId +
      //     '/file post route!'});
      // }
    })
    .delete(function(req, res) {
      var currUserId = req.params.user;

      User.findOne({username: currUserId}, function(err, user) {
        if (user.files.length > 0) {
          for (var i = 0; i < user.files.length; i++) {
            (function(i, user) {
              var fileName = user.files[i];
              File.findById(fileName, function(err, file) {
                if (err) return res.status(500).json({msg: 'server error at /' + currUserId + '/files'});
                if (file) {
                  file.remove();
                  console.log(fileName);
                  user.update({$pull: {files: fileName}}, function(err, data){
                    console.log(err, data);
                  });
                  console.log('All files for ' + currUserId + ' were deleted');
                } else {
                  console.error('No files found for ' + currUserId);
                }
              });
            })(i, user);
          }
        }
      });

      var params = {
        Bucket: ourBucket,
        Prefix: currUserId
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
      res.json({msg: 'All files for ' + currUserId + ' were deleted'});
    });
}

module.exports = function(router, mongoose, bodyParser, EventEmitter, ee, User,
  File, AWS, s3, ourBucket) {

    router.route('/:user/files/:file')
    .get(function(req, res) {
      var userId = req.params.user;
      var searchedFile = req.params.file;

      User.findOne({username: userId}, function(err, user) {
        if (err) {
          return console.log(err);
        }

        for (var i = 0; i < user.files.length; i++) {
          (function(i) {
            var fileId = user.files[i];
            File.findById(fileId, function(err, file) {
              if (file.fileName === searchedFile) {
                var params = {Bucket: ourBucket, Key: userId + '/' + file.fileName};
                s3.getObject(params, function(err, data) {
                  if (err) {
                    return console.log(err);
                  }
                  var foundFile = data;
                  sendResponse(foundFile);
                });
              }
            });
          })(i);
        }
      });
      function sendResponse(foundFile) {
        res.json({msg: 'File contents: ' + foundFile.Body.toString()});
      }
    })
    .put(function(req, res) {
      var userId = req.params.user;
      var currFile = req.params.file;
      var newFileContents = req.body.content;

      User.findOne({username: userId}, function(err, user) {
        if (err) {
          return console.log(err);
        }

        for (var i = 0; i < user.files.length; i++) {
          (function(i) {
            var fileId = user.files[i];
            File.findById(fileId, function(err, file) {
              if (file.fileName === currFile) {
                var params = {
                  Bucket: ourBucket,
                  Key: userId + '/' + currFile,
                  Body: newFileContents
                }
                console.log(params);
                var url = s3.getSignedUrl('putObject', params, function(err, url) {
                  if (err) return console.log(err);
                  file.url = url;
                });
                s3.putObject(params, function(err, data) {
                  if (err) {
                    return console.log(err);
                  }
                });
                file.content = newFileContents;
                file.save();
                sendResponse(file.fileName);
              }
            });
          })(i);
        }
      });
      function sendResponse(file) {
        res.json({msg: file + ' was successfully saved'});
      }
    })
    .delete(function(req, res) {
      var userId = req.params.user;
      var currFile = req.params.file;
      
      var params = {
        Bucket: ourBucket,
        Delete: {
          Objects: [{Key: userId + '/' + currFile}]
        }
      };
      s3.deleteObjects(params, function(err, data) {
        if (err) {
          return console.log(err);
        }
        console.log(data.Deleted);
      });

      User.findOne({username: userId}, function(err, user) {
        if (err) {
          return console.log(err);
        }

        for (var i = 0; i < user.files.length; i++) {
          (function(i) {
            var fileId = user.files[i];
            File.findById(fileId, function(err, file) {
              if (file.fileName === currFile) {
                file.remove();
                user.update({$pull: {files: fileId}}, function(err, data){
                  if (err) {
                    return console.log(err);
                  }
                  console.log(data);
                });
              }
            })
          })(i);
        }
      });
      res.json({msg: currFile +  ' was successfully deleted!'});
    });
}

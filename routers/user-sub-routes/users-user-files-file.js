module.exports = function(router, mongoose, bodyParser, EventEmitter, ee, User,
  File, AWS, s3, ourBucket) {

    function sendResSuccess(res, data) {
      res.json({msg: data});
    }

    function sendError404(res, data) {
      res.status(404).json({msg: data + ' not found.'});
    }

    router.route('/:user/files/:file')
    .get(function(req, res) {
      var userId = req.params.user;
      var searchedFile = req.params.file;
      User.findOne({username: userId}, function(err, user) {
        if (err) {
          return console.log(err);
        }
        if (user.files.length > 0) {
          for (var i = 0; i < user.files.length; i++) {
            (function(i) {
              var fileId = user.files[i];
              File.findById(fileId, function(err, file) {
                if (file.fileName === searchedFile) {
                  var params = {Bucket: ourBucket, Key: userId + '/' + file.fileName};
                  console.log(file);
                  s3.getSignedUrl('getObject', params, function(err, url) {
                    if (err) return console.log(err);
                    File.update({_id: fileId}, {$set: {"url": url}}, function(err, file) {
                    sendResSuccess(res, url);
                    });
                  });
                } else {
                  sendError404(res, searchedFile);
                }
              });
            })(i);
          }
        } else {
          sendError404(res, searchedFile);
        }
      });
    })
    .put(function(req, res) {
      var userId = req.params.user;
      var currFile = req.params.file;
      var newFileContents = req.body.content;

      User.findOne({username: userId}, function(err, user) {
        if (err) {
          return console.log(err);
        }
        var matchFound = false;
        for (var i = 0; i < user.files.length; i++) {
          (function(i) {
            var fileId = user.files[i];
            File.findById(fileId, function(err, file) {
              if (file.fileName === currFile) {
                matchFound = true;
                var params = {
                  Bucket: ourBucket,
                  Key: userId + '/' + currFile,
                  Body: newFileContents
                }
                console.log(params);
                var url = s3.getSignedUrl('getObject', params, function(err, url) {
                  if (err) return console.log(err);
                  file.url = url;
                });

                s3.putObject(params, function(err, data) {
                  if (err) {
                    return console.log(err);
                  }
                });

                file.update({$set: {"fileName": currFile, "content": newFileContents}}, function(err, data) {
                  if (err) console.log(err);
                });
                user.update({$set: {files: file._id}}, function(err, user) {
                    if (err) console.log(err);
                    else console.log(user);
                });
                sendResSuccess(res, file.fileName + ' updated');
              } else if ((i === user.files.length - 1) && (matchFound === false)) {
                sendError404(res, currFile);
              }
            });
          })(i);
        }
      });
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
        if (user.files.length > 0) {
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
                    sendResSuccess(res, currFile + ' was deleted');
                  });
                } else {
                  sendError404(res, currFile);
                }
              });

            })(i);
          }
        } else {
          sendError404(res, currFile);
        }
      });
    });
}

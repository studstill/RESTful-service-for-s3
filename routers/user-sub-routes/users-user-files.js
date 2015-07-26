module.exports = function(router, mongoose, bodyParser, EventEmitter, ee, User,
  File, AWS, s3, ourBucket) {

  function sendResSuccess(res, data) {
    res.json({msg: data});
  }

  function sendError404(res, data) {
    res.status(404).json({msg: data});
  }

  router.route('/:user/files')
    .get(function(req, res) {
      var userId = req.params.user;
      var info = [];
      User.findOne({username: userId}, function(err, user) {
        if (err) return console.log(err);
        if (user.files.length > 0) {
          for (var i = 0; i < user.files.length; i++) {
            (function(i, info) {
              var fileName = user.files[i];
              File.findById(fileName, function(err, file) {
                if (err) return console.log(err);
                info.push(file.fileName);
                if (i === user.files.length - 1) {
                  sendResSuccess(res, info);
                }
              });
            })(i, info);
          }
        } else {
          sendError404(res, 'This user does not have any files');
        }
      });
    })
    .post(function(req, res) {
      var currUserId = req.params.user;
      var newFile = new File(req.body);

      newFile.save(function(err, file) {
        if (err) {
          return res.status(400).json({msg: 'Input does not match schema'});
          console.log(err);
        } else {
          var params = {
            Bucket: ourBucket,
            Key: currUserId + '/' + newFile.fileName,
            Body: newFile.content
          };
          var url = s3.getSignedUrl('putObject', params, function(err, url) {
            if (err) return console.log(err);
            newFile.url = url;
          });

          s3.putObject(params, function(err, data) {
            if (err) return console.log(err);
            console.log(data);
          });

          return res.json({msg: newFile.fileName + ' successfully uploaded for ' + currUserId});
          console.log(file);

          function update(user) {
            user.files.push(newFile._id);
            user.save();

          }
          User.findOne({username: currUserId}, function(err, user) {
            if (err) {
              return console.log(err);
            }
            var matchFound = false;
            // User does not have any files
            if (user.files.length === 0) {
              update(user);
            } else {
              for (var i = 0; i < user.files.length; i++) {
                (function(i) {
                  var fileId = user.files[i];
                  File.findById(fileId, function(err, file) {
                    if (file.fileName === newFile.fileName) {
                      matchFound = true;
                      sendError404(res, newFile.fileName + ' already exists.')
                    } else if (i === user.files.length - 1 && matchFound === false) {
                      update(user);
                    }
                  });
                })(i);
              }
            }
          });
        }
      });
    })
    .delete(function(req, res) {
      var currUserId = req.params.user;

      User.findOne({username: currUserId}, function(err, user) {
        if (user.files.length > 0) {
          for (var i = 0; i < user.files.length; i++) {
            (function(i, user) {
              var fileId = user.files[i];
              File.findById(fileId, function(err, file) {
                if (err) return res.status(500).json({msg: 'server error at /' + userId + '/files'});
                if (file) {
                  file.remove();
                  console.log('All files for ' + currUserId + ' were deleted');
                } else {
                  console.error('No files found for ' + currUserId);
                }
              });
              user.update({$pull: {"files": fileId}}, {safe: true}, function(err, data){
                console.log(err, data);
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
      sendResSuccess(res, 'All files for ' + currUserId + ' have been deleted');
    });
}

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
                info.push(file.fileName);
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
      var userId = req.params.user;
      var file = new File(req.body);

      User.findOne({username: userId}, {file: file}, function(err, user) {
        if (err) {
          console.log('That filename already exists!');
        }
        User.findOne({username: userId}, function(err, user) {
          user.files.push(file._id);
          user.save();
          console.log(user);
        });
      });

      var params = {Bucket: ourBucket, Key: userId + '/' + file.fileName,
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

      res.json({msg: 'File successfully uploaded using ' + userId +
        '/file post route!'});
    })
    .delete(function(req, res) {
      var userId = req.params.user;

      User.findOne({username: userId}, function(err, user) {
        if (user.files.length > 0) {
          for (var i = 0; i < user.files.length; i++) {
            (function(i, user) {
              var fileId = user.files[i];
              File.findById(fileId, function(err, file) {
                if (err) return res.status(500).json({msg: 'server error at /' + userId + '/files'});
                if (file) {
                  file.remove();
                  console.log('All files for ' + userId + ' were deleted');
                } else {
                  console.error('No files found for ' + userId);
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
      res.json({msg: 'All files for ' + userId + ' were deleted'});
    });
}

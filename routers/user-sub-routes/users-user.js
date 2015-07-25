module.exports = function(router, mongoose, bodyParser, EventEmitter, ee, User,
  File, AWS, s3, ourBucket) {

  router.route('/:user')
    /* DONE */
    .get(function(req, res) {
      var userId = req.params.user;
      User.findOne({username: userId}, function(err, user) {
        if (err) {
          return res.status(500).json({msg: 'could not find' + userId});
        }
        if (user) {
          res.json(user);
        } else {
          res.status(404).json({msg: '/user/' + userId + ' was not found'});
        }
      });
    })
    /* DONE */
    .put(function(req, res) {
      var currUserId = req.params.user;
      var newUserId = req.body.username;

      var params = {
        Bucket: ourBucket,
        Prefix: currUserId
      };

      s3.listObjects(params, function(err, data) {
        if (err) return console.log(err);

        var params = {
          Bucket: ourBucket,
        };

        data.Contents.forEach(function(content) {
          params.CopySource = ourBucket + '/' + content.Key;
          var currFile = content.Key.split('/');
          params.Key = newUserId + '/' + currFile[1];

          s3.copyObject(params, function(err, data) {
            if (err) console.log(err, err.stack);
            else     console.log(data);
          });
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
      });

      User.update({username: currUserId}, {$set: {username: newUserId}},
        function(err, user) {
        if (err) {
          return res.status(404).json({msg: user});
        }
        res.json(user);
      });
    })
    /* DONE!!! */
    .delete(function(req, res) {
      var userId = req.params.user;
      User.findOne({username: userId}, function(err, data) {
        if (err) {
          return res.status(500).json({msg: 'server error at /user/' + userId});
        }
        if (data) {
          data.remove();
          res.json({msg: userId + ' was deleted'});
        } else {
          res.status(404).json({msg: 'user was not found'});
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
          return console.log(data);
        });
      });
    });
}

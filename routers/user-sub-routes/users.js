module.exports = function(router, mongoose, bodyParser, EventEmitter, ee, User,
  File, AWS, s3, ourBucket) {

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
      var params = {
        Bucket: ourBucket, /* required */
        Key: req.body.username + '/', /* required */
      };
      s3.putObject(params, function(err, data) {
        if (err) console.log(err, err.stack);
        else console.log(data);
      });
      res.json(user);
    });
  });
}

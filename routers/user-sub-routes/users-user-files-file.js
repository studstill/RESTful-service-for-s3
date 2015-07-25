module.exports = function(router, mongoose, bodyParser, EventEmitter, ee, User,
  File, AWS, s3, ourBucket) {

    router.route('/:user/files/:file')
    .get(function(req, res) {
      var userId = req.params.user
      var searchedFile = req.params.file

      User.findOne({username: userId}, function(err, user) {
        for (var i = 0; i < user.files.length; i++) {
          (function(i) {
            var fileName = user.files[i];
            File.findById(fileName, function(err, file) {
              if (file.fileName == searchedFile) {
                var params = {Bucket: ourBucket, Key: userId + '/' + file.fileName};
                s3.getObject(params, function(err, data) {
                  if (err) return console.log(err);
                  var foundFile = data;
                  console.log(data.Body.toString());
                  sendResponse(foundFile);
                });
              }
            });
          })(i);
        }
      });
      function sendResponse(foundFile) {
        res.json({msg: 'File contents: ' + foundFile.Body.data.toString()});
      }
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


var express = require('express');
var router = express.Router();
var mongoose = require('mongoose');
var bodyParser = require('body-parser');

router.use(bodyParser.json());


router.route('/')
  .get(function(req, res) {
    res.json({msg: 'got the /users get route!'});
  })
  .post(function(req, res) {
    res.json({msg: 'got the /users post route!'});
  });

router.route('/:user')
  .get(function(req, res) {
    var user = req.params.user;
    res.json({msg: 'got the /users/' + user + ' get route!'});
  })
  .put(function(req, res) {
    var user = req.params.user;
    //rename a user and users bucket
    res.json({msg: 'got the /users/' + user + ' put route!'});
  })
  .delete(function(req, res) {
    var user = req.params.user;
    res.json({msg: 'got the /users/' + user + ' delete route!'});
  });

router.route('/:user/files')
  .get(function(req, res) {
    var user = req.params.user
    res.json({msg: 'got the /users/' + user + '/file get route!'});
  })
  .post(function(req, res) {
    var user = req.params.user
    res.json({msg: 'got the /users/' +user + '/file post route!'});
  })
  .delete(function(req, res) {
    var user = req.params.user
    res.json({msg: 'got the /users/' +user + '/file delete route!'});
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



module.exports = router;

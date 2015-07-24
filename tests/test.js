var chai = require('chai');
var chaiHttp = require('chai-http');
var expect = chai.expect;
var mongoose = require('mongoose');

var User = require(__dirname + '/../models/User');
var File = require(__dirname + '/../models/File');

process.env.MONGOLAB_URI = 'mongodb://localhost/mocha-test';
require(__dirname + '/../server.js');
chai.use(chaiHttp);

describe('Test server routes', function() {

  before(function(done) {

    var user = new User({"username": "testUser"});
    user.save();

    var file = new File({"fileName": "testFile", "content": "foobar"})
    file.save();

    user.files.push(file._id);

    done();
  });

  after(function(done) {
    mongoose.connection.db.dropDatabase(function() {
      done();
    });
  });

  describe('get routes', function() {
    it('get response at get /users', function(done) {
      chai.request('http://localhost:3000')
        .get('/users')
        .end(function(err, res) {
          expect(err).to.be.null;
          expect(res).to.have.status(200);
          done();
        });
    });

    it('get response at get /users/:user', function(done) {
      chai.request('http://localhost:3000')
        .get('/users/testUser')
        .end(function(err, res) {
          expect(err).to.be.null;
          expect(res).to.have.status(200);
          done();
        });
    });

    it('get response at get /users/:user/files', function(done) {
      chai.request('http://localhost:3000')
        .get('/users/testUser/files')
        .end(function(err, res) {
          expect(err).to.be.null;
          expect(res).to.have.status(200);
          done();
        });
    });

    it('get response at get /users/:user/files/:file', function(done) {
      User.findOne({username: "testUser"}, function(err, user) {
        var fileId = user.files[0];
        chai.request('http://localhost:3000')
        .get('/users/testUser/files/' + fileId)
        .end(function(err, res) {
          expect(err).to.be.null;
          expect(res).to.have.status(200);
          done();
        });
      });
    });


  });
});

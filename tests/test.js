var chai = require('chai');
var chaiHttp = require('chai-http');
var expect = chai.expect;
var mongoose = require('mongoose');
var AWS = require('aws-sdk');
var s3 = new AWS.S3();
var User = require(__dirname + '/../models/User');
var File = require(__dirname + '/../models/File');

//sets the test bucket so we don't mess with the production database
var testBucket = 'vi-testbucket'
process.env.MY_TEST_BUCKET = testBucket;
//sets up local test mongo database
process.env.MONGOLAB_URI = 'mongodb://localhost/mocha-test';
//instantiates server
require(__dirname + '/../server.js');
chai.use(chaiHttp);

describe('Test server routes', function() {
  //this before will create a new user and a file and save it in both mongo and s3
  before(function(done) {
    var user = new User({"username": "testUser"});
    user.save();
    var file = new File({"fileName": "testFile", "content": "foobar"})
    file.save();
    user.files.push(file._id);

    s3.putObject({Bucket: testBucket, Key: 'testUser/testFile', Body: file.content}, function() {
      done();
    });
  });
  //after tests, clear databases
  after(function(done) {
    mongoose.connection.db.dropDatabase(function() {
      s3.deleteObject({Bucket: testBucket, Key: 'testUser/testFile'}, function() {
        done();
      });
    });
  });

  describe('get routes', function() {
    it('should get response at get /users', function(done) {
      chai.request('http://localhost:3000')
        .get('/users')
        .end(function(err, res) {
          expect(err).to.be.null;
          expect(res).to.have.status(200);
          done();
        });
    });

    it('should get response at get /users/:user', function(done) {
      chai.request('http://localhost:3000')
        .get('/users/testUser')
        .end(function(err, res) {
          expect(err).to.be.null;
          expect(res).to.have.status(200);
          done();
        });
    });

    it('should get response at get /users/:user/files', function(done) {
      chai.request('http://localhost:3000')
        .get('/users/testUser/files')
        .end(function(err, res) {
          expect(err).to.be.null;
          expect(res).to.have.status(200);
          done();
        });
    });

    it('should get response at get /users/:user/files/:file', function(done) {
        chai.request('http://localhost:3000')
        .get('/users/testUser/files/testFile')
        .end(function(err, res) {
          expect(err).to.be.null;
          expect(res).to.have.status(200);
          done();
        });
    });
  });

  describe('post routes', function() {

    before(function(done) {
      //if test failed, sometimes the after block is not reached, so this is to delete it before hand.
      s3.deleteObject({Bucket: testBucket, Key: "stannis/howToGetTheThroneForDummies"},function() {
        done();
      });
    });

    after(function(done) {
      //delete post info from s3. mongo will be cleared after all tests so there is no need to manually clear that
      s3.deleteObject({Bucket: testBucket, Key: "stannis/howToGetTheThroneForDummies"},function() {
        done();
      });
    });

    it('should get response at post /users/', function(done) {
      chai.request('http://localhost:3000')
        .post('/users')
        .send({username: "stannis"})
        .end(function(err, res) {
          expect(err).to.be.null;
          expect(res).to.have.status(200);
          done();
        });
    });

    it('should get response at post /users/:users/files', function(done) {
      chai.request('http://localhost:3000')
        .post('/users/stannis/files')
        .send({fileName: "howToGetTheThroneForDummies", content: "Be the one true king. Don't burn your kids to raise army moral. That don't work brah"})
        .end(function(err, res) {
          expect(err).to.be.null;
          expect(res).to.have.status(200);
          done();
        });
    })
  });

  describe('put routes', function() {
    it('should get response at put /users/:user', function(done) {
      chai.request('http://localhost:3000')
        .put('/users/testUser')
        .send({username: "testUserUpdated"})
        .end(function(err, res) {
          expect(err).to.be.null;
          expect(res).to.have.status(200);
          done();
        });
    });

    it('should get response at put /user/:user/files/:file', function(done) {
      chai.request('http://localhost:3000')
        .put('/users/testUserUpdated/files/testFile')
        .send({content: "this is foobar updated"})
        .end(function(err, res) {
          expect(err).to.be.null;
          expect(res).to.have.status(200);
          done();
        });
    });
  });



  describe('delete routes', function() {
    //before each delete test, create a user and file to be deleted
    beforeEach(function(done) {
      var user = new User({"username": "jonSnow"});
      user.save();
      var file = new File({"fileName": "myJournal", "content": "I know nothing"});
      file.save();

      s3.putObject({Bucket: testBucket, Key: 'jonSnow/myJournal', Body: file.content}, function() {
          done();
      });
    });
    //clears the rest of the database info so that a new set can be created for the subsequent delete test
    afterEach(function(done) {
      s3.deleteObject({Bucket: testBucket, Key: "jonSnow/myJournal"},function() {
        User.findOne({username: 'jonSnow'}, function(err, user) {
          if(user) user.remove();
          done();
        });
      });
    });

    it('should get response at delete /user/:user/', function(done) {
      chai.request('http://localhost:3000')
        .delete('/users/jonSnow/')
        .end(function(err, res) {
          expect(err).to.be.null;
          expect(res).to.have.status(200);
          done();
        });
    });

    it('should get response at delete /user/:user/files/', function(done) {
      chai.request('http://localhost:3000')
        .delete('/users/jonSnow/files/')
        .end(function(err, res) {
          expect(err).to.be.null;
          expect(res).to.have.status(200);
          done();
        });
    });

    it('should get response at delete /user/:user/files/:file', function(done) {
      chai.request('http://localhost:3000')
        .delete('/users/jonSnow/files/myJournal')
        .end(function(err, res) {
          expect(err).to.be.null;
          expect(res).to.have.status(200);
          done();
        });
    });
  });
});

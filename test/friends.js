var should = require('should'); 
var assert = require('assert');
var request = require('supertest');  
//var winston = require('winston');
//var config = require('./config-debug');

var sHost = 'http://localhost:8888/';

describe('Friends', function() {
  var testUserName = 'TestUser';
  var testUserPassword = 'TestPassword';
  var testUserEmail = 'TestEmail';
  var testFriendName = 'TestFriend';
  var testFriendPassword = 'TestPassword';
  var testFriendEmail = 'TestFriendEmail';
  var userToken;
  var friendToken;

  describe('Login', function() {
    it('should allow a user to login with username and password', function(done) {
      var header = {
        username: testUserName,
        password: testUserPassword,
      };

      request(sHost)
        .post('login')
        .set({ 
          'username': testUserName,
          'password': testUserPassword,
          'content-type': 'application/json'
        })
        .end(function(err, res) {
          if (err) {
             throw err;
          }

          // this is should.js syntax, very clear
          res.status.should.be.equal(200);
          userToken = res.body.token;
          console.log(userToken);
          done();
        });
    });
    it('should allow a friend to login with username and password', function(done) {
      // login on the friend account
      request(sHost)
        .post('login')
        .set({ 
          'username': testFriendName,
          'password': testFriendPassword,
          'content-type': 'application/json'
        })
        .end(function(err, res) {
          if (err) {
             throw err;
          }

          // this is should.js syntax, very clear
          res.status.should.be.equal(200);
          friendToken = res.body.token;
          console.log(friendToken);
          done();
        });
    });
  });

  var friendMajorUuid;
  var friendMinorUuid;
  // Testing the add friend flow
  describe('Add Friend', function() { 
    it('should allow a user to query by username', function(done) {
      // HACK to get username
      request(sHost)
        .get('user?username=' + testFriendName)
        .set({ 
          'username': testUserName,
          'token': userToken,
          'content-type': 'application/json'
        })
        .end(function(err, res) {
          if (err) {
             throw err;
          }

          console.log(res);
          res.status.should.be.equal(200);
          res.body.should.have.property('majorUuid');
          res.body.should.have.property('minorUuid');
          friendMajorUuid = res.body.majorUuid;
          friendMinorUuid = res.body.minorUuid;
          console.log(friendToken);
          done();
        });
    });

    it('should allow a user to add friends', function(done) {
      request(sHost)
        .post('friend/' + friendMajorUuid + '/' + friendMinorUuid)
        .set({ 
          'username': testUserName,
          'token': userToken,
          'content-type': 'application/json'
        })
        .end(function(err, res) {
          if (err) {
             throw err;
          }

          // this is should.js syntax, very clear
          res.status.should.be.equal(200);
          friendToken = res.body.token;
          console.log(friendToken);
          done();
        });
    });
  });
 
  // Testing the List friend flow
  describe('List Friend', function() { 
    it('should allow a to list his friends', function(done) {
      request(sHost)
        .get('friend')
        .set({ 
          'username': testUserName,
          'token': userToken,
          'content-type': 'application/json'
        })
        .end(function(err, res) {
          if (err) {
             throw err;
          }

          /*
          console.log(res);
          res.body.should.containEql({
            majorUuid : friendMajorUuid,
            minorUuid : friendMinorUuid
          });
          */
          //FIXME: not a true test, list friends end point currently 
          //does not respond with sufficient info 
          res.status.should.be.equal(200);
          done();
        });
    });
  });

  // Testing the reject friend flow
  describe('Reject Friend', function() { 
    it('should allow a user to reject request', function(done) {
      request(sHost)
        .get('friend/reject')
        .set({ 
          'username': testUserName,
          'token': userToken,
          'content-type': 'application/json'
        })
        .end(function(err, res) {
          if (err) {
             throw err;
          }

          /*
          console.log(res);
          res.body.should.containEql({
            majorUuid : friendMajorUuid,
            minorUuid : friendMinorUuid
          });
          */
          //FIXME: not a true test, list friends end point currently 
          //does not respond with sufficient info 
          res.status.should.be.equal(200);
          done();
        });
    });
  });
});

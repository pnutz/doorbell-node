var server = require("./server");
var mysql = require("./db");
var async = require("async");

var Init = require("./mysql_db/dbInit");
var Status = require("./model/status");
var ErrorCode = require("./model/errorcode");

global.status = {};
global.errorcode = {};

async.series([
  // setup database
  function(callback) {
    mysql.connect(callback);
  },
  // check if database contains status data
  function(callback) {
    var query = "SELECT * FROM status;";
    db.query(query, function(err, result) {
      if (err) {
        console.log(query);
        console.log(err.message);
        return callback(err);
      }
      // cache statuses to prevent db queries
      else if (result.length !== 0) {
        for (var i = 0; i < result.length; i++) {
          global.status[result[i].status] = result[i].idStatus;
        }
        return callback();
      }
      // initialize status table
      else {
        var data = Init.status;
        // iterate through statuses
        async.eachSeries(data, function(statusData, eachCallback) {
          var status = new Status(null, statusData);
          status.save(function(idStatus) {
            if (idStatus != null) {
              global.status[statusData] = idStatus;
              return eachCallback();
            } else {
              return eachCallback(new Error("failed status creation"));
            }
          });
        }, function(err) {
          if (err) {
            console.log(err.message);
          }
          return callback(err);
        });
      }
    });
  },
  // check if database contains errorcode data
  function(callback) {
    var query = "SELECT * FROM errorcode;";
    db.query(query, function(err, result) {
      if (err) {
        console.log(query);
        console.log(err.message);
        return callback(err);
      }
      // cache errorcodes to prevent db queries
      else if (result.length !== 0) {
        for (var i = 0; i < result.length; i++) {
          global.errorcode[result[i].errorcode] = result[i].idErrorCode;
        }
        return callback();
      }
      // initialize errorcode table
      else {
        var data = Init.errorCode;
        // iterate through errorcodes
        async.eachSeries(data, function(errorCodeData, eachCallback) {
          var errorcode = new ErrorCode(null, errorCodeData);
          errorcode.save(function(idErrorCode) {
            if (idErrorCode != null) {
              global.errorcode[errorCodeData] = idErrorCode;
              return eachCallback();
            } else {
              return eachCallback(new Error("failed errorcode creation"));
            }
          });
        }, function(err) {
          if (err) {
            console.log(err.message);
          }
          return callback(err);
        });
      }
    });
  },
  // run server
  function(callback) {
    server.start();
    return callback();
  }]);
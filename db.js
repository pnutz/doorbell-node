var mysql = require('mysql');
var async = require('async');
var script = require('./mysql_db/doorbellDB');
var debug = require('debug')('db');

var db_config = {
  host: 'us-cdbr-iron-east-01.cleardb.net',
  user: 'b40e0fd1ab928a',
  password: '3bacecd4',
  database: 'heroku_25e074558aecc17'
};

var connection;

function initHandleDisconnect(callback) {
  connection = mysql.createConnection(db_config);
  
  connection.connect(function(err) {
    if (err) {
      console.log('Error when connecting to DB:', err);
      setTimeout(handleDisconnect, 2000);
    }
    debug('Connected to MySQL Database');
  });
  
  // connection lost due to server restart, connection idle timeout
  connection.on('error', function(err) {
    console.log('DB Error', err);
    if (err.code === 'PROTOCOL_CONNECTION_LOST') {
      handleDisconnect();
    } else {
      throw err;
    }
  });
  
  global.db = connection;
  return callback();
}

function handleDisconnect() {
  connection = mysql.createConnection(db_config);
  
  connection.connect(function(err) {
    if (err) {
      console.log('Error when connecting to DB:', err);
      setTimeout(handleDisconnect, 2000);
    }
    debug('Reconnected to MySQL Database');
  });
  
  // connection lost due to server restart, connection idle timeout
  connection.on('error', function(err) {
    console.log('DB Error', err);
    if (err.code === 'PROTOCOL_CONNECTION_LOST') {
      handleDisconnect();
    } else {
      throw err;
    }
  });
  
  global.db = connection;
}

function connect(resultCallback) {
  async.series([
    function(callback) {
      initHandleDisconnect(callback);
    },
    function(callback) {
      var query = script.db;
      connection.query(query, function(err, result) {
        if (err) {
          console.log(query);
          throw err;
        }
        debug('Database Created');
        return callback();
      });
    },
    function(callback) {
      var query = script.use;
      connection.query(query, function(err, result) {
        if (err) {
          console.log(query);
          throw err;
        }
        debug('Using Database');
        return callback();
      });
    },
    function(callback) {
      async.eachSeries(script.tables, function(query, eachCallback) {
        connection.query(query, function(err, result) {
          if (err) {
            console.log(query);
            throw err;
          }
          return eachCallback();
        });
      }, function(err) {
        if (err) {
          throw err;
        }
        
        debug('Initialized Database Tables');
        return callback();
      });
    }
  ], function(err, results) {
    if (err) {
      console.log(err.message);
    }
    
    return resultCallback();
  });
}

module.exports = {
  connect: connect
};

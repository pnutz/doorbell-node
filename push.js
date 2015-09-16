var Parse = require("parse").Parse;

Parse.initialize(
  "et9G6NLcAlNYdEUSCF2GqX41hJf3zeNJOb5QsyFk", //applicationId
  "7dtnGvXKQfA547Tb4j8kjTYdNimTtDjVX7q8mDE6", //javascriptKey
  "1l2uiTM8TEq99gv4qa6BZE4CjTmYWmdgfq1xytjJ" // masterKey
);

exports.sendPushNotification = function(deviceToken, data, callback) {
  // Don't go any further if token is null
  if (deviceToken == null) {
    var err = new Error(global.errorcode["Push notification device token does not exist"]);
    return callback(err);
  }

  var query = new Parse.Query(Parse.Installation);
  
  query.equalTo("deviceToken", deviceToken);
  query.equalTo("deviceType", "ios");

  data["category"] = "category_action_accept_friend";
  
  console.log(query);

  Parse.Push.send({
    where: query,
    data: data
  }, {
    success: function() {
      console.log("Sent push notification");
      return callback(null);
    },
    error: function(error) {
      return callback(new Error(error.code + " " + error.message));
    }
  });  
};

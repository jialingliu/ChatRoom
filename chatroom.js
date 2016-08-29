/**
 * back-end
 *
 * @author jialingliu
 */
var chatroom = function (chatroom) {
    var self = this;
    self.users = {}; // user map, socket_id : username
    self.messages = []; // messages array of maps, {message: content, name: user_name, time: sent_time}

    // getters
    self.getUsers = function() {
        return self.users;
    };

    self.getMessages = function() {
        return self.messages;
    };
    var sqlite3 = require("sqlite3").verbose();
    var dbName = chatroom + ".db";
    var db = new sqlite3.Database(dbName);
    var _ = require('underscore');

    //create sqlite db
    db.serialize(function() {
        db.run("CREATE TABLE IF NOT EXISTS messages (name TEXT, message TEXT, time TEXT)");
    });

    self.db = db;

    //load history from db
    db.all("SELECT * FROM messages", function(err, records) {
        if (err) {
            console.log(err);
        }
        self.messages = records;
    });

    self.join = function(name, id) {
        // invert the key-value in users map, connected is the socketid for name
        var connected = (_.invert(self.users))[name];
        if (connected != undefined) return false;
        self.users[id] = name;
        return true;
    };

    self.leave = function(id) {
        delete self.users[id];
    };

    self.sendMessage = function(userid, message_content, message_time) {
        db.serialize(function() {
            var stmt = db.prepare("INSERT INTO messages VALUES (?,?,?)");
            stmt.run(self.users[userid], message_content, message_time);
            stmt.reset();
        });
        self.messages.push({message: message_content, name: self.users[userid], time: message_time});
    };
};
module.exports = chatroom;
/**
 * back-end, server-side
 *
 * @author jialingliu
 */
var express = require('express');
var app = express();
var server = require('http').createServer(app);
var io = require('socket.io')(server);

app.use(express.static(__dirname + '/public'));
app.set('views', __dirname + '/views');
app.engine('html', require('consolidate').handlebars);
app.set('view engine', 'html');

app.get('/', function(req, res){
    res.render('view.html');
});

var Chatroom = require('./public/javascripts/Chatroom');
var room = new Chatroom("Jenny's chat room");

io.on('connection', function(socket){
    // user join
    socket.on("join", function(name){
        var joined = room.join(name, socket.id);
        if (joined){
            io.emit("user joined", name);
            io.emit("refresh online users", room.getUsers());
            //load existing messages from the DB
            var msgs = room.getMessages();
            for (var index = 0; index < msgs.length; index++) {
                socket.emit('send message', msgs[index]);
            }
        } else {
            socket.emit("join failure", "Joining room failed. Name " + name + " already taken.");
        }
    });

    // user logout
    socket.on("user logout", function(){
        logout(socket);
    });

    // any unexpected logout such as closing the tab or browser
    socket.on('disconnect', function() {
        logout(socket);
    });

    // user send message
    socket.on('send message', function(msg){
        var now = new Date();
        now = now.toLocaleTimeString() + ' ' + now.toDateString();
        room.sendMessage(socket.id, msg, now);
        io.emit('send message', {name: room.getUsers()[socket.id], time: now, message: msg});
    });
});

// user disconnected
var logout = function(socket) {
    var name = room.getUsers()[socket.id];
    if(name != null) {
        room.leave(socket.id);
        io.emit("user logout", name);
        io.emit("refresh online users", room.getUsers());
    }
};

server.listen(3001, function(){
    console.log('listening on port 3001');
});
var app = require('express')();
var http = require('http').Server(app);
var io = require('socket.io')(http);
var events = require('events');
var mongoose = require('mongoose');	
var eventEmitter = new events.EventEmitter();
var onlineUsers = [];
//var loginRoom = 'broadcast';




var dbPath = 'mongodb://localhost/ensemble';

db = mongoose.connect(dbPath);

mongoose.connection.once('open', function(){
	console.log("database open");
});

var fs = require('fs');

fs.readdirSync('./app/model').forEach(function(file){
     if(file.indexOf('.js')){
        require('./app/model/'+file);
     }
});


var allChat    = mongoose.model('Chat'); 

eventEmitter.on('saveChat', function(data, user, room){
    console.log('emit:-'+data+' :-'+user);
    var newChat = new allChat({
    	userName 			: user,
		group    			: room,
		message  			: data,
		createdOn           : new Date()
    });
    newChat.save(function(err){
    	if(err){
           console.log('some error occured'+err);
    	}else{
           console.log('chat saved');
    	}
    });
});

app.get('/', function(req, res){
	res.sendFile(__dirname + '/index.html');
});

eventEmitter.on('savedChat', function(user, room){
	allChat.find({'group': room}, function(err, result){
         if(err){
         	//console.log('err'+err);
            res.send('some error had occured');
         }else{
         	//io.emit('load old Chat', result);
         	//console.log('result'+result);
         	eventEmitter.emit('genearte old chat', result, room);
         }
  	  });
}); 	


io.on('connection', function(socket){
  //console.log('a user connected');
  eventEmitter.on('genearte old chat', function(result, room){
     io.in(room).emit('load old Chat', result);
  });

  var checkOnlineUsers = function(onlineUsers){
      io.emit('online users', onlineUsers);
  }

  socket.on('user',function(data){
    console.log(data+ "came online");
    socket.broadcast.to('broadcast').emit('chat message', data+" came online");
    //eventEmitter.emit('genearte old chat', result);
    // you can allocate variables in socket.
    socket.join('broadcast');
    //emit event to set default broadcast room for the user
    socket.user = data;
    socket.room = 'broadcast';
    onlineUsers.push(socket.user);
    console.log(socket.room);
    console.log(socket.user);
    checkOnlineUsers(onlineUsers);

    //pass the room that user is joined in currently
    eventEmitter.emit('savedChat', socket.user, socket.room);
    //io.in(socket.room).emit('privateRoom', socket);

  });

  socket.on('chat message', function(msg){
    io.to(socket.room).emit('chat message', socket.user+' : '+msg);
    eventEmitter.emit('saveChat', msg, socket.user, socket.room);

  });

  socket.on('disconnect',function(){
  	 
  	 
     if(socket.user){
     	console.log("some user left the chat");
	    socket.broadcast.to('broadcast').emit('chat message', socket.user+" left the chat");
	    console.log(socket.user);
     	onlineUsers.splice(onlineUsers.indexOf(socket.user), 1);
        checkOnlineUsers(onlineUsers);
     }
     
  }); //end socket disconnected
  
  socket.on('message', function(msg){
    io.to(socket.room).emit('message', msg);

  });

  socket.on('typing', function(data) {
  	 if(!data){
        socket.to(socket.room).broadcast.emit('message', '');
  	 }else{
  	 	socket.to(socket.room).broadcast.emit('message', socket.user+" is typing..");
  	 } 
  });

  socket.on('privateChat', function(item, user){
  	 var room;
  	 if(!item || !user){
         room = 'broadcast';
  	 }else{
  	 	var user1 = item.toLowerCase();
  	 	var user2 = user.toLowerCase();
  	 	var name;
  	 	if(user1<user2){
          name = user1+user2; 
  	 	}else{
  	 		name = user2 + user1;
  	 	}
  	 	room = name;
  	 }
  	 socket.leave(socket.room);
  	 socket.room = room;
  	 socket.join(socket.room);
  	 console.log(socket.room);
  	 console.log(socket.user);
  	 eventEmitter.emit('savedChat', socket.user, socket.room);
  	 //console.log(socket);
  	 //io.in(socket.room).emit('privateRoom', socket);

  	 //io.emit('privateRoom', 'this is private chat room');
  	 //console.log(item+user);
     //eventEmitter.emit('checkUser', item, user);
  });

});

http.listen(3000, function(){
  console.log('listening on *:3000');
});
var app = require('express')();
var http = require('http').Server(app);
var io = require('socket.io')(http);
var events = require('events');
var mongoose = require('mongoose');	
var eventEmitter = new events.EventEmitter();
var onlineUsers = [];





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

eventEmitter.on('saveChat', function(data, user){
    console.log('emit:-'+data+' :-'+user);
    var newChat = new allChat({
    	userName 			: user,
		group    			: 'broadcast',
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

eventEmitter.on('savedChat', function(data){
	allChat.find(function(err, result){
         if(err){
         	console.log('err'+err);
            res.send('some error had occured');
         }else{
         	//io.emit('load old Chat', result);
         	//console.log('result'+result);
         	eventEmitter.emit('genearte old chat', result);
         }
  	  });
}); 	


io.on('connection', function(socket){
  //console.log('a user connected');
  eventEmitter.on('genearte old chat', function(result){
     io.emit('load old Chat', result);
  });

  var checkOnlineUsers = function(onlineUsers){
      io.emit('online users', onlineUsers);
  }

  socket.on('user',function(data){
    console.log(data+ "came online");
    socket.broadcast.emit('chat message', data+" came online");
    //eventEmitter.emit('genearte old chat', result);
    // you can allocate variables in socket.
    socket.user = data;
    onlineUsers.push(socket.user);
    checkOnlineUsers(onlineUsers);
    eventEmitter.emit('savedChat', socket.user);
  });

  socket.on('chat message', function(msg){
    io.emit('chat message', socket.user+' : '+msg);
    eventEmitter.emit('saveChat', msg, socket.user);

  });

  socket.on('disconnect',function(){
  	 
  	 
     if(socket.user){
     	console.log("some user left the chat");
	    socket.broadcast.emit('chat message', socket.user+" left the chat");
	    console.log(socket.user);
     	onlineUsers.splice(onlineUsers.indexOf(socket.user), 1);
        checkOnlineUsers(onlineUsers);
     }
     
  }); //end socket disconnected
  
  socket.on('message', function(msg){
    io.emit('message', msg);

  });

  socket.on('typing', function(data) {
  	 if(!data){
        socket.broadcast.emit('message', '');
  	 }else{
  	 	socket.broadcast.emit('message', socket.user+" is typing..");
  	 } 
  });

  

});

http.listen(3000, function(){
  console.log('listening on *:3000');
});
var express = require('express');
var path = require('path');
var app = express();
var http = require('http').Server(app);
var client = require('socket.io')(http);
var mongo = require('mongodb').MongoClient;
var url = "mongodb://localhost:27017/chatdb";
app.get('/', function(req, res){
  res.sendfile('home.html');
});
 
http.listen(8080, function(){
  console.log('listening on *:8080');
});

//app.use(express.static(path.join(__dirname, 'public')));
app.use("/css",express.static(__dirname + "/css"));
//Whenever someone connects this gets executed
mongo.connect(url,function(err,db){
	if(err)throw err;
	client.on('connection', function(socket){
		var col = db.collection('messages'),
			sendStatus = function(s){
				socket.emit('status',s);
			};
		//emit all messages
		col.find().limit(200).sort({_id:1}).toArray(function(err,res){
			if(err) throw err;
			socket.emit('output',res);
		});

		// wait for input
  //console.log('A user connected');
	  	socket.on('input',function(data){
	  		var name = data.name,
	  			message = data.message,
	  			whitespacePattern = /^\s*$/;

	  		if(whitespacePattern.test(name)||whitespacePattern.test(message)){
	  			sendStatus('Name and Message is Required.');
	  		}else{
	  			col.insert({name:name,message:message},function(){

	  				//emit latest message to all clients
	  				client.emit('output',[data]);

	  				sendStatus({
	  					message : "Message Sent",
	  					clear : true
	  				});

	  			});	
	  		}

	  	});

  });

});

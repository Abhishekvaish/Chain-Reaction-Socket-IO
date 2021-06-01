const cors = require('cors')
const io = require('socket.io')(5000,{
	cors: {
		origin:'*'
	}
})

rooms =  {}//{ "Room-1":{users:{}, turn:0 },"Room-2":{users:["a","b"], turn:1 } }
users = {}

io.on('connection',socket => {
	console.log("connected with ", socket.id)
	socket.emit('list-rooms' , rooms);

	socket.on('create-room' , name => {
		rooms[name] = {users:{},turn:0}
		socket.broadcast.emit('list-rooms',rooms)
		socket.emit('join-created-room',name)
	})

	socket.on('join-room' , data => {
		if (rooms[data.roomName]){
			rooms[data.roomName].users[socket.id] = data.userName
			socket.join(data.roomName)
			users[socket.id] = data.roomName
			socket.broadcast.emit('list-rooms',rooms)
			socket.broadcast.to(data.roomName).emit('user-joined',data.userName)
		}
		else
			socket.emit('redirect-home')
	})


	socket.on('send-msg',msg => {
		roomName = users[socket.id]

		socket.broadcast.to(roomName).emit('receive-msg',{
			"name": rooms[roomName].users[socket.id],
			"msg": msg
		})
	})


	socket.on('disconnect', ()=>{
		roomName = users[socket.id]		
		if (roomName != null){
			userName = rooms[roomName].users[socket.id]
			socket.broadcast.to(roomName).emit('user-left',userName)
			socket.leave(roomName)			
			delete rooms[ roomName ].users[socket.id]			
			if (Object.keys(rooms[roomName].users).length == 0)
				delete rooms[roomName]
			socket.broadcast.emit('list-rooms',rooms)
		}
		// Object.keys(rooms).forEach( room => {
		// 	delete rooms[room].users[socket.id]
		// 	if (Object.keys(rooms[room].users).length == 0)
		// 		delete rooms[room]
		// 	socket.leave(room)
		// 	socket.broadcast.emit('list-rooms',rooms)
		// } )
	})


})
const PORT  = process.env.PORT | 8000 
const express = require('express')
const app = express()
app.use('/',express.static('Frontend') )
const server = app.listen(PORT)
const io = require('socket.io')(server)



// const cors = require('cors')
// const io = require('socket.io')(8000,{
// 	cors: {
// 		origin:'*'
// 	}
// })

rooms =  {}
// {
// 	"room-1":{
// 		"users"	:{
// 			"socket_id_1":{
// 				"name":"userName",
// 				"color":"red"
// 			}
// 		},
// 		"turn":0,
// 		"grid" : [[{"count":0 , "color":null}]]
// 	}
// }

users = {}
colors = ["#ff0000" , "#00ff00", "#0000ff" , "#ffff00" , "#00ffff" , "#ff00ff"]

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
			colindex = Object.keys(rooms[data.roomName].users).length	
			
			rooms[data.roomName].users[socket.id] = {
				"name": data.userName	,
				"color": colors[colindex]
			}
			if (colindex == 0)
				rooms[data.roomName].users[socket.id]["admin"] = true

			socket.join(data.roomName)
			users[socket.id] = data.roomName
			socket.broadcast.emit('list-rooms',rooms)
			
			socket.broadcast.to(data.roomName).emit('user-joined',data.userName)
			

			io.to(data.roomName).emit('member-list',rooms[data.roomName].users)
			// socket.broadcast.to(data.roomName).emit('member-list',rooms[data.roomName].users)
			// socket.emit('member-list',rooms[data.roomName].users)
		}
		else
			socket.emit('redirect-home')
	})


	socket.on('send-msg',msg => {
		roomName = users[socket.id]

		socket.broadcast.to(roomName).emit('receive-msg',{
			"name": rooms[roomName].users[socket.id]["name"],
			"msg": msg
		})
	})


	socket.on('grid-size' , data => {
		let  roomName = users[socket.id]		
		rooms[roomName]["grid"] = Array( parseInt(data.rows) ).fill(0).map( x=> Array(parseInt(data.cols) ).fill({"count":0,"color":null}))
		// socket.broadcast.to(roomName).emit('initialize-grid',data)
		io.to(roomName).emit('initialize-grid',data)
		io.to(roomName).emit('receive-turn',0)
	})




	socket.on('send-turn',i => {
		let  roomName = users[socket.id]		
		rooms[roomName].turn = i 
		io.to(roomName).emit('receive-turn',i)
		
	})


	socket.on('send-click-grid',data => {
		let  roomName = users[socket.id]		
		rooms[roomName]["grid"][data.i][data.j]["color"] = data.colors
		rooms[roomName]["grid"][data.i][data.j]["count"] = data.count
		socket.broadcast.to(roomName).emit('receive-grid-click',data)
	})

	socket.on('send-blast',data=>{
		let  roomName = users[socket.id]		
		socket.broadcast.to(roomName).emit('receive-blast',data)
	})

	socket.on('send-winner',name =>{
		let roomName = users[socket.id]
		socket.broadcast.to(roomName).emit('receive-winner',name)
	})



	socket.on('disconnect', ()=>{
		roomName = users[socket.id]		
		if (roomName != null){
			userName = rooms[roomName].users[socket.id]["name"]

			
			delete rooms[ roomName ].users[socket.id]
			delete users[socket.id]
			if (Object.keys(rooms[roomName].users).length == 0)
				delete rooms[roomName]
			else
			{
				socket.broadcast.to(roomName).emit('user-left',userName)
				socket.broadcast.to(roomName).emit('member-list',rooms[roomName].users)	
			}			
			socket.broadcast.emit('list-rooms',rooms)
			socket.leave(roomName)

		}
		console.log("disconnected with ",socket.id)
		
	})


})
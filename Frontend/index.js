const socket = io()
const listdiv = document.getElementById("list-rooms")
const inputField = document.getElementById('room-name')

socket.on('list-rooms',rooms => {				
	listdiv.innerHTML = ''
	Object.keys(rooms).forEach( name => {
		listdiv.innerHTML += `<div><p>${name.replace(/-/," ")}  Online: ${Object.keys(rooms[name].users).length} </p> <button onclick="joinRoom('${name}')" >JOIN</button></div>`
	})
})

function joinRoom(roomName) {
	roomName = roomName.replace(/ /,'-')
	window.location.href = window.location.href.replace("index.html",`game.html?name=${roomName}`)
}

function createRoom(event){
	event.preventDefault()	
	if (inputField.value.trim().length != 0){
		roomName = inputField.value.trim().replace(/ /,"-")
		socket.emit('create-room',roomName)		
	}
}
socket.on('join-created-room',roomName=>{
	window.location.href = window.location.href.replace("index.html",`game.html?name=${roomName}`)
})
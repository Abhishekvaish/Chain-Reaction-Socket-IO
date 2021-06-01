const socket = io('http://localhost:5000')
let name = ""
let roomName = ""


while (name == null || name.trim().length == 0 ) {	
	name = prompt("Please choose a nick name")
}



urlParams = new URLSearchParams(window.location.search);
roomName  = urlParams.get("name")
if (roomName != null && roomName.trim().length != 0 )
{
	socket.emit('join-room',{
		"userName":name,
		"roomName":roomName
	})	
}

socket.on('redirect-home',()=>{
	window.location.href = window.location.href.replace(/game.html.*/,"index.html")
})




function send(e) {
	e.preventDefault();
	const msg = document.getElementById("msg");
	socket.emit('send-msg',msg.value);
	msgbox.innerHTML += `<div  class="me"><p> Me : ${msg.value}</p></div>`
	msg.value = ''
	msgbox.scrollTop = msgbox.scrollHeight

}

socket.on('user-joined' , name => {
	msgbox.innerHTML += `<div  class="joined"><p> ${name} joined the chat</p></div>`
	msgbox.scrollTop = msgbox.scrollHeight

})
socket.on('user-left' , name => {
	msgbox.innerHTML += `<div class="left"><p> ${name} left the chat</p></div>`
	msgbox.scrollTop = msgbox.scrollHeight

})

socket.on('receive-msg',data => {
	msgbox.innerHTML += `<div class="other"><p> ${data.name} : ${data.msg}</p></div>`
	msgbox.scrollTop = msgbox.scrollHeight
	
})
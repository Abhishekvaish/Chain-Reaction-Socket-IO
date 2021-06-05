const socket = io('http://localhost:5000')
const msgbox = document.getElementById("msgbox")
const membersbox  = document.getElementById("membersbox")
const startform = document.getElementById("start-game")
const mainbox = document.getElementById("main")
const turnbox = document.getElementById("turn")

let name = ""
let roomName = ""
let color = ""
let rows = 0
let cols = 0 
let myIndex = 0
let turnIndex = 0 
let players = {}
let grid = []

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

socket.on('member-list' , members => {
	color = members[socket.id]["color"]
	if (members[socket.id]["admin"])
		startform.style.display = "block"

	players = members
	membersbox.innerHTML = ""
	let i = 0 
	Object.keys(members).forEach( mem => {
		if (mem == socket.id)
			myIndex = i
		membersbox.innerHTML += `<div class="mem"><div class="color" style="background-color:${ members[mem]["color"] }"></div> ${ members[mem]["name"]} </div>`
		i++
	} )	

})



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







function preview(){
	rows = startform.children[0].value
	cols = startform.children[1].value
	if (cols == null || cols == 0)
		cols = rows
	
	mainbox.innerHTML =""
	for(let i=0;i<rows;i++)
	{
		for(let j=0 ; j<cols ;j++)
			mainbox.innerHTML += `<div class="box" onclick="gridclick(${i},${j},this)" style="width: calc(95vw / ${cols} );height : calc(95vw / ${cols} ) "></div>`
	}
	main.style.gridTemplateColumns = "auto ".repeat(cols)

}


function startGame(event) {
	event.preventDefault();
	rows = startform.children[0].value
	cols = startform.children[1].value
	socket.emit('grid-size',{
		"rows":rows,
		"cols":cols
	})
	startform.style.display="none"
	toggleMemSidePanel()
}

socket.on('initialize-grid' , data => {
	rows = data.rows
	cols = data.cols
	mainbox.innerHTML =""
	for(let i=0;i<rows;i++)
	{
		for(let j=0 ; j<cols ;j++)
			mainbox.innerHTML += `<div class="box" onclick="gridclick(${i},${j},this)" style="width: calc(95vw / ${cols} );height : calc(95vw / ${cols} ) "></div>`
	}
	main.style.gridTemplateColumns = "auto ".repeat(cols)
	grid = Array( parseInt(data.rows) ).fill(0).map( x=> Array(parseInt(data.cols) ).fill({"count":0,"color":null}))
})





function rgbToHex(colorstr) {
	// colorstr = "rgb(255,0,0)"
	colorstr = colorstr.split("(")[1].split(")")[0].split(",")
	// colorstr = ["255","0","0"]
	return "#"+colorstr.map(x =>{
		    x = parseInt(x).toString(16)
	    	return x.length==1?"0"+x : x
		} ).join("")
	
}

function getVictims(i,j){
	
	// -----------corners---------------------
	if (i == 0 && j == 0){
		if (grid[i][j]["count"] == 1)
			return [ [i+1,j] , [i,j+1]]
		else
			return null
	}
	
	if (i == 0 && j == cols-1){
		if (grid[i][j]["count"] == 1)
			return [ [i+1,j] , [i,j-1] ]
		else
			return null
	}

	if(i == rows-1  && j == 0){
		if( grid[i][j]["count"]  == 1 )
			return [ [i-1,j ], [i,j+1] ]
		else 
			return null
	}

	if(i == rows-1 && j == cols-1 ){
		if( grid[i][j]["count"] == 1 )
			return [ [i,j-1] ,[i-1,j] ]
		else
			return null
	}


	//------------------edges-------------------

	if(i == 0){
		if (grid[i][j]["count"] == 2 )
			return [ [i,j-1],[i,j+1],[i+1,j] ]
		else
			return null
	}
	if (i == rows-1){
		if (grid[i][j]["count"] == 2 )
			return [ [i,j-1],[i,j+1],[i-1,j] ]
		else
			return null	
	}
	if(j == 0){
		if(grid[i][j]["count"] == 2)
			return [ [i-1,j],[i+1,j],[i,j+1] ]
		else
			return null
	}
	if(j == cols-1){
		if(grid[i][j]["count"] == 2)
			return [ [i-1,j],[i+1,j],[i,j-1] ]
		else
			return null
	}
	//---------center------------------
	if(grid[i][j]["count"] == 3){
		return [ [i-1,j],[i+1,j],[i,j-1],[i,j+1]  ]
	}
	else
		return null

}



function gridclick(i , j , div){

	if(div.children.length != 0 && rgbToHex(div.children[0].children[0].children[0].style.color) != color)
		return

	if(turnIndex != myIndex)
		return

	turnIndex = (turnIndex + 1)%Object.keys(players).length


	let victims =  [ [i,j] ]
	let u = null
	let adj = []
	let data = {}
	// let failsafe = 0 
	while( victims.length !=0  ){

		// failsafe++
		// if(failsafe > 10)
		// 	return
		// console.log(String(victims))

		u = victims.shift()
		
		
		adj = getVictims(u[0],u[1])		
		// alert(`${u} , ${adj}`)
		if (adj == null ){
			data = {
				"i"	: u[0] ,
				"j" : u[1] ,
				"color":color,
				"count": grid[ u[0] ][ u[1] ]["count"] + 1
			}
			socket.emit('send-click-grid',data)
			receiveGridClick(data)
		}
		else {
			data ={
				"i"	: u[0] ,
				"j" : u[1] ,
				"color":null,
				"count": 0
			}
			socket.emit('send-click-grid',data)
			receiveGridClick(data)			
			victims.push(...adj)
		}
	}
	let isWinner = true;
	let totalcount = 0 ;
	grid.forEach( row =>{
		row.forEach( cell=>{
			totalcount += cell.count
			if ( cell.color != null && cell.color != color)
				isWinner = false
		} )
	})
	if (isWinner && totalcount > 1){
		startform.style.display="block"
		socket.emit('send-winner',name)
		receiveWinner(name)		
		return
	}
	

	// after animations of move //TODO
	socket.emit('send-turn',turnIndex)
	
}

function receiveWinner(winnerName) {

	if (winnerName == name)
		alert("You win !!!!")
	else
		alert(`${winnerName} won :( `)

}
socket.on('receive-winner',winnerName=>{
	setTimeout(receiveWinner(winnerName) , 1000)
	
})



function receiveGridClick(data){
	grid[data.i][data.j] = {
		"color" : data.color,
		"count":data.count
	}
	if (data.color)
	{	
		if (data.count == "1" )
			mainbox.children[data.i*cols+data.j].innerHTML = `
					<div class="rotbox">
						<div>
							<span class="material-icons star star-single" style ="color:${data.color};font-size:calc(95vw / ${cols} * 0.7)">star</span>
						</div>
					</div>`
		else if(data.count == "2")
			mainbox.children[data.i*cols+data.j].innerHTML = `
					<div class="rotbox">
						<div>
							<span class="material-icons star star-double-0" style ="color:${data.color};font-size:calc(95vw / ${cols} * 0.4)">star</span>
							<span class="material-icons star star-double-1" style ="color:${data.color};font-size:calc(95vw / ${cols} * 0.4)">star</span>
						</div>
					</div>`
		else if(data.count =="3")
			mainbox.children[data.i*cols+data.j].innerHTML = `
					<div class="rotbox">
						<div>
							<span class="material-icons star star-triple-0" style ="color:${data.color};font-size:calc(95vw / ${cols} * 0.4)">star</span>
							<span class="material-icons star star-triple-1" style ="color:${data.color};font-size:calc(95vw / ${cols} * 0.4)">star</span>
							<span class="material-icons star star-triple-2" style ="color:${data.color};font-size:calc(95vw / ${cols} * 0.4)">star</span>
						</div>
					</div>`

	}
	else
		mainbox.children[data.i*cols+data.j].innerHTML = ``
}

socket.on('receive-grid-click',data=>{
	receiveGridClick(data)
})





socket.on('receive-turn', i=>{
	turnIndex = i

	turnbox.style.display = "inline-block"
	turnbox.children[0].innerText = players[Object.keys(players)[i]]["name"]
	turnbox.children[1].style.backgroundColor = players[Object.keys(players)[i]]["color"]

})



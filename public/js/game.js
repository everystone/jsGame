/**************************************************
** GAME VARIABLES
**************************************************/
var canvas,			// Canvas DOM element
	ctx,			// Canvas rendering context
	keys,			// Keyboard input
	localPlayer,	// Local player
    remotePlayers,  // Remote players
    socket,         // Websocket
    walls,          //Walls
    buildmode,      //Are we in buildmode?
    buildWall,    //Current buildable wall
    preRender,    //Second canvas, used to pre-render walls.
    mouseX,       //Current mouseX 
    mouseY;       //Current mouseY
/**************************************************
** GAME INITIALISATION
**************************************************/
function init(socket) {
	// Declare the canvas and rendering context
	canvas = document.getElementById("gameCanvas");
        //canvasTemp = document.createElement("canvas");
        canvasTemp = document.getElementById("canvas");
         ctx = canvas.getContext("2d");
        ctxTemp = canvasTemp.getContext("2d");

	// Maximise the canvas
	canvas.width = window.innerWidth;
	canvas.height = window.innerHeight;

	canvasTemp.width = canvas.width;
        canvasTemp.height = canvas.height;
        // Initialise keyboard controls
	keys = new Keys();

	// Calculate a random start position for the local player
	// The minus 5 (half a player size) stops the player being
	// placed right on the egde of the screen
	var startX = Math.round(Math.random()*(canvas.width-5)),
		startY = Math.round(Math.random()*(canvas.height-5));

	// Initialise the local player
	localPlayer = new Player(startX, startY, ctx);

	// Start listening for events
	setEventHandlers();

    //Init websocket
    this.socket = socket;

    remotePlayers = [];
    walls = [];
    buildWall = [];
    
};


/**************************************************
** GAME EVENT HANDLERS
**************************************************/
var setEventHandlers = function() {
	// Keyboard
	window.addEventListener("keydown", onKeydown, false);
	window.addEventListener("keyup", onKeyup, false);

        //Mouse
        canvas.addEventListener("mousedown", onMouseDown, false);
        canvas.addEventListener("mouseup", onMouseUp, false);
        canvas.addEventListener("mousemove", onMouseMove, false);        

	// Window resize
	window.addEventListener("resize", onResize, false);

    //Socket
    socket.on("connect", onSocketConnected);
    socket.on("disconnect", onSocketDisconnect);
    socket.on("new player", onNewPlayer);
    socket.on("move player", onMovePlayer);
    socket.on("remove player", onRemovePlayer);
    
    socket.on("build wall", onBuildWall);

};

// Keyboard key down
function onKeydown(e) {
        //Check for Esc
        if(e.keyCode == 27){
            buildmode=false;
            console.log("build canceled");
        }

	if (localPlayer) {
		keys.onKeyDown(e);
	};
};

// Keyboard key up
function onKeyup(e) {
	if (localPlayer) {
		keys.onKeyUp(e);
	};
};

// Browser window resize
function onResize(e) {
	// Maximise the canvas
	canvas.width = window.innerWidth;
	canvas.height = window.innerHeight;
};

function onMouseUp(e){
    console.log("Mouse Up "+e.x+", "+e.y);
    console.dir(e);
    if(e.button == 2){ //rightclick, cancel build
        buildmode = false;
        return;
    }
}

function onMouseDown(e){
    console.log("Mouse down "+e.x+", "+e.y);
    if(e.button == 0 && !buildmode){
    buildWall.x = e.x;
    buildWall.y = e.y;
    buildmode  = true;
    return;
    }
        buildWall.x2 = (e.x);
        buildWall.y2 = (e.y);
        socket.emit("build wall", {x:buildWall.x,y:buildWall.y,x2:buildWall.x2,y2:buildWall.y2});
        onBuildWall(buildWall);
        buildWall.x = -1;  
        buildmode = false; 

}
function onMouseMove(e){
    mouseX = e.x;
    mouseY = e.y;
}


function onSocketConnected() {
    console.log("Connected to socket server");

    //Announce our arrival
    socket.emit('new player', {x:localPlayer.getX(), y: localPlayer.getY()});
};

function onSocketDisconnect() {
    console.log("Disconnected from socket server");
};

function onNewPlayer(data) {
    console.log("New player connected: "+data.id);
    var newPlayer = new Player(data.x, data.y);
    newPlayer.id = data.id;
    remotePlayers.push(newPlayer);  //add to array
};

function onMovePlayer(data) {

    var player = playerById(data.id);
    if(!player){
        console.log("Error, player not found: "+data.id);
        return;
    }
    player.setX(data.x);
    player.setY(data.y);
};

//Construct wall
function onBuildWall(data){
    var wall = new Wall(data.x, data.y, data.x2, data.y2);
    walls.push(wall);

    //Pre render
    ctxTemp.beginPath(); 
    //Mark walls ( lineTo )
    for(i=0;i<walls.length;i++){
        walls[i].draw(ctxTemp);
    }
    ctxTemp.stroke(); //draws the walls.
        console.log("Wall built. "+data.x+"," +data.y+", "+data.x2+", "+data.y2);
        console.log("tatal walls: "+walls.length);
        console.dir(walls); 
}

function onRemovePlayer(data) {
    //Find player by id
    var player = playerById(data.id);
    if(!player){
        console.log("Player not found: "+data.id);
        return;
    }
    remotePlayers.splice(remotePlayers.indexOf(player), 1);
    console.log("Player disconnected");
};


/**************************************************
** GAME ANIMATION LOOP
**************************************************/
function animate() {
	update();
	draw();

	// Request a new animation frame using Paul Irish's shim
	window.requestAnimFrame(animate);
};


/**************************************************
** GAME UPDATE
**************************************************/
function update() {
    //Do player input, and, if position is changed, tell server
	if(localPlayer.update(keys)){
        socket.emit("move player", {x: localPlayer.getX(), y: localPlayer.getY()});
    }

                
};


/**************************************************
** GAME DRAW
**************************************************/
function draw() {
	// Wipe the canvas clean
	ctx.clearRect(0, 0, canvas.width, canvas.height);

        //Draw the pre-rendered Wall canvas
       ctx.drawImage(canvasTemp, 0, 0); 

	// Draw the local player
	localPlayer.draw(ctx);

    //Draw remote players
    var i;
    for(i=0;i<remotePlayers.length;i++){
        remotePlayers[i].draw(ctx);
    }

    //if in buildmode, draw current wall in progress
    if(buildmode){
        ctx.beginPath();
        ctx.moveTo(buildWall.x, buildWall.y);
        ctx.lineTo(mouseX, mouseY);
        ctx.stroke();   
 }

};



/** HELPER FUNCTIONS */
function playerById(id){
    for(var i=0;i<remotePlayers.length;i++){
        if(remotePlayers[i].id == id)
        return remotePlayers[i];
    }
    return false;
}

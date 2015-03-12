/**************************************************
** GAME VARIABLES
**************************************************/
var canvas,			// Canvas DOM element
	ctx,			// Canvas rendering context
	keys,			// Keyboard input
	localPlayer,	// Local player
    remotePlayers,  // Remote players
    socket;         // Websocket

/**************************************************
** GAME INITIALISATION
**************************************************/
function init(socket) {
	// Declare the canvas and rendering context
	canvas = document.getElementById("gameCanvas");
	ctx = canvas.getContext("2d");

	// Maximise the canvas
	canvas.width = window.innerWidth;
	canvas.height = window.innerHeight;

	// Initialise keyboard controls
	keys = new Keys();

	// Calculate a random start position for the local player
	// The minus 5 (half a player size) stops the player being
	// placed right on the egde of the screen
	var startX = Math.round(Math.random()*(canvas.width-5)),
		startY = Math.round(Math.random()*(canvas.height-5));

	// Initialise the local player
	localPlayer = new Player(startX, startY);

	// Start listening for events
	setEventHandlers();

    //Init websocket
    this.socket = socket;

    remotePlayers = [];
};


/**************************************************
** GAME EVENT HANDLERS
**************************************************/
var setEventHandlers = function() {
	// Keyboard
	window.addEventListener("keydown", onKeydown, false);
	window.addEventListener("keyup", onKeyup, false);

	// Window resize
	window.addEventListener("resize", onResize, false);

    //Socket
    socket.on("connect", onSocketConnected);
    socket.on("disconnect", onSocketDisconnect);
    socket.on("new player", onNewPlayer);
    socket.on("move player", onMovePlayer);
    socket.on("remove player", onRemovePlayer);
};

// Keyboard key down
function onKeydown(e) {
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

	// Draw the local player
	localPlayer.draw(ctx);

    //Draw remote players
    var i;
    for(i=0;i<remotePlayers.length;i++){
        remotePlayers[i].draw(ctx);
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
/**************************************************
** GAME VARIABLES
**************************************************/
var canvas,			// Canvas DOM element
	ctx,			// Canvas rendering context
	keys,			// Keyboard input
	localPlayer,	// Local player
    remotePlayers,  // Remote players
    socket,         // Websocket
    buildmode,      //Are we in buildmode?
    buildWall,    //Current buildable wall
    worldWidth,       //Current mouseX
    worldHeight,       //Current mouseY
    grid;            //The level gri
// Pathfinding moved to serverside.

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
	//canvas.width = window.innerWidth;
	//canvas.height = window.innerHeight;
    grid = []; // 1024
    size = 20;
    worldWidth = 50;
    worldHeight = 30;

    currentPath = [];


    canvas.width = worldWidth * size;
    canvas.height = worldHeight * size;

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
    buildWall = [];

    //Grid creation and pathfinding moved to serverside.
};



function redrawMap(){
    ctxTemp.clearRect(0, 0, canvas.width, canvas.height);
    ctxTemp.beginPath();
    ctxTemp.strokeStyle = "#ccc"; //#ccc
    for (var i = 0; i < worldWidth; i++) {
        for(var j = 0; j<worldHeight;j++) {
            //draw grid
            ctxTemp.moveTo(size * i,size * j);
            ctxTemp.lineTo(size * (i+1), size*j);
            ctxTemp.moveTo(size * i, size * j);
            ctxTemp.lineTo(size * i, size*(j+1));

            //Draw block
            if(grid[i][j].block != 0){
                ctxTemp.fillStyle = blockColor(grid[i,j].block);
                ctxTemp.fillRect(i*size, j*size, size, size);
            }
        }
    }
    ctxTemp.stroke();

}

/*
*  Draws the path calculated by pathfinding js
*  currentPath is array of coordinates containing current path to player, sent from server.
 */
function drawPath(ctx){

   // ctx.fillStyle = "#E8E676"; //#ccc
    ctx.moveTo(5, 5); //enemy spawn
    ctx.beginPath();
    for(i =0;i<currentPath.length;i++){

        var x,y;
        xy = currentPath[i];
        //console.log("path: "+xy);
        ctx.lineTo(xy[0]*size+(size/2), xy[1]*size+(size/2));
       // ctx.fillRect(xy[0]*size, xy[1]*size, size, size);
    }
    ctx.stroke();
}

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
    
    socket.on("build block", onBuildBlock);
    socket.on("destroy block", onDestroyBlock);
    socket.on("level update", onLevelUpdate);
    socket.on("path test", onPathTest);


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
	//canvas.width = window.innerWidth;
	//canvas.height = window.innerHeight;
};

function onMouseUp(e){
        buildmode = false;
}

function onMouseDown(e){
    if(e.button != 0)
        return;
    var mouse = {};
    mouse.x = e.x - canvas.offsetLeft;
    mouse.y = e.y - canvas.offsetTop;

    if( blockAt(mouse.x, mouse.y).type == 0){// Clicked empty block
        buildmode = true;
        buildBlock(mouse, 1);
    }else {
        //Clicked existing wall, remove it.
        socket.emit("destroy block", blockAt(mouse.x, mouse.y)) //tell server
        onDestroyBlock(blockAt(mouse.x, mouse.y));;
    }

}
function onMouseMove(e){
    if(!buildmode)
        return;
    var mouse = {};
    mouse.x = e.x - canvas.offsetLeft;
    mouse.y = e.y - canvas.offsetTop;
        //@TODO: check what type of block to build.
        buildBlock(mouse, 1);
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


function onPathTest(data){
    currentPath = data;
}

//Construct block. wall = 1, door = 2
function onBuildBlock(data){
    grid[data.x][data.y].block = data.block;
    ctxTemp.fillStyle = blockColor(data.block);
    ctxTemp.fillRect(data.x*size, data.y*size, 20, 20);
}
function onDestroyBlock(data){
    grid[data.x][data.y].block = 0;
    redrawMap();
}

/* Server sends level grid */
function onLevelUpdate(data){
    grid = data;
    redrawMap();
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

    //Draw pathfinding
    drawPath(ctx);

    //if in buildmode, draw current wall in progress
  /*
    if(buildmode){
        ctx.beginPath();
        ctx.moveTo(buildWall.x, buildWall.y);
        ctx.lineTo(mouseX, mouseY);
        ctx.stroke();   
 }*/
};



/** HELPER FUNCTIONS */
/* Returns object with x, y, and type. representing block at x,y */
function blockAt(x,y){
    var block = {};
    block.x = Math.round( (x-(size/2)) / size);
    block.y = Math.round( (y-(size/2)) / size);
    block.type = grid[block.x][block.y].block;
    //console.log("Checking" +Math.round( (x-(size/2)) / size), Math.round( (y-(size/2)) / size));
    return block;
}

function blockColor(type){
    switch(type){
        case 1:     //Wall
            return "#61412C";
            break;
        case 2:     // Door
            return "#D98484";
            break;
        case 3:     // Water
            return "#5156DB";
            break;
        default:
           return "#61412C";
            break;
    }
}
/* Helper function, used when local player is building */
function buildBlock(e, type){
    var block = blockAt(e.x, e.y);
    onBuildBlock(block); //Trigger a buildBlock event locally
    socket.emit("build block", block);
}



function playerById(id){
    for(var i=0;i<remotePlayers.length;i++){
        if(remotePlayers[i].id == id)
        return remotePlayers[i];
    }
    return false;
}

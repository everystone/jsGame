Player = require('./player').Player;
PF = require('pathfinding'); //pathfinding.js
module.exports = function (io) {
  'use strict';

    var players, level, worldWidth, worldHeight;

    //Pathfinding
    var finder, pfGrid, pfGridClone;

    function init(){
        /* Setup vars */

        players = [];
        level = [];
        worldWidth = 50;
        worldHeight = 30;
        finder = new PF.AStarFinder();
        //Init level and pathfinding grid.
        generateLevel();
        console.log("Socket init");
        setEventHandlers();
    }
    var setEventHandlers = function(){
        io.on("connection", onSocketConnection);
    };

    var generateLevel = function(){
            //generate grid
            pfGrid = new PF.Grid(worldWidth, worldHeight);

            /* Create a new *Empty* Map */
            for (var i = 0; i < worldWidth; i++) {
                level[i] = [];
                for(var j = 0; j<worldHeight;j++){
                    level[i][j] = {};
                    level[i][j].block = 0;
                    pfGrid.setWalkableAt(i, j, true);
                    }
                }
    };
    
    function onSocketConnection(client){
        console.log("New player has connected: "+client.id);

        /* socket events from clients */
        client.on("disconnect", onClientDisconnect);
        client.on("new player", onNewPlayer);
        client.on("move player", onMovePlayer);
        client.on("build block", onBuildBlock);
        client.on("destroy block", onDestroyBlock);
    }

    function onClientDisconnect(){
        console.log("Player has disconnected: "+this.id); //this = client from onSocketConnection

        //Remove player from array
        var player = playerById(this.id);
        if(!player){
            console.log("Player not found..");
            return;
        }
        players.splice(players.indexOf(player), 1); //removes player from array
        this.broadcast.emit("remove player", {id: this.id});
    }

    /* NEW PLAYER */
    function onNewPlayer(data){
        var newPlayer = new Player(data.x,data.y);
        newPlayer.id = this.id;

        //Notice other players that a new player has joined
        this.broadcast.emit("new player", {id: newPlayer.id, x: newPlayer.getX(), y: newPlayer.getY()});

        //Tell the newplayer about the others
        var i, existingPlayer;
        for(i=0;i<players.length;i++){
            existingPlayer = players[i];
            this.emit("new player", {id: existingPlayer.id, x: existingPlayer.getX(),y: existingPlayer.getY()});
        }
        
        //Send the map
        this.emit("level update", level);
        
        players.push(newPlayer);
    }

    /* MOVE PLAYER */
    function onMovePlayer(data){
        var player = playerById(this.id);
        if(!player){ console.log("ERROR: player not found: "+this.id); return;}

        player.setX(data.x);
        player.setY(data.y);

        //Tell others that player moved
        this.broadcast.emit('move player', {id: player.id, x: player.getX(), y: player.getY()});

        //Test pathfinding
        this.emit("path test", pathToPos(data.x, data.y));
    }

    /* Build Block */
    function onBuildBlock(data){
    level[data.x][data.y].block = data.block; //update level grid
    pfGrid.setWalkableAt(data.x, data.y, false); //update pathfinding grid
    //Broadcast to everyone that a block is built.
    this.broadcast.emit("build block", data);
    }

    /* Destroy block */
    function onDestroyBlock(data){
        level[data.x][data.y].block = 0;
        pfGrid.setWalkableAt(data.x, data.y, true);
        this.broadcast.emit("destroy block", data);
    }

    /** Helper functions */

    /* finds player by id (duh) returns player if found, false if not found */
    function playerById(id){
        var i;
        for(i=0;i<players.length;i++){
            if(players[i].id == id){
                return players[i];
            }
        }
        return false;
    }

    /* Pathfinding */
    function pathToPos(x, y){
        var size = 20; // grid size
        //Backup pfGrid
        pfGridClone = pfGrid.clone();
        //Calculate new npc path
        var path = finder.findPath(10, 10, Math.round(x/size), Math.round(y/size), pfGrid);
        //Restore grid
        pfGrid = pfGridClone.clone();
        return path;
    }

    init();

};

Player = require('./player').Player;

module.exports = function (io) {
  'use strict';

    var players;

    function init(){
        players = [];

        console.log("Socket init");
        setEventHandlers();
    }
    var setEventHandlers = function(){
        io.on("connection", onSocketConnection);
    };

    function onSocketConnection(client){
        console.log("New player has connected: "+client.id);
        client.on("disconnect", onClientDisconnect);
        client.on("new player", onNewPlayer);
        client.on("move player", onMovePlayer);
        client.on("build wall", onBuildWall);
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
        players.push(newPlayer);
    }

    /* MOVE PLAYER */
    function onMovePlayer(data){
        var player = playerById(this.id); //@TODO this.id or data.id ?
        if(!player){ console.log("ERROR: player not found: "+this.id); return;}

        player.setX(data.x);
        player.setY(data.y);

        //Tell others that player moved
        this.broadcast.emit('move player', {id: player.id, x: player.getX(), y: player.getY()});

    }

    /* Build Wall */
    function onBuildWall(data){
    
    //Broadcast to everyone that a wall is built.
    this.broadcast.emit("build wall", data);
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
    init();

};

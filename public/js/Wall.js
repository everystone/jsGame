/**************************************************
** GAME PLAYER CLASS
**************************************************/
var Wall = function(startX, startY, endX, endY) {
	var x = startX,
    	y = startY,
        x2 = endX,
        y2 = endY,
        owner_id;


    /* Getters and setters */
    var getX = function() {
        return x;
    };

    var getY = function() {
        return y;
    };

	
    var draw = function(ctx) {
	    //ctx.fillRect(x-5, y-5, 10, 10);
            //ctx.drawLine(x, y, x2, y2);
              ctx.moveTo(x, y);
              //ctx.fillTo(x2, y2);
              ctx.lineTo(x2, y2);
              ctx.lineWidth = 3;
              ctx.strokeStyle='#72A4B0';
             // ctx.stroke();
	};

    /* public methods */
	return {
        getX: getX,
        getY: getY,
	draw: draw

	}
};

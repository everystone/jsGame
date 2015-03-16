/**************************************************
** GAME PLAYER CLASS
**************************************************/
var Player = function(startX, startY, context) {
	var x = startX,
		y = startY,
        id,
        ctx = context,
		moveAmount = 2;


    /* Getters and setters */
    var getX = function() {
        return x;
    };

    var getY = function() {
        return y;
    };

    var setX = function(newX) {
        x = newX;
    };

    var setY = function(newY) {
        y = newY;
    };


	var update = function(keys) {

        var prevX = x;
        var prevY = y;

		// Up key takes priority over down
		if (keys.up) {
                        if(collision(x, y-8))
                            return false;
			y -= moveAmount;
		} else if (keys.down) {
                        if(collision(x, y+5))
                            return false;
			y += moveAmount;
		};

		// Left key takes priority over right
		if (keys.left) {
                        if(collision(x-8, y))
                            return false;
			x -= moveAmount;
                        
		} else if (keys.right) {
                        if(collision(x+5, y))
                            return false;
			x += moveAmount;
		};

        //returns true if positon has changed
        return (prevX != x || prevY != y) ? true : false;
	};

	var draw = function(ctx) {
		ctx.fillRect(x-5, y-5, 10, 10);
	};

    /* public methods */
	return {
        getX: getX,
        getY: getY,
        setX: setX,
        setY: setY,
        update: update,
		draw: draw

	}
};
/* Collision Detection */
function collision(x, y) {

        // Collision detection. Get a clip from the screen.
        var clipWidth = 2;
        var clipDepth = 2;
        var clipLength = clipWidth * clipDepth;
        // alert(clipLength);
        var clipOffset = 0;
        var whatColor = ctx.getImageData(x + clipOffset, y + clipOffset, clipWidth, clipDepth);

        // Loop through the clip and see if you find red or blue. 
        for (var i = 0; i < clipLength * 4; i += 4) {
         console.log(whatColor.data[i]);
         if (whatColor.data[i] == 242) {
           // alert("red");
            return true;
            break;
          }
          // Fourth element is alpha and we don't care. 
        }
        return false;
      }

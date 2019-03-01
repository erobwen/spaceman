let log = console.log;
log("======================================");
log("            Spaceman game             ")
log("======================================");

/**
 *  Debug and helpers
 */
function debugArguments(a, b, c, d, e, f) {
	log("Arguments: ");
	log(a);
  log(b);
  log(c);
  log(d);
  log(e);
  log(f);
}

function oppositeSign(number) {
  return (number > 0) ? -1 : 1;
}

function sign(number) {
	return (number >= 0) ? 1 : -1;
}


/**
 *  Setup canvas
 */
 
 log(document);
let canvas = document.getElementById("canvas");
log(canvas);
canvas.width = canvas.getClientRects()[0].width;
canvas.height = canvas.getClientRects()[0].height;


/**
 *  Key state tracker
 */
 
let keyStates = {};

document.addEventListener("keydown", function(event) {
	log(event.key);
  keyStates[event.code] = 1;
  log(keyStates);
}, true);

document.addEventListener("keyup", function(event) {
  keyStates[event.code] = 0;
  log(keyStates);
}, true);

function keyDown(code) {
	return typeof(keyStates[code]) === 'undefined' ? 0 : keyStates[code]; 
}


/**
 *  Geometric rectangle base class
 */

function left(object) {
	return object.x - object.originX;
}

function right(object) {
	return object.x - object.originX + object.width;
}

function topY(object) {
	return object.y - object.originY;
}

function bottom(object) {
	return object.y - object.originY + object.height;
}

function centerX(object) {
	return (left(object) + right(object))/2;
}

function centerY(object) {
	return (topY(object) + bottom(object))/2;
}


function calculateCollision(A, B) {
  let collisionLeft = Math.max(left(A), left(B));
  let collisionRight = Math.min(right(A), right(B));
  let collisionTop = Math.max(topY(A), topY(B));
  let collisionBottom = Math.min(bottom(A), bottom(B));
  if (collisionLeft < collisionRight && collisionTop < collisionBottom)
    return new newRectangle(collisionLeft, collisionTop, collisionRight - collisionLeft, collisionBottom - collisionTop);
  else
    return null;
}

function newRectangle(x, y, width, height, originX, originY, color) {
	if (typeof(originX) === 'undefined') originX = 0;
	if (typeof(originY) === 'undefined') originY = 0;
	if (typeof(color) === 'undefined') color = "pink";
  return {
  	name: "rectangle",
    x: x,
    y: y,
    originX: originX,
    originY: originY,
    width: width,
    height: height,
    color: color,
    render: function(context, camera) {
      if (calculateCollision(this, camera) !== null) {
        // log("render rectangle" + this.color);        
        context.rect(Math.round(left(this) - left(camera)), Math.round(topY(this) - topY(camera)), this.width, this.height);
        context.fillStyle = this.color;
        context.fill();
        // context.stroke();
      }
    },
    solid: false
  }
}


/**
 *  Builders
 */
function newImmobileObject(x, y, width, height, originX, originY) {
	if (typeof(originX) === 'undefined') originX = 0;
	if (typeof(originY) === 'undefined') originY = 0;
	let result = newRectangle(x, y, width, height, originX, originY);
  result.mobile = false;
  return result;
}

function newMobileObject(x, y, width, height, originX, originY) {
	if (typeof(originX) === 'undefined') originX = width / 2; // Mobile objects have center origin.
	if (typeof(originY) === 'undefined') originY = height / 2;
	let result = newRectangle(x, y, width, height, originX, originY);
  result.mobile = true;
  result.xSpeed = 0;
  result.ySpeed = 0;
  result.accellerate = function() {};
  result.animate = function(timeDuration) {};
  result.resetCollisionState = function() {};
  result.collide = function() {};
  return result;
}


function newCamera(x, y) {
	let result = newMobileObject(x, y, canvas.width, canvas.height);
  result.name = "camera";
  result.accellerate = function() {
  	camera.xSpeed = (player.x - camera.x) / 2;
		camera.ySpeed = (player.y - camera.y) / 2;
  }
  result.solid = false;
	result.render = function() {}; // Never render itself!
  return result;
}

function newWall(x, y, width, height, image) {
	let wall = newImmobileObject(x, y, width, height);
  wall.name = "wall";
  wall.image = image; 
  wall.render = function(context, camera) {
    if (calculateCollision(this, camera) !== null) {    
      // log("render wall");
      // log(image);
      // log(images[image]);
      let pattern = context.createPattern(images[image], "repeat");
      pattern.setTransform(new DOMMatrix([1, 0, 0, 1, -left(camera), -topY(camera)])); // Only works in Google Chrome and some others.   // Read: https://stackoverflow.com/questions/20253210/canvas-pattern-offset
      // context.setTransform(1, 0, 0, 1, -left(camera), -topY(camera)); // Did not work
      // context.rect(left(this), topY(this), this.width, this.height);   
      // context.setTransform(1, 0, 0, 1, 0, 0);
      context.rect(Math.round(left(this) - left(camera)), Math.round(topY(this) - topY(camera)), this.width, this.height);   
      context.fillStyle = pattern;
      context.fill();
      context.strokeStyle = "gray";
      context.lineWidth = 1;
      context.stroke();
    }
  }
  setSolid(wall);
  return wall;
}


/**
 *  Object modifiers
 */

function setSolid(object) {
	object.solid = true;
}

function setImage(object, image) {
	object.image = image;
  object.imageRotation = 0; //from 0 to 2 Math.PI. Note, this will not influence collision, so it is mostly cosmetic
  
  object.useTiles = false;
  object.tileWidth = 0;
  object.tileHeight = 0;
  object.spacer = 0;
  object.imageTile = {x: 0, y: 0};
  
  object.render = function(context, camera) {
    let canvasLeft = left(this) -left(camera);
    let canvasTop = topY(this) - topY(camera);

    if (calculateCollision(object, camera) !== null) {    
      if (this.imageRotation !== 0) {
        context.transform(1, 0, 0, 1, canvasLeft + this.originX, canvasTop + this.originY);
        context.rotate(this.imageRotation);
        context.transform(1, 0, 0, 1, -(canvasLeft + this.originX), -(canvasTop + this.originY));
      }
      
      if (!object.useTiles) {
        context.drawImage(this.image, Math.round(canvasLeft), Math.round(canvasTop), Math.round(this.width), Math.round(this.height));
      } else {
        context.drawImage(
          this.image, 
          (this.tileWidth + this.spacer) * this.imageTile.x, 
          (this.tileHeight + this.spacer) * this.imageTile.y, 
          this.tileWidth, 
          this.tileHeight, 
          canvasLeft, canvasTop, this.width, this.height
        );
      }

      if (this.imageRotation !== 0) {  
        context.setTransform(1, 0, 0, 1, 0, 0);
      }
    }
  }
}



/**
 *  Game loop helpers
 */

function accellerateObjects() {
  for(let object of world) {
    if (object.mobile) {
    	object.accellerate();
    }
  }
}

function moveObjects() {
	for(let object of world) {
  	if (object.mobile) {
    	//log("moving" + object.name);
      //log(object.xSpeed);
      //log(object.ySpeed);
    	object.animate(frameDuration);
      object.x += object.xSpeed;
      object.y += object.ySpeed;
    }
  }
}

function collideObjects() {
  let subject = player; // TODO: loop all that are mobile.
  subject.resetCollisionState();
  for(let object of world) {
  	if (object.solid && object !== subject) {
      let collision = calculateCollision(subject, object);
      if (collision !== null) {
      	subject.collide(collision, object);
      }
    }
  }
} 

function renderWorld() {
	//Setup canvas
  let context = canvas.getContext("2d");
	context.clearRect(0, 0, canvas.width, canvas.height);
  context.beginPath();
  context.moveTo(0,0);
  // log("=========================================");
  // log("rendering...");
	for(let object of world) {
    context = canvas.getContext("2d");
    context.beginPath();
    context.moveTo(0,0);
    // context.save();
 		object.render(context, camera);
    // context.restore();
 	}
}


/**
 *  Game loop core
 */
 
var quit = false;
var framesPerSecond = 60;
var alreadyInGameLoop = false;
var frameDuration = 1000 / framesPerSecond;
function getTimestamp() {
  let d = new Date();
  return d.getTime();
}

var loopTimestamp = null;
function gameloop() {
  if (loopTimestamp !== null) {
    let newTimestamp = getTimestamp();
    let diff = newTimestamp - loopTimestamp;
    loopTimestamp = newTimestamp;
    log(diff);
  }
  if (keyDown("Escape")) return;
  
  setTimeout(gameloop, frameDuration);
    
	if (alreadyInGameLoop) {
  	log("skipping frame!!! LAG warning!");
    return;
  } else {
  	alreadyInGameLoop = true;

    // Perform all actions
    accellerateObjects();
    moveObjects();
    collideObjects();
    renderWorld();

		alreadyInGameLoop = false;
  }
}

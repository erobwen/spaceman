let keyMap = {
  "moveLeft" : ["ArrowLeft", "KeyA"],
  "moveRight" : ["ArrowRight", "KeyD"],
  "jump" : "Space",
  "moveUp" : ["ArrowUp", "KeyW"],
  "moveDown" : ["ArrowDown", "KeyS"]
}


function actionKeyDown(actionKey) {
  let keys = keyMap[actionKey];
  if (keys instanceof Array) {
    return anyKeyDown(keys);
  } else {
    return keyDown(keys);
  }
}


function newPlayer(x, y, image) {
	//let result = newMobileObject(x, y, 126, 206);
	let result = newMobileBody(x, y, 60, 100);
  setImage(result, image);
  result.name = "player";
  result.zIndex = 1;
	
  result.inJump = 0;
  result.inSpinAnimation = 0;
  result.allowNewSpin = true;
  
  result.failedSpinAttempts = 0;
  result.tryStartSpin = function() {
  	this.allowNewSpin = false;
  	if (this.failedSpinAttempts > 1) {
			this.inSpinAnimation = 1;
      this.failedSpinAttempts = 0;
    } else {
		  this.failedSpinAttempts++;   
    }
  }
  
  result.accellerate = function() {
  	let inAir = !this.hasGroundContact && !this.hasLeftGrip && !this.hasRightGrip && !this.hasTopGrip;
    if (!inAir) {
    	this.inJump = 0;
      this.allowNewSpin = true;
    }

    if (this.allowNewSpin) { 
    	if (this.inJump && this.ySpeed > -10 && this.ySpeed < 10) {
        this.tryStartSpin();
      } else if (inAir && this.ySpeed > 2) {
				this.tryStartSpin();      
      } 
    }
   
   function horizontalAccelleration() {
      let airFactor = this.hasGroundContact ? 1 : 0.5;
      let accelleration = airFactor * 150/framesPerSecond;
      let friction = airFactor * 0.6/framesPerSecond;  
      let breakAction = airFactor * 20/framesPerSecond;

      let xAcelleration = accelleration * (actionKeyDown("moveRight") - actionKeyDown("moveLeft"));
      let xFriction = oppositeSign(this.xSpeed) * (this.xSpeed * this.xSpeed * friction);
      this.xSpeed = this.xSpeed + xAcelleration + xFriction;
      if (this.hasGroundContact) {
        let xBreak = xAcelleration === 0 ? Math.min(breakAction, Math.abs(this.xSpeed)) : 0;
        this.xSpeed = this.xSpeed + xBreak * oppositeSign(this.xSpeed);            
      }
    }
    horizontalAccelleration.bind(this)();

    function verticalAccelleration() {
      //log(this.hasRightGrip);
    	let jumpAccelleration = 800/framesPerSecond;
      let gravity = 25/framesPerSecond;  
      let slippageFriction = 3/framesPerSecond;
      let climbAccelleration = 60/framesPerSecond;
      let climbFriction = 5/framesPerSecond;
      
      if (this.hasGroundContact) {
        if (actionKeyDown("jump")) {
        	this.inJump = true;
          this.ySpeed -= jumpAccelleration;
        } 
      } else if (this.hasRightGrip || this.hasLeftGrip) {
      	let jumpDirection = this.hasLeftGrip ? 1 : -1;
        if (actionKeyDown("jump")) { 
          this.ySpeed -= jumpAccelleration * 0.9;
          this.xSpeed += jumpAccelleration * 0.9 * jumpDirection;  
        } else {
        	this.xSpeed -= jumpDirection*1; // stick to surface
					if (this.ySpeed > 0) {
          	if (actionKeyDown("moveDown")) slippageFriction *= 0.1; 
          	this.ySpeed -= Math.min(this.ySpeed, (this.ySpeed * this.ySpeed * slippageFriction));
          }
          log('actionKeyDown("moveUp") = ' + actionKeyDown("moveUp"));
          if(actionKeyDown("moveUp")) {
            log(-climbAccelleration);
            log(this.ySpeed * this.ySpeed * climbFriction);
            log(-climbAccelleration + (this.ySpeed * this.ySpeed * climbFriction));
						this.ySpeed += -climbAccelleration + (this.ySpeed * this.ySpeed * climbFriction);
            log("this.ySpeed:" + this.ySpeed);
          }
        }
      }
      this.ySpeed += gravity;
    }
    verticalAccelleration.bind(this)();
  }

	result.animate = function(timeDuration) {
    if (this.inSpinAnimation > 400) {
    	this.inSpinAnimation = 0;
      this.imageRotation = 0;
    } else if (this.inSpinAnimation > 0) {
    	this.inSpinAnimation += timeDuration;
      this.imageRotation = sign(this.xSpeed) * Math.PI * 2 * this.inSpinAnimation / 400
    }
  }

  world.player = result;
  
  return result;
}

function newPlayer(x, y, image) {
	//let result = newMobileObject(x, y, 126, 206);
	let result = newMobileObject(x, y, 60, 100);
  setImage(result, image);
  result.name = "player";
	
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
      let airFactor = this.hasGroundContact ? 1 : 0.7;
      let accelleration = airFactor * 30/framesPerSecond;
      let friction = airFactor * 0.6/framesPerSecond;  
      let breakAction = airFactor * 10/framesPerSecond;

      let xAcelleration = accelleration * (keyDown("ArrowRight") - keyDown("ArrowLeft"));
      let xFriction = oppositeSign(this.xSpeed) * (this.xSpeed * this.xSpeed * friction);
      this.xSpeed = this.xSpeed + xAcelleration + xFriction;
      let xBreak = xAcelleration === 0 ? Math.min(breakAction, Math.abs(this.xSpeed)) : 0;
      this.xSpeed = this.xSpeed + xBreak * oppositeSign(this.xSpeed);     
    }
    horizontalAccelleration.bind(this)();

    function verticalAccelleration() {
    	let jumpAccelleration = 500/framesPerSecond;
      let gravity = 20/framesPerSecond;  
      let slippageFriction = 3/framesPerSecond;
      let climbAccelleration = 50/framesPerSecond;
      let climbFriction = 10/framesPerSecond;
      
      if (this.hasGroundContact) {
        if (keyDown("Space")) {
        	this.inJump = true;
          this.ySpeed -= jumpAccelleration;
        } 
      } else if (this.hasRightGrip || this.hasLeftGrip) {
      	let jumpDirection = this.hasLeftGrip ? 1 : -1;
        if (keyDown("Space")) {
          this.ySpeed -= jumpAccelleration * 0.1;
          this.xSpeed += jumpAccelleration * 0.4 * jumpDirection;  
        } else {
        	this.xSpeed -= jumpDirection; // stick to surface
					if (this.ySpeed > 0) {
          	if (keyDown("ArrowDown")) slippageFriction *= 0.3; 
          	this.ySpeed -= (this.ySpeed * this.ySpeed * slippageFriction);
          }
          if(keyDown("ArrowUp")) {
						this.ySpeed += -climbAccelleration + (this.ySpeed * this.ySpeed * climbFriction);
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

	result.resetCollisionState = function() {
    this.hasGroundContact = false;
    this.hasLeftGrip = false;
    this.hasRightGrip = false;
    this.hasTopGrip = false;
  }
  
  result.collide = function(collision, object) {
    if(collision.width > collision.height) {
      if(centerY(collision) < centerY(this)) {
        // Push this down
        this.y += collision.height;
        this.ySpeed = 0;
        this.hasTopGrip = true;
      } else {
        // Push this up
        this.y -= collision.height;
        this.ySpeed = 0;
        this.hasGroundContact = true;
      }
    } else {
      if(centerX(collision) < centerX(this)) {
        // Push this right
        this.x += collision.width;
        this.xSpeed = 0;
        this.hasLeftGrip = true;
      } else {
        // Push this left
        this.x -= collision.width;
        this.xSpeed = 0;
        this.hasRightGrip = true;
      }      	
    }
  }
  
    
  return result;
}

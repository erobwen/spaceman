function newMiniBunny(x, y, image) {
	//let result = newMobileObject(x, y, 126, 206);
	let result = newMobileObject(x, y, 16, 16);
  setImage(result, image);
  result.name = "minibunny";
  
  // result.inJump = 0;
  // result.inSpinAnimation = 0;
  // result.allowNewSpin = true;

  
  // result.failedSpinAttempts = 0;
  // result.tryStartSpin = function() {
  	// this.allowNewSpin = false;
  	// if (this.failedSpinAttempts > 1) {
			// this.inSpinAnimation = 1;
      // this.failedSpinAttempts = 0;
    // } else {
		  // this.failedSpinAttempts++;   
    // }
  // }
  
  result.accellerate = function() {
    let gravity = 25/framesPerSecond;  
    if (!this.hasGroundContact) {
      this.ySpeed += gravity;
    }      
  }

	result.animate = function(timeDuration) {
    // if (this.inSpinAnimation > 400) {
    	// this.inSpinAnimation = 0;
      // this.imageRotation = 0;
    // } else if (this.inSpinAnimation > 0) {
    	// this.inSpinAnimation += timeDuration;
      // this.imageRotation = sign(this.xSpeed) * Math.PI * 2 * this.inSpinAnimation / 400
    // }
  }
  
  world.mobs.push(result);
    
  return result;
}

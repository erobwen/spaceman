
/**
 *  Globals
 */
var world;

var colorCodes = {
  "rgba(255, 242, 0, 255)" : "minibunny|1x1",
  
  "rgba(255, 82, 105, 255)" : "player|2x6",
  
  "rgba(255, 255, 255, 255)" : "space",
  
  "rgba(0, 0, 0, 255)" : "oldSteelWall",
  "rgba(127, 127, 127, 255)" : "steelWall",
  "rgba(107, 107, 107, 255)" : "darkSteelWall",
  "rgba(239, 228, 175, 255)" : "labWall",
  
  "rgba(255, 174, 201, 255)" : "legendSeparator",
  
  // "rgba(0, 0, 0, 0)" : "wall"
}


function getImageData(imageElement) {
  // Get a canvas with image data
  let width = imageElement.naturalWidth; 
  let height = imageElement.naturalHeight;
  let canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  let context = canvas.getContext('2d');
  context.drawImage(imageElement, 0, 0, canvas.width, canvas.height);
  let imageData = context.getImageData(0, 0, width, height);
  return imageData;  
}


/**
 *  load the world
 */
function generateWorld(imageElement) {  
  console.log(" === generateWorld === ");

  // Dimensions
  let tileSize = 32;
  const { width, height } = worldImageDimensions(imageElement);

  log(width);
  log(height);
  
  world = {
    player: null,
    actionFrame: null,
    camera: null,

    index: createQuadNode(0, 0, width * tileSize, height * tileSize), 
    movingObjects: null,
    addCollisions: function(object, collisions)  {
      index.addCollisions(object, collisions);
      this.movingObjects.forEach(movingObject => {
        calculateMassCollision(collisions, object, movingObject);
      });
    }.bind(world),

    loopTime: 0
  };

  generateWorldFromImage(imageElement, tileSize, null, ({code, defaultColorCode, shapeX, shapeY, shapeWidth, shapeHeight}) => {
    if (code === "minibunny") {
      log("Found bunny!!");
      world.index.add(newMiniBunny(shapeX + shapeWidth/2, shapeY + shapeHeight/2, images.minibunny)); //level2: 178*32
      world.index.add(newColoredRectangle(shapeX, shapeY, shapeWidth, shapeHeight, 0, 0, defaultColorCode));  // Cover up hole!         
    } else if (code === "player") {
      log("Found player!!");
      world.player = newPlayer(shapeX + shapeWidth/2, shapeY + shapeHeight/2, images.spaceman); //level2: 178*32
      world.index.add(world.player);
      world.index.add(newColoredRectangle(shapeX, shapeY, shapeWidth, shapeHeight, 0, 0, defaultColorCode)); // Cover up hole!
    } else if (code.endsWith("all")) { // TODO: case insensitive.
      world.index.add(newWall(shapeX, shapeY, shapeWidth, shapeHeight, code));
      // resultData.push({x: shapeX, y: shapeY, w: shapeWidth, h: shapeHeight});          
    } else {
      world.index.add(newColoredRectangle(shapeX, shapeY, shapeWidth, shapeHeight, 0, 0, code)); // Cover up hole!
    }
  });
  
  // Add player if not found earlier
  if(world.player === null) {
    world.player = newPlayer(0, 0, images.spaceman); //level2: 178*32    
    world.index.add(world.player);
  }
  
  // Add camera and action frame  
  world.camera = newCamera(world.player);
  world.actionFrame = newActionFrame(world.camera);
  world.index.add(world.camera);
  world.index.add(world.actionFrame);
}

/**
 *  Build the world and run
 */
afterLoadingAllImages = function() {
  log("==== Generate World ====");
  generateWorld(images.level2);
  
  log("==== The World ====");
  log(world)
  renderWorld();

  log("==== Game Loop ====");
  gameloop();  
}

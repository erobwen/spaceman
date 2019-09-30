
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
  // Dimensions
  let tileSize = 32;
  const { width, height } = worldImageDimensions(imageElement);

  log(width);
  log(height);
  
  world = {
    camera: null,
    player: null,

    // Deprecated: 
    immobileObjects: [],
    mobileBodies: [],
    mobs: [],
    walls: [],
    visibleObjects: [], // For rendering
    mobileObjects: [], // For move/accelleration/collision
    
    // Future: 
    index: null, 
    mobileCollidables: [],
    animatedObjects: []
  };
  world.index = createQuadNode(0, 0, width * tileSize, height * tileSize);

  generateWorldFromImage(imageElement, tileSize, null, ({code, defaultColorCode, shapeX, shapeY, shapeWidth, shapeHeight}) => {
    if (code === "minibunny") {
      log("Found bunny!!");
      newMiniBunny(shapeX + shapeWidth/2, shapeY + shapeHeight/2, images.minibunny); //level2: 178*32
      newColoredRectangle(shapeX, shapeY, shapeWidth, shapeHeight, 0, 0, defaultColorCode);          
    } else if (code === "player") {
      log("Found player!!");
      camera = newCamera(shapeX + shapeWidth/2, shapeY + shapeHeight/2);
      player = newPlayer(shapeX + shapeWidth/2, shapeY + shapeHeight/2, images.spaceman); //level2: 178*32
      newColoredRectangle(shapeX, shapeY, shapeWidth, shapeHeight, 0, 0, defaultColorCode);
    } else if (code.endsWith("all")) { // TODO: case insensitive.
      newWall(shapeX, shapeY, shapeWidth, shapeHeight, code);
      // resultData.push({x: shapeX, y: shapeY, w: shapeWidth, h: shapeHeight});          
    } else {
      newColoredRectangle(shapeX, shapeY, shapeWidth, shapeHeight, 0, 0, code);
    }
  });
  
  console.log(" === generateWorld === ");  
  // Add player if not found earlier
  if(world.player === null) {
    world.camera = newCamera(0, 0);
    world.player = newPlayer(0, 0, images.spaceman); //level2: 178*32    
  }
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

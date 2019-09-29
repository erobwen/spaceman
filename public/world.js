
/**
 *  Globals
 */
var world;

var colorCodes = {
  "rgba(255, 242, 0, 255)" : "minibunny",
  
  "rgba(255, 82, 105, 255)" : "player",
  
  "rgba(255, 255, 255, 255)" : "space",
  
  "rgba(0, 0, 0, 255)" : "oldSteelWall",
  "rgba(127, 127, 127, 255)" : "steelWall",
  "rgba(107, 107, 107, 255)" : "darkSteelWall",
  "rgba(239, 228, 175, 255)" : "labWall",
  
  "rgba(255, 174, 201, 255)" : "legendSeparator",
  
  // "rgba(0, 0, 0, 0)" : "wall"
}

function getMapCode({r, b, g, a}) {
  let colorString = "rgba("+r+", "+g+", "+b+", "+a+")";
  if (typeof(colorCodes[colorString]) === 'undefined') {      
    // log("Warning: unrecognized color code rgba("+r+", "+g+", "+b+", "+a+")");
    return colorString;
  } else {
    return colorCodes[colorString];
  }
}

function getColorCode(imageData, width, x, y) {
  return getMapCode(getRgba(imageData, width, x, y));
}

function getRgba(imageData, width, x, y) {
  let r = imageData.data[y * width * 4 + x * 4];
  let g = imageData.data[y * width * 4 + x * 4 + 1];
  let b = imageData.data[y * width * 4 + x * 4 + 2];
  let a = imageData.data[y * width * 4 + x * 4 + 3];
  return {
    r: r,
    g: g,
    b: b,
    a: a
  }
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

function worldImageDimensions(imageElement) {
  let width = imageElement.naturalWidth; 
  let height = imageElement.naturalHeight;
  const imageData = getImageData(imageElement);

  // Get actual map height
  let actualMapHeight;
  let yScan = 0
  while(yScan < height) {
    if ("legendSeparator" === getColorCode(imageData, width, 0, yScan)) { 
      actualMapHeight = yScan;
      break;
    };
    yScan++;
  }
  actualMapHeight = yScan;
  return {width: width, height: actualMapHeight};
}

function generateWorldFromImage(imageElement, tileSize, defaultColorCode, addItem) {
  let width = imageElement.naturalWidth; 
  let height = imageElement.naturalHeight;
  
  let hasReachedLegend = false;
  
  let visitedMap = {};  
  function visited(x, y) {
    return typeof(visitedMap[key(x, y)]) !== 'undefined';
  }
    
  function key(x, y) {
    return "(" + x + "," + y + ")";
  }
  
  const imageData = getImageData(imageElement);
  function startCollecting(x, y) {
    if (!visited(x, y) && !hasReachedLegend) {
      visitedMap[key(x, y)] = true;
      let code = getColorCode(imageData, width, x, y);
      if (defaultColorCode === null) defaultColorCode = code; // Just pick the first one. 
      if (code === "legendSeparator") {
        hasReachedLegend = true; 
      } else if (code !== "space") {
        let topLeftX = x;
        let topLeftY = y;
        let bottomRightX = x;
        let bottomRightY = y;
        
        let finished = false;
        while(!finished) {
          let expand = false;
          
          // Try expand right
          let scanX = bottomRightX + 1;
          if (scanX < width) {
            let allTheSame = true;
            for (let scanY = topLeftY; scanY <= bottomRightY; scanY++) {
              if (code !== getColorCode(imageData, width, scanX, scanY) || visited(scanX, scanY)) allTheSame = false;
            }
            if (allTheSame) {
              // log("expand right");
              expand = true;
              bottomRightX++;
              for (let scanY = topLeftY; scanY <= bottomRightY; scanY++) {
                visitedMap[key(scanX, scanY)] = true;
              }
            }            
          }

          // Try expand right
          scanY = bottomRightY + 1;
          if (scanY < height) {           
            allTheSame = true;
            for (let scanX = topLeftX; scanX <= bottomRightX; scanX++) {
              if (code !== getColorCode(imageData, width, scanX, scanY) || visited(scanX, scanY)) allTheSame = false;
            }
            if (allTheSame) {
              // log("expand left");
              expand = true;
              bottomRightY++;
              for (let scanX = topLeftX; scanX <= bottomRightX; scanX++) {
                visitedMap[key(scanX, scanY)] = true;
              }
            }
          }
          finished = !expand;
        }

        addItem({
          code: code,
          defaultColorCode: defaultColorCode,
          shapeX: topLeftX * tileSize,
          shapeY: topLeftY * tileSize,
          shapeWidth: (bottomRightX - topLeftX + 1) * tileSize,
          shapeHeight: (bottomRightY - topLeftY + 1) * tileSize
        });
      }
    }
  }
  
  
  // Loop over each pixel and invert the color.
  for(let y = 0 ;y <= height; y++) {
    for(let x = 0 ;x <= width; x++) {
      //log("collecting..." + x + ", " + y + ":" + getColorCode(x, y));
      startCollecting(x, y);
    }
  }
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

  let defaultColorCode = null;

  generateWorldFromImage(imageElement, tileSize, defaultColorCode, ({code, defaultColorCode, shapeX, shapeY, shapeWidth, shapeHeight}) => {
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

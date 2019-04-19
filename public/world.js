
/**
 *  Globals
 */
var world;


/**
 *  Quad tree
 */
function createQuadNode(x, y, width, height) {
  let node = newColoredRectangle(x, y, width, height);
  node.color = "rgba(0, 0, 0, 0)";
  node.zIndex = 1;
  node.stroke = true;
  Object.assign(node, {
    counter: 0,
    pivotX: centerX(node),
    pivotY: centerY(node),
    
    objects: [],
    
    topLeft: null,
    topRight: null, 
    bottomLeft: null, 
    bottomRight: null,
    
    addCollisions: function(object, collisions) {
      function collisionId(objectA, objectB) {
        let idA = objectA.id;
        let idB = objectB.id;
        return idA < idB ? (idA + ":" + idB) : (idB + ":" + idA);        
      }
      
      for (let storedObject of this.objects) {
        let collision = calculateCollision(storedObject, object);
        if (collision) {
          let id = collisionId(storedObject, object);
          if (typeof(collisions[id]) === 'undefined') {
            objectHasMoreMass = object.invertedMass <= storedObject.invertedMass;
            collisions[id] = {
                rectangle: collision,
                a: objectHasMoreMass ? object : storedObject, 
                b: objectHasMoreMass ? storedObject : object
            };
          }
        }
      }
      
      if (this.topLeft) {        
        let inTopLeft = left(object) <= this.pivotX && topY(object) <= this.pivotY;
        let inTopRight = this.pivotX < right(object) && topY(object) <= this.pivotY;
        let inBottomLeft = left(object) <= this.pivotX && this.pivotY < bottom(object);
        let inBottomRight = this.pivotX < right(object) && this.pivotY < bottom(object);
        
        if (inTopLeft) this.topLeft.addCollisions(object, collisions);
        if (inTopRight) this.topRight.addCollisions(object, collisions);
        if (inBottomLeft) this.bottomLeft.addCollisions(object, collisions);
        if (inBottomRight) this.bottomRight.addCollisions(object, collisions);
      }
    },
    
    add: function(object) {
      this.counter++;
      let unexpanded = this.topLeft === null; 
      if (unexpanded) {
        if (this.objects.length <= 16) {
          // Just add
          this.objects.push(object);
        } else {
          // Split node
          let toDispatch = this.objects;
          let halfWidth = this.width / 2;
          let halfHeight = this.height / 2;
          let pivotX = this.x + halfWidth;
          let pivotY = this.y + halfHeight;
          
          this.topLeft = createQuadNode(this.x, this.y, halfWidth, halfHeight);
          this.topRight = createQuadNode(pivotX, this.y, halfWidth, halfHeight);
          this.bottomLeft = createQuadNode(this.x, pivotY, halfWidth, halfHeight);
          this.bottomRight = createQuadNode(pivotX, pivotY, halfWidth, halfHeight);
          
          // Dispatch objects
          this.objects = [];
          for(let object of toDispatch) {
            this.dispatchObject(object);
          }
        }
      } else {
        this.dispatchObject(object);
      }
    },
      
    dispatchObject: function(object) {
      let toTheLeft = left(object) <= this.pivotX && right(object) <= this.pivotX;
      let toTheRight = this.pivotX < left(object) && this.pivotX < right(object);
      let above = topY(object) <= this.pivotY && bottom(object) <= this.pivotY;
      let below = this.pivotY < bottom(object) && this.pivotY < topY(object);
      if (toTheLeft) {
        if (above) {
          this.topLeft.add(object);
        } else if (below) {
          this.bottomLeft.add(object);          
        } else {
          this.objects.push(object);
        }
      } else if (toTheRight) {
        if (above) {
          this.topRight.add(object);
        } else if (below) {
          this.bottomRight.add(object);
        } else {
          this.objects.push(object);
        }
      } else {
        this.objects.push(object);
      }
    }
  });
  return node; 
}


/**
 *  load all of the images
 */
 
let imagesBeingLoaded = 0;
let afterLoadingAllImages = (() => {});
function loadImage(url) {
  let element = document.createElement('img');
  
  function loadImageElement(element, url) {
    imagesBeingLoaded++;
    element.onload = function () {
      if(--imagesBeingLoaded === 0) {
        log("loaded all images...");
        afterLoadingAllImages();
      }
      element.width = element.naturalWidth;
      element.height = element.naturalHeight;
    }
    element.src = url;
  }
  
  loadImageElement(element, url);
  
  return element;
}

let images = {
  minibunny : loadImage("./images/minibunny16x16.png"),
  spaceman : loadImage("./images/spaceman60x100.png"),
  unicorn: loadImage("./images/unicorn.png"),
  
  level1 : loadImage("./images/level1.png"),
  level2 : loadImage("./images/level2.png"),
  level3 : loadImage("./images/level3.png"),
  
  labWall : loadImage("./images/lab_wall.png"),
  steelWall : loadImage("./images/steel.png"),
  darkSteelWall : loadImage("./images/steel_dark.png"),
  oldSteelWall : loadImage("./images/steel_wall_1_32x32.png")
};

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
 
/**
 *  load the world
 */
function generateWorld(imageElement) {  
  // Dimensions
  let width = imageElement.naturalWidth; 
  let height = imageElement.naturalHeight;
  let tileSize = 32;

  // Get a canvas with image data
  let canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  let context = canvas.getContext('2d');
  context.drawImage(imageElement, 0, 0, canvas.width, canvas.height);
  let imageData = context.getImageData(0, 0, width, height);

  // Get actual map height
  let actualMapHeight;
  let yScan = 0
  while(yScan < height) {
    if ("legendSeparator" === getColorCode(0, yScan)) {
      actualMapHeight = yScan;
      break;
    };
    yScan++;
  }
  actualMapHeight = yScan;
  
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
    index: null, // Wait for it... 
    mobileCollidables: [],
    animatedObjects: []
  };
  
  world.index = createQuadNode(0, 0, width * tileSize, actualMapHeight * tileSize);

  console.log(" === generateWorld === ");  
  
  let defaultColorCode = null;
  
  let hasReachedLegend = false;
  
  let visitedMap = {};  
  function visited(x, y) {
    return typeof(visitedMap[key(x, y)]) !== 'undefined';
  }
  
  
  function getColorCode(x, y) {
    let r = imageData.data[y * width * 4 + x * 4];
    let g = imageData.data[y * width * 4 + x * 4 + 1];
    let b = imageData.data[y * width * 4 + x * 4 + 2];
    let a = imageData.data[y * width * 4 + x * 4 + 3];
    let colorString = "rgba("+r+", "+g+", "+b+", "+a+")";
    if (typeof(colorCodes[colorString]) === 'undefined') {      
      // log("Warning: unrecognized color code rgba("+r+", "+g+", "+b+", "+a+")");
      return colorString;
    } else {
      return colorCodes[colorString];
    }
  } 
  
  function key(x, y) {
    return "(" + x + "," + y + ")";
  }
  
  function startCollecting(x, y) {
    if (!visited(x, y) && !hasReachedLegend) {
      visitedMap[key(x, y)] = true;
      let code = getColorCode(x, y);
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
              if (code !== getColorCode(scanX, scanY) || visited(scanX, scanY)) allTheSame = false;
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
              if (code !== getColorCode(scanX, scanY) || visited(scanX, scanY)) allTheSame = false;
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
        let shapeX = topLeftX * tileSize;
        let shapeY = topLeftY * tileSize;
        let shapeWidth = (bottomRightX - topLeftX + 1) * tileSize;
        let shapeHeight = (bottomRightY - topLeftY + 1) * tileSize;
        if (code === "minibunny") {
          log("Found bunny!!");
          newMiniBunny(shapeX + shapeWidth/2, shapeY + shapeHeight/2, images.minibunny); //level2: 178*32
          newColoredRectangle(shapeX, shapeY, shapeWidth, shapeHeight, 0, 0, defaultColorCode);          
        } else if (code === "player") {
          log("Found player!!");
          camera = newCamera(shapeX + shapeWidth/2, shapeY + shapeHeight/2);
          player = newPlayer(shapeX + shapeWidth/2, shapeY + shapeHeight/2, images.unicorn); //level2: 178*32
          newColoredRectangle(shapeX, shapeY, shapeWidth, shapeHeight, 0, 0, defaultColorCode);
        } else if (code.endsWith("all")) { // TODO: case insensitive.
          newWall(shapeX, shapeY, shapeWidth, shapeHeight, code);
          // resultData.push({x: shapeX, y: shapeY, w: shapeWidth, h: shapeHeight});          
        } else {
          newColoredRectangle(shapeX, shapeY, shapeWidth, shapeHeight, 0, 0, code);
        }
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
  
  // Add player if not found earlier
  if(world.player === null) {
    world.camera = newCamera(0, 0);
    world.player = newPlayer(0, 0, images.spaceman); //level2: 178*32    
  }
}

/**
 *  Build the world
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

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
      if(--imagesBeingLoaded === 0) afterLoadingAllImages();
      element.width = element.naturalWidth;
      element.height = element.naturalHeight;
    }
    element.src = url;
  }
  
  loadImageElement(element, url);
  
  return element;
}

let images = {
  spaceman : loadImage("./images/spaceman60x100.png"),
  level1 : loadImage("./images/level1.png"),
  level2 : loadImage("./images/level2.png"),
  steelWall1 : loadImage("./images/steel_wall_1_32x32.png")
};

 
/**
 *  load the world
 */
function generateWorld(image) {
  console.log(" === generateWorld === ")
  
  // TODO: do async
  // var img = new Image();
  // img.onload = function() { alert("Height: " + this.height); }
  // img.src = "./images/level2.png";
  
  // Get image map
  let imageElement = document.getElementById(image);
  let width = imageElement.naturalWidth; 
  let height = imageElement.naturalHeight;

  // Get canvas
  let canvas = document.createElement('canvas');
  // log(canvas);
  canvas.width = width;
  canvas.height = height;
  
  // Get image data
  let context = canvas.getContext('2d');
  context.drawImage(imageElement, 0, 0, canvas.width, canvas.height);
  let imageData = context.getImageData(0, 0, width, height);
  
  
  let colorCodes = {
    "rgba(255, 255, 255, 255)" : "space",
    "rgba(0, 0, 0, 255)" : "wall",
    "rgba(0, 0, 0, 0)" : "wall"
  }

  let visitedMap = {};  
  function visited(x, y) {
    return typeof(visitedMap[key(x, y)]) !== 'undefined';
  }
  
  let result = [];
  let resultData = [];
  let tileSize = 32;
  
  function getColorCode(x, y) {
    let r = imageData.data[y * width * 4 + x * 4];
    let g = imageData.data[y * width * 4 + x * 4 + 1];
    let b = imageData.data[y * width * 4 + x * 4 + 2];
    let a = imageData.data[y * width * 4 + x * 4 + 3];
    if (typeof(colorCodes["rgba("+r+", "+g+", "+b+", "+a+")"]) === 'undefined') log("Warning: unrecognized color code rgba("+r+", "+g+", "+b+", "+a+")");
    return colorCodes["rgba("+r+", "+g+", "+b+", "+a+")"];
  } 
  
  function key(x, y) {
    return "(" + x + "," + y + ")";
  }
  
  function startCollecting(x, y) {
    if (!visited(x, y)) {
      visitedMap[key(x, y)] = true;
      let code = getColorCode(x, y);
      if (code === "wall") {
        let topLeftX = x;
        let topLeftY = y;
        let bottomRightX = x;
        let bottomRightY = y;
        
        let finished = false;
        while(!finished) {
          // Try expand right
          let scanX = bottomRightX + 1;
          let allTheSame = true;
          let expand = false;
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

          // Try expand right
          scanY = bottomRightY + 1;
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
          finished = !expand;
        }
        let wallX = topLeftX * tileSize;
        let wallY = topLeftY * tileSize;
        let wallWidth = (bottomRightX - topLeftX + 1) * tileSize;
        let wallHeight = (bottomRightY - topLeftY + 1) * tileSize;
        result.push(newWall(wallX, wallY, wallWidth, wallHeight));
        resultData.push({x: wallX, y: wallY, w: wallWidth, h: wallHeight});
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
  log(JSON.stringify(resultData));
  log(result);
  return result;  
}
log("foobar");
let world = generateWorld("level2");

/**
 *  Build the world
 */

var camera = newCamera(0, 0);
var player = newPlayer(0, 178*32, "spaceman");
world = world.concat([
  //newRectangle(-100, 0, 200, 20),
	//newWall(-100, 50, 200, 20),
	//newWall(100, -120, 20, 200),
	newWall(-32, 32, 128, 32),
	camera,
	player,
]);
log("==== The World ====");
log(world)
renderWorld();

//log(world);
gameloop();


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

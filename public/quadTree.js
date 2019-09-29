

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

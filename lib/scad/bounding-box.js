// From PEX:
// https://github.com/pex-gl/pex-next/blob/1076207f092c0b8456179925cd38b623f2778443/old/geom/BoundingBox.js

//A bounding box is a box with the smallest possible measure
//(area for 2D or volume for 3D) for a given geometry or a set of points
//
//## Example use
//     var someGeometryMin = new Vec3(0, 0, 0)
//     var someGeometryMax = new Vec3(2, 2, 2);
//     var bbox = new BoundingBox(someGeometryMin, someGeometryMax);
//     console.log(bbox.getSize());
//     console.log(bbox.getCenter());
//
//## Reference
var {Vec3} = require('pex-math');

//### BoundingBox ( min, max )
//`min` - *{ [Vec3](Vec3.html) }*
//`max` - *{ [Vec3](Vec3.html) }*
function BoundingBox(min, max) {
  this.min = min;
  this.max = max;
}

//### fromPositionSize ( pos, size )
//`pos`  - The position of the enclosed geometry *{ [Vec3](Vec3.html) }*
//`size` - Size of the enclosed geometry *{ [Vec3](Vec3.html) }*
//returns *{ BoundingBox }*
BoundingBox.fromPositionSize = function (pos, size) {
  return new BoundingBox([
      pos[0] - size[0] / 2,
      pos[1] - size[1] / 2,
      pos[2] - size[2] / 2
    ],
    [
      pos[0] + size[0] / 2,
      pos[1] + size[1] / 2,
      pos[2] + size[2] / 2
    ]);
};

//### fromPoints ( points )
//`points` - Points in space that the bounding box will enclose *{ Array of *{ [Vec3](Vec3.html) }*
// }* returns *{ BoundingBox }*
BoundingBox.fromPoints = function (points) {
  var bbox = new BoundingBox(Vec3.copy(points[0]), Vec3.copy(points[0]));
  points.forEach(bbox.addPoint.bind(bbox));
  return bbox;
};

//### isEmpty ()
//returns *{ Boolean }*
BoundingBox.prototype.isEmpty = function () {
  if (!this.min || !this.max) return true;
  else return false;
};

//### addPoint (p)
//`p` - point to be added to the enclosing space of the bounding box *{ [Vec3](Vec3.html) }*
BoundingBox.prototype.addPoint = function (p) {
  if (this.isEmpty()) {
    this.min = Vec3.copy(p);
    this.max = Vec3.copy(p);
  }
  if (p[0] < this.min[0]) this.min[0] = p[0];
  if (p[1] < this.min[1]) this.min[1] = p[1];
  if (p[2] < this.min[2]) this.min[2] = p[2];
  if (p[0] > this.max[0]) this.max[0] = p[0];
  if (p[1] > this.max[1]) this.max[1] = p[1];
  if (p[2] > this.max[2]) this.max[2] = p[2];
};

//### getSize ()
//returns the size of the bounding box as a *{ [Vec3](Vec3.html) }*
BoundingBox.prototype.getSize = function () {
  return [
    this.max[0] - this.min[0],
    this.max[1] - this.min[1],
    this.max[2] - this.min[2]
  ];
};

//### getCenter ()
//returns the center of the bounding box as a *{ [Vec3](Vec3.html) }*
BoundingBox.prototype.getCenter = function () {
  return [
    this.min[0] + (this.max[0] - this.min[0]) / 2,
    this.min[1] + (this.max[1] - this.min[1]) / 2,
    this.min[2] + (this.max[2] - this.min[2]) / 2
  ];
};

//### contains(p)
//returns true if point is inside the bounding box
BoundingBox.prototype.contains = function (p) {
  return p[0] >= this.min[0]
         && p[0] <= this.max[0]
         && p[1] >= this.min[1]
         && p[1] <= this.max[1]
         && p[2] >= this.min[2]
         && p[2] <= this.max[2];
};

module.exports = BoundingBox;
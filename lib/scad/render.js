/*
 * Copyright (c) 2016 Will Shown. All Rights Reserved.
 *
 * Permission is hereby granted, free of charge, to any person obtaining a copy
 * of this software and associated documentation files (the "Software"), to deal
 * in the Software without restriction, including without limitation the rights
 * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 * copies of the Software, and to permit persons to whom the Software is
 * furnished to do so, subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included in all
 * copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
 * SOFTWARE.
 */

'use strict';

/**
 *   ============
 *   Dependencies
 *   ============
 */

  // Bear in mind: OpenSCAD uses Z for up, rather than Y.

const {cos, sin, acos, sqrt, max} = Math;

const polyhedron      = require('./language/polyhedron'),
      globalPolyhedra = require('./elements/global-polyhedra'),
      continents      = require('./elements/continents'),
      mat4FromNormal  = require('./mat4-from-normal'),
      {Vec3}          = require('pex-math'),
      fs              = require('fs-promise'),
      path            = require('path');

const L = acos(sqrt(5) / 5);

/**
 *   ========
 *   Settings
 *   ========
 */

      // radius-related measurements * in mm *
const d0 = 13.5, // height of LED from the surface
      d1 = 1.7, // thickness of the surface material
      d2 = 25, // depth of the remaining LED hardware
      d3 = 10, // extra space for wiring
      d4 = Math.sqrt(
        Math.pow(220 / 2, 2) + // half length of the PSU
        Math.pow(117 / 2, 2) + // half width of the PSU
        Math.pow(30 / 2, 2) // half depth of the PSU
      ); // maximum extent of the hardware centered in the sphere

const r_led = 12 / 2; // radius in mm of the LEDs

const R_min = Math.ceil(d0 + d1 + d2 + d3 + d4);

const s = 31; // maximum distance between LEDs from the top in mm

const steepness_pent = .75,
      steepness_hex  = .75;

const ventCircumSize = .2,
      ventRadialSize = .3;

const edgeBarR  = 2.4,
      edgeClear = 2.4,
      edgeW     = 7;

const trunc = .6;

/**
 *   ==
 *   Go
 *   ==
 */

module.exports = async function (sphere, out) {

  var sis = Object.keys(sphere._strands);

  const α        = L / sphere._divisions,
        n_fields = sphere._Fields.length,
        R_max    = s / ( 2 * sin(α / 2) );

  const R = max(R_min, R_max);

  console.log('[Model diameter]', R * .2, 'cm');

  let polyhedra = globalPolyhedra(
    sphere,
    {
      R, d0, d1, trunc,
      steepness_pent,
      steepness_hex,
      ventCircumSize,
      ventRadialSize,
    }
      ),
      conts     = continents(sphere, polyhedra, {});

  sis.forEach(async function (si) {

    let stream = fs.createWriteStream(out + `_${si}.scad`);

    console.log('[Render]', si, 'Writing hull vertices.');

    await stream.write(
      `hull_points = ${ JSON.stringify(polyhedra.hull.points) };\n`
    );

    console.log('[Render]', si, 'Writing continental polyhedra.');

    await stream.write(
      `module continent() {\n
        render() intersection(){
        polyhedron(
          points=hull_points,
          faces=${ JSON.stringify(conts.faces[si]) },
          convexity=8
        );
        ${ polyhedron(polyhedra.trunc.points, polyhedra.trunc.faces, 2) }
      }}\n`
    );

    // Define the standard hole cylinder centered on the origin, aligned with the z axis

    await stream.write(
      `module cylinder_outer(height,radius,fn){
         fudge = 1/cos(180/fn);
         cylinder( h=height, r=radius*fudge, $fn=fn, center=true );
       }
       module hole () {
        cylinder_outer(
          ${(d0 + d1 + d2)},
          ${r_led},
          24
        );
      }`
    );

    // Define the standard edge bar centered on the origin, aligned with the z axis

    await stream.write(
      `module edge () {
        difference(){
          cylinder_outer(
            ${edgeW},
            ${(edgeBarR + edgeClear)},
            9
          );
          cylinder_outer(
            ${edgeW * 1.1},
            ${(edgeBarR)},
            9
          );
        }
      }`
    );

    // Declare defined objects

    // TODO — rotate the final result to face down
    //        + use a mat4 (inverted?) from the the average face normal for the continent

    // TODO — get the bounding box for the rotated continent
    //        + this will determine the printer size we need

    await stream.write(
      `difference(){
        continent();
       `
    );

    console.log('[Render]', si, 'Writing vents.');

    await stream.write(
      polyhedron(polyhedra.vents[si].points, polyhedra.vents[si].faces, 2)
    );

    console.log('[Render]', si, 'Writing holes.');

    for (let g = 0; g < n_fields; g += 1) {

      if (sphere._Fields[g].data.strand == si) {

        await stream.write(
          `render() multmatrix(m = ${ JSON.stringify(
              mat4FromNormal(polyhedra.holeCenters[g])
            )}){
            hole();
          }\n`
        );

      }

    }

    console.log('[Render]', si, 'Writing edges.');

    for (let e = 0; e < conts.edges[si].length; e += 1) {

      let edge = [
            polyhedra.hull.points[conts.edges[si][e][0]],
            polyhedra.hull.points[conts.edges[si][e][1]]
          ],
          center = Vec3.lerp(
            Vec3.copy(edge[0]),
            edge[1],
            .5
          ),
          normal = Vec3.normalize(Vec3.sub(
            Vec3.copy(edge[1]),
            edge[0]
          ));

      let cDist = Vec3.length(center);

      Vec3.scale(
        center,
        (cDist + edgeBarR * .7) / cDist
      );

      await stream.write(
        `render() multmatrix(m = ${ JSON.stringify(
            mat4FromNormal(normal, center)
          )}){
          edge();
        }\n`
      );

    }

    await stream.write('}\n');

    console.log('[Render]', si, 'Closing stream.');

    stream.end();

  });

};
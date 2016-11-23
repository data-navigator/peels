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

const {cos, sin} = Math;

const intersect3Planes            = require('../intersect-3-planes'),
      {Plane}                     = require('pex-geom'),
      {Vec3}                      = require('pex-math');

const origin = [0, 0, 0];

module.exports = function (sphere, opts) {

  const {
          R, d0, d1, trunc,
          steepness_pent,
          steepness_hex,
          ventCircumSize,
          ventRadialSize,
        } = opts;

  const n_fields    = sphere._Fields.length,
        n_centroids = sphere._interfieldCentroids.length,
        sis         = Object.keys(sphere._strands);

  // polyhedron arrays

  let trunc_points = [],
      trunc_faces = [];

  let hull_points = [],
      hull_faces  = [];

  let vent_points = {},
      vent_faces  = {},
      p_v         = {},
      f_v         = {};

  sis.forEach(si=> {
    vent_points[si] = [];
    vent_faces[si] = [];
    p_v[si] = 0;
    f_v[si] = 0;
  });

  // polyhedron indices

  let p_h = 0,
      f_h = 0;

  let f_t = 0;

  // hole orientation arrays

  let holeCenters = [];

  // inner surface planes

  let innerSurfacePlanes = [];

  // populate outer hull points

  for (p_h; p_h < n_centroids / 2; p_h++) {

    let c_φ = sphere._interfieldCentroids[2 * p_h + 0],
        c_λ = sphere._interfieldCentroids[2 * p_h + 1];

    let vert = [
      R * cos(c_φ) * cos(c_λ), // x
      R * cos(c_φ) * sin(c_λ), // y
      R * sin(c_φ), // z
    ];

    hull_points[p_h] = Vec3.scale(Vec3.copy(vert), (R + trunc) / R);
    trunc_points[p_h] = vert;

  }

  // populate outer hull points with the vertices of the additional sunken faces

  for (let g = 0; g < n_fields; g++) {

    let field = sphere._Fields[g],
        sides = field._adjacentFields.length,
        si    = field.data.strand;

    let p_φ = field.position[0],
        p_λ = field.position[1];

    // get the plane

    let ref    = sphere._interfieldIndices[6 * g],
        r_φ    = sphere._interfieldCentroids[2 * ref + 0],
        r_λ    = sphere._interfieldCentroids[2 * ref + 1],
        r_x    = R * cos(r_φ) * cos(r_λ),
        r_y    = R * cos(r_φ) * sin(r_λ),
        r_z    = R * sin(r_φ),
        norm_x = cos(p_φ) * cos(p_λ),
        norm_y = cos(p_φ) * sin(p_λ),
        norm_z = sin(p_φ),
        norm   = [norm_x, norm_y, norm_z], // normal vector
        invN   = Vec3.invert(Vec3.copy(norm));

    let plane = [
      [r_x, r_y, r_z], // reference vector on the plane
      norm
    ];

    let ray = [
      origin,
      norm
    ];

    let polyCentroid  = Plane.getRayIntersection(plane, ray),
        surfaceCenter = norm.map(w => w * R);

    // d_gap is the distance (in mm) between the top of the LED and the surface of the sphere
    let d_gap = Vec3.distance(polyCentroid, surfaceCenter);

    // Starting from d_gap, determine:
    // 1) the centers of the upper and lower surfaces around the LED (the cylinder hole will use
    // these too)

    let center_top = Vec3.scale(Vec3.copy(polyCentroid), (R - d_gap - d0) / R),
        plane_top  = [center_top, norm];

    holeCenters[g] = center_top;

    let center_bot = Vec3.scale(Vec3.copy(polyCentroid), (R - d_gap - d0 - d1) / R);

    innerSurfacePlanes[g] = [center_bot, norm];

    // 2) the per-vertex points around the upper surfaces of the LED by

    let p_0 = p_h;

    hull_faces[f_h] = [];

    for (let sv = 0; sv < sides; sv++) {

      //    2.1) projecting each vertex to the upper surface plane

      hull_points[p_h] = [0, 0, 0];

      Plane.getRayIntersection(
        plane_top,
        [
          hull_points[sphere._interfieldIndices[6 * g + sv]],
          invN
        ],
        hull_points[p_h]
      );

      //    2.2) finding the points d0 mm toward the center from the projected vertices

      let dist = Vec3.distance(hull_points[p_h], center_top);

      Vec3.lerp(
        hull_points[p_h],
        center_top,
        (dist - d0 * (sides === 5 ? steepness_pent : steepness_hex)) / dist
      );

      hull_faces[f_h].push(p_h);

      p_h++;

    }

    if (g !== 1) hull_faces[f_h] = hull_faces[f_h].reverse();

    // Expand polygon into triangles

    if (sides === 5) {

      hull_faces[f_h + 2] = [hull_faces[f_h][0], hull_faces[f_h][1], hull_faces[f_h][2]];
      hull_faces[f_h + 1] = [hull_faces[f_h][0], hull_faces[f_h][2], hull_faces[f_h][4]];
      hull_faces[f_h + 0] = [hull_faces[f_h][4], hull_faces[f_h][2], hull_faces[f_h][3]];

      f_h += 3;

    } else {

      hull_faces[f_h + 3] = [hull_faces[f_h][0], hull_faces[f_h][1], hull_faces[f_h][2]];
      hull_faces[f_h + 2] = [hull_faces[f_h][0], hull_faces[f_h][2], hull_faces[f_h][5]];
      hull_faces[f_h + 1] = [hull_faces[f_h][5], hull_faces[f_h][2], hull_faces[f_h][3]];
      hull_faces[f_h + 0] = [hull_faces[f_h][5], hull_faces[f_h][3], hull_faces[f_h][4]];

      f_h += 4;

    }

    // populate faces with the quadrilateral faces created here

    trunc_faces[f_t] = [];

    for (let sv = 0; sv < sides; sv += 1) {

      let sn = ((sv + sides + 1 ) % sides),
          sp = ((sv + sides - 1 ) % sides);

      let p1 = p_0 + sv,
          p2 = p_0 + sn,
          p0 = p_0 + sp;

      let o1 = sphere._interfieldIndices[6 * g + sv],
          o2 = sphere._interfieldIndices[6 * g + sn];

      hull_faces[f_h] = [
        p1, p2, o2
      ];

      hull_faces[f_h + 1] = [
        o1, p1, o2
      ];

      if (g === 1) {
        hull_faces[f_h] = hull_faces[f_h].reverse();
        hull_faces[f_h + 1] = hull_faces[f_h + 1].reverse();
      }

      f_h += 2;

      // generate a vent for this quadrilateral

      vent_points[si][p_v[si] + 0] = Vec3.lerp(
        Vec3.copy(hull_points[p1]),
        hull_points[o1],
        ventRadialSize
      );

      vent_points[si][p_v[si] + 1] = Vec3.lerp(
        Vec3.copy(hull_points[p1]),
        hull_points[p2],
        ventCircumSize
      );

      vent_points[si][p_v[si] + 2] = Vec3.lerp(
        Vec3.copy(hull_points[p1]),
        hull_points[p0],
        ventCircumSize
      );

      vent_points[si][p_v[si] + 3] = Vec3.scale(
        Vec3.copy(vent_points[si][p_v[si] + 0]),
        .08
      );

      let ventScale = R / Vec3.length(vent_points[si][p_v[si] + 0]);

      Vec3.scale(vent_points[si][p_v[si] + 0], ventScale);
      Vec3.scale(vent_points[si][p_v[si] + 1], ventScale);
      Vec3.scale(vent_points[si][p_v[si] + 2], ventScale);

      vent_faces[si][f_v[si] + 0] = [p_v[si] + 2, p_v[si] + 1, p_v[si] + 0];
      vent_faces[si][f_v[si] + 1] = [p_v[si] + 3, p_v[si] + 0, p_v[si] + 1];
      vent_faces[si][f_v[si] + 2] = [p_v[si] + 3, p_v[si] + 1, p_v[si] + 2];
      vent_faces[si][f_v[si] + 3] = [p_v[si] + 3, p_v[si] + 2, p_v[si] + 0];

      if (g === 1) {
        vent_faces[si][f_v[si] + 0] = vent_faces[si][f_v[si] + 0].reverse();
        vent_faces[si][f_v[si] + 1] = vent_faces[si][f_v[si] + 1].reverse();
        vent_faces[si][f_v[si] + 2] = vent_faces[si][f_v[si] + 2].reverse();
        vent_faces[si][f_v[si] + 3] = vent_faces[si][f_v[si] + 3].reverse();
      }

      p_v[si] += 4;
      f_v[si] += 4;

      // gather trunc indices for this field

      trunc_faces[f_t].push(o1);

    }

    if(g!==1) trunc_faces[f_t] = trunc_faces[f_t].reverse();

    // Expand trunc polygon into triangles

    if (sides === 5) {

      trunc_faces[f_t + 2] = [trunc_faces[f_t][0], trunc_faces[f_t][1], trunc_faces[f_t][2]];
      trunc_faces[f_t + 1] = [trunc_faces[f_t][0], trunc_faces[f_t][2], trunc_faces[f_t][4]];
      trunc_faces[f_t + 0] = [trunc_faces[f_t][4], trunc_faces[f_t][2], trunc_faces[f_t][3]];

      f_t += 3;

    } else {

      trunc_faces[f_t + 3] = [trunc_faces[f_t][0], trunc_faces[f_t][1], trunc_faces[f_t][2]];
      trunc_faces[f_t + 2] = [trunc_faces[f_t][0], trunc_faces[f_t][2], trunc_faces[f_t][5]];
      trunc_faces[f_t + 1] = [trunc_faces[f_t][5], trunc_faces[f_t][2], trunc_faces[f_t][3]];
      trunc_faces[f_t + 0] = [trunc_faces[f_t][5], trunc_faces[f_t][3], trunc_faces[f_t][4]];

      f_t += 4;

    }

  }

  // populate inner points

  const n_c = sphere._interfieldTriangles.length / 3,
        p_i = p_h;

  var planarVerts = [],
      min_R_inner = Infinity;

  for (let v = 0; v < n_c; v += 1) {

    planarVerts[v] = intersect3Planes(
      innerSurfacePlanes[sphere._interfieldTriangles[3 * v + 0]],
      innerSurfacePlanes[sphere._interfieldTriangles[3 * v + 1]],
      innerSurfacePlanes[sphere._interfieldTriangles[3 * v + 2]]
    );

    let l = Vec3.length(planarVerts[v]);

    if (l < min_R_inner) min_R_inner = l;

  }

  for (let v = 0; v < n_c; v += 1) {

    hull_points[p_h] = Vec3.scale(
      Vec3.copy(trunc_points[v]),
      min_R_inner / R
    );

    p_h += 1;

  }

  for (let g = 0; g < n_fields; g += 1) {

    let field = sphere._Fields[g],
        sides = field._adjacentFields.length,
        p_h_0 = p_h;

    hull_faces[f_h] = [];

    for (let sv = 0; sv < sides; sv++) {

      let dist = Vec3.distance(
        planarVerts[sphere._interfieldIndices[6 * g + sv]],
        innerSurfacePlanes[g][0]
      );

      hull_points[p_h] = Vec3.lerp(
        Vec3.copy(innerSurfacePlanes[g][0]),
        planarVerts[sphere._interfieldIndices[6 * g + sv]],
        d0 / dist
      );

      hull_faces[f_h].push(p_h);

      p_h += 1;

    }

    // build faces

    if (g !== 1) hull_faces[f_h] = hull_faces[f_h].reverse();

    // Expand center polygon into triangles

    if (sides === 5) {

      hull_faces[f_h + 2] = [hull_faces[f_h][0], hull_faces[f_h][1], hull_faces[f_h][2]];
      hull_faces[f_h + 1] = [hull_faces[f_h][0], hull_faces[f_h][2], hull_faces[f_h][4]];
      hull_faces[f_h + 0] = [hull_faces[f_h][4], hull_faces[f_h][2], hull_faces[f_h][3]];

      f_h += 3;

    } else {

      hull_faces[f_h + 3] = [hull_faces[f_h][0], hull_faces[f_h][1], hull_faces[f_h][2]];
      hull_faces[f_h + 2] = [hull_faces[f_h][0], hull_faces[f_h][2], hull_faces[f_h][5]];
      hull_faces[f_h + 1] = [hull_faces[f_h][5], hull_faces[f_h][2], hull_faces[f_h][3]];
      hull_faces[f_h + 0] = [hull_faces[f_h][5], hull_faces[f_h][3], hull_faces[f_h][4]];

      f_h += 4;

    }

    for (let sv = 0; sv < sides; sv += 1) {

      let sn = ((sv + sides + 1 ) % sides);

      let p1 = p_h_0 + sv,
          p2 = p_h_0 + sn;

      let i1 = p_i + sphere._interfieldIndices[6 * g + sv],
          i2 = p_i + sphere._interfieldIndices[6 * g + sn];

      hull_faces[f_h] = [
        p1, p2, i2
      ];

      hull_faces[f_h + 1] = [
        i1, p1, i2
      ];

      if (g === 1) {
        hull_faces[f_h] = hull_faces[f_h].reverse();
        hull_faces[f_h + 1] = hull_faces[f_h + 1].reverse();
      }

      f_h += 2;

    }

  }

  let vents = {};

  sis.forEach(si=>{
    vents[si] = {
      points: vent_points[si],
      faces: vent_faces[si]
    }
  });

  return {
    hull: {points: hull_points, faces: hull_faces},
    trunc: {points: trunc_points, faces: trunc_faces},
    vents,
    holeCenters
  };

};
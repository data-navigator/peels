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

const {Vec3} = require('pex-math');

module.exports = function (sphere, opts) {

  const {
          R,
          polyhedra,
          ventCircumSize,
          ventRadialSize,
        } = opts;

  const hull_points = polyhedra.hull.points;

  const n_fields = sphere._Fields.length,
        sis      = Object.keys(sphere._strands);

  const n_c = sphere._interfieldCentroids.length / 2;

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

  let p_0 = n_c;

  for (let g = 0; g < n_fields; g++) {

    let field = sphere._Fields[g],
        sides = field._adjacentFields.length,
        si    = field.data.strand;

    for (let sv = 0; sv < sides; sv += 1) {

      let sn = ((sv + sides + 1 ) % sides),
          sp = ((sv + sides - 1 ) % sides);

      let p1 = p_0 + sv,
          p2 = p_0 + sn,
          p0 = p_0 + sp;

      let o1 = sphere._interfieldIndices[6 * g + sv];

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

    }

    p_0 += sides;

  }

  let vents = {};

  sis.forEach(si=> {
    vents[si] = {
      points: vent_points[si],
      faces: vent_faces[si]
    }
  });

  return vents;

};
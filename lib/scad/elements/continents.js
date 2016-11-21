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

module.exports = function (sphere, polyhedra, opts) {

  const hull = polyhedra.hull;

  const n_fields    = sphere._Fields.length,
        n_strands   = Object.keys(sphere._strands).length,
        n_centroids = sphere._interfieldCentroids.length;

  var continentFaces = {};

  Object.keys(sphere._strands).forEach(s => {
    continentFaces[s] = [];
  });

  console.log('[Continents]', 'hull', hull.faces.length);

  // TODO — sort/copy points & faces from polyhedra into strands

  let f_h = 0;

  // do this in the same order as global-polyhedra so the arrays still make sense.

  for (let g = 0; g < n_fields; g += 1) {

    let field = sphere._Fields[g],
        sides = field._adjacentFields.length,
        si    = field.data.strand;

    let n_outerFaces = (sides === 5 ? 3 : 4) + (sides * 2),
        outerFaces = hull.faces.slice(f_h, f_h + n_outerFaces);

    outerFaces.unshift(continentFaces[si].length, 0);

    Array.prototype.splice.apply(
      continentFaces[si],
      outerFaces
    );

    f_h += n_outerFaces;

  }

  for (let g = 0; g < n_fields; g += 1) {

    let field = sphere._Fields[g],
        sides = field._adjacentFields.length,
        si    = field.data.strand;

    let n_innerFaces = (sides === 5 ? 3 : 4),
        innerFaces = hull.faces.slice(f_h, f_h + n_innerFaces);

    innerFaces.unshift(continentFaces[si].length, 0);

    Array.prototype.splice.apply(
      continentFaces[si],
      innerFaces
    );

    f_h += n_innerFaces;

  }

  // TODO — stitch inner and outer edges together with closing faces
  //        — prepare inner edge segments for export

  return continentFaces;

};
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
        n_centroids = sphere._interfieldCentroids.length;

  const p_i = 2 * n_centroids;

  var faces = {},
      edges = {};

  Object.keys(sphere._strands).forEach(si => {
    faces[si] = [];
    edges[si] = [];
  });

  // sort/copy points & faces from polyhedra into strands

  let f_h = 0;

  // do this in the same order as global-polyhedra so the arrays still make sense.

  for (let g = 0; g < n_fields; g += 1) {

    let field = sphere._Fields[g],
        sides = field._adjacentFields.length,
        si    = field.data.strand;

    let n_outerFaces = (sides === 5 ? 3 : 4) + (sides * 2),
        outerFaces   = hull.faces.slice(f_h, f_h + n_outerFaces);

    outerFaces.unshift(faces[si].length, 0);

    Array.prototype.splice.apply(
      faces[si],
      outerFaces
    );

    f_h += n_outerFaces;

  }

  for (let g = 0; g < n_fields; g += 1) {

    let field = sphere._Fields[g],
        sides = field._adjacentFields.length,
        si    = field.data.strand;

    let n_innerFaces = (sides === 5 ? 3 : 4) + (sides * 2),
        innerFaces   = hull.faces.slice(f_h, f_h + n_innerFaces);

    innerFaces.forEach(f=>f.reverse());

    innerFaces.unshift(faces[si].length, 0);

    Array.prototype.splice.apply(
      faces[si],
      innerFaces
    );

    f_h += n_innerFaces;

  }

  // stitch inner and outer edges together with closing faces
  // and prepare inner edge segments for export

  for (let g = 0; g < n_fields; g += 1) {

    let field = sphere._Fields[g],
        sides = field._adjacentFields.length,
        si    = field.data.strand;

    for (let sv = 0; sv < sides; sv += 1) {

      if( field._adjacentFields[sv].data.strand !== si ){

        let sp = ((sv + sides - 1 ) % sides);

        // this is a boundary – store the faces for this in this continent

        let o1 = sphere._interfieldIndices[6 * g + sv],
            o2 = sphere._interfieldIndices[6 * g + sp],
            i1 = p_i + sphere._interfieldIndices[6 * g + sv],
            i2 = p_i + sphere._interfieldIndices[6 * g + sp];

        if(g === 1){
          faces[si].push(
            [o1, o2, i1],
            [i2, i1, o2]
          );
        }else{
          faces[si].push(
            [i1, o2, o1],
            [o2, i1, i2]
          );
        }

        if(sides > 5 && field._adjacentFields[sv]._adjacentFields.length > 5) edges[si].push([i1, i2]);

      }

    }

  }

  return {
    faces,
    edges
  };

};
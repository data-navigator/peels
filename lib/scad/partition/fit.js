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

const {find, filter, shuffle, min} = require('lodash'),
      {Vec3, Quat}            = require('pex-math'),
      Sphere                  = require('../../sphere'),
      interField = require('../../sphere/inter-field'),
      digest                  = require('../digest'),
      Box                     = require('../bounding-box');

const up = [0, 0, 1];

const unlabled = field => typeof field.data.strand === 'undefined';

const adjacentMarked = field => find(field._adjacentFields, adjacent=>!unlabled(adjacent));

const addToBounds = (sphere, polyhedra, bounds, norm, field)=> {

  const border = 2 * sphere._interfieldCentroids.length;

  let g     = field._i,
      sides = field._adjacentFields.length;

  for (let sv = 0; sv < sides; sv += 1) {

    let sp = ((sv + sides - 1 ) % sides);

    let o1 = sphere._interfieldIndices[6 * g + sv],
        o2 = sphere._interfieldIndices[6 * g + sp],
        i1 = border + sphere._interfieldIndices[6 * g + sv],
        i2 = border + sphere._interfieldIndices[6 * g + sp];

    bounds
      .add(o1)
      .add(o2)
      .add(i1)
      .add(i2);

  }

  Vec3.add(norm, polyhedra.holeCenters[g]);

};

const fits = function (area, verts) {
  let box = Box.fromPoints(verts).getSize();
  return (box[0] <= area[0] &&
          box[1] <= area[1] &&
          box[2] <= area[2])
};

const wouldFit = function (sphere, polyhedra, printableArea, set, candidate) {

  const border = 2 * sphere._interfieldCentroids.length;

  let verts  = [],
      bounds = new Set(),
      norm   = [0, 0, 0];

  set.forEach(field=> { addToBounds(sphere, polyhedra, bounds, norm, field) });
  addToBounds(sphere, polyhedra, bounds, norm, candidate);

  Vec3.normalize(norm);

  bounds.forEach(bi=> {

    verts.push(
      Vec3.multQuat(
        Vec3.copy(bi < border ? polyhedra.trunc.points[bi] : polyhedra.hull.points[bi]),
        Quat.fromDirection(Quat.create(), norm, up)
      )
    )

  });

  return fits(printableArea, verts);

};

const attemptFit = function (sphere, opts) {

  const {
          polyhedra,
          printableArea
        } = opts;

  var seed    = shuffle(sphere._Fields)[0],
      marked  = 0,
      cStrand = 0;

  while (seed) {

    let queue = new Set([seed]);

    while (queue.size < (sphere._Fields.length - marked)) {

      let toAdd = [];

      queue.forEach(
        field => {
          toAdd = toAdd.concat(
            filter(
              field._adjacentFields,
              adjacent => unlabled(adjacent) && !queue.has(adjacent) &&
                          wouldFit(sphere, polyhedra, printableArea, queue, adjacent)
            )
          );
        }
      );

      if (toAdd.length === 0) {
        break;
      } else {
        toAdd.forEach(field => queue.add(field));
      }

    }

    queue.forEach(field=> {

      field.data = {strand: cStrand};
      marked++;

    });

    seed = shuffle(filter(sphere._Fields, field=> unlabled(field) && adjacentMarked(field)))[0];

    cStrand++;

  }

};

module.exports = function (opts) {

  const attempts = 1024;

  let bestN = Infinity,
      bestMin = -Infinity,
      best;

  for (let a = 0; a < attempts; a++) {

    let sphere = new Sphere({divisions: opts.d});
    interField.call(sphere);

    attemptFit(sphere, opts);

    let strands  = digest(sphere),
        strandsN = Object.keys(strands).length,
        minN = min(Object.keys(strands).map(strand=>strands[strand].length));

    if (
      (strandsN < bestN && minN - bestMin >= bestN - strandsN) ||
      (strandsN === bestN && minN > bestMin)
    ) {
      bestN = strandsN;
      bestMin = minN;
      best = sphere;
    }

    console.log('[Attempt]', a, bestN, bestMin);

  }

  return best;

};
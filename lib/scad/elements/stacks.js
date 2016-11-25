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

const {max}          = require('lodash'),
      {Vec3}         = require('pex-math'),
      Box            = require('../bounding-box'),
      mat4FromNormal = require('../mat4-from-normal');

const {sqrt, pow} = Math;

const origin = [0, 0, 0];

module.exports = function (continents, opts) {

  const {
          polyhedra: {R, R_inner, border, hull, trunc},
          printableArea,
          ax,
          gap
        }                                                                      = opts,
        {bounds, norms}                                                        = continents,
        sis                                                                    = Object.keys(bounds),
        limit                                                                  = printableArea[ax];

  let queue = sis.slice(0);

  let stacks  = [],
      stack   = [],
      offsets = [];

  function getD(s) {

    // find the furthest distance from the `ax` axis of the inner bounds[s] and the outer
    // bounds[s-1]

    let mat4  = mat4FromNormal(norms[sis[s]], origin, true, true),
        verts = [];

    bounds[sis[s - 1]].forEach(bi=> {

      if (bi >= border) {

        let vert = Vec3.multMat4(
          Vec3.copy(hull.points[bi]),
          mat4
        );

        verts.push(vert);

      }

    });

    bounds[sis[s]].forEach(bi=> {

      if (bi < border) {

        let vert = Vec3.multMat4(
          Vec3.copy(trunc.points[bi]),
          mat4
        );

        verts.push(vert);

      }

    });

    return Math.min(max(verts.map(vert=> {

      let axes = 0;

      vert.forEach((axis, a)=> {
        if (a !== ax) axes += pow(axis, 2)
      });

      return sqrt(axes);

    })), R_inner);

  }

  function getOffsets(stack) {

    let os = [];

    stack.forEach((si, s)=> {

      if (s === 0) os.push(0);

      else {

        let D = getD(s);

        os.push(
          os[s - 1] +
          gap +
          sqrt(pow(R, 2) - pow(D, 2)) -
          sqrt(pow(R_inner, 2) - pow(D, 2))
        );

      }

    });

    return os;

  }

  function fits(stack) {

    if (stack.length === 0) return true;

    // get the bounding box for all the continents in this stack

    let verts   = [],
        offsets = getOffsets(stack);

    stack.forEach((si, s)=> {

      let mat4 = mat4FromNormal(norms[si], origin, true, true);

      bounds[si].forEach(bi=> {

        let vert = Vec3.multMat4(
          Vec3.copy(bi < border ? trunc.points[bi] : hull.points[bi]),
          mat4
        );

        vert[ax] -= offsets[s];

        verts.push(vert);

      });

    });

    let box = Box.fromPoints(verts).getSize();

    return box[ax] <= limit;

  }

  while (queue.length) {

    while (true) {
      if (queue[0] && fits(stack.concat(queue[0]))) {
        stack.push(queue.shift());
      } else {
        stacks.push(stack);
        offsets.push(getOffsets(stack));
        stack = [];
        break;
      }
    }

    if (stacks[stacks.length - 1].length === 0) {
      console.log('Empty stack added :(');
      break;
    }

  }

  console.log('[Stacks]', stacks);
  console.log('[Offsets]', offsets);

  return {
    stacks,
    offsets
  }

};
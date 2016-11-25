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

const {Vec3}         = require('pex-math'),
      Box            = require('../bounding-box'),
      mat4FromNormal = require('../mat4-from-normal');

const origin = [0, 0, 0];

module.exports = function (continents, opts) {

  const {polyhedra: {Δ, border, hull, trunc}, printableArea, ax, gap} = opts,
        {bounds, norms}                                               = continents,
        sis                                                           = Object.keys(bounds),
        limit                                                         = printableArea[ax],
        offset                                                        = Δ + gap;

  let stacks = [],
      stack  = [];

  function fits(stack) {

    if(stack.length === 0) return true;

    // get the bounding box for all the continents in this stack

    let verts = [];

    stack.forEach((si, s)=> {

      let mat4 = mat4FromNormal(norms[si], origin, true, true);

      bounds[si].forEach(bi=> {

        let vert = Vec3.multMat4(
          Vec3.copy(bi < border ? trunc.points[bi] : hull.points[bi]),
          mat4
        );

        // TODO — this offset dosn't guarantee non-collision

        vert[ax] += offset * s;

        verts.push(vert);

      });

    });

    let box = Box.fromPoints(verts).getSize();

    return box[ax] <= limit;

  }

  while(sis.length) {

    while (true) {
      if(sis[0] && fits(stack.concat(sis[0]))){
        stack.push(sis.shift());
      }else{
        stacks.push(stack);
        stack = [];
        break;
      }
    }

    if(stacks[stacks.length - 1].length === 0){
      console.log('Empty stack added :(');
      break;
    }

  }

  console.log('[Stacks]', stacks);

  return {
    stacks,
    offset
  }

};
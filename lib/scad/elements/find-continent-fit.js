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

const mat4FromNormal = require('../mat4-from-normal'),
      {Vec3}         = require('pex-math'),
      Box            = require('../bounding-box');

module.exports = function (bounds, norm, opts) {

  const up = Vec3.normalize([0, .0001, -.999]);

  const {
          innerVerts,
          outerVerts,
          border,
          R,
          printableArea
        }     = opts,

        verts = [],

        mat4  = mat4FromNormal(
          norm,
          [0, 0, -R],
          false,
          true
        );

  function fits(verts) {
    let box = Box.fromPoints(verts).getSize();
    return (box[0] <= printableArea[0] &&
            box[1] <= printableArea[1] &&
            box[2] <= printableArea[2])
  }

  bounds.forEach(bi=> {
    verts.push(
      Vec3.multMat4(
        Vec3.copy(bi < border ? outerVerts[bi] : innerVerts[bi]),
        mat4
      )
    )
  });

  // TODO — if this already fits, return

  if (fits(verts)) return up;

  // TODO — rotate around the Z axis until one of the dimensions is smallest
  //      + return this if this fits

  // TODO – using this Z axis rotation, rotate around the axis of the shortest dimension
  //      + do this until it fits

  return up;

};
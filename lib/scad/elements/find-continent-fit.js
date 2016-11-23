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
      {Vec3} = require('pex-math'),
      Box = require('./bounding-box');

module.exports = function(bounds, norm, opts){

  const {innerVerts, outerVerts, border, R, printableArea} = opts,
        verts = [],
        om4 = mat4FromNormal(norm, [0, 0, -R], false),
        mat4 = [
          om4[0][0], om4[0][1], om4[0][2], om4[0][3],
          om4[1][0], om4[1][1], om4[1][2], om4[1][3],
          om4[2][0], om4[2][1], om4[2][2], om4[2][3],
          om4[3][0], om4[3][1], om4[3][2], om4[3][3]
        ];

  bounds.forEach(bi=>{
    verts.push(
      Vec3.multMat4(
        Vec3.copy(bi < border ? outerVerts[bi] : innerVerts[bi]),
        mat4
      )
    )
  });

  let box = Box.fromPoints(verts).getSize();

  console.log('[Continent size]', box);

  return norm;

};
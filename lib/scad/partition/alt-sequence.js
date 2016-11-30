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

const Sphere = require('../../sphere'),
      interField = require('../../sphere/inter-field'),
      digest = require('../digest');

module.exports = function(opts){

  const {n: nPerStrand, grouping, d} = opts;

  var sphere = new Sphere({divisions: d});
  interField.call(sphere);

  sphere._Fields.forEach(field=>{

    var i = field._i,
        nF = sphere._Fields.length,
        d = sphere._divisions,
        x_lim = d * 2,
        y_lim = d,
        s_lim = x_lim * y_lim;

    var strand, point;

    if(i === 0) // North is the first member of the first strand
    {strand = 0; point = 0;}

    else if (i === 1) // South is the last member of the last strand
    {strand = Math.floor(nF / nPerStrand); point = nF % nPerStrand}

    else{

      let l = i - 2, // sxy index
          s = Math.floor( l / (x_lim * y_lim)), // section
          sm = s % 2, // whether section is odd (0 if even, 1 if odd)
          si = l - s_lim * s,// index within section
          ai = s * s_lim + (
              (1 - sm * 2) /* 1 or -1 */ * (si) +
              (sm * s_lim) -
              sm
            ) + 2; // alternating index

      strand = Math.floor( (ai - 1) / nPerStrand );

      point = (ai - 1) % nPerStrand;

    }

    field.data = { strand, point };

  });

  if(nPerStrand === 50){

    sphere._Fields[ sphere._Fields.length - 1 ].data.strand -=1;

  }

  if(grouping){

    switch(grouping){
      case 'NS':

        let strands = digest(sphere);

        Object.keys(strands).forEach(si=>{

          let strand = strands[si],
              sφ = 0;

          strand.forEach(field => sφ += field.position[0]);

          strand.forEach((field) => {
            field.data = {
              strand: field._i === 0 ? 2 : (sφ < 0 ? 0 : 1),
              substrand: field.data.strand,
              point: field.data.point
            };
          });

        });

        break;
    }

  }

  return sphere;

};
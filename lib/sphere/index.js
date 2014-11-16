/*
 * Copyright (c) 2014 Will Shown. All Rights Reserved.
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

var PEELS = 5;

(function (module) {

  var _ = require('lodash');

  var Field = require('../field');

  var serialize = require('./serialize');
  var validate = require('./validate');

  /**
   * Represents a sphere of fields arranged in an interpolated icosahedral geodesic pattern.
   *
   * @param {object} options
   * @param {number} [options.divisions = 8] - Integer greater than 0:
   *   the number of fields per edge of the icosahedron including
   *   the origin of the edge (but not the endpoint). Determines the
   *   angular resolution of the sphere. Directly & exponentially related
   *   to the memory consumption of a Sphere.
   * @constructor
   */
  function Sphere(options) {

    var opts = options || {},
        data = {};

    if(opts.data) {
      if (validate(opts.data)) {
        data = opts.data;
      } else {
        throw new Error('Invalid data provided.');
      }
    }

    this._divisions = Math.max((data.divisions || opts.divisions || 8), 1);

    this._Fields = [];
    this._North = new Field(this, 'NORTH', data.north);
    this._South = new Field(this, 'SOUTH', data.south);

    var x = this._divisions * 2, y = this._divisions, i, j, k;

    for(k=0; k < PEELS; k+=1){
      this._Fields[k] = [];

      for(i=0; i < x; i+=1){
        this._Fields[k][i] = [];

        for(j=0; j < y; j+=1){
          this._Fields[k][i][j] = new Field(
            this,
            {s: k, x: i, y: j},
            (data.fields ? data.fields[k][i][j] : undefined)
          );
        }
      }
    }

  }

  Sphere.prototype.serialize = function(){
    return serialize.call(this);
  };

  module.exports = Sphere;

}(module));
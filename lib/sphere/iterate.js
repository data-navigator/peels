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

(function(module){

  var _ = require('lodash'),
      uid = require('uid'),
      async = require('async');

  module.exports = function(perField, done){

    var Sphere = this,
        iterid = uid(8);

    if(Sphere._iteration){
      Sphere._iteration.current = iterid;
    }else{
      Sphere._iteration = {
        current: iterid
      }
    }

    var fieldIterator;

    if(Sphere._geometry && _.isFunction(Sphere._colorFn)){
      fieldIterator = function(field, doneField){
        _.defer(_.bind(perField, field), function(){
          Sphere.assignColor(field, Sphere._colorFn.call(field, field.data, field._pos, field._sxy));
          doneField.apply(this, arguments);
        });
      }
    }else{
      fieldIterator = function(field, doneField){
        perField.call(field, doneField);
      }
    }

    async.parallel([
      function(doneNorth){
        fieldIterator(Sphere._North, doneNorth);
      },
      function(doneSouth){
        fieldIterator(Sphere._South, doneSouth);
      },
      function(doneSections){
        async.each(Sphere._Fields, function(section, doneSection){
          async.each(section, function(column, doneColumn){
            async.each(column, fieldIterator, doneColumn);
          }, doneSection);
        }, doneSections);
      }
    ], function(){
      Sphere._iteration.previous = iterid;
      Sphere._iteration.current = null;
      done.apply(null, arguments);
    });

  };

}(module));
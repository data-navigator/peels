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

const {parallelLimit, series} = require('async'),
      moment                  = require('moment'),
      {spawn}                 = require('child_process');

const limit = 5;

var tasks = [];

for (let m = 0; m < 20; m++) {

  tasks.push(function (done) {

    let x     = m,
        start = moment();

    let scad = spawn(
      '/usr/local/openscad',
      ['-o', `model_${x}.stl`, `model_${x}.scad`],
      {cwd: __dirname}
    );

    console.log(`[Model ${x}]`, `Spawned @ ${start.format('HH:mm')}`);

    scad.stdout.on('data', (data) => {
      console.log(`[Model ${x}]`, `${data}`);
    });

    scad.stderr.on('data', (data) => {
      console.log(`[Model ${x}]`, 'ERR', `${data}`);
    });

    scad.on('close', (code) => {

      let end = moment(),
          dur = moment.duration(start.diff(end));

      console.log(`[Model ${x}]`,
        `Exited with ${code} @ ${end.format('HH:mm')}, took ${ Math.floor(dur.asHours()) +
                                                               moment.utc(dur.asMilliseconds())
                                                                 .format(":mm:ss") }`);

      done(null);

    });

  });

}

series([

  done=> {
    parallelLimit(tasks, limit, ()=> {done(null)});
  },

  done=> {

    let zip = spawn(
      'zip',
      ['real_peels.zip', '*.stl'],
      {cwd: __dirname}
    );

    zip.stdout.on('data', (data) => {
      console.log(`[Zipping]`, `${data}`);
    });

    zip.stderr.on('data', (data) => {
      console.log(`[Zipping]`, 'ERR', `${data}`);
    });

    zip.on('close', (code)=> { done(null) });

  }

], ()=> {

  console.log('[Done!]');

});
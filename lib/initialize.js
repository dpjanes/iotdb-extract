/*
 *  lib/initialize.js
 *
 *  David Janes
 *  IOTDB.org
 *  2018-09-01
 *
 *  Copyright [2013-2018] [David P. Janes]
 *
 *  Licensed under the Apache License, Version 2.0 (the "License");
 *  you may not use this file except in compliance with the License.
 *  You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 *  Unless required by applicable law or agreed to in writing, software
 *  distributed under the License is distributed on an "AS IS" BASIS,
 *  WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 *  See the License for the specific language governing permissions and
 *  limitations under the License.
 */

"use strict"

const _ = require("iotdb-helpers")

const extract = require("extract")

const assert = require("assert")

/**
 *  Requires: self.extractd
 *  Produces: self.extract
 */
const initialize = _.promise.make((self, done) => {
    const method = "initialize";

    assert.ok(self.extractd, `${method}: expected self.extractd`)

    extract.createConnection(self.extractd, (error, client) => {
        if (error) {
            return done(error)
        }

        self.extract = client;

        done(null, self)
    })
})

/**
 *  API
 */
exports.initialize = initialize

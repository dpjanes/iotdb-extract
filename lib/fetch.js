/**
 *  lib/fetch.js
 *
 *  David Janes
 *  IOTDB
 *  2018-09-01
 *
 *  Copyright (2013-2020) David P. Janes
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

const _ = require("iotdb-helpers")

/**
 *  Optional module
 */
const fetch = _.promise((self, done) => {
    const iotdb_fetch = require("iotdb-fetch")

    _.promise(self)
        .validate(fetch)
        .then(iotdb_fetch.document.get(self.url))
        .end(done, self, fetch)
})

fetch.method = "fetch"
fetch.requires = {
    url: _.is.AbsoluteURL,
}
fetch.accepts = {
}
fetch.produces = {
    document: _.is.String,
}
fetch.params = {
    url: _.p.normal,
}
fetch.p = _.p(fetch)

/**
 *  API
 */
exports.fetch = fetch

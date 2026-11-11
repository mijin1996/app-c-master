// English chapter translations, split into parts so each file stays small.
const fs = require('node:fs');
const path = require('node:path');

const parts = fs.readdirSync(__dirname).filter((f) => /^chapters-\d+-\d+\.cjs$/.test(f)).sort();
module.exports = Object.assign({}, ...parts.map((f) => require(path.join(__dirname, f))));

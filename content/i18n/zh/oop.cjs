// 中文面向对象课程翻译，分成几个文件以便维护。
const fs = require('node:fs');
const path = require('node:path');

const parts = fs.readdirSync(__dirname).filter((f) => /^oop-\d+-\d+\.cjs$/.test(f)).sort();
module.exports = Object.assign({}, ...parts.map((f) => require(path.join(__dirname, f))));

const fs = require('fs');
const requireFromString = require('require-from-string');

// //////////////////////////////////////////////////////////////////////////////////////////////////////

function writeConfig(path, data) {
    return fs.writeFileSync(path, Buffer.from(data).toString('base64'));
}
Object.assign(module.exports,{writeConfig});

// //////////////////////////////////////////////////////////////////////////////////////////////////////

function readConfig(path) {
    return Buffer.from(fs.readFileSync(path).toString(), 'base64').toString();
}
Object.assign(module.exports,{readConfig});

// //////////////////////////////////////////////////////////////////////////////////////////////////////

function requireConfig(path) {
    return requireFromString(readConfig(path));
}
Object.assign(module.exports,{requireConfig});

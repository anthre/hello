const fs = require('fs');
const glob = require('glob');
const childProcess = require('child_process');
const _path = require('path');
const lodash = require('lodash');

const {requireConfig,readConfig,writeConfig} = require('./ConfigUtil');

// //////////////////////////////////////////////////////////////////////////////////////////////////////

global.assign = Object.assign;
global.log = console.log;
global.existsSync = fs.existsSync;

// //////////////////////////////////////////////////////////////////////////////////////////////////////

global.readFileSync = async(path)=>{
    if (!fs.existsSync(path)) {
        return undefined;
    }
    return fs.readFileSync(path).toString();
}

// //////////////////////////////////////////////////////////////////////////////////////////////////////

global.writeFileSync = async(path, data)=>{
    const dirName = _path.dirname(path);
    if (!fs.existsSync(dirName)) {
        fs.mkdirSync(dirName);
    }
    fs.writeFileSync(
        path, 
        (lodash.isString(data) ? data : JSON.stringify(data))
    );
};

// //////////////////////////////////////////////////////////////////////////////////////////////////////

global.execSync = (command, callback=console.log)=>{
    try {
        callback(childProcess.execSync(command).toString());
    } catch (e) {
        e.output&&callback(e.output.toString());
        e.stderr&&callback(e.stderr.toString());
        if (!e.output && !e.stderr) {
            callback(e);
        }
    }
};

// //////////////////////////////////////////////////////////////////////////////////////////////////////

global.randomSleep = async(sec=3, isRandom=true)=>{
    return new Promise((done)=>setTimeout(
        done, 
        1000 * sec * (isRandom ? Math.random() : 1)
    ));
};

// //////////////////////////////////////////////////////////////////////////////////////////////////////

global.requireAll = (config={})=>{
    const path = (config.path || config);

    const requires = {};
    const files = glob.sync(path).filter((file)=>(!file.match(/test.js/)));
    for (const file of files.filter( (ff)=>(!ff.match(/index\.js/)) )) {
        const data = require(`../${file}`);
        for (const key of Object.keys(data)) {
            requires[key] = data[key];
        }
    }
    return requires;
};

// //////////////////////////////////////////////////////////////////////////////////////////////////////

global.RECORD_EVENT = (...events)=>{
    if (!events[0]) {
        return;
    }
    const allEvents = [
        new Date(),
        new Error().stack.split('\n')[2].replace(/( +at | |\(.+)/g,'')+'()',
        ',',
        ...events,
    ];
    return new Promise((done)=>{
        fs.appendFile('./cache/event.log', `>> ${JSON.stringify(allEvents)}\n`, done);
    });
};

// //////////////////////////////////////////////////////////////////////////////////////////////////////

global.LOG_EVENT = (...events)=>{
    if (!events[0]) {
        return;
    }
    const allEvents = [
        new Date(),
        new Error().stack.split('\n')[2].replace(/( +at | |\(.+)/g,'')+'()',
        ',',
        ...events,
    ];
    console.log(`>> ${JSON.stringify(allEvents)}\n`);
};

// //////////////////////////////////////////////////////////////////////////////////////////////////////

const configFile = './config.js';
// writeConfig(configFile, `
// `);
// console.log(
//     readConfig(configFile).toString().replace(/([\`\$])/g,'\\$1')
// );
global.CONFIG = requireConfig(configFile);

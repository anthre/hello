const fs = require('fs');
const request = require('requestretry');
const htmlParser = require('fast-html-parser');

// //////////////////////////////////////////////////////////////////////////////////////////////////////

class FileAdapter {
    constructor(config={}) {
        Object.assign(this, {
            path: '',
        }, config);
    }

    // //////////////////////////////////////////////////////////////////////////////////////////////////

    async getStatus(config={}) {
        const { path } = Object.assign({}, this, config);
        if (!fs.existsSync(path)) {
            return undefined;
        }
        const status = await new Promise((done)=>{
            const stat = fs.statSync(path);
            done({
                updatedDate: stat.mtime,
            });
        });
        return status;
    }

    // //////////////////////////////////////////////////////////////////////////////////////////////////

    async load(config={}) {
        const { path } = Object.assign({}, this, config);
        return readFileSync(path);
    }

    // //////////////////////////////////////////////////////////////////////////////////////////////////

    async save(config={}) {
        const { path, data } = Object.assign({}, this, config);
        writeFileSync(path, data);
    }
}
Object.assign(module.exports,{FileAdapter});

// //////////////////////////////////////////////////////////////////////////////////////////////////////

class HtmlAdapter {
    constructor(config = {}) {
        Object.assign(this,{
            maxAttempts : 10,
            timeout     : 1000*20,
            method      : 'GET',
            headers     : {
                'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_14_5) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/75.0.3770.142 Safari/537.36',
            },
        },config);
        Object.assign(this,{
            days        : (config.days || 30),
            lastDate    : (config.lastDate || new Date()),
        },config);
    }

    async request(config = {}) {
        return new Promise((done)=>{
            request(
                Object.assign({}, this, config), 
                (error, res, body)=>{
                    if (error) {
                        throw new Error(error);
                    }
                    const parsedBody = htmlParser.parse(body);

                    if (parsedBody.childNodes.length) {
                        // Customizing...
                        parsedBody.childNodes.filterAll = filterAllNodes.bind(parsedBody.childNodes);
                        done(parsedBody);
                    } else {
                        done(body);
                    }
                }
            );
        });
    }
}
assign(module.exports,{HtmlAdapter});

function filterAllNodes(func, childNodes=this) {
    let result = childNodes.filter(func);
    for (const childNode of childNodes) {
        if (childNode.childNodes) {
            result = result.concat(filterAllNodes(func, childNode.childNodes));
        }
    }

    // Customizing...
    result.filterAll = filterAllNodes.bind(result);
    return result;
}

// //////////////////////////////////////////////////////////////////////////////////////////////////////

class JsonAdapter {
    constructor(config = {}) {
        Object.assign(this,{
            maxAttempts : 109,
            timeout     : 1000*20,
            method      : 'POST',
            headers     : {
                'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_14_5) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/75.0.3770.142 Safari/537.36',
                "Content-type": "application/json",
            },
        },config);
        Object.assign(this,{
            days        : (config.days || 30),
            lastDate    : (config.lastDate || new Date()),
        },config);
    }

    async request(config = {}) {
        return new Promise((done)=>{
            request(
                Object.assign({}, this, config), 
                (error, res, body)=>{
                    if (error) {
                        throw new Error(error);
                    }
                    done(body);
            });
        });
    }
}
assign(module.exports,{JsonAdapter});

// //////////////////////////////////////////////////////////////////////////////////////////////////////

async function randomSleep(sec=3, isRandom=true) {
    return new Promise((done)=>setTimeout(
        done, 
        1000 * sec * (isRandom ? Math.random() : 1)
    ));
}
assign(module.exports,{randomSleep});
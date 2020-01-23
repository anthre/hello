const express = require('express');
const cache = require('memory-cache');
const fs = require('fs');

// //////////////////////////////////////////////////////////////////////////////////////////////////////

async function recordAccess(req) {
    const allEvents = [
        new Date(),
        ',',
        req.originalUrl,
        req.query,
        req.params, 
        req.headers['x-forwarded-for'],
        req.headers['user-agent'],
    ];
    return new Promise((done)=>{
        fs.appendFile('./cache/access.log', `>> ${JSON.stringify(allEvents)}\n`, done);
    });
}

// //////////////////////////////////////////////////////////////////////////////////////////////////////

function useCache(duration=60) {
    return (req,res,next)=>{
        const cachekey = (req.originalUrl || req.url);
        const cacheValue = cache.get(cachekey);
        if (cacheValue) {
            res.send(cacheValue);
            res.end();
            return;
        } else {
            res.sendResp = res.send;
            res.send = (body)=>{
                cache.put(cachekey, body, duration*1000);
                res.sendResp(body);
            };
        }
        next();
    };
}

// //////////////////////////////////////////////////////////////////////////////////////////////////////

class Web {
    constructor(config={}) {
        Object.assign(this, {
            path: '',
        }, config);
    }

    async render({req, res}={}) {
        throw new Error('Not Implement. Please Override.');
    }

    register(config={}) {
        const {path,app} = Object.assign({},this,config);

        const router = express.Router();
        router.get('/', useCache(), (req,res)=>{
            (async()=>{
                // recordAccess(req);
                const result = await this.render({req,res});
                res.send(result);
                res.end();
            })();
        });
        app.use(path,router);
    }
}
assign(module.exports,{Web});


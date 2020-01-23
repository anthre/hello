const express = require('express');
const fs = require('fs');

// //////////////////////////////////////////////////////////////////////////////////////////////////////

const Webs = requireAll({ path:'./web/**.js' });
assign(module.exports,Webs);

// //////////////////////////////////////////////////////////////////////////////////////////////////////

async function startWeb() {
    LOG_EVENT(true);

    const app = express();
    app.use('/js/',   express.static('docs/js/'));
    app.use('/css/',  express.static('docs/css/'));
    app.use('/json/', express.static('docs/json/'));

    new Webs.IndexWeb().register({ app, path:'/', });
    await new Promise((done)=>app.listen(process.env.PORT, done));
}
assign(module.exports,{startWeb});

// //////////////////////////////////////////////////////////////////////////////////////////////////////

async function generateDocs() {
    LOG_EVENT(true);

    const originUrl = '/hello';
    const docsPath = './docs';

    await Promise.all([
        new Webs.IndexWeb().render({originUrl}).then((html)=>writeFileSync(`${docsPath}/index.html`,html)),
    ]);
}
assign(module.exports,{generateDocs});

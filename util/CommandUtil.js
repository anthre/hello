const glob = require('glob');
const path = require('path');
const fs = require('fs');
const request = require('requestretry');
const cache = require('memory-cache');
const os = require('os');

const Mocha = require('mocha');
const webpack = require('webpack');
const UglifyJsPlugin = require('uglifyjs-webpack-plugin');
const HardSourceWebpackPlugin = require('hard-source-webpack-plugin');
const TerserPlugin = require('terser-webpack-plugin')

// //////////////////////////////////////////////////////////////////////////////////////////////////////

function clearCache() {
    LOG_EVENT(true);
    log('-------------------------');
    execSync('rm -rf ./cache/');
    log('-------------------------');
}
assign(module.exports,{clearCache});

// //////////////////////////////////////////////////////////////////////////////////////////////////////

function hasStarted() {
    if (existsSync('.git')) {
        return true;        
    }
    LOG_EVENT('FALSE');
    return false;
}
assign(module.exports,{hasStarted});

// //////////////////////////////////////////////////////////////////////////////////////////////////////

async function checkHealth() {
    const url = 'https://hello.anthrenijisanji.repl.co';

    const results = await new Promise((done)=>{
        const time = new Date().getTime();
        request(url,(err,res)=>done([
            (new Date().getTime() - time), 
            res && res.statusCode,
            res && res.body.slice(0,20)+'...',
            err,
        ]));
    });
    LOG_EVENT(true, ...results);
    RECORD_EVENT((results[0]>10000 || results[1]!==200 || results[3]), ...results);
}
assign(module.exports,{checkHealth});

// //////////////////////////////////////////////////////////////////////////////////////////////////////

async function logMetrics() {
    LOG_EVENT(true);
    log('-------------------------');
    await new Promise((done)=>{
        execSync('df -h | egrep "Filesystem|overlay"');
        // execSync('ls -lhd ./cache/*');
        const memoryStats = {
            Size    : Math.floor(os.totalmem()/1024/1024/1024)+'G',
            Used    : Math.floor((os.totalmem()-os.freemem())/1024/1024/1024*100)/100+'G',
            Avail   : Math.floor(os.freemem()/1024/1024/1024*100)/100+'G',
            'Use%'  : Math.floor((1-os.freemem()/os.totalmem())*100)+'%',
        };
        log(...Object.keys(memoryStats), '(Memory)');
        log(...Object.values(memoryStats));
        log();
        log('1mim','5min','15min','(Load)');
        log(...os.loadavg().map((load)=>Math.floor(load/os.cpus().length*100)/100));
        done();
    });
    log('-------------------------\n');
}
assign(module.exports,{logMetrics});

// //////////////////////////////////////////////////////////////////////////////////////////////////////

async function restoreFromGit() {
    LOG_EVENT(true);
    log('-------------------------');
    await new Promise((done)=>{
        execSync(`
if [ ! -e docs/json/ ]; then mkdir docs/json/; fi;
if [ ! -e docs/js/ ];   then mkdir docs/js/;   fi;
rm -rf cache/*master*;
git clone https://github.com/anthre/hello.git cache/hello-master;
for file in \`find cache/hello-master/ -type f | egrep -v 'git' | perl -pe 's|cache/hello-master/||g'\`; do cp cache/hello-master/\$file \$file; done;
rm -rf cache/*master*;
`);
        done();
    });
    log('-------------------------\n');
}
assign(module.exports,{restoreFromGit});

// //////////////////////////////////////////////////////////////////////////////////////////////////////

async function backupToGit() {
    LOG_EVENT(true);
    log('-------------------------');
    await new Promise((done)=>{
        execSync(`
if [ ! -e .git ]; then
    git init .;
    git remote add origin https://anthre:${CONFIG.commitToGit.token()}@github.com/anthre/hello.git;
    git config user.name  "anthre";
    git config user.email "nijisanji.anthre@gmail.com";
    echo 'cache\nnode_modules\npackage-lock.json' > .gitignore;
fi;
git remote set-url origin https://anthre:${CONFIG.commitToGit.token()}@github.com/anthre/hello.git;
git add . --ignore-errors;
git commit -a -m "backup repl.it";
git push origin master -f;
`);
        done();
    });
    log('-------------------------\n');
}
assign(module.exports,{backupToGit});

// //////////////////////////////////////////////////////////////////////////////////////////////////////

async function runTest() {
    LOG_EVENT(true);
    log('-------------------------');
    const mocha = new Mocha({ui:'bdd'});
    const testFiles = glob.sync('{adapter,cron,model,util,web}/**/*.test.js');
    console.log(testFiles.join('\n'));
    for (const testFile of testFiles) {
        mocha.addFile(testFile);
    }

    await new Promise((done)=>{
        mocha.run(done);
    });
    log('-------------------------\n');
}
assign(module.exports,{runTest});

// //////////////////////////////////////////////////////////////////////////////////////////////////////

async function registerBuild() {
    LOG_EVENT(true);

    const config = {
        context     : path.join(__dirname, "../"),
        entry       : ["@babel/polyfill", "./web/component/index.js"],
        module      : {
            rules: [{
                test    : /\.js?$/,
                exclude : /(node_modules)/,
                use     : [{
                    loader  : 'babel-loader?cacheDirectory',
                    options : {presets:['@babel/preset-react', '@babel/preset-env']},
                }],
            }],
        },
        output: {
            path     : path.join(__dirname, "../"),
            filename : "./docs/js/client.min.js",
        },
        plugins: [
            new webpack.optimize.OccurrenceOrderPlugin(),
            new UglifyJsPlugin({cache:true,parallel:true}),
            new HardSourceWebpackPlugin(),
        ],
        optimization: {
            minimizer: [
                new TerserPlugin(),
            ],
        },
    };

    // webpack(config).watch({/*aggregateTimeout:10000*/},(err,stats)=>{
    await new Promise((done)=>{
        const compiler = webpack(config);
        compiler.apply(new webpack.ProgressPlugin((per,msg,...arg)=>console.log(`${Math.floor(per*100)}%`,msg,arg[0]||'')));
        compiler.run((err,stats)=>{
            log('-------------------------');
            console.log(err);
            console.log(stats && stats.toString());
            log('-------------------------\n');
            done();
        });
    });
}
Object.assign(module.exports,{registerBuild});

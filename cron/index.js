
const Crons = requireAll({ path:'./cron/**.js' });
assign(module.exports,Crons);

const {generateDocs} = require('../web');
const {
    runTest,logMetrics,checkHealth,backupToGit,hasStarted,
} = require('../util');

// //////////////////////////////////////////////////////////////////////////////////////////////////////

async function executeCrons() {
    LOG_EVENT(true);
    await new Crons.ChannelsCron().execute();
    await Promise.all([
        new Crons.TwitterCron().execute(),
        new Crons.YoutubeCron().execute(),
        new Crons.NijisanjiCron().execute(),
    ]);
}
assign(module.exports,{executeCrons});

// //////////////////////////////////////////////////////////////////////////////////////////////////////

async function registerCrons() {
    new Crons.ChannelsCron(  '0 0 0 * * *' ).register();
    new Crons.NijisanjiCron( '0 0 0 * * *' ).register();
    new Crons.TwitterCron(   '0 0 * * * *' ).register();
    new Crons.YoutubeCron(   '0 0 * * * *' ).register();

    registerUtilCrons();
    LOG_EVENT(true);

    // new Crons.YoutubeCron().execute2();

    // new Crons.YoutubeCron().execute();
    // new Crons.TwitterCron().execute();
    // new Crons.NijisanjiCron().execute();
}
assign(module.exports,{registerCrons});

// //////////////////////////////////////////////////////////////////////////////////////////////////////

async function registerUtilCrons() {
    // new Crons.Cron('0 * * * * *').register({execute:checkHealth});
    new Crons.Cron('0 */2 * * * *').register({execute:logMetrics});
    //new Crons.Cron('0 * * * * *').register({execute:runTest});

    new Crons.Cron('0 10 * * * *').register({execute:async()=>{
        await generateDocs();
        backupToGit();
    }});
}

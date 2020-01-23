process.env.TZ = 'Asia/Tokyo';
process.env.PORT = 3000;
process.env.NODE_OPTIONS = `--max-old-space-size=${1024*8} --max_old_space_size=${1024*8}`;

// //////////////////////////////////////////////////////////////////////////////////////////////////////

require('./util/GlobalUtil');

// //////////////////////////////////////////////////////////////////////////////////////////////////////

const {startWeb,generateDocs} = require('./web');
const {registerCrons,executeCrons} = require('./cron');
const {
    hasStarted,
    restoreFromGit,backupToGit,registerBuild,
    runTest,
} = require('./util');

// //////////////////////////////////////////////////////////////////////////////////////////////////////

(async ()=>{
    if (!hasStarted()) {
        await restoreFromGit();
        require('./util/GlobalUtil');
        await executeCrons();
    }
    // await generateDocs();
    // await executeCrons();
    await backupToGit();

    await Promise.all([
        // registerBuild().then(backupToGit),
        registerCrons(),
        startWeb(),
    ]);
    // await randomSleep(10,false);
    // runTest();
})();


const {CronJob} = require('cron');

// //////////////////////////////////////////////////////////////////////////////////////////////////////

class Cron {
    constructor(config={}) {
        Object.assign(this, {
            timespan: (config.timespan || config),
            execute: (config.execute || this.execute.bind(this)),
            isExecuting: false,
        });
    }

    async execute() {
        throw new Error('Not Implement. Please Override.');
    }

    register(config={}) {
        const {timespan,execute} = Object.assign({},this,config);

        new CronJob(timespan, async()=>{
            if (!this.isExecuting) {
                this.isExecuting = true;
                await execute().catch(log);
                this.isExecuting = false;
            } else {
                LOG_EVENT('skip CronJob');
            }
        }, null, true);
    }
}
assign(module.exports,{Cron});

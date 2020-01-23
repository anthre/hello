const fs = require('fs');

const {Cron} = require('./CommonCron');
const {Channels} = require('../adapter');

// //////////////////////////////////////////////////////////////////////////////////////////////////////

class ChannelsCron extends Cron {
    constructor(config) {
        super(config);

        this.channelsJsonAdapter = new Channels.JsonAdapter();
        this.channelsFileAdapter = new Channels.FileAdapter();
    }

    async execute() {
        LOG_EVENT(true);
        await Promise.all([
             this.updateChannels(),
        ]).catch(log);
    }

    async updateChannels() {
    	const channels = await this.channelsJsonAdapter.getChannels({ isDetailed:true });
        const filterdChannels = channels.filter((channel)=>{
            return !channel.name.match(/にじさんじ|いわなが|ホロライブ公式/);
        });
        LOG_EVENT(filterdChannels.length);

        // Saving...
        await this.channelsFileAdapter.updateChannels(filterdChannels);
    }
}
assign(module.exports,{ChannelsCron});
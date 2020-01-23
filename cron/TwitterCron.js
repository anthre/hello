const {Cron} = require('./CommonCron');
const {TwitterFollowers,Channels} = require('../adapter');

// //////////////////////////////////////////////////////////////////////////////////////////////////////

class TwitterCron extends Cron {
    constructor(config) {
        super(config);

        this.twitterFollowersHtmlAdapter = new TwitterFollowers.HtmlAdapter({days:31});
        this.twitterFollowersFileAdapter = new TwitterFollowers.FileAdapter();
        this.channelsFileAdapter = new Channels.FileAdapter();
    }

    async execute() {
        LOG_EVENT(true);
        await Promise.all([
            this.updateFollowersTrendsList(),
        ]).catch(log);
    }

    async updateFollowersTrendsList() {
        const channels = await this.channelsFileAdapter.getChannels();
    	const trendsList = await this.twitterFollowersHtmlAdapter.getTrendsList(channels,{includesLatest:true});
        LOG_EVENT(trendsList.length);

        // Saving...
        await this.twitterFollowersFileAdapter.updateTrendsList(
            trendsList
        );
    }
}
assign(module.exports,{TwitterCron});
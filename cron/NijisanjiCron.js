const {Cron} = require('./CommonCron');
const {NijisanjiEvent,Channels} = require('../adapter');

// //////////////////////////////////////////////////////////////////////////////////////////////////////

class NijisanjiCron extends Cron {
    constructor(config) {
        super(config);
        this.nijisanjiEventHtmlAdapter = new NijisanjiEvent.HtmlAdapter();
        this.nijisanjiEventFileAdapter = new NijisanjiEvent.FileAdapter();
        this.channelsFileAdapter = new Channels.FileAdapter();
    }

    async execute() {
        LOG_EVENT(true);
        await Promise.all([
            this.updateEventTrendsList(),
        ]).catch(log);
    }

    async updateEventTrendsList() {
        const channels = await this.channelsFileAdapter.getChannels();
    	const trendsList = await this.nijisanjiEventHtmlAdapter.getTrendsList(channels);
        LOG_EVENT(trendsList.length);
        await this.nijisanjiEventFileAdapter.updateTrendsList(
            trendsList
        );
    }
}
assign(module.exports,{NijisanjiCron});

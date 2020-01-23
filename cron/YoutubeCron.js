const {Cron} = require('./CommonCron');
const {
    Channels,
    YoutubeLiveView,YoutubeSubscribers,YoutubeVideoView,YoutubeTotalVideoView,
    YoutubeSuperChat,
} = require('../adapter');

// //////////////////////////////////////////////////////////////////////////////////////////////////////

class YoutubeCron extends Cron {
    constructor(config) {
        super(config);
        this.channelsFileAdapter = new Channels.FileAdapter();

        this.youtubeSubscribersJsonAdapter = new YoutubeSubscribers.JsonAdapter({days:30});
        this.youtubeSubscribersFileAdapter = new YoutubeSubscribers.FileAdapter();

        this.youtubeLiveViewJsonAdapter    = new YoutubeLiveView.JsonAdapter({days:30});
        this.youtubeLiveViewFileAdapter    = new YoutubeLiveView.FileAdapter();

        this.youtubeLiveViewJsonAdapter2    = new YoutubeLiveView.JsonAdapter({days:360});
        this.youtubeLiveViewFileAdapter2    = new YoutubeLiveView.FileAdapter2();

        this.youtubeVideoViewJsonAdapter   = new YoutubeVideoView.JsonAdapter({days:30});
        this.youtubeVideoViewFileAdapter   = new YoutubeVideoView.FileAdapter();

        this.youtubeTotalVideoViewJsonAdapter = new YoutubeTotalVideoView.JsonAdapter({days:30});
        this.youtubeTotalVideoViewFileAdapter = new YoutubeTotalVideoView.FileAdapter();

        this.youtubeSuperChatJsonAdapter = new YoutubeSuperChat.JsonAdapter();
        this.youtubeSuperChatFileAdapter = new YoutubeSuperChat.FileAdapter();
    }

    async execute() {
        LOG_EVENT(true);
        await Promise.all([
            this.updateVideoViewTrendsList(),
            this.updateLiveViewTrendsList(),
            this.updateTotalVideoViewTrendsList(),
            this.updateSubscribersTrendsList(),
            this.updateSuperChatTrendsList(),
        ]).catch(log);
    }

    async execute2() {
        LOG_EVENT(true);
        await this.updateLiveViewTrendsList2();
    }

    async updateSuperChatTrendsList() {
        const oldTrends = await this.youtubeSuperChatFileAdapter.getTrends();
        const trends = await this.youtubeSuperChatJsonAdapter.getTrends({oldTrends});
        LOG_EVENT(trends.trends.length);
        await this.youtubeSuperChatFileAdapter.updateTrends(trends);
    }

    async updateTotalVideoViewTrendsList() {
        const channels = await this.channelsFileAdapter.getChannels();
    	const trendsList = await this.youtubeTotalVideoViewJsonAdapter.getTrendsList(channels,{includesLatest:true});
        LOG_EVENT(trendsList.length);
        await this.youtubeTotalVideoViewFileAdapter.updateTrendsList(trendsList);
    }

    async updateVideoViewTrendsList() {
        const channels = await this.channelsFileAdapter.getChannels();
    	const trendsList = await this.youtubeVideoViewJsonAdapter.getTrendsList(channels);
        LOG_EVENT(trendsList.length);
        await this.youtubeVideoViewFileAdapter.updateTrendsList(trendsList);
    }

    async updateLiveViewTrendsList() {
        const channels = await this.channelsFileAdapter.getChannels();
    	const trendsList = await this.youtubeLiveViewJsonAdapter.getTrendsList(channels);
        LOG_EVENT(trendsList.length);
        await this.youtubeLiveViewFileAdapter.updateTrendsList(trendsList);
    }

    async updateLiveViewTrendsList2() {
        const channels = await this.channelsFileAdapter.getChannels();
    	const trendsList = await this.youtubeLiveViewJsonAdapter2.getTrendsList(channels);
        LOG_EVENT(trendsList.length);
        await this.youtubeLiveViewFileAdapter2.updateTrendsList(trendsList);
    }

    async updateSubscribersTrendsList() {
        const channels = await this.channelsFileAdapter.getChannels();
    	const trendsList = await this.youtubeSubscribersJsonAdapter.getTrendsList(channels,{includesLatest:true});
        LOG_EVENT(trendsList.length);
        await this.youtubeSubscribersFileAdapter.updateTrendsList(trendsList);
    }
}
assign(module.exports,{YoutubeCron});
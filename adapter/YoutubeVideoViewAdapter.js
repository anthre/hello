const dateformat = require('dateformat');
const {RetryStrategies} = require('requestretry');

const {JsonAdapter,HtmlAdapter,FileAdapter,randomSleep} = require('./CommonAdapter');
const {TrendsList,Trends} = require('../model');
const {convertToDates,translateToNumber} = require('../util');

// //////////////////////////////////////////////////////////////////////////////////////////////////////

class YoutubeVideoViewJsonAdapter extends JsonAdapter {

    async getTrendsList(channels, config={}) {
        const trendsList = [];

        for (const channel of channels) {
            await randomSleep(3, false);

            const trends = await this.getTrends(channel,config);
            trendsList.push(trends);
            LOG_EVENT(trends.name, trends.trends[trends.trends.length-1]);
        }
        return Object.assign(new TrendsList(...trendsList),config);
    }

    // //////////////////////////////////////////////////////////////////////////////////////////////////

    async getTrends(channel={}, config={}) {
        const {channelId} = channel;
        const {days,lastDate} = Object.assign({},this,config);

        const trends = await this.request({
            method: 'GET',
            uri: CONFIG.YoutubeVideoViewJsonAdapter.getTrends.uri({channelId}),
        }).then((body)=>{
            try {
                body = JSON.parse(body);
            } catch(e) {
                LOG_EVENT(body);
                throw e;
            }
            const dom = (body.retData ? body.retData.dom : '');
            const trends = (dom.match(/<li class="video-item">.+?<\/li>/g)||[]).map((item)=>(
                item.match(/.+\/youtube\/video-analytics\/(.+?)">(.+?)<\/a>.+"subtitle">(.+?) Views · (.+?) Published.+/)
            )).map((matched)=>{
                return {
                    video_id: matched[1],
                    title   : matched[2],
                    value   : translateToNumber(matched[3]),
                    date    : matched[4],
                    source  : CONFIG.YoutubeVideoViewJsonAdapter.getTrends.source({channelId}),
                };
            });
            return trends;
        });
        return new Trends(Object.assign({},channel,{trends},config))
            .filterTrendsByDate({days,lastDate})
            .sortTrends();
    }
}
assign(module.exports,{YoutubeVideoViewJsonAdapter});

// //////////////////////////////////////////////////////////////////////////////////////////////////////

class YoutubeVideoViewFileAdapter extends FileAdapter {
    constructor() {
        super();
        this.path = './docs/json/YoutubeVideoViewTrendsList.json';
    }

    // //////////////////////////////////////////////////////////////////////////////////////////////////

    async updateTrendsList(trendsList) {
        await this.save({data:trendsList});
    }

    async getTrendsList() {
        const [data,status] = await Promise.all([
            this.load(),
            this.getStatus(),
        ]);
        const trendsList = new TrendsList(...JSON.parse(data||'[]'));
        Object.assign(trendsList,status);
        return trendsList;
    }
}
assign(module.exports,{YoutubeVideoViewFileAdapter});

// //////////////////////////////////////////////////////////////////////////////////////////////////////

assign(module.exports,{
    YoutubeVideoView: {
        JsonAdapter: YoutubeVideoViewJsonAdapter,
        FileAdapter: YoutubeVideoViewFileAdapter,
    },
});

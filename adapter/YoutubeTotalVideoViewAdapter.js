const dateformat = require('dateformat');
const {RetryStrategies} = require('requestretry');

const {JsonAdapter,HtmlAdapter,FileAdapter} = require('./CommonAdapter');
const {TrendsList,Trends} = require('../model');

// //////////////////////////////////////////////////////////////////////////////////////////////////////

class YoutubeTotalVideoViewJsonAdapter extends JsonAdapter {

    async getTrendsList(channels, config={}) {
        const trendsList = [];

        for (const channel of channels) {
            await randomSleep(3,false);

            const trends = await this.getTrends(channel,config);
            trendsList.push(trends);
            LOG_EVENT(trends.name,trends.latest);
        }
        return new TrendsList(...trendsList);
    }

    // //////////////////////////////////////////////////////////////////////////////////////////////////

    async getTrends(channel={}, config={}) {
        const {channelId} = channel;
        const {days,lastDate,includesLatest} = Object.assign({},this,config);

        const trends = await this.request({
            method: 'GET',
            uri: CONFIG.YoutubeTotalVideoViewJsonAdapter.getTrends.uri({channelId}),
        }).then((body)=>{
            try {
                body = JSON.parse(body);
            } catch(e) {
                LOG_EVENT(body);
                throw e;
            }
            const trends = (body.retData?body.retData.history:[]).map((trend)=>{
                trend.source = CONFIG.YoutubeTotalVideoViewJsonAdapter.getTrends.source({channelId});
                return trend;
            });
            return trends;
        });

        if (includesLatest) {
            // Fetching & Adding...
            const {latest} = await this.getLatestTrend(channel);
            return new Trends(Object.assign({},channel,{trends,latest},config))
                .filterTrendsByDate({days,lastDate});
        }

        return new Trends(Object.assign({},channel,{trends},config))
            .filterTrendsByDate({days,lastDate});
    }

    // //////////////////////////////////////////////////////////////////////////////////////////////////

    async getLatestTrend(channel={}) {
        const {channelId} = channel;

        const latest = await this.request({
            method: 'GET',
            uri: CONFIG.YoutubeTotalVideoViewJsonAdapter.getLatestTrend.uri({channelId}),
        }).then((body)=>{
            try {
                body = JSON.parse(body);
            } catch(e) {
                LOG_EVENT(body);
                throw e;
            }
            const latest = {
                value   : (body.items[0].statistics.viewCount  || NaN),
                count   : (body.items[0].statistics.videoCount || NaN),
                date    : dateformat(new Date(), 'yyyy-mm-dd'),
            };
            return latest;
        });
        return new Trends(Object.assign({},channel,{latest}));
    }

    // //////////////////////////////////////////////////////////////////////////////////////////////////

    async getLatestTrend2(channel={}) {
        const {channelId} = channel;

        const latest = await this.request({
            method: 'GET',
            uri: CONFIG.YoutubeTotalVideoViewJsonAdapter.getLatestTrend2.uri({channelId}),
        }).then((body)=>{
            const matched = body.match(/視聴回数 ([0-9,]+)回/);
            const latest = {
                value   : ((matched&&matched[1].replace(/,/,''))  || NaN),
                count   : NaN,
                date    : dateformat(new Date(), 'yyyy-mm-dd'),
            };
            return latest;
        });
        return new Trends(Object.assign({},channel,{latest}));
    }
}
assign(module.exports,{YoutubeTotalVideoViewJsonAdapter});

// //////////////////////////////////////////////////////////////////////////////////////////////////////

class YoutubeTotalVideoViewFileAdapter extends FileAdapter {
    constructor() {
        super({
            path: './docs/json/YoutubeTotalVideoViewTrendsList.json',
        });
    }

    async updateTrendsList(trendsList) {
        await super.save({ data: trendsList });
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
assign(module.exports,{YoutubeTotalVideoViewFileAdapter});

// //////////////////////////////////////////////////////////////////////////////////////////////////////

assign(module.exports,{ 
    YoutubeTotalVideoView: {
        JsonAdapter: YoutubeTotalVideoViewJsonAdapter,
        FileAdapter: YoutubeTotalVideoViewFileAdapter,
    },
});
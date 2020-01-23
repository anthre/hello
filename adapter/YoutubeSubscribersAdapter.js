const dateformat = require('dateformat');
const {RetryStrategies} = require('requestretry');

const {JsonAdapter,HtmlAdapter,FileAdapter,randomSleep} = require('./CommonAdapter');
const {
    YoutubeLiveViewTrendsList,YoutubeLiveViewTrends,
    TrendsList,Trends,
} = require('../model');
const {convertToDates} = require('../util');

// //////////////////////////////////////////////////////////////////////////////////////////////////////

class YoutubeSubscribersJsonAdapter extends JsonAdapter {

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
            uri: CONFIG.YoutubeSubscribersJsonAdapter.getTrends.uri({channelId}),
        }).then((body)=>{
            try {
                body = JSON.parse(body);
            } catch(e) {
                LOG_EVENT(body);
                throw e;
            }
            const trends = (body.retData?body.retData.history:[]).map((trend)=>{
                trend.source = CONFIG.YoutubeSubscribersJsonAdapter.getTrends.source({channelId});
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

        const retryStrategy = (error,res,body)=>{
            if (RetryStrategies.HTTPOrNetworkError(error,res)) {
                return true;
            }
            try {
                body = JSON.parse(body);
                if (!(body && body.message && body.message==='SUCCESS' && body.retData>0)) {
                    RECORD_EVENT(body);
                    return true;
                }
            } catch(e) {
                RECORD_EVENT(body);
                return true;
            };
            return false;
        };

        const latest = await this.request({
            method: 'GET',
            uri: CONFIG.YoutubeSubscribersJsonAdapter.getLatestTrend.uri({channelId}),
            retryStrategy,
        }).then((body)=>{
            const data = JSON.parse(body);
            const latest = {
                value   : (data.retData || NaN),
                date    : dateformat(new Date(), 'yyyy-mm-dd'),
            };
            return latest;
        });
        return new Trends(Object.assign({},channel,{latest}));
    }

    // //////////////////////////////////////////////////////////////////////////////////////////////////

//     async getLatestTrend2(channel={}) {
//         const {channelId} = channel;

//         const latest = await this.request({
//             method  : 'GET',
//             uri     : CONFIG.YoutubeSubscribersJsonAdapter.getLatestTrend2.uri({channelId}),
//             headers : [],
//         }).then((body)=>{
//             try {
//                 body = JSON.parse(body);
//             } catch(e) {
//                 LOG_EVENT(body);
//                 throw e;
//             }
//             const latest = {
//                 value   : (body[0] || NaN),
//                 date    : dateformat(new Date(), 'yyyy-mm-dd'),
//             };
//             return latest;
//         });
//         return new Trends(Object.assign({},channel,{latest}));
//     }
}
assign(module.exports,{YoutubeSubscribersJsonAdapter});

// //////////////////////////////////////////////////////////////////////////////////////////////////////

class YoutubeSubscribersFileAdapter extends FileAdapter {
    constructor() {
        super();
        this.path = './docs/json/YoutubeSubscribersTrendsList.json';
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
assign(module.exports,{YoutubeSubscribersFileAdapter});

// //////////////////////////////////////////////////////////////////////////////////////////////////////

assign(module.exports,{
    YoutubeSubscribers: {
        JsonAdapter: YoutubeSubscribersJsonAdapter,
        FileAdapter: YoutubeSubscribersFileAdapter,
    },
});

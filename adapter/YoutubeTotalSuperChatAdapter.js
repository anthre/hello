const dateformat = require('dateformat');
const {RetryStrategies} = require('requestretry');

const {HtmlAdapter,FileAdapter} = require('./CommonAdapter');
const {TrendsList,Trends} = require('../model');

// //////////////////////////////////////////////////////////////////////////////////////////////////////

class YoutubeTotalSuperChatHtmlAdapter extends HtmlAdapter {
    async getTrendsList(channels, config={}) {
        const trendsList = [];

        for (const channel of channels) {
            const trends = await this.getTrends(channel,config);
            trendsList.push(trends);
            LOG_EVENT(trends.name,trends.latest);
        }
        return new TrendsList(...trendsList);
    }
}
assign(module.exports,{YoutubeTotalSuperChatHtmlAdapter});

// //////////////////////////////////////////////////////////////////////////////////////////////////////

class YoutubeTotalSuperChatFileAdapter extends FileAdapter {
    constructor() {
        super({
            path: './docs/json/YoutubeTotalSuperChatTrendsList.json',
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
assign(module.exports,{YoutubeTotalSuperChatFileAdapter});

// //////////////////////////////////////////////////////////////////////////////////////////////////////

assign(module.exports,{ 
    YoutubeTotalSuperChat: {
        HtmlAdapter: YoutubeTotalSuperChatHtmlAdapter,
        FileAdapter: YoutubeTotalSuperChatFileAdapter,
    },
});
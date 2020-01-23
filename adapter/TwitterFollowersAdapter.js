const dateformat = require('dateformat');
const {RetryStrategies} = require('requestretry');

const {HtmlAdapter,FileAdapter} = require('./CommonAdapter');
const {TrendsList,Trends} = require('../model');

// //////////////////////////////////////////////////////////////////////////////////////////////////////

class TwitterFollowersHtmlAdapter extends HtmlAdapter {
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
        const {twitterId} = channel;
        const {days,lastDate,includesLatest} = Object.assign({},this,config);

        const trends = await this.request({
            uri: CONFIG.TwitterFollowersHtmlAdapter.getTrends.uri({twitterId}),
        }).then((body)=>{
            // Scraping...
            const childNodesA = body.childNodes.filterAll( 
                (childNode)=>(childNode.rawAttrs && childNode.rawAttrs.includes('style="width: 150px; float: left;"')) 
            );
            const childNodesB = body.childNodes.filterAll( 
                (childNode)=>(childNode.rawAttrs && childNode.rawAttrs.includes('float: left; width: 85px;')) 
            );

            const trends = new Array(childNodesA.length).fill().map((v,index)=>{
                return {
                    value   : Number( childNodesA[index].childNodes[0].rawText.replace(/,/g,'') ),
                    date    : childNodesB[index].childNodes[0].rawText,
                };
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
        const {twitterId} = channel;

        const retryStrategy = (error,res,body)=>{
            if (RetryStrategies.HTTPOrNetworkError(error,res)) {
                return true;
            }
            if (!(body && Number(body)>0)) {
                RECORD_EVENT(body);
                return true;
            }
            return false;
        };

        const latest = await this.request({
            uri: CONFIG.TwitterFollowersHtmlAdapter.getLatestTrend.uri({twitterId}),
            retryStrategy,
        }).then((body)=>{
            const value = Number(body);
            RECORD_EVENT(!(value>0), body);
            return {
                value,
                date: dateformat(new Date(), 'yyyy-mm-dd'),
            };
        });
        return new Trends(Object.assign({},channel,{latest}));
    }
}
assign(module.exports,{TwitterFollowersHtmlAdapter});

// //////////////////////////////////////////////////////////////////////////////////////////////////////

class TwitterFollowersFileAdapter extends FileAdapter {
    constructor() {
        super({
            path: './docs/json/TwitterFollowersTrendsList.json',
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
assign(module.exports,{TwitterFollowersFileAdapter});

// //////////////////////////////////////////////////////////////////////////////////////////////////////

assign(module.exports,{ 
    TwitterFollowers: {
        HtmlAdapter: TwitterFollowersHtmlAdapter,
        FileAdapter: TwitterFollowersFileAdapter,
    },
});
const dateformat = require('dateformat');
const {RetryStrategies} = require('requestretry');

const {JsonAdapter,HtmlAdapter,FileAdapter} = require('./CommonAdapter');
const {TrendsList,Trends} = require('../model');
const {convertToDates} = require('../util');

// //////////////////////////////////////////////////////////////////////////////////////////////////////

class YoutubeLiveViewJsonAdapter extends JsonAdapter {

    async getTrendsList(channels=[], config={}) {
        const trendsList = [];

        for (const channel of channels) {
            // await randomSleep(3, false);
            const trends = await this.getTrends(channel,config);
            trendsList.push(trends);
            LOG_EVENT(trends.name,trends.trends[trends.trends.length-1]);
        }
        return new TrendsList(...trendsList);
    }

    // //////////////////////////////////////////////////////////////////////////////////////////////////

    async getTrends(channel={}, config={}) {
        const {streamerId} = channel;
        const {days,lastDate} = Object.assign({},this,config);

        let trends = [];
        for (const {year,month} of this.convertToYearMonthList({days,lastDate})) {
            await this.request({
                uri     : CONFIG.YoutubeLiveViewJsonAdapter.getTrends.uri(),
                json    : {
                    year,
                    month,
                    streamer_id: streamerId,
                },
            }).then((body)=>{
                trends.push(
                    ...body.history_array.map((trend)=>{
                        return Object.assign(trend, { 
                            date    : dateformat(new Date(trend.actual_start_time), "yyyy-mm-dd"),
                            source  : CONFIG.YoutubeLiveViewJsonAdapter.getTrends.source({streamerId,year,month}),
                        });
                    })
                );
            });
        }

        // //////////////////////////////////////////////////////////////////////////////////////////////

        return new Trends(Object.assign({},channel,{trends},config))
            .filterTrendsByDate({days,lastDate})
            .sortTrends();
    }

    // //////////////////////////////////////////////////////////////////////////////////////////////////

    convertToYearMonthList({days,lastDate}) {
        const yearMonthList = [];

        let year  = lastDate.getFullYear();
        let month = lastDate.getMonth()+1;

        yearMonthList.push({year,month});
        while (days >= 0) {
            days -= lastDate.getDate();
            lastDate = new Date(new Date(`${year}/${month}/1`).getTime() - 1000*60*60*24);
            month -= 1;
            if (month===0) {
                month += 12;
                year  -= 1;
            }
            yearMonthList.push({year,month});
        }
        return yearMonthList;
    }
}
assign(module.exports,{YoutubeLiveViewJsonAdapter});

// //////////////////////////////////////////////////////////////////////////////////////////////////////

class YoutubeLiveViewFileAdapter extends FileAdapter {
    constructor() {
        super();
        this.path = './docs/json/YoutubeLiveViewTrendsList.json';
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
assign(module.exports,{YoutubeLiveViewFileAdapter});


// //////////////////////////////////////////////////////////////////////////////////////////////////////

class YoutubeLiveViewFileAdapter2 extends YoutubeLiveViewFileAdapter {
    constructor() {
        super();
        this.path = './docs/json/YoutubeLiveViewTrendsList2.json';
    }
}
assign(module.exports,{YoutubeLiveViewFileAdapter2});

// //////////////////////////////////////////////////////////////////////////////////////////////////////

assign(module.exports,{
    YoutubeLiveView: {
        JsonAdapter: YoutubeLiveViewJsonAdapter,
        FileAdapter: YoutubeLiveViewFileAdapter,
        FileAdapter2: YoutubeLiveViewFileAdapter2,
    },
});

// const dateformat = require('dateformat');
// const {RetryStrategies} = require('requestretry');

// const {JsonAdapter,FileAdapter} = require('./CommonAdapter');
// const {TrendsList,Trends} = require('../model');
// const {convertToDates} = require('../util');

// // //////////////////////////////////////////////////////////////////////////////////////////////////////

// class YoutubeLiveAnalyticsJsonAdapter extends JsonAdapter {
//     async getTrendsList(trendsList=[], config={}) {
//         const {oldTrendsList} = Object.assign({
//             oldTrendsList: [],
//         },this,config);

//         for (const trends of trendsList) {
//             for (const trend of trends.trends) {
//                 if (trend.url) {
//                     const videoId = trend.url.replace(/https:\/\/www\.youtube\.com\/watch\?v=/,'');
//                 }
//             }
//         }
//     }
//     async getTrend(config={}) {
//         const {videoId} = Object.assign({},this,confi);
//         const CONFIG.YoutubeLiveAnalyticsJsonAdapter.getTrend.uri({videoId});
//     }
// }
// assign(module.exports,{YoutubeLiveAnalyticsJsonAdapter});

// // //////////////////////////////////////////////////////////////////////////////////////////////////////

// class YoutubeLiveAnalyticsFileAdapter extends FileAdapter {
//     constructor() {
//         super();
//         this.path = './docs/json/YoutubeLiveAnalyticsTrendsList.json';
//     }

//     // //////////////////////////////////////////////////////////////////////////////////////////////////

//     async updateTrendsList(trendsList) {
//         await this.save({data:trendsList});
//     }

//     async getTrendsList() {
//         const [data,status] = await Promise.all([
//             this.load(),
//             this.getStatus(),
//         ]);
//         const trendsList = new TrendsList(...JSON.parse(data||'[]'));
//         Object.assign(trendsList,status);
//         return trendsList;
//     }
// }
// assign(module.exports,{YoutubeLiveAnalyticsFileAdapter});

// // //////////////////////////////////////////////////////////////////////////////////////////////////////

// assign(module.exports,{
//     YoutubeLiveAnalytics: {
//         JsonAdapter: YoutubeLiveAnalyticsJsonAdapter,
//         FileAdapter: YoutubeLiveAnalyticsFileAdapter,
//     },
// });

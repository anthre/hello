const dateformat = require('dateformat');
const {RetryStrategies} = require('requestretry');

const {JsonAdapter,HtmlAdapter,FileAdapter,randomSleep} = require('./CommonAdapter');
const {TrendsList,Trends,Trend} = require('../model');

// //////////////////////////////////////////////////////////////////////////////////////////////////////

class YoutubeSuperChatJsonAdapter extends JsonAdapter {
    async getTrends(config={}) {
        const {oldTrends} = Object.assign({},config);
        const items = oldTrends.trends;
        let lastItem;

        items.forEach((item)=>{
            item.name = item.name.replace('･','・');
        });

        const retryStrategy = (error,res,body)=>{
            if (RetryStrategies.HTTPOrNetworkError(error,res)) {
                return true;
            }
            if (!(body && body.includes('スパチャ'))) {
                RECORD_EVENT(body);
                return true;
            }
            return false;
        };

        while(true) {
            const newItems = await this.request({
                uri     : CONFIG.YoutubeSuperChatJsonAdapter.getTrends.uri()+(lastItem?`&max_id=${lastItem.id}`:''),
                method  : 'GET',
            }).then((body)=>{
                try {
                    body = JSON.parse(body);
                } catch(e) {
                    LOG_EVENT(body);
                    throw e;
                }
                return Promise.all(body.map(async(item)=>{
                    await randomSleep(200/5);

                    const id    = Number(item.id);
                    const name  = item.text.split('\n')[0].replace(/\/.+/,'').replace('･','・');
                    const date  = item.text.match(/([0-9]{4}-[0-9]{2}-[0-9]{2})/)[1];
                    const titile= item.text.split('\n')[1];
                    const text  = item.text;
                    const url   = item.entities.urls[0].expanded_url;

                    const value = await this.request({
                        uri: url,
                        method: 'GET',
                        retryStrategy,
                    }).then((body)=>{
                        const matched = body.match(/スパチャ.*約￥([0-9,]+)/);
                        const value = (matched ? Number(matched[1].replace(/,/g,'')) : 0);
                        return value;
                    });
                    return {
                        id,name,date,text,titile,url,
                        value,
                    };
                }));
            }).then((items)=>{
                return items.sort((a,b)=>(b.id-a.id));
            });

            items.push(...newItems);
            lastItem = newItems[newItems.length-1];
            LOG_EVENT(items.length, newItems.length, lastItem);
            if (newItems.length===1) {
                break;
            }
            if (items.filter((item)=>(item.text===lastItem.text)).length>1) {
                break;
            }
        }
        return new Trends({
            trends: items
                .filter((item)=>( items.find((it)=>(it.text===item.text)) === item ))
                .sort((a,b)=>(b.id-a.id)),
        });
    }
}
assign(module.exports,{YoutubeSuperChatJsonAdapter});

// //////////////////////////////////////////////////////////////////////////////////////////////////////

class YoutubeSuperChatFileAdapter extends FileAdapter {
    constructor() {
        super({
            path: './docs/json/YoutubeSuperChatTrends.json',
        });
    }

    async updateTrends(trends) {
        await super.save({data:trends.trends});
    }

    async getTrends() {
        const [data] = await Promise.all([
            this.load(),
        ]);
        const trends = new Trends({
            trends: JSON.parse(data||'[]'),
        });
        return trends;
    }

    async getTrendsList() {
        return (await this.getTrends()).toTrendsList().sortTrends();
    }
}
assign(module.exports,{YoutubeSuperChatFileAdapter});

// //////////////////////////////////////////////////////////////////////////////////////////////////////

assign(module.exports,{ 
    YoutubeSuperChat: {
        JsonAdapter: YoutubeSuperChatJsonAdapter,
        FileAdapter: YoutubeSuperChatFileAdapter,
    },
});
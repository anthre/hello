const dateformat = require('dateformat');
const {RetryStrategies} = require('requestretry');
const {cloneDeep} = require('lodash');

const {HtmlAdapter,FileAdapter} = require('./CommonAdapter');
const {TrendsList,Trends} = require('../model');

// //////////////////////////////////////////////////////////////////////////////////////////////////////

class NijisanjiEventHtmlAdapter extends HtmlAdapter {
    async getTrendsList(channels=[], config={}) {
        const trendsList = cloneDeep(channels);

        await this.request({
            url:"https://wikiwiki.jp/nijisanji/%E3%82%A4%E3%83%99%E3%83%B3%E3%83%88%E3%83%BB%E5%A4%A7%E4%BC%9A%E3%83%BB%E7%89%B9%E7%95%AA%E7%AD%89",
        }).then((body)=>{
            const trs = body.childNodes.filterAll((node)=>(
                (node.tagName==='tr') && (node.childNodes.length>1) && 
                node.childNodes[0].rawAttrs && node.childNodes[0].rawAttrs.match(/class="style_td"/)
            ));
            const tdsList = trs.map((tr)=>(
                tr.childNodes.reduce((all,td)=>all.concat(td.childNodes),[]).filter((td)=>(td.rawText)).map((td)=>(td.rawText))
            )).map((tds,index,tdsList2)=>{
                if (tds[0].match(/^[0-9\/]+~$/)) {
                    tds[0] += tds[1];
                    tds.splice(1,1);
                }
                if (!tds[0].match(/^[0-9\/]+/)) {
                    tds.splice(0,0,tdsList2[index-1][0]);
                }
                return tds.filter((td)=>(!td.match(/^\*/))).reduce((all,td)=>all.concat(...td.split(/，|, /)),[]);
            }).filter((tds)=>(
                !tds.find((td)=>(td.match(/中止/)))
            ));
            trendsList.forEach((trends)=>{
                const samples = tdsList.filter((tds)=>tds.find((td)=>(td.includes(trends.name)))).map((tds)=>({
                    title: tds.join(' '),
                }));
                trends.latest = {
                    value: samples.length,
                    samples,
                };
            });
        });
        
        return new TrendsList(...trendsList);
    }
}
assign(module.exports,{NijisanjiEventHtmlAdapter});

// //////////////////////////////////////////////////////////////////////////////////////////////////////

class NijisanjiEventFileAdapter extends FileAdapter {
    constructor() {
        super({
            path: './docs/json/NijisanjiEventTrendsList.json',
        });
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
assign(module.exports,{NijisanjiEventFileAdapter});

// //////////////////////////////////////////////////////////////////////////////////////////////////////

assign(module.exports,{ 
    NijisanjiEvent: {
        HtmlAdapter: NijisanjiEventHtmlAdapter,
        FileAdapter: NijisanjiEventFileAdapter,
    },
});

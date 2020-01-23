const cloneDeep = require('lodash/cloneDeep');
const {Channel} = require('./ChannelsModel');
const {convertToDates,getDays} = require('../util/CommonUtil');

// //////////////////////////////////////////////////////////////////////////////////////////////////////

class Trend {
    constructor(config={}) {
        const time = (
            (config.actual_start_time && config.actual_end_time) ?
            (config.actual_end_time - config.actual_start_time) :
            undefined
        );

        Object.assign(this, {
            id      : config.id,
            value   : Math.round(config.value || config.max_viewers || 0),
            count   : config.count,
            buff    : config.buff,
            buffDays: config.buffDays,
            date    : config.date,
            rank    : config.rank,
            title   : (config.title || (config.text && config.text.split('\n')[1])),
            text    : config.text,
            name    : config.name,
            time    : ((config.time!==undefined)?config.time:time),
            url     : (config.url || (config.video_id && `https://www.youtube.com/watch?v=${config.video_id}`)),
            source  : config.source,
            samples : (config.samples || []),
            startedDate : new Date(config.startedDate||config.actual_start_time),
        });
    }
}
assign(module.exports,{Trend});

// //////////////////////////////////////////////////////////////////////////////////////////////////////

class Trends extends Channel {
    constructor(config={}) {
        super(config);

        Object.assign(this, {
            latest          : new Trend(config.latest),
            trends          : (config.trends || [])
                .filter((trend)=>(!trend.ch_type || trend.ch_type===1))
                .map((trend)=>(new Trend(trend))),

            days            : (config.days || 30), 
            lastDate        : new Date(config.lastDate || new Date()),
            requiredTime    : 0,
        });
    }

    // //////////////////////////////////////////////////////////////////////////////////////////////////

    addTrendsAnalytics(config={}) {
        let {requiredTime,subKey} = Object.assign({},this,config);
        if (subKey==='buff') {
            subKey = 'value';
        }

        const trends = this.trends
            .filter((trend)=>(!trend.time || trend.time>=requiredTime))
            .filter((trend)=>(trend[subKey]))
            .sort((a,b)=>(b[subKey]-a[subKey]));

        this.count = trends.length;
        this.sum = {
            [subKey]: trends.reduce((all,trend)=>(all+trend[subKey]), 0),
            samples : trends.slice(0,3),
        };

        this.avg = {
            [subKey]: (trends.length?(this.sum[subKey]/trends.length):0),
        };
        const avgTrends = trends.concat([]).sort((a,b)=>(
            Math.abs(a[subKey]-this.avg[subKey]) - Math.abs(b[subKey]-this.avg[subKey])
        ));
        this.avg.samples = avgTrends.slice(0,3).sort((a,b)=>(b[subKey]-a[subKey]));

        this.max = {
            [subKey]: (trends.length?trends[0][subKey]:0),
            samples : trends.slice(0,3),
        };
        this.min = {
            [subKey]: (trends.length?trends[trends.length-1][subKey]:0),
            samples : trends.slice(Math.max(trends.length-3,0),trends.length),
        };
        this.med = {
            [subKey]: (trends.length?(
                (trends.length%2)?trends[Math.ceil(trends.length/2-1)][subKey]:Math.round(
                    (trends[Math.ceil(trends.length/2-1)][subKey] + trends[Math.ceil(trends.length/2)][subKey]) / 2
                )
            ):0),
            samples : trends.slice(
                Math.max(Math.ceil(trends.length/2-1)-1,0),
                Math.ceil(trends.length/2-1)+2
            ),
        };
        if (this.latest) {
            this.latest.avg = (this.latest.count?(this.latest.value/this.latest.count):0);
            this.latest.samples = this.latest.samples||[];
        }

        return this;
    }

    // //////////////////////////////////////////////////////////////////////////////////////////////////

    addTrendsBuff() {
        for (let i=0; i<this.trends.length; i++) {
            if (i===0) {
                this.trends[i].sum = this.trends[i].value;
            }
            if (i>0) {
                this.trends[i].buff = (this.trends[i].value - this.trends[i-1].value);
                this.trends[i].sum = (this.trends[i].value + this.trends[i-1].sum);
            }
        }
        if (this.trends.length) {
            if (this.latest) {
                this.latest.buff = (this.latest.value - this.trends[this.trends.length-1].value);
                this.latest.buffDays = getDays(this.latest.date, this.trends[this.trends.length-1].date);
                this.latest.sum = this.trends[this.trends.length-1].sum;
            }
            if (this.sum) {
                // this.sum.buff = (this.trends[this.trends.length-1].value - this.trends[0].value);
                // this.sum.buffDays = getDays(this.trends[this.trends.length-1].date, this.trends[0].date);
                this.sum.buff = (this.latest.value - this.trends[0].value);
                this.sum.buffDays = getDays(this.latest.date, this.trends[0].date);
            }
        }
        return this;
    }

    // //////////////////////////////////////////////////////////////////////////////////////////////////

    adoptMaxTrendsPerDate(config={}) {
        let {subKey} = Object.assign({subKey:'value'},this,config);
        if (subKey==='buff') {
            subKey = 'value';
        }

        const dates = this.trends.map((trend)=>(trend.date))
            .filter((date,index,all)=>(all.indexOf(date)===index));

        const maxTrends = [];
        for (const date of dates) {
            const sameTrends = this.trends.filter((trend)=>{
                return (trend.date === date);
            });
            maxTrends.push(
                sameTrends.find(
                    (sameTrend)=>{ 
                        return sameTrend[subKey]===Math.max(...sameTrends.map( (ttt)=>(ttt[subKey]) ));
                    }
                )
            );
        }
        this.trends = maxTrends;
        return this;
    }

    // //////////////////////////////////////////////////////////////////////////////////////////////////

    adoptSumTrendsPerDate(config={}) {
        let {subKey} = Object.assign({subKey:'value'},this,config);
        if (subKey==='buff') {
            subKey = 'value';
        }

        const dates = this.trends.map((trend)=>(trend.date))
            .filter((date,index,all)=>(all.indexOf(date)===index));

        const sumTrends = [];
        for (const date of dates) {
            const sameTrends = this.trends.filter((trend)=>{
                return (trend.date === date);
            });
            sumTrends.push(
                sameTrends.reduce((all,trend)=>(
                    Object.assign(all, {
                        title   : all.title.concat(trend.title),
                        url     : all.url.concat(trend.url),
                        value   : (all.value+trend.value),
                    })
                ),new Trend(Object.assign({}, sameTrends[0], {title:[],url:[],value:0}))),
            );
        }
        this.trends = sumTrends;
        return this;
    }

    // //////////////////////////////////////////////////////////////////////////////////////////////////

    adjustTrendsByDate(config={}) {
        const {days,lastDate} = Object.assign({}, this, config);

        for (const date of convertToDates({days,lastDate})) {
            if ( !this.trends.find((trend)=>(trend && trend.date &&trend.date===date)) ) {
                this.trends.push(new Trend({
                    date,
                    time:0,
                    value:0,
                }));
            }
        }
        return this.sortTrends();
    }

    // //////////////////////////////////////////////////////////////////////////////////////////////////

    filterTrendsByDate(config={}) {
        const {days,lastDate} = Object.assign({}, this, config);
        const dates = convertToDates({days,lastDate});

        this.trends = this.trends.filter((trend)=>{
            return dates.includes(trend.date);
        });
        return this;
    }

    // //////////////////////////////////////////////////////////////////////////////////////////////////

    filterTrendsByTime(config={}) {
        const {requiredTime} = Object.assign({}, this, config);

        this.trends = this.trends.filter((trend)=>{
            return (trend.time >= requiredTime);
        });
        return this;
    }

    // //////////////////////////////////////////////////////////////////////////////////////////////////

    sortTrends() {
        this.trends = this.trends.sort((a,b)=>{
            return (new Date(a.date).getTime() - new Date(b.date).getTime());
        });
        return this;
    }

    // //////////////////////////////////////////////////////////////////////////////////////////////////

    toTrendsList() {
        const trendsList = [];
        const names = this.trends.map((trend)=>(trend.name)).filter((name,index,names)=>(names.indexOf(name)===index));
        names.forEach((name)=>{
            trendsList.push({
                name,
                trends: this.trends.filter((trend)=>(trend.name===name)),
            });
        });
        return new TrendsList(...trendsList);
    }
}
assign(module.exports,{Trends});

// //////////////////////////////////////////////////////////////////////////////////////////////////////

class TrendsList extends Array {
    constructor(...configs) {
        super(...configs);

        for (let index=0; index <= this.length-1; index++) {
            this[index] = new Trends(this[index]);
        }

        Object.assign(this, {
            days            : ((configs[0] && configs[0].days) || 30), 
            lastDate        : new Date((configs[0] && configs[0].lastDate) || new Date()),
            requiredCount   : ((configs[0] && configs[0].requiredCount) || 0),
            requiredTime    : ((configs[0] && configs[0].requiredTime) || 0),
        });
    }

    // //////////////////////////////////////////////////////////////////////////////////////////////////

    addTrendsBuff() {
        for (let index=0; index <= this.length-1; index++) {
            this[index].addTrendsBuff();
        }
        return this;
    }

    // //////////////////////////////////////////////////////////////////////////////////////////////////

    addPastRank(config={}) {
        const {requiredCount,requiredTime,key,subKey} = Object.assign({
            key     :'latest',
            subKey  :'value',
        }, this, config);

        const pastTrendsList = new TrendsList(...cloneDeep(this));
        pastTrendsList.forEach((pastTrends)=>{
            const latestTrend = pastTrends.trends[pastTrends.trends.length-1];
            pastTrends.latest = latestTrend;
            pastTrends.trends = pastTrends.trends.filter((trend)=>(trend.date!==latestTrend.date));
        });
        pastTrendsList.addTrendsAnalytics({subKey});
        pastTrendsList.rank({key,subKey,requiredCount,requiredTime});
        console.log({pastTrendsList});

        for (let index=0; index <= this.length-1; index++) {
            this[index][key].pastRank = pastTrendsList.find((pastTrends)=>(pastTrends.name===this[index].name))[key].rank;
        }
        return this;
    }

    // //////////////////////////////////////////////////////////////////////////////////////////////////

    addTrendsAnalytics(config={}) {
        for (let index=0; index <= this.length-1; index++) {
            this[index].addTrendsAnalytics(config);
        }
        return this;
    }

    // //////////////////////////////////////////////////////////////////////////////////////////////////

    adoptMaxTrendsPerDate(config={}) {
        for (let index=0; index <= this.length-1; index++) {
            this[index].adoptMaxTrendsPerDate(config);
        }
        return this;
    }

    // //////////////////////////////////////////////////////////////////////////////////////////////////

    adoptSumTrendsPerDate(config={}) {
        for (let index=0; index <= this.length-1; index++) {
            this[index].adoptSumTrendsPerDate(config);
        }
        return this;
    }

    // //////////////////////////////////////////////////////////////////////////////////////////////////

    adjustTrendsByDate(config={}) {
        const {days,lastDate} = Object.assign({},this,config);

        for (let index=0; index <= this.length-1; index++) {
            this[index].adjustTrendsByDate({ days, lastDate });
            this[index].sortTrends();
        }
        return this;
    }

    // //////////////////////////////////////////////////////////////////////////////////////////////////

    adjustTrendsByDate2(config={}) {
        const oldFollowersTrendsList = this.filter((followersTrends)=>{
            return ( followersTrends.trends.length >= Math.max( ...this.map((fff)=>(fff.trends.length)) )-1 );
        });

        for (let index=0; index <= this.length-1; index++) {
            this[index].trends = this[index].trends.filter((trend)=>{
                const isNotItemHadByAtLeastOneChannel = oldFollowersTrendsList.find((fff)=>{ 
                    return !fff.trends.find((tr)=>(tr.date===trend.date));
                });
                return !isNotItemHadByAtLeastOneChannel;
            });
        }

        const maxFollowersTrends = this.find((followersTrends)=>{
            return ( followersTrends.trends.length === Math.max( ...this.map((fff)=>(fff.trends.length)) ) );
        });

        for (let index=0; index <= this.length-1; index++) {
            if (this[index].trends.length < maxFollowersTrends.trends.length) {
                this[index].trends = maxFollowersTrends.trends.map((maxTrend)=>{
                    const sameTrend = this[index].trends.find((tr)=>(tr.date === maxTrend.date));
                    if (sameTrend) {
                        return sameTrend;
                    } else {
                        return Object.assign({}, maxTrend, {value:0,time:0});
                    }
                });
            }
        }

        while (this.filter((trends)=>(trends.trends.find((trend)=>(trend.value)))).find((trends)=>(trends.trends[trends.trends.length-1].value===0))) {
            this.forEach((trends)=>{
                trends.trends.pop();
            });
        }

        return this;
    }

    // //////////////////////////////////////////////////////////////////////////////////////////////////
 
    filterTrendsByDate(config={}) {
        const {days,lastDate} = Object.assign({},this,config);

        for (let index=0; index <= this.length-1; index++) {
            this[index].filterTrendsByDate({days,lastDate});
        }
        return this;
    }

    // //////////////////////////////////////////////////////////////////////////////////////////////////
 
    filterTrendsByTime(config={}) {
        const {requiredTime} = Object.assign({},this,config);

        for (let index=0; index <= this.length-1; index++) {
            this[index].filterTrendsByTime({requiredTime});
        }
        return this;
    }

    // //////////////////////////////////////////////////////////////////////////////////////////////////

    rank(config={}) {
        const {requiredTime,requiredCount,key,subKey} = Object.assign({
            key     :'latest',
            subKey  :'value',
        }, this, config);

        this.addTrendsAnalytics({requiredTime,subKey});
        this.addTrendsBuff();

        this.reduce((all,trends)=>{
            all[
                // SEPARATING BY REQUIRED_COUNT...
                (trends.count>=requiredCount) ? 0 : 1
            ].push(trends);
            return all;
        }, [[],[]]).reduce((all,trendsList)=>{
            trendsList.sort((a,b)=>{
                // SORTING...
                return (b[key][subKey] - a[key][subKey]);
            });
            trendsList.forEach((trends)=>{
                // RANKING BY MIN...
                trends[key].rank = (
                    // SEPARATING BY REQUIRED_COUNT...
                    (trends.count>=requiredCount) 
                        ? trendsList.indexOf(trendsList.find((ttt)=>(ttt[key][subKey]===trends[key][subKey])))+1 
                        : NaN
                );
            });
            return all.concat(
                ...trendsList
            );
        }, []).forEach((trends,index)=>{
            this[index] = trends;
        });
        return this;
    }

    // //////////////////////////////////////////////////////////////////////////////////////////////////

    sortTrends() {
        for (let index=0; index <= this.length-1; index++) {
            this[index].sortTrends();
        }
        return this;
    }
}
assign(module.exports,{TrendsList});

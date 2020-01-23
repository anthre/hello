const React = require('react');
const dateformat = require('dateformat');
const cloneDeep = require('lodash/cloneDeep');

const {ChannelsAdapter,YoutubeSuperChatAdapter} = require('../util/Adapter');
const {translateNumber,getDays,RGBs} = require('../../util/CommonUtil');
const {TrendsList} = require('../../model/TrendsModel');

const {BaseChart} = require('./part/Chart');

//////////////////////////////////////////////////////////////////////////////////////////////////////

const trendsTypes = Object.freeze({
    LATEST  : 'latest',
    TOTAL   : 'total',
});

const rankKeys = Object.freeze({
    SUM: 'sum',
    MAX: 'max',
    AVG: 'avg',
    MED: 'med',
    MIN: 'min',
});

class YoutubeSuperChatTrends extends React.Component {
    constructor(props) {
        super(props);

        const {originUrl} = props;
        this.adapter = new YoutubeSuperChatAdapter({originUrl});
        this.channelsAdapter = new ChannelsAdapter({originUrl});

        this.state = {
            trendsList      : [],
            trendsListG     : [],
            updatedDate     : undefined,
            isLoading       : true,
            trendsType      : trendsTypes.LATEST,
            rankKey         : rankKeys.SUM,
            latestDays      : 30,
            totalDays       : 30,
        };
        this.trendsList = [];
    }

    componentDidMount() {
        return (async()=>{
            const channels = await this.channelsAdapter.getChannels();
            const trendsList = await this.adapter.getTrendsList();
            this.setState({updatedDate:trendsList.updatedDate});

            this.trendsList = new TrendsList(...channels.map((channel)=>{
                const sameTrends = trendsList.find((trends)=>(trends.name.replace('･','・')===channel.name.replace('･','・')));
                return Object.assign(sameTrends||{},channel);
            }));
            this.trendsList.rank({key:rankKeys.SUM}).addPastRank({key:rankKeys.SUM});
            console.log({trendsList:this.trendsList});

            const dates = this.trendsList
                .filter((trends)=>(trends.trends.length))
                .map((trends)=>(trends.trends[0].date))
                .sort((a,b)=>(new Date(b).getTime()-new Date(a).getTime()));
            const totalDays = getDays(dates[dates.length-1], new Date());
            this.setState({totalDays});

            this.updateTrendsList();
            this.setState({isLoading:false});
        })();
    }

    updateTrendsList() {
        const {trendsType,rankKey,latestDays,totalDays} = this.state;

        const trendsList = cloneDeep(this.trendsList);
        if (trendsType===trendsTypes.LATEST) {
           trendsList.filterTrendsByDate({days:latestDays});
           trendsList.adjustTrendsByDate({days:latestDays});
        } else {
            trendsList.adjustTrendsByDate({days:totalDays});
        }

        const trendsListG = new TrendsList(...cloneDeep(trendsList));
        trendsListG.rank({key:rankKey}).addPastRank({key:rankKey});
        trendsListG.adoptSumTrendsPerDate();

        trendsList.rank({key:rankKey}).addPastRank({key:rankKey});
        trendsList.forEach((trends)=>{
            trends.pastRank = trends[rankKey].pastRank;
            trends.rank     = trends[rankKey].rank;
            trends.value    = translateNumber(trends[rankKey].value);
            trends.samples  = trends[rankKey].samples;
        });
        console.log({trendsList});

        this.setState({trendsList,trendsListG});
    }

    onChangeTrendsTypes(trendsType) {
        return (async()=>{
            this.setState({isLoading:true});
            await new Promise((done)=>setTimeout(done,500));

            if (trendsType===trendsTypes.LATEST) {
                this.setState({trendsType,rankKey:rankKeys.SUM,trendsList:[],trendsListG:[]});
                this.updateTrendsList();
            }
            if (trendsType===trendsTypes.TOTAL) {
                this.setState({trendsType,rankKey:rankKeys.SUM,trendsList:[],trendsListG:[]});
                this.updateTrendsList();
            }

            this.setState({isLoading:false});
        })();
    }

    onChangeRankKey(rankKey) {
        return (async()=>{
            this.setState({isLoading:true});
            await new Promise((done)=>setTimeout(done,500));

            this.setState({rankKey});
            this.updateTrendsList();

            this.setState({isLoading:false});
        })();
    }

    render () {
        const {
            trendsList,trendsListG,updatedDate,isLoading,rankKey,trendsType,
            totalDays,latestDays,
        } = this.state;

        return (
<div className={`page ${isLoading?'isLoading':''}`}>
    <div className="title">
        にじさんじ Youtubeスパチャ額
    </div>
    <div className="tips">
        <ul>
             <li>
                更新日時：{updatedDate?dateformat(updatedDate,'yyyy/mm/dd HH:MM'):''}
            </li>
        </ul>
    </div>
    <div className="content">
        <table>
            <tr>
                <th></th>
                <th></th>
                <th>配信数</th>
                <th>
                    <select 
                        defaultValue={trendsType}
                        onChange={(e)=>this.onChangeTrendsTypes(e.target.value)}
                    >
                        <option value={trendsTypes.LATEST}>{latestDays}日分</option>
                        <option value={trendsTypes.TOTAL}>{totalDays}日分</option>
                    </select>
                    <select 
                        defaultValue={rankKey}
                        onChange={(e)=>this.onChangeRankKey(e.target.value)}
                    >
                        <option value={rankKeys.SUM}>合計値</option>
                        <option value={rankKeys.MAX}>最高値</option>
                        <option value={rankKeys.AVG}>平均値</option>
                        <option value={rankKeys.MED}>中央値</option>
                        <option value={rankKeys.MIN}>最低値</option>
                    </select>
                </th>
            </tr>
            {trendsList.map((trends,index)=>(
            <tr key={index}>
                <td className={`${(trends.rank<trends.pastRank)?'rankUp':''} ${(trends.rank>trends.pastRank)?'rankDown':''}`}>
                    {trends.rank}
                </td>
                <td>
                    {trends.name}
                </td>
                <td>
                    {trends.count}
                </td>
                <td className="sample">
                    {trends.value}円
                    {trends.samples.length>0 && (
                    <table className="appendix">
                        {trends.samples.map((sample,index2)=>(
                        <tr key={index2}>
                            <td>・</td>
                            <td>{translateNumber(sample.value)}</td>
                            <td>
                                <a href={sample.source} target="_blank">
                                    {sample.title}
                                </a>
                            </td>
                        </tr>
                        ))}
                    </table>
                    )}
                </td>
            </tr>
            ))}
        </table>
        <div className="charts">
            {trendsListG.length>0 && trendsListG.map((trends,index)=>(
            <BaseChart key={index} className="chart smallSquare"
                labels={trends.trends.map(()=>(""))}
                datasets={[
                    new BaseChart.Dataset({
                        label   : ((trends[rankKey].rank<1000)?trends[rankKey].rank:'ランク外')+'：'+trends.name,
                        data    : trends.trends.map((trend)=>(trend.value)),
                        rgb     : ((index<10)?RGBs[index]:undefined),
                    })
                ]}
                title={((trends[rankKey].rank<1000)?trends[rankKey].rank:'ランク外')+'：'+trends.name}
                max={Math.round( Math.max(...trendsList.map((trends)=>(trends.max.value)))/500001+1 )*500000}
                sample={trends[rankKey].value}
            />
            ))}
        </div>
    </div>
</div>
        );
    }
}
Object.assign(module.exports,{YoutubeSuperChatTrends});

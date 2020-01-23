const React = require('react');
const dateformat = require('dateformat');
const cloneDeep = require('lodash/cloneDeep');

const {YoutubeVideoViewAdapter,YoutubeTotalVideoViewAdapter} = require('../util/Adapter');
const {translateNumber,RGBs} = require('../../util/CommonUtil');

const {BaseChart} = require('./part/Chart');

//////////////////////////////////////////////////////////////////////////////////////////////////////

const trendsTypes = Object.freeze({
    LATEST  : 'latest',
    TOTAL   : 'total',
});

const rankKeys = Object.freeze({
    LATEST      : 'latest',
    LATEST_AVG  : 'latestAvg',
    LATEST_BUFF : 'latestBuff',
    SUM         : 'sum',
    SUM_BUFF    : 'sumBuff',
    AVG         : 'avg',
    MED         : 'med',
    MAX         : 'max',
    MIN         : 'min',
});

class YoutubeVideoViewTrends extends React.Component {
    constructor(props) {
        super(props);

        const {originUrl} = props;
        this.adapterA = new YoutubeVideoViewAdapter({originUrl});
        this.adapterB = new YoutubeTotalVideoViewAdapter({originUrl}); 

        this.state = {
            trendsList  : [],
            updatedDate : undefined,
            isLoading   : true,
            trendsType  : trendsTypes.LATEST,
            rankKey     : rankKeys.SUM,
            days        : 30,
        };

        this.trendsListA = [];
        this.trendsListB = [];
    }

    componentDidMount() {
        return (async()=>{
            const {rankKey,days} = this.state;

            this.trendsListA = (await this.adapterA.getTrendsList()).adjustTrendsByDate();
            this.trendsListA.rank({key:rankKeys.SUM}).addPastRank({key:rankKeys.SUM});
            this.trendsListA.filterTrendsByDate({days});
            console.log({trendsListA:this.trendsListA});
            
            this.trendsListB = (await this.adapterB.getTrendsList()).adjustTrendsByDate2();
            this.trendsListB.rank({key:rankKeys.LATEST}).addPastRank({key:rankKeys.LATEST});
            this.trendsListB.filterTrendsByDate({days});
            console.log({trendsListB:this.trendsListB});

            this.updateTrendsList();
            this.setState({isLoading:false});
        })();
    }

    updateTrendsList() {
        const {trendsType,rankKey} = this.state;

        const selectedTrendsList = ((trendsType===trendsTypes.LATEST)?this.trendsListA:this.trendsListB);
        const trendsList = cloneDeep(selectedTrendsList);
        this.setState({updatedDate:selectedTrendsList.updatedDate});

        const matched = rankKey.match(/^([a-z]+)([A-Z]*[a-z]*)$/);
        const key    = matched[1];
        const subKey = (matched[2]||'value').toLowerCase();

        trendsList.rank({key,subKey}).addPastRank({key,subKey});
        trendsList.forEach((trends)=>{
            trends.pastRank = ((rankKey===rankKeys.LATEST_AVG) ? trends[key].rank : trends[key].pastRank);
            trends.rank     = trends[key].rank;
            trends.value    = ((subKey==='buff'&&trends[key].buff>0)?'+':'') + translateNumber(trends[key][subKey]);
            trends.samples  = trends[key].samples;
        });
        trendsList.adoptMaxTrendsPerDate();
        trendsList.adjustTrendsByDate();

        this.setState({trendsList});
    }

    onChangeTrendsTypes(trendsType) {
        return (async()=>{
            this.setState({isLoading:true});
            await new Promise((done)=>setTimeout(done,500));

            if (trendsType===trendsTypes.LATEST) {
                this.setState({trendsType,rankKey:rankKeys.SUM,trendsList:[]});
                this.updateTrendsList();
            }
            if (trendsType===trendsTypes.TOTAL) {
                this.setState({trendsType,rankKey:rankKeys.LATEST,trendsList:[]});
                this.updateTrendsList();
            }

            this.setState({isLoading:false});
        })();
    }

    onChangeRankKey(rankKey) {
        return (async()=>{
            this.setState({isLoading:true});
            await new Promise((done)=>setTimeout(done,500));

            this.setState({rankKey,trendsList:[]});
            this.updateTrendsList();

            this.setState({isLoading:false});
        })();
    }

    render () {
        const {trendsList,updatedDate,isLoading,rankKey,trendsType,days} = this.state;
        const latestBuffDays = (trendsList[0]?trendsList[0].latest.buffDays:0);
        const sumBuffDays = (trendsList[0]?trendsList[0].sum.buffDays:0);

        return (
<div className={`page ${isLoading?'isLoading':''}`}>
    <div className="title">
        にじさんじ Youtube動画再生数
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
                <th>動画数</th>
                <th>
                    <select 
                        defaultValue={trendsType}
                        onChange={(e)=>this.onChangeTrendsTypes(e.target.value)}
                    >
                        <option value={trendsTypes.LATEST}>{days}日分</option>
                        <option value={trendsTypes.TOTAL}>累計</option>
                    </select>
                    {(trendsType===trendsTypes.LATEST) && (
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
                    )}
                    {(trendsType===trendsTypes.TOTAL) && (
                    <select 
                        defaultValue={rankKey}
                        onChange={(e)=>this.onChangeRankKey(e.target.value)}
                    >
                        <option value={rankKeys.LATEST     }>合計値</option>
                        <option value={rankKeys.LATEST_AVG }>平均値</option>
                        <option value={rankKeys.LATEST_BUFF}>増加数 (直近{latestBuffDays}日分)</option>
                        <option value={rankKeys.SUM_BUFF   }>増加数 ({sumBuffDays}日分)</option>
                    </select>
                    )}
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
                    {(trendsType===trendsTypes.LATEST) && trends.count}
                    {(trendsType===trendsTypes.TOTAL)  && trends.latest.count}
                </td>
                <td className="sample">
                    {trends.value}
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
            {(trendsType===trendsTypes.LATEST) && trendsList.map((trends,index)=>(
            <BaseChart key={index} className="chart smallSquare"
                labels={trends.trends.map(()=>(""))}
                datasets={[
                    new BaseChart.Dataset({
                        label   : ((trends.rank>=0)?trends.rank:'ランク外')+'：'+trends.name,
                        data    : trends.trends.map((trend)=>(trend.value)),
                        rgb     : ((index<10)?RGBs[index]:undefined),
                    })
                ]}
                title={((trends.rank<1000)?trends.rank:'ランク外')+'：'+trends.name}
                max={Math.max(...trendsList.map((trends)=>(trends.max.value)))}
                sample={trends[rankKey].value}
            />
            ))}
            {(trendsType===trendsTypes.TOTAL) && new Array(Math.floor(this.trendsListB.length/10)).fill().map((v,index)=>{
                const trendsListB = this.trendsListB.slice(index*10,index*10+20);
                return (
                    <BaseChart className="chart portrait" key={index}
                        labels={trendsListB[0].trends.map((trend)=>(""))}
                        datasets={trendsListB.map((trends,index2)=>(
                            new BaseChart.Dataset({
                                label   : `${trends.latest.rank<10?'  ':''}${trends.latest.rank}：${trends.name}${new Array(11-trends.name.length).fill('　').join('')}`,
                                data    : trends.trends.map((trend)=>(trend.value)),
                                rgb     : ((index2<10)?RGBs[index2]:undefined),
                            })
                        ))}
                        title={`${index*10+1}位〜${(index+1)*10}位`}
                        options={{
                            legend: {
                                display: true,
                            },
                            scales: {
                                yAxes:[{
                                    ticks   : {
                                        stepSize: 1000000,
                                        callback: (value)=>(`${value>=10000000?'':'  '}${value/10000}万`),
                                        max: (Math.floor( Math.max(...trendsListB.map((trends)=>(trends.max.value))) /1000001)+1)*1000000,
                                    },
                                }],
                            },
                        }}
                    />
                );
            })}
        </div>
    </div>
</div>
        );
    }
}
Object.assign(module.exports,{YoutubeVideoViewTrends});
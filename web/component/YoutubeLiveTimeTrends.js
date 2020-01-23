const React = require('react');
const dateformat = require('dateformat');
const cloneDeep = require('lodash/cloneDeep');

const {YoutubeLiveViewAdapter} = require('../util/Adapter');
const {translateTime,RGBs} = require('../../util/CommonUtil');

const {BaseChart} = require('./part/Chart');

//////////////////////////////////////////////////////////////////////////////////////////////////////

const rankKeys = Object.freeze({
    SUM: 'sum',
    MAX: 'max',
    MED: 'med',
    AVG: 'avg',
    MIN: 'min',
});

class YoutubeLiveTimeTrends extends React.Component {
    constructor(props) {
        super(props);

        const {originUrl} = props;
        this.adapter = new YoutubeLiveViewAdapter({originUrl});

        this.state = {
            trendsList  : [],
            updatedDate : undefined,
            isLoading   : true,
            rankKey     : rankKeys.SUM,
            subKey      : 'time',
        };

        this.trendsList = [];
    }

    componentDidMount() {
        return (async()=>{
            const {rankKey,subKey} = this.state;

            this.trendsList = (await this.adapter.getTrendsList()).adjustTrendsByDate({days:30});
            this.setState({updatedDate:this.trendsList.updatedDate});

            this.updateTrendsList();
            this.setState({isLoading:false});
        })();
    }

    updateTrendsList() {
        const {rankKey,subKey} = this.state;
        const key = rankKey;

        const trendsList = cloneDeep(this.trendsList);

        trendsList.rank({key,subKey}).addPastRank({key,subKey});
        trendsList.forEach((trends)=>{
            trends.pastRank = trends[key].pastRank;
            trends.rank     = trends[key].rank;
            trends.time     = translateTime(trends[key].time);
            trends.samples  = trends[rankKey].samples;
        });
        console.log({trendsList});
        trendsList.adoptMaxTrendsPerDate({subKey});

        this.setState({trendsList});
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
        const {trendsList,updatedDate,isLoading,rankKey} = this.state;
        const days = (trendsList[0]?trendsList[0].trends.length:0);

        return (
<div className={`page ${isLoading?'isLoading':''}`}>
    <div className="title">
        にじさんじ Youtubeライブ配信時間
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
                    <select defaultValue="latest">
                        <option value="latest">{days}日分</option>
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
            {trendsList.map((trends)=>(
            <tr>
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
                    {trends.time}
                    {trends.samples.length>0 && (
                    <table className="appendix">
                        {trends.samples.map((sample,index2)=>(
                        <tr key={index2}>
                            <td>・</td>
                            <td>{translateTime(sample.time)}</td>
                            <td>{sample.title}</td>
                        </tr>
                        ))}
                    </table>
                    )}
                </td>
            </tr>
            ))}
        </table>
        <div className="charts">
            {trendsList.map((trends,index)=>(
            <BaseChart key={index} className="chart smallSquare"
                labels={trends.trends.map(()=>(""))}
                datasets={[
                    new BaseChart.Dataset({
                        label   : ((trends.rank<1000)?trends.rank:'ランク外')+'：'+trends.name,
                        data    : trends.trends.filter((trend)=>(trend)).map((trend)=>(trend.time)),
                        rgb     : ((index<10)?RGBs[index]:undefined),
                    })
                ]}
                title={((trends.rank<1000)?trends.rank:'ランク外')+'：'+trends.name}
                sample={trends[rankKey].time}
                options={{
                    scales: {
                        yAxes:[{
                            ticks   : {
                                stepSize: 1000*3600*2,
                                callback: (value)=>translateTime(value).split(' ')[0],
                                max: (Math.floor( Math.max(...trendsList.map((trends)=>(trends.max.time))) /(1000*3600+1))+1)*(1000*3600),
                            },
                        }],
                    },
                }}
            />
            ))}
        </div>
    </div>
</div>
        );
    }
}
Object.assign(module.exports,{YoutubeLiveTimeTrends});
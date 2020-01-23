const React = require('react');
const dateformat = require('dateformat');
const cloneDeep = require('lodash/cloneDeep');

const {YoutubeSubscribersAdapter} = require('../util/Adapter');
const {translateNumber,RGBs} = require('../../util/CommonUtil');
const {BaseChart} = require('./part/Chart');

//////////////////////////////////////////////////////////////////////////////////////////////////////

const rankKeys = Object.freeze({
    LATEST      : 'latest',
    LATEST_BUFF : 'latestBuff',
    SUM_BUFF    : 'sumBuff',
});

class YoutubeSubscribersTrends extends React.Component {
    constructor(props) {
        super(props);

        const {originUrl} = props;
        this.adapter = new YoutubeSubscribersAdapter({originUrl});

        this.state = {
            trendsList  : [],
            updatedDate : undefined,
            isLoading   : true,
            rankKey     : rankKeys.LATEST,
        };

        this.trendsList = [];
    }

    componentDidMount() {
        (async()=>{
            this.trendsList = (await this.adapter.getTrendsList()).adjustTrendsByDate2().rank();
            this.setState({updatedDate:this.trendsList.updatedDate});

            this.updateTrendsList();
            this.setState({isLoading:false});
        })();
    }

    updateTrendsList() {
        const {rankKey} = this.state;

        const matched = rankKey.match(/^([a-z]+)([A-Z]*[a-z]*)$/);
        const key     = matched[1];
        const subKey  = (matched[2]||'value').toLowerCase();

        const trendsList = cloneDeep(this.trendsList);

        trendsList.rank({key,subKey}).addPastRank({key,subKey});
        trendsList.forEach((trends)=>{
            trends.pastRank = trends[key].pastRank;
            trends.rank     = trends[key].rank;
            trends.value    = ((subKey==='buff'&&trends[key][subKey]>=0)?'+':'') + translateNumber(trends[key][subKey]);
        });
        console.log({trendsList});
        // trendsList.adoptMaxTrendsPerDate();
        // trendsList.adjustTrendsByDate();

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
        const {trendsList,updatedDate,isLoading} = this.state;
        const latestBuffDays = (trendsList[0]?trendsList[0].latest.buffDays:0);
        const sumBuffDays = (trendsList[0]?trendsList[0].sum.buffDays:0);

        return (
<div className={`page ${isLoading?'isLoading':''}`}>
    <div className="title">
        にじさんじ Youtube登録者数
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
                <th>
                    <select 
                        defaultValue={rankKeys.LATEST}
                        onChange={(e)=>this.onChangeRankKey(e.target.value)}
                    >
                        <option value={rankKeys.LATEST}>最新値</option>
                        <option value={rankKeys.LATEST_BUFF}>増加数 (直近{latestBuffDays}日分)</option>
                        <option value={rankKeys.SUM_BUFF}>増加数 ({sumBuffDays}日分)</option>
                    </select>
                </th>
            </tr>
            {trendsList.map((trends)=>(
            <tr>
                <td className={`${(trends.rank<trends.pastRank)?'rankUp':''} ${(trends.rank>trends.pastRank)?'rankDown':''}`}>
                    {trends.rank}
                </td>
                <td>{trends.name}</td>
                <td>{trends.value}</td>
            </tr>
            ))}
        </table>
        <div className="charts">
            {new Array(Math.floor(this.trendsList.length/10)).fill().map((v,index)=>{
                const trendsListA = this.trendsList.slice(index*10,index*10+20);
                return (
                    <BaseChart className="chart portrait" key={index}
                        labels={trendsListA[0].trends.map((trend)=>(""))}
                        datasets={trendsListA.map((trends,index2)=>(
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
                                        stepSize: 10000,
                                        callback: (value)=>(`${value>=100000?'':'  '}${value/10000}万`),
                                        max: (Math.floor( Math.max(...trendsListA.map((trends)=>(trends.max.value))) /10001)+1)*10000,
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
Object.assign(module.exports,{YoutubeSubscribersTrends});

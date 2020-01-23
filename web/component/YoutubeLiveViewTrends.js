const React = require('react');
const dateformat = require('dateformat');
const cloneDeep = require('lodash/cloneDeep');

const {YoutubeLiveViewAdapter} = require('../util/Adapter');
const {translateNumber,RGBs} = require('../../util/CommonUtil');

const {BaseChart} = require('./part/Chart');

//////////////////////////////////////////////////////////////////////////////////////////////////////

const rankKeys = Object.freeze({
    MAX: 'max',
    AVG: 'avg',
    MED: 'med',
    MIN: 'min',
});

class YoutubeLiveViewTrends extends React.Component {
    constructor(props) {
        super(props);

        const {originUrl} = props;
        this.adapter = new YoutubeLiveViewAdapter({originUrl});

        this.state = {
            trendsList   : [],
            updatedDate  : undefined,
            isLoading    : true,
            rankKey      : rankKeys.MIN,
            requiredTime : 25*60*1000,
            requiredCount: 4,
        };
        this.trendsList = [];
    }

    componentDidMount() {
        return (async()=>{
            this.trendsList = (await this.adapter.getTrendsList()).adjustTrendsByDate();
            this.setState({updatedDate:this.trendsList.updatedDate});

            this.updateTrendsList();
            this.setState({isLoading:false});
        })();
    }

    updateTrendsList() {
        const {rankKey,requiredCount,requiredTime} = this.state;

        const matched = rankKey.match(/^([a-z]+)([A-Z]*[a-z]*)$/);
        const key     = matched[1];
        const subKey  = (matched[2]||'value').toLowerCase();

        const trendsList = cloneDeep(this.trendsList);

        trendsList.filterTrendsByTime({requiredTime});
        trendsList.adjustTrendsByDate();
        trendsList.rank({key,subKey,requiredCount,requiredTime}).addPastRank({key,subKey,requiredCount,requiredTime});
        trendsList.forEach((trends)=>{
            trends.pastRank = trends[rankKey].pastRank||1000;
            trends.rank     = trends[rankKey].rank||1000;
            trends.value    = translateNumber(trends[rankKey].value);
            trends.samples  = trends[rankKey].samples;
        });
        console.log({trendsList});
        trendsList.adoptMaxTrendsPerDate();

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

    onChangeRequiredTime(requiredTime) {
        return (async()=>{
            this.setState({requiredTime});
            this.onChangeRankKey(this.state.rankKey);
        })();
    }

    onChangeRequiredCount(requiredCount) {
        return (async()=>{
            this.setState({requiredCount});
            this.onChangeRankKey(this.state.rankKey);
        })();
    }

    render () {
        const {
            trendsList,updatedDate,isLoading,
            requiredTime,requiredCount,rankKey,
        } = this.state;
        const days = (trendsList[0]?trendsList[0].trends.length:0);

        return (
<div className={`page ${isLoading?'isLoading':''}`}>
    <div className="title">
        にじさんじ Youtubeライブ同接数
    </div>
    <div className="tips">
        <ul>
            <li>
                YoutubeAPI公式仕様に基づき、プレミア公開もライブとしてカウント
            </li>
            <li>
                <input 
                    type="number" step="5" min="0" required={true} defaultValue={Math.floor(requiredTime/60/1000)}
                    onChange={(e)=>this.onChangeRequiredTime(e.target.value*60*1000)}
                />
                分未満の配信＋配信
                <input 
                    type="number" step="1" min="0" required={true} defaultValue={requiredCount}
                    onChange={(e)=>this.onChangeRequiredCount(e.target.value)}
                />
                回未満の配信者を除外
            </li>
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
                    {(trends.rank<1000)?trends.rank:'ランク外'}
                </td>
                <td>{trends.name}</td>
                <td>{trends.count}</td>
                <td className="sample">
                    {trends.value}
                    {trends.samples.length>0 && (
                    <table className="appendix">
                        {trends.samples.map((sample,index2)=>(
                        <tr key={index2}>
                            <td>・</td>
                            <td>{translateNumber(sample.value)}</td>
                            <td>{dateformat(sample.startedDate,'mm/dd (HH:MM)')}</td>
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
            {trendsList.map((trends,index)=>(
            <BaseChart key={index} className="chart smallSquare"
                labels={trends.trends.map(()=>(""))}
                datasets={[
                    new BaseChart.Dataset({
                        label   : ((trends.rank>=0)?trends.rank:'ランク外')+'：'+trends.name,
                        data    : trends.trends.map((trend)=>(trend.value)),
                        rgb     : ((index<10)?RGBs[index]:undefined),
                    })
                ]}
                title={((trends.rank>=0)?trends.rank:'ランク外')+'：'+trends.name}
                max={Math.max(...trendsList.map((trends)=>(trends.max.value)))}
                sample={trends[rankKey].value}
            />
            ))}
        </div>
    </div>
</div>
        );
    }
}
Object.assign(module.exports,{YoutubeLiveViewTrends});


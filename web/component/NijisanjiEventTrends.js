const React = require('react');
const dateformat = require('dateformat');

const {BaseChart} = require('./part/Chart');
const {NijisanjiEventAdapter} = require('../util/Adapter');

//////////////////////////////////////////////////////////////////////////////////////////////////////

class NijisanjiEventTrends extends React.Component {
    constructor(props) {
        super(props);

        const {originUrl} = props;
        this.adapter = new NijisanjiEventAdapter({originUrl});

        this.state = {
            trendsList: [],
            updatedDate: undefined,
        };
        this.trendsList = [];
    }

    componentDidMount() {
        return (async()=>{
            this.trendsList = await this.adapter.getTrendsList();
            this.setState({updatedDate:this.trendsList.updatedDate});

            this.updateTrendsList();
            this.setState({isLoading:false});
        })();
    }

    updateTrendsList() {
        const trendsList = this.trendsList;
        const key = 'latest';
        trendsList.rank({key});
        trendsList.forEach((trends)=>{
            trends.rank     = trends[key].rank;
            trends.value    = trends[key].value;
            trends.samples  = trends[key].samples;
        });
        console.log({trendsList});
        this.setState({trendsList});
    }

    render () {
        const {isLoading,trendsList,updatedDate} = this.state;

        return (
<div className={`page ${isLoading?'isLoading':''}`}>
    <div className="title">
        にじさんじ イベント参加数
    </div>
    <div className="tips">
        <ul>
            <li>
                <a href="https://wikiwiki.jp/nijisanji/%E3%82%A4%E3%83%99%E3%83%B3%E3%83%88%E3%83%BB%E5%A4%A7%E4%BC%9A%E3%83%BB%E7%89%B9%E7%95%AA%E7%AD%89">ソース</a>
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
                <th>
                    参加数
                </th>
            </tr>
            {trendsList.map((trends)=>(
            <tr>
                <td>
                    {trends.rank}
                </td>
                <td>
                    {trends.name}
                </td>
                <td className="sample">
                    {trends.value}
                    {trends.samples.length>0 && (
                    <table className="appendix">
                        {trends.samples.map((sample,index2)=>(
                        <tr key={index2}>
                            <td>
                                {sample.title}
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
        </div>
    </div>
</div>
        );
    }
}
Object.assign(module.exports,{NijisanjiEventTrends});

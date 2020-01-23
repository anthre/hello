const React = require('react');
const {Link} = require("react-router-dom");

//////////////////////////////////////////////////////////////////////////////////////////////////////

class Top extends React.Component {
    render () {
        const {originUrl} = this.props;

        return (
<ul>
    <li>
        <Link to="/YoutubeLiveViewTrends/">
            にじさんじ Youtubeライブ同接数
        </Link>
    </li>
    <li>
        <Link to="/YoutubeLiveTimeTrends/">
            にじさんじ Youtubeライブ配信時間
        </Link>
    </li>
    <li>
        <Link to="/YoutubeVideoViewTrends/">
            にじさんじ Youtube動画再生数
        </Link>
    </li>
    <li>
        <Link to="/YoutubeSuperChatTrends/">
            にじさんじ Youtubeスパチャ額
        </Link>
    </li>
    <li>
        <Link to="/YoutubeSubscribersTrends/">
            にじさんじ Youtube登録者数
        </Link>
    </li>
    <li>
        <Link to="/TwitterFollowersTrends/">
            にじさんじ Twitterフォロワー数
        </Link>
    </li>
    <li>
        <Link to="/NijisanjiEventTrends/">
            にじさんじ イベント参加数
        </Link>
    </li>
</ul>
        );
    }
}
Object.assign(module.exports,{Top});
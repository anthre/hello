global.assign = Object.assign;

//////////////////////////////////////////////////////////////////////////////////////////////////////

const React = require('react');
const ReactDOM = require('react-dom');
const {BrowserRouter,HashRouter,Route} = require("react-router-dom");

const {Top} = require('./Top');
const {TwitterFollowersTrends}   = require('./TwitterFollowersTrends');
const {YoutubeSubscribersTrends} = require('./YoutubeSubscribersTrends');
const {YoutubeVideoViewTrends}   = require('./YoutubeVideoViewTrends');
const {YoutubeLiveViewTrends}    = require('./YoutubeLiveViewTrends');
const {YoutubeLiveViewTrends2}   = require('./YoutubeLiveViewTrends2');
const {YoutubeLiveTimeTrends}    = require('./YoutubeLiveTimeTrends');
const {YoutubeSuperChatTrends}   = require('./YoutubeSuperChatTrends');
const {NijisanjiEventTrends}     = require('./NijisanjiEventTrends');

//////////////////////////////////////////////////////////////////////////////////////////////////////

class Index extends React.Component {
    render () {
        const {originUrl} = this.props;
        
        return (
<BrowserRouter basename={originUrl}>
    <Route path='/'>
        <HashRouter>
            <Route path="/NijisanjiEventTrends/">
                <NijisanjiEventTrends {...this.props}/>
            </Route>
            <Route path='/YoutubeSuperChatTrends/'>
                <YoutubeSuperChatTrends {...this.props}/>
            </Route>
            <Route path='/YoutubeLiveTimeTrends/'>
                <YoutubeLiveTimeTrends {...this.props}/>
            </Route>
            <Route path='/YoutubeLiveViewTrends/'>
                <YoutubeLiveViewTrends {...this.props}/>
            </Route>
            <Route path='/YoutubeLiveViewTrends2/'>
                <YoutubeLiveViewTrends2 {...this.props}/>
            </Route>
            <Route path='/YoutubeVideoViewTrends/'>
                <YoutubeVideoViewTrends {...this.props}/>
            </Route>
            <Route path='/YoutubeSubscribersTrends/'>
                <YoutubeSubscribersTrends {...this.props}/>
            </Route>
            <Route path='/TwitterFollowersTrends/'>
                <TwitterFollowersTrends {...this.props}/>
            </Route>
            <Route exact path='/'>
                <Top {...this.props}/>
            </Route>
        </HashRouter>
    </Route>
</BrowserRouter>
        );
    }
}

//////////////////////////////////////////////////////////////////////////////////////////////////////

global.render = ({originUrl})=>{
    ReactDOM.render(<Index originUrl={originUrl} />, document.getElementById('root'));
};

//////////////////////////////////////////////////////////////////////////////////////////////////////

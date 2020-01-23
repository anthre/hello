const {TrendsList,Trends} = require('../../model/TrendsModel');
const {Channel} = require('../../model/ChannelsModel');

//////////////////////////////////////////////////////////////////////////////////////////////////////

class Adapter {
    constructor({originUrl,uri}) {
        Object.assign(this,{
            originUrl,uri,
        });
    }

    async getTrendsList() {
        const result = await fetch(this.uri);
        const json = await result.json();

        const trendsList = new TrendsList(...json);
        trendsList.updatedDate = new Date(result.headers.get('Last-Modified'));
        return trendsList;
    }
}

//////////////////////////////////////////////////////////////////////////////////////////////////////

class TwitterFollowersAdapter extends Adapter {
    constructor({originUrl}) {
        super({
            uri: `${originUrl}/json/TwitterFollowersTrendsList.json`,
        });
    }
}
Object.assign(module.exports,{TwitterFollowersAdapter});

//////////////////////////////////////////////////////////////////////////////////////////////////////

class YoutubeSubscribersAdapter extends Adapter {
    constructor({originUrl}) {
        super({
            uri: `${originUrl}/json/YoutubeSubscribersTrendsList.json`,
        });
    }
}
Object.assign(module.exports,{YoutubeSubscribersAdapter});

//////////////////////////////////////////////////////////////////////////////////////////////////////

class YoutubeVideoViewAdapter extends Adapter {
    constructor({originUrl}) {
        super({
            uri: `${originUrl}/json/YoutubeVideoViewTrendsList.json`,
        });
    }
}
Object.assign(module.exports,{YoutubeVideoViewAdapter});

//////////////////////////////////////////////////////////////////////////////////////////////////////

class YoutubeTotalVideoViewAdapter extends Adapter {
    constructor({originUrl}) {
        super({
            uri: `${originUrl}/json/YoutubeTotalVideoViewTrendsList.json`,
        });
    }
}
Object.assign(module.exports,{YoutubeTotalVideoViewAdapter});

//////////////////////////////////////////////////////////////////////////////////////////////////////

class YoutubeLiveViewAdapter extends Adapter {
    constructor({originUrl}) {
        super({
            uri: `${originUrl}/json/YoutubeLiveViewTrendsList.json`,
        });
    }
}
Object.assign(module.exports,{YoutubeLiveViewAdapter});

class YoutubeLiveViewAdapter2 extends Adapter {
    constructor({originUrl}) {
        super({
            uri: `${originUrl}/json/YoutubeLiveViewTrendsList2.json`,
        });
    }
}
Object.assign(module.exports,{YoutubeLiveViewAdapter2});

//////////////////////////////////////////////////////////////////////////////////////////////////////

class NijisanjiEventAdapter extends Adapter {
    constructor({originUrl}) {
        super({
            uri: `${originUrl}/json/NijisanjiEventTrendsList.json`,
        });
    }
}
Object.assign(module.exports,{NijisanjiEventAdapter});

//////////////////////////////////////////////////////////////////////////////////////////////////////

class YoutubeSuperChatAdapter extends Adapter {
    constructor({originUrl}) {
        super({
            uri: `${originUrl}/json/YoutubeSuperChatTrends.json`,
        });
    }

    async getTrendsList() {
        const result = await fetch(this.uri);
        const json = await result.json();

        const trendsList = new Trends({trends:json}).toTrendsList();
        trendsList.updatedDate = new Date(result.headers.get('Last-Modified'));
        return trendsList;
    }
}
Object.assign(module.exports,{YoutubeSuperChatAdapter});

//////////////////////////////////////////////////////////////////////////////////////////////////////

class ChannelsAdapter extends Adapter {
    constructor({originUrl}) {
        super({
            uri: `${originUrl}/json/Channels.json`,
        });
    }

    async getChannels() {
        const result = await fetch(this.uri);
        const json = await result.json();

        const channels = json.map((channel)=>(new Channel(channel)));
        return channels;
    }
}
Object.assign(module.exports,{ChannelsAdapter});

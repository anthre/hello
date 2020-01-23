const {JsonAdapter,FileAdapter} = require('./CommonAdapter');
const {Channel} = require('../model/ChannelsModel');

// //////////////////////////////////////////////////////////////////////////////////////////////////////

class ChannelsJsonAdapter extends JsonAdapter {
    async getChannels({ isDetailed }) {
        const channels = await this.request({
            uri     : CONFIG.ChannelsJsonAdapter.getChannels.uri(),
            json    : {
                filter_state: JSON.stringify({
                        open            : true,
                        selectedGroups  : 'nijisanjip,cover',
                        inc_old_group   : false,
                        retired         : 'all',
                        following       : false,
                        notifications   : false,
                        text            : '',
                }),
            },
        }).then((body)=>{
            return (body.result || []).map((channel)=>{
                return new Channel(channel);
            });
        });

        if (isDetailed) {
            // Fetching & Adding Data...
            for (const channel of channels) {
                await randomSleep(3, false);
                const detailedChannel = await this.getChannel(channel);

                // Addind Data...
                Object.assign(channel, detailedChannel);
                LOG_EVENT(channel);
            }
        }

        return channels;
    }

    // //////////////////////////////////////////////////////////////////////////////////////////////////

    async getChannel(channel) {
        const {streamerId} = channel;

        const detailedChannel = await this.request({
            uri     : CONFIG.ChannelsJsonAdapter.getChannel.uri(),
            json    : {
				streamer_id: streamerId,
            },
        }).then((body)=>{
            return new Channel(Object.assign(body, {streamerId}));
        });

        return detailedChannel;
    }
}
assign(module.exports,{ChannelsJsonAdapter});

// //////////////////////////////////////////////////////////////////////////////////////////////////////

class ChannelsFileAdapter extends FileAdapter {
    constructor() {
        super({
            path: './docs/json/Channels.json',
        });
    }

    async updateChannels(channels) {
        await super.save({ data: channels });
    }

    async getChannels() {
        const data = await super.load();
        const channels = JSON.parse(data || '[]').map((rawChannel)=>{
            return new Channel(rawChannel);
        });
        return channels;
    }
}
assign(module.exports,{ChannelsFileAdapter});

// //////////////////////////////////////////////////////////////////////////////////////////////////////

assign(module.exports,{
    Channels: {
        JsonAdapter: ChannelsJsonAdapter,
        FileAdapter: ChannelsFileAdapter,
    },
});

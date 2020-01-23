
// //////////////////////////////////////////////////////////////////////////////////////////////////////

class Channel {
    constructor(config={}) {
        const channelId = ((config.channels && config.channels.find && config.channels.find((ch)=>(ch.ch_type===1))) || {}).ch_id;

        Object.assign(this, {
			channelId	: (config.channelId     || channelId),
			streamerId	: (config.streamerId    || config.streamer_id),
			twitterId	: (config.twitterId     || (config.streamer && config.streamer.twitter_id)),
			groups		: (config.groups        || (config.streamer && config.streamer.groups)),
			name		: (config.name          || (config.streamer && config.streamer.name) || '').replace('･','・'),
			retired		: (config.retired       || (config.streamer && config.streamer.retired)),
        });
    }
}
assign(module.exports,{Channel});

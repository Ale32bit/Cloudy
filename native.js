/*
    Cloudy Discord Bot Engine 2.2.0
    (c) 2018 Ale32bit

    LICENSE: GNU GPLv3 (https://github.com/Ale32bit/Cloudy/blob/master/LICENSE)

    GitHub: https://github.com/Ale32bit/Cloudy
    Discord Tag: Ale32bit#5164
    Cloudy Discord Server: https://discord.gg/jhVJ5mZ

 */

const {Plugin, version} = require("./cloudy");

const plugin = new Plugin("native", {
    name: "Cloudy",
    version: version,
    author: "Ale32bit",
    description: "Cloudy Discord bot",
    emoji: ":gear:",
    override: true,
});

let bot;

plugin.on("load",function(cloudy){
    bot = cloudy;
});

plugin.addCommand("plugins", function (message) {
    let send = "**Loaded Plugins**\n\n";
    for (let id in bot.getPlugins()) {
        let plugin = bot.getPlugin(id);
        send += `${plugin.name} (${id}) *v${plugin.version}* by **${plugin.author}**: ${plugin.description}\n`;
    }
    message.channel.send(send);
},"Get a list of all plugins", {
    restricted: true,
});

module.exports = plugin;
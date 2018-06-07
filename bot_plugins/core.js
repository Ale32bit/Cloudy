/*
    Cloudy Plugin: core

    Cloudy Discord Bot
    (c) 2018 Ale32bit

    LICENSE: GNU GPLv3 (https://github.com/Ale32bit/Cloudy/blob/master/LICENSE)

    GitHub: https://github.com/Ale32bit/Cloudy
    Discord Tag: Ale32bit#5164
    Cloudy Discord Server: https://discord.gg/jhVJ5mZ
 */

const Discord = require("discord.js");
const os = require('os');
const {Plugin, utils, version} = require("../cloudy");
const config = require("../config");

const convert = function (secs) {
    let sec_num = parseInt(secs, 10); // don't forget the second param
    let hours = Math.floor(sec_num / 3600);
    let minutes = Math.floor((sec_num - (hours * 3600)) / 60);
    let seconds = sec_num - (hours * 3600) - (minutes * 60);

    if (hours < 10) {
        hours = "0" + hours;
    }
    if (minutes < 10) {
        minutes = "0" + minutes;
    }
    if (seconds < 10) {
        seconds = "0" + seconds;
    }
    return hours + ':' + minutes + ':' + seconds;
};

const plugin = new Plugin("core", {
    name: "Core",
    version: "2.0.0",
    author: "Ale32bit",
    description: "Core commands and utilities"
});

let client;
let bot;
const mM = {};

plugin.on("load", cloudy => {
    client = cloudy.client;
    bot = cloudy;
});

plugin.on("message", message => {
    if (message.author.id === client.user.id || message.author.bot) return false;

    if (message.mentions.users.get(client.user.id)) {
        message.channel.send("**Hello! I'm Cloudy!**\nSend `" + config.command_prefix + "help` to get a list of my commands!")
    }
});

const hasPerm = function (perm, message) {
    return bot.call("pman", "hasPermission");
};

plugin.setCommand("help", message => {
    let embed = new Discord.MessageEmbed();
    embed.setTitle("Cloudy Help List");
    embed.setColor("#7289da");
    //embed.setDescription("Cloudy command list");
    embed.setThumbnail(client.user.avatarURL);
    embed.setFooter("Cloudy © 2018 Ale32bit", client.user.avatarURL);
    embed.setTimestamp(new Date());
    for (let id in bot.getPlugins()) {
        let plugin = bot.getPlugin(id);
        if (plugin) {
            let comms = [];
            let helpt = plugin.description;
            for (let k in plugin.commands) {
                let v = plugin.commands[k];
                if (typeof(v.extra) === "object" && v.extra.permission) {
                    if (hasPerm(id + "." + v.extra.permission, message)) {
                        comms.push({
                            name: k,
                            help: v.help,
                        })
                    }
                }
            }
            if (comms.length > 0) {
                for (let c = 0; c < comms.length; c++) {
                    helpt += "\n`" + comms[c].name + "` " + (comms[c].help || "*Description not provided*");
                }
                embed.addField(plugin.name + " (" + plugin.id + ")", helpt)
            }
        }

    }
    embed.addField("Links", "[Support Server](https://discord.gg/jhVJ5mZ )");
    message.channel.send(embed);
}, "Help list", {
    permission: "help"
});

plugin.setCommand("ping", message => {
    message.channel.send("Pong! `" + Math.floor(client.ws.ping) + "ms`!");
}, "Pong!", {
    permission: "ping"
});

plugin.setCommand("echo", function (message) {
    message.channel.send(message.author.tag + ", " + utils.parseArgs(arguments, true).join(" "));
}, "`[message]` Echo messages", {
    permission: "echo",
});

module.exports = plugin;
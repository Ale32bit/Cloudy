/*
    Cloudy Module: pman

    Cloudy Discord Bot
    (c) 2018 Ale32bit

    LICENSE: GNU GPLv3 (https://github.com/Ale32bit/Cloudy/blob/master/LICENSE)

    GitHub: https://github.com/Ale32bit/Cloudy
    Discord Tag: Ale32bit#5164
    Cloudy Discord Server: https://discord.gg/jhVJ5mZ
 */

const Discord = require("discord.js");
const fs = require("fs");
const path = require("path");
const configPath = path.resolve(__dirname,"config","permissions.json");
if(!fs.existsSync(configPath)) fs.writeFileSync(configPath,JSON.stringify({
    groups: {
        default: {
            permissions:[
                "hello.hello",
                "basic.help",
                "basic.ping",
                "basic.echo"
            ],
        },
        guildowner: {
            permissions:[
                "hello.hello",
                "basic.help",
                "basic.ping",
                "basic.echo",
                "pman.pman"
            ],
        },
        admin: [
            "*",
        ],
    },
    users: {},
    guilds: {},
},null,4));
var corrupted;
let config;
try {
    config = require(configPath);
    corrupted = false;
}catch(e){
    console.error(e);
    corrupted = true;
}
const updateConf = function() {
    fs.writeFileSync(configPath, JSON.stringify(config,null,4));
    mod.log("Updated permission file".yellow)
};

var botConfig;
var botCommands;

const inArray = function(array,value){
    for(i=0;i<array.length;i++){
        if(value === array[i]) return true;
    }
    return false;
};

const mod = {
    id: "pman",
    name: "Permission Manager",
    version: "1.0.0",
    author: "Ale32bit",
    description: "Node Permission manager",
};

var client;
var parseArgs;

const hasPerm = function(node,message){
    var allow = true;
    if (node) {
        var pNode = node;
        var group;
        var guigroup = "default";
        var perms = {};
        if (config.users[message.author.id] && config.users[message.author.id].group !== "default") {
            group = config.users[message.author.id].group || undefined;
        }

        if (group) {
            for (var k in config.groups[group].permissions) {
                perms[config.groups[group].permissions[k]] = true;
            }
        }

        if (message.guild && config.guilds[message.guild.id].users[message.author.id]) {
            guigroup = config.guilds[message.guild.id].users[message.author.id].group || "default";
        }
        if (message.guild && message.guild.ownerID === message.author.id) {
            group = "guildowner"
        }
        if (group) {
            for (var k in config.groups[group].permissions) {
                perms[config.groups[group].permissions[k]] = true;
            }
        }
        if (message.guild) {
            for (var k in config.guilds[message.guild.id].groups[guigroup].permissions) {
                perms[config.guilds[message.guild.id].groups[guigroup].permissions[k]] = true;
            }
        }

        if(perms["*"]){
            allow = true;
        } else if(perms[pNode]){
            allow = true;
        } else {
            allow = false;
        }
    }
    return allow;
};

mod.onload = function(clt) {
    client = clt;
    parseArgs = mod.parseArgs;
    botConfig = mod.getBotConfig();
    if(corrupted){
        mod.log("Permissions Database is corrupted!".redBG);
        return;
    }
    updateConf();
    var groups = [];
    for (var k in config.groups) {
        groups.push(k)
    }
    var users = [];
    for (var k in config.users) {
        users.push(k)
    }
    var gids = 0;
    for (var k in config.guilds) {
        gids++;
    }
    mod.log("GGroups: " + (groups.join(", ")).blue);
    mod.log("GUsers: " + (users.join(", ")).blue);
    mod.log("Guilds: " + (gids).toString().blue);

    mod.listen(function listen(id,data){
        if(typeof(data) === "object") {
            if (data.type === "hasPermission" && data.message && data.permission) {
                var can = hasPerm(data.permission,data.message);
                mod.tell(id,{
                    type: "hasPermission",
                    message: data.message,
                    permission: data.permission,
                    status: can,
                    nonce: data.nonce || 0,
                })
            }
        }
    })
};

mod.ready = function() {
    botCommands = mod.getBotCommands();
};

mod.onmessage = function(message) {
    if(corrupted){
        mod.log("Corrupted Database, user command denied!".redBG);
        return false;
    }
    if (message.guild) {
        if(!config.guilds) config.guilds = {};
        if (!config.guilds[message.guild.id]) {
            config.guilds[message.guild.id] = {
                groups: {
                    default: config.groups.default,
                },
                users: {},
            };
            updateConf();
        }
    }
    if (message.content.startsWith(botConfig.command_prefix || "!")) {
        let sCont = message.content.substring(botConfig.command_prefix.length);
        let splitted = sCont.split(" ");
        let cmd = splitted[0];
        let args = [];
        args.push(message);
        for (var i = 1; i < splitted.length; i++) {
            args.push(splitted[i])
        }
        if (botCommands[cmd] && typeof(botCommands[cmd].extra) === "object" && botCommands[cmd].extra.permission) {
            var node = botCommands[cmd].id+"."+botCommands[cmd].extra.permission;
            var can = hasPerm(node,message);
            if(!can) {
                message.channel.send("Sorry, you don't have `" + node + "` permission node!");
                return false;
            }
            return true;
        }
    }
};

const commands = {
    help: function(message){
        var embed = new Discord.RichEmbed();
        embed.setColor("#7289da");
        embed.setTitle("Permission Manager Module");
        embed.addField("**Commands**","`pman <subcommand> [args,...]`");
        embed.addField("*groups*","List all guild groups");
        embed.addField("*globalgroups*","List all global groups");
        //embed.addField("groups","List all guild groups");
        message.channel.send(embed)
    },
    groups: function(message){
        if(!message.guild){
            message.channel.send("This is not a guild!");
            return;
        }
        var groups = [];
        for(var k in config.guilds[message.guild.id].groups){
            groups.push(k)
        }
        message.channel.send("**pman groups for this guild**\n"+groups.join(", "))
    },
    globalgroups: function(message){
        var groups = [];
        for(var k in config.groups){
            groups.push(k)
        }
        message.channel.send("**pman global groups**\n"+groups.join(", "))
    }
};

mod.commands = {
    pman: {
        function: function (message, cmd) {
            if (cmd) {
                if (commands[cmd]) {
                    commands[cmd](message)
                } else {
                    message.channel.send("Subcommand not found!")
                }
            } else {
                commands["help"](message);
            }
        },
        extra: {
            permission: "pman"
        }
    }
};

mod.helpList = {
    pman: "Permission manager.",
};

module.exports = mod;

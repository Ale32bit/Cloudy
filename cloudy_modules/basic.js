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

const mod = {};

mod.id = "basic";
mod.name = "Basic Commands";
mod.version = "1.0";
mod.author = "Ale32bit";
mod.description = "Basic commands for Cloudy";

var client;
const mM = {};

mod.onload = function(clt){
    client = clt;
    mod.log("Started");
    mod.listen(function listen(id,data){
        if(id === "pman"){
            mM[data.nonce] = data;
        }
    })
};

mod.onmessage = function(message){
    if(message.author.id === client.user.id) return false;
};

const hasPerm = function(perm,message){
    var nonce = Math.floor(Math.random()*1000);
    mod.tell("pman",{
        type: "hasPermission",
        nonce: nonce,
        message: message,
        permission: perm,
    });
    return nonce;
};

mod.commands = {
    help: {
        function: function(message) {
            let embed = new Discord.RichEmbed();
            embed.setTitle("Cloudy Help List");
            embed.setColor("#7289da");
            embed.setDescription("Cloudy command list");
            embed.setThumbnail(client.user.avatarURL);
            embed.setFooter("Cloudy Bot © 2018 Ale32bit",client.user.avatarURL);
            embed.setTimestamp(new Date());
            var modules = mod.getModules();
            for (var i = 0; i<modules.length;i++){
                var module = mod.getModuleInfo(modules[i]);
                if(module){
                    var comms = [];
                    var helpt = module.description;
                    for(var k in module.commands){
                        var v = module.commands[k];
                        if(typeof(v.extra) === "object" && v.extra.permission) {
                            var n = hasPerm(modules[i]+"."+v.extra.permission,message);
                            if(mM[n].status){
                                comms.push({
                                    name: k,
                                    help: v.help,
                                })
                            }
                        }
                    }
                    if(comms.length > 0) {
                        for(var c = 0;c<comms.length;c++) {
                            helpt += "\n`" + comms[c].name + "` " + comms[c].help || "*Description not provided*";
                        }
                        embed.addField(module.name, helpt)
                    }
                }

            }
            message.channel.send(embed);
        },
        extra: {
            permission: "help",
        }
    },
    ping: {
        function: function(message){
            message.channel.send("Average ping: `"+Math.floor(client.ping)+"ms`!");
        },
        extra: {
            permission: "ping",
        }
    },
    echo: {
        function: function(message){
            message.channel.send(message.author.tag+", "+mod.parseArgs(arguments,true).join(" "));
        },
        extra: {
            permission: "echo",
        },
    },

};

mod.helpList = {
    help: "Show this list",
    ping: "Pong!",
    echo: "echo",
};

module.exports = mod;
/*
    Cloudy Module: hello

    Cloudy Discord Bot
    (c) 2018 Ale32bit

    LICENSE: GNU GPLv3 (https://github.com/Ale32bit/Cloudy/blob/master/LICENSE)

    GitHub: https://github.com/Ale32bit/Cloudy
    Discord Tag: Ale32bit#5164
    Cloudy Discord Server: https://discord.gg/jhVJ5mZ
 */

const mod = {};

mod.id = "hello";
mod.name = "Hello World!";
mod.version = "1.0";
mod.author = "Ale32bit";
mod.description = "Cloudy Example Module";

mod.onload = function(client){
    mod.log("Loading "+mod.name);
};

mod.ready = function(client){
    mod.log("Ready!");
    mod.getBotCommands()["eval"] = null;
};

mod.commands = {
    hello: {
        function: function(message){
            message.channel.send("Hello World!");
        },
        extra: {
            permission: "hello"
        },
    },
};

mod.helpList = {
    hello: "Hello World!",
};

module.exports = mod;
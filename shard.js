/*
    Cloudy Discord Bot Engine

    SHARD MANAGER

    (c) 2018 Ale32bit

    LICENSE: GNU GPLv3 (https://github.com/Ale32bit/Cloudy/blob/master/LICENSE)

    GitHub: https://github.com/Ale32bit/Cloudy
    Discord Tag: Ale32bit#5164
    Cloudy Discord Server: https://discord.gg/jhVJ5mZ

 */

const Discord = require("discord.js");
const config = require("./config.json");

const manager = new Discord.ShardingManager("index.js",{
    totalShards: config.shards || "auto",
});

manager.spawn();

manager.on("shardCreate",shard=>{
    console.log("Shard "+shard.id+" spawned!")
});

process.on("message",message=>{
    console.log(message);
});
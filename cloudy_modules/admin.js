/*
    Cloudy Module: admin

    Cloudy Discord Bot
    (c) 2018 Ale32bit

    LICENSE: GNU GPLv3 (https://github.com/Ale32bit/Cloudy/blob/master/LICENSE)

    GitHub: https://github.com/Ale32bit/Cloudy
    Discord Tag: Ale32bit#5164
    Cloudy Discord Server: https://discord.gg/jhVJ5mZ
 */

const mod = {};

mod.id = "admin";
mod.name = "Admin tools";
mod.version = "1.0";
mod.author = "Ale32bit";
mod.description = "Admin tools";
mod.onload = function(client){
    mod.log("Loading "+mod.name);
    //mod.defaultMessageListener(true);
};

const inArray = function(array,value){
    for(i=0;i<array.length;i++){
        if(value === array[i]) return true;
    }
    return false;
};

const clean = text => {
    if (typeof(text) === "string")
        return text.replace(/`/g, "`" + String.fromCharCode(8203)).replace(/@/g, "@" + String.fromCharCode(8203));
    else
        return text;
};

mod.commands = {
    eval: {
        function: function(message){
            var config = mod.getBotConfig();
            if(inArray(config.admins,message.author.id)){
                try {
                    const code = mod.parseArgs(arguments,true).join(" ");
                    let evaled = eval(code);

                    if (typeof evaled !== "string")
                        evaled = require("util").inspect(evaled);

                    message.channel.send(clean(evaled), {code:"xl"});
                } catch (err) {
                    message.channel.send(`\`\`\`xl\n${clean(err)}\n\`\`\``);
                }
            }else{
                message.channel.send("You are not a bot administrator!")
            }
        },
        extra: {
            permission: "eval",
            restricted: true,
        },
    }
};

mod.helpList = {
    eval: "",
};

module.exports = mod;
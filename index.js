/*
    Cloudy Discord Bot
    (c) 2018 Ale32bit

    LICENSE: GNU GPLv3 (https://github.com/Ale32bit/Cloudy/blob/master/LICENSE)

    GitHub: https://github.com/Ale32bit/Cloudy
    Discord Tag: Ale32bit#5164
    Cloudy Discord Server: https://discord.gg/jhVJ5mZ
 */

// libs
const Discord = require("discord.js");
const client = new Discord.Client();
const fs = require("fs");
const path = require("path");
const colors = require("colors");

// config
const config = require("./config.json");
const modules = {};
const commands = {};
const eventListeners = {};
let defaultMessageListener = true;

const log = function(){
    var date = new Date();
    var time = {
        hour: date.getHours(),
        minute: date.getMinutes(),
        seconds: date.getSeconds(),
    };
    var args = [];
    args.push("["+time.hour+":"+time.minute+":"+time.seconds+"]");
    for(var k in arguments){
        args.push(arguments[k])
    }
    console.log.apply(this,args);
};

log("Starting Cloudy");

// load modules
fs.readdirSync(config.modules_dir).forEach(file => {
    if(fs.lstatSync(path.resolve(__dirname, config.modules_dir, file)).isDirectory()) return;
    if(file.endsWith(".js")){
        try {
            var module = require(path.resolve(__dirname, config.modules_dir, file));
            if(typeof(module) === "object"){
                if(!module.id){
                    log("Invalid ID: "+file);
                    return
                }
                module.filename = file;
                module.name = module.name || module.id;
                module.version = module.version || "1.0.0";
                module.author = module.author || "n/a";
                module.description = module.description || "*Description not provided*";
                log("Loading "+module.name.green+"("+file.gray+")","v".blue+module.version.blue,"by "+module.author.green,"ID: "+module.id.magenta);
                if(modules[module.id]){
                    log("ID collision:".red,modules[module.id].filename.magenta,"and".red,file.magenta,"ID:".red,module.id.yellow)
                }
                /**
                 * Log data in the console
                 * @param {...*} data Log data
                */
                module.log = function(data){
                    var args = [];
                    args.push(colors.yellow(`[${module.name}]`));
                    for(var k in arguments){
                        args.push(arguments[k])
                    }
                    log.apply(this,args);
                };
                /**
                 * Get all bot commands
                 * @readonly
                 * @returns {Object} Bot Commands
                 */
                module.getBotCommands = function(){
                    var comms = {};
                    for (var k in commands){
                        comms[k] = commands[k];
                    }
                    return comms;
                };
                /**
                 * Get bot config
                 * @readonly
                 * @returns {Object} Bot Config
                 */
                module.getBotConfig = function(){
                    var conf = {};
                    for (var k in config){
                        if(k !== "token") {
                            conf[k] = config[k];
                        }
                    }
                    return conf;
                };
                /**
                 * Get modules list
                 * @readonly
                 * @returns {array} Modules
                 */
                module.getModules = function(){
                    var list = [];
                    for (var k in modules){
                        list.push(k);
                    }
                    return list;
                };
                /**
                 * Retrieve information from a module
                 * @readonly
                 * @param {string} id ID of a module to retrieve
                 * @returns {Object|null} Info
                 */
                module.getModuleInfo = function(id){
                    var info = {};
                    if(modules[id]){
                        let d = modules[id];
                        info.id = id;
                        info.name = d.name;
                        info.author = d.author;
                        info.version = d.version;
                        info.description = d.description;
                        info.commands = {};
                        for(var k in commands){
                            var v = commands[k];
                            if(v.id === id){
                                info.commands[k] = {
                                    extra: v.extra,
                                    help: v.help,
                                }
                            }
                        }
                    } else {
                        return null;
                    }
                    return info;
                };
                /**
                 * Toggle native bot message listener
                 * @param {boolean} status
                 */
                module.defaultMessageListener = function(status){
                    if(typeof(status) === "boolean"){
                        defaultMessageListener = status;
                        log("Toggled default message listener:",status)
                    }else{
                        throw new Error("Expected boolean, got "+typeof(status));
                    }
                };
                /**
                 * Parse bot command arguments into an array
                 * @param {Object} args arguments
                 * @param {boolean} avoidMessage remove Discord.JS message object
                 * @returns {Array}
                 */
                module.parseArgs = function(args,avoidMessage){
                    var argss = [];
                    for(var k in args){
                        argss.push(args[k])
                    }
                    if(avoidMessage) argss.shift();
                    return argss;
                };
                /**
                 * Send data to another module
                 * @param {String} moduleID Module ID
                 * @param {*} data Any data to send
                 */
                module.tell = function(moduleID,data){
                    if(modules[moduleID]){
                        if(eventListeners[moduleID]){
                            try {
                                eventListeners[moduleID](module.id,data)
                            } catch (e) {
                                console.error(e);
                            }
                        }
                    }
                };
                /**
                 * Listen and receive data from other modules
                 * @param {function} cb Callback(id, data)
                 */
                module.listen = function(cb){
                    if(typeof(cb) !== "function"){
                        throw new Error("expected function, got "+typeof(cb));
                    }
                    eventListeners[module.id] = cb;
                };

                modules[module.id] = module;
                if(typeof(module.onload) === "function"){
                    try {
                        module.onload(client)
                    } catch(e) {
                        console.error(e);
                    }
                }
                if(typeof(module.commands)==="object"){
                    for(let command in module.commands){
                        let func = module.commands[command].function;
                        if(typeof(func)==="function"){
                            commands[command] = {
                                function: func,
                                id: module.id,
                                extra: module.commands[command].extra,
                            };
                            log("Added command".blue,command.magenta,"from".blue,module.id.yellow)
                        }else{
                            log(func.yellow,"is not a function!".red)
                        }
                    }
                }
                if(typeof(module.helpList)==="object"){
                    for(let cmd in module.helpList){
                        let help = module.helpList[cmd];
                        if(module.commands[cmd]){
                            commands[cmd].help = help;
                            log("Added command help".blue,cmd.magenta,"from".blue,module.id.yellow)
                        }else{
                            log(cmd.yellow,"help message has no command".red)
                        }
                    }
                }
            }else{
                log("Invalid module "+file)
            }
        } catch(e) {
            log("Could not load module "+file+": "+e.toString());
            console.error(e);
        }
    }
});

commands["modules"]={
    function: function(message){
        var embed = new Discord.RichEmbed();
        embed.setColor("#7289da");
        embed.setTitle("Cloudy Modules");
        for(var module in modules){
            var data = modules[module];

            embed.addField(data.name+" ("+module+")","v"+data.version+" by "+data.author);
            for(var c in data.commands) {
                var help = "Help message not provided";
                if(data.helpList && data.helpList[c]) help = data.helpList[c];
                embed.addField(c, help,true);
            }
            embed.addBlankField();
        }
        message.channel.send(embed);
    },
    help: "List all modules loaded by the bot",
    id: "native",
    extra: {
        permission: "modules",
    }
};

for(var mod in modules){
    var module = modules[mod];
    if(typeof(module.ready) === "function"){
        try {
            module.ready(client)
        } catch(e) {
            console.error(e);
        }
    }
}

log("All working modules are loaded!".greenBG);

client.on("message", message =>{
    var exe = true;
    for(var mod in modules){
        var module = modules[mod];
        if(typeof(module.onmessage) === "function"){
            try {
                exe = module.onmessage(message);
                if(typeof(exe) !== "boolean") exe = true;
                //break;
            } catch(e) {
                console.error(e);
            }
        }
    }
    if(defaultMessageListener && exe) {
        if (message.content.startsWith(config.command_prefix || "!")) {
            let sCont = message.content.substring(config.command_prefix.length);
            log(message.author.tag, "(" + message.author.id + "):", sCont.blue);
            let splitted = sCont.split(" ");
            let cmd = splitted[0];
            let args = [];
            args.push(message);
            for (var i = 1; i < splitted.length; i++) {
                args.push(splitted[i])
            }
            if (commands[cmd]) {
                try {
                    commands[cmd].function.apply(this, args)
                } catch (e) {
                    //console.log("Failed executing".red,cmd.yellow,e.toString().red);
                    console.error(e);
                }
            }
        }
    }
});

client.on("warn",(warn)=>{
    console.log(warn);
});

client.on("error",(e)=>{
    console.error(e);
});

client.on('ready', () => {
    log("Connected as "+ client.user.tag.bold +" ("+client.user.id.yellow+")");
});

client.login(config.token).catch(console.error);
/*
    Cloudy Discord Bot Engine 2.0
    (c) 2018 Ale32bit

    LICENSE: GNU GPLv3 (https://github.com/Ale32bit/Cloudy/blob/master/LICENSE)

    GitHub: https://github.com/Ale32bit/Cloudy
    Discord Tag: Ale32bit#5164
    Cloudy Discord Server: https://discord.gg/jhVJ5mZ

 */

const Cloudy = require("./cloudy");
const utils = Cloudy.utils;
const Discord = require("discord.js");
const fs = require("fs");
const path = require("path");
const colors = require("colors");

if(!fs.existsSync("config.json")){
    fs.writeFileSync("config.json",JSON.stringify({
        token: "BOT_TOKEN_HERE",
        plugins_dir: "bot_plugins",
        command_prefix: "!",
        shards: "auto",
    },null,2));

    console.log("Configuration file (config.json) created!",
        "\ntoken: client token",
        "\nplugins_dir: Directory containing the bot plugins",
        "\ncommand_prefix: The prefix to run bot commands",
        "\nshards: Amount of shards to use. \"auto\" for automatic.");
    process.exit(1)
}

const config = (()=>{
    try {
        return require("./config.json");
    } catch (e) {
        console.log("Couldn't load the bot");
        console.error(e);
        process.exit(1);
    }
})();

// Define const vars

const plugins = {};
const client = new Discord.Client();

// Define functions

/**
 * Fire cloudy events
 * @param {string} event Event name
 * @param {...*} parameters Event params
 */
const fireEvent = function(event,...parameters){
    let params = utils.parseArgs(arguments,1);
    for(let id in plugins){
        let plugin = plugins[id];
        if(plugin.events[event]){
            for(let i = 0; i<plugin.events[event].length; i++){
                try {
                    plugin.events[event][i].apply(this,params)
                } catch(e) {
                    console.error(plugin.id,e)
                }
            }
        }
    }
};

/**
 * Fire cloudy events only to a plugin
 * @param {string} id Plugin ID
 * @param {string} event Event name
 * @param {...*} parameters Event params
 */
const firePluginEvent = function(id,event,...parameters) {
    let params = utils.parseArgs(arguments, 1);
    let plugin = plugins[id];
    if(!plugin){
        return;
    }
    if (plugin.events[event]) {
        for (let i = 0; i < plugin.events[event].length; i++) {
            try {
                plugin.events[event][i].apply(this, params)
            } catch (e) {
                console.error(plugin.id, e)
            }
        }
    }
};

/**
 * Find a command by name
 * @param {string} name Command name
 * @returns {object} command Command object containing its data
 */
const getCommand = function(name){
    for(let id in plugins){
        let plugin = plugins[id];
        if(plugin.commands[name]) return plugin.commands[name]
    }
};

const bot = {
    fireEvent: fireEvent,
    firePluginEvent: firePluginEvent,
    getCommand: getCommand,

    /**
     * Call an API function of another plugin
     * @param {string} id Plugin ID
     * @param {string} name API function name
     * @returns {function} function Function to call
     */
    call: function(id,name){
        console.log(id,name);
        if(plugins[id]){
            if(plugins[id].api[name]){
                return plugins[id].api[name];
            }
        }
    },
};

// Load plugins

const loadPlugin = function(file){
    let plugin = require(path.resolve(__dirname, config.plugins_dir, file));
	if(!plugin.id){
        console.log(colors.red("Invalid ID " + file + "!"));
        return;
    }
    plugin.filename = file;
    if (plugins[plugin.id]) {
        if(plugin.override){
            console.log(colors.yellow("[OVERRIDEN] Conflict id " + plugin.id + "!"));
        }else {
            console.log(colors.red("Conflict id " + plugin.id + "! " + file + " ignored"));
        }
        return;
    }
    plugins[plugin.id] = plugin;
    console.log("Loaded plugin " + plugin.name.red + " (" + plugin.id.yellow + ") v" + plugin.version.green + " by " + plugin.author.blue);
    firePluginEvent("load", client, bot);
};

fs.readdirSync(config.plugins_dir).forEach(file => {
    try {
        loadPlugin(file);
    } catch (e) {
        console.error(e);
    }
});

// Set native plugin

plugins["native"] = {
    name: "Cloudy",
    version: "2.0.0",
    author: "Ale32bit",
    description: "Cloudy Discord bot",
    override: true,
    filename: __dirname,

    events: {},
    api: {},
    commands: {
        reload: {
            function: function(message,pluginID){
                if(pluginID === "native"){
                    message.channel.send("WIP");
                }

                if(plugins[pluginID]){
                    message.channel.send("Reloading "+pluginID).then(msg=>{
                        let file = plugins[pluginID].filename;
                        plugins[pluginID] = undefined;
                        try {
                            console.log("Reloading "+pluginID);
                            firePluginEvent(pluginID,"reload");
                            loadPlugin(file,pluginID);
                            msg.edit("Successfully reloaded "+pluginID);
                        } catch (e) {
                            console.error(e);
                            msg.edit(e.toString());
                        }

                    });
                }else{
                    message.channel.send("Plugin not found")
                }
            },
            help: "Reload a plugin",
            extra: {
                permission: "reload"
            }
        }
    }
};

// Listen to message events

client.on("message",message=> {
    fireEvent("message",message);
    if (message.content.startsWith(config.command_prefix || "!")) {
        let sCont = message.content.substring(config.command_prefix.length);
        let guildMSG;
        if (message.guild) {
            guildMSG = message.guild.id;
        }
        console.log("[" + (guildMSG || "") + "]", message.author.tag, "(" + message.author.id + "):", sCont.yellow);
        sCont = sCont.trim();
        //console.log(sCont);
        //sCont = split(sCont);
        sCont = sCont.split(" ");
        let splitted = sCont;
        //console.log(splitted);
        let cmd = splitted[0];
        let args = [];
        args.push(message);
        for (let i = 1; i < splitted.length; i++) {
            args.push(splitted[i])
        }
        let execute = true;
        let ev = {
            preventDefault: function(){
                execute = false;
            },
        };
        fireEvent("command",ev,cmd,args);
        let command = getCommand(cmd);
        if (command) {
            try {
                process.nextTick(()=> {
                    if(execute) {
                        command.function.apply(this, args);
                        fireEvent("command_success", cmd, args);
                    }else{
                        console.log("Killed");
                        fireEvent("command_killed",cmd,args)
                    }
                });
            } catch (e) {
                //console.log("Failed executing".red,cmd.yellow,e.toString().red);
                console.error(e);
                fireEvent("command_failed",cmd,args,e)
            }
        }
    }
});

client.on("ready",()=>{
    fireEvent("ready",client, bot);
    console.log("Logged in as "+client.user.tag.magenta.underline)
});

client.login(config.token).catch(console.error);

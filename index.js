/*
    Cloudy Discord Bot Engine 2.2.0
    (c) 2018 Ale32bit

    LICENSE: GNU GPLv3 (https://github.com/Ale32bit/Cloudy/blob/master/LICENSE)

    GitHub: https://github.com/Ale32bit/Cloudy
    Discord Tag: Ale32bit#5164
    Cloudy Discord Server: https://discord.gg/jhVJ5mZ

 */

'use strict';

const _VERSION = "2.2.0";

const Cloudy = require("./cloudy");
const utils = Cloudy.utils;
const Discord = require("discord.js");
const fs = require("fs");
const path = require("path");
const readline = require("readline");
const VM = require("vm2").NodeVM;
const colors = require("colors");
const Long = require("long");

/*
WARNING: Disabling this removes: client, bot, Cloudy from plugins ENV
 */
const UseVM = true;

const config = (() => {
    try {
        if (!fs.existsSync("config.json")) {
            fs.writeFileSync("config.json", JSON.stringify({}));
        }

        let conf = require("./config.json");

        conf.token = conf.token || "";
        conf.plugins_dir = conf.plugins_dir || "bot_plugins";
        conf.command_prefix = conf.command_prefix || "!";
        conf.shards = conf.shards || "auto";
        conf.admins = conf.admins || [];

        fs.writeFileSync("config.json", JSON.stringify(conf, null, 2));

        return conf;
    } catch (e) {
        console.log("Couldn't load the bot");
        console.error(e);
        process.exit(1);
    }
})();

if (config.token == "") {
    console.log("Configuration file (config.json) created!",
        "\ntoken: client token",
        "\nplugins_dir: Directory containing the bot plugins",
        "\ncommand_prefix: The prefix to run bot commands",
        "\nshards: Amount of shards to use. \"auto\" for automatic.",
        "\nadmins: Array of users ids that can run any command",
        "\n\nPlease do not touch configVersion for any reason!");
    process.exit(1)
}

// Define const vars

const plugins = {};
const consoleCommands = {};
const client = new Discord.Client({
    shardCount: config.shardCount,
});
let isReady = false;

// Define functions

/**
 * Fire cloudy events
 * @param {string} event Event name
 * @param {...*} parameters Event params
 */
const fireEvent = function (event, ...parameters) {
    parameters.unshift(event);
    for (let id in plugins) {
        let plugin = plugins[id];
        if (plugin) {
            plugin.emit.apply(plugin, parameters);
        }
    }
};

/**
 * Fire cloudy events only to a plugin
 * @param {string} id Plugin ID
 * @param {string} event Event name
 * @param {...*} parameters Event params
 */
const firePluginEvent = function (id, event, ...parameters) {
    parameters.unshift(event);
    let plugin = plugins[id];
    if (plugin) {
        plugin.emit.apply(plugin, parameters);
    }
};

/**
 * Find a command by name
 * @param {string} name Command name
 * @returns {object} command Command object containing its data
 */
const getCommand = function (name) {
    let mtc = name.match(/^\w+:/);
    let id;
    if (mtc) id = mtc[0].substring(0, mtc[0].length - 1);
    if (id) {
        let cmdm = name.match(/:\w+/);
        let cmd = cmdm[0].substring(1);
        if (plugins[id]) {
            if (plugins[id].commands[cmd]) {
                return plugins[id].commands[cmd];
            }
        }
    } else {
        for (let id in plugins) {
            let plugin = plugins[id];
            if (plugin.commands[name]) return plugin.commands[name]
        }
    }
};

const getPlugin = function (id) {
    let plugin = plugins[id];
    if (!plugin) {
        return undefined;
    }
    let out = {
        id: id,
        name: plugin.name,
        version: plugin.version,
        author: plugin.author,
        description: plugin.description,
        emoji: plugin.emoji,
        override: plugin.override,

        api: {},
        commands: {},
    };

    for (let name in plugin.commands) {
        let cmd = plugin.commands[name];
        out.commands[name] = {
            function: function () {
                let args = utils.parseArgs(arguments);
                try {
                    process.nextTick(cmd.function, args)
                } catch (e) {
                    console.error(e);
                }
            },
            options: cmd.options,
            extra: cmd.extra,
            id: cmd.id,
        }
    }

    for (let name in plugin.api) {
        let api = plugin.api[name];
        out.api[name] = function () {
            let args = utils.parseArgs(arguments);
            try {
                return api.apply(this, args)
            } catch (e) {
                console.error(e);
            }
        }
    }
    return out;
};

/**
 * Get all loaded plugins
 * @returns {object} plugins All the plugins loaded
 */
const getPlugins = function () {
    let out = {};
    for (let id in plugins) {
        out[id] = getPlugin(id);
    }

    return out;
};

const guildsCount = function () {
    return new Promise((resolve, reject) => {
        if (client.shard) {
            client.shard.fetchClientValues('guilds.size')
                .then(count => {
                    resolve(count.reduce((prev, val) => prev + val, 0));
                })
                .catch(e => reject);
        } else {
            resolve(client.guilds.size);
        }
    });
};

const usersCount = function () {
    return new Promise((resolve, reject) => {
        if (client.shard) {
            client.shard.fetchClientValues('users.size')
                .then(count => {
                    resolve(count.reduce((prev, val) => prev + val, 0));
                })
                .catch(e => reject);
        } else {
            resolve(client.guilds.size);
        }
    });
};

const isAdmin = function (id) {
    return utils.inArray(config.admins, id);
};

const getAdmins = function () {
    return config.admins;
};

const getDefaultChannel = async (guild) => {
    // get "original" default channel
    if (guild.channels.has(guild.id))
        return guild.channels.get(guild.id);

    // Check for a "general" channel, which is often default chat
    if (guild.channels.find(ch => ch.name === 'general'))
        return guild.channels.find(ch => ch.name === 'general');
    // Now we get into the heavy stuff: first channel in order where the bot can speak
    // hold on to your hats!
    return guild.channels
        .filter(c => c.type === "text" &&
            c.permissionsFor(guild.client.user).has("SEND_MESSAGES"))
        .sort((a, b) => a.position - b.position ||
            Long.fromString(a.id).sub(Long.fromString(b.id)).toNumber())
        .first();
};

const bot = {
    fireEvent: fireEvent,
    firePluginEvent: firePluginEvent,
    getCommand: getCommand,
    getPlugins: getPlugins,
    getPlugin: getPlugin,
    isAdmin: isAdmin,
    getAdmins: getAdmins,
    guildsCount: guildsCount,
    usersCount: usersCount,
    getDefaultChannel: getDefaultChannel,
    config: Object.freeze(config),

    /**
     * Call an API function of another plugin
     * @param {string} id Plugin ID
     * @param {string} name API function name
     * @returns {function} function Function to call
     */
    call: function (id, name) {
        if (plugins[id]) {
            if (plugins[id].api[name]) {
                return function () {
                    let args = utils.parseArgs(arguments);
                    try {
                        return plugins[id].api[name].apply(this, args)
                    } catch (e) {
                        console.error(e);
                    }
                }
            }
        }
    },

    version: _VERSION,

    client: client,
};

global.bot = bot;

// Load plugins

const loadPlugin = (file) => {
    try {
        // Load plugin
        let plugin;
        if (!UseVM) {
            plugin = require(path.resolve(__dirname, config.plugins_dir, file));
        } else {
            let ENV = {
                client,
                bot,
                Cloudy,
                process,
            };
            let vm = new VM({
                require: {
                    external: true,
                    builtin: ["*"],
                },
                sandbox: ENV,
            });
            let p = path.resolve(__dirname, config.plugins_dir, file);
            plugin = vm.run(fs.readFileSync(p), p);
        }
        if (!plugin.id) { // Invalid if no ID
            console.log(colors.red("Invalid ID " + file + "!"));
            return;
        }
        plugin.filename = file;
        if (plugins[plugin.id]) { // Check if plugin already exists
            if (plugin.override) {
                console.log(colors.yellow("[OVERRIDEN] Conflict id " + plugin.id + "!"));
            } else {
                console.log(colors.red("Conflict id " + plugin.id + "! " + file + " ignored"));
            }
            return;
        }
        if (plugin.permissionsManager) { // set as permissions manager
            bot.perms = plugin.api;
        }

        // Install console commands
        for (let commandName in plugin.consoleCommands) {
            consoleCommands[commandName] = plugin.consoleCommands[commandName];
        }

        plugins[plugin.id] = plugin; // Install plugin

        console.log("Installed plugin " + plugin.name.red + " (" + plugin.id.yellow + ") v" + plugin.version.green + " by " + plugin.author.blue);
        plugin.emit("preload", bot);
    } catch (e) {
        return e;
    }
};

console.log("-- PRELOAD STATE --");

loadPlugin("../native.js");

let toInit = fs.readdirSync(config.plugins_dir);

fs.readdirSync(config.plugins_dir).forEach(file => {
    if (file !== "config") {
        try {
            process.nextTick(() => {
                loadPlugin(file);
            });
        } catch (e) {
            console.error(e);
        }
    }
    toInit.shift();
});

let preinitInterval = setInterval(function () {
    if (toInit.length === 0) {
        console.log("-- LOAD STATE --");
        fireEvent("load", bot);
        console.log("Logging in...");
        client.login(config.token).catch(console.error);
        clearInterval(preinitInterval);
    }
}, 1);

// Listen to message events

function split(s) {
    let arr = s.split(" ");
    let continueExec = true;
    while (continueExec) {
        let foundQuote = false;
        let quotePos = 0;
        for (var i = 0; i < arr.length; i++) {
            if (arr[i].startsWith('"')) {
                foundQuote = true;
                quotePos = i;
            }
            if (arr[i].endsWith('"')) {
                if (foundQuote) {
                    let newString = arr[quotePos];
                    let elements = arr.splice(quotePos + 1, i - quotePos);
                    for (var j = 0; j < elements.length; j++) {
                        newString = `${newString} ${elements[j]}`;
                    }
                    newString = newString.substring(1);
                    newString = newString.slice(0, -1);
                    arr[quotePos] = newString;
                    break;
                }
            }
            if (i === arr.length - 1) {
                continueExec = false;
            }
        }
    }
    return arr;
}

client.on("message", message => {
    if (message.author.id === client.user.id) return;
    fireEvent("message", message);
    if (message.content.startsWith(config.command_prefix || "!")) {
        if (message.author.bot) return;
        let sCont = message.content.substring(config.command_prefix.length);
        let guildMSG;
        if (message.guild) {
            guildMSG = message.guild.id;
        }
        console.log("[" + (guildMSG || "") + "]", message.author.tag, "(" + message.author.id + "):", sCont.yellow);
        sCont = sCont.trim();
        //console.log(sCont);
        //sCont = split(sCont);
        sCont = split(sCont);
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
            preventDefault: function () {
                execute = false;
            },
        };
        fireEvent("command", ev, cmd, args, message);
        let command = getCommand(cmd);
        if (command) {
            process.nextTick(() => {
                if (execute) {
                    fireEvent("command_execute", cmd, args, message);
                    try {
                        command.function.apply(this, args);
                        fireEvent("command_success", cmd, args, message);
                    } catch (e) {
                        //console.log("Failed executing".red,cmd.yellow,e.toString().red);
                        console.error(e);
                        fireEvent("command_failed", cmd, args, message, e)
                    }
                } else {
                    fireEvent("command_killed", cmd, args, message)
                }
            });
        } else {
            fireEvent("command_unknown", cmd, args, message)
        }
    } else if (!message.guild) {
        if (!message.author.bot) {
            console.log("[DM]", message.author.tag, "(" + message.author.id + "):", message.content.yellow);
        }
    }
});

client.on("warn", (w) => console.warn("WARN", w));

client.on("ready", () => {
    if (!isReady) {
        fireEvent("ready", bot);
        isReady = true;
    } else {
        fireEvent("reconnect");
    }
    console.log("Logged in as " + client.user.tag.magenta.underline)
});

let stdInterface = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
    terminal: false,
});

stdInterface.on("line", function (line) {
    let spl = split(line);

    let cmd = spl[0];
    spl.shift(); // args

    if (consoleCommands[cmd]) {
        try {
            consoleCommands[cmd].function.apply(this, spl);
        } catch (e) {
            console.error(e);
        }
    } else {
        console.log("Command not found!")
    }
});

process.stdin.resume();//so the program will not close instantly

function exitHandler(options, err) {
    fireEvent("shutdown");
    if (options.cleanup) console.log('Shutting down');
    if (err) console.log(err.stack);
    if (options.exit) process.exit();
}

//do something when app is closing
process.on('exit', exitHandler.bind(null, {cleanup: true}));

//catches ctrl+c event
process.on('SIGINT', exitHandler.bind(null, {exit: true}));

// catches "kill pid" (for example: nodemon restart)
process.on('SIGUSR1', exitHandler.bind(null, {exit: true}));
process.on('SIGUSR2', exitHandler.bind(null, {exit: true}));

//catches uncaught exceptions
process.on('uncaughtException', exitHandler.bind(null, {exit: true}));
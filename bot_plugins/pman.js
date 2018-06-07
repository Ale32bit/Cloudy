/*
    Cloudy Plugin: pman

    Cloudy Discord Bot
    (c) 2018 Ale32bit

    LICENSE: GNU GPLv3 (https://github.com/Ale32bit/Cloudy/blob/master/LICENSE)

    GitHub: https://github.com/Ale32bit/Cloudy
    Discord Tag: Ale32bit#5164
    Cloudy Discord Server: https://discord.gg/jhVJ5mZ
 */
const {Plugin, utils} = require("../cloudy");
const Discord = require("discord.js");
const fs = require("fs");
const path = require("path");
const configPath = path.resolve(__dirname, "config", "permissions.json");

const plugin = new Plugin("pman", {
    name: "Permission Manager",
    version: "2.0.0",
    author: "Ale32bit",
    description: "Node Permission manager",
});

if (!fs.existsSync(configPath)) fs.writeFileSync(configPath, JSON.stringify({
    groups: {
        default: {
            permissions: [
                "basic.hello",
                "basic.help",
                "basic.ping",
                "basic.info",
                "basic.echo",
                "basic.server",
                "basic.invite",
                "fun.cookie",
                "fun.cookies",
                "fun.xkcd",
                "music.music",
                "music.play",
                "music.resume",
                "music.pause",
                "music.skip",
                "music.queue",
                "music.playing"
            ],
        },
        guildowner: {
            permissions: [
                "basic.hello",
                "basic.help",
                "basic.ping",
                "basic.info",
                "basic.echo",
                "basic.server",
                "basic.invite",
                "fun.cookie",
                "fun.cookies",
                "fun.xkcd",
                "music.music",
                "music.play",
                "music.resume",
                "music.pause",
                "music.skip",
                "music.queue",
                "music.playing",
                "pman.pman"
            ],
        },
        admin: {
            permissions: [
                "*",
            ]
        },
    },
    users: {},
    guilds: {},
}, (key, value) => {
    if (value !== null) return value
}, 2));
let corrupted;
let config;
try {
    config = require(configPath);
    corrupted = false;
} catch (e) {
    console.error(e);
    corrupted = true;
}
const updateConf = function () {
    fs.writeFileSync(configPath, JSON.stringify(config, (key, value) => {
        if (value !== null) return value
    }, 2));
    console.log("Updated permission file".yellow)
};

let botConfig;
let botCommands;

const inArray = function (array, value) {
    for (i = 0; i < array.length; i++) {
        if (value === array[i]) return true;
    }
    return false;
};

let client;
let bot;
let parseArgs;

const restricted = [
    "pman.addgperm",
    "pman.addgdefperm",
    "pman.clearguilds",
    "*"
];

const hasPerm = function (node, user, guild) {
    if (node === "native.testpermdeny") return false;
    let allow = true;
    if (node) {
        let pNode = node;
        let group;
        let guigroup = "default";
        let perms = {};
        if (config.users[user.id] && config.users[user.id].group !== "default") {
            group = config.users[user.id].group || undefined;
        }

        if (group) {
            for (let k in config.groups[group].permissions) {
                perms[config.groups[group].permissions[k]] = true;
            }
        }

        if (guild && config.guilds[guild.id].users[user.id]) {
            guigroup = config.guilds[guild.id].users[user.id].group || "default";
        }

        if (guild && guild.ownerID === user.id) {
            group = "guildowner"
        }
        if (group) {
            for (let k in config.groups[group].permissions) {
                perms[config.groups[group].permissions[k]] = true;
            }
        }
        if (guild) {
            for (let k in config.guilds[guild.id].groups[guigroup].permissions) {
                perms[config.guilds[guild.id].groups[guigroup].permissions[k]] = true;
            }
        }

        if (perms["*"]) {
            allow = true;
        } else if (perms[pNode]) {
            allow = true;
        } else {
            allow = false;
        }
    }
    return allow;
};

const isRestricted = function (node) {
    if (typeof(node) !== "string") {
        throw new Error("string expected, got " + typeof(node))
    }

    if (inArray(restricted, node)) return true;

    let mid = node.substring(0, node.match(/\./).index); // module id
    let np = node.substring(node.match(/\./).index + 1);
    let m = bot.getPlugin(mid);
    if (!m) {
        return false;
    }

    for (let k in m.commands) {
        let v = m.commands[k];
        if (typeof(v.extra) === "object") {
            if (v.extra.permission && v.extra.permission === np) {
                if (v.extra.restricted) return true;
            }
        }
    }
    return false;
};

plugin.on("load", (cloudy) => {
    client = cloudy.client;
    bot = cloudy;
    parseArgs = utils.parseArgs;
    botConfig = require("../config.json");
    if (corrupted) {
        console.log("Permissions Database is corrupted!".redBG);
        return;
    }
    updateConf();

    plugin.setAPI("hasPermission", function (perm, user, guild) {
        if (typeof(perm) !== "string") {
            throw new TypeError("Expected node to be string");
        }

        return hasPerm(perm, user, guild);
    });

    plugin.setAPI("isRestricted", function (perm, user, guild) {
        if (typeof(perm) !== "string") {
            throw new TypeError("Expected node to be string");
        }
        return isRestricted(perm, user, guild)
    });

    let groups = [];
    for (let k in config.groups) {
        groups.push(k)
    }
    let users = [];
    for (let k in config.users) {
        users.push(k)
    }
    let gids = 0;
    for (let k in config.guilds) {
        gids++;
    }
    console.log("GGroups: " + (groups.join(", ")).blue);
    console.log("GUsers: " + (users.join(", ")).blue);
    console.log("Guilds: " + (gids).toString().blue);
});

plugin.on("ready", () => {
    botCommands = {};
    for (let id in bot.getPlugins) {
        let pl = bot.getPlugin(id);

        for (let cmd in pl.commands) {
            botCommands[cmd] = pl.commands[cmd];
        }
    }
});

plugin.on("message", function (message) {
    if (message.guild) {
        if (!config.guilds) config.guilds = {};
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
});

plugin.on("command", function (e, cmd, args, message) {
    if (corrupted) {
        console.log("Corrupted Database, user command denied!".redBG);
        e.preventDefault();
    }
    if (botCommands[cmd] && typeof(botCommands[cmd].extra) === "object" && botCommands[cmd].extra.permission) {
        let node = botCommands[cmd].id + "." + botCommands[cmd].extra.permission;
        let can = hasPerm(node, message.author, message.guild);
        if (!can) {
            message.channel.send("Sorry, you don't have `" + node + "` permission node!")
                .then(msg => {
                    msg.delete({timeout: 5000});
                })
                .catch(e => {
                });
            console.log(("[" + node + "]").cyan, message.author.tag, "(" + message.author.id + "):", cmd.red, (args.join(" ")).red);
            e.preventDefault();
        }
        return true;
    }
});

const commands = {
    help: function (message) {
        let embed = new Discord.MessageEmbed();
        embed.setColor("#7289da");
        embed.setFooter("Cloudy © 2018 Ale32bit", client.user.avatarURL);
        embed.setTimestamp(new Date());
        embed.setTitle("Permission Manager");
        embed.addField("**Commands**", "`pman <subcommand> [args,...]`");
        embed.addField("*groups*", "List all guild groups");
        embed.addField("addgroup <name>", "Add a permission group");
        embed.addField("delgroup <name>", "Delete a permission group");
        embed.addField("addperm <group> <node>", "Add a permission node to a group");
        embed.addField("delperm <group> <node>", "Delete a permission node to a group");
        embed.addField("listperms <group>", "Get a list of all permission nodes on a group");
        embed.addField("setgroup <user> <group>", "Set a group on a user");
        embed.addField("unsetgroup <user>", "Set default group on a user");
        embed.addField("resetdefault", "Reset the guild default group and apply global default permissions");
        embed.addField("*globalperms <group>*", "List all permission nodes of a global group");
        embed.addField("*globalgroups*", "List all global groups");
        embed.addField("addgperm <perm> <group>", "Add a permission to a global group (Only bot admins)");
        embed.addField("addgdefperm <perm>", "Add a permission to all guilds in default group (Only bot admins)");
        embed.addField("clearguilds", "Clear abandoned guilds");
        message.channel.send(embed)
    },
    groups: function (message) {
        if (!message.guild) {
            message.channel.send("This is not a guild!");
            return;
        }
        let groups = [];
        for (let k in config.guilds[message.guild.id].groups) {
            groups.push(k)
        }
        message.channel.send("**pman groups for this guild**\n" + groups.join(", "))
    },
    addgroup: function (message, name) {
        if (!name) {
            message.channel.send("Missing parameter: `name`!");
            return;
        }
        if (config.guilds[message.guild.id].groups[name]) {
            message.channel.send("`" + name + "` group already exists!");
            return;
        }
        config.guilds[message.guild.id].groups[name] = {
            permissions: [],
        };
        updateConf();
        message.channel.send("Group `" + name + "` created!")
    },
    delgroup: function (message, name) {
        if (!name) {
            message.channel.send("Missing parameter: `name`!");
            return;
        }
        if (name === "default") {
            message.channel.send("You cannot delete default group!");
            return;
        }
        if (!config.guilds[message.guild.id].groups[name]) {
            message.channel.send("`" + name + "` does not exist!");
            return;
        }
        config.guilds[message.guild.id].groups[name] = undefined;
        updateConf();
        message.channel.send("Group `" + name + "` deleted!")
    },
    addperm: function (message, group, node) {
        if (!group) {
            message.channel.send("Missing parameter: `group`!");
            return;
        }
        if (!config.guilds[message.guild.id].groups[group]) {
            message.channel.send("`" + group + "` does not exist!");
            return;
        }
        if (inArray(config.guilds[message.guild.id].groups[group].permissions, node)) {
            message.channel.send("`" + node + "` is already in " + group + "!");
            return;
        }
        if (isRestricted(node)) {
            message.channel.send("Cannot add `" + node + "` because restricted!");
            return;
        }
        config.guilds[message.guild.id].groups[group].permissions.push(node);
        updateConf();
        message.channel.send("`" + node + "` added to `" + group + "`!")
    },
    delperm: function (message, group, node) {
        if (!group) {
            message.channel.send("Missing parameter: `group`!");
            return;
        }
        if (!config.guilds[message.guild.id].groups[group]) {
            message.channel.send("`" + group + "` does not exist!");
            return;
        }
        if (!inArray(config.guilds[message.guild.id].groups[group].permissions, node)) {
            message.channel.send("`" + node + "` does no exist in " + group + "!");
            return;
        }
        let g = config.guilds[message.guild.id].groups[group].permissions;
        let perms = [];
        for (let i = 0; i < g.length; i++) {
            if (g[i] !== node) {
                perms.push(g[i])
            }
        }
        config.guilds[message.guild.id].groups[group].permissions = perms;
        updateConf();
        message.channel.send("`" + node + "` removed from `" + group + "`!")
    },
    listperms: function (message, group) {
        if (!group) {
            message.channel.send("Missing parameter: `group`!");
            return;
        }
        if (!config.guilds[message.guild.id].groups[group]) {
            message.channel.send("`" + group + "` does not exist!");
            return;
        }
        message.channel.send("`" + group + "` permissions:\n" + config.guilds[message.guild.id].groups[group].permissions.join(", "))
    },
    setgroup: function (message, user, group) {
        if (!user) {
            message.channel.send("Missing parameter: `user`!");
            return;
        }
        if (!group) {
            message.channel.send("Missing parameter: `group`!");
            return;
        }
        if (!config.guilds[message.guild.id].groups[group]) {
            message.channel.send("`" + group + "` does not exist!");
            return;
        }
        utils.getUser(client, user)
            .then((user) => {
                if (user.id === message.guild.ownerID) {
                    message.channel.send("You cannot change server owner group!");
                    return
                }
                config.guilds[message.guild.id].users[user.id] = {
                    group: group,
                };
                updateConf();
                message.channel.send(user.tag + " now inherits all permissions from `" + group + "`!")
            })
            .catch((e) => {
                message.channel.send("`" + user + "` does not exist!");
            });
    },
    unsetgroup: function (message, user) {
        if (!user) {
            message.channel.send("Missing parameter: `user`!");
            return;
        }
        utils.getUser(client, user)
            .then((user) => {
                if (user.id === message.guild.ownerID) {
                    message.channel.send("You cannot change server owner group!");
                    return
                }
                config.guilds[message.guild.id].users[user.id] = undefined;
                updateConf();
                message.channel.send(user.tag + " group set to `default`!")
            })
            .catch((e) => {
                message.channel.send("`" + user + "` does not exist!");
            });
    },
    resetdefault: function (message) {
        config.guilds[message.guild.id].groups.default = config.groups.default;
        updateConf();
        if (Math.floor(Math.random() * 100) > 95) {
            message.channel.send("boneless chicken");
        } else {
            message.channel.send("Server group `default` reset!");
        }
    },
    globalperms: function (message, group) {
        if (!config.groups[group]) {
            message.channel.send("This global group does not exist!");
            return;
        }
        message.channel.send("**global group `" + group + "` permissions**\n" + config.groups[group].permissions.join(", "))
    },
    globalgroups: function (message) {
        let groups = [];
        for (let k in config.groups) {
            groups.push(k)
        }
        message.channel.send("**pman global groups**\n" + groups.join(", "))
    },
    addgperm: function (message, perm, group, allguilds) {
        if (!hasPerm("pman.addgperm", message.author, message.guild)) {
            message.channel.send("Sorry, you don't have `pman.addgperm` permission node!");
            return;
        }
        allguilds = allguilds || false;
        if (!perm) {
            message.channel.send("Missing parameter: `user`!");
            return;
        }
        if (!group) {
            message.channel.send("Missing parameter: `group`!");
            return;
        }
        if (allguilds) {

        } else {
            if (!config.groups[group]) {
                message.channel.send("`" + group + "` does not exist!");
                return;
            }
        }
        if (allguilds) {
            let i = 0;
            for (let guild in config.guilds) {
                if (config.guilds[guild].groups[group]) {
                    i++;
                    config.guilds[guild].groups[group].permissions.push(perm)
                }
            }
            message.channel.send("Added " + perm + " to all groups named " + group + " on all guilds!\n" + i)
        } else {
            config.groups[group].permissions.push(perm);
            message.channel.send("Added " + perm + " to global " + group);
        }
        updateConf();
    },
    addgdefperm: function (message, perm) {
        if (!hasPerm("pman.addgdefperm", message.author, message.guild)) {
            message.channel.send("Sorry, you don't have `pman.addgdefperm` permission node!");
            return;
        }
        if (!perm) {
            message.channel.send("Missing parameter: `user`!");
            return;
        }
        let i = 0;
        for (let guild in config.guilds) {
            if (config.guilds[guild].groups["default"]) {
                i++;
                config.guilds[guild].groups["default"].permissions.push(perm)
            }
        }
        message.channel.send("Added " + perm + " to default group on all guilds!\n" + i);
        updateConf();
    },
    clearguilds: function (message) {
        if (!hasPerm("pman.clearguilds", message.author, message.guild)) {
            message.channel.send("Sorry, you don't have `pman.clearguilds` permission node!");
            return;
        }
        let guilds = client.guilds;
        let cleared = 0;
        for (let id in config.guilds) {
            if (!guilds.get(id)) {
                config.guilds[id] = null;
                delete config.guilds[id];
                cleared++;
            }
        }
        updateConf();
        message.channel.send("Cleared " + cleared + " abandoned guilds!")
    },
};

plugin.setCommand("pman", function (message, cmd) {
    let sargs = utils.parseArgs(arguments, 2);
    let args = [];
    args.push(message);
    for (let i = 0; i < sargs.length; i++) {
        args.push(sargs[i])
    }
    if (cmd) {
        if (commands[cmd]) {
            commands[cmd].apply(this, args)
        } else {
            message.channel.send("Subcommand not found!")
        }
    } else {
        commands["help"](message);
    }
}, "`<subcommand> [args,...]` Manage permissions.", {
    permission: "pman"
});

module.exports = plugin;
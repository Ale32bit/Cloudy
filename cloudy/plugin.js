/*
    Plugin module

    Cloudy Discord Bot Engine 2.2.2
    (c) 2018 Ale32bit

    LICENSE: GNU GPLv3 (https://github.com/Ale32bit/Cloudy/blob/master/LICENSE)

    GitHub: https://github.com/Ale32bit/Cloudy
    Discord Tag: Ale32bit#5164
    Cloudy Discord Server: https://discord.gg/jhVJ5mZ

 */

/**
 * Create a new plugin for the bot
 * @class Plugin Plugin
 * @type {Plugin}
 */

let EventEmitter = require("events");

const Plugin = class Plugin extends EventEmitter {
    /**
     * Create a plugin for the cloudy
     * @param {string} id Plugin ID
     * @param {object} [options] Options
     * @param {string} [options.name] Plugin name
     * @param {string} [options.version] Plugin version
     * @param {string} [options.author] Plugin author
     * @param {string} [options.description] Plugin description
     * @param {string} [options.emoji] Plugin emoji used as icon in help list
     * @param {boolean} [options.override] Override previous loaded plugin with similar ID
     */
    constructor(id, options = {}) {
        super();
        if (typeof(id) !== "string") throw new TypeError("Expected id to be string");
        if (typeof(options) !== "object") throw new TypeError("Expected options to be object");
        this.id = id;
        this.name = options.name || this.id;
        this.version = options.version || "1.0.0";
        this.author = options.author || "n/a";
        this.description = options.description || "n/a";
        this.emoji = options.emoji || false;

        this.override = options.override || false;

        this.commands = {};
        this.consoleCommands = {};
        this.api = {};
    }

    /**
     * Set a new command to the bot
     * @deprecated since version 2.2.2, use addCommand
     * @param {string} name Command name
     * @param {function} func Command function to call
     * @param {string} [description] Description message of the command
     * @param {object} [extra] Object for extra data (i.e. permission node)
     */
    setCommand(name, func, description, extra) {
        console.warn(this.id, "Use of setCommand is deprecated and will be removed in future: " + name);
        if (typeof(name) !== "string") throw new TypeError("Expected name to be string");
        if (typeof(func) !== "function") throw new TypeError("Expected func to be function");
        if (description && typeof(description) !== "string") throw new TypeError("Expected description to be string");
        if (extra && typeof(extra) !== "object") throw new TypeError("Expected extra to be object");

        this.commands[name] = {
            function: func,
            description: description,
            extra: extra,
            id: this.id,
        };
    };

    /**
     * Add a new command to the bot
     * @param {string} name Command name
     * @param {function} func Command function to call
     * @param {object|string} [options] Options of the command
     * @param {string} [options.description] Description of command
     * @param {string} [options.help] Full help message of command
     *
     * @param {object} [extra] Object for extra data (i.e. permission, restricted)
     */
    addCommand(name, func, options = {}, extra = {}) {
        if (typeof(name) !== "string") throw new TypeError("Expected name to be string");
        if (typeof(func) !== "function") throw new TypeError("Expected func to be function");
        if (extra && typeof(extra) !== "object") throw new TypeError("Expected extra to be object");

        if (typeof options === "string") {
            let desc = options;
            options = {};
            options.description = desc;
        }

        this.commands[name] = {
            function: func,
            options: options,
            extra: extra || {},
            id: this.id,
        };
    };

    /**
     * Delete a command
     * @param {string} name Command name
     */
    deleteCommand(name) {
        if (typeof(name) !== "string") throw new TypeError("Expected name to be string");

        delete this.commands[name];
    }

    /**
     * Add a console command
     * @param {string} name Command name
     * @param {function} func Function
     * @param {string} help Help message
     */
    addConsoleCommand(name, func, help) {
        if (typeof(name) !== "string") throw new TypeError("Expected name to be string");
        if (typeof(func) !== "function") throw new TypeError("Expected func to be function");
        if (typeof(help) !== "string") throw new TypeError("Expected help to be string");

        this.consoleCommands[name] = {
            function: func,
            help: help,
            id: this.id,
        };
    }

    /**
     * Delete a console command
     * @param name
     */
    deleteConsoleCommand(name) {
        if (typeof(name) !== "string") throw new TypeError("Expected name to be string");

        delete this.consoleCommands[name];
    }

    /**
     * Set an API function to be called by other plugins
     * @param {string} name Function name
     * @param {function} func Function to call
     */
    setAPI(name, func) {
        if (typeof(name) !== "string") throw new TypeError("Expected name to be string");
        if (typeof(func) !== "function") throw new TypeError("Expected func to be function");

        this.api[name] = func;
    }

    /**
     * Delete an API function
     * @param {string} name
     */
    deleteAPI(name) {
        if (typeof(name) !== "string") throw new TypeError("Expected name to be string");

        delete this.api[name];
    }

    /**
     * Set permissions manager
     * @param {boolean} boo Set this function for other plugins to see if users have permissions
     */
    setPermissionsManager(boo) {
        this.permissionsManager = boo || false;
    }

    /**
     * Call an API
     * @deprecated Use bot.call
     * @param {string} id Plugin ID
     * @param {string} name Function name
     * @returns {function} Function
     */
    call(id, name) {

    }

    /**
     * Log anything
     * @param {*} args Arguments Everything to log
     */
    log(...args) {
        args.unshift(`[${this.name}]`);
        console.log.apply(this, args)
    }

    /**
     * Warn anything
     * @param {*} args Arguments Everything log as a warning
     */
    warn(...args) {
        args.unshift(`[${this.name}]`);
        console.warn.apply(this, args)
    }

    /**
     * Error anything
     * @param {*} args Arguments Everything to output as error
     */
    error(...args) {
        args.unshift(`[${this.name}]`);
        console.error.apply(this, args)
    }

};


module.exports = Plugin;
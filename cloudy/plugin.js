/*
    Plugin module

    Cloudy Discord Bot Engine 2.0
    (c) 2018 Ale32bit

    LICENSE: GNU GPLv3 (https://github.com/Ale32bit/Cloudy/blob/master/LICENSE)

    GitHub: https://github.com/Ale32bit/Cloudy
    Discord Tag: Ale32bit#5164
    Cloudy Discord Server: https://discord.gg/jhVJ5mZ

 */

const Plugin = class Plugin {
    /**
     * Create a plugin for the cloudy
     * @param {string} id Plugin ID
     * @param {object} [options] Options
     * @param {string} [options.name] Plugin name
     * @param {string} [options.version] Plugin version
     * @param {string} [options.author] Plugin author
     * @param {string} [options.description] Plugin description
     * @param {boolean} [options.override] Override previous loaded plugin with similar ID
     */
    constructor(id,options = {}){
        if(typeof(id) !== "string") throw new TypeError("Expected id to be string");
        if(typeof(options) !== "object") throw new TypeError("Expected options to be object");
        this.id = id;
        this.name = options.name || this.id;
        this.version = options.version || "1.0.0";
        this.author = options.author || "n/a";
        this.description = options.description || "n/a";
        this.override = options.override || false;

        this.commands = {};
        this.api = {};
        this.events = {};
    }

    /**
     * Set a new command for the cloudy
     * @param {string} name Command name
     * @param {function} func Command function to call
     * @param {string} [help] Help message
     * @param {object} [extra] Object for extra data (i.e. permission node)
     */
    setCommand(name,func,help,extra){
        if(typeof(name) !== "string") throw new TypeError("Expected name to be string");
        if(typeof(func) !== "function") throw new TypeError("Expected func to be function");
        if(help && typeof(help) !== "string") throw new TypeError("Expected help to be string");
        if(extra && typeof(extra) !== "object") throw new TypeError("Expected extra to be object");

        this.commands[name] = {
            function: func,
            help: help,
            extra: extra,
            id: this.id,
        };
    };

    /**
     * Delete a command
     * @param {string} name Command name
     */
    deleteCommand(name){
        if(typeof(name) !== "string") throw new TypeError("Expected name to be string");

        delete this.commands[name];
    }

    /**
     * Set an API function to be called by other plugins
     * @param {string} name Function name
     * @param {function} func Function to call
     */
    setAPI(name,func){
        if(typeof(name) !== "string") throw new TypeError("Expected name to be string");
        if(typeof(func) !== "function") throw new TypeError("Expected func to be function");

        this.api[name] = func;
    }

    /**
     * Delete an API function
     * @param {string} name
     */
    deleteAPI(name){
        if(typeof(name) !== "string") throw new TypeError("Expected name to be string");

        delete this.api[name];
    }

    /**
     * Call an API
     * @param {string} id Plugin ID
     * @param {string} name Function name
     * @returns {function} Function
     */
    call(id,name){
        if(typeof(id) !== "string") throw new TypeError("Expected id to be string");
        if(typeof(name) !== "string") throw new TypeError("Expected name to be string");


    }

    /**
     * Event system
     * @param {string} event Event name
     * @param {function} cb Callback
     * @returns {number} Event listener ID
     */
    on(event,cb){
        if(typeof(event) !== "string") throw new TypeError("Expected event to be string");
        if(typeof(cb) !== "function") throw new TypeError("Expected cb to be function");

        if(!this.events[event]) this.events[event] = [];
        this.events[event].push(cb);

        return this.events[event].length;
    }

    /**
     * Delete event listener
     * @param {string} event Event name
     * @param {number} id Event Listener ID
     */
    deleteListener(event,id){
        if(typeof(event) !== "string") throw new TypeError("Expected event to be string");
        if(typeof(id) !== "number") throw new TypeError("Expected id to be number");

        if(this.events[event] && this.events[event][id]) {
            this.events[event].splice(id, 1)
        }
    }

    /**
     * Log
     * @param {...*} log Log
     */
};

module.exports = Plugin;

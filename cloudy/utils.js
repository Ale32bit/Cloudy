/*
    Utils module

    Cloudy Discord Bot Engine 2.0
    (c) 2018 Ale32bit

    LICENSE: GNU GPLv3 (https://github.com/Ale32bit/Cloudy/blob/master/LICENSE)

    GitHub: https://github.com/Ale32bit/Cloudy
    Discord Tag: Ale32bit#5164
    Cloudy Discord Server: https://discord.gg/jhVJ5mZ

 */

const utils = {};

/**
 * Parse command arguments
 * @param {object} args arguments
 * @param {number|boolean} [index] Start from index
 * @returns {Array} parsed arguments
 */
utils.parseArgs = function(args,index){
    index = index || 0;
    if(typeof(index) === "boolean" && index) index = 1;
    let argss = [];
    let fargs = [];
    for(let k in args){
        argss.push(args[k])
    }
    for(let i = index; i<argss.length;i++){
        fargs.push(argss[i])
    }
    return fargs;
};


/**
 * Get User from snowflake ID
 * @param {Client} client Discord Client
 * @param {string} id Snowflake
 * @returns {*}
 */
utils.getUser = function(client,id){
    if(typeof(id) !== "string") throw new TypeError("Expected id to be string");
    id=id.replace(/^<@/,"");
    id=id.replace(/>$/,"");
    return client.fetchUser(id);
};

module.exports = utils;
const { Plugin } = require("../cloudy");
const colors = require("colors");

const plugin = new Plugin("hello",{
    name: "Hello",
    version: "2.0",
    author: "Ale32bit",
    description: "Hello world!",
    override: true,
});

plugin.setAPI("hello",()=>{
    return "Hello"
});

plugin.setCommand("hello",(message)=>{
    message.channel.send("Hello");
},"Hello World!",{permission:"hello"});

module.exports = plugin;
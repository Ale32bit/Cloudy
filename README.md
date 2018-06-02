# Cloudy Engine

Cloudy Engine is a simple light-weight modular Discord bot that uses [discord.js](https://discord.js.org/) library as interface.

This engine is designed to help develop commands and other functionalities in the form of plugins.

## Setup

1. Clone the repository to an empty folder
2. Run `npm i`
3. Run `node index` and wait for the configuration file to generate
4. Follow the guide in the console and modify config.json
5. Run `node index` again

### Configuration file

The configuration file is an auto generated JSON file stored in the directory root.
It contains the client token, plugins directory path, command prefix and shards count.

Here is an example of the file

```json
{
  "token":"GC3M_th1s_MjMzMDQ2_15_3.f_4_LzOA.hnQz_f4k3_9c9StZ2Lda_t0k3n_S5t4kE",
  "plugins_dir": "bot_plugins",
  "command_prefix": "!",
  "shards": "3"
}
```

### Plugins

As you may have read, this is a modular bot that uses plugins to add functionalities. These plugins are located by default in the directory `bot_plugins`.

#### Creating a plugin

Since the engine uses `require()` to load the plugins, you can either create a file or a directory containing the `index.js`.

To create the plugin you first need to require the Plugin class from cloudy.

Example :

```javascript
const cloudy = require("../cloudy")
const Plugin = cloudy.Plugin

// or better

const { Plugin } = require("../cloudy")
```

After requiring you call a new class which will contain: plugin ID, name, author, version and description (defining ID is required)
The constructor wants 2 arguments, the first is required.

Example:

```javascript
const { Plugin } = require("../cloudy")

const plugin = new Plugin("hello", { // "hello" is the plugin ID
  name: "Hello world!" // If missing ID will be used
  version: "1.0.0",
  author: "Foo bar",
  description: "Have a nice day!",
})
```

You may now want to add a simple command, like `hello`.
Creating a command is simple: you just need to call `plugin.setCommand(commandName, callback)`.

The callback will get the [discord.js message container](https://discord.js.org/#/docs/main/stable/class/Message) as first argument, the rest will be command arguments sent by the user.

Example:

```javascript
plugin.setCommand("hello", function(message){
  message.channel.send("Hello world!")
})
```

To make the bot loads the plugin you need to export it as a normal module: `module.exports = plugin;`

The result will be:

```javascript
const { Plugin } = require("../cloudy")

const plugin = new Plugin("hello", { // "hello" is the plugin ID
  name: "Hello world!" // If missing ID will be used
  version: "1.0.0",
  author: "Foo bar",
  description: "Have a nice day!",
})

plugin.setCommand("hello", function(message){
  message.channel.send("Hello world!")
})

module.exports = plugin;
```

Now run the bot and call the command `hello` with its command prefix.

![Result](https://i.ale32bit.me/i1ea7.png)


### Warning about setting commands with dynamic arguments

There are 2 types of functions:
* arrow functions `(arg1, arg2) => { /* Code here */ }`
* function declaration `function(arg1, arg2){ /* Code here */ }`

Arrow functions don't accept `arguments` and will require defined variables.

Use a declared function for these types of commands.

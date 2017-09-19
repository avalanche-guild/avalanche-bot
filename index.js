const util = require('util');

const _ = require('lodash');
const Discord = require('discord.js');
const Bluebird = require('bluebird');

const bot = new Discord.Client();

const commands = {
    gamble: require('./commands/gamble'),
};

bot.on('ready', () => {
    console.log('I am ready!');
});

bot.on('message', async (message) => {
    console.log(`[${message.author.username}] ${message.content}`);

    if (message.content === 'ping') {
        message.reply(`pong <#${message.channel.id}>`);
        return;
    }

    if (message.content[0] === '!') {
        const [command, ...args] = message.content.replace(/^!/, '').split(' ');

        message.command = command;
        message.args = args;
    }

    await Bluebird.all(_.map(commands, async (command, commandName) => {
        try {
            await command.process(message);
        } catch (err) {
            console.error(`Error from ${commandName}`, err);
        }
    }));
});

// get your token at https://discordapp.com/developers/applications/me
bot.login(process.env.DISCORD_TOKEN).catch((err) => {
    console.error(err);
});

const util = require('util');

const Discord = require('discord.js');
const bot = new Discord.Client();

bot.on('ready', () => {
    console.log('I am ready!');
});

bot.on('message', async (message) => {
    console.log(`${message.author.username}: ${message.content}`);
    if (message.content === 'ping') {
        message.reply('pong');
    }
});

// get your token at https://discordapp.com/developers/applications/me
bot.login(process.env.DISCORD_TOKEN).catch((err) => {
    console.error(err);
});

function log(...args) {
    args.forEach((arg) => {
        console.log(util.inspect(arg, { depth: 8, colors: true }));
    });
}

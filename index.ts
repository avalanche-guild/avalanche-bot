import * as _ from 'lodash';
import { Client, Message, TextChannel } from 'discord.js';
import * as Bluebird from 'bluebird';

import { command as gamble } from './commands/gamble';

export class CommandMessage extends Message {
    command: string;
    args: string[];

    // extending Message props
    channel: TextChannel;
}

export type Command = (args: CommandMessage) => Promise<void>;

export type Commands = {
    [commandName: string]: Command,
}

const bot = new Client();

const commands: Commands = {
    gamble,
};

bot.on('ready', () => {
    console.log('I am ready!');
});

bot.on('message', async (originalMessage) => {
    console.log(`[${originalMessage.author.username}] ${originalMessage.content}`);

    if (originalMessage.content === 'ping') {
        originalMessage.reply(`pong <#${originalMessage.channel.id}>`);
        return;
    }

    const message: CommandMessage = <CommandMessage>{
        ...originalMessage,
        command: null,
        args: [],
    };

    if (message.content[0] === '!') {
        const [command, ...args] = message.content.replace(/^!/, '').split(' ');

        message.command = command;
        message.args = args;
    }

    await Bluebird.all(_.map(commands, async (command: Command, commandName: string) => {
        try {
            await command(message);
        } catch (err) {
            console.error(`Error from ${commandName}`, err);
        }
    }));
});

// get your token at https://discordapp.com/developers/applications/me
bot.login(process.env.DISCORD_TOKEN).catch((err) => {
    console.error(err);
});

"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const _ = require("lodash");
const discord_js_1 = require("discord.js");
const Bluebird = require("bluebird");
const chalk = require("chalk");
const gamble_1 = require("./commands/gamble");
class CommandMessage extends discord_js_1.Message {
}
exports.CommandMessage = CommandMessage;
const bot = new discord_js_1.Client();
const commands = {
    gamble: gamble_1.command,
};
bot.on('ready', () => {
    console.log('I am ready!');
});
bot.on('message', async (originalMessage) => {
    try {
        console.log(`[${chalk.yellow(originalMessage.author.username)}@${chalk.cyan(originalMessage.channel.name)}] ${originalMessage.content}`);
        if (originalMessage.content === 'ping') {
            originalMessage.reply(`pong <#${originalMessage.channel.id}>`);
            return;
        }
        const message = Object.assign({}, originalMessage, { command: null, args: [] });
        if (message.content[0] === '!') {
            const [command, ...args] = message.content.replace(/^!/, '').split(' ');
            message.command = _.camelCase(command);
            message.args = args;
        }
        await Bluebird.all(_.map(commands, async (command, commandName) => {
            try {
                await command(message);
            }
            catch (err) {
                console.error(`Error from ${commandName}:`, err);
            }
        }));
    }
    catch (err) {
        console.error('Unexpected error:', err);
    }
});
// get your token at https://discordapp.com/developers/applications/me
bot.login(process.env.DISCORD_TOKEN).catch((err) => {
    console.error(err);
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaW5kZXguanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi9pbmRleC50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOztBQUFBLDRCQUE0QjtBQUM1QiwyQ0FBMEQ7QUFDMUQscUNBQXFDO0FBQ3JDLCtCQUErQjtBQUUvQiw4Q0FBc0Q7QUFFdEQsb0JBQTRCLFNBQVEsb0JBQU87Q0FNMUM7QUFORCx3Q0FNQztBQVFELE1BQU0sR0FBRyxHQUFHLElBQUksbUJBQU0sRUFBRSxDQUFDO0FBRXpCLE1BQU0sUUFBUSxHQUFhO0lBQ3ZCLE1BQU0sRUFBTixnQkFBTTtDQUNULENBQUM7QUFFRixHQUFHLENBQUMsRUFBRSxDQUFDLE9BQU8sRUFBRTtJQUNaLE9BQU8sQ0FBQyxHQUFHLENBQUMsYUFBYSxDQUFDLENBQUM7QUFDL0IsQ0FBQyxDQUFDLENBQUM7QUFFSCxHQUFHLENBQUMsRUFBRSxDQUFDLFNBQVMsRUFBRSxLQUFLLEVBQUUsZUFBZTtJQUNwQyxJQUFJLENBQUM7UUFDRCxPQUFPLENBQUMsR0FBRyxDQUFDLElBQUksS0FBSyxDQUFDLE1BQU0sQ0FBQyxlQUFlLENBQUMsTUFBTSxDQUFDLFFBQVEsQ0FBQyxJQUFJLEtBQUssQ0FBQyxJQUFJLENBQWUsZUFBZSxDQUFDLE9BQVEsQ0FBQyxJQUFJLENBQUMsS0FBSyxlQUFlLENBQUMsT0FBTyxFQUFFLENBQUMsQ0FBQztRQUV4SixFQUFFLENBQUMsQ0FBQyxlQUFlLENBQUMsT0FBTyxLQUFLLE1BQU0sQ0FBQyxDQUFDLENBQUM7WUFDckMsZUFBZSxDQUFDLEtBQUssQ0FBQyxVQUFVLGVBQWUsQ0FBQyxPQUFPLENBQUMsRUFBRSxHQUFHLENBQUMsQ0FBQztZQUMvRCxNQUFNLENBQUM7UUFDWCxDQUFDO1FBRUQsTUFBTSxPQUFPLEdBQW1CLGtCQUN6QixlQUFlLElBQ2xCLE9BQU8sRUFBRSxJQUFJLEVBQ2IsSUFBSSxFQUFFLEVBQUUsR0FDWCxDQUFDO1FBRUYsRUFBRSxDQUFDLENBQUMsT0FBTyxDQUFDLE9BQU8sQ0FBQyxDQUFDLENBQUMsS0FBSyxHQUFHLENBQUMsQ0FBQyxDQUFDO1lBQzdCLE1BQU0sQ0FBQyxPQUFPLEVBQUUsR0FBRyxJQUFJLENBQUMsR0FBRyxPQUFPLENBQUMsT0FBTyxDQUFDLE9BQU8sQ0FBQyxJQUFJLEVBQUUsRUFBRSxDQUFDLENBQUMsS0FBSyxDQUFDLEdBQUcsQ0FBQyxDQUFDO1lBRXhFLE9BQU8sQ0FBQyxPQUFPLEdBQUcsQ0FBQyxDQUFDLFNBQVMsQ0FBQyxPQUFPLENBQUMsQ0FBQztZQUN2QyxPQUFPLENBQUMsSUFBSSxHQUFHLElBQUksQ0FBQztRQUN4QixDQUFDO1FBRUQsTUFBTSxRQUFRLENBQUMsR0FBRyxDQUFDLENBQUMsQ0FBQyxHQUFHLENBQUMsUUFBUSxFQUFFLEtBQUssRUFBRSxPQUFnQixFQUFFLFdBQW1CO1lBQzNFLElBQUksQ0FBQztnQkFDRCxNQUFNLE9BQU8sQ0FBQyxPQUFPLENBQUMsQ0FBQztZQUMzQixDQUFDO1lBQUMsS0FBSyxDQUFDLENBQUMsR0FBRyxDQUFDLENBQUMsQ0FBQztnQkFDWCxPQUFPLENBQUMsS0FBSyxDQUFDLGNBQWMsV0FBVyxHQUFHLEVBQUUsR0FBRyxDQUFDLENBQUM7WUFDckQsQ0FBQztRQUNMLENBQUMsQ0FBQyxDQUFDLENBQUM7SUFDUixDQUFDO0lBQUMsS0FBSyxDQUFDLENBQUMsR0FBRyxDQUFDLENBQUMsQ0FBQztRQUNYLE9BQU8sQ0FBQyxLQUFLLENBQUMsbUJBQW1CLEVBQUUsR0FBRyxDQUFDLENBQUM7SUFDNUMsQ0FBQztBQUNMLENBQUMsQ0FBQyxDQUFDO0FBRUgsc0VBQXNFO0FBQ3RFLEdBQUcsQ0FBQyxLQUFLLENBQUMsT0FBTyxDQUFDLEdBQUcsQ0FBQyxhQUFhLENBQUMsQ0FBQyxLQUFLLENBQUMsQ0FBQyxHQUFHO0lBQzNDLE9BQU8sQ0FBQyxLQUFLLENBQUMsR0FBRyxDQUFDLENBQUM7QUFDdkIsQ0FBQyxDQUFDLENBQUMifQ==
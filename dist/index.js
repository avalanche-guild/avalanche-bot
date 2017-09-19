"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const _ = require("lodash");
const discord_js_1 = require("discord.js");
const Bluebird = require("bluebird");
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
    console.log(`[${originalMessage.author.username}] ${originalMessage.content}`);
    if (originalMessage.content === 'ping') {
        originalMessage.reply(`pong <#${originalMessage.channel.id}>`);
        return;
    }
    const message = Object.assign({}, originalMessage, { command: null, args: [] });
    if (message.content[0] === '!') {
        const [command, ...args] = message.content.replace(/^!/, '').split(' ');
        message.command = command;
        message.args = args;
    }
    await Bluebird.all(_.map(commands, async (command, commandName) => {
        try {
            await command(message);
        }
        catch (err) {
            console.error(`Error from ${commandName}`, err);
        }
    }));
});
// get your token at https://discordapp.com/developers/applications/me
bot.login(process.env.DISCORD_TOKEN).catch((err) => {
    console.error(err);
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaW5kZXguanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi9pbmRleC50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOztBQUFBLDRCQUE0QjtBQUM1QiwyQ0FBMEQ7QUFDMUQscUNBQXFDO0FBRXJDLDhDQUFzRDtBQUV0RCxvQkFBNEIsU0FBUSxvQkFBTztDQU0xQztBQU5ELHdDQU1DO0FBUUQsTUFBTSxHQUFHLEdBQUcsSUFBSSxtQkFBTSxFQUFFLENBQUM7QUFFekIsTUFBTSxRQUFRLEdBQWE7SUFDdkIsTUFBTSxFQUFOLGdCQUFNO0NBQ1QsQ0FBQztBQUVGLEdBQUcsQ0FBQyxFQUFFLENBQUMsT0FBTyxFQUFFO0lBQ1osT0FBTyxDQUFDLEdBQUcsQ0FBQyxhQUFhLENBQUMsQ0FBQztBQUMvQixDQUFDLENBQUMsQ0FBQztBQUVILEdBQUcsQ0FBQyxFQUFFLENBQUMsU0FBUyxFQUFFLEtBQUssRUFBRSxlQUFlO0lBQ3BDLE9BQU8sQ0FBQyxHQUFHLENBQUMsSUFBSSxlQUFlLENBQUMsTUFBTSxDQUFDLFFBQVEsS0FBSyxlQUFlLENBQUMsT0FBTyxFQUFFLENBQUMsQ0FBQztJQUUvRSxFQUFFLENBQUMsQ0FBQyxlQUFlLENBQUMsT0FBTyxLQUFLLE1BQU0sQ0FBQyxDQUFDLENBQUM7UUFDckMsZUFBZSxDQUFDLEtBQUssQ0FBQyxVQUFVLGVBQWUsQ0FBQyxPQUFPLENBQUMsRUFBRSxHQUFHLENBQUMsQ0FBQztRQUMvRCxNQUFNLENBQUM7SUFDWCxDQUFDO0lBRUQsTUFBTSxPQUFPLEdBQW1CLGtCQUN6QixlQUFlLElBQ2xCLE9BQU8sRUFBRSxJQUFJLEVBQ2IsSUFBSSxFQUFFLEVBQUUsR0FDWCxDQUFDO0lBRUYsRUFBRSxDQUFDLENBQUMsT0FBTyxDQUFDLE9BQU8sQ0FBQyxDQUFDLENBQUMsS0FBSyxHQUFHLENBQUMsQ0FBQyxDQUFDO1FBQzdCLE1BQU0sQ0FBQyxPQUFPLEVBQUUsR0FBRyxJQUFJLENBQUMsR0FBRyxPQUFPLENBQUMsT0FBTyxDQUFDLE9BQU8sQ0FBQyxJQUFJLEVBQUUsRUFBRSxDQUFDLENBQUMsS0FBSyxDQUFDLEdBQUcsQ0FBQyxDQUFDO1FBRXhFLE9BQU8sQ0FBQyxPQUFPLEdBQUcsT0FBTyxDQUFDO1FBQzFCLE9BQU8sQ0FBQyxJQUFJLEdBQUcsSUFBSSxDQUFDO0lBQ3hCLENBQUM7SUFFRCxNQUFNLFFBQVEsQ0FBQyxHQUFHLENBQUMsQ0FBQyxDQUFDLEdBQUcsQ0FBQyxRQUFRLEVBQUUsS0FBSyxFQUFFLE9BQWdCLEVBQUUsV0FBbUI7UUFDM0UsSUFBSSxDQUFDO1lBQ0QsTUFBTSxPQUFPLENBQUMsT0FBTyxDQUFDLENBQUM7UUFDM0IsQ0FBQztRQUFDLEtBQUssQ0FBQyxDQUFDLEdBQUcsQ0FBQyxDQUFDLENBQUM7WUFDWCxPQUFPLENBQUMsS0FBSyxDQUFDLGNBQWMsV0FBVyxFQUFFLEVBQUUsR0FBRyxDQUFDLENBQUM7UUFDcEQsQ0FBQztJQUNMLENBQUMsQ0FBQyxDQUFDLENBQUM7QUFDUixDQUFDLENBQUMsQ0FBQztBQUVILHNFQUFzRTtBQUN0RSxHQUFHLENBQUMsS0FBSyxDQUFDLE9BQU8sQ0FBQyxHQUFHLENBQUMsYUFBYSxDQUFDLENBQUMsS0FBSyxDQUFDLENBQUMsR0FBRztJQUMzQyxPQUFPLENBQUMsS0FBSyxDQUFDLEdBQUcsQ0FBQyxDQUFDO0FBQ3ZCLENBQUMsQ0FBQyxDQUFDIn0=
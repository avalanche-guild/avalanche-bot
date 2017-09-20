# AVALANCHE Bot

This is a bot for the AVALANCHE Discord server. For fun.

### Development

**Requires Node 8+** as we're targeting minimal transpiling with TypeScript.

This project uses [Discord.js](https://discord.js.org/#/docs/main/stable/general/welcome) to fuel the bot. Refer to their docs for most of what you'll need.

`npm install` will install dependencies. You'll need a [Discord application token](https://discordapp.com/developers/applications/me) set as `DISCORD_TOKEN` in your environment:

```
export DISCORD_TOKEN=<token>
```

Then it's just a matter of `npm start` to start the bot. You'll have to add him to your server and give him permissions to chat if you want to do much with him.

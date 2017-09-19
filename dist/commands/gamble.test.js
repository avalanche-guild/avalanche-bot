"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const ava_1 = require("ava");
const _ = require("lodash");
const mockery = require("mockery");
const sinon = require("sinon");
let command;
let gamble;
ava_1.default.before(() => {
    // must register mocks before importing other modules
    mockery.registerMock('../lib/stats', {
        fetch: sinon.stub().returns({}),
        save: sinon.stub(),
    });
    mockery.enable({
        warnOnUnregistered: false,
    });
    const module = require('./gamble');
    command = module.command;
    gamble = module.gamble;
});
ava_1.default.after(() => {
    mockery.deregisterAll();
    mockery.disable();
});
const gamemaster = {
    id: '118415403272634369',
    username: 'Volkner',
};
const player = {
    id: '2',
    username: 'Zaahn',
};
ava_1.default.beforeEach((t) => {
    gamble.currentGame = null;
    t.context.channelSendStub = sinon.stub();
    t.context.channel = {
        id: 10,
        name: 'mock-channel',
        send: t.context.channelSendStub,
    };
});
ava_1.default('Does nothing on nonexistant command', async (t) => {
    await command({
        command: 'banana',
        args: [],
        author: gamemaster,
        channel: t.context.channel,
    });
    t.is(t.context.channelSendStub.callCount, 0);
});
ava_1.default('Can\'t do other commands without a game started', async (t) => {
    await command({
        command: 'roll',
        args: [],
        author: gamemaster,
        channel: t.context.channel,
    });
    t.is(t.context.channelSendStub.callCount, 0);
});
ava_1.default('Must play in a channel', async (t) => {
    delete t.context.channel.name;
    await command({
        command: 'gamble',
        args: [],
        author: gamemaster,
        channel: t.context.channel,
    });
    const callArg = t.context.channelSendStub.lastCall.args[0];
    t.is(callArg, 'You must play this game in a channel');
});
ava_1.default('Must specify a max amount', async (t) => {
    await command({
        command: 'gamble',
        args: [],
        author: gamemaster,
        channel: t.context.channel,
    });
    const callArg = t.context.channelSendStub.lastCall.args[0];
    t.regex(callArg, /You must specify the max amount to roll/);
});
ava_1.default('Max amount must be an integer, not a string', async (t) => {
    await command({
        command: 'gamble',
        args: ['banana'],
        author: gamemaster,
        channel: t.context.channel,
    });
    const callArg = t.context.channelSendStub.lastCall.args[0];
    t.regex(callArg, /The max amount must be an integer/);
});
ava_1.default('Max amount must be an integer, not a float', async (t) => {
    await command({
        command: 'gamble',
        args: ['5.245'],
        author: gamemaster,
        channel: t.context.channel,
    });
    const callArg = t.context.channelSendStub.lastCall.args[0];
    t.regex(callArg, /The max amount must be an integer/);
});
ava_1.default('Starts game with correct input', async (t) => {
    await startGame(t);
});
ava_1.default('Only one game in this channel', async (t) => {
    await startGame(t);
    await command({
        command: 'gamble',
        args: [],
        author: gamemaster,
        channel: t.context.channel,
    });
    const callArg = t.context.channelSendStub.lastCall.args[0];
    t.is(callArg, 'A game is already on-going in <#10>');
});
ava_1.default('Only one game globally', async (t) => {
    await startGame(t);
    t.context.channel = {
        id: 11,
        name: 'mock-channel-2',
        send: t.context.channelSendStub,
    };
    await command({
        command: 'gamble',
        args: [],
        author: gamemaster,
        channel: t.context.channel,
    });
    const callArg = t.context.channelSendStub.lastCall.args[0];
    t.is(callArg, 'A game is already on-going in <#10>');
});
ava_1.default('Won\'t let you play without at least 2 people', async (t) => {
    await startGame(t);
    await command({
        command: 'play',
        args: [],
        author: gamemaster,
        channel: t.context.channel,
    });
    const callArg = t.context.channelSendStub.lastCall.args[0];
    t.regex(callArg, /only 0 have entered/);
});
ava_1.default('Will allow you to withdraw', async (t) => {
    await startGame(t);
    t.is(_.size(gamble.currentGame.players), 0);
    await command({
        command: 'enter',
        args: [],
        author: gamemaster,
        channel: t.context.channel,
    });
    t.is(_.size(gamble.currentGame.players), 1);
    await command({
        command: 'withdraw',
        args: [],
        author: gamemaster,
        channel: t.context.channel,
    });
    t.is(_.size(gamble.currentGame.players), 0);
});
ava_1.default('Can cancel the game', async (t) => {
    await startGame(t);
    await command({
        command: 'cancel',
        args: [],
        author: gamemaster,
        channel: t.context.channel,
    });
    const callArg = t.context.channelSendStub.lastCall.args[0];
    t.is(callArg, 'Game cancelled.');
    t.is(gamble.currentGame, null);
});
ava_1.default('Only gamemaster can cancel the game', async (t) => {
    await startGame(t);
    await command({
        command: 'cancel',
        args: [],
        author: player,
        channel: t.context.channel,
    });
    const callArg = t.context.channelSendStub.lastCall.args[0];
    t.is(callArg, 'Only <@118415403272634369> can cancel the game.');
    t.not(gamble.currentGame, null);
});
ava_1.default('Only gamemaster can start the game', async (t) => {
    await startGame(t);
    await command({
        command: 'play',
        args: [],
        author: player,
        channel: t.context.channel,
    });
    const callArg = t.context.channelSendStub.lastCall.args[0];
    t.is(callArg, '<@2> Only <@118415403272634369> can start the roll.');
    t.not(gamble.currentGame, null);
});
ava_1.default('Can\'t start rolling until the gamemaster says so', async (t) => {
    await startGame(t);
    await command({
        command: 'roll',
        args: [],
        author: player,
        channel: t.context.channel,
    });
    const callArg = t.context.channelSendStub.lastCall.args[0];
    t.regex(callArg, /you can't roll until/);
});
ava_1.default('Can start the rolls after 2 people have entered', async (t) => {
    await startGame(t);
    await startRolling(t);
});
ava_1.default('Can\'t enter after rolling has started', async (t) => {
    await startGame(t);
    await startRolling(t);
    await command({
        command: 'enter',
        args: [],
        author: gamemaster,
        channel: t.context.channel,
    });
    const callArg = t.context.channelSendStub.lastCall.args[0];
    t.regex(callArg, /you can't enter/);
});
ava_1.default('Can\'t withdraw after rolling has started', async (t) => {
    await startGame(t);
    await startRolling(t);
    await command({
        command: 'withdraw',
        args: [],
        author: gamemaster,
        channel: t.context.channel,
    });
    const callArg = t.context.channelSendStub.lastCall.args[0];
    t.regex(callArg, /you can't withdraw/);
});
ava_1.default('The proper pot amount is implied with `!roll`', async (t) => {
    await startGame(t);
    await startRolling(t);
    await command({
        command: 'roll',
        args: [],
        author: gamemaster,
        channel: t.context.channel,
    });
    const callArg = t.context.channelSendStub.lastCall.args[0];
    t.regex(callArg, /<@118415403272634369> rolled a \d{1,3}/);
});
ava_1.default('Must roll the correct amount', async (t) => {
    await startGame(t);
    await startRolling(t);
    await command({
        command: 'roll',
        args: ['1000'],
        author: gamemaster,
        channel: t.context.channel,
    });
    const callArg = t.context.channelSendStub.lastCall.args[0];
    t.regex(callArg, /you must roll out of 500/);
});
ava_1.default('Can\'t roll twice', async (t) => {
    await startGame(t);
    await startRolling(t);
    await command({
        command: 'roll',
        args: ['500'],
        author: gamemaster,
        channel: t.context.channel,
    });
    const roll = gamble.currentGame.players[gamemaster.id].roll;
    await command({
        command: 'roll',
        args: ['500'],
        author: gamemaster,
        channel: t.context.channel,
    });
    const callArg = t.context.channelSendStub.lastCall.args[0];
    t.regex(callArg, new RegExp(`<@${gamemaster.id}> you have already rolled a ${roll}!`));
});
ava_1.default('Prints who still needs to roll', async (t) => {
    await startGame(t);
    await startRolling(t);
    await command({
        command: 'roll',
        args: ['500'],
        author: gamemaster,
        channel: t.context.channel,
    });
    await command({
        command: 'play',
        args: [],
        author: gamemaster,
        channel: t.context.channel,
    });
    const callArg = t.context.channelSendStub.lastCall.args[0];
    t.regex(callArg, new RegExp(`Some people still need to roll:\n\n<@${player.id}>`));
});
ava_1.default('It\'s a critical hit!', async (t) => {
    await startGame(t, '9999');
    await startRolling(t);
    await command({
        command: 'roll',
        args: ['9999'],
        author: gamemaster,
        channel: t.context.channel,
    });
    const callArg = t.context.channelSendStub.lastCall.args[0];
    t.regex(callArg, /It's a critical hit!/);
    t.is(gamble.currentGame.players[gamemaster.id].roll, 9999);
});
ava_1.default('Determines the winner', async (t) => {
    await startGame(t);
    await startRolling(t);
    await command({
        command: 'roll',
        args: ['500'],
        author: gamemaster,
        channel: t.context.channel,
    });
    await command({
        command: 'roll',
        args: ['500'],
        author: player,
        channel: t.context.channel,
    });
    const callArg = t.context.channelSendStub.lastCall.args[0];
    t.regex(callArg, /<@(2|118415403272634369)> owes <@(2|118415403272634369)> \d{1,3} gold/);
});
async function startGame(t, max = '500') {
    await command({
        command: 'gamble',
        args: [max],
        author: gamemaster,
        channel: t.context.channel,
    });
    const callArg = t.context.channelSendStub.lastCall.args[0];
    t.regex(callArg, /@here \*\*Let's gamble!\*\* :moneybag: Playing for [\d,]+ gold/);
}
async function startRolling(t) {
    await command({
        command: 'enter',
        args: [],
        author: gamemaster,
        channel: t.context.channel,
    });
    await command({
        command: 'enter',
        args: [],
        author: player,
        channel: t.context.channel,
    });
    await command({
        command: 'play',
        args: [],
        author: gamemaster,
        channel: t.context.channel,
    });
    const callArg = t.context.channelSendStub.lastCall.args[0];
    t.regex(callArg, /\n\n\*\*Type `!roll [\d,]+` to roll\*\*/);
    t.true(gamble.currentGame.isRolling);
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZ2FtYmxlLnRlc3QuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi9jb21tYW5kcy9nYW1ibGUudGVzdC50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOztBQUFBLDZCQUF1QjtBQUV2Qiw0QkFBNEI7QUFDNUIsbUNBQW1DO0FBQ25DLCtCQUErQjtBQUkvQixJQUFJLE9BQU8sQ0FBQztBQUNaLElBQUksTUFBTSxDQUFDO0FBQ1gsYUFBSSxDQUFDLE1BQU0sQ0FBQztJQUNSLHFEQUFxRDtJQUNyRCxPQUFPLENBQUMsWUFBWSxDQUFDLGNBQWMsRUFBRTtRQUNqQyxLQUFLLEVBQUUsS0FBSyxDQUFDLElBQUksRUFBRSxDQUFDLE9BQU8sQ0FBQyxFQUFFLENBQUM7UUFDL0IsSUFBSSxFQUFFLEtBQUssQ0FBQyxJQUFJLEVBQUU7S0FDckIsQ0FBQyxDQUFDO0lBRUgsT0FBTyxDQUFDLE1BQU0sQ0FBQztRQUNYLGtCQUFrQixFQUFFLEtBQUs7S0FDNUIsQ0FBQyxDQUFDO0lBRUgsTUFBTSxNQUFNLEdBQUcsT0FBTyxDQUFDLFVBQVUsQ0FBQyxDQUFDO0lBQ25DLE9BQU8sR0FBRyxNQUFNLENBQUMsT0FBTyxDQUFDO0lBQ3pCLE1BQU0sR0FBRyxNQUFNLENBQUMsTUFBTSxDQUFDO0FBQzNCLENBQUMsQ0FBQyxDQUFDO0FBRUgsYUFBSSxDQUFDLEtBQUssQ0FBQztJQUNQLE9BQU8sQ0FBQyxhQUFhLEVBQUUsQ0FBQztJQUN4QixPQUFPLENBQUMsT0FBTyxFQUFFLENBQUM7QUFDdEIsQ0FBQyxDQUFDLENBQUM7QUFHSCxNQUFNLFVBQVUsR0FBRztJQUNmLEVBQUUsRUFBRSxvQkFBb0I7SUFDeEIsUUFBUSxFQUFFLFNBQVM7Q0FDdEIsQ0FBQztBQUVGLE1BQU0sTUFBTSxHQUFHO0lBQ1gsRUFBRSxFQUFFLEdBQUc7SUFDUCxRQUFRLEVBQUUsT0FBTztDQUNwQixDQUFDO0FBRUYsYUFBSSxDQUFDLFVBQVUsQ0FBQyxDQUFDLENBQUM7SUFDZCxNQUFNLENB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
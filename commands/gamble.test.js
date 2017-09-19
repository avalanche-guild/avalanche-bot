const _ = require('lodash');
const test = require('ava');
const sinon = require('sinon');

const gamble = require('./gamble');

const gamemaster = {
    id: '118415403272634369',
    username: 'Volkner',
};

const player = {
    id: 2,
    username: 'Zaahn',
};

test.beforeEach((t) => {
    gamble.currentGame = null;

    t.context.channelSendStub = sinon.stub();

    t.context.channel = {
        id: 10,
        name: 'mock-channel',
        send: t.context.channelSendStub,
    };
});

test('Does nothing on nonexistant command', async (t) => {
    await gamble.process({
        command: 'banana',
        args: [],
        author: gamemaster,
        channel: t.context.channel,
    });

    t.is(t.context.channelSendStub.callCount, 0);
});

test('Can\'t do other commands without a game started', async (t) => {
    await gamble.process({
        command: 'roll',
        args: [],
        author: gamemaster,
        channel: t.context.channel,
    });

    t.is(t.context.channelSendStub.callCount, 0);
});

test('Must play in a channel', async (t) => {
    delete t.context.channel.name;

    await gamble.process({
        command: 'gamble',
        args: [],
        author: gamemaster,
        channel: t.context.channel,
    });

    const callArg = t.context.channelSendStub.lastCall.args[0];
    t.is(callArg, 'You must play this game in a channel');
});

test('Must specify a max amount', async (t) => {
    await gamble.process({
        command: 'gamble',
        args: [],
        author: gamemaster,
        channel: t.context.channel,
    });

    const callArg = t.context.channelSendStub.lastCall.args[0];
    t.regex(callArg, /You must specify the max amount to roll/);
});

test('Max amount must be an integer, not a string', async (t) => {
    await gamble.process({
        command: 'gamble',
        args: ['banana'],
        author: gamemaster,
        channel: t.context.channel,
    });

    const callArg = t.context.channelSendStub.lastCall.args[0];
    t.regex(callArg, /The max amount must be an integer/);
});

test('Max amount must be an integer, not a float', async (t) => {
    await gamble.process({
        command: 'gamble',
        args: [5.245],
        author: gamemaster,
        channel: t.context.channel,
    });

    const callArg = t.context.channelSendStub.lastCall.args[0];
    t.regex(callArg, /The max amount must be an integer/);
});

test('Starts game with correct input', async (t) => {
    await startGame(t);
});


test('Only one game in this channel', async (t) => {
    await startGame(t);

    await gamble.process({
        command: 'gamble',
        args: [],
        author: gamemaster,
        channel: t.context.channel,
    });

    const callArg = t.context.channelSendStub.lastCall.args[0];
    t.is(callArg, 'A game is already on-going in <#10>');
});

test('Only one game globally', async (t) => {
    await startGame(t);

    t.context.channel = {
        id: 11,
        name: 'mock-channel-2',
        send: t.context.channelSendStub,
    };

    await gamble.process({
        command: 'gamble',
        args: [],
        author: gamemaster,
        channel: t.context.channel,
    });

    const callArg = t.context.channelSendStub.lastCall.args[0];
    t.is(callArg, 'A game is already on-going in <#10>');
});

test('Won\'t let you play without at least 2 people', async (t) => {
    await startGame(t);

    await gamble.process({
        command: 'play',
        args: [],
        author: gamemaster,
        channel: t.context.channel,
    });

    const callArg = t.context.channelSendStub.lastCall.args[0];
    t.regex(callArg, /only 0 have entered/);
});

test('Will allow you to withdraw', async (t) => {
    await startGame(t);

    t.is(_.size(gamble.currentGame.players), 0);

    await gamble.process({
        command: 'enter',
        args: [],
        author: gamemaster,
        channel: t.context.channel,
    });

    t.is(_.size(gamble.currentGame.players), 1);

    await gamble.process({
        command: 'withdraw',
        args: [],
        author: gamemaster,
        channel: t.context.channel,
    });

    t.is(_.size(gamble.currentGame.players), 0);
});

test('Can cancel the game', async (t) => {
    await startGame(t);

    await gamble.process({
        command: 'cancel',
        args: [],
        author: gamemaster,
        channel: t.context.channel,
    });

    const callArg = t.context.channelSendStub.lastCall.args[0];
    t.is(callArg, 'Game cancelled.');

    t.is(gamble.currentGame, null);
});

test('Only gamemaster can cancel the game', async (t) => {
    await startGame(t);

    await gamble.process({
        command: 'cancel',
        args: [],
        author: player,
        channel: t.context.channel,
    });

    const callArg = t.context.channelSendStub.lastCall.args[0];
    t.is(callArg, 'Only <@118415403272634369> can cancel the game.');

    t.not(gamble.currentGame, null);
});

test('Only gamemaster can start the game', async (t) => {
    await startGame(t);

    await gamble.process({
        command: 'play',
        args: [],
        author: player,
        channel: t.context.channel,
    });

    const callArg = t.context.channelSendStub.lastCall.args[0];
    t.is(callArg, '<@2> Only <@118415403272634369> can start the roll.');

    t.not(gamble.currentGame, null);
});

test('Can\'t start rolling until the gamemaster says so', async (t) => {
    await startGame(t);

    await gamble.process({
        command: 'roll',
        args: [],
        author: player,
        channel: t.context.channel,
    });

    const callArg = t.context.channelSendStub.lastCall.args[0];
    t.regex(callArg, /you can't roll until/);
});

test('Can start the rolls after 2 people have entered', async (t) => {
    await startGame(t);

    await startRolling(t);
});

test('Can\'t enter after rolling has started', async (t) => {
    await startGame(t);

    await startRolling(t);

    await gamble.process({
        command: 'enter',
        args: [],
        author: gamemaster,
        channel: t.context.channel,
    });

    const callArg = t.context.channelSendStub.lastCall.args[0];
    t.regex(callArg, /you can't enter/);
});

test('Can\'t withdraw after rolling has started', async (t) => {
    await startGame(t);

    await startRolling(t);

    await gamble.process({
        command: 'withdraw',
        args: [],
        author: gamemaster,
        channel: t.context.channel,
    });

    const callArg = t.context.channelSendStub.lastCall.args[0];
    t.regex(callArg, /you can't withdraw/);
});

test('The proper pot amount is implied with `!roll`', async (t) => {
    await startGame(t);

    await startRolling(t);

    await gamble.process({
        command: 'roll',
        args: [],
        author: gamemaster,
        channel: t.context.channel,
    });

    const callArg = t.context.channelSendStub.lastCall.args[0];
    t.regex(callArg, /<@118415403272634369> rolled a \d{1,3}/);
});

test('Must roll the correct amount', async (t) => {
    await startGame(t);

    await startRolling(t);

    await gamble.process({
        command: 'roll',
        args: [1000],
        author: gamemaster,
        channel: t.context.channel,
    });

    const callArg = t.context.channelSendStub.lastCall.args[0];
    t.regex(callArg, /you must roll out of 500/);
});

test('Can\'t roll twice', async (t) => {
    await startGame(t);

    await startRolling(t);

    await gamble.process({
        command: 'roll',
        args: [500],
        author: gamemaster,
        channel: t.context.channel,
    });

    const roll = gamble.currentGame.players[gamemaster.id].roll;

    await gamble.process({
        command: 'roll',
        args: [500],
        author: gamemaster,
        channel: t.context.channel,
    });

    const callArg = t.context.channelSendStub.lastCall.args[0];
    t.regex(callArg, new RegExp(`<@${gamemaster.id}> you have already rolled a ${roll}!`));
});

test('Prints who still needs to roll', async (t) => {
    await startGame(t);

    await startRolling(t);

    await gamble.process({
        command: 'roll',
        args: [500],
        author: gamemaster,
        channel: t.context.channel,
    });

    await gamble.process({
        command: 'play',
        args: [],
        author: gamemaster,
        channel: t.context.channel,
    });

    const callArg = t.context.channelSendStub.lastCall.args[0];
    t.regex(callArg, new RegExp(`Some people still need to roll:\n\n<@${player.id}>`));
});

test('It\'s a critical hit!', async (t) => {
    await startGame(t, 9999);

    await startRolling(t);

    await gamble.process({
        command: 'roll',
        args: ['9999'],
        author: gamemaster,
        channel: t.context.channel,
    });

    const callArg = t.context.channelSendStub.lastCall.args[0];
    t.regex(callArg, /It's a critical hit!/);

    t.is(gamble.currentGame.players[gamemaster.id].roll, 9999);
});

test('Determines the winner', async (t) => {
    await startGame(t);

    await startRolling(t);

    await gamble.process({
        command: 'roll',
        args: [500],
        author: gamemaster,
        channel: t.context.channel,
    });

    await gamble.process({
        command: 'roll',
        args: [500],
        author: player,
        channel: t.context.channel,
    });

    const callArg = t.context.channelSendStub.lastCall.args[0];
    t.regex(callArg, /<@(2|118415403272634369)> owes <@(2|118415403272634369)> \d{1,3} gold/);
});


async function startGame(t, max = 500) {
    await gamble.process({
        command: 'gamble',
        args: [max],
        author: gamemaster,
        channel: t.context.channel,
    });

    const callArg = t.context.channelSendStub.lastCall.args[0];
    t.regex(callArg, /@here \*\*Let's gamble!\*\* :moneybag: Playing for [\d,]+ gold/);
}

async function startRolling(t) {
    await gamble.process({
        command: 'enter',
        args: [],
        author: gamemaster,
        channel: t.context.channel,
    });

    await gamble.process({
        command: 'enter',
        args: [],
        author: player,
        channel: t.context.channel,
    });

    await gamble.process({
        command: 'play',
        args: [],
        author: gamemaster,
        channel: t.context.channel,
    });

    const callArg = t.context.channelSendStub.lastCall.args[0];
    t.regex(callArg, /\n\n\*\*Type `!roll [\d,]+` to roll\*\*/);

    t.true(gamble.currentGame.isRolling);
}

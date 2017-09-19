const _ = require('lodash');

const gamble = {
    // currently only allow one game globally
    currentGame: null,

    async process({ command, args, author, channel }) {
        if (gamble[command]) {
            if (gamble.currentGame && gamble.currentGame.channel.name !== channel.name) {
                return currentGameError(channel);
            }

            if (!gamble.currentGame && command !== 'gamble') {
                return;
            }

            await gamble[command](args, author, channel);
        }
    },

    async gamble([max], user, channel) {
        // only Volkner can start a game right now
        if (user.id !== '118415403272634369') {
            channel.send(`<@${user.id}> During testing, only <@118415403272634369> can start a game`);
            return;
        }

        if (gamble.currentGame) {
            return currentGameError(channel);
        }

        if (!channel.name) {
            channel.send('You must play this game in a channel');
            return;
        }

        if (!max) {
            channel.send('You must specify the max amount to roll for, i.e. `!gamble 1000`');
            return;
        }

        if (!Number(max) || !_.isInteger(max)) {
            channel.send('The max amount must be an integer, i.e. `!gamble 1000`');
            return;
        }

        gamble.currentGame = new GamblingGame(max, user, channel);
    },

    async roll([max], user, channel) {
        await gamble.currentGame.roll(max, user);
    },

    async enter(args, user, channel) {
        await gamble.currentGame.enter(user);
    },

    async withdraw(args, user, channel) {
        await gamble.currentGame.withdraw(user);
    },

    async play(args, user, channel) {
        await gamble.currentGame.play(user);
    },

    async cancel(args, user, channel) {
        await gamble.currentGame.cancel(user)
    },
};

module.exports = gamble;

class GamblingGame {
    constructor(max, gamemaster, channel) {
        this.max = max;
        this.gamemaster = gamemaster;
        this.channel = channel;
        this.isRolling = false;

        this.players = {};

        this.channel.send(`
@here **Let's gamble!** :moneybag: Playing for ${numberFormat(this.max)} gold.

Type \`!enter\` to play, \`!withdraw\` to withdraw.

When everyone has entered, <@${this.gamemaster.id}> types \`!play\` to start the rolling.

The person with the lowest roll will pay the person with the highest roll the difference of their two rolls.

**While in test mode, all games are "for fun." The loser does not have to payout (in case there are bugs) and no stats are tracked.**
`);
    }

    roll(max, user) {
        if (!this.isRolling) {
            this.channel.send(`<@${user.id}> you can't roll until <@${this.gamemaster.id}> types \`!play\``);
            return;
        }

        if (!max) {
            max = this.max;
        }

        if (max !== this.max) {
            this.channel.send(`<@${user.id}> you must roll out of ${this.max}`);
            return;
        }

        if (this.players[user.id].roll) {
            this.channel.send(`<@${user.id}> you have already rolled a ${numberFormat(this.players[user.id].roll)}!`);
            return;
        }

        const roll = getRandomNumber(max);

        this.players[user.id].roll = roll;

        this.channel.send(`<@${user.id}> rolled a ${numberFormat(this.players[user.id].roll)}`);

        this.checkGameEnd();
    }

    enter(user) {
        if (this.isRolling) {
            this.channel.send(`<@${user.id}> you can't enter, rolls have started`);
            return;
        }

        this.channel.send(`<@${user.id}> has entered`);

        this.players[user.id] = { roll: null, user };
    }

    withdraw(user) {
        if (this.isRolling) {
            this.channel.send(`<@${user.id}> you can't withdraw, rolls have started`);
            return;
        }

        this.channel.send(`<@${user.id}> has withdrawn`);

        delete this.players[user.id];
    }

    play(user) {
        if (user.id !== this.gamemaster.id) {
            this.channel.send(`<@${user.id}> Only <@${this.gamemaster.id}> can start the roll.`);
            return;
        }

        if (this.isRolling) {
            const stillNeedsToRoll = _.reject(this.players, player => !!player.roll)
            this.channel.send(`Some people still need to roll:\n\n${_.map(stillNeedsToRoll, ({ user: player }) => `<@${player.id}>`).join(', ')}`);
            return;
        }

        const numberOfPlayers = _.size(this.players);
        if (numberOfPlayers < 2) {
            this.channel.send(`Must have at least 2 people enter, only ${numberOfPlayers} have entered so far.`);
            return;
        }

        this.channel.send(`
These are the people playing:

${_.map(this.players, (v, id) => `<@${id}>`).join(', ')}

**Type \`!roll ${this.max}\` to roll**
`);

        this.isRolling = true;
    }

    cancel(user) {
        if (user.id !== this.gamemaster.id) {
            this.channel.send(`Only <@${this.gamemaster.id}> can cancel the game.`);
            return;
        }

        this.channel.send(`Game cancelled.`);

        gamble.currentGame = null;
    }

    checkGameEnd() {
        if (!_.every(this.players, player => !!player.roll)) {
            return;
        }

        const min = _.minBy(_.values(this.players), ({ roll, user }) => roll);
        const max = _.maxBy(_.values(this.players), ({ roll, user }) => roll);

        const payout = max.roll - min.roll;

        this.channel.send(`Everyone has rolled! ~~**<@${min.user.id}> owes <@${max.user.id}> ${numberFormat(payout)} gold.**~~ No one pays out in test mode.`);

        gamble.currentGame = null;
    }
}

function currentGameError(channel) {
    channel.send(`A game is already on-going in <#${gamble.currentGame.channel.id}>`);
}

function getRandomNumber(min, max) {
    return _.random(min, max);
}

function numberFormat(num) {
    return (+num).toLocaleString();
}

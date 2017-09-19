"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const _ = require("lodash");
const stats_1 = require("../lib/stats");
const VOLKNER_ID = '118415403272634369';
async function command({ command, args, author, channel }) {
    if (_.includes(['gambleStats'], command)) {
        return await exports.gamble[command](args, author, channel);
    }
    if (exports.gamble[command]) {
        if (exports.gamble.currentGame && exports.gamble.currentGame.channel.name !== channel.name) {
            return currentGameError(channel);
        }
        if (!exports.gamble.currentGame && command !== 'gamble') {
            return;
        }
        await exports.gamble[command](args, author, channel);
    }
}
exports.command = command;
exports.gamble = {
    // currently only allow one game globally
    currentGame: null,
    async gamble([max], user, channel) {
        // only Volkner can start a game right now
        if (user.id !== VOLKNER_ID) {
            channel.send(`<@${user.id}> During testing, only <@${VOLKNER_ID}> can start a game`);
            return;
        }
        if (exports.gamble.currentGame) {
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
        if (!Number(max) || !_.isInteger(+max)) {
            channel.send('The max amount must be an integer, i.e. `!gamble 1000`');
            return;
        }
        exports.gamble.currentGame = new GamblingGame(max, user, channel);
    },
    async gambleStats(args, user, channel) {
        const stats = _.sortBy(await stats_1.fetch('gamble'), stat => stat.score * -1);
        console.log(stats);
        const scores = _.map(stats, ({ username, score, id }) => {
            return `<@${id}>: ${score}`;
        }).join('\n');
        channel.send(`**Running Totals:**\n\n${scores}`);
    },
    async roll([max], user, channel) {
        await exports.gamble.currentGame.roll(+max, user);
    },
    async enter(args, user, channel) {
        await exports.gamble.currentGame.enter(user);
    },
    async withdraw(args, user, channel) {
        await exports.gamble.currentGame.withdraw(user);
    },
    async play(args, user, channel) {
        await exports.gamble.currentGame.play(user);
    },
    async cancel(args, user, channel) {
        await exports.gamble.currentGame.cancel(user);
    },
};
class GamblingGame {
    constructor(max, gameMaster, channel) {
        this.players = {};
        this.isRolling = false;
        this.isSomeoneCheating = false;
        this.max = +max;
        this.gameMaster = gameMaster;
        this.channel = channel;
        this.channel.send(trim(`
            @here **Let's gamble!** :moneybag: Playing for ${numberFormat(this.max)} gold.
            
            Type \`!enter\` to play, \`!withdraw\` to withdraw.
            
            When everyone has entered, <@${this.gameMaster.id}> types \`!play\` to start the rolling.
            
            The person with the lowest roll will pay the person with the highest roll the difference of their two rolls.
            
            **While in test mode, all games are "for fun." The loser does not have to payout (in case there are bugs) and no stats are tracked.**
        `));
    }
    async roll(max, user) {
        if (!this.isRolling) {
            this.channel.send(`<@${user.id}> you can't roll until <@${this.gameMaster.id}> types \`!play\``);
            return;
        }
        max = max || this.max;
        if (max !== this.max) {
            this.channel.send(`<@${user.id}> you must roll out of ${this.max}`);
            return;
        }
        if (this.players[user.id].roll) {
            this.channel.send(`<@${user.id}> you have already rolled a ${numberFormat(this.players[user.id].roll)}!`);
            return;
        }
        this.players[user.id].roll = getRandomNumber(max);
        // You always score a critical hit if the roll is out of your magic number
        if (max === determineTheMagic(user.username)) {
            this.players[user.id].roll = max;
            this.isSomeoneCheating = true;
        }
        let criticalHitStr = '';
        if (this.players[user.id].roll === max) {
            criticalHitStr = ` **It's a critical hit!**`;
        }
        this.channel.send(`<@${user.id}> rolled a ${numberFormat(this.players[user.id].roll)}.${criticalHitStr}`);
        await this.checkGameEnd();
    }
    enter(user) {
        if (this.isRolling) {
            this.channel.send(`<@${user.id}> you can't enter, rolls have started`);
            return;
        }
        this.channel.send(`<@${user.id}> has entered`);
        // user.send(`You have entered for the game rolling for ${this.max}`);
        this.players[user.id] = { roll: null, user };
    }
    withdraw(user) {
        if (this.isRolling) {
            this.channel.send(`<@${user.id}> you can't withdraw, rolls have started`);
            return;
        }
        this.channel.send(`<@${user.id}> has withdrawn`);
        // user.send(`You have withdrawn for the game rolling for ${this.max}`);
        delete this.players[user.id];
    }
    play(user) {
        if (user.id !== this.gameMaster.id) {
            this.channel.send(`<@${user.id}> Only <@${this.gameMaster.id}> can start the roll.`);
            return;
        }
        if (this.isRolling) {
            const stillNeedsToRoll = _.reject(this.players, player => !!player.roll);
            this.channel.send(`Some people still need to roll:\n\n${_.map(stillNeedsToRoll, ({ user: player }) => `<@${player.id}>`).join(', ')}`);
            return;
        }
        const numberOfPlayers = _.size(this.players);
        if (numberOfPlayers < 2) {
            this.channel.send(`Must have at least 2 people enter, only ${numberOfPlayers} have entered so far.`);
            return;
        }
        this.channel.send(trim(`
            These are the people playing:
            
            ${_.map(this.players, (v, id) => `<@${id}>`).join(', ')}
            
            **Type \`!roll ${this.max}\` to roll**
        `));
        this.isRolling = true;
    }
    cancel(user) {
        if (user.id !== this.gameMaster.id) {
            this.channel.send(`Only <@${this.gameMaster.id}> can cancel the game.`);
            return;
        }
        this.channel.send(`Game cancelled.`);
        exports.gamble.currentGame = null;
    }
    async checkGameEnd() {
        if (!_.every(this.players, player => !!player.roll)) {
            return;
        }
        const min = _.minBy(_.values(this.players), ({ roll, user }) => roll);
        const max = _.maxBy(_.values(this.players), ({ roll, user }) => roll);
        const payout = max.roll - min.roll;
        this.channel.send(`Everyone has rolled! ~~**<@${min.user.id}> owes <@${max.user.id}> ${numberFormat(payout)} gold.**~~ No one pays out in test mode.`);
        if (!this.isSomeoneCheating) {
            await this.saveStats(min.user, max.user, payout);
        }
        exports.gamble.currentGame = null;
    }
    async saveStats(loser, winner, payout) {
        const stats = await stats_1.fetch('gamble');
        // usernames change, but IDs are forever
        if (!stats[loser.id]) {
            stats[loser.id] = {
                id: loser.id,
                username: loser.username,
                score: 0,
            };
        }
        if (!stats[winner.id]) {
            stats[winner.id] = {
                id: winner.id,
                username: winner.username,
                score: 0,
            };
        }
        stats[winner.id].score += payout;
        stats[loser.id].score -= payout;
        await stats_1.save('gamble', stats);
    }
}
function currentGameError(channel) {
    channel.send(`A game is already on-going in <#${exports.gamble.currentGame.channel.id}>`);
}
function getRandomNumber(max) {
    return _.random(1, max);
}
function numberFormat(num) {
    return (+num).toLocaleString();
}
function trim(string) {
    return string.split('\n').map(str => str.trim()).join('\n');
}
function determineTheMagic(username) {
    const chars = ' abcdefghijklmnopqrstuvwxyz';
    const key = username.toLowerCase().replace(/[^a-z]/g, '');
    return +(_.map(key, char => chars.indexOf(char)).join(''));
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZ2FtYmxlLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vY29tbWFuZHMvZ2FtYmxlLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7O0FBQ0EsNEJBQTRCO0FBRzVCLHdDQUEyQztBQUUzQyxNQUFNLFVBQVUsR0FBRyxvQkFBb0IsQ0FBQztBQUVqQyxLQUFLLGtCQUFrQixFQUFFLE9BQU8sRUFBRSxJQUFJLEVBQUUsTUFBTSxFQUFFLE9BQU8sRUFBa0I7SUFDNUUsRUFBRSxDQUFDLENBQUMsQ0FBQyxDQUFDLFFBQVEsQ0FBQyxDQUFDLGFBQWEsQ0FBQyxFQUFFLE9BQU8sQ0FBQyxDQUFDLENBQUMsQ0FBQztRQUN2QyxNQUFNLENBQUMsTUFBTSxjQUFNLENBQUMsT0FBTyxDQUFDLENBQUMsSUFBSSxFQUFFLE1BQU0sRUFBRSxPQUFPLENBQUMsQ0FBQztJQUN4RCxDQUFDO0lBRUQsRUFBRSxDQUFDLENBQUMsY0FBTSxDQUFDLE9BQU8sQ0FBQyxDQUFDLENBQUMsQ0FBQztRQUNsQixFQUFFLENBQUMsQ0FBQyxjQUFNLENBQUMsV0FBVyxJQUFJLGNBQU0sQ0FBQyxXQUFXLENBQUMsT0FBTyxDQUFDLElBQUksS0FBSyxPQUFPLENBQUMsSUFBSSxDQUFDLENBQUMsQ0FBQztZQUN6RSxNQUFNLENBQUMsZ0JBQWdCLENBQUMsT0FBTyxDQUFDLENBQUM7UUFDckMsQ0FBQztRQUVELEVBQUUsQ0FBQyxDQUFDLENBQUMsY0FBTSxDQUFDLFdBQVcsSUFBSSxPQUFPLEtBQUssUUFBUSxDQUFDLENBQUMsQ0FBQztZQUM5QyxNQUFNLENBQUM7UUFDWCxDQUFDO1FBRUQsTUFBTSxjQUFNLENBQUMsT0FBTyxDQUFDLENBQUMsSUFBSSxFQUFFLE1BQU0sRUFBRSxPQUFPLENBQUMsQ0FBQztJQUNqRCxDQUFDO0FBQ0wsQ0FBQztBQWhCRCwwQkFnQkM7QUFFWSxRQUFBLE1BQU0sR0FBRztJQUNsQix5Q0FBeUM7SUFDekMsV0FBVyxFQUFFLElBQUk7SUFFakIsS0FB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
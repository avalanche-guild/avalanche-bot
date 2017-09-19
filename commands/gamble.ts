import { TextChannel, User } from 'discord.js';
import * as _ from 'lodash';

import { CommandMessage } from '../index';
import { fetch, save } from '../lib/stats';

const VOLKNER_ID = '118415403272634369';

export async function command({ command, args, author, channel }: CommandMessage) {
    if (_.includes(['gambleStats'], command)) {
        return await gamble[command](args, author, channel);
    }

    if (gamble[command]) {
        if (gamble.currentGame && gamble.currentGame.channel.name !== channel.name) {
            return currentGameError(channel);
        }

        if (!gamble.currentGame && command !== 'gamble') {
            return;
        }

        await gamble[command](args, author, channel);
    }
}

export const gamble = {
    // currently only allow one game globally
    currentGame: null,

    async gamble([max], user, channel) {
        // only Volkner can start a game right now
        if (user.id !== VOLKNER_ID) {
            channel.send(`<@${user.id}> During testing, only <@${VOLKNER_ID}> can start a game`);
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

        if (!Number(max) || !_.isInteger(+max)) {
            channel.send('The max amount must be an integer, i.e. `!gamble 1000`');
            return;
        }

        gamble.currentGame = new GamblingGame(max, user, channel);
    },

    async gambleStats(args, user, channel) {
        const stats = _.sortBy(await fetch('gamble'), stat => stat.score * -1);
        console.log(stats);

        const scores = _.map(stats, ({ username, score, id }) => {
            return `<@${id}>: ${score}`;
        }).join('\n');

        channel.send(`**Running Totals:**\n\n${scores}`);
    },

    async roll([max]: string[], user: User, channel: TextChannel) {
        await gamble.currentGame.roll(+max, user);
    },

    async enter(args: string[], user: User, channel: TextChannel) {
        await gamble.currentGame.enter(user);
    },

    async withdraw(args: string[], user: User, channel: TextChannel) {
        await gamble.currentGame.withdraw(user);
    },

    async play(args: string[], user: User, channel: TextChannel) {
        await gamble.currentGame.play(user);
    },

    async cancel(args: string[], user: User, channel: TextChannel) {
        await gamble.currentGame.cancel(user);
    },
};

class GamblingGame {
    players: { [id: string]: { user: User, roll: number } } = {};
    max: number;
    channel: TextChannel;
    isRolling: boolean = false;
    isSomeoneCheating: boolean = false;

    private gameMaster: User;

    constructor(max, gameMaster, channel) {
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

    async roll(max: number, user: User) {
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

    enter(user: User) {
        if (this.isRolling) {
            this.channel.send(`<@${user.id}> you can't enter, rolls have started`);
            return;
        }

        this.channel.send(`<@${user.id}> has entered`);
        // user.send(`You have entered for the game rolling for ${this.max}`);

        this.players[user.id] = { roll: null, user };
    }

    withdraw(user: User) {
        if (this.isRolling) {
            this.channel.send(`<@${user.id}> you can't withdraw, rolls have started`);
            return;
        }

        this.channel.send(`<@${user.id}> has withdrawn`);
        // user.send(`You have withdrawn for the game rolling for ${this.max}`);

        delete this.players[user.id];
    }

    play(user: User) {
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

    cancel(user: User) {
        if (user.id !== this.gameMaster.id) {
            this.channel.send(`Only <@${this.gameMaster.id}> can cancel the game.`);
            return;
        }

        this.channel.send(`Game cancelled.`);

        gamble.currentGame = null;
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

        gamble.currentGame = null;
    }

    async saveStats(loser, winner, payout) {
        const stats = await fetch('gamble');

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

        await save('gamble', stats);
    }
}

function currentGameError(channel) {
    channel.send(`A game is already on-going in <#${gamble.currentGame.channel.id}>`);
}

function getRandomNumber(max: number) {
    return _.random(1, max);
}

function numberFormat(num: string | number) {
    return (+num).toLocaleString();
}

function trim(string) {
    return string.split('\n').map(str => str.trim()).join('\n');
}

function determineTheMagic(username: string): number {
    const chars = ' abcdefghijklmnopqrstuvwxyz';
    const key = username.toLowerCase().replace(/[^a-z]/g, '');

    return +(_.map(key, char => chars.indexOf(char)).join(''));
}

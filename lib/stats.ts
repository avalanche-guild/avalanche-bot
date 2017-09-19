import * as Bluebird from 'bluebird';
import * as nodeFs from 'fs';

import { path as rootPath } from 'app-root-path';

const fs = Bluebird.promisifyAll(nodeFs);

export type Stats = {
    [userId: string]: {
        // a reference to their username at the time of the capture (reserved for future use)
        username: string,
        score: number,
    }
}

export async function fetch(name: string): Promise<Stats> {
    const statsFile = getPathFromName(name);

    try {
        return JSON.parse(await fs.readFileAsync(statsFile));
    } catch (err) {
        // no stats could be read, start stats over
        return {};
    }
}

export async function save(name: string, stats: Stats): Promise<void> {
    const statsFile = getPathFromName(name);

    await fs.writeFileAsync(statsFile, JSON.stringify(stats, null, 2));
}

function getPathFromName(name: string): string {
    return `${rootPath}/stats/${name}.json`;
}

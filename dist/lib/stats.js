"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const Bluebird = require("bluebird");
const nodeFs = require("fs");
const app_root_path_1 = require("app-root-path");
const fs = Bluebird.promisifyAll(nodeFs);
async function fetch(name) {
    const statsFile = getPathFromName(name);
    try {
        return JSON.parse(await fs.readFileAsync(statsFile));
    }
    catch (err) {
        // no stats could be read, start stats over
        return {};
    }
}
exports.fetch = fetch;
async function save(name, stats) {
    const statsFile = getPathFromName(name);
    await fs.writeFileAsync(statsFile, JSON.stringify(stats, null, 2));
}
exports.save = save;
function getPathFromName(name) {
    return `${app_root_path_1.path}/stats/${name}.json`;
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoic3RhdHMuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi9saWIvc3RhdHMudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7QUFBQSxxQ0FBcUM7QUFDckMsNkJBQTZCO0FBRTdCLGlEQUFpRDtBQUVqRCxNQUFNLEVBQUUsR0FBRyxRQUFRLENBQUMsWUFBWSxDQUFDLE1BQU0sQ0FBQyxDQUFDO0FBVWxDLEtBQUssZ0JBQWdCLElBQVk7SUFDcEMsTUFBTSxTQUFTLEdBQUcsZUFBZSxDQUFDLElBQUksQ0FBQyxDQUFDO0lBRXhDLElBQUksQ0FBQztRQUNELE1BQU0sQ0FBQyxJQUFJLENBQUMsS0FBSyxDQUFDLE1BQU0sRUFBRSxDQUFDLGFBQWEsQ0FBQyxTQUFTLENBQUMsQ0FBQyxDQUFDO0lBQ3pELENBQUM7SUFBQyxLQUFLLENBQUMsQ0FBQyxHQUFHLENBQUMsQ0FBQyxDQUFDO1FBQ1gsMkNBQTJDO1FBQzNDLE1BQU0sQ0FBQyxFQUFFLENBQUM7SUFDZCxDQUFDO0FBQ0wsQ0FBQztBQVRELHNCQVNDO0FBRU0sS0FBSyxlQUFlLElBQVksRUFBRSxLQUFZO0lBQ2pELE1BQU0sU0FBUyxHQUFHLGVBQWUsQ0FBQyxJQUFJLENBQUMsQ0FBQztJQUV4QyxNQUFNLEVBQUUsQ0FBQyxjQUFjLENBQUMsU0FBUyxFQUFFLElBQUksQ0FBQyxTQUFTLENBQUMsS0FBSyxFQUFFLElBQUksRUFBRSxDQUFDLENBQUMsQ0FBQyxDQUFDO0FBQ3ZFLENBQUM7QUFKRCxvQkFJQztBQUVELHlCQUF5QixJQUFZO0lBQ2pDLE1BQU0sQ0FBQyxHQUFHLG9CQUFRLFVBQVUsSUFBSSxPQUFPLENBQUM7QUFDNUMsQ0FBQyJ9
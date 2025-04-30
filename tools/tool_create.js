// @ts-check

import path from "path";
import fs from "fs";

/**
 * Create a new tool written in JavaScript.
 * @typedef {Object} Args
 * @property {string} name - Tool name slug.
 * @property {string} description - The description of the tool.
 * @property {string} code - JavaScript script body that is executed when the tool is run.
 * @property {{name: string, type: string}[]} args - Tool arguments
 * @param {Args} args
 */
exports.run = function ({ name, description, args, code }) {
    const stream = fs.createWriteStream(path.join(__dirname, `${name}.js`));

    stream.write(`/**
 * ${description}
 * @typedef {Object} Args ${args.map(({name, type}) => `
 * @property {${type}} ${name} - ${type}`)}
 * @param {Args} args
 */
exports.run = function ({ ${args.map(a => a.name).join(", ")} }) {
    ${code}
}
`);
}

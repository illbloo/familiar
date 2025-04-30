// @ts-check

import path from "path";
import fs from "fs";
import { exec } from "child_process";

/**
 * Create a new tool written in JavaScript.
 * @typedef {Object} Args
 * @property {string} name - Tool name slug
 * @property {string} extension - Tool file extension (js, sh, py)
 * @param {Args} args
 */
exports.run = function ({ name, extension }) {
    const root_dir = path.join(__dirname, `..`);
    const txt_path = path.join(root_dir, `tools.txt`);
    fs.appendFileSync(txt_path, `\n${name}.${extension}`);
    exec(path.join(root_dir, `build.sh`));
}

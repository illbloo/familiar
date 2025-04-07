import { promises as fs } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const MCP_JSON_PATH = path.join(path.dirname(path.dirname(fileURLToPath(import.meta.url))), 'mcp.json');
console.log(MCP_JSON_PATH);

async function set(name, data) {
    const mcp = await load();
    mcp.mcpServers[name] = data;
    await save(mcp);
    console.log(`Tool set: ${name}`);
}

async function remove(name) {
    const mcp = await load();
    delete mcp.mcpServers[name];
    await save(mcp);
    console.log(`Tool removed: ${name}`);
}

async function enable(tool) {
    const mcp = await load();
    mcp.mcpServers[tool] = mcp.mcpServersDisabled[tool];
    delete mcp.mcpServersDisabled[tool];
    await save(mcp);
    console.log(`Tool enabled: ${tool}`);
}

async function disable(name) {
    const mcp = await load();
    const tool = mcp.mcpServers[name];
    if (!tool) {
        throw new Error(`Tool '${name}' not found`);
    }
    mcp.mcpServersDisabled[name] = tool;
    delete mcp.mcpServers[name];
    await save(mcp);
    console.log(`Tool disabled: ${name}`);
}

async function load() {
    let mcp = await fs.readFile(MCP_JSON_PATH, 'utf-8').then(JSON.parse);
    if (!mcp.mcpServers) mcp.mcpServers = {};
    if (!mcp.mcpServersDisabled) mcp.mcpServersDisabled = {};
    return mcp;
}

async function save(mcp) {
    await fs.writeFile(MCP_JSON_PATH, JSON.stringify(mcp, null, 2));
}

async function main() {
    const argv = process.argv.slice(2);
    const command = argv[0];
    const name = argv[1];
    const data = argv[2];

    switch (command) {
        case 'set':
            await set(name, data);
            break;
        case 'remove':
            await remove(name);
            break;
        case 'enable':
            await enable(name);
            break;
        case 'disable':
            await disable(name);
            break;
    }
}

main().catch(console.error);
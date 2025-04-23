// @ts-check

const fs = require('fs');
const path = require('path');

const AICHAT_DIR = path.dirname(path.dirname(__dirname));
const SESSIONS_DIR = path.join(AICHAT_DIR, 'agents/familiar/sessions');
const RAGS_DIR = path.join(AICHAT_DIR, 'rags');

async function main() {
    const sessions = [];

    const sessions_dir = await fs.promises.readdir(SESSIONS_DIR);
    for (const file of sessions_dir) {
        const basename = path.basename(file, '.yaml');
        if (file.endsWith('.yaml')) {
            /** @type {{session: string, rag: string | null, description: string | null}} */
            const session = {
                session: file.slice(0, -5),
                rag: null,
                description: null,
            };
            const rag_file = path.join(RAGS_DIR, `session-${basename}.yaml`);
            if (fs.existsSync(rag_file)) {
                session.rag = rag_file;
            }
            sessions.push(session);
        }
    }

    fs.writeFileSync(path.join(AICHAT_DIR, 'sessions.json'), JSON.stringify(sessions, null, 2));
}

main();
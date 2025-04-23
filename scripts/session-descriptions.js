// @ts-check

const fs = require('fs');
const path = require('path');
const spawn = require('child_process').spawn;

/** @typedef {{session: string, rag: string | null, description: string | null}} Session */

const SESSIONS_FILE = process.env.SESSIONS_FILE || path.resolve(__dirname, '../../sessions.json');

async function main() {
    const file = path.resolve(SESSIONS_FILE);

    await Promise.all(JSON.parse(fs.readFileSync(file, 'utf8')).map(getDescription))
        .then(JSON.stringify)
        .then(json => {
            console.log('writing sessions to', file);
            fs.writeFileSync(file, json);
        });
}

/** @param {Session} session */
async function getDescription(session) {
    if (session.rag === null || session.description !== null) {
        return session;
    }
    const sessionId = session.session.slice(0, 8); // Use first 8 chars of session ID for brevity
    console.log(`[${sessionId}] Starting...`);

    return new Promise((resolve) => {
        let stdout = '';
        let stderr = '';
        let lastProgressUpdate = Date.now();

        const child = spawn('aichat', [
            '--rag', `session-${session.session}`,
            '--role', 'familiar',
            '--no-stream',
            "please describe the previous chat in one sentence! don't include *action text* or line breaks in ur response, pls~",
        ]);

        // Set a timeout
        const timeout = setTimeout(() => {
            console.error(`[${sessionId}] Timeout waiting for aichat`);
            child.kill();
            resolve(session);
        }, 30000); // 30 second timeout

        child.stdout.on('data', (data) => {
            stdout += data;
            // Only update progress every 500ms to avoid too frequent updates
            const now = Date.now();
            if (now - lastProgressUpdate > 500) {
                process.stdout.write(`\r[${sessionId}] Processing... ${stdout.length} bytes received`);
                lastProgressUpdate = now;
            }
        });

        child.stderr.on('data', (data) => {
            stderr += data;
            // Only show errors if they're not empty
            if (data.toString().trim()) {
                console.error(`\n[${sessionId}] ERROR: ${data.toString().trim()}`);
            }
        });

        child.on('close', (code) => {
            clearTimeout(timeout);
            // Clear the progress line
            process.stdout.write('\r' + ' '.repeat(50) + '\r');
            
            if (code !== 0) {
                console.error(`[${sessionId}] Failed with code ${code}`);
                resolve(session);
                return;
            }
            session.description = stdout.trim();
            console.log(`[${sessionId}] Done`);
            resolve(session);
        });

        child.on('error', (err) => {
            clearTimeout(timeout);
            // Clear the progress line
            process.stdout.write('\r' + ' '.repeat(50) + '\r');
            console.error(`[${sessionId}] Failed to start: ${err.message}`);
            resolve(session);
        });
    });
}

main();

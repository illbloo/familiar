#!/usr/bin/env bash
set -e

# @env LLM_OUTPUT=/dev/stdout The output path

ROOT_DIR="${LLM_ROOT_DIR:-$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)}"

# @cmd Create RAG embeddings for a chat session
# @option --session! Session name
session_rag_create() {
    "$ROOT_DIR/scripts/create-rag.sh" "$argc_session"
    echo "RAG created: $argc_session" >> "$LLM_OUTPUT"
}

# See more details at https://github.com/sigoden/argc
eval "$(argc --argc-eval "$0" "$@")"

# @cmd List all chat sessions
session_list() {
    cat "$ROOT_DIR/../sessions.json" >> "$LLM_OUTPUT"
}

# @cmd Query a past chat session's RAG embeddings with a prompt
# @option --session! Session name
# @option --prompt! Prompt
session_query() {
    aichat --macro querysession "$argc_session" "$argc_prompt" >> "$LLM_OUTPUT"
}
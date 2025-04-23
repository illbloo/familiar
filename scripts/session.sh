#!/usr/bin/env bash
set -e

# @meta dotenv

SESSIONS_FILE=/Users/aichat/sessions.json

# @describe Browse an aichat session
# @arg agent! Agent to browse sessions for

main() {
    select_session "$argc_agent"
}

# @cmd Browse agent sessions
# @arg agent! Agent to browse sessions for
select_session() {
    aichat --agent "$argc_agent" --list-sessions | \
        fzf --preview "aichat --agent $argc_agent --session {} --info | bat --style=numbers --language=yaml" \
            --preview-window=right:60% #\
            #--bind 'ctrl-e:execute(echo {} | xargs -I % sh -c aichat --macro querysession % "what are the key topics in this conversation?")' \
            #--bind 'ctrl-v:execute(echo {} | xargs -I % sh -c aichat --macro querysession % "explain this context chunk concisely: %")' \
            #--header "ctrl-e: explain session || ctrl-v: explain chunk || enter: view details"
}

# See more details at https://github.com/sigoden/argc
eval "$(argc --argc-eval "$0" "$@")"

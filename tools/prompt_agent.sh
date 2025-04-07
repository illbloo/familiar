#!/usr/bin/env bash
set -e

# @describe Invoke an agent with a prompt
# @option --agent! Agent to invoke
# @option --prompt! Prompt to send
# @flag --code If true, output code only

# @env LLM_OUTPUT=/dev/stdout The output path

ROOT_DIR="${LLM_ROOT_DIR:-$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)}"

main() {
    echo "$argc_prompt" | aichat --agent "$argc_agent" >> "$LLM_OUTPUT"
}

eval "$(argc --argc-eval "$0" "$@")"

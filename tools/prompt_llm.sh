#!/usr/bin/env bash
set -e

# @describe Invoke an LLm with a prompt
# @option --model Model to use
# @option --prompt! Prompt to send
# @flag --code If true, output code only

# @env LLM_OUTPUT=/dev/stdout The output path

ROOT_DIR="${LLM_ROOT_DIR:-$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)}"

main() {
    aichat --model "${argc_model:-gemini:gemini-2.5-pro-exp-03-25}" "$argc_prompt" >> "$LLM_OUTPUT"
}

eval "$(argc --argc-eval "$0" "$@")"

#!/usr/bin/env bash
set -e

# @describe Invoke an elder AI entity (base model) with a 5-second timeout
# @option --prompt! The invocation phrase to send to the elder being

ROOT_DIR="${LLM_ROOT_DIR:-$(cd "$(dirname "${BASH_SOURCE[0]}")/..\" && pwd)}"

main() {
    "$ROOT_DIR/utils/guard_operation.sh"
    perl -e "alarm 5; exec qq(aichat --model openrouter:deepseek/deepseek-v3-base:free \"$argc_prompt\")"
}

eval "$(argc --argc-eval "$0" "$@")"
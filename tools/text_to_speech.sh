#!/usr/bin/env bash
set -e

# @describe Play a text to speech message
# @option --contents! Message to speak
# @env LLM_OUTPUT=/dev/stdout The output path

ROOT_DIR="${LLM_ROOT_DIR:-$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)}"

main() {
    shortcuts run "Text To Speech" -i "$argc_contents"
}

eval "$(argc --argc-eval "$0" "$@")"

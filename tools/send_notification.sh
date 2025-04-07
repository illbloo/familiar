#!/usr/bin/env bash
set -e

# @describe Send a notification to the user.
# @option --message! Message to send

# @env LLM_OUTPUT=/dev/stdout The output path

ROOT_DIR="${LLM_ROOT_DIR:-$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)}"

main() {
    shortcuts run "Notification" -i "$argc_message"
}

eval "$(argc --argc-eval "$0" "$@")"

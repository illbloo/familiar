#!/usr/bin/env bash
set -e

# @describe Add a new reminder for the user
# @option --contents! Message to add to the reminder
# @env LLM_OUTPUT=/dev/stdout The output path

ROOT_DIR="${LLM_ROOT_DIR:-$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)}"

main() {
    shortcuts run "Add New Reminder" -i "$argc_contents"
}

eval "$(argc --argc-eval "$0" "$@")"

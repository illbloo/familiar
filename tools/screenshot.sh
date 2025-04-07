#!/usr/bin/env bash
set -e

# @describe Prompt user to take a screenshot

# @env LLM_OUTPUT=/dev/stdout Output file read

main() {
    shortcuts run "Take Screenshot" >> "$LLM_OUTPUT"
}

eval "$(argc --argc-eval "$0" "$@")"

#!/usr/bin/expect

spawn aichat --rag session-$argv
expect "Select embedding model:"
send "\r"
expect "Set chunk size:"
send "1000\r"
expect "Set chunk overlay:"
send "50\r"
expect "Add documents:"
send "~/aichat/agents/familiar/sessions/$argv.yaml\r"
set timeout 500
expect "Saved RAG to "
send ".exit\r"

exit 0
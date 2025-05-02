# Web MIDI OpenAI Streamer - Web Interface

This is a simple web interface for the OpenAI to MIDI streaming functionality. It allows you to stream OpenAI completions directly to a MIDI device from your browser.

## Features

- Request MIDI access directly in the browser
- Select from available MIDI output devices
- Configure OpenAI API parameters (model, temperature, tokens)
- Set MIDI playback parameters (channel, note length)
- Visual piano keyboard display showing played notes
- Text output display showing generated content

## How to Use

1. **Launch the web interface:**
   ```
   cd src/web
   python -m http.server 8000
   ```
   Then open your browser to http://localhost:8000

2. **Request MIDI Access** - Click the button to request Web MIDI API access

3. **Configure settings:**
   - Select your MIDI output device
   - Enter your OpenAI API key
   - Enter a prompt
   - Optionally adjust advanced settings

4. **Start Streaming** - Click the "Start Streaming" button to begin

5. **Watch and Listen** - See the text generate while hearing the corresponding MIDI notes played on your selected device

## Requirements

- A browser that supports Web MIDI API (Chrome, Edge, Opera)
- A MIDI output device or virtual instrument
- An OpenAI API key

## Notes

- This interface works entirely in the browser - no server needed
- Your API key is never stored and is only sent directly to OpenAI
- The visual piano keyboard shows notes from C2 (36) to C6 (84)
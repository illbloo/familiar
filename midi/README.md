# Web MIDI OpenAI Streamer

This project connects OpenAI API completions to MIDI output devices, generating musical patterns from AI text output.

## What It Does

The core functionality converts an OpenAI text stream into MIDI notes:

1. Each character from an OpenAI streaming completion triggers a MIDI note
2. Characters are mapped to specific notes based on their character codes
3. Different characters trigger different velocities (loudness)
4. The result is an abstract musical pattern generated from AI text

## Getting Started

1. Install dependencies:
   ```
   npm install
   ```

2. Create a `.env` file with your OpenAI API key:
   ```
   OPENAI_API_KEY=your_api_key_here
   ```

3. Connect a MIDI device or start a virtual MIDI instrument

4. Run the example:
   ```
   npx ts-node src/examples/openai-midi-stream.ts
   ```

## Configuration

You can configure various aspects by adjusting parameters in the `.env` file:
- `MODEL` - OpenAI model to use (default: gpt-3.5-turbo)
- `MAX_TOKENS` - Maximum completion length (default: 500)
- `TEMPERATURE` - Randomness of completion (default: 0.7)
- `CHANNEL` - MIDI channel to use (default: 1)
- `NOTE_LENGTH` - Duration of each note in milliseconds (default: 100)

## Creative Ideas

- Modify the character-to-note mapping for different musical outcomes
- Create prompt templates that generate interesting text variations
- Use different MIDI channels for different aspects of the response
- Map punctuation to percussion notes on channel 10
- Experiment with prompts that generate different emotional content

## Functions

The main components include:

- `streamOpenAIToMidi`: Converts OpenAI completions to MIDI notes
- `charToMidiNote`: Maps text characters to MIDI note numbers
- `charToVelocity`: Maps characters to note velocities
- `createMidiFromPrompt`: Helper function to quickly create MIDI from a prompt

## Requirements

- Node.js
- A MIDI output device or virtual instrument
- OpenAI API key
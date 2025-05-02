import OpenAI from 'openai';
import { sendMidiMessage } from './send';
import { getMidiOutputs } from './io';
import { requestMidiAccess } from './io';

// Character to MIDI note mapping function
const charToMidiNote = (char: string): number => {
  // Get the character code (0-127 range is valid for MIDI)
  const charCode = char.charCodeAt(0);
  
  // Map the character code to MIDI note range (36-84 for a reasonable range)
  // This gives 48 possible notes which is 4 octaves
  return 36 + (charCode % 48);
};

// Character to velocity mapping
const charToVelocity = (char: string): number => {
  // Different characters get different velocities for variety
  const charCode = char.charCodeAt(0);
  
  // Generate velocities between 60-127 (medium to loud)
  return 60 + (charCode % 68);
};

export interface LlmMidiStreamOptions {
  deviceId: string | { id: string, send: (data: number[]) => void };
  model: string;
  prompt: string;
  maxTokens?: number;
  temperature?: number;
  channel?: number;
  noteLength?: number; // milliseconds - how long to hold each note
  onContent?: (content: string) => void; // callback for received content
}

export async function streamOpenAIToMidi(
  llm: OpenAI,
  options: LlmMidiStreamOptions
): Promise<void> {
  const {
    deviceId,
    model,
    prompt,
    maxTokens = 100,
    temperature = 0.7,
    channel = 1,
    noteLength = 120, // default note length in ms
    onContent
  } = options;
  
  let actualDeviceId: string;
  let customDevice: { id: string, send: (data: number[]) => void } | null = null;
  
  // Handle both string deviceId and custom device object
  if (typeof deviceId === 'string') {
    actualDeviceId = deviceId;
    
    // Verify the device exists when using a string ID
    const { outputs } = await getMidiOutputs();
    const outputDevice = outputs.find(output => output.id === actualDeviceId);
    
    if (!outputDevice) {
      throw new Error(`MIDI output device with ID ${actualDeviceId} not found`);
    }
    
    console.log(`Streaming to MIDI device: ${outputDevice.name}`);
  } else {
    // Using custom device object (for web environments)
    actualDeviceId = deviceId.id;
    customDevice = deviceId;
    console.log(`Streaming to custom MIDI device with ID: ${actualDeviceId}`);
  }
  
  // Create streaming completion
  const stream = await llm.chat.completions.create({
    model,
    messages: [{ role: 'user', content: prompt }],
    max_tokens: maxTokens,
    temperature,
    stream: true,
  });
  
  // Process each chunk of the stream
  for await (const chunk of stream) {
    const content = chunk.choices[0]?.delta?.content;
    
    if (content) {
      // Call content callback if provided
      if (onContent) {
        onContent(content);
      }
      
      // For each character in the content, send a MIDI note
      for (const char of content) {
        if (char.trim() === '') continue; // Skip whitespace
        
        const note = charToMidiNote(char);
        const velocity = charToVelocity(char);
        
        // Handle different device types
        if (customDevice) {
          // Send direct MIDI message to custom device
          const noteOnMessage = [0x90 + (channel - 1), note, velocity];
          customDevice.send(noteOnMessage);
          
          // Wait for the specified note length
          await new Promise(resolve => setTimeout(resolve, noteLength));
          
          // Send note-off message
          const noteOffMessage = [0x80 + (channel - 1), note, 0];
          customDevice.send(noteOffMessage);
        } else {
          // Send through the standard MIDI interface
          await sendMidiMessage({
            deviceId: actualDeviceId,
            messageType: 'noteOn',
            channel,
            note,
            velocity
          });
          
          // Wait for the specified note length
          await new Promise(resolve => setTimeout(resolve, noteLength));
          
          // Send note-off message
          sendMidiMessage({
            deviceId: actualDeviceId,
            messageType: 'noteOff',
            channel,
            note,
            velocity: 0
          });
        }
      }
    }
  }
  
  console.log('OpenAI stream completed');
}

/**
 * Example script that demonstrates converting an OpenAI stream into MIDI notes
 * 
 * To use this:
 * 1. Create a .env file with your OPENAI_API_KEY=your_key_here
 * 2. Connect a MIDI device or open a software MIDI port (like a virtual instrument)
 * 3. Run this script
 */
async function main(): Promise<void> {
  // Request MIDI access
  const accessResult = await requestMidiAccess({
    sysex: false,
    software: true,
  });
  console.log(`MIDI access: ${accessResult.message}`);
  console.log(`Available MIDI outputs: ${accessResult.outputs}`);

  if (accessResult.outputs === 0) {
    console.error('No MIDI output devices found. Please connect a device and try again.');
    return;
  }

  // Get available MIDI outputs
  const { outputs } = await getMidiOutputs();
  console.log('Available MIDI devices:');

  outputs.forEach((output, index) => {
    console.log(`${index + 1}. ${output.name} (${output.id})`);
  });

  // For this example, just use the first available output
  const output = outputs[0];
  if (!output) {
    console.error('No MIDI output devices found. Please connect a device and try again.');
    return;
  }
  const deviceId = output.id;
  console.log(`Using device: ${output.name}`);

  const llm = new OpenAI({
    apiKey: OPENROUTER_API_KEY,
    baseURL: "https://openrouter.ai/api/v1",
  });

  console.log('Starting OpenAI to MIDI stream...');
  console.log('Listen to your MIDI device for the notes!');

  // Run the conversion
  await streamOpenAIToMidi(llm, {
    deviceId,
    model: "openai/gpt-4.1-nano",
    prompt: "Write a short poem about the sound of music. Use varied language, rhythm, and emotion.",
    maxTokens: 500,
    temperature: 1,
    channel: 1,
    noteLength: 100
  });

  console.log('Stream complete! You should have heard the text as MIDI notes.');
}

// Run the example
main();

/*
Different creative ideas to try:
1. Change the character-to-note mapping for different musical styles
2. Create melodic patterns based on token types (nouns, verbs, etc.)
3. Use different MIDI channels for different aspects of the response
4. Map punctuation to percussion notes on channel 10
5. Create velocity curves based on sentence structure
6. Use sustained notes for longer tokens and staccato for shorter ones
*/

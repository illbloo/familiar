import { streamOpenAIToMidi, type LlmMidiStreamOptions } from '../llm-midi-stream';
import OpenAI from 'openai';

// Global variables
let midiAccess: WebMidi.MIDIAccess | null = null;
let activeDevice: WebMidi.MIDIOutput | null = null;
let isStreaming = false;
let streamController: AbortController | null = null;
let activeNotes = new Set<number>();

// DOM elements
async function init() {
  const requestMidiAccessBtn = document.getElementById('requestMidiAccess') as HTMLButtonElement | null;
  const midiStatusEl = document.getElementById('midiStatus') as HTMLDivElement | null;
  const midiSetupEl = document.getElementById('midiSetup') as HTMLDivElement | null;
  const mainContentEl = document.getElementById('mainContent') as HTMLDivElement | null;
  const outputDevicesEl = document.getElementById('outputDevices') as HTMLSelectElement | null;
  const promptEl = document.getElementById('prompt') as HTMLTextAreaElement | null;
  const apiKeyEl = document.getElementById('apiKey') as HTMLInputElement | null;
  const startStreamBtn = document.getElementById('startStream') as HTMLButtonElement | null;
  const stopStreamBtn = document.getElementById('stopStream') as HTMLButtonElement | null;
  const streamStatusEl = document.getElementById('streamStatus') as HTMLDivElement | null;
  const textOutputEl = document.getElementById('textOutput') as HTMLDivElement | null;
  const pianoContainerEl = document.getElementById('pianoContainer') as HTMLDivElement | null;
  const modelEl = document.getElementById('model') as HTMLSelectElement | null;
  const temperatureEl = document.getElementById('temperature') as HTMLInputElement | null;
  const maxTokensEl = document.getElementById('maxTokens') as HTMLInputElement | null;
  const channelEl = document.getElementById('channel') as HTMLInputElement | null;
  const noteLengthEl = document.getElementById('noteLength') as HTMLInputElement | null;
  const showAdvancedEl = document.getElementById('showAdvanced') as HTMLDivElement | null;
  const advancedSettingsEl = document.getElementById('advancedSettings') as HTMLDivElement | null;

  // Helper function to check if an element exists
  function assertElement<T extends HTMLElement>(element: T | null, id: string): T {
    if (!element) {
      throw new Error(`Element with ID "${id}" not found.`);
    }
    return element;
  }

  // Assert elements exist (or handle cases where they might not)
  const safeRequestMidiAccessBtn = assertElement(requestMidiAccessBtn, 'requestMidiAccess');
  const safeMidiStatusEl = assertElement(midiStatusEl, 'midiStatus');
  const safeMidiSetupEl = assertElement(midiSetupEl, 'midiSetup');
  const safeMainContentEl = assertElement(mainContentEl, 'mainContent');
  const safeOutputDevicesEl = assertElement(outputDevicesEl, 'outputDevices');
  const safePromptEl = assertElement(promptEl, 'prompt');
  const safeApiKeyEl = assertElement(apiKeyEl, 'apiKey');
  const safeStartStreamBtn = assertElement(startStreamBtn, 'startStream');
  const safeStopStreamBtn = assertElement(stopStreamBtn, 'stopStream');
  const safeStreamStatusEl = assertElement(streamStatusEl, 'streamStatus');
  const safeTextOutputEl = assertElement(textOutputEl, 'textOutput');
  const safePianoContainerEl = assertElement(pianoContainerEl, 'pianoContainer');
  const safeModelEl = assertElement(modelEl, 'model');
  const safeTemperatureEl = assertElement(temperatureEl, 'temperature');
  const safeMaxTokensEl = assertElement(maxTokensEl, 'maxTokens');
  const safeChannelEl = assertElement(channelEl, 'channel');
  const safeNoteLengthEl = assertElement(noteLengthEl, 'noteLength');
  const safeShowAdvancedEl = assertElement(showAdvancedEl, 'showAdvanced');
  const safeAdvancedSettingsEl = assertElement(advancedSettingsEl, 'advancedSettings');

  // Initialize piano keyboard display
  function initializePiano() {
    // Create piano keys from MIDI notes 36 to 84 (C2 to C6)
    const startNote = 36;
    const endNote = 84;
    const whiteKeyNotes = [0, 2, 4, 5, 7, 9, 11]; // Pattern of white keys in an octave (C, D, E, F, G, A, B)

    // First, create all white keys
    const whiteKeys = [];
    for (let note = startNote; note <= endNote; note++) {
      if (whiteKeyNotes.includes(note % 12)) {
        const key = document.createElement('div');
        key.className = 'piano-key';
        key.dataset.note = note.toString();
        key.title = `Note ${note}`;
        safePianoContainerEl.appendChild(key);
        whiteKeys.push({ note, element: key });
      }
    }

    // Then add black keys in the right positions
    const blackKeyNotes = [1, 3, 6, 8, 10]; // Pattern of black keys in an octave (C#, D#, F#, G#, A#)
    let whiteKeyIndex = 0;

    for (let note = startNote; note <= endNote; note++) {
      if (blackKeyNotes.includes(note % 12)) {
        const key = document.createElement('div');
        key.className = 'piano-key black';
        key.dataset.note = note.toString();
        key.title = `Note ${note}`;

        // Position the black key between white keys
        if (whiteKeyIndex > 0) {
          const prevWhiteKeyData = whiteKeys[whiteKeyIndex - 1];
          if (prevWhiteKeyData) {
             const prevWhiteKey = prevWhiteKeyData.element;
             const leftPos = prevWhiteKey.offsetLeft + prevWhiteKey.offsetWidth - 9;
             key.style.left = leftPos + 'px';
           }
        }

        safePianoContainerEl.appendChild(key);
      } else if (whiteKeyNotes.includes(note % 12)) {
        whiteKeyIndex++;
      }
    }
  }

  // Toggle advanced settings
  safeShowAdvancedEl.addEventListener('click', () => {
    if (safeAdvancedSettingsEl.style.display === 'none' || !safeAdvancedSettingsEl.style.display) {
      safeAdvancedSettingsEl.style.display = 'block';
      safeShowAdvancedEl.textContent = '- Hide Advanced Settings';
    } else {
      safeAdvancedSettingsEl.style.display = 'none';
      safeShowAdvancedEl.textContent = '+ Show Advanced Settings';
    }
  });

  // Request MIDI access
  safeRequestMidiAccessBtn.addEventListener('click', async () => {
    try {
      console.log('Requesting MIDI access...');
      midiAccess = await navigator.requestMIDIAccess();
      console.log('MIDI access granted, available outputs:', midiAccess.outputs.size);
      safeMidiStatusEl.textContent = 'MIDI access granted! ✅';
      safeMidiSetupEl.style.display = 'none';
      safeMainContentEl.style.display = 'block';

      // Populate output devices
      updateOutputDevices();

      // Initialize piano
      initializePiano();

    } catch (error: unknown) {
      let errorMessage = 'An unknown error occurred';
      if (error instanceof Error) {
          errorMessage = error.message;
      }
      safeMidiStatusEl.textContent = `Error accessing MIDI: ${errorMessage}`;
    }
  });

  // Update output devices list
  function updateOutputDevices() {
    console.log('Updating output devices list...');
    // Clear existing options
    safeOutputDevicesEl.innerHTML = '<option value="">Select a MIDI output device</option>';

    // Add available outputs
    if (!midiAccess) {
        console.error("MIDI Access not available when trying to update devices.");
        return;
    }
    for (const output of midiAccess.outputs.values()) {
      const option = document.createElement('option');
      option.value = output.id;
      option.textContent = output.name || `Output ${output.id}`;
      safeOutputDevicesEl.appendChild(option);
    }
  }

  // Start streaming
  safeStartStreamBtn.addEventListener('click', async () => {
    const deviceId = safeOutputDevicesEl.value;
    const apiKey = safeApiKeyEl.value.trim();
    const prompt = safePromptEl.value.trim();

    console.log('Starting stream with device:', deviceId);
    console.log('Stream parameters:', {
      model: safeModelEl.value,
      temperature: safeTemperatureEl.value,
      maxTokens: safeMaxTokensEl.value,
      channel: safeChannelEl.value,
      noteLength: safeNoteLengthEl.value
    });

    if (!deviceId) {
      safeStreamStatusEl.textContent = 'Please select a MIDI output device';
      return;
    }

    if (!apiKey) {
      safeStreamStatusEl.textContent = 'Please enter your OpenAI API key';
      return;
    }

    if (!prompt) {
      safeStreamStatusEl.textContent = 'Please enter a prompt';
      return;
    }

    if (!midiAccess) {
        safeStreamStatusEl.textContent = 'MIDI access not available.';
        return;
    }

    try {
      // Get selected device
      const selectedOutput = midiAccess.outputs.get(deviceId);
      if (!selectedOutput) {
        safeStreamStatusEl.textContent = `MIDI device with ID "${deviceId}" not found.`;
        return;
      }
      activeDevice = selectedOutput;

      // Get parameters
      const model = safeModelEl.value;
      const temperature = parseFloat(safeTemperatureEl.value);
      const maxTokens = parseInt(safeMaxTokensEl.value);
      const channel = parseInt(safeChannelEl.value);
      const noteLength = parseInt(safeNoteLengthEl.value);

      // Update UI
      isStreaming = true;
      safeStreamStatusEl.textContent = 'Streaming to ' + activeDevice.name + '...';
      safeStartStreamBtn.style.display = 'none';
      safeStopStreamBtn.style.display = 'block';
      safeTextOutputEl.style.display = 'block';
      safeTextOutputEl.textContent = '';

      // Create OpenAI instance
      const llm = new OpenAI({
        apiKey,
        baseURL: "http://openrouter.ai/api/v1",
        dangerouslyAllowBrowser: true
      });

      // Setup for capturing and displaying text output
      const updateUIWithText = (text: string) => {
        safeTextOutputEl.textContent += text;
        safeTextOutputEl.scrollTop = safeTextOutputEl.scrollHeight;
      };

      // Setup for piano visualization
      const onNoteOn = (note: number) => {
        highlightKey(note, true);
        activeNotes.add(note);
      };

      const onNoteOff = (note: number) => {
        highlightKey(note, false);
        activeNotes.delete(note);
      };

      // Override the existing WebMIDI device with a custom implementation
      // that hooks into our UI
      const webMidiDeviceWrapper = {
        id: deviceId,
        send: (data: number[] | Uint8Array) => {
          // The actual MIDI device send
          activeDevice?.send(data);
          
          // Parse MIDI message to update UI
          if (data.length >= 2) { 
            const statusByte = data[0];
            const note = data[1]; // Note Number

            // Explicitly check statusByte and note are numbers
            if (typeof statusByte !== 'number' || typeof note !== 'number') return;

            // Note On: Check status, length, and velocity > 0
            if ((statusByte & 0xF0) === 0x90) {
              if (data.length >= 3) {
                const velocity = data[2];
                // Check velocity is a number and > 0 for Note On
                if (typeof velocity === 'number' && velocity > 0) {
                  onNoteOn(note);
                // If velocity is 0, treat as Note Off
                } else if (typeof velocity === 'number' && velocity === 0) {
                  onNoteOff(note);
                }
              } 
              // If length < 3 but status is 0x9n, technically invalid MIDI, but safest 
              // to treat as Note Off if velocity isn't specified or invalid.
              // However, usually 0x9n with velocity 0 is Note Off, so we handle that below.
            }
            // Note Off: Check status (0x8n) OR status 0x9n with velocity 0 
            else if ((statusByte & 0xF0) === 0x80) {
              onNoteOff(note); // Standard Note Off message
            }
            // Note: The case for 0x9n with velocity 0 is now handled within the first `if` block. 
            // This simplifies the logic. We could re-add it here if needed, 
            // but the current structure covers Note On (velocity > 0) and Note Off (velocity 0 or 0x8n status)

          }
        }
      };

      // Stream LLM to MIDI
      console.log('Initiating LLM to MIDI stream...');
      await streamOpenAIToMidi(llm, {
        deviceId: webMidiDeviceWrapper,
        model: model,
        prompt: prompt,
        maxTokens: maxTokens,
        temperature: temperature,
        channel: channel,
        noteLength: noteLength,
        onContent: updateUIWithText
      } as LlmMidiStreamOptions & { deviceId: any, onContent: (text: string) => void });

      // When streaming is done
      isStreaming = false;
      safeStreamStatusEl.textContent = 'Streaming complete!';
      safeStopStreamBtn.style.display = 'none';
      safeStartStreamBtn.style.display = 'block';

    } catch (error: unknown) {
      console.error('Streaming error:', error);
      let errorMessage = 'An unknown streaming error occurred';
      if (error instanceof Error) {
          errorMessage = error.message;
      }
      safeStreamStatusEl.textContent = `Error: ${errorMessage}`;
      safeStopStreamBtn.style.display = 'none';
      safeStartStreamBtn.style.display = 'block';
      isStreaming = false;
    }
  });

  // Stop streaming
  safeStopStreamBtn.addEventListener('click', () => {
    console.log('Stopping stream, active notes:', activeNotes.size);
    // Signal to stop the stream
    isStreaming = false;
    
    // Abort any pending fetch requests (if we're still using streamController somewhere)
    if (streamController) {
      streamController.abort();
    }

    safeStreamStatusEl.textContent = 'Streaming stopped.';
    safeStopStreamBtn.style.display = 'none';
    safeStartStreamBtn.style.display = 'block';

    // Turn off any active notes
    if (activeDevice) {
      const channel = parseInt(safeChannelEl.value);
      for (const note of activeNotes) {
        const noteOffMessage = [0x80 + (channel - 1), note, 0];
        activeDevice.send(noteOffMessage);
        highlightKey(note, false);
      }
      activeNotes.clear();
    }
  });

  // Highlight a piano key
  function highlightKey(note: number, active: boolean) {
    console.log(`Highlighting key ${note} ${active ? 'on' : 'off'}`);
    const key = document.querySelector(`.piano-key[data-note="${note}"]`);
    if (key) {
      if (active) {
        key.classList.add('active');
      } else {
        key.classList.remove('active');
      }
    }
  }

  // Check for Web MIDI API support
  if (!navigator.requestMIDIAccess) {
    safeMidiStatusEl.textContent = 'Web MIDI API is not supported in this browser. Try Chrome, Edge, or Opera.';
    safeRequestMidiAccessBtn.disabled = true;
  }
}

// Call init function directly since the script is loaded with type="module",
// which defers execution until the DOM is parsed.
init();
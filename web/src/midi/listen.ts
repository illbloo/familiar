export interface ListenForMidiMessagesResponse {
  success: boolean;
  message: string;
}

export interface StopListeningResponse {
  success: boolean;
  message: string;
}

export const listenForMidiMessages = async (deviceId: string): Promise<ListenForMidiMessagesResponse> => {
  if (!deviceId) {
    throw new Error("Device ID is required");
  }
  
  const midiAccess = await navigator.requestMIDIAccess();
  const input = midiAccess.inputs.get(deviceId);
  
  if (!input) {
    throw new Error(`MIDI input device with ID ${deviceId} not found`);
  }
  
  const messageHandler = (event: any) => {
    const data = event.data;
    const statusByte = data[0];
    const messageType = statusByte & 0xF0;
    const channel = (statusByte & 0x0F) + 1; // Convert 0-based to 1-based
    
    let parsedMessage = {
      timestamp: event.timeStamp,
      rawData: Array.from(data),
      channel
    };
    
    // Parse different message types
    switch (messageType) {
      case 0x80: // Note Off
        Object.assign(parsedMessage, {
          type: "noteOff",
          note: data[1],
          velocity: data[2]
        });
        break;
        
      case 0x90: // Note On (velocity 0 is actually Note Off)
        Object.assign(parsedMessage, {
          type: data[2] === 0 ? "noteOff" : "noteOn",
          note: data[1],
          velocity: data[2]
        });
        break;
        
      case 0xA0: // Polyphonic Aftertouch
        Object.assign(parsedMessage, {
          type: "polyAftertouch",
          note: data[1],
          pressure: data[2]
        });
        break;
        
      case 0xB0: // Control Change
        Object.assign(parsedMessage, {
          type: "controlChange",
          controller: data[1],
          value: data[2]
        });
        break;
        
      case 0xC0: // Program Change
        Object.assign(parsedMessage, {
          type: "programChange",
          program: data[1]
        });
        break;
        
      case 0xD0: // Channel Aftertouch
        Object.assign(parsedMessage, {
          type: "channelAftertouch",
          pressure: data[1]
        });
        break;
        
      case 0xE0: // Pitch Bend
        const pitchValue = ((data[2] << 7) | data[1]);
        Object.assign(parsedMessage, {
          type: "pitchBend",
          value: pitchValue
        });
        break;
        
      case 0xF0: // System messages
        if (statusByte === 0xF0) {
          Object.assign(parsedMessage, {
            type: "sysex",
            data: Array.from(data.slice(1, -1)) // remove F0 and F7
          });
        }
        break;
    }
    
    console.log("MIDI message received:", parsedMessage);
    return parsedMessage;
  };
  
  input.addEventListener("midimessage", messageHandler);
  
  // Store the handler for later removal
  (window as any).__midiListeners = (window as any).__midiListeners || {};
  (window as any).__midiListeners[deviceId] = messageHandler;
  
  return {
    success: true,
    message: `Listening for MIDI messages from device ${input.name || deviceId}`
  };
}

export const stopListening = async (deviceId: string): Promise<StopListeningResponse> => {
  if (!deviceId) {
    throw new Error("Device ID is required");
  }
  
  if (!(window as any).__midiListeners || !(window as any).__midiListeners[deviceId]) {
    throw new Error(`No active listener for device ID ${deviceId}`);
  }
  
  const midiAccess = await navigator.requestMIDIAccess();
  const input = midiAccess.inputs.get(deviceId);
  
  if (input) {
    input.removeEventListener("midimessage", (window as any).__midiListeners[deviceId]);
    delete (window as any).__midiListeners[deviceId];
    
    return {
      success: true,
      message: `Stopped listening for MIDI messages from device ${input.name || deviceId}`
    };
  } else {
    throw new Error(`MIDI input device with ID ${deviceId} not found`);
  }
}

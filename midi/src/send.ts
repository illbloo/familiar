export interface MidiMessage {
  deviceId: string;
  messageType: string;
  channel?: number;
  note?: number;
  velocity?: number;
  controller?: number;
  value?: number;
  program?: number;
  pitchValue?: number;
  sysexData?: number[];
}

export interface SendMidiMessageResponse {
  success: boolean;
  message: string;
}

export const sendMidiMessage = async (params: MidiMessage): Promise<SendMidiMessageResponse> => {
  if (!params.deviceId || !params.messageType) {
    throw new Error("Device ID and message type are required");
  }
  
  const midiAccess = await navigator.requestMIDIAccess();
  const output = midiAccess.outputs.get(params.deviceId);
  
  if (!output) {
    throw new Error(`MIDI output device with ID ${params.deviceId} not found`);
  }
  
  const channel = params.channel ? params.channel - 1 : 0; // Convert 1-based to 0-based
  
  switch (params.messageType) {
    case "noteOn":
      if (params.note === undefined || params.velocity === undefined) {
        throw new Error("Note and velocity are required for noteOn messages");
      }
      output.send([0x90 + channel, params.note, params.velocity]);
      break;
      
    case "noteOff":
      if (params.note === undefined) {
        throw new Error("Note is required for noteOff messages");
      }
      output.send([0x80 + channel, params.note, params.velocity || 0]);
      break;
      
    case "controlChange":
      if (params.controller === undefined || params.value === undefined) {
        throw new Error("Controller and value are required for controlChange messages");
      }
      output.send([0xB0 + channel, params.controller, params.value]);
      break;
      
    case "programChange":
      if (params.program === undefined) {
        throw new Error("Program is required for programChange messages");
      }
      output.send([0xC0 + channel, params.program]);
      break;
      
    case "pitchBend":
      if (params.pitchValue === undefined) {
        throw new Error("Pitch value is required for pitchBend messages");
      }
      const lsb = params.pitchValue & 0x7F;
      const msb = (params.pitchValue >> 7) & 0x7F;
      output.send([0xE0 + channel, lsb, msb]);
      break;
      
    case "sysex":
      if (!params.sysexData || !Array.isArray(params.sysexData)) {
        throw new Error("Sysex data array is required for sysex messages");
      }
      output.send([0xF0, ...params.sysexData, 0xF7]);
      break;
      
    default:
      throw new Error(`Unsupported message type: ${params.messageType}`);
  }
  
  return {
    success: true,
    message: `Sent ${params.messageType} message to device ${output.name || params.deviceId}`
  };
}
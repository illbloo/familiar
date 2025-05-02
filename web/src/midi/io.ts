export type MidiInput = {
  id: string;
  name: string;
  manufacturer: string;
  state: WebMidi.MIDIPortDeviceState;
  connection: WebMidi.MIDIPortConnectionState;
};

export type MidiOutput = {
  id: string;
  name: string;
  manufacturer: string;
  state: WebMidi.MIDIPortDeviceState;
  connection: WebMidi.MIDIPortConnectionState;
};

export interface RequestMidiAccessResponse {
  success: boolean;
  message: string;
  inputs: number;
  outputs: number;
}

export interface GetMidiInputsResponse {
  inputs: MidiInput[];
}

export interface GetMidiOutputsResponse {
  outputs: MidiOutput[];
}

export const requestMidiAccess = async (options: WebMidi.MIDIOptions): Promise<RequestMidiAccessResponse> => {
  if (!navigator.requestMIDIAccess) {
    throw new Error("Web MIDI API is not supported in this browser");
  }
  
  const midiAccess = await navigator.requestMIDIAccess(options);
  
  return {
    success: true,
    message: "MIDI access granted",
    inputs: midiAccess.inputs.size,
    outputs: midiAccess.outputs.size
  };
}

export const getMidiInputs = async (): Promise<GetMidiInputsResponse> => {
  const midiAccess = await navigator.requestMIDIAccess();
  const inputs = Array.from(midiAccess.inputs.values());
  
  return {
    inputs: inputs.map(input => ({
      id: input.id,
      name: input.name || "",
      manufacturer: input.manufacturer || "",
      state: input.state,
      connection: input.connection
    }))
  };
}

export const getMidiOutputs = async (): Promise<GetMidiOutputsResponse> => {
  const midiAccess = await navigator.requestMIDIAccess();
  const outputs = Array.from(midiAccess.outputs.values());
  
  return {
    outputs: outputs.map(output => ({
      id: output.id,
      name: output.name || "",
      manufacturer: output.manufacturer || "",
      state: output.state,
      connection: output.connection
    }))
  };
}
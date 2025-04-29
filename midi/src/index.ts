import { type MidiMessage, sendMidiMessage } from "./send";
import { listenForMidiMessages, stopListening } from "./listen";
import { requestMidiAccess, getMidiInputs, getMidiOutputs } from "./io";

type MidiAction = "requestAccess" | "getMidiInputs" | "getMidiOutputs" | "sendMidiMessage" | "listenForMidiMessages" | "stopListening";
type MidiParams = (MidiMessage | WebMidi.MIDIOptions & { deviceId?: string }) & {
  action: MidiAction
}

export const handleWebMidi = async (params: MidiParams): Promise<any> => {
  try {
    switch (params.action) {
      case "requestAccess":
        return await requestMidiAccess(params as WebMidi.MIDIOptions);
      case "getMidiInputs":
        return await getMidiInputs();
      case "getMidiOutputs":
        return await getMidiOutputs();
      case "sendMidiMessage":
        return await sendMidiMessage(params as MidiMessage);
      case "listenForMidiMessages":
        return await listenForMidiMessages(params.deviceId as string);
      case "stopListening":
        return await stopListening(params.deviceId as string);
      default:
        throw new Error(`Unsupported action: ${params.action}`);
    }
  } catch (error) {
    return {
      success: false,
      error,
    };
  }
}
import type { ChatCompletionTool } from "openai/resources/chat/completions";

export const webMidiTool: ChatCompletionTool = {
  type: "function",
  function: {
    name: "webMidi",
    description: "Interface with the Web MIDI API to access and control MIDI devices",
    parameters: {
      type: "object",
      properties: {
        action: {
          type: "string",
          enum: ["requestAccess", "getMidiInputs", "getMidiOutputs", "sendMidiMessage", "listenForMidiMessages", "stopListening"],
          description: "The MIDI action to perform"
        },
        sysex: {
          type: "boolean",
          description: "Whether to request access to system exclusive messages",
          default: false
        },
        deviceId: {
          type: "string",
          description: "The ID of the MIDI device to interact with"
        },
        messageType: {
          type: "string",
          enum: ["noteOn", "noteOff", "controlChange", "programChange", "pitchBend", "sysex"],
          description: "The type of MIDI message to send"
        },
        channel: {
          type: "integer",
          minimum: 1,
          maximum: 16,
          description: "The MIDI channel (1-16) to send the message on"
        },
        note: {
          type: "integer",
          minimum: 0,
          maximum: 127,
          description: "The MIDI note number (0-127)"
        },
        velocity: {
          type: "integer",
          minimum: 0,
          maximum: 127,
          description: "The velocity/intensity of the note (0-127)"
        },
        controller: {
          type: "integer",
          minimum: 0,
          maximum: 127,
          description: "The MIDI controller number (0-127)"
        },
        value: {
          type: "integer",
          minimum: 0,
          maximum: 127,
          description: "The value for control change messages (0-127)"
        },
        program: {
          type: "integer",
          minimum: 0,
          maximum: 127,
          description: "The program/patch number (0-127)"
        },
        pitchValue: {
          type: "integer",
          minimum: 0,
          maximum: 16383,
          description: "The pitch bend value (0-16383, with 8192 being center)"
        },
        sysexData: {
          type: "array",
          items: {
            type: "integer",
            minimum: 0,
            maximum: 255
          },
          description: "Array of bytes for system exclusive messages"
        }
      },
      required: ["action"]
    }
  }
};

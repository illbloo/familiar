import { z } from "zod";

export const midiActionSchema = z.enum([
  "requestAccess",
  "getMidiInputs",
  "getMidiOutputs",
  "sendMidiMessage",
  "listenForMidiMessages",
  "stopListening",
]);

export const midiMessageTypeSchema = z.enum([
  "noteOn",
  "noteOff",
  "controlChange",
  "programChange",
  "pitchBend",
  "sysex",
]);

export const midiChannelSchema = z.number().min(1).max(16);
export const midiValueSchema = z.number().min(0).max(127);
export const midiPitchValueSchema = z.number().min(0).max(16383);
export const midiSysexDataSchema = z.array(z.number().min(0).max(255));

export const webMidiSchema = z.object({
  action: midiActionSchema,
  sysex: z.boolean().optional().default(false),
  deviceId: z.string().optional(),
  messageType: midiMessageTypeSchema.optional(),
  channel: midiChannelSchema.optional(),
  note: midiValueSchema.optional(),
  velocity: midiValueSchema.optional(),
  controller: midiValueSchema.optional(),
  value: midiValueSchema.optional(),
  program: midiValueSchema.optional(),
  pitchValue: midiPitchValueSchema.optional(),
  sysexData: midiSysexDataSchema.optional(),
});

export type WebMidiSchema = z.infer<typeof webMidiSchema>; 
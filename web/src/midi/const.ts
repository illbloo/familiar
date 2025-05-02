
export const OPENROUTER_API_KEY = import.meta.env.FUCKYOU_OPENROUTER_API_KEY;

if (!OPENROUTER_API_KEY) {
  throw new Error('OPENROUTER_API_KEY not found in .env file. Please create a .env file with your API key.');
}

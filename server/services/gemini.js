import { GoogleGenerativeAI } from '@google/generative-ai';

let genAI = null;
let model = null;

if (process.env.GEMINI_API_KEY) {
  genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
  model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
}

export async function generateChatResponse(message, language, userRole, systemContext) {
  if (!model) throw new Error('Gemini API key not configured');
  const result = await model.generateContent(`${systemContext}\n\nUser Question: ${message}`);
  return result.response.text();
}

export async function generateTranslationResponse(text) {
  if (!model) throw new Error('Gemini API key not configured');
  const prompt = `
    Translate the following stadium announcement into English, Telugu, Hindi, Tamil, and Kannada.
    Keep the translations accurate and polite.
    Return ONLY a JSON object containing the translations with keys: english, telugu, hindi, tamil, kannada.
    Do not wrap the response in markdown code blocks.
    Announcement: "${text}"
  `;
  const result = await model.generateContent(prompt);
  return result.response.text().trim();
}

export async function generatePredictionResponse(weatherCondition, currentMatchSpectators) {
  if (!model) throw new Error('Gemini API key not configured');
  const prompt = `
    Synthesize stadium crowd management recommendations. 
    Weather: "${weatherCondition}". Spectator count: ${currentMatchSpectators}.
    Identify congestion risk levels. Provide precise natural language operational action items.
    You MUST structure every recommendation in this format:
    - **Reasoning**: [Explanation of crowds/risks based on sensors]
    - **Confidence**: [Provide a confidence level as a percentage, e.g., 95%]
    - **Recommended Action**: [Specific operational instruction details]
    - **Expected Impact**: [Specific expected positive outcomes]
  `;
  const result = await model.generateContent(prompt);
  return result.response.text().trim();
}

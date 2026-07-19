import { Router } from 'express';
import { generateChatResponse } from '../services/gemini.js';
import { getInterpolatedAnswers } from '../utils/interpolateAnswers.js';

const router = Router();

// Multilingual dictionary fallback for offline chatbot
const MULTILINGUAL_ANSWERS = {
  english: {
    gate: "Gate A is clear (3m wait). Gate B has heavy congestion (22m wait).\n- **Reasoning**: Gate B is the main entry point for Parking Zone B which is currently at 90% capacity, leading to check bottlenecks.\n- **Confidence**: 95%\n- **Recommended Action**: Avoid Gate B. Proceed to Gate A (North) or Gate D (West) for immediate entry.\n- **Expected Impact**: Reduces spectator queue wait time by 19 minutes, balancing flow rates across stadium arches.",
    seat: "To reach Seat A-120: Enter through Gate A, go to Lower Tier 1, Section A, Row 12.\n- **Reasoning**: Gate A is the closest entry point to Section A, minimizing indoor navigation distance and walking steps.\n- **Confidence**: 99%\n- **Recommended Action**: Follow the green floor signs and walk to Section A, Row 12.\n- **Expected Impact**: Enables direct path finding, reducing wayfinding confusion and unnecessary detour distance.",
    parking: "We recommend Parking Zone B (East).\n- **Reasoning**: Zone A (North) is at 86% capacity and Zone C is at 98% capacity, causing vehicle entry queues.\n- **Confidence**: 92%\n- **Recommended Action**: Drive to Zone B, which is only 50% occupied with an 8-minute walk to concourse gates.\n- **Expected Impact**: Prevents vehicle congestion at main entries, saving approximately 12 minutes of parking search time.",
    food: "Fastest option is Arena Express Cafe (East) with a 4-minute wait.\n- **Reasoning**: Grand Food Bazaar (West) is experiencing a peak order volume (18-minute wait).\n- **Confidence**: 88%\n- **Recommended Action**: Go to the East concourse for quick concessions at Arena Express Cafe.\n- **Expected Impact**: Saves 14 minutes in line, distributing food service demand evenly across vendors.",
    washroom: "Nearest restroom: Restroom North (Tier 1).\n- **Reasoning**: Restroom East (Tier 2) is closed for scheduled cleaning.\n- **Confidence**: 94%\n- **Recommended Action**: Proceed to the North concourse washroom (2m wait).\n- **Expected Impact**: Restores sanitation access quickly without waiting at congested queues.",
    exit: "To reach Exit C: Proceed through the south tier corridor.\n- **Reasoning**: This pathway is clear of congestion and is fully wheelchair-accessible.\n- **Confidence**: 97%\n- **Recommended Action**: Follow the green exit arrows toward Exit C.\n- **Expected Impact**: Avoids main concourse bottlenecks, allowing a safe and accessible exit flow.",
    default: "I am ArenaMind AI, your Stadium Assistant.\n- **Reasoning**: I analyze live sensor data to guide spectators.\n- **Confidence**: 95%\n- **Recommended Action**: Ask me about gates, parking, restrooms, food, exits, or seat coordinates.\n- **Expected Impact**: Delivers immediate AI-optimized decisions to improve stadium logistics."
  },
  hindi: {
    gate: "Gate A is clear (3m wait). Gate B has heavy congestion (22m wait).\n- **Reasoning**: Gate B is the main entry point for Parking Zone B which is currently at 90% capacity, leading to check bottlenecks.\n- **Confidence**: 95%\n- **Recommended Action**: Avoid Gate B. Proceed to Gate A (North) or Gate D (West) for immediate entry.\n- **Expected Impact**: Reduces spectator queue wait time by 19 minutes, balancing flow rates across stadium arches.",
    seat: "To reach Seat A-120: Enter through Gate A, go to Lower Tier 1, Section A, Row 12.\n- **Reasoning**: Gate A is the closest entry point to Section A, minimizing indoor navigation distance and walking steps.\n- **Confidence**: 99%\n- **Recommended Action**: Follow the green floor signs and walk to Section A, Row 12.\n- **Expected Impact**: Enables direct path finding, reducing wayfinding confusion and unnecessary detour distance.",
    parking: "We recommend Parking Zone B (East).\n- **Reasoning**: Zone A (North) is at 86% capacity and Zone C is at 98% capacity, causing vehicle entry queues.\n- **Confidence**: 92%\n- **Recommended Action**: Drive to Zone B, which is only 50% occupied with an 8-minute walk to concourse gates.\n- **Expected Impact**: Prevents vehicle congestion at main entries, saving approximately 12 minutes of parking search time.",
    food: "Fastest option is Arena Express Cafe (East) with a 4-minute wait.\n- **Reasoning**: Grand Food Bazaar (West) is experiencing a peak order volume (18-minute wait).\n- **Confidence**: 88%\n- **Recommended Action**: Go to the East concourse for quick concessions at Arena Express Cafe.\n- **Expected Impact**: Saves 14 minutes in line, distributing food service demand evenly across vendors.",
    washroom: "Nearest restroom: Restroom North (Tier 1).\n- **Reasoning**: Restroom East (Tier 2) is closed for scheduled cleaning.\n- **Confidence**: 94%\n- **Recommended Action**: Proceed to the North concourse washroom (2m wait).\n- **Expected Impact**: Restores sanitation access quickly without waiting at congested queues.",
    exit: "To reach Exit C: Proceed through the south tier corridor.\n- **Reasoning**: This pathway is clear of congestion and is fully wheelchair-accessible.\n- **Confidence**: 97%\n- **Recommended Action**: Follow the green exit arrows toward Exit C.\n- **Expected Impact**: Avoids main concourse bottlenecks, allowing a safe and accessible exit flow.",
    default: "I am ArenaMind AI, your Stadium Assistant.\n- **Reasoning**: I analyze live sensor data to guide spectators.\n- **Confidence**: 95%\n- **Recommended Action**: Ask me about gates, parking, restrooms, food, exits, or seat coordinates.\n- **Expected Impact**: Delivers immediate AI-optimized decisions to improve stadium logistics."
  },
  telugu: {
    gate: "Gate A is clear (3m wait). Gate B has heavy congestion (22m wait).\n- **Reasoning**: Gate B is the main entry point for Parking Zone B which is currently at 90% capacity, leading to check bottlenecks.\n- **Confidence**: 95%\n- **Recommended Action**: Avoid Gate B. Proceed to Gate A (North) or Gate D (West) for immediate entry.\n- **Expected Impact**: Reduces spectator queue wait time by 19 minutes, balancing flow rates across stadium arches.",
    seat: "To reach Seat A-120: Enter through Gate A, go to Lower Tier 1, Section A, Row 12.\n- **Reasoning**: Gate A is the closest entry point to Section A, minimizing indoor navigation distance and walking steps.\n- **Confidence**: 99%\n- **Recommended Action**: Follow the green floor signs and walk to Section A, Row 12.\n- **Expected Impact**: Enables direct path finding, reducing wayfinding confusion and unnecessary detour distance.",
    parking: "We recommend Parking Zone B (East).\n- **Reasoning**: Zone A (North) is at 86% capacity and Zone C is at 98% capacity, causing vehicle entry queues.\n- **Confidence**: 92%\n- **Recommended Action**: Drive to Zone B, which is only 50% occupied with an 8-minute walk to concourse gates.\n- **Expected Impact**: Prevents vehicle congestion at main entries, saving approximately 12 minutes of parking search time.",
    food: "Fastest option is Arena Express Cafe (East) with a 4-minute wait.\n- **Reasoning**: Grand Food Bazaar (West) is experiencing a peak order volume (18-minute wait).\n- **Confidence**: 88%\n- **Recommended Action**: Go to the East concourse for quick concessions at Arena Express Cafe.\n- **Expected Impact**: Saves 14 minutes in line, distributing food service demand evenly across vendors.",
    washroom: "Nearest restroom: Restroom North (Tier 1).\n- **Reasoning**: Restroom East (Tier 2) is closed for scheduled cleaning.\n- **Confidence**: 94%\n- **Recommended Action**: Proceed to the North concourse washroom (2m wait).\n- **Expected Impact**: Restores sanitation access quickly without waiting at congested queues.",
    exit: "To reach Exit C: Proceed through the south tier corridor.\n- **Reasoning**: This pathway is clear of congestion and is fully wheelchair-accessible.\n- **Confidence**: 97%\n- **Recommended Action**: Follow the green exit arrows toward Exit C.\n- **Expected Impact**: Avoids main concourse bottlenecks, allowing a safe and accessible exit flow.",
    default: "I am ArenaMind AI, your Stadium Assistant.\n- **Reasoning**: I analyze live sensor data to guide spectators.\n- **Confidence**: 95%\n- **Recommended Action**: Ask me about gates, parking, restrooms, food, exits, or seat coordinates.\n- **Expected Impact**: Delivers immediate AI-optimized decisions to improve stadium logistics."
  },
  tamil: {
    gate: "Gate A is clear (3m wait). Gate B has heavy congestion (22m wait).\n- **Reasoning**: Gate B is the main entry point for Parking Zone B which is currently at 90% capacity, leading to check bottlenecks.\n- **Confidence**: 95%\n- **Recommended Action**: Avoid Gate B. Proceed to Gate A (North) or Gate D (West) for immediate entry.\n- **Expected Impact**: Reduces spectator queue wait time by 19 minutes, balancing flow rates across stadium arches.",
    seat: "To reach Seat A-120: Enter through Gate A, go to Lower Tier 1, Section A, Row 12.\n- **Reasoning**: Gate A is the closest entry point to Section A, minimizing indoor navigation distance and walking steps.\n- **Confidence**: 99%\n- **Recommended Action**: Follow the green floor signs and walk to Section A, Row 12.\n- **Expected Impact**: Enables direct path finding, reducing wayfinding confusion and unnecessary detour distance.",
    parking: "We recommend Parking Zone B (East).\n- **Reasoning**: Zone A (North) is at 86% capacity and Zone C is at 98% capacity, causing vehicle entry queues.\n- **Confidence**: 92%\n- **Recommended Action**: Drive to Zone B, which is only 50% occupied with an 8-minute walk to concourse gates.\n- **Expected Impact**: Prevents vehicle congestion at main entries, saving approximately 12 minutes of parking search time.",
    food: "Fastest option is Arena Express Cafe (East) with a 4-minute wait.\n- **Reasoning**: Grand Food Bazaar (West) is experiencing a peak order volume (18-minute wait).\n- **Confidence**: 88%\n- **Recommended Action**: Go to the East concourse for quick concessions at Arena Express Cafe.\n- **Expected Impact**: Saves 14 minutes in line, distributing food service demand evenly across vendors.",
    washroom: "Nearest restroom: Restroom North (Tier 1).\n- **Reasoning**: Restroom East (Tier 2) is closed for scheduled cleaning.\n- **Confidence**: 94%\n- **Recommended Action**: Proceed to the North concourse washroom (2m wait).\n- **Expected Impact**: Restores sanitation access quickly without waiting at congested queues.",
    exit: "To reach Exit C: Proceed through the south tier corridor.\n- **Reasoning**: This pathway is clear of congestion and is fully wheelchair-accessible.\n- **Confidence**: 97%\n- **Recommended Action**: Follow the green exit arrows toward Exit C.\n- **Expected Impact**: Avoids main concourse bottlenecks, allowing a safe and accessible exit flow.",
    default: "I am ArenaMind AI, your Stadium Assistant.\n- **Reasoning**: I analyze live sensor data to guide spectators.\n- **Confidence**: 95%\n- **Recommended Action**: Ask me about gates, parking, restrooms, food, exits, or seat coordinates.\n- **Expected Impact**: Delivers immediate AI-optimized decisions to improve stadium logistics."
  },
  kannada: {
    gate: "Gate A is clear (3m wait). Gate B has heavy congestion (22m wait).\n- **Reasoning**: Gate B is the main entry point for Parking Zone B which is currently at 90% capacity, leading to check bottlenecks.\n- **Confidence**: 95%\n- **Recommended Action**: Avoid Gate B. Proceed to Gate A (North) or Gate D (West) for immediate entry.\n- **Expected Impact**: Reduces spectator queue wait time by 19 minutes, balancing flow rates across stadium arches.",
    seat: "To reach Seat A-120: Enter through Gate A, go to Lower Tier 1, Section A, Row 12.\n- **Reasoning**: Gate A is the closest entry point to Section A, minimizing indoor navigation distance and walking steps.\n- **Confidence**: 99%\n- **Recommended Action**: Follow the green floor signs and walk to Section A, Row 12.\n- **Expected Impact**: Enables direct path finding, reducing wayfinding confusion and unnecessary detour distance.",
    parking: "We recommend Parking Zone B (East).\n- **Reasoning**: Zone A (North) is at 86% full and Zone C is at 98% capacity, causing vehicle entry queues.\n- **Confidence**: 92%\n- **Recommended Action**: Drive to Zone B, which is only 50% occupied with an 8-minute walk to concourse gates.\n- **Expected Impact**: Prevents vehicle congestion at main entries, saving approximately 12 minutes of parking search time.",
    food: "Fastest option is Arena Express Cafe (East) with a 4-minute wait.\n- **Reasoning**: Grand Food Bazaar (West) is experiencing a peak order volume (18-minute wait).\n- **Confidence**: 88%\n- **Recommended Action**: Go to the East concourse for quick concessions at Arena Express Cafe.\n- **Expected Impact**: Saves 14 minutes in line, distributing food service demand evenly across vendors.",
    washroom: "Nearest restroom: Restroom North (Tier 1).\n- **Reasoning**: Restroom East (Tier 2) is closed for scheduled cleaning.\n- **Confidence**: 94%\n- **Recommended Action**: Proceed to the North concourse washroom (2m wait).\n- **Expected Impact**: Restores sanitation access quickly without waiting at congested queues.",
    exit: "To reach Exit C: Proceed through the south tier corridor.\n- **Reasoning**: This pathway is clear of congestion and is fully wheelchair-accessible.\n- **Confidence**: 97%\n- **Recommended Action**: Follow the green exit arrows toward Exit C.\n- **Expected Impact**: Avoids main concourse bottlenecks, allowing a safe and accessible exit flow.",
    default: "I am ArenaMind AI, your Stadium Assistant.\n- **Reasoning**: I analyze live sensor data to guide spectators.\n- **Confidence**: 95%\n- **Recommended Action**: Ask me about gates, parking, restrooms, food, exits, or seat coordinates.\n- **Expected Impact**: Delivers immediate AI-optimized decisions to improve stadium logistics."
  }
};

// 1. Conversational Chatbot Route
router.post('/chat', async (req, res, next) => {
  try {
    const { message, language = 'english', userRole = 'spectator', telemetry } = req.body;
    
    if (!message || typeof message !== 'string' || message.length > 1000) {
      return res.status(400).json({ error: 'Valid chat message (string, max 1000 chars) is required' });
    }
    if (typeof language !== 'string' || typeof userRole !== 'string') {
      return res.status(400).json({ error: 'Valid language and userRole parameters are required' });
    }

    const prompt = message ? message.toLowerCase() : '';
    const langKey = MULTILINGUAL_ANSWERS[language] ? language : 'english';

    // If Gemini API Key is configured, attempt to use it
    if (process.env.GEMINI_API_KEY) {
      try {
        const systemContext = `
          You are ArenaMind AI, an enterprise-grade smart stadium operation assistant. 
          The current user has the role: '${userRole}'.
          Answer the spectator/operator naturally in the requested language: '${language}'.
          Keep responses concise, helpful, and specific to stadium operations (seats, gates, crowd control, restrooms, exits).
          
          You MUST structure every response to include these four explicit sections at the tail end:
          - **Reasoning**: [Detail the operational rationale behind this response/instruction]
          - **Confidence**: [Provide a numerical confidence level percentage, e.g. 95%]
          - **Recommended Action**: [Provide a clear, actionable next step]
          - **Expected Impact**: [Detail the anticipated operational outcome of taking this action]
          
          Stadium details:
          - Seat A-120: Tier 1, Section A, Row 12. Wheelchair accessible.
          - Restrooms: North Tier 1 (Clean, 2m wait, accessible), East Tier 2 (Cleaning, 15m wait).
          - Food: Grand Food Bazaar (West concourse, 18m wait), Cafe Express (East, 4m wait).
          - Parking: Zone A (North, 86% full), Zone B (East, 50% full), Zone C (West, 98% full).
          - Gates: Gate A, B, C, D, E. Gate B is currently congested (22m wait). Gate A and D have low queues (3m wait).
        `;

        const text = await generateChatResponse(message, language, userRole, systemContext);
        return res.json({ response: text, provider: 'gemini' });
      } catch (e) {
        console.warn("Gemini execution failed, falling back to local simulation:", e.message);
      }
    }

    // Fallback to offline rule dictionary
    let answers = null;
    if (telemetry) {
      answers = getInterpolatedAnswers(language, telemetry);
    }

    let reply = answers ? answers.default : MULTILINGUAL_ANSWERS[langKey].default;
    if (prompt.includes('seat') || prompt.includes('a-120') || prompt.includes('ఆసన') || prompt.includes('సీట్') || prompt.includes('सीट') || prompt.includes('இருக்கை')) {
      reply = answers ? answers.seat : MULTILINGUAL_ANSWERS[langKey].seat;
    } else if (prompt.includes('gate') || prompt.includes('ಗೇಟ್') || prompt.includes('గేట్') || prompt.includes('गेट') || prompt.includes('வாயில்')) {
      reply = answers ? answers.gate : MULTILINGUAL_ANSWERS[langKey].gate;
    } else if (prompt.includes('park') || prompt.includes('ಪಾರ್ಕಿಂಗ್') || prompt.includes('పార్కింగ్') || prompt.includes('पार्किंग') || prompt.includes('பார்க்கింగ్')) {
      reply = answers ? answers.parking : MULTILINGUAL_ANSWERS[langKey].parking;
    } else if (prompt.includes('food') || prompt.includes('buy') || prompt.includes('খাদ್ಯ') || prompt.includes('ఆహారం') || prompt.includes('భोजन') || prompt.includes('உணவு')) {
      reply = answers ? answers.food : MULTILINGUAL_ANSWERS[langKey].food;
    } else if (prompt.includes('washroom') || prompt.includes('restroom') || prompt.includes('toilet') || prompt.includes('ಶೌಚಾಲಯ') || prompt.includes('వాష్ రూమ్') || prompt.includes('शौचालय') || prompt.includes('கழிவறை')) {
      reply = answers ? answers.washroom : MULTILINGUAL_ANSWERS[langKey].washroom;
    } else if (prompt.includes('exit') || prompt.includes('reach') || prompt.includes('ಮಾರ್ಗ') || prompt.includes('నిష్క్రమణ') || prompt.includes('निकास') || prompt.includes('வெளியேறும்')) {
      reply = answers ? answers.exit : MULTILINGUAL_ANSWERS[langKey].exit;
    }

    return res.json({ response: reply, provider: 'mock_local' });
  } catch (err) {
    next(err);
  }
});

export default router;

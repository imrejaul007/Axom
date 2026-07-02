/**
 * BuzzLocal Genie AI Service
 * Routes natural language commands to appropriate services
 *
 * Commands supported:
 * - SocietyOS: visitor management
 * - HousingOS: property search, flatmates
 * - SafetyOS: alerts, SOS
 * - RentFinanceOS: credit score, zero deposit
 */

import axios from 'axios';

const API_BASE = 'http://localhost:4020'; // Hub or direct service

export interface GenieCommand {
  intent: string;
  entities: Record<string, any>;
  confidence: number;
  response?: string;
  action?: {
    type: 'navigate' | 'api_call' | 'display' | 'confirm';
    screen?: string;
    params?: Record<string, any>;
  };
}

// Intent patterns
const INTENT_PATTERNS = {
  // SocietyOS - Visitor Management
  'visitor.add': [
    /(?:add|invite|register).*(?:visitor|guest|plumber|electrician|delivery|cab|uber)/i,
    /(?:expecting|waiting for|coming).*(?:visitor|guest|delivery)/i,
  ],
  'visitor.approve': [
    /(?:approve|allow|accept|yes to).*(?:visitor|guest|entry)/i,
    /(?:approve|allow|accept).*request/i,
  ],
  'visitor.qr': [
    /show.*(?:qr|pass|code).*(?:visitor|guest|entry)/i,
    /(?:qr|pass|code).*(?:visitor|guest)/i,
  ],
  'visitor.pending': [
    /(?:who|any|show).*(?:visitor|guest|pending|waiting)/i,
    /(?:visitor|guest).*(?:pending|waiting|request)/i,
  ],

  // HousingOS - Property Search
  'housing.search': [
    /(?:find|search|look for|show me).*(?:apartment|flat|house|room|pg|property|rent|home|living)/i,
    /(?:rent|buy|lease).*(?:apartment|flat|house|property)/i,
    /(?:need|want).*(?:place|accommodation|staying|living)/i,
  ],
  'housing.budget': [
    /under|budget|within|less than|not more than.*(\d+)/i,
    /(\d+).*(?:k|lakh|lac|thousand)/i,
  ],
  'housing.location': [
    /(?:in|near|around|at).*(?:indiranagar|koramangala|whitefield|HSR|marathahalli|bangalore)/i,
    /(?:indiranagar|koramangala|whitefield|HSR|marathahalli|bangalore).*(?:area|location)/i,
  ],

  // Zero Deposit - RentFinanceOS
  'rentfinance.score': [
    /(?:what is|check|show).*(?:credit|score|trust|rank)/i,
    /(?:my|mine).*(?:score|credit|trust|rank)/i,
  ],
  'rentfinance.zero_deposit': [
    /(?:zero|deposit free|no deposit).*(?:deposit|rent|property|house)/i,
    /(?:can i|am i|eligible).*(?:zero|deposit free)/i,
    /(?:zero deposit| deposit free).*/i,
  ],
  'rentfinance.guarantee': [
    /guarantee|deposit.*cover|cover.*deposit/i,
  ],

  // SafetyOS
  'safety.alert': [
    /(?:report|submit|file).*(?:alert|emergency|suspicious|safety|incident)/i,
    /(?:something|there|someone).*(?:suspicious|wrong|unsafe|danger)/i,
  ],
  'safety.sos': [
    /sos|help|emergency|save me|danger|attack/i,
    /(?:send|trigger|activate).*(?:sos|emergency)/i,
  ],
  'safety.check': [
    /(?:is|how safe|check|rating).*(?:area|location|neighborhood|road)/i,
  ],

  // General
  'general.help': [
    /help|what can you do|commands|options/i,
  ],
  'general.navigate': [
    /(?:go to|open|show me|take me to).*/i,
  ],
};

// Extract entities from text
function extractEntities(text: string, intent: string): Record<string, any> {
  const entities: Record<string, any> = { raw: text };

  // Extract budget/amount
  const budgetMatch = text.match(/(\d+)\s*(?:k|thousand|lakh|lac)/i);
  if (budgetMatch) {
    const amount = parseInt(budgetMatch[1]);
    entities.budget = amount > 100 ? amount * 100000 : amount * 1000; // Convert to rupees
  }

  // Extract date
  const tomorrowMatch = text.match(/tomorrow/i);
  const todayMatch = text.match(/today/i);
  if (tomorrowMatch) entities.date = 'tomorrow';
  else if (todayMatch) entities.date = 'today';

  // Extract time
  const timeMatch = text.match(/(\d{1,2})(?::(\d{2}))?\s*(am|pm)?/i);
  if (timeMatch) {
    entities.time = timeMatch[0];
  }

  // Extract visitor type
  const visitorTypes = ['plumber', 'electrician', 'carpenter', 'delivery', 'guest', 'friend', 'family', 'cab', 'uber', 'rapido'];
  for (const type of visitorTypes) {
    if (text.toLowerCase().includes(type)) {
      entities.visitorType = type;
      break;
    }
  }

  // Extract flat number
  const flatMatch = text.match(/(?:flat|apartment|unit|#)\s*([a-z]?-?\d+)/i);
  if (flatMatch) {
    entities.flatNumber = flatMatch[1];
  }

  // Extract location
  const locations = ['indiranagar', 'koramangala', 'whitefield', 'HSR', 'marathahalli', 'bellandur', 'electronic city', 'jayanagar'];
  for (const loc of locations) {
    if (text.toLowerCase().includes(loc)) {
      entities.location = loc;
      break;
    }
  }

  // Extract bedrooms
  const bhkMatch = text.match(/(\d)\s*(?:bhk|bedroom|bed/i);
  if (bhkMatch) {
    entities.bedrooms = parseInt(bhkMatch[1]);
  }

  // Extract name (for visitor)
  const nameMatch = text.match(/(?:named?|called)\s+([A-Z][a-z]+(?:\s+[A-Z][a-z]+)?)/);
  if (nameMatch) {
    entities.visitorName = nameMatch[1];
  }

  return entities;
}

// Detect intent from text
export function detectIntent(text: string): { intent: string; confidence: number; entities: Record<string, any> } {
  let bestMatch = { intent: 'general.unknown', confidence: 0 };
  const normalizedText = text.toLowerCase().trim();

  for (const [intent, patterns] of Object.entries(INTENT_PATTERNS)) {
    for (const pattern of patterns) {
      if (pattern.test(normalizedText)) {
        // Higher confidence for specific patterns
        const confidence = intent.includes('.') ? 0.85 : 0.7;
        if (confidence > bestMatch.confidence) {
          bestMatch = { intent, confidence };
        }
      }
    }
  }

  return {
    intent: bestMatch.intent,
    confidence: bestMatch.confidence,
    entities: extractEntities(normalizedText, bestMatch.intent)
  };
}

// Generate response based on intent
export function generateResponse(intent: string, entities: Record<string, any>): string {
  switch (intent) {
    case 'visitor.add':
      return `I'll help you add a visitor${entities.visitorType ? ` (${entities.visitorType})` : ''} for ${entities.date || 'today'}${entities.time ? ` at ${entities.time}` : ''}. Would you like me to open the Add Visitor screen?`;

    case 'visitor.approve':
      return `Let me show you pending visitor requests. You can approve them to generate a QR pass.`;

    case 'visitor.qr':
      return `Here's the QR pass for your visitor. They can show this at the gate.`;

    case 'visitor.pending':
      return `You have pending visitor requests. Would you like to approve them?`;

    case 'housing.search':
      let housingMsg = `I found several ${entities.bedrooms ? `${entities.bedrooms}BHK ` : ''}properties`;
      if (entities.location) housingMsg += ` in ${entities.location}`;
      if (entities.budget) housingMsg += ` under Rs ${(entities.budget / 1000).toFixed(0)}K`;
      housingMsg += '.';
      return housingMsg;

    case 'rentfinance.score':
      return `Your Rent Credit Score reflects your payment history, tenure, and social connections. Want to check your current score?`;

    case 'rentfinance.zero_deposit':
      return `With your trust score, you may be eligible for zero security deposit! Want me to check your eligibility?`;

    case 'safety.sos':
      return `I'm triggering SOS. Stay calm - your location is being shared with your trusted contacts and emergency services.`;

    case 'safety.check':
      return `Let me check the safety rating for ${entities.location || 'this area'}...`;

    case 'general.help':
      return `I can help you with:
• "Add a visitor for tomorrow 2pm"
• "Find a 2BHK in Indiranagar under 30K"
• "Check my rent credit score"
• "Am I eligible for zero deposit?"
• "Is this area safe?"
• "Report a suspicious activity"`;

    default:
      return `I'm not sure I understand. Try saying things like "add a visitor" or "find a flat in Indiranagar"`;
  }
}

// Map intent to screen/action
export function mapIntentToAction(intent: string, entities: Record<string, any>): GenieCommand['action'] {
  switch (intent) {
    case 'visitor.add':
      return { type: 'navigate', screen: 'society/add-visitor', params: entities };
    case 'visitor.approve':
    case 'visitor.pending':
      return { type: 'navigate', screen: 'society/visitors', params: { tab: 'pending' } };
    case 'visitor.qr':
      return { type: 'navigate', screen: 'society/qr-pass', params: entities };
    case 'housing.search':
      return { type: 'navigate', screen: 'housing/index', params: entities };
    case 'rentfinance.score':
    case 'rentfinance.zero_deposit':
      return { type: 'navigate', screen: 'housing/zero-deposit', params: entities };
    case 'safety.sos':
      return { type: 'navigate', screen: 'safe/sos', params: entities };
    case 'safety.check':
      return { type: 'navigate', screen: 'safe/map', params: entities };
    default:
      return { type: 'display', screen: 'home' };
  }
}

// Main Genie service
export const genieService = {
  detectIntent,
  generateResponse,
  mapIntentToAction,

  /**
   * Process a user message through Genie
   */
  processMessage: async (message: string): Promise<GenieCommand> => {
    const { intent, confidence, entities } = detectIntent(message);
    const response = generateResponse(intent, entities);
    const action = mapIntentToAction(intent, entities);

    return {
      intent,
      entities,
      confidence,
      response,
      action
    };
  },

  /**
   * Get command suggestions based on context
   */
  getSuggestions: (context: string): string[] => {
    switch (context) {
      case 'society':
        return [
          'Add a visitor for tomorrow',
          'Show pending visitors',
          'Approve the plumber visit',
          'Show visitor QR pass',
        ];
      case 'housing':
        return [
          'Find a 2BHK under 30K',
          'Search in Indiranagar',
          'Show PGs near HSR',
          'Check zero deposit eligibility',
        ];
      case 'safety':
        return [
          'Is this area safe?',
          'Report suspicious activity',
          'Trigger SOS',
          'Show nearby alerts',
        ];
      default:
        return [
          'Add a visitor',
          'Find a home to rent',
          'Check my rent credit score',
          'Is my area safe?',
        ];
    }
  },
};

import KnowledgeArticle from '../models/KnowledgeArticle.js';

// Centralized AI Configuration Helper
export const getAIConfig = () => {
  const enabled = process.env.AI_ENABLED === 'true' || process.env.AI_ENABLED === true;
  const provider = (process.env.AI_PROVIDER || 'groq').toLowerCase();
  const groqApiKey = process.env.GROQ_API_KEY || '';
  const groqModel = process.env.GROQ_MODEL || 'llama-3.3-70b-versatile';
  const geminiApiKey = process.env.GEMINI_API_KEY || '';
  const geminiModel = process.env.GEMINI_MODEL || 'gemini-1.5-flash';

  return {
    enabled,
    provider,
    groqApiKey,
    groqModel,
    geminiApiKey,
    geminiModel
  };
};

/**
 * Heuristic fallback classifier when LLM is offline or no API key is provided
 */
export const heuristicClassify = (title = '', description = '') => {
  const text = `${title} ${description}`.toLowerCase();
  
  let category = 'General IT';
  let priority = 'Medium';
  let probableIssue = 'Unspecified IT Support Request';
  let confidence = 0.85;
  const keywords = [];

  if (text.includes('vpn') || text.includes('wifi') || text.includes('wi-fi') || text.includes('network') || text.includes('dns') || text.includes('internet') || text.includes('disconnect')) {
    category = 'Network & Connectivity';
    keywords.push('Network', 'VPN', 'Connectivity');
    if (text.includes('vpn')) {
      probableIssue = 'VPN Client Authentication or Tunnel Timeout';
      priority = text.includes('cannot') || text.includes('down') || text.includes('shut') ? 'High' : 'Medium';
      confidence = 0.94;
    } else if (text.includes('wifi') || text.includes('wi-fi')) {
      probableIssue = 'Wi-Fi Network Adapter or 802.1X Certificate issue';
      priority = 'Medium';
      confidence = 0.91;
    } else {
      probableIssue = 'Local Gateway or DNS resolution error';
    }
  } else if (text.includes('laptop') || text.includes('screen') || text.includes('monitor') || text.includes('battery') || text.includes('keyboard') || text.includes('printer') || text.includes('shutting down') || text.includes('crash')) {
    category = 'Hardware & Devices';
    keywords.push('Hardware', 'Device', 'Power');
    if (text.includes('shutting down') || text.includes('blue screen') || text.includes('bsod') || text.includes('smoke') || text.includes('crash')) {
      priority = 'Critical';
      probableIssue = 'System Thermal Overheating or Memory Failure';
      confidence = 0.96;
    } else if (text.includes('printer')) {
      category = 'Peripherals';
      priority = 'Low';
      probableIssue = 'Print Spooler Driver or Network Printer Offline';
      confidence = 0.89;
    } else {
      priority = 'High';
      probableIssue = 'Hardware Component or Peripheral Failure';
      confidence = 0.88;
    }
  } else if (text.includes('password') || text.includes('reset') || text.includes('locked') || text.includes('access') || text.includes('mfa') || text.includes('permission') || text.includes('login')) {
    category = 'Access & Identity';
    keywords.push('Security', 'Authentication', 'Account');
    if (text.includes('locked out') || text.includes('ceo') || text.includes('urgent')) {
      priority = 'High';
    } else {
      priority = 'Low';
    }
    probableIssue = 'Active Directory Account Lockout or Expired Credentials';
    confidence = 0.95;
  } else if (text.includes('outlook') || text.includes('email') || text.includes('slack') || text.includes('teams') || text.includes('jira') || text.includes('excel') || text.includes('software')) {
    category = 'Software & SaaS';
    keywords.push('Application', 'Software', 'SaaS');
    priority = text.includes('all users') || text.includes('company wide') ? 'Critical' : 'Medium';
    probableIssue = 'Application Cache Corruption or License Activation Error';
    confidence = 0.87;
  }

  if (text.includes('emergency') || text.includes('production down') || text.includes('data loss') || text.includes('firewall')) {
    priority = 'Critical';
  }

  return {
    category,
    priority,
    probableIssue,
    confidence,
    suggestedKeywords: keywords.length > 0 ? keywords : ['IT Support', category],
    isAiGenerated: false,
    provider: 'fallback-heuristic'
  };
};

/**
 * Groq LLM API Requester
 */
const callGroqChat = async (apiKey, model, systemPrompt, userPrompt) => {
  const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      model: model || 'llama-3.3-70b-versatile',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt }
      ],
      temperature: 0.1,
      response_format: { type: 'json_object' }
    })
  });

  if (!response.ok) {
    const errText = await response.text();
    throw new Error(`Groq API Error (${response.status}): ${errText}`);
  }

  const json = await response.json();
  const content = json.choices?.[0]?.message?.content;
  return JSON.parse(content);
};

/**
 * Classify ticket using Groq / Gemini LLM or Heuristic Fallback
 */
export const classifyTicket = async (title = '', description = '') => {
  const config = getAIConfig();

  if (config.enabled && config.provider === 'groq' && config.groqApiKey) {
    try {
      const systemPrompt = `You are an expert IT Service Management (ITSM) triage system for ServiceDesk Pro.
Classify the given ticket into the exact JSON structure:
{
  "category": string (Must be EXACTLY one of: "Network & Connectivity", "Hardware & Devices", "Access & Identity", "Software & SaaS", "Peripherals", "General IT"),
  "priority": string (Must be EXACTLY one of: "Critical", "High", "Medium", "Low"),
  "probableIssue": string (Concise 4-8 word diagnosis of root cause),
  "confidence": number (Between 0.70 and 0.99),
  "suggestedKeywords": string[] (2-4 relevant IT keywords)
}`;

      const userPrompt = `Ticket Title: ${title}\nTicket Description: ${description}`;
      const result = await callGroqChat(config.groqApiKey, config.groqModel, systemPrompt, userPrompt);

      const validCategories = ['Network & Connectivity', 'Hardware & Devices', 'Access & Identity', 'Software & SaaS', 'Peripherals', 'General IT'];
      const validPriorities = ['Critical', 'High', 'Medium', 'Low'];

      const finalCategory = validCategories.includes(result.category) ? result.category : 'General IT';
      const finalPriority = validPriorities.includes(result.priority) ? result.priority : 'Medium';

      return {
        category: finalCategory,
        priority: finalPriority,
        probableIssue: result.probableIssue || 'Technical Support Request',
        confidence: typeof result.confidence === 'number' ? Math.min(0.99, Math.max(0.7, result.confidence)) : 0.92,
        suggestedKeywords: Array.isArray(result.suggestedKeywords) ? result.suggestedKeywords : [finalCategory],
        isAiGenerated: true,
        provider: 'groq'
      };
    } catch (err) {
      console.warn('[AI Service Warning]: Groq ticket classification failed, falling back to heuristic:', err.message);
    }
  }

  return heuristicClassify(title, description);
};

/**
 * Grounded RAG Knowledge-Base Solution Recommendations
 */
export const recommendSolutions = async (title = '', description = '') => {
  const query = `${title} ${description}`.trim();
  const config = getAIConfig();

  try {
    let articles = [];
    if (query) {
      const candidates = await KnowledgeArticle.find(
        { $text: { $search: query }, published: true },
        { score: { $meta: 'textScore' } }
      )
      .sort({ score: { $meta: 'textScore' } })
      .limit(3);

      // Filter candidates with a meaningful relevance score threshold
      articles = candidates.filter(c => {
        const score = c.get('score');
        return typeof score === 'number' ? score >= 1.5 : true;
      });
    }

    // Step 2: Grounding check — if no articles meet relevance threshold, return honest empty state
    if (!articles || articles.length === 0) {
      return {
        articles: [],
        suggestedResolutionSteps: [
          'No relevant internal knowledge base article found for this issue.',
          'Please inspect device logs, verify network diagnostics, or escalate to Tier-2 Engineering.'
        ],
        isAiGenerated: false,
        provider: 'grounded-rag'
      };
    }

    // Step 3: If LLM is available, ground response strictly in retrieved KB articles
    if (config.enabled && config.provider === 'groq' && config.groqApiKey) {
      try {
        const kbContext = articles.map((a, i) => `[Article ${i + 1} - "${a.title}"]\nProblem: ${a.problem}\nSolution: ${a.solution}`).join('\n\n');

        const systemPrompt = `You are an ITSM technical resolution assistant.
You are provided with INTERNAL KNOWLEDGE BASE ARTICLES.
INSTRUCTIONS:
1. Generate 3 to 4 concise, actionable troubleshooting steps for the technician.
2. Every step MUST be strictly grounded in the provided Knowledge Base articles.
3. Explicitly cite the article title in brackets at the beginning of each step, for example: "[Wi-Fi 802.1X Corporate Certificate Reset]: Re-install device Wi-Fi certificate via Enterprise Portal."
4. Do NOT hallucinate or reference outside knowledge.
5. Return JSON: { "suggestedResolutionSteps": string[] }`;

        const userPrompt = `USER TICKET ISSUE:\nTitle: ${title}\nDescription: ${description}\n\nRETRIEVED KNOWLEDGE BASE CONTEXT:\n${kbContext}`;

        const result = await callGroqChat(config.groqApiKey, config.groqModel, systemPrompt, userPrompt);

        if (result && Array.isArray(result.suggestedResolutionSteps) && result.suggestedResolutionSteps.length > 0) {
          return {
            articles,
            suggestedResolutionSteps: result.suggestedResolutionSteps,
            isAiGenerated: true,
            provider: 'groq'
          };
        }
      } catch (err) {
        console.warn('[AI Service Warning]: Groq RAG synthesis failed, using direct article excerpts:', err.message);
      }
    }

    // Fallback grounded steps directly from retrieved articles
    const steps = articles.map((art, idx) => `${idx + 1}. [${art.title}]: ${art.solution.replace(/\n+/g, ' ').substring(0, 160)}...`);

    return {
      articles,
      suggestedResolutionSteps: steps,
      isAiGenerated: false,
      provider: 'fallback-rag'
    };
  } catch (error) {
    console.error('Error in AI RAG recommendation:', error.message);
    return {
      articles: [],
      suggestedResolutionSteps: [
        '1. Verify client network connection and credentials.',
        '2. Inspect operating system event logs.',
        '3. Escalate ticket to infrastructure operations team.'
      ],
      isAiGenerated: false,
      provider: 'error-fallback'
    };
  }
};

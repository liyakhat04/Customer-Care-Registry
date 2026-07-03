import { GoogleGenAI, Type } from "@google/genai";

const apiKey = process.env.GEMINI_API_KEY;

// Initialize the Google GenAI SDK cleanly
const ai = apiKey
  ? new GoogleGenAI({
      apiKey,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        },
      },
    })
  : null;

/**
 * AI-Based Complaint Categorization
 * Automatically suggests a category, priority, department, and short explanation
 * based on the title and description of a complaint.
 */
export async function categorizeComplaint(title: string, description: string) {
  const defaultCategory = "Technical Support";
  const defaultPriority = "Medium";
  const defaultDepartment = "IT & Systems";

  // Fallback heuristics if AI is offline/unconfigured
  const heuristicFallback = () => {
    const text = (title + " " + description).toLowerCase();
    let category = defaultCategory;
    let department = defaultDepartment;
    let priority: "Low" | "Medium" | "High" | "Critical" = defaultPriority;

    if (text.includes("charge") || text.includes("billing") || text.includes("invoice") || text.includes("payment") || text.includes("refund") || text.includes("money")) {
      category = "Billing & Payments";
      department = "Finance";
    } else if (text.includes("shipment") || text.includes("delivery") || text.includes("freight") || text.includes("order") || text.includes("package") || text.includes("tracking")) {
      category = "Delivery & Logistics";
      department = "Logistics";
    } else if (text.includes("leak") || text.includes("crash") || text.includes("bug") || text.includes("performance") || text.includes("error")) {
      category = "Product Feedback";
      department = "Product Quality";
    } else if (text.includes("password") || text.includes("hacked") || text.includes("login") || text.includes("auth") || text.includes("permission")) {
      category = "Account Security";
      department = "IT & Systems";
    }

    if (text.includes("critical") || text.includes("timeout") || text.includes("leak") || text.includes("emergency") || text.includes("down") || text.includes("broke")) {
      priority = "Critical";
    } else if (text.includes("urgent") || text.includes("high") || text.includes("double charge") || text.includes("crash")) {
      priority = "High";
    } else if (text.includes("slight") || text.includes("minor") || text.includes("low") || text.includes("suggestion")) {
      priority = "Low";
    }

    return {
      category,
      priority,
      department,
      explanation: "Categorized using localized keyword analytics (AI offline or credentials pending)."
    };
  };

  if (!ai) {
    return heuristicFallback();
  }

  try {
    const prompt = `Analyze the following customer support complaint and output a structured JSON analysis.
Complaint Title: "${title}"
Complaint Description: "${description}"

Map to these allowed values:
- category: "Technical Support", "Billing & Payments", "Delivery & Logistics", "Product Feedback", "Account Security"
- priority: "Low", "Medium", "High", "Critical"
- department: "IT & Systems", "Finance", "Logistics", "Product Quality", "Customer Relations"`;

    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: prompt,
      config: {
        systemInstruction: "You are an AI router for enterprise support desks. Carefully assess ticket impact, severity, and context to routes tickets to the appropriate department, status, and urgency.",
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            category: {
              type: Type.STRING,
              description: "Must be one of: 'Technical Support', 'Billing & Payments', 'Delivery & Logistics', 'Product Feedback', 'Account Security'"
            },
            priority: {
              type: Type.STRING,
              description: "Must be one of: 'Low', 'Medium', 'High', 'Critical'"
            },
            department: {
              type: Type.STRING,
              description: "Must be one of: 'IT & Systems', 'Finance', 'Logistics', 'Product Quality', 'Customer Relations'"
            },
            explanation: {
              type: Type.STRING,
              description: "Brief 1-sentence explanation of why this classification was chosen."
            }
          },
          required: ["category", "priority", "department", "explanation"]
        }
      }
    });

    const text = response.text;
    if (text) {
      const parsed = JSON.parse(text);
      // Validate categories to prevent AI hallucinations outside standard categories
      const validCategories = ["Technical Support", "Billing & Payments", "Delivery & Logistics", "Product Feedback", "Account Security"];
      const validPriorities = ["Low", "Medium", "High", "Critical"];
      const validDepartments = ["IT & Systems", "Finance", "Logistics", "Product Quality", "Customer Relations"];

      return {
        category: validCategories.includes(parsed.category) ? parsed.category : defaultCategory,
        priority: validPriorities.includes(parsed.priority) ? parsed.priority : defaultPriority,
        department: validDepartments.includes(parsed.department) ? parsed.department : defaultDepartment,
        explanation: parsed.explanation || "Analyzed successfully by Gemini AI."
      };
    }
    return heuristicFallback();
  } catch (error) {
    console.error("Gemini ticket categorization failed:", error);
    return heuristicFallback();
  }
}

/**
 * AI-Generated Reply Suggestions
 * Drafts an empathetic, professional email response based on ticket details.
 */
export async function generateReplySuggestion(title: string, description: string, agentName: string) {
  const genericSuggestion = `Dear Customer,

Thank you for bringing this issue to our attention. We understand that this is affecting your support operations, and we sincerely apologize for the inconvenience caused.

I am actively reviewing the details of this ticket ("${title}") and investigating the root cause with our engineering team. I will provide a comprehensive status update shortly with our next steps.

Please let me know if there are any additional details you can share in the meantime.

Best regards,
${agentName}
Support Operations Team`;

  if (!ai) {
    return genericSuggestion;
  }

  try {
    const prompt = `Write a professional, highly empathetic, and concise support agent response draft for the following ticket:
Title: "${title}"
Description: "${description}"

The agent writing this email draft is: "${agentName}". Keep it structured, welcoming, and reassuring. Do not include placeholders; write a fully ready draft.`;

    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: prompt,
      config: {
        systemInstruction: "You are a senior executive customer relations assistant. Write clear, compassionate, and helpful response drafts that minimize user friction and project confidence."
      }
    });

    return response.text || genericSuggestion;
  } catch (error) {
    console.error("Gemini response draft generation failed:", error);
    return genericSuggestion;
  }
}

/**
 * Sentiment Analysis of Customer Feedback
 * Classifies feedback sentiment into Positive, Neutral, or Negative and extracts a score.
 */
export async function analyzeFeedbackSentiment(comment: string, suggestions?: string) {
  const fallbackSentiment = () => {
    const text = ((comment || "") + " " + (suggestions || "")).toLowerCase();
    let sentiment: "Positive" | "Neutral" | "Negative" = "Neutral";
    
    if (text.includes("excellent") || text.includes("great") || text.includes("love") || text.includes("outstanding") || text.includes("fast") || text.includes("amazing") || text.includes("perfect") || text.includes("brilliant")) {
      sentiment = "Positive";
    } else if (text.includes("bad") || text.includes("poor") || text.includes("slow") || text.includes("annoy") || text.includes("frustrat") || text.includes("hate") || text.includes("fail") || text.includes("broken")) {
      sentiment = "Negative";
    }

    return {
      sentiment,
      keyTheme: "Feedback Logged"
    };
  };

  if (!ai) {
    return fallbackSentiment();
  }

  try {
    const prompt = `Analyze the sentiment of this customer feedback:
Comment: "${comment}"
Suggestions: "${suggestions || 'None'}"

Determine the sentiment as Positive, Neutral, or Negative. Extrapolate a 2-3 word key theme representing the feedback focus.`;

    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: prompt,
      config: {
        systemInstruction: "You are a sentiment analyzer. Assess user satisfaction levels accurately and output structured JSON.",
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            sentiment: {
              type: Type.STRING,
              description: "Must be one of: 'Positive', 'Neutral', 'Negative'"
            },
            keyTheme: {
              type: Type.STRING,
              description: "A 2-3 word theme summary (e.g. 'Fast Bug Fix', 'Frustrated Billing', 'Billing Clarification')"
            }
          },
          required: ["sentiment", "keyTheme"]
        }
      }
    });

    const text = response.text;
    if (text) {
      const parsed = JSON.parse(text);
      const validSentiments = ["Positive", "Neutral", "Negative"];
      return {
        sentiment: validSentiments.includes(parsed.sentiment) ? parsed.sentiment : "Neutral",
        keyTheme: parsed.keyTheme || "Feedback Logged"
      };
    }
    return fallbackSentiment();
  } catch (error) {
    console.error("Gemini sentiment analysis failed:", error);
    return fallbackSentiment();
  }
}

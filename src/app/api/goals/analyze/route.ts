import { NextResponse } from 'next/server';
import { GoogleGenerativeAI, HarmCategory, HarmBlockThreshold } from '@google/generative-ai';

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

if (!GEMINI_API_KEY) {
  console.warn("GEMINI_API_KEY is not set. LLM features will be disabled. Please create a .env.local file in the project root (smart-goals-app) and add your API key: GEMINI_API_KEY=your_key_here");
}

const genAI = GEMINI_API_KEY ? new GoogleGenerativeAI(GEMINI_API_KEY) : null;
const model = genAI ? genAI.getGenerativeModel({ model: "gemini-1.5-flash-latest" }) : null; // Using a common model

const generationConfig = {
  temperature: 0.7,
  topP: 0.95,
  topK: 64,
  maxOutputTokens: 2048, // Reduced for typical feedback length
  responseMimeType: "text/plain",
};

const safetySettings = [
  { category: HarmCategory.HARM_CATEGORY_HARASSMENT, threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE },
  { category: HarmCategory.HARM_CATEGORY_HATE_SPEECH, threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE },
  { category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT, threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE },
  { category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT, threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE },
];

interface GoalAnalysisRequest {
  title: string;
  description?: string;
  specific?: string;
  motivating?: string;
  attainable?: string;
  relevant?: string;
  trackable_metrics?: string;
}

export async function POST(request: Request) {
  if (!model) {
    return NextResponse.json({ error: 'LLM service not configured. Is GEMINI_API_KEY set in .env.local?' }, { status: 503 });
  }

  const goalData = await request.json() as GoalAnalysisRequest;

  if (!goalData.title) {
    return NextResponse.json({ error: 'Goal title is required for analysis.' }, { status: 400 });
  }

  const prompt = `
    You are an expert in goal setting and the Situational Leadership II framework.
    Analyze the following SMART goal. Provide constructive feedback on how to improve it, ensuring each SMART component (Specific, Motivating, Attainable, Relevant, Trackable) is well-defined and effective.
    The goal is:
    Title: "${goalData.title}"
    Description: "${goalData.description || 'Not provided'}"
    Specific Details (What, Why, Who, Where, Which): "${goalData.specific || 'Not provided'}"
    Motivating Aspects (Why is this important to the executor? What are the benefits?): "${goalData.motivating || 'Not provided'}"
    Attainable Steps/Plan (Is it realistic? What are the key steps?): "${goalData.attainable || 'Not provided'}"
    Relevant to broader objectives (How does this align with larger goals?): "${goalData.relevant || 'Not provided'}"
    Trackable Metrics (How will progress and success be measured?): "${goalData.trackable_metrics || 'Not provided'}"

    Provide clear, actionable advice. Format your feedback clearly, perhaps with headings for each SMART component.
    Example feedback structure:
    **Overall Feedback:** Brief summary.
    **Specific:** [Your analysis and suggestions]
    **Motivating:** [Your analysis and suggestions]
    **Attainable:** [Your analysis and suggestions]
    **Relevant:** [Your analysis and suggestions]
    **Trackable:** [Your analysis and suggestions]
    **Situational Leadership II Considerations:** [How might a leader best support someone with this goal based on their development level regarding this specific task?]
  `;

  try {
    // For simplicity, using generateContent directly for non-chat scenarios
    const result = await model.generateContent(prompt);
    const feedback = result.response.text();
    return NextResponse.json({ feedback });

  } catch (error) {
    console.error('Error getting LLM feedback:', error);
    let errorMessage = 'Failed to get LLM feedback.';
    if (error instanceof Error) {
        errorMessage = error.message;
    }
    if (errorMessage.toLowerCase().includes('api key') || errorMessage.toLowerCase().includes('permission denied')) {
        return NextResponse.json({ error: 'Invalid or missing GEMINI_API_KEY, or API access issue. Please check your key and ensure the Gemini API is enabled for your project.' }, { status: 401 });
    }
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}

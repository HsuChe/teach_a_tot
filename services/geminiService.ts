
import { GoogleGenAI, Type } from "@google/genai";
import type { Curriculum, SectionData, Difficulty, Source, FeedItem, ChatMessage, ArticleData } from '../types';
import { NUM_QUESTIONS } from "../constants";
import { Difficulty as DifficultyEnum } from '../types';


// Fix: Initialize the GoogleGenAI client
const apiKey = import.meta.env.VITE_GEMINI_API_KEY;
if (!apiKey) {
  throw new Error("An API Key must be set when running in a browser");
}
const ai = new GoogleGenAI({ apiKey });

const learningSlideSchema = {
    type: Type.OBJECT,
    properties: {
        title: { type: Type.STRING, description: 'A concise and engaging title for the learning slide.' },
        content: { type: Type.STRING, description: 'The main educational content for the slide, written in a clear and simple way. Use [[highlighted words]] to emphasize key terms.' },
        visualAidDescription: { type: Type.STRING, description: 'Optional: A brief description of a helpful visual aid (like a diagram or image) that could accompany this slide.' }
    },
    required: ['title', 'content']
};

const teachingPromptSchema = {
    type: Type.OBJECT,
    properties: {
        promptText: { type: Type.STRING, description: "A question that prompts the user to explain a concept from one of the learning slides in their own words. The AI character will 'listen' to this explanation." },
        relatedSlideIndex: { type: Type.INTEGER, description: 'The index of the learning slide this prompt relates to.' }
    },
    required: ['promptText', 'relatedSlideIndex']
};

const geoObjectSchema = {
    type: Type.OBJECT,
    properties: {
        type: { type: Type.STRING, enum: ['point', 'line', 'polygon'], description: "The type of geometric object." },
        id: { type: Type.STRING, description: "A unique identifier for the object." },
        x: { type: Type.NUMBER, description: "The x-coordinate of the point." },
        y: { type: Type.NUMBER, description: "The y-coordinate of the point." },
        label: { type: Type.STRING, description: "A visual label for the point (e.g., 'A', 'B')." },
        p1Id: { type: Type.STRING, description: "For a line, the ID of the starting point." },
        p2Id: { type: Type.STRING, description: "For a line, the ID of the ending point." },
        pointIds: { type: Type.ARRAY, items: { type: Type.STRING }, description: "For a polygon, an ordered list of point IDs that form its vertices." }
    },
    required: ['type', 'id']
};

const mathInitialStateSchema = {
    type: Type.OBJECT,
    properties: {
        expression: { type: Type.STRING, description: 'For Calculation Pad: a mathematical expression to be evaluated. E.g., "15 * 4".' },
        leftSide: { type: Type.STRING, description: 'For Equation Balancer: The left side of the equation. E.g., "3x + 5".' },
        rightSide: { type: Type.STRING, description: 'For Equation Balancer: The right side of the equation. E.g., "11".' },
        equation: { type: Type.STRING, description: 'For Graphing Canvas (line): The equation of the line to be graphed. E.g., "y = 2x - 1".' },
        prompt: { type: Type.STRING, description: 'For Graphing Canvas (point) or others: A prompt for the user. E.g., "Plot the point (3, -2)".' },
        geometricTask: { type: Type.STRING, enum: ['MEASURE_ANGLE', 'CONSTRUCT_SHAPE', 'TRANSFORM_SHAPE'], description: 'For Geometric Sandbox: The specific task.' },
        initialObjects: { type: Type.ARRAY, items: geoObjectSchema, description: 'For Geometric Sandbox: A list of initial points, lines, or shapes.' },
        calculusTask: { type: Type.STRING, enum: ['DERIVATIVE', 'INTEGRAL', 'LIMIT'], description: 'For Calculus Visualizer: The specific task.' },
        functionString: { type: Type.STRING, description: 'For Calculus Visualizer: The function to be visualized, in JS Math syntax. E.g., "Math.sin(x)".' },
        integralRange: { type: Type.ARRAY, items: { type: Type.NUMBER }, description: 'For Calculus Visualizer (Integral): The start and end points of the integration. E.g., [0, 3.14].' },
        limitPoint: { type: Type.NUMBER, description: 'For Calculus Visualizer (Limit): The point at which to find the limit.' },
    }
};


const questionSchema = {
    type: Type.OBJECT,
    properties: {
        title: { type: Type.STRING, description: 'Optional: For fill-in-the-blank questions, a short, descriptive title summarizing the question\'s topic. The questionText should then contain the sentence with the blank.' },
        questionText: { type: Type.STRING, description: 'The text of the question. For fill-in-the-blank, use "___" to represent the blank.' },
        questionType: { type: Type.STRING, enum: ['multiple-choice', 'fill-in-the-blank', 'math-interaction'], description: 'The type of question.' },
        interactionType: { type: Type.STRING, enum: ['calculation-pad', 'equation-balancer', 'graphing-canvas', 'geometric-sandbox', 'calculus-visualizer'], description: 'Specific type for "math-interaction" questions.' },
        initialState: mathInitialStateSchema,
        options: { 
            type: Type.ARRAY, 
            items: { 
                type: Type.OBJECT,
                properties: {
                    text: { type: Type.STRING, description: 'The selectable option text.' },
                    definition: { type: Type.STRING, description: 'A brief definition or explanation of the option text.' }
                },
                required: ['text', 'definition']
            }, 
            description: 'An array of 4 option objects for multiple-choice questions, each with text and a definition.' 
        },
        correctAnswer: { type: Type.STRING, description: 'The correct answer. For multiple-choice, it must match the "text" of one of the options. For fill-in-the-blank, it is the word that fills the blank. For math, it is the numerical or coordinate answer.' },
        explanation: { type: Type.STRING, description: 'A brief explanation of why the answer is correct. Use [[highlighted words]] to emphasize key terms.' },
        relatedSlideIndex: { type: Type.INTEGER, description: 'The index of the learning slide this question relates to.' }
    },
    required: ['questionText', 'questionType', 'correctAnswer', 'explanation', 'relatedSlideIndex']
};

const sectionDataSchema = {
    type: Type.OBJECT,
    properties: {
        title: { type: Type.STRING, description: 'A title for this section/lesson.' },
        summary: { type: Type.STRING, description: "A brief, one-paragraph summary of the entire section's content." },
        keyPoints: { type: Type.ARRAY, items: { type: Type.STRING }, description: "A list of 3-5 key takeaways or important facts from the learning material, each as a concise string." },
        biasAnalysis: { type: Type.STRING, description: "A neutral, objective analysis of any potential political, ideological, or cultural bias in the source topic. If no bias is detected, state that the content is objective and balanced." },
        learningMaterial: { type: Type.ARRAY, items: learningSlideSchema, description: 'An array of 3-5 learning slides.' },
        teachingPrompts: { type: Type.ARRAY, items: teachingPromptSchema, description: 'An array of 1-2 prompts for the user to explain a concept.' },
        questions: { type: Type.ARRAY, items: questionSchema, description: `An array of exactly ${NUM_QUESTIONS} questions of various types.` }
    },
    required: ['title', 'summary', 'keyPoints', 'biasAnalysis', 'learningMaterial', 'teachingPrompts', 'questions']
};

const chapterSchema = {
    type: Type.OBJECT,
    properties: {
        title: { type: Type.STRING, description: 'Title of the chapter.' },
        sections: { type: Type.ARRAY, items: sectionDataSchema, description: 'An array of 2-4 sections that break down the chapter content.' }
    },
    required: ['title', 'sections']
};

const curriculumSchema = {
    type: Type.OBJECT,
    properties: {
        title: { type: Type.STRING, description: 'A title for this curriculum module, based on the input text and topic.' },
        summary: { type: Type.STRING, description: "A brief, one-paragraph summary of the entire curriculum module." },
        keyPoints: { type: Type.ARRAY, items: { type: Type.STRING }, description: "A list of 3-5 key takeaways for the entire module." },
        biasAnalysis: { type: Type.STRING, description: "A neutral, objective analysis of any potential bias in the overall curriculum. If none, state it's objective." },
        chapters: { type: Type.ARRAY, items: chapterSchema, description: 'An array of chapters for the curriculum.' }
    },
    required: ['title', 'summary', 'keyPoints', 'biasAnalysis', 'chapters']
};

const articleDataSchema = {
    type: Type.OBJECT,
    properties: {
        content: { type: Type.STRING, description: "The full, in-depth article content, formatted in Markdown. It should be comprehensive and well-structured, around 800-1000 words. Use headings (##, ###), lists, and bold text to organize the information clearly." },
        summary: { type: Type.STRING, description: "A detailed summary of the article's main points, approximately 200 words long." },
        keyPoints: { type: Type.ARRAY, items: { type: Type.STRING }, description: "A list of 5-7 key takeaways or important facts from the article." },
        biasAnalysis: { type: Type.STRING, description: "A neutral, objective analysis of any potential political, ideological, or cultural bias in the article's content or perspective. If none, state it's objective." }
    },
    required: ['content', 'summary', 'keyPoints', 'biasAnalysis']
};

const feedItemSchema = {
    type: Type.OBJECT,
    properties: {
        title: { type: Type.STRING, description: "A compelling, click-bait style title that makes the user curious. It should be intriguing and hint at a surprising revelation." },
        summary: { type: Type.STRING, description: "A detailed summary of the topic, around 70-80 words long. It should provide enough context to be engaging and take about 20 seconds to read, fulfilling the promise of the click-bait title." },
        emoji: { type: Type.STRING, description: "A single emoji that visually represents the topic." },
        color: { type: Type.STRING, description: "A Tailwind CSS background color class, e.g., 'bg-blue-500', 'bg-green-500', 'bg-indigo-500', 'bg-red-500', 'bg-purple-500', 'bg-yellow-500', 'bg-pink-500'." }
    },
    required: ['title', 'summary', 'emoji', 'color']
};

const feedSchema = {
    type: Type.OBJECT,
    properties: {
        feedItems: {
            type: Type.ARRAY,
            items: feedItemSchema,
            description: "An array of interesting and novel topics."
        }
    },
    required: ['feedItems']
};

// Fix: Add schemas for new functionality
const evaluationSchema = {
    type: Type.OBJECT,
    properties: {
        isCorrect: { type: Type.BOOLEAN, description: 'True if the user\'s answer is semantically correct for the blank, otherwise false.' }
    },
    required: ['isCorrect']
};

const explanationEvaluationSchema = {
    type: Type.OBJECT,
    properties: {
        isCorrect: { type: Type.BOOLEAN, description: 'True if the user\'s explanation correctly and clearly explains the concept.' },
        feedback: { type: Type.STRING, description: 'Friendly and encouraging feedback for the user, written from the perspective of a curious child character. If correct, it should be a happy "I get it now!" type of response. If incorrect, it should gently point out the confusion and ask for clarification, e.g., "I\'m a little confused about..."' }
    },
    required: ['isCorrect', 'feedback']
};

const curriculumArraySchema = {
    type: Type.OBJECT,
    properties: {
        modules: {
            type: Type.ARRAY,
            items: curriculumSchema,
            description: "An array of 2-3 curriculum modules that break down the article into a learning path."
        }
    },
    required: ['modules']
};

const relatedTopicsSchema = {
    type: Type.OBJECT,
    properties: {
        topics: {
            type: Type.ARRAY,
            items: { type: Type.STRING },
            description: "A list of 3-5 related, but distinct, topics for further learning."
        }
    },
    required: ['topics']
};

const isMathTopic = (title: string): boolean => {
    const lowerTitle = title.toLowerCase();
    const mathKeywords = [
        'algebra', 
        'geometry', 
        'calculus', 
        'math', 
        'equation', 
        'graph', 
        'trigonometry', 
        'statistics', 
        'arithmetic',
        'derivative',
        'integral',
        'vector',
        'matrix'
    ];
    return mathKeywords.some(keyword => lowerTitle.includes(keyword));
};

const retry = async <T>(fn: () => Promise<T>, retries = 3, delay = 1000): Promise<T> => {
    try {
        return await fn();
    } catch (err) {
        if (retries > 0) {
            console.warn(`Retrying... attempts left: ${retries}`);
            await new Promise(res => setTimeout(res, delay));
            return retry(fn, retries - 1, delay * 2);
        }
        throw err;
    }
};

const generateAndParse = async <T>(prompt: string, schema: any, useSearch: boolean = false): Promise<{ data: T, sources: Source[] | null }> => {
    const modelConfig: any = {
        model: 'gemini-2.5-flash',
        contents: prompt,
        config: {
            temperature: 0.7,
        },
    };

    if (useSearch) {
        modelConfig.config.tools = [{ googleSearch: {} }];
    } else {
        modelConfig.config.responseMimeType = 'application/json';
        modelConfig.config.responseSchema = schema;
    }

    const response = await ai.models.generateContent(modelConfig);
    
    const groundingChunks = response.candidates?.[0]?.groundingMetadata?.groundingChunks;
    const sources: Source[] | null = groundingChunks
        ? groundingChunks
            .map((chunk: any) => chunk.web)
            .filter((web: any): web is Source => !!web && !!web.uri && !!web.title)
        : null;

    try {
        let jsonText = response.text.trim();
        
        // The model can wrap the JSON in markdown code blocks.
        const markdownMatch = /```(?:json)?\n([\s\S]*?)\n```/.exec(jsonText);
        if (markdownMatch && markdownMatch[1]) {
            jsonText = markdownMatch[1].trim();
        } else {
            // If not in a markdown block, find the first and last brace/bracket.
            // This is a simpler approach than balanced brace counting and may be more resilient to some model outputs.
            const firstBrace = jsonText.indexOf('{');
            const lastBrace = jsonText.lastIndexOf('}');
            const firstBracket = jsonText.indexOf('[');
            const lastBracket = jsonText.lastIndexOf(']');

            if (firstBrace !== -1 && lastBrace > firstBrace && (firstBracket === -1 || firstBrace < firstBracket)) {
                // It looks like an object.
                jsonText = jsonText.substring(firstBrace, lastBrace + 1);
            } else if (firstBracket !== -1 && lastBracket > firstBracket) {
                // It looks like an array.
                jsonText = jsonText.substring(firstBracket, lastBracket + 1);
            }
        }
        
        const data = JSON.parse(jsonText) as T;
        return { data, sources };
    } catch (e) {
        console.error("Failed to parse JSON response:", response.text);
        throw new Error("The AI returned an invalid response. Please try again.");
    }
};

// Fix: Add helper for non-JSON text generation
const generateText = async (prompt: string): Promise<string> => {
    const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: prompt,
        config: {
            temperature: 0.8,
            topP: 0.95,
        }
    });
    return response.text.trim();
};

export const generateLesson = async (title: string, difficulty: Difficulty): Promise<SectionData> => {
    const isMathematical = isMathTopic(title);
    const useSearch = difficulty === DifficultyEnum.HIGH_SCHOOL || difficulty === DifficultyEnum.COLLEGE || difficulty === DifficultyEnum.POST_GRADUATE;

    const mathInteractionGuideline = isMathematical
        ? `- The questions should be a mix of 'multiple-choice', 'fill-in-the-blank', and 'math-interaction' types.`
        : `- This topic is NOT mathematical. You MUST NOT generate any questions with the 'math-interaction' type. Only use 'multiple-choice' and 'fill-in-the-blank' question types. This is a very strict rule.`;

    let prompt;
    if (useSearch) {
        prompt = `
            You are an expert curriculum designer. Your task is to generate a single, self-contained lesson about "${title}" for a student at the "${difficulty}" level.
            You MUST use Google Search to ground your response, ensuring the information is factually accurate and up-to-date.

            Your response MUST be a single, valid JSON object that adheres strictly to the following JSON schema. Do not include any other text, explanations, or markdown formatting like \`\`\`json.

            JSON Schema:
            ${JSON.stringify(sectionDataSchema, null, 2)}

            Guidelines for JSON content:
            - The lesson must have a clear title.
            - Generate a 'summary', a list of 3-5 'keyPoints', and a 'biasAnalysis'.
            - Create 3-5 engaging 'learningMaterial' slides. Each slide should teach a small, digestible concept. Use markdown-style [[highlighted words]] for key terms.
            - Create 1-2 'teachingPrompts'.
            - Create exactly ${NUM_QUESTIONS} 'questions'. This is a hard requirement.
            ${mathInteractionGuideline}
            - For 'multiple-choice', you MUST provide 4 distinct option objects in the 'options' array. Each object must have a 'text' property (the choice) and a 'definition' property (a short explanation of that choice).
            - For 'fill-in-the-blank', the 'questionText' must be a complete, grammatically correct sentence with '___' marking the blank. The sentence must make sense on its own. Also provide a short, descriptive 'title' that summarizes the point of the question.
            - Ensure every question and teaching prompt has a valid 'relatedSlideIndex'.
            - Explanations should be clear and also use [[highlighted words]].
            - For 'math-interaction', provide the necessary 'interactionType' and 'initialState'.
        `;
    } else {
        prompt = `
            Generate a single, self-contained lesson about "${title}" for a student at the "${difficulty}" level.
            The lesson should be structured as a JSON object matching the provided schema.
            
            Guidelines:
            - The lesson must have a clear title.
            - Generate a 'summary', a list of 3-5 'keyPoints', and a 'biasAnalysis'.
            - Create 3-5 engaging 'learningMaterial' slides. Each slide should teach a small, digestible concept. Use markdown-style [[highlighted words]] for key terms.
            - Create 1-2 'teachingPrompts'. These are questions for the user to explain a concept back to an AI character, testing their understanding.
            - Create exactly ${NUM_QUESTIONS} 'questions'. This is a hard requirement.
            ${mathInteractionGuideline}
            - For 'multiple-choice', you MUST provide 4 distinct option objects in the 'options' array. Each object must have a 'text' property (the choice) and a 'definition' property (a short explanation of that choice).
            - For 'fill-in-the-blank', the 'questionText' must be a complete, grammatically correct sentence with '___' marking the blank. The sentence must make sense on its own. Also provide a short, descriptive 'title' that summarizes the point of the question.
            - Ensure every question and teaching prompt has a valid 'relatedSlideIndex' pointing to a slide in 'learningMaterial'.
            - Explanations should be clear and also use [[highlighted words]].
            - For 'math-interaction', you MUST provide the necessary 'interactionType' and 'initialState' properties.
              - For 'equation-balancer', you MUST provide 'leftSide' and 'rightSide'. The correctAnswer MUST be in the format 'x=VALUE'.
              - For 'calculation-pad', you MUST provide the 'expression'.
              - For 'graphing-canvas', provide an 'equation' string like 'y = 2x - 1' or a 'prompt' to plot a point.
              - For 'geometric-sandbox', provide 'geometricTask' and 'initialObjects'.
              - For 'calculus-visualizer', provide 'calculusTask' and 'functionString'.
            - The content should be factually accurate and appropriate for the specified difficulty level.
        `;
    }
    const { data, sources } = await retry(() => generateAndParse<SectionData>(prompt, sectionDataSchema, useSearch));
    if (sources && sources.length > 0) {
        data.sources = sources;
    }
    return data;
};

export const generateArticleStream = (title: string, summary: string) => {
    // Schema for the JSON part of the stream
    const articleMetadataSchema = {
        type: Type.OBJECT,
        properties: {
            summary: { type: Type.STRING, description: "A detailed summary of the article's main points, approximately 200 words long." },
            keyPoints: { type: Type.ARRAY, items: { type: Type.STRING }, description: "A list of 5-7 key takeaways or important facts from the article." },
            biasAnalysis: { type: Type.STRING, description: "A neutral, objective analysis of any potential political, ideological, or cultural bias in the article's content or perspective. If none, state it's objective." }
        },
        required: ['summary', 'keyPoints', 'biasAnalysis']
    };

    const prompt = `
        You are an expert writer. Your task is to generate a comprehensive, well-structured, and engaging article about "${title}".
        Use the following summary as a starting point and inspiration: "${summary}".
        The article should be around 800-1000 words.
        You MUST use Google Search to ground your response, ensuring the information is factually accurate and up-to-date.

        First, stream the full article content formatted in Markdown. Use headings (##, ###), lists, and bold text.

        After the article content is COMPLETELY finished, you MUST output a unique delimiter string '|||JSON_SEPARATOR|||' on a new line.

        Immediately after the delimiter, output a single, valid JSON object that adheres strictly to the following JSON schema. Do not include any other text, explanations, or markdown formatting around the JSON.

        JSON Schema:
        ${JSON.stringify(articleMetadataSchema, null, 2)}
    `;

    return ai.models.generateContentStream({
        model: 'gemini-2.5-flash',
        contents: prompt,
        config: {
            tools: [{ googleSearch: {} }],
        },
    });
};

export const generateModulesFromArticle = async (articleContent: string, topic: string, difficulty: Difficulty): Promise<Curriculum[]> => {
    const isMathematical = isMathTopic(topic);
    const mathInteractionGuideline = isMathematical
        ? `- Some questions in the sections can be of the 'math-interaction' type.`
        : `- This topic is NOT mathematical. You MUST NOT generate any questions with the 'math-interaction' type.`;
        
    const prompt = `
        You are an expert curriculum designer. Based on the following article content about "${topic}", create a structured learning path consisting of 2-3 distinct curriculum modules for a student at the "${difficulty}" level. Each module should build upon the last.

        Your response must be a single JSON object that strictly follows this schema:
        ${JSON.stringify(curriculumArraySchema, null, 2)}

        Article Content to analyze:
        ---
        ${articleContent.substring(0, 15000)}
        ---

        Guidelines for EACH module in the 'modules' array:
        - Each module must adhere to the curriculum schema.
        - The module title should be a continuation of the main topic, like "${topic} - Part 1: [Module Focus]".
        - Each module must contain 2-3 chapters.
        - Each chapter must contain 2-4 sections.
        - Each section must follow the sectionData schema, including 'summary', 'keyPoints', 'biasAnalysis', 3-5 'learningMaterial' slides, 1-2 'teachingPrompts', and exactly ${NUM_QUESTIONS} 'questions'.
        ${mathInteractionGuideline}
    `;
    
    const { data } = await retry(() => generateAndParse<{ modules: Curriculum[] }>(prompt, curriculumArraySchema));
    return data.modules;
};

export const generateRelatedTopics = async (currentTopic: string): Promise<string[]> => {
    const prompt = `
        Based on the learning topic "${currentTopic}", generate a list of 3-5 related but distinct topics that a curious student might want to explore next. These should be suggestions for new, separate lessons.

        Your response MUST be a single, valid JSON object that adheres strictly to the following JSON schema. Do not include any other text or explanations.

        JSON Schema:
        ${JSON.stringify(relatedTopicsSchema, null, 2)}
    `;

    const { data } = await retry(() => generateAndParse<{ topics: string[] }>(prompt, relatedTopicsSchema));
    return data.topics;
};

export const evaluateFillInTheBlankAnswer = async (questionText: string, correctAnswer: string, userAnswer:string): Promise<{ isCorrect: boolean }> => {
    const prompt = `
        You are an evaluator for a fill-in-the-blank question. Your task is to determine if the user's answer is correct. Be lenient with synonyms, capitalization, and minor spelling errors.

        The full sentence with the blank is: "${questionText}"
        The expected correct answer is: "${correctAnswer}"
        The user's answer to fill the blank is: "${userAnswer}"

        Is the user's answer a correct and acceptable alternative to the expected answer in the context of the sentence?

        Your response MUST be a single, valid JSON object that adheres strictly to the following JSON schema:
        ${JSON.stringify(evaluationSchema, null, 2)}
    `;

    const { data } = await retry(() => generateAndParse<{ isCorrect: boolean }>(prompt, evaluationSchema));
    return data;
};

export const evaluateExplanation = async (promptText: string, userAnswer: string, originalContext: string): Promise<{ isCorrect: boolean, feedback: string }> => {
    const prompt = `
        You are playing the part of a curious but smart young child character in an educational app. A user is trying to teach you a concept.
        Your task is to evaluate the user's explanation and provide a response from the character's perspective.

        The concept you asked about: "${promptText}"
        The correct information (for your reference): "${originalContext}"
        The user's explanation to you: "${userAnswer}"

        First, determine if the user's explanation is fundamentally correct, clear, and easy to understand.
        Then, generate a short, in-character feedback response.

        Your response MUST be a single, valid JSON object that adheres strictly to the following JSON schema:
        ${JSON.stringify(explanationEvaluationSchema, null, 2)}

        Feedback Guidelines:
        - If correct: The feedback should be happy and confirm understanding. Examples: "Oh, I get it now! So it's like...", "Wow, that makes so much sense! Thank you!", "You explained that really well!".
        - If incorrect or confusing: The feedback should be gentle and express confusion without being discouraging. Examples: "Hmm, I'm a little confused. You said [part of their answer], but I thought...", "I'm not sure I understand that part. Can you explain it another way?", "That's interesting! So how does that relate to [part of the original context]?".
    `;
    
    const { data } = await retry(() => generateAndParse<{ isCorrect: boolean, feedback: string }>(prompt, explanationEvaluationSchema));
    return data;
};

export const generateFeed = async (existingTitles: string[], topics: string[]): Promise<{ feedItems: FeedItem[] }> => {
    const currentDate = new Date().toLocaleDateString();
    const prompt = `
        You are a content curator for a learning app. 
        First, use Google Search to find the absolute latest, breaking news and trends from the last 7 days (as of ${currentDate}) related to these categories: ${topics.join(', ')}.
        
        Based *only* on these real-time search results, generate a list of 8 fascinating and diverse topics.
        
        The topics should be presented in a "click-bait" style title that makes the user want to learn more, but the 'summary' must be factual and based on the search results.
        
        To ensure variety, DO NOT generate any topics with the following titles:
        ${existingTitles.map(t => `- "${t}"`).join('\n')}

        Your response MUST be a single, valid JSON object that adheres strictly to the following JSON schema. Do not include any other text or explanations.

        JSON Schema:
        ${JSON.stringify(feedSchema, null, 2)}
    `;
    // Enable search (true) to get real-time results
    const { data } = await retry(() => generateAndParse<{ feedItems: FeedItem[] }>(prompt, feedSchema, true));
    return data;
};

export const generateSingleFeedItem = async (query: string): Promise<FeedItem> => {
    const prompt = `
        A user has searched for: "${query}".
        Generate a single, compelling feed item based on this search.
        The title should be in a click-bait style, and the summary should provide an engaging overview of the topic.
        
        Your response MUST be a single, valid JSON object that adheres strictly to the following JSON schema. Do not include any other text or explanations.

        JSON Schema:
        ${JSON.stringify(feedItemSchema, null, 2)}
    `;
    const { data } = await retry(() => generateAndParse<FeedItem>(prompt, feedItemSchema));
    return data;
};

export const generateChatResponse = async (topicContext: string, history: ChatMessage[], userInput: string): Promise<string> => {
    const formattedHistory = history.map(msg => `**${msg.role === 'user' ? 'User' : 'AI'}**: ${msg.text}`).join('\n');

    const prompt = `
        You are a helpful and knowledgeable AI assistant in a chat window. Your purpose is to discuss a specific topic with the user and answer their follow-up questions.
        You should be friendly, conversational, and provide clear, concise explanations. Use Markdown for formatting if it helps clarity.

        **Main Topic Context**: ${topicContext}

        **Chat History**:
        ${formattedHistory}

        **User's new message**: ${userInput}

        **Your response**:
    `;
    return retry(() => generateText(prompt));
};

export const generateCurriculum = async (fileContent: string, topic: string, difficulty: Difficulty): Promise<Curriculum> => {
    const isMathematical = isMathTopic(topic);
    const mathInteractionGuideline = isMathematical
        ? `- The questions should be a mix of 'multiple-choice', 'fill-in-the-blank', and 'math-interaction' types.`
        : `- This topic is NOT mathematical. You MUST NOT generate any questions with the 'math-interaction' type. Only use 'multiple-choice' and 'fill-in-the-blank' question types. This is a very strict rule.`;

    const prompt = `
        You are an expert curriculum designer. Based on the following text content about "${topic}", create a single, comprehensive curriculum module for a student at the "${difficulty}" level.

        The curriculum should be structured as a single JSON object matching the provided schema. Do not include any other text, explanations, or markdown formatting like \`\`\`json.
        JSON Schema: ${JSON.stringify(curriculumSchema, null, 2)}

        Text Content to analyze:
        ---
        ${fileContent.substring(0, 20000)}
        ---

        Guidelines:
        - The curriculum must have a clear title.
        - Generate an overall 'summary', a list of 3-5 'keyPoints', and a 'biasAnalysis' for the entire curriculum.
        - Divide the content into a logical sequence of 2-4 'chapters'.
        - Each chapter must contain 2-4 'sections'.
        - Each section must adhere to the sectionData schema:
            - It needs a 'summary', 'keyPoints', and 'biasAnalysis'.
            - It must have 3-5 'learningMaterial' slides.
            - It must have 1-2 'teachingPrompts'.
            - It must have exactly ${NUM_QUESTIONS} 'questions' of varied types.
            ${mathInteractionGuideline}
    `;

    const { data, sources } = await retry(() => generateAndParse<Curriculum>(prompt, curriculumSchema));
    if (sources && sources.length > 0) {
        data.sources = sources;
    }
    return data;
};

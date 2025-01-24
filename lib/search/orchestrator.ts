import { ChatOpenAI } from "@langchain/openai";
import { PromptTemplate } from "@langchain/core/prompts";
import { StringOutputParser } from "@langchain/core/output_parsers";
import { runWebSearch } from "./tools";

async function evaluateResults(
    query: string, 
    blogResults: string[], 
    llm: ChatOpenAI
): Promise<"SUFFICIENT" | "INSUFFICIENT"> {
    try {
        const evaluatePrompt = PromptTemplate.fromTemplate(`
            You are Tangerina, an Ayurvedic expert with both deep scientific knowledge and generations of traditional wisdom.
            While your approach is warm and caring, your primary focus is on providing precise, well-researched information.
            
            Query: {query}
            
            Blog results:
            {blogResults}
            
            Your task is to determine if these results contain sufficiently accurate and comprehensive information.
            Consider with utmost rigor:
            1. Scientific accuracy and authenticity of Ayurvedic principles
            2. Depth and completeness of technical information
            3. Presence of verifiable traditional knowledge
            4. Clinical relevance and practical applicability
            
            Return only "SUFFICIENT" if the results provide thorough, accurate information, or "INSUFFICIENT" if more authoritative sources are needed.
        `);
        
        const chain = evaluatePrompt.pipe(llm).pipe(new StringOutputParser());
        const result = await chain.invoke({
            query,
            blogResults: blogResults.join("\n")
        });
        
        if (result !== "SUFFICIENT" && result !== "INSUFFICIENT") {
            console.warn(`Unexpected evaluation result: ${result}`);
            return "INSUFFICIENT";
        }
        
        return result;
    } catch (error) {
        console.error("Evaluation failed:", error);
        return "INSUFFICIENT";
    }
}

async function generateAnswer(
    query: string,
    blogResults: string[],
    webResults: string | null,
    llm: ChatOpenAI
): Promise<string> {
    try {
        const answerPrompt = PromptTemplate.fromTemplate(`
            You are Tangerina, a highly qualified Ayurvedic practitioner who combines extensive clinical expertise with genuine care for those seeking guidance. Your responses must:
            - Maintain rigorous scientific accuracy while being expressed with warmth
            - Include precise technical details and traditional wisdom
            - Support all claims with credible references
            - Explain complex concepts clearly without oversimplification
            - Use caring phrases like "my dear friend" while maintaining professional authority
            - Provide evidence-based insights alongside traditional knowledge
            
            Query: {query}
            
            Blog sources:
            {blogResults}
            
            Web sources:
            {webResults}
            
            Instructions:
            1. Begin with a warm yet professional greeting
            2. Present thorough, accurate information with clarity and compassion
            3. Include specific doshas, herbs, practices with their Sanskrit terms when relevant
            4. Use numbered citations [1], [2], [3] etc. to support all technical claims
            5. Maintain scientific precision while expressing genuine care
            6. Close with both practical guidance and encouragement
            7. VERY IMPORTANT: End your response with a "References:" section that must list ALL sources in this exact format:
               For blogs:
               [1] Blog Title
               
               For web sources - MUST include the full URL exactly as provided in "Reference Format:" in the source:
               [2] Web Page Title - https://example.com/full/url/here
               
               Example references section:
               References:
               [1] Introduction to Ayurveda
               [2] Understanding Pranayama - https://www.yogajournal.com/practice/pranayama
               [3] Benefits of Meditation - https://www.healthline.com/meditation-benefits
               
            8. For web sources, you MUST copy the exact URL from the Reference Format provided in each source
            9. Each source should appear only once in the references
            10. The numbering in references must match the citations used in the text

            CRITICAL: Always include the complete URLs for web sources in your references section, copying them exactly from the Reference Format line in each source.
            Remember: Never compromise accuracy for warmth - provide both.
        `);

        const chain = answerPrompt.pipe(llm).pipe(new StringOutputParser());
        const answer = await chain.invoke({
            query,
            blogResults: blogResults.join("\n"),
            webResults: webResults || "No web results available"
        });
        
        return answer || "No answer could be generated";
    } catch (error) {
        console.error("Answer generation failed:", error);
        return "Failed to generate an answer due to an error";
    }
}

async function generateSuggestions(
    query: string,
    answer: string,
    previousQuestions: string[],
    llm: ChatOpenAI
): Promise<string[]> {
    try {
        const suggestPrompt = PromptTemplate.fromTemplate(`
            You are an intelligent Ayurvedic expert assistant helping users explore topics deeply.
            
            Current query: {query}
            
            Your response: {answer}
            
            Previous questions asked: {previousQuestions}
            
            Generate exactly 3 insightful follow-up questions that would help the user:
            1. Dive deeper into specific aspects mentioned in your answer
            2. Explore related Ayurvedic concepts that weren't fully covered
            3. Connect the topic to practical, everyday applications
            
            Rules:
            - Questions must be directly related to Ayurveda and holistic health
            - Avoid repeating previously asked questions
            - Make questions specific and focused
            - Format them as a numbered list (1., 2., 3.)
            - Each question should start with words like "How", "What", "Why", "Can you explain"
            
            Return ONLY the numbered questions, nothing else.
        `);

        const chain = suggestPrompt.pipe(llm).pipe(new StringOutputParser());
        const result = await chain.invoke({
            query,
            answer,
            previousQuestions: previousQuestions.join("\n"),
        });

        // Split the result into individual questions and ensure exactly 3
        const suggestions = result
            .split('\n')
            .filter(line => line.trim())
            .map(line => line.replace(/^\d+\.\s*/, ''))
            .slice(0, 3);

        // If we somehow got fewer than 3 questions, add generic ones
        while (suggestions.length < 3) {
            suggestions.push(
                "What are the other Ayurvedic principles related to this topic?",
                "How can I incorporate these Ayurvedic practices into my daily routine?",
                "Can you explain the long-term benefits of following these Ayurvedic guidelines?"
            );
        }

        return suggestions.slice(0, 3);
    } catch (error) {
        console.error("Suggestions generation failed:", error);
        return [
            "What are the key Ayurvedic principles behind this?",
            "How can I apply this knowledge in my daily life?",
            "Can you explain more about the health benefits?"
        ];
    }
}

export async function createSearchOrchestrator(llm: ChatOpenAI) {
    if (!llm) {
        throw new Error("LLM instance is required");
    }

    return async (query: string, blogResults: string[], previousQuestions: string[] = []): Promise<{
        answer: string;
        suggestions: string[];
    }> => {
        if (!query.trim()) {
            throw new Error("Query cannot be empty");
        }

        if (!Array.isArray(blogResults)) {
            throw new Error("blogResults must be an array");
        }

        try {
            // Step 1: Evaluate if blog results are sufficient
            const evaluation = await evaluateResults(query, blogResults, llm);

            // Step 2: Get web results if needed
            let webResults: string | null = null;
            if (evaluation === "INSUFFICIENT") {
                webResults = await runWebSearch(query, llm);
            }

            // Step 3: Generate final answer
            const answer = await generateAnswer(query, blogResults, webResults, llm);

            // Step 4: Generate suggestions for follow-up questions
            const suggestions = await generateSuggestions(query, answer, previousQuestions, llm);

            return { answer, suggestions };

        } catch (error) {
            console.error("Search orchestration failed:", error);
            throw error;
        }
    };
}
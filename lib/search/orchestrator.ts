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
            You are an Ayurvedic expert evaluating search results for relevance and quality.
            Query: {query}
            
            Blog results:
            {blogResults}
            
            Your task is to determine if these results are sufficient to answer the query.
            Consider:
            1. Relevance to the query
            2. Depth of information
            3. Accuracy from an Ayurvedic perspective
            
            Return only "SUFFICIENT" if the results are good enough, or "INSUFFICIENT" if we should search the web for more information.
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
            You are an experienced Ayurvedic expert. Using all available information, provide a comprehensive answer to this query.
            
            Query: {query}
            
            Blog sources:
            {blogResults}
            
            Web sources:
            {webResults}
            
            Instructions:
            1. Provide a clear and thorough answer
            2. Use numbered citations [1], [2], [3] etc. in your answer text
            3. VERY IMPORTANT: End your response with a "References:" section that must list ALL sources in this exact format:
               For blogs:
               [1] Blog Title
               
               For web sources - MUST include the full URL exactly as provided in "Reference Format:" in the source:
               [2] Web Page Title - https://example.com/full/url/here
               
               Example references section:
               References:
               [1] Introduction to Ayurveda
               [2] Understanding Pranayama - https://www.yogajournal.com/practice/pranayama
               [3] Benefits of Meditation - https://www.healthline.com/meditation-benefits
               
            4. For web sources, you MUST copy the exact URL from the Reference Format provided in each source
            5. Each source should appear only once in the references
            6. The numbering in references must match the citations used in the text
            7. Ensure accuracy from an Ayurvedic perspective

            CRITICAL: Always include the complete URLs for web sources in your references section, copying them exactly from the Reference Format line in each source.
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
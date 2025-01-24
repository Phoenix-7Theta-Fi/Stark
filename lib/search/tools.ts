import { ChatOpenAI } from "@langchain/openai";
import { JSDOM } from 'jsdom';
import { Readability } from '@mozilla/readability';
import axios from 'axios';

const SERPER_API_KEY = process.env.SERPER_API_KEY;

async function fetchAndExtractContent(url: string): Promise<{content: string, title: string}> {
    try {
        const response = await axios.get(url);
        const html = response.data;
        const doc = new JSDOM(html, { url });
        const reader = new Readability(doc.window.document);
        const article = reader.parse();
        return {
            content: article?.textContent || '',
            title: article?.title || url
        };
    } catch (error) {
        console.error(`Failed to extract content from ${url}:`, error);
        return { content: '', title: url };
    }
}

interface SearchResult {
    title: string;
    link: string;
    snippet: string;
}

export async function runWebSearch(query: string, llm: ChatOpenAI): Promise<string> {
    if (!SERPER_API_KEY) {
        throw new Error('SERPER_API_KEY is not configured');
    }

    try {
        const data = JSON.stringify({
            q: query
        });

        const config = {
            method: 'post',
            maxBodyLength: Infinity,
            url: 'https://google.serper.dev/search',
            headers: { 
                'X-API-KEY': SERPER_API_KEY,
                'Content-Type': 'application/json'
            },
            data: data
        };

        const searchResponse = await axios.request(config);
        const results: SearchResult[] = searchResponse.data.organic || [];

        // Extract content from each result
        const contentPromises = results.map(result => fetchAndExtractContent(result.link));
        const contents = await Promise.all(contentPromises);

        // Format results with URLs
        const formattedResults = results.map((result, index) => {
            const { content, title } = contents[index];
            return `
Source: ${title}
URL: ${result.link}
Content: ${content}

Reference Format: [${index + 1}] ${title} - ${result.link}
---
`;
        });

        return formattedResults.join('\n');
    } catch (error) {
        console.error('Web search error:', error);
        if (axios.isAxiosError(error)) {
            console.error('Serper API Response:', error.response?.data);
        }
        throw error;
    }
}
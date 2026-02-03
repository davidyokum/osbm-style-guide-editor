import { GoogleGenerativeAI } from "@google/generative-ai";
import { CHAT_SYSTEM_PROMPT } from "@/lib/prompts";

export async function POST(request: Request) {
    try {
        const { messages } = await request.json();

        if (!messages || !Array.isArray(messages)) {
            return new Response("Invalid request: messages array is required", { status: 400 });
        }

        const apiKey = process.env.GEMINI_API_KEY;
        if (!apiKey) {
            return new Response("GEMINI_API_KEY not configured", { status: 500 });
        }

        const genAI = new GoogleGenerativeAI(apiKey);
        const model = genAI.getGenerativeModel({
            model: "gemini-2.0-flash-exp",
            systemInstruction: CHAT_SYSTEM_PROMPT,
        });

        // Convert messages to Gemini format
        const contents = messages.map((msg: { role: string; content: string }) => ({
            role: msg.role === "assistant" ? "model" : "user",
            parts: [{ text: msg.content }],
        }));

        const result = await model.generateContentStream({ contents });

        const encoder = new TextEncoder();
        const stream = new ReadableStream({
            async start(controller) {
                try {
                    for await (const chunk of result.stream) {
                        const text = chunk.text();
                        controller.enqueue(encoder.encode(text));
                    }
                    controller.close();
                } catch (error) {
                    console.error("Stream error:", error);
                    controller.error(error);
                }
            },
        });

        return new Response(stream, {
            headers: {
                "Content-Type": "text/plain; charset=utf-8",
                "Transfer-Encoding": "chunked",
            },
        });
    } catch (error: unknown) {
        console.error("API error:", error);
        const errorMessage = error instanceof Error ? error.message : "Unknown error occurred";
        return new Response(`Error: ${errorMessage}`, { status: 500 });
    }
}

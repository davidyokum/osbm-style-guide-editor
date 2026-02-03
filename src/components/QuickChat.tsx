"use client";

import { useState, useRef, useEffect } from "react";
import { Send, Loader2 } from "lucide-react";
import ReactMarkdown from "react-markdown";

interface Message {
    role: "user" | "assistant";
    content: string;
}

const SUGGESTED_PROMPTS = [
    "What is the correct spelling of 'email'?",
    "How should I format fiscal year ranges?",
    "Should I use the Oxford comma?",
];

export function QuickChat() {
    const [messages, setMessages] = useState<Message[]>([]);
    const [input, setInput] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const [suggestions, setSuggestions] = useState<string[]>([]);
    const messagesEndRef = useRef<HTMLDivElement>(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    const sendMessage = async (messageText: string) => {
        if (!messageText.trim() || isLoading) return;

        const userMessage: Message = { role: "user", content: messageText };
        setMessages((prev) => [...prev, userMessage]);
        setInput("");
        setIsLoading(true);
        setSuggestions([]);

        try {
            const response = await fetch("/api/chat", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ messages: [...messages, userMessage] }),
            });

            if (!response.ok) {
                throw new Error(`API error: ${response.statusText}`);
            }

            const reader = response.body?.getReader();
            const decoder = new TextDecoder();
            let assistantMessage = "";

            if (reader) {
                while (true) {
                    const { done, value } = await reader.read();
                    if (done) break;

                    const chunk = decoder.decode(value);
                    assistantMessage += chunk;

                    setMessages((prev) => {
                        const newMessages = [...prev];
                        const lastMessage = newMessages[newMessages.length - 1];
                        if (lastMessage?.role === "assistant") {
                            lastMessage.content = assistantMessage;
                        } else {
                            newMessages.push({ role: "assistant", content: assistantMessage });
                        }
                        return newMessages;
                    });
                }
            }

            // Extract suggestions if present
            const suggestionsMatch = assistantMessage.match(/---SUGGESTIONS---\n([\s\S]*?)$/);
            if (suggestionsMatch) {
                const suggestionsList = suggestionsMatch[1]
                    .split("\n")
                    .filter((line) => line.trim().match(/^\d+\./))
                    .map((line) => line.replace(/^\d+\.\s*/, "").trim())
                    .slice(0, 3);
                setSuggestions(suggestionsList);

                // Remove suggestions from displayed message
                const cleanedMessage = assistantMessage.replace(/---SUGGESTIONS---[\s\S]*$/, "").trim();
                setMessages((prev) => {
                    const newMessages = [...prev];
                    const lastMessage = newMessages[newMessages.length - 1];
                    if (lastMessage?.role === "assistant") {
                        lastMessage.content = cleanedMessage;
                    }
                    return newMessages;
                });
            }
        } catch (error) {
            console.error("Chat error:", error);
            setMessages((prev) => [
                ...prev,
                {
                    role: "assistant",
                    content: `Error: ${error instanceof Error ? error.message : "Failed to get response"}`,
                },
            ]);
        } finally {
            setIsLoading(false);
        }
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        sendMessage(input);
    };

    return (
        <div className="bg-white rounded-lg shadow-lg p-6 flex flex-col h-[600px]">
            <h2 className="text-2xl font-bold text-gray-800 mb-4">Quick Style Guide Q&A</h2>

            {messages.length === 0 && (
                <div className="mb-4">
                    <p className="text-sm text-gray-600 mb-3">Try asking:</p>
                    <div className="flex flex-wrap gap-2">
                        {SUGGESTED_PROMPTS.map((prompt, i) => (
                            <button
                                key={i}
                                onClick={() => sendMessage(prompt)}
                                className="px-3 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-700 text-sm rounded-full transition-colors"
                            >
                                {prompt}
                            </button>
                        ))}
                    </div>
                </div>
            )}

            <div className="flex-1 overflow-y-auto mb-4 space-y-4">
                {messages.map((msg, i) => (
                    <div
                        key={i}
                        className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
                    >
                        <div
                            className={`max-w-[80%] rounded-lg px-4 py-2 ${msg.role === "user"
                                    ? "bg-blue-600 text-white"
                                    : "bg-gray-100 text-gray-800"
                                }`}
                        >
                            {msg.role === "assistant" ? (
                                <div className="prose prose-sm max-w-none">
                                    <ReactMarkdown>{msg.content}</ReactMarkdown>
                                </div>
                            ) : (
                                <p>{msg.content}</p>
                            )}
                        </div>
                    </div>
                ))}
                {isLoading && (
                    <div className="flex justify-start">
                        <div className="bg-gray-100 rounded-lg px-4 py-2">
                            <Loader2 className="w-5 h-5 animate-spin text-gray-600" />
                        </div>
                    </div>
                )}
                <div ref={messagesEndRef} />
            </div>

            {suggestions.length > 0 && (
                <div className="mb-3">
                    <p className="text-xs text-gray-500 mb-2">Follow-up questions:</p>
                    <div className="flex flex-wrap gap-2">
                        {suggestions.map((suggestion, i) => (
                            <button
                                key={i}
                                onClick={() => sendMessage(suggestion)}
                                className="px-3 py-1.5 bg-green-50 hover:bg-green-100 text-green-700 text-sm rounded-full transition-colors"
                            >
                                {suggestion}
                            </button>
                        ))}
                    </div>
                </div>
            )}

            <form onSubmit={handleSubmit} className="flex gap-2">
                <input
                    type="text"
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    placeholder="Ask about OSBM style guidelines..."
                    className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    disabled={isLoading}
                />
                <button
                    type="submit"
                    disabled={isLoading || !input.trim()}
                    className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    <Send className="w-5 h-5" />
                </button>
            </form>
        </div>
    );
}

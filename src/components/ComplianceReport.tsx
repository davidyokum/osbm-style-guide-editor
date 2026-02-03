"use client";

import { Download, Copy, Check } from "lucide-react";
import { useState } from "react";
import ReactMarkdown from "react-markdown";

interface ComplianceReportProps {
    report: string;
    filename: string;
}

export function ComplianceReport({ report, filename }: ComplianceReportProps) {
    const [copied, setCopied] = useState(false);

    const handleCopy = async () => {
        await navigator.clipboard.writeText(report);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    const handleDownload = () => {
        const blob = new Blob([report], { type: "text/markdown" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `${filename.replace(/\.[^/.]+$/, "")}_review.md`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    };

    return (
        <div className="bg-white rounded-lg shadow-lg p-6">
            <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold text-gray-800">Compliance Report</h2>
                <div className="flex gap-2">
                    <button
                        onClick={handleCopy}
                        className="flex items-center gap-2 px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
                    >
                        {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                        {copied ? "Copied!" : "Copy"}
                    </button>
                    <button
                        onClick={handleDownload}
                        className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
                    >
                        <Download className="w-4 h-4" />
                        Download
                    </button>
                </div>
            </div>

            <div className="prose prose-sm max-w-none">
                <ReactMarkdown
                    components={{
                        h1: ({ children }) => (
                            <h1 className="text-3xl font-bold text-gray-900 mt-6 mb-4">{children}</h1>
                        ),
                        h2: ({ children }) => (
                            <h2 className="text-2xl font-semibold text-gray-800 mt-5 mb-3">{children}</h2>
                        ),
                        h3: ({ children }) => (
                            <h3 className="text-xl font-semibold text-gray-700 mt-4 mb-2">{children}</h3>
                        ),
                        p: ({ children }) => <p className="text-gray-700 mb-3 leading-relaxed">{children}</p>,
                        ul: ({ children }) => <ul className="list-disc list-inside mb-4 space-y-1">{children}</ul>,
                        ol: ({ children }) => <ol className="list-decimal list-inside mb-4 space-y-1">{children}</ol>,
                        li: ({ children }) => <li className="text-gray-700">{children}</li>,
                        table: ({ children }) => (
                            <div className="overflow-x-auto mb-4">
                                <table className="min-w-full divide-y divide-gray-200 border border-gray-300">
                                    {children}
                                </table>
                            </div>
                        ),
                        thead: ({ children }) => <thead className="bg-gray-50">{children}</thead>,
                        tbody: ({ children }) => <tbody className="bg-white divide-y divide-gray-200">{children}</tbody>,
                        tr: ({ children }) => <tr>{children}</tr>,
                        th: ({ children }) => (
                            <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                {children}
                            </th>
                        ),
                        td: ({ children }) => <td className="px-4 py-2 text-sm text-gray-700">{children}</td>,
                        code: ({ children, className }) => {
                            const isInline = !className;
                            return isInline ? (
                                <code className="bg-gray-100 px-1 py-0.5 rounded text-sm font-mono text-red-600">
                                    {children}
                                </code>
                            ) : (
                                <code className="block bg-gray-100 p-4 rounded text-sm font-mono overflow-x-auto">
                                    {children}
                                </code>
                            );
                        },
                        blockquote: ({ children }) => (
                            <blockquote className="border-l-4 border-blue-500 pl-4 italic text-gray-600 my-4">
                                {children}
                            </blockquote>
                        ),
                    }}
                >
                    {report}
                </ReactMarkdown>
            </div>
        </div>
    );
}

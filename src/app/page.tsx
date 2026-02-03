"use client";

import { useState } from "react";
import { FileUpload } from "@/components/FileUpload";
import { ComplianceReport } from "@/components/ComplianceReport";
import { QuickChat } from "@/components/QuickChat";
import { FileText, MessageSquare } from "lucide-react";

type Tab = "review" | "chat";

export default function Home() {
  const [activeTab, setActiveTab] = useState<Tab>("review");
  const [report, setReport] = useState<string>("");
  const [filename, setFilename] = useState<string>("");
  const [isProcessing, setIsProcessing] = useState(false);

  const handleTextExtracted = async (text: string, name: string) => {
    setFilename(name);
    setIsProcessing(true);
    setReport("");

    try {
      const response = await fetch("/api/review", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text }),
      });

      if (!response.ok) {
        throw new Error(`API error: ${response.statusText}`);
      }

      const reader = response.body?.getReader();
      const decoder = new TextDecoder();
      let fullReport = "";

      if (reader) {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          const chunk = decoder.decode(value);
          fullReport += chunk;
          setReport(fullReport);
        }
      }
    } catch (error) {
      console.error("Review error:", error);
      setReport(
        `# Error\n\nFailed to process document: ${error instanceof Error ? error.message : "Unknown error"
        }`
      );
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <main className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 py-12 px-4">
      <div className="max-w-6xl mx-auto">
        <header className="text-center mb-12">
          <h1 className="text-5xl font-bold text-gray-900 mb-4">
            OSBM Style Guide Editor
          </h1>
          <p className="text-xl text-gray-600">
            Automated compliance review for NC budget publications
          </p>
        </header>

        <div className="mb-6">
          <div className="flex gap-4 border-b border-gray-300">
            <button
              onClick={() => setActiveTab("review")}
              className={`flex items-center gap-2 px-6 py-3 font-medium transition-colors ${activeTab === "review"
                  ? "text-blue-600 border-b-2 border-blue-600"
                  : "text-gray-600 hover:text-gray-800"
                }`}
            >
              <FileText className="w-5 h-5" />
              Document Review
            </button>
            <button
              onClick={() => setActiveTab("chat")}
              className={`flex items-center gap-2 px-6 py-3 font-medium transition-colors ${activeTab === "chat"
                  ? "text-blue-600 border-b-2 border-blue-600"
                  : "text-gray-600 hover:text-gray-800"
                }`}
            >
              <MessageSquare className="w-5 h-5" />
              Quick Q&A
            </button>
          </div>
        </div>

        {activeTab === "review" ? (
          <div className="space-y-8">
            <FileUpload onTextExtracted={handleTextExtracted} />

            {isProcessing && (
              <div className="bg-white rounded-lg shadow-lg p-8 text-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4" />
                <p className="text-gray-600">Analyzing document with Gemini 2.0 Flash...</p>
              </div>
            )}

            {report && !isProcessing && (
              <ComplianceReport report={report} filename={filename} />
            )}
          </div>
        ) : (
          <QuickChat />
        )}

        <footer className="mt-12 text-center text-sm text-gray-600">
          <p>
            Powered by Google Gemini 2.0 Flash • North Carolina Office of State Budget
            and Management
          </p>
        </footer>
      </div>
    </main>
  );
}

"use client";

import { useCallback, useState } from "react";
import { Upload, FileText } from "lucide-react";
import mammoth from "mammoth";
import { cn } from "@/lib/utils";

interface FileUploadProps {
    onTextExtracted: (text: string, filename: string) => void;
}

export function FileUpload({ onTextExtracted }: FileUploadProps) {
    const [isDragging, setIsDragging] = useState(false);
    const [isProcessing, setIsProcessing] = useState(false);

    const processFile = useCallback(
        async (file: File) => {
            setIsProcessing(true);
            try {
                let text = "";

                if (file.name.endsWith(".docx")) {
                    const arrayBuffer = await file.arrayBuffer();
                    const result = await mammoth.extractRawText({ arrayBuffer });
                    text = result.value;
                } else if (file.name.endsWith(".txt")) {
                    text = await file.text();
                } else {
                    throw new Error("Unsupported file type. Please upload .docx or .txt files.");
                }

                onTextExtracted(text, file.name);
            } catch (error) {
                console.error("Error processing file:", error);
                alert(error instanceof Error ? error.message : "Failed to process file");
            } finally {
                setIsProcessing(false);
            }
        },
        [onTextExtracted]
    );

    const handleDrop = useCallback(
        (e: React.DragEvent) => {
            e.preventDefault();
            setIsDragging(false);

            const file = e.dataTransfer.files[0];
            if (file) {
                processFile(file);
            }
        },
        [processFile]
    );

    const handleFileInput = useCallback(
        (e: React.ChangeEvent<HTMLInputElement>) => {
            const file = e.target.files?.[0];
            if (file) {
                processFile(file);
            }
        },
        [processFile]
    );

    return (
        <div
            onDragOver={(e) => {
                e.preventDefault();
                setIsDragging(true);
            }}
            onDragLeave={() => setIsDragging(false)}
            onDrop={handleDrop}
            className={cn(
                "relative border-2 border-dashed rounded-lg p-12 text-center transition-colors",
                isDragging ? "border-blue-500 bg-blue-50" : "border-gray-300 hover:border-gray-400",
                isProcessing && "opacity-50 pointer-events-none"
            )}
        >
            <input
                type="file"
                accept=".docx,.txt"
                onChange={handleFileInput}
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                disabled={isProcessing}
            />

            <div className="flex flex-col items-center gap-4">
                {isProcessing ? (
                    <>
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600" />
                        <p className="text-gray-600">Processing file...</p>
                    </>
                ) : (
                    <>
                        <div className="flex gap-2">
                            <Upload className="w-12 h-12 text-gray-400" />
                            <FileText className="w-12 h-12 text-gray-400" />
                        </div>
                        <div>
                            <p className="text-lg font-medium text-gray-700">
                                Drop your document here or click to browse
                            </p>
                            <p className="text-sm text-gray-500 mt-2">
                                Supports .docx and .txt files
                            </p>
                        </div>
                    </>
                )}
            </div>
        </div>
    );
}

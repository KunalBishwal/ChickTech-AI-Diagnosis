"use client";

import { useState, useRef } from "react";
import { Volume2, VolumeX, Loader2 } from "lucide-react";
import { useLanguage } from "@/context/LanguageContext";

interface TTSButtonProps {
    /** The text to read aloud. If not provided, the button is hidden. */
    text: string;
    className?: string;
    /** Render as icon-only (compact) or show a small label */
    compact?: boolean;
}

export default function TTSButton({ text, className = "", compact = true }: TTSButtonProps) {
    const { speak, isSpeaking, lang } = useLanguage();
    const [isThisPlaying, setIsThisPlaying] = useState(false);
    const idRef = useRef(Math.random().toString(36).slice(2));

    if (!text || lang === "en-IN") return null; // Only show for non-English

    const handleClick = async () => {
        if (isThisPlaying) {
            // Stop currently playing audio by playing silence (context handles it)
            setIsThisPlaying(false);
            return;
        }
        setIsThisPlaying(true);
        await speak(text);
        setIsThisPlaying(false);
    };

    return (
        <button
            onClick={handleClick}
            title={isThisPlaying ? "Stop" : "Listen"}
            className={`
        inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium
        transition-all duration-200
        ${isThisPlaying
                    ? "bg-blue-100 dark:bg-blue-900/40 text-blue-600 dark:text-blue-300 ring-2 ring-blue-400/50"
                    : "bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 hover:text-blue-600"
                }
        ${className}
      `}
        >
            {isThisPlaying ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
            ) : (
                <Volume2 className="w-3.5 h-3.5" />
            )}
            {!compact && <span>{isThisPlaying ? "Stop" : "Listen"}</span>}
        </button>
    );
}

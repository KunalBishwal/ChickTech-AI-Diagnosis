"use client";

import { useState, useRef, useEffect } from "react";
import { Globe, ChevronDown, Check } from "lucide-react";

export interface Language {
    code: string;
    name: string;
    nativeName: string;
    flag: string;
}

export const SUPPORTED_LANGUAGES: Language[] = [
    { code: "en-IN", name: "English", nativeName: "English", flag: "🇬🇧" },
    { code: "hi-IN", name: "Hindi", nativeName: "हिंदी", flag: "🇮🇳" },
    { code: "ta-IN", name: "Tamil", nativeName: "தமிழ்", flag: "🇮🇳" },
    { code: "te-IN", name: "Telugu", nativeName: "తెలుగు", flag: "🇮🇳" },
    { code: "bn-IN", name: "Bengali", nativeName: "বাংলা", flag: "🇮🇳" },
    { code: "kn-IN", name: "Kannada", nativeName: "ಕನ್ನಡ", flag: "🇮🇳" },
    { code: "mr-IN", name: "Marathi", nativeName: "मराठी", flag: "🇮🇳" },
    { code: "gu-IN", name: "Gujarati", nativeName: "ગુજરાતી", flag: "🇮🇳" },
    { code: "ml-IN", name: "Malayalam", nativeName: "മലയാളം", flag: "🇮🇳" },
    { code: "pa-IN", name: "Punjabi", nativeName: "ਪੰਜਾਬੀ", flag: "🇮🇳" },
    { code: "od-IN", name: "Odia", nativeName: "ଓଡ଼ିଆ", flag: "🇮🇳" },
];

interface LanguageSelectorProps {
    selectedLanguage: string;
    onLanguageChange: (langCode: string) => void;
    isTranslating?: boolean;
    className?: string;
}

export default function LanguageSelector({
    selectedLanguage,
    onLanguageChange,
    isTranslating = false,
    className = "",
}: LanguageSelectorProps) {
    const [isOpen, setIsOpen] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);

    const currentLang =
        SUPPORTED_LANGUAGES.find((l) => l.code === selectedLanguage) ||
        SUPPORTED_LANGUAGES[0];

    // Close dropdown on outside click
    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (
                dropdownRef.current &&
                !dropdownRef.current.contains(event.target as Node)
            ) {
                setIsOpen(false);
            }
        }
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    return (
        <div ref={dropdownRef} className={`relative inline-block ${className}`}>
            {/* Trigger Button */}
            <button
                onClick={() => setIsOpen(!isOpen)}
                disabled={isTranslating}
                className={`
          flex items-center gap-2 px-4 py-2.5 rounded-xl font-medium text-sm
          bg-white/60 dark:bg-gray-800/60 backdrop-blur-lg
          border border-gray-200/50 dark:border-gray-700/50
          shadow-lg hover:shadow-xl
          transition-all duration-300
          ${isTranslating ? "opacity-70 cursor-wait" : "hover:scale-[1.02] cursor-pointer"}
          ${isOpen ? "ring-2 ring-blue-400/50" : ""}
        `}
            >
                {isTranslating ? (
                    <div className="w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
                ) : (
                    <Globe className="w-4 h-4 text-blue-500" />
                )}
                <span className="text-gray-700 dark:text-gray-300">
                    {currentLang.flag} {currentLang.nativeName}
                </span>
                <ChevronDown
                    className={`w-3.5 h-3.5 text-gray-400 transition-transform duration-200 ${isOpen ? "rotate-180" : ""
                        }`}
                />
            </button>

            {/* Dropdown */}
            {isOpen && (
                <div
                    className="
            absolute top-full mt-2 right-0 z-50
            w-60 max-h-72 overflow-y-auto
            bg-white/90 dark:bg-gray-800/90 backdrop-blur-xl
            border border-gray-200/50 dark:border-gray-700/50
            rounded-xl shadow-2xl
            animate-in fade-in slide-in-from-top-2 duration-200
          "
                >
                    <div className="p-1.5">
                        {SUPPORTED_LANGUAGES.map((lang) => {
                            const isSelected = lang.code === selectedLanguage;
                            return (
                                <button
                                    key={lang.code}
                                    onClick={() => {
                                        onLanguageChange(lang.code);
                                        setIsOpen(false);
                                    }}
                                    className={`
                    w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm
                    transition-all duration-150
                    ${isSelected
                                            ? "bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300"
                                            : "text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700/50"
                                        }
                  `}
                                >
                                    <span className="text-base">{lang.flag}</span>
                                    <div className="flex flex-col items-start flex-1">
                                        <span className="font-medium">{lang.nativeName}</span>
                                        <span className="text-xs text-gray-400">{lang.name}</span>
                                    </div>
                                    {isSelected && (
                                        <Check className="w-4 h-4 text-blue-500 shrink-0" />
                                    )}
                                </button>
                            );
                        })}
                    </div>
                </div>
            )}
        </div>
    );
}

"use client";

import { useState, useRef, useEffect } from "react";
import { useLanguage } from "@/context/LanguageContext";
import TTSButton from "@/components/TTSButton";
import {
    Brain,
    Loader2,
    ChevronDown,
    ChevronUp,
    Sparkles,
    BookOpen,
    Stethoscope,
} from "lucide-react";

interface RAGTreatmentPanelProps {
    disease: string;
    confidence?: number;
}

const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL || "http://127.0.0.1:8080";

// ─── Custom Themed Select ────────────────────────────────────────────────────
interface SelectOption {
    value: string;
    label: string;
}

function CustomSelect({
    value,
    onChange,
    options,
    placeholder,
}: {
    value: string;
    onChange: (v: string) => void;
    options: SelectOption[];
    placeholder?: string;
}) {
    const [open, setOpen] = useState(false);
    const ref = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const handle = (e: MouseEvent) => {
            if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
        };
        document.addEventListener("mousedown", handle);
        return () => document.removeEventListener("mousedown", handle);
    }, []);

    const selected = options.find((o) => o.value === value);

    return (
        <div ref={ref} className="relative">
            {/* Trigger */}
            <button
                type="button"
                onClick={() => setOpen(!open)}
                className="w-full flex items-center justify-between px-4 py-2.5 bg-white/10 dark:bg-gray-800/60 backdrop-blur-md border border-white/20 dark:border-gray-600/50 rounded-xl text-sm text-gray-900 dark:text-white hover:border-indigo-400/60 focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all duration-200"
            >
                <span className={selected ? "" : "text-gray-400"}>
                    {selected?.label || placeholder || "Select..."}
                </span>
                <ChevronDown
                    className={`w-4 h-4 text-gray-400 transition-transform duration-200 ${
                        open ? "rotate-180" : ""
                    }`}
                />
            </button>

            {/* Dropdown */}
            <div
                className={`absolute z-50 mt-1.5 w-full rounded-xl border border-white/20 dark:border-gray-600/50 bg-white/95 dark:bg-gray-800/95 backdrop-blur-xl shadow-2xl overflow-hidden transition-all duration-200 origin-top ${
                    open
                        ? "opacity-100 scale-y-100 pointer-events-auto"
                        : "opacity-0 scale-y-95 pointer-events-none"
                }`}
            >
                <div className="max-h-52 overflow-y-auto py-1 scrollbar-thin">
                    {options.map((opt) => (
                        <button
                            key={opt.value}
                            type="button"
                            onClick={() => {
                                onChange(opt.value);
                                setOpen(false);
                            }}
                            className={`w-full text-left px-4 py-2.5 text-sm transition-colors duration-150 ${
                                opt.value === value
                                    ? "bg-indigo-500/20 text-indigo-600 dark:text-indigo-300 font-medium"
                                    : "text-gray-700 dark:text-gray-300 hover:bg-indigo-500/10 dark:hover:bg-indigo-500/15"
                            }`}
                        >
                            {opt.label}
                        </button>
                    ))}
                </div>
            </div>
        </div>
    );
}

export default function RAGTreatmentPanel({
    disease,
    confidence,
}: RAGTreatmentPanelProps) {
    const { t, lang } = useLanguage();

    const [flockSize, setFlockSize] = useState("");
    const [birdAge, setBirdAge] = useState("");
    const [birdAgeUnit, setBirdAgeUnit] = useState("weeks");
    const [severity, setSeverity] = useState("moderate");
    const [symptoms, setSymptoms] = useState("");
    const [customSymptoms, setCustomSymptoms] = useState("");
    const [plan, setPlan] = useState<string | null>(null);
    const [sources, setSources] = useState<string[]>([]);
    const [method, setMethod] = useState<string | null>(null);
    const [isGenerating, setIsGenerating] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [showSources, setShowSources] = useState(false);
    const [showForm, setShowForm] = useState(false);

    const handleGenerate = async () => {
        setIsGenerating(true);
        setError(null);
        setPlan(null);

        try {
            // Validation
            if (flockSize && isNaN(Number(flockSize))) {
                throw new Error("Flock size must be a valid number.");
            }
            if (birdAge) {
                const ageNum = Number(birdAge);
                if (isNaN(ageNum) || ageNum < 0) {
                    throw new Error("Bird age must be a valid positive number.");
                }
                let maxAge = 10;
                if (birdAgeUnit === "days") maxAge = 3650;
                if (birdAgeUnit === "weeks") maxAge = 520;
                if (birdAgeUnit === "months") maxAge = 120;
                
                if (ageNum > maxAge) {
                    throw new Error(`Invalid age. A chicken typically does not live more than 10 years (${maxAge} ${birdAgeUnit}).`);
                }
            }

            const finalSymptoms = symptoms === "Other" ? customSymptoms : symptoms;
            const fullAgeStr = birdAge ? `${birdAge} ${birdAgeUnit}` : "unknown";

            const res = await fetch(`${API_BASE}/generate-treatment`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    disease,
                    confidence: confidence || "unknown",
                    flock_size: flockSize || "unknown",
                    bird_age: fullAgeStr,
                    severity,
                    symptoms: finalSymptoms,
                    language: lang,
                }),
            });

            if (!res.ok) {
                const errData = await res.json().catch(() => ({}));
                throw new Error(
                    errData.error || `Server error: ${res.status}`
                );
            }

            const data = await res.json();
            setPlan(data.plan || "No plan generated.");
            setSources(data.sources || []);
            setMethod(data.method || "unknown");
        } catch (err: unknown) {
            const message =
                err instanceof Error
                    ? err.message
                    : "Failed to generate plan";
            setError(message);
        } finally {
            setIsGenerating(false);
        }
    };

    // Render inline bold (**text**) within a string
    const renderInlineBold = (text: string) => {
        const parts = text.split(/(\*\*[^*]+\*\*)/g);
        return parts.map((part, idx) => {
            if (part.startsWith("**") && part.endsWith("**")) {
                return (
                    <strong key={idx} className="font-semibold text-gray-900 dark:text-white">
                        {part.slice(2, -2)}
                    </strong>
                );
            }
            return <span key={idx}>{part}</span>;
        });
    };

    // Polished section-based renderer
    const renderPlan = (md: string) => {
        const lines = md.split("\n");
        const sections: { emoji: string; title: string; items: string[] }[] = [];
        let currentSection: { emoji: string; title: string; items: string[] } | null = null;
        const introLines: string[] = [];

        let floatingEmoji: string | null = null;
        const emojiPattern = /^(🚨|💊|🥗|🏠|🛡️|🩺|📅|⚠️)$/;
        const sectionPattern = /^(🚨|💊|🥗|🏠|🛡️|🩺|📅|⚠️)\s*(.+)/;

        lines.forEach((line) => {
            const trimmed = line.trim();
            if (!trimmed) return;

            // Clean markdown noise (headers, entire-line bold, and leading bullets that hit headers)
            const cleanLine = trimmed
                .replace(/^#{1,4}\s*/, "")
                .replace(/^\*\*(.+)\*\*$/, "$1")
                .replace(/^[-•*]\s+/, ""); // Remove leading bullets if Gemini prefixed the header

            // Handle: emoji purely on its own line
            if (emojiPattern.test(cleanLine)) {
                floatingEmoji = cleanLine;
                return;
            }

            const sectionMatch = cleanLine.match(sectionPattern);
            if (sectionMatch) {
                // Formatting is perfectly on one line: "🚨 Immediate Actions"
                if (currentSection) sections.push(currentSection);
                currentSection = {
                    emoji: sectionMatch[1],
                    title: sectionMatch[2].replace(/\*\*/g, ""),
                    items: [],
                };
                floatingEmoji = null;
            } else if (floatingEmoji) {
                // We saw an emoji on the line immediately before this
                if (currentSection) sections.push(currentSection);
                currentSection = {
                    emoji: floatingEmoji,
                    title: cleanLine.replace(/\*\*/g, ""),
                    items: [],
                };
                floatingEmoji = null;
            } else if (currentSection) {
                // Collect bullet items into the active section
                const bulletText = cleanLine
                    .replace(/^[-•*]\s*/, "")
                    .replace(/^\d+\.\s*/, "");
                if (bulletText) currentSection.items.push(bulletText);
            } else {
                // We are still in the intro paragraph
                if (cleanLine && !cleanLine.startsWith("---")) {
                    introLines.push(cleanLine);
                }
            }
        });
        if (currentSection) sections.push(currentSection);

        // Section style map
        const sectionStyles: Record<string, { bg: string; border: string; text: string }> = {
            "🚨": { bg: "bg-red-50/80 dark:bg-red-950/20", border: "border-red-200/50 dark:border-red-800/30", text: "text-red-700 dark:text-red-300" },
            "💊": { bg: "bg-blue-50/80 dark:bg-blue-950/20", border: "border-blue-200/50 dark:border-blue-800/30", text: "text-blue-700 dark:text-blue-300" },
            "🥗": { bg: "bg-green-50/80 dark:bg-green-950/20", border: "border-green-200/50 dark:border-green-800/30", text: "text-green-700 dark:text-green-300" },
            "🏠": { bg: "bg-amber-50/80 dark:bg-amber-950/20", border: "border-amber-200/50 dark:border-amber-800/30", text: "text-amber-700 dark:text-amber-300" },
            "🛡️": { bg: "bg-indigo-50/80 dark:bg-indigo-950/20", border: "border-indigo-200/50 dark:border-indigo-800/30", text: "text-indigo-700 dark:text-indigo-300" },
            "🩺": { bg: "bg-purple-50/80 dark:bg-purple-950/20", border: "border-purple-200/50 dark:border-purple-800/30", text: "text-purple-700 dark:text-purple-300" },
            "📅": { bg: "bg-teal-50/80 dark:bg-teal-950/20", border: "border-teal-200/50 dark:border-teal-800/30", text: "text-teal-700 dark:text-teal-300" },
        };

        const defaultStyle = { bg: "bg-gray-50/80 dark:bg-gray-800/30", border: "border-gray-200/50 dark:border-gray-700/30", text: "text-gray-700 dark:text-gray-300" };

        return (
            <div className="space-y-4">
                {/* Intro paragraph */}
                {introLines.length > 0 && (
                    <div className="px-1 space-y-1.5">
                        {introLines.map((line, i) => (
                            <p key={i} className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed">
                                {t(line.replace(/\*\*/g, ""))}
                            </p>
                        ))}
                    </div>
                )}

                {/* Section cards */}
                {sections.map((section, i) => {
                    const style = sectionStyles[section.emoji] || defaultStyle;
                    return (
                        <div
                            key={i}
                            className={`rounded-2xl border ${style.border} ${style.bg} p-5 transition-all duration-200`}
                        >
                            <div className="flex items-center gap-2 mb-3">
                                <span className="text-xl">{section.emoji}</span>
                                <h4 className={`font-bold text-base ${style.text}`}>
                                    {t(section.title)}
                                </h4>
                            </div>
                            <ul className="space-y-2">
                                {section.items.map((item, j) => (
                                    <li key={j} className="flex items-start gap-2.5 text-sm text-gray-700 dark:text-gray-300 leading-relaxed">
                                        <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-gray-400 dark:bg-gray-500 flex-shrink-0" />
                                        <span>{renderInlineBold(t(item))}</span>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    );
                })}
            </div>
        );
    };

    const methodLabel = (m: string | null) => {
        if (m === "gemini") return "AI-Generated (Gemini)";
        return "Knowledge-Based (Offline)";
    };

    return (
        <div className="mt-16 max-w-4xl mx-auto">
            {/* Header */}
            <div
                className="text-center mb-6 cursor-pointer"
                onClick={() => setShowForm(!showForm)}
            >
                <div className="inline-flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-indigo-500 to-purple-500 text-white rounded-full shadow-lg hover:shadow-xl hover:scale-105 transition-all duration-300">
                    <Brain className="w-5 h-5" />
                    <span className="font-semibold text-sm">
                        {t("AI Treatment Plan Generator")}
                    </span>
                    <Sparkles className="w-4 h-4 animate-pulse" />
                    {showForm ? (
                        <ChevronUp className="w-4 h-4" />
                    ) : (
                        <ChevronDown className="w-4 h-4" />
                    )}
                </div>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                    {t(
                        "Get a personalised treatment plan powered by RAG + AI"
                    )}
                </p>
            </div>

            {/* Expandable Form + Results */}
            {showForm && (
                <div className="backdrop-blur-xl border border-gray-200/50 dark:border-gray-700/50 rounded-3xl shadow-2xl p-8 transition-all duration-300 bg-transparent">
                    {/* Context Form */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
                        <div>
                            <label className="block text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wider mb-1.5">
                                {t("Flock Size")}
                            </label>
                            <input
                                type="number"
                                min="1"
                                value={flockSize}
                                onChange={(e) => setFlockSize(e.target.value)}
                                placeholder={t("e.g. 50")}
                                className="w-full px-4 py-2.5 bg-white/10 dark:bg-gray-800/60 backdrop-blur-md border border-white/20 dark:border-gray-600/50 rounded-xl text-sm text-gray-900 dark:text-white placeholder:text-gray-400 focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wider mb-1.5">
                                {t("Bird Age")}
                            </label>
                            <div className="flex gap-2">
                                <input
                                    type="number"
                                    min="1"
                                    value={birdAge}
                                    onChange={(e) => setBirdAge(e.target.value)}
                                    placeholder={t("e.g. 6")}
                                    className="w-1/2 px-4 py-2.5 bg-white/10 dark:bg-gray-800/60 backdrop-blur-md border border-white/20 dark:border-gray-600/50 rounded-xl text-sm text-gray-900 dark:text-white placeholder:text-gray-400 focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
                                />
                                <div className="w-1/2">
                                    <CustomSelect
                                        value={birdAgeUnit}
                                        onChange={setBirdAgeUnit}
                                        options={[
                                            { value: "days", label: t("Days") },
                                            { value: "weeks", label: t("Weeks") },
                                            { value: "months", label: t("Months") },
                                            { value: "years", label: t("Years") },
                                        ]}
                                    />
                                </div>
                            </div>
                        </div>
                        <div>
                            <label className="block text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wider mb-1.5">
                                {t("Observed Severity")}
                            </label>
                            <CustomSelect
                                value={severity}
                                onChange={setSeverity}
                                options={[
                                    { value: "mild", label: t("Mild") },
                                    { value: "moderate", label: t("Moderate") },
                                    { value: "severe", label: t("Severe") },
                                ]}
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wider mb-1.5">
                                {t("Additional Symptoms")}
                            </label>
                            <CustomSelect
                                value={symptoms}
                                onChange={setSymptoms}
                                placeholder={t("None / Unsure")}
                                options={[
                                    { value: "", label: t("None / Unsure") },
                                    { value: "Bloody droppings", label: t("Bloody droppings") },
                                    { value: "Lethargy and ruffled feathers", label: t("Lethargy and ruffled feathers") },
                                    { value: "Sneezing and nasal discharge", label: t("Sneezing and nasal discharge") },
                                    { value: "Swollen face or comb", label: t("Swollen face or comb") },
                                    { value: "Lameness or leg weakness", label: t("Lameness or leg weakness") },
                                    { value: "Twisted neck or paralysis", label: t("Twisted neck or paralysis") },
                                    { value: "Drop in egg production", label: t("Drop in egg production") },
                                    { value: "Other", label: t("Other (Type below)") },
                                ]}
                            />
                            
                            {symptoms === "Other" && (
                                <input
                                    type="text"
                                    value={customSymptoms}
                                    onChange={(e) => setCustomSymptoms(e.target.value)}
                                    placeholder={t("Please describe the symptoms...")}
                                    className="w-full px-4 py-2.5 bg-white/50 dark:bg-gray-700/50 border border-gray-200 dark:border-gray-600 rounded-xl text-sm text-gray-900 dark:text-white placeholder:text-gray-400 focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all animate-in fade-in slide-in-from-top-2"
                                />
                            )}
                        </div>
                    </div>

                    {/* Generate Button */}
                    <div className="text-center mb-6">
                        <button
                            onClick={handleGenerate}
                            disabled={isGenerating}
                            className="inline-flex items-center gap-2 px-8 py-3.5 bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 text-white font-semibold rounded-xl shadow-lg hover:shadow-2xl hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 transition-all duration-300"
                        >
                            {isGenerating ? (
                                <>
                                    <Loader2 className="w-5 h-5 animate-spin" />
                                    {t("Generating Plan...")}
                                </>
                            ) : (
                                <>
                                    <Stethoscope className="w-5 h-5" />
                                    {t("Generate AI Treatment Plan")}
                                </>
                            )}
                        </button>
                    </div>

                    {/* Error */}
                    {error && (
                        <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800/40 rounded-xl">
                            <p className="text-sm text-red-700 dark:text-red-300">
                                ❌ {error}
                            </p>
                        </div>
                    )}

                    {/* Generated Plan */}
                    {plan && (
                        <div className="space-y-4">
                            {/* Method badge + TTS */}
                            <div className="flex items-center justify-between">
                                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-indigo-100 text-indigo-700 dark:bg-indigo-900/40 dark:text-indigo-300">
                                    <Sparkles className="w-3 h-3" />
                                    {t(methodLabel(method))}
                                </div>
                                <TTSButton
                                    text={plan.replace(/[#*\-_•🚨💊🥗🏠🛡️🩺📅⚠️]/g, "").slice(0, 450)}
                                />
                            </div>

                            {/* Polished plan content */}
                            <div className="p-1">
                                {renderPlan(plan)}
                            </div>

                            {/* Sources accordion */}
                            {sources.length > 0 && (
                                <div className="pt-2">
                                    <button
                                        onClick={() =>
                                            setShowSources(!showSources)
                                        }
                                        className="flex items-center gap-2 text-xs font-semibold text-gray-500 dark:text-gray-400 hover:text-indigo-500 transition-colors"
                                    >
                                        <BookOpen className="w-3.5 h-3.5" />
                                        {t("Knowledge Sources")} (
                                        {sources.length})
                                        {showSources ? (
                                            <ChevronUp className="w-3.5 h-3.5" />
                                        ) : (
                                            <ChevronDown className="w-3.5 h-3.5" />
                                        )}
                                    </button>
                                    {showSources && (
                                        <div className="mt-2 flex flex-wrap gap-2">
                                            {sources.map((src) => (
                                                <span
                                                    key={src}
                                                    className="px-2.5 py-1 bg-gray-100 dark:bg-gray-700/50 text-gray-600 dark:text-gray-400 rounded-lg text-xs font-mono"
                                                >
                                                    {src}
                                                </span>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}

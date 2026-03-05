"use client";

import React, {
    createContext,
    useContext,
    useState,
    useRef,
    useCallback,
} from "react";

// ─── Types ────────────────────────────────────────────────────────────────────
interface LanguageContextType {
    lang: string;
    setLang: (lang: string) => void;
    /** Translate a string. Returns original immediately if lang === 'en-IN'.
     *  Otherwise returns cached value or fetches and caches it. */
    t: (text: string) => string;
    /** Pre-warm the cache for a list of strings in one batch. */
    tBatch: (texts: string[]) => Promise<void>;
    /** True while any translation request is in-flight. */
    isTranslating: boolean;
    /** True while TTS audio is playing. */
    isSpeaking: boolean;
    /** Speak a text string via Sarvam TTS. */
    speak: (text: string) => Promise<void>;
}

// ─── Context ──────────────────────────────────────────────────────────────────
const LanguageContext = createContext<LanguageContextType>({
    lang: "en-IN",
    setLang: () => { },
    t: (text) => text,
    tBatch: async () => { },
    isTranslating: false,
    isSpeaking: false,
    speak: async () => { },
});

const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL || "http://127.0.0.1:8080";
const BATCH_SIZE = 50; // Use bulk translate endpoint to process 50 strings at once

// ─── Provider ─────────────────────────────────────────────────────────────────
export function LanguageProvider({ children }: { children: React.ReactNode }) {
    const [lang, setLangState] = useState("en-IN");
    const [isTranslating, setIsTranslating] = useState(false);
    const [isSpeaking, setIsSpeaking] = useState(false);
    // Bumping this counter forces re-render so t() picks up newly cached translations
    const [, setTranslationVersion] = useState(0);

    // Shared translation cache: { "en-IN::hi-IN::text": "translated" }
    const cacheRef = useRef<Map<string, string>>(new Map());
    // In-flight requests map to avoid duplicate API calls
    const inFlightRef = useRef<Map<string, Promise<string>>>(new Map());
    // Current audio element for TTS
    const audioRef = useRef<HTMLAudioElement | null>(null);

    // ─── Internal translate single string ───────────────────────────────────────
    const translateOne = useCallback(
        async (text: string, targetLang: string): Promise<string> => {
            if (!text.trim() || targetLang === "en-IN") return text;
            const key = `${targetLang}::${text}`;
            if (cacheRef.current.has(key)) return cacheRef.current.get(key)!;

            // Avoid duplicate in-flight requests for the same key
            if (inFlightRef.current.has(key)) return inFlightRef.current.get(key)!;

            const promise = (async () => {
                try {
                    const res = await fetch(`${API_BASE}/translate`, {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({ text, source_lang: "en-IN", target_lang: targetLang }),
                    });
                    if (!res.ok) throw new Error(`HTTP ${res.status}`);
                    const data = await res.json();
                    const translated = data.translated_text || text;
                    cacheRef.current.set(key, translated);
                    return translated;
                } catch {
                    return text; // graceful fallback: show original
                } finally {
                    inFlightRef.current.delete(key);
                }
            })();

            inFlightRef.current.set(key, promise);
            return promise;
        },
        []
    );

    // ─── t() — synchronous, returns cached or original ──────────────────────────
    const t = useCallback(
        (text: string): string => {
            if (!text || lang === "en-IN") return text;
            const key = `${lang}::${text}`;
            // Return cached value if available
            if (cacheRef.current.has(key)) return cacheRef.current.get(key)!;
            // Trigger async fetch in background; bump version to re-render when done
            translateOne(text, lang).then(() => {
                setTranslationVersion((v) => v + 1);
            });
            return text; // return original while loading
        },
        [lang, translateOne]
    );

    // ─── tBatch() — pre-warm cache for a list of strings ────────────────────────
    const tBatch = useCallback(
        async (texts: string[]) => {
            if (lang === "en-IN") return;
            const missing = texts.filter((text) => {
                if (!text.trim()) return false;
                const key = `${lang}::${text}`;
                return !cacheRef.current.has(key);
            });
            if (missing.length === 0) return;

            // Deduplicate missing strings
            const uniqueMissing = Array.from(new Set(missing));

            setIsTranslating(true);
            try {
                for (let i = 0; i < uniqueMissing.length; i += BATCH_SIZE) {
                    const batchTexts = uniqueMissing.slice(i, i + BATCH_SIZE);
                    // Hit the backend bulk endpoint
                    const res = await fetch(`${API_BASE}/translate-batch`, {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({
                            texts: batchTexts,
                            source_lang: "en-IN",
                            target_lang: lang,
                        }),
                    });

                    if (res.ok) {
                        const data = await res.json();
                        const translatedBatch = data.translated_texts || [];
                        batchTexts.forEach((text, idx) => {
                            const key = `${lang}::${text}`;
                            const translated = translatedBatch[idx] || text;
                            cacheRef.current.set(key, translated);
                        });
                    }
                }
            } catch (err) {
                console.error("Batch translation failed:", err);
            } finally {
                // Bump version to force re-render so t() picks up cached values
                setTranslationVersion((v) => v + 1);
                setIsTranslating(false);
            }
        },
        [lang]
    );

    // ─── setLang — change language and pre-warm common strings ──────────────────
    const setLang = useCallback((newLang: string) => {
        setLangState(newLang);
    }, []);

    // ─── speak() — TTS via Sarvam AI ────────────────────────────────────────────
    const speak = useCallback(
        async (text: string) => {
            if (!text.trim()) return;

            // Stop currently playing audio
            if (audioRef.current) {
                audioRef.current.pause();
                audioRef.current = null;
            }

            setIsSpeaking(true);
            try {
                const res = await fetch(`${API_BASE}/tts`, {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ text, lang }),
                });
                if (!res.ok) {
                    console.error("TTS error:", res.status);
                    return;
                }
                const data = await res.json();
                const b64 = data.audio_base64;
                if (!b64) return;

                // Decode base64 WAV and play
                const binaryStr = atob(b64);
                const bytes = new Uint8Array(binaryStr.length);
                for (let i = 0; i < binaryStr.length; i++) {
                    bytes[i] = binaryStr.charCodeAt(i);
                }
                const blob = new Blob([bytes], { type: "audio/wav" });
                const url = URL.createObjectURL(blob);
                const audio = new Audio(url);
                audioRef.current = audio;
                audio.onended = () => {
                    setIsSpeaking(false);
                    URL.revokeObjectURL(url);
                    audioRef.current = null;
                };
                audio.onerror = () => {
                    setIsSpeaking(false);
                    URL.revokeObjectURL(url);
                    audioRef.current = null;
                };
                audio.play();
            } catch (err) {
                console.error("TTS failed:", err);
                setIsSpeaking(false);
            }
        },
        [lang]
    );

    return (
        <LanguageContext.Provider value={{ lang, setLang, t, tBatch, isTranslating, isSpeaking, speak }}>
            {children}
        </LanguageContext.Provider>
    );
}

// ─── Hook ─────────────────────────────────────────────────────────────────────
export function useLanguage() {
    return useContext(LanguageContext);
}

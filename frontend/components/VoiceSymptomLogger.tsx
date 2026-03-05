"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { Mic, MicOff, Loader2, Volume2, AlertCircle } from "lucide-react";
import { toast } from "sonner";

interface VoiceSymptomLoggerProps {
    onTranscriptReady: (transcript: string, suggestedPipeline: "coccidiosis" | "external-lesion" | null) => void;
    className?: string;
}

// Keywords that suggest which disease pipeline to use
const COCCIDIOSIS_KEYWORDS = [
    "poop", "droppings", "feces", "fecal", "bloody", "blood", "diarrhea", "diarrhoea",
    "watery", "mucus", "intestine", "coccidiosis", "coccidia", "oocyst",
    "lethargy", "lethargic", "huddled", "ruffled", "pale comb", "weight loss",
    // Hindi keywords
    "खून", "दस्त", "पतला", "बीमार", "कोक्सीडियोसिस",
    // Tamil
    "இரத்தம்", "வயிற்றுப்போக்கு",
];

const EXTERNAL_LESION_KEYWORDS = [
    "foot", "feet", "bumble", "bumblefoot", "swollen", "scab", "lesion", "lump",
    "wart", "pox", "fowlpox", "skin", "comb", "wattle", "eye", "eyelid",
    "nodule", "blister", "wound", "limping", "lame", "lameness",
    "pustule", "crust", "pododermatitis",
    // Hindi
    "पैर", "सूजन", "घाव", "चेचक",
    // Tamil
    "கால்", "வீக்கம்", "புண்",
];

const MAX_RECORDING_SECONDS = 25;

export default function VoiceSymptomLogger({
    onTranscriptReady,
    className = "",
}: VoiceSymptomLoggerProps) {
    const [isRecording, setIsRecording] = useState(false);
    const [isProcessing, setIsProcessing] = useState(false);
    const [transcript, setTranscript] = useState<string | null>(null);
    const [suggestedPipeline, setSuggestedPipeline] = useState<"coccidiosis" | "external-lesion" | null>(null);
    const [recordingTime, setRecordingTime] = useState(0);
    const [error, setError] = useState<string | null>(null);

    const mediaRecorderRef = useRef<MediaRecorder | null>(null);
    const chunksRef = useRef<Blob[]>([]);
    const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
    const streamRef = useRef<MediaStream | null>(null);

    // Cleanup on unmount
    useEffect(() => {
        return () => {
            stopRecordingCleanup();
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const stopRecordingCleanup = () => {
        if (timerRef.current) {
            clearInterval(timerRef.current);
            timerRef.current = null;
        }
        if (streamRef.current) {
            streamRef.current.getTracks().forEach((t) => t.stop());
            streamRef.current = null;
        }
    };

    const analyzePipeline = (text: string): "coccidiosis" | "external-lesion" | null => {
        const lower = text.toLowerCase();
        let cocciScore = 0;
        let lesionScore = 0;

        COCCIDIOSIS_KEYWORDS.forEach((kw) => {
            if (lower.includes(kw.toLowerCase())) cocciScore++;
        });
        EXTERNAL_LESION_KEYWORDS.forEach((kw) => {
            if (lower.includes(kw.toLowerCase())) lesionScore++;
        });

        if (cocciScore === 0 && lesionScore === 0) return null;
        return cocciScore >= lesionScore ? "coccidiosis" : "external-lesion";
    };

    const startRecording = async () => {
        setError(null);
        setTranscript(null);
        setSuggestedPipeline(null);

        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            streamRef.current = stream;

            // Try to use webm (Chrome/Edge) or fall back to wav/mp4
            const mimeType = MediaRecorder.isTypeSupported("audio/webm;codecs=opus")
                ? "audio/webm;codecs=opus"
                : MediaRecorder.isTypeSupported("audio/mp4")
                    ? "audio/mp4"
                    : "audio/webm";

            const recorder = new MediaRecorder(stream, { mimeType });
            mediaRecorderRef.current = recorder;
            chunksRef.current = [];

            recorder.ondataavailable = (e) => {
                if (e.data.size > 0) {
                    chunksRef.current.push(e.data);
                }
            };

            recorder.onstop = () => {
                const blob = new Blob(chunksRef.current, { type: mimeType });
                sendAudioToBackend(blob, mimeType);
            };

            recorder.start(250); // Collect data every 250ms
            setIsRecording(true);
            setRecordingTime(0);

            // Timer for recording duration
            timerRef.current = setInterval(() => {
                setRecordingTime((prev) => {
                    if (prev + 1 >= MAX_RECORDING_SECONDS) {
                        stopRecording();
                        return MAX_RECORDING_SECONDS;
                    }
                    return prev + 1;
                });
            }, 1000);
        } catch (err: any) {
            console.error("Microphone access error:", err);
            if (err.name === "NotAllowedError") {
                setError("Microphone access denied. Please allow microphone in your browser settings.");
            } else {
                setError("Could not access microphone. Please check your device.");
            }
            toast.error("Microphone access failed");
        }
    };

    const stopRecording = useCallback(() => {
        if (mediaRecorderRef.current && mediaRecorderRef.current.state !== "inactive") {
            mediaRecorderRef.current.stop();
        }
        setIsRecording(false);
        stopRecordingCleanup();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    // Auto-stop when max time reached
    useEffect(() => {
        if (recordingTime >= MAX_RECORDING_SECONDS && isRecording) {
            stopRecording();
        }
    }, [recordingTime, isRecording, stopRecording]);

    const sendAudioToBackend = async (blob: Blob, mimeType: string) => {
        setIsProcessing(true);
        try {
            const ext = mimeType.includes("mp4") ? "mp4" : "webm";
            const formData = new FormData();
            formData.append("audio", blob, `recording.${ext}`);

            const apiUrl = `${process.env.NEXT_PUBLIC_API_BASE_URL}/transcribe`;
            console.log("🎙️ Sending audio to:", apiUrl, `(${(blob.size / 1024).toFixed(1)} KB)`);

            const response = await fetch(apiUrl, {
                method: "POST",
                body: formData,
            });

            if (!response.ok) {
                const errText = await response.text();
                throw new Error(`Server error ${response.status}: ${errText}`);
            }

            const data = await response.json();
            const text = data.transcript || "";

            if (!text.trim()) {
                setError("No speech detected. Please try again and speak clearly.");
                toast.warning("No speech detected — try again");
                return;
            }

            setTranscript(text);
            const pipeline = analyzePipeline(text);
            setSuggestedPipeline(pipeline);
            onTranscriptReady(text, pipeline);

            if (pipeline) {
                toast.success(
                    `Detected: ${pipeline === "coccidiosis" ? "Coccidiosis symptoms" : "External lesion symptoms"}`
                );
            } else {
                toast.info("Transcription complete — review below");
            }
        } catch (err: any) {
            console.error("Transcription error:", err);
            setError(err.message || "Transcription failed. Please try again.");
            toast.error("Voice transcription failed");
        } finally {
            setIsProcessing(false);
        }
    };

    const formatTime = (seconds: number) => {
        const m = Math.floor(seconds / 60);
        const s = seconds % 60;
        return `${m}:${s.toString().padStart(2, "0")}`;
    };

    const progressPercent = (recordingTime / MAX_RECORDING_SECONDS) * 100;

    return (
        <div className={`${className}`}>
            {/* Main Button */}
            <div className="flex flex-col items-center gap-3">
                <button
                    onClick={() => {
                        if (isRecording) {
                            stopRecording();
                        } else if (!isProcessing) {
                            startRecording();
                        }
                    }}
                    disabled={isProcessing}
                    className={`
            relative group flex items-center gap-3 px-6 py-3 rounded-2xl font-semibold text-sm
            transition-all duration-300 shadow-lg
            ${isRecording
                            ? "bg-gradient-to-r from-red-500 to-pink-500 text-white shadow-red-500/30 scale-105 animate-pulse"
                            : isProcessing
                                ? "bg-gray-200 dark:bg-gray-700 text-gray-400 cursor-wait"
                                : "bg-gradient-to-r from-emerald-500 to-teal-500 text-white hover:shadow-xl hover:scale-105 shadow-emerald-500/20"
                        }
          `}
                >
                    {isProcessing ? (
                        <>
                            <Loader2 className="w-5 h-5 animate-spin" />
                            <span>Transcribing...</span>
                        </>
                    ) : isRecording ? (
                        <>
                            <MicOff className="w-5 h-5" />
                            <span>Stop Recording</span>
                            <span className="ml-1 text-xs opacity-80">
                                {formatTime(recordingTime)} / {formatTime(MAX_RECORDING_SECONDS)}
                            </span>
                        </>
                    ) : (
                        <>
                            <Mic className="w-5 h-5" />
                            <span>🎙️ Describe Symptoms</span>
                        </>
                    )}

                    {/* Recording progress ring */}
                    {isRecording && (
                        <div className="absolute -inset-1 rounded-2xl overflow-hidden pointer-events-none">
                            <div
                                className="h-full bg-white/20 transition-all duration-1000 ease-linear"
                                style={{ width: `${progressPercent}%` }}
                            />
                        </div>
                    )}
                </button>

                {!isRecording && !isProcessing && !transcript && (
                    <p className="text-xs text-gray-400 dark:text-gray-500 text-center max-w-xs">
                        Speak in any language — describe your chicken's symptoms and we'll suggest the right detection mode
                    </p>
                )}
            </div>

            {/* Error */}
            {error && (
                <div className="mt-4 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800/40 rounded-xl flex items-start gap-2">
                    <AlertCircle className="w-4 h-4 text-red-500 mt-0.5 shrink-0" />
                    <p className="text-xs text-red-600 dark:text-red-400">{error}</p>
                </div>
            )}

            {/* Transcript Result */}
            {transcript && !isRecording && !isProcessing && (
                <div className="mt-4 p-4 bg-white/70 dark:bg-gray-800/70 backdrop-blur-sm border border-gray-200/50 dark:border-gray-700/50 rounded-xl shadow-md animate-in fade-in slide-in-from-bottom-3 duration-300">
                    <div className="flex items-center gap-2 mb-2">
                        <Volume2 className="w-4 h-4 text-emerald-500" />
                        <span className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                            Your Symptoms
                        </span>
                    </div>
                    <p className="text-sm text-gray-800 dark:text-gray-200 leading-relaxed">
                        "{transcript}"
                    </p>

                    {suggestedPipeline && (
                        <div className="mt-3 flex items-center gap-2">
                            <span className="text-xs text-gray-500">Suggested:</span>
                            <span
                                className={`text-xs font-bold px-2.5 py-1 rounded-full ${suggestedPipeline === "coccidiosis"
                                        ? "bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300"
                                        : "bg-orange-100 text-orange-700 dark:bg-orange-900/40 dark:text-orange-300"
                                    }`}
                            >
                                {suggestedPipeline === "coccidiosis"
                                    ? "🦠 Coccidiosis (Fecal)"
                                    : "🩹 Bumblefoot & Fowlpox"}
                            </span>
                        </div>
                    )}

                    <button
                        onClick={() => {
                            setTranscript(null);
                            setSuggestedPipeline(null);
                            setError(null);
                        }}
                        className="mt-3 text-xs text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 underline transition-colors"
                    >
                        Clear & try again
                    </button>
                </div>
            )}
        </div>
    );
}

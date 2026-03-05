"use client";

import { useState, useEffect, useRef } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import {
    Leaf,
    Droplets,
    HeartPulse,
    ShieldCheck,
    Thermometer,
    Syringe,
    Eye,
    Footprints,
    Bug,
    Stethoscope,
    AlertTriangle,
    Pill,
    Scissors,
    SprayCan,
    Sun,
    Apple,
} from "lucide-react";
import LiquidEther from "@/components/reactbits/liquid-ether";
import { useLanguage } from "@/context/LanguageContext";
import TTSButton from "@/components/TTSButton";

type DiseaseTab = "coccidiosis" | "external-lesion";

interface GuideStep {
    icon: React.ReactNode;
    title: string;
    description: string;
    details: string[];
    severity: "critical" | "important" | "supportive";
}

const coccidiosisSteps: GuideStep[] = [
    {
        icon: <AlertTriangle className="w-8 h-8" />,
        title: "Immediate Isolation",
        description:
            "Separate infected birds from the healthy flock immediately to prevent oocyst transmission.",
        details: [
            "Move symptomatic birds (bloody droppings, lethargy, ruffled feathers) to a quarantine area",
            "Restrict movement between infected and clean areas — use dedicated boots and clothing",
            "Monitor the remaining flock for signs: weight loss, pale combs, decreased feed intake",
        ],
        severity: "critical",
    },
    {
        icon: <Pill className="w-8 h-8" />,
        title: "Administer Anticoccidial Medication",
        description:
            "Start treatment with veterinary-approved coccidiostats immediately upon diagnosis.",
        details: [
            "Amprolium (Corid): 10 mg/kg in drinking water for 5–7 days — first-line treatment",
            "Toltrazuril (Baycox): 7 mg/kg single oral dose, repeat after 48 hrs if needed",
            "Sulfonamides (Sulfadimethoxine): 50 mg/kg on day 1, then 25 mg/kg for 4–5 days as second-line",
            "Ensure medicated water is the ONLY water source during treatment",
        ],
        severity: "critical",
    },
    {
        icon: <Droplets className="w-8 h-8" />,
        title: "Rehydration & Electrolytes",
        description:
            "Coccidiosis causes severe dehydration from intestinal bleeding. Fluid support is essential.",
        details: [
            "Add oral rehydration salts (ORS) to drinking water throughout treatment",
            "Include electrolytes (potassium, sodium) to combat fluid loss",
            "Offer glucose-enriched water (20g sugar per litre) for energy recovery",
            "Ensure water is always fresh, clean, and accessible — dehydration kills faster than the parasite",
        ],
        severity: "critical",
    },
    {
        icon: <Apple className="w-8 h-8" />,
        title: "Vitamin & Nutritional Support",
        description:
            "Intestinal damage impairs nutrient absorption. Supplement essential vitamins to accelerate healing.",
        details: [
            "Vitamin A (10,000 IU/kg feed): rebuilds damaged intestinal epithelium",
            "Vitamin K3 (Menadione): critical for blood clotting — counteracts haemorrhagic damage",
            "Vitamin D3 + Calcium: supports bone strength weakened during infection",
            "Probiotics (Lactobacillus): repopulate beneficial gut flora destroyed by coccidia and medication",
            "B-complex vitamins: stimulate appetite and energy metabolism",
        ],
        severity: "important",
    },
    {
        icon: <SprayCan className="w-8 h-8" />,
        title: "Deep Sanitation of Housing",
        description:
            "Coccidial oocysts are extremely resilient. Aggressive environmental cleanup is non-negotiable.",
        details: [
            "Remove ALL litter — bag and dispose far from the poultry area",
            "Scrub floors, walls, and feeders with ammonia-based disinfectant (10% solution)",
            "Steam-clean surfaces if possible — heat >60°C kills oocysts",
            "Allow housing to fully dry before replacing with fresh, dry litter (wood shavings preferred)",
            "Clean and disinfect drinkers daily during and after the outbreak window",
        ],
        severity: "important",
    },
    {
        icon: <ShieldCheck className="w-8 h-8" />,
        title: "Long-Term Prevention Protocol",
        description:
            "Prevent recurrence through vaccination, litter management, and controlled exposure.",
        details: [
            "Vaccinate with live oocyst vaccines (e.g., Paracox-8) at day 1–3 of age for future flocks",
            "Use anticoccidial feed additives (Monensin, Salinomycin) as prophylaxis in starter feeds",
            "Maintain litter moisture below 25% — wet litter is a breeding ground for sporulation",
            "Practice a regular rotation of anticoccidial drugs to prevent resistance buildup",
            "Avoid overcrowding — maintain ≥0.1 m² per bird to reduce oocyst concentration",
        ],
        severity: "supportive",
    },
];

const fowlpoxSteps: GuideStep[] = [
    {
        icon: <Eye className="w-8 h-8" />,
        title: "Identify the Form & Isolate",
        description:
            "Fowlpox presents in two forms. Dry (cutaneous) shows wart-like lesions; wet (diphtheritic) causes yellow plaques in the mouth/throat.",
        details: [
            "Dry form: nodular scabs on comb, wattle, eyelids, and unfeathered skin",
            "Wet form: cheesy yellow membranes in mouth, trachea — can cause asphyxiation",
            "Isolate ALL affected birds immediately — the virus spreads via mosquitoes and direct contact",
            "Inspect every bird in the flock for early-stage lesions (small red papules)",
        ],
        severity: "critical",
    },
    {
        icon: <Scissors className="w-8 h-8" />,
        title: "Wound Care & Lesion Treatment",
        description:
            "There is no antiviral cure. Treatment focuses on supportive wound care and preventing secondary infections.",
        details: [
            "Dry form: gently clean scabs with dilute iodine solution (Betadine 1:10). Do NOT forcibly remove scabs",
            "Wet form: carefully remove diphtheritic membranes from the throat with forceps, then swab with iodine-glycerin",
            "Apply antibiotic ointment (Neosporin/Terramycin) to lesions to prevent bacterial superinfection",
            "For eye involvement: flush with sterile saline and apply ophthalmic antibiotic ointment (Terramycin eye ointment)",
        ],
        severity: "critical",
    },
    {
        icon: <Syringe className="w-8 h-8" />,
        title: "Antibiotic Therapy for Secondary Infections",
        description:
            "While antibiotics don't treat the virus itself, secondary bacterial infections are common and must be addressed.",
        details: [
            "Oxytetracycline: 50 mg/kg in drinking water for 5–7 days for respiratory secondaries",
            "Tylosin: 0.5 g/L in drinking water if Mycoplasma co-infection is suspected",
            "Enrofloxacin: 10 mg/kg for severe secondary E. coli infections (vet prescription required)",
            "Monitor for respiratory distress — wet pox can obstruct airways and may need emergency intervention",
        ],
        severity: "important",
    },
    {
        icon: <Apple className="w-8 h-8" />,
        title: "Nutritional & Immune Support",
        description:
            "Boost the immune system to help the bird's own defences fight off the viral infection.",
        details: [
            "Vitamin A (15,000 IU/kg feed): essential for epithelial tissue repair and immune function",
            "Vitamin E + Selenium: powerful antioxidant combo that accelerates immune response",
            "Vitamin C (ascorbic acid): 200–500 mg/L in water — reduces stress and supports healing",
            "High-protein feed (18–20% CP) to support tissue regeneration during recovery",
            "Provide soft, easily swallowed feed for birds with oral lesions — moistened mash works well",
        ],
        severity: "important",
    },
    {
        icon: <Sun className="w-8 h-8" />,
        title: "Mosquito & Vector Control",
        description:
            "Fowlpox is transmitted primarily by mosquitoes. Eliminating vectors is critical to stopping the outbreak.",
        details: [
            "Drain all standing water sources near the poultry house (puddles, clogged gutters, old tyres)",
            "Install fine-mesh mosquito nets (1mm) on all windows and ventilation openings",
            "Use residual insecticide sprays (permethrin-based) inside and around the housing weekly",
            "Deploy mosquito traps during peak activity hours (dusk and dawn)",
            "Maintain tight biosecurity — separate tools, clothing, and equipment between houses",
        ],
        severity: "important",
    },
    {
        icon: <ShieldCheck className="w-8 h-8" />,
        title: "Vaccination & Future Prevention",
        description:
            "Fowlpox is 100% preventable through vaccination. Once the outbreak resolves, vaccinate all future flocks.",
        details: [
            "Wing-web method: live fowlpox vaccine applied to the wing web at 6–10 weeks of age",
            "Check for vaccine take 7–10 days after — a visible swelling/scab at the site confirms immunity",
            "Revaccinate if no take is observed — insufficient response means the bird is unprotected",
            "In endemic areas, vaccinate EVERY batch without exception",
            "Birds that recover develop lifelong immunity — but remain carriers, so quarantine recovered birds from naive ones",
        ],
        severity: "supportive",
    },
];

const bumblefootSteps: GuideStep[] = [
    {
        icon: <Footprints className="w-8 h-8" />,
        title: "Early Detection & Assessment",
        description:
            "Bumblefoot (pododermatitis) progresses in stages. Early detection is critical to avoid invasive treatment.",
        details: [
            "Grade I: mild redness/swelling on the footpad — treat conservatively",
            "Grade II: visible dark scab (kernel) on the pad with swelling — needs soaking and bandaging",
            "Grade III: deep abscess with pus, swelling into joints — requires surgical debridement",
            "Grade IV/V: infection has spread to tendons/bone — prognosis is poor, consult a vet immediately",
            "Check feet regularly during routine health inspections — especially heavy breeds (Orpingtons, Brahmas)",
        ],
        severity: "critical",
    },
    {
        icon: <Droplets className="w-8 h-8" />,
        title: "Soaking & Wound Preparation",
        description:
            "For Grade I-III, begin by softening the infected tissue through warm antiseptic soaks.",
        details: [
            "Soak the affected foot in warm Epsom salt water (1 tbsp per cup) for 15–20 minutes",
            "This softens the scab kernel and draws out infection",
            "After soaking, gently dry the foot with clean gauze",
            "For Grade I: soaking alone + antibiotic ointment + bandage may be sufficient",
            "Repeat soaking 1–2 times daily for mild cases until swelling resolves",
        ],
        severity: "critical",
    },
    {
        icon: <Scissors className="w-8 h-8" />,
        title: "Surgical Debridement (Grade II–III)",
        description:
            "For cases with visible kernel/abscess, careful removal of the infected core is required.",
        details: [
            "Sterilise all instruments (scalpel, tweezers, forceps) with isopropyl alcohol or flame",
            "After soaking, use a sterile scalpel to carefully excise the dark kernel/plug",
            "Remove ALL pus and necrotic tissue — the cavity should be clean and bleeding slightly (healthy tissue)",
            "Flush the wound cavity with dilute Chlorhexidine (0.05%) or Betadine solution",
            "Pack the wound with antibiotic ointment (Mupirocin/Neosporin) and cover with non-stick gauze",
            "CAUTION: If infection has reached the bone/tendon, refer to a vet — do NOT attempt deep surgery",
        ],
        severity: "critical",
    },
    {
        icon: <Pill className="w-8 h-8" />,
        title: "Antibiotic Therapy & Bandaging",
        description:
            "Systemic and topical antibiotics are essential. Proper bandaging promotes healing and prevents reinfection.",
        details: [
            "Topical: apply Mupirocin (Bactroban) or Neosporin ointment to the wound daily",
            "Systemic (severe cases): Amoxicillin/Clavulanate 125 mg/kg orally for 7–14 days",
            "Alternative: Lincomycin + Spectinomycin (Linco-Spectin) in water for resistant Staphylococcus infections",
            "Bandage with non-stick pad → gauze → vet wrap (Coban). Change every 1–2 days",
            "Keep the bird on soft bedding (towels or soft shavings) — no wire floors or rough perches",
        ],
        severity: "important",
    },
    {
        icon: <Thermometer className="w-8 h-8" />,
        title: "Post-Op Monitoring & Recovery",
        description:
            "Recovery takes 2–6 weeks depending on severity. Monitor daily for signs of improvement or deterioration.",
        details: [
            "Check bandages daily for soiling, slippage, or odour (sign of anaerobic infection)",
            "Watch for signs of systemic infection: lethargy, fever, loss of appetite, swelling spreading up the leg",
            "Restrict movement — keep bird in a small, clean recovery pen with low perches",
            "Ensure the bird is eating and drinking normally — offer treats and high-protein feed to encourage appetite",
            "Full healing: wound should close cleanly without scab regrowth within 3–6 weeks",
        ],
        severity: "important",
    },
    {
        icon: <ShieldCheck className="w-8 h-8" />,
        title: "Environmental Prevention",
        description:
            "Bumblefoot is caused by foot injuries + Staphylococcus bacteria. Eliminate the root causes.",
        details: [
            "Sand down or round off all perch edges — sharp or narrow perches cause pressure sores",
            "Perch diameter should be 4–5 cm for standard breeds — too thin = concentrated pressure",
            "Keep perch heights reasonable (≤60 cm) — hard landings on rough ground cause foot injuries",
            "Remove sharp objects (wire, nails, stones) from the run area",
            "Maintain dry litter — chronically wet, ammonia-rich litter softens footpads and breeds bacteria",
            "Provide adequate space to prevent trampling and foot injuries from overcrowding",
        ],
        severity: "supportive",
    },
];

const severityColors: Record<string, { bg: string; border: string; badge: string }> = {
    critical: {
        bg: "bg-red-50/80 dark:bg-red-950/30",
        border: "border-red-200 dark:border-red-800/40",
        badge: "bg-red-100 text-red-700 dark:bg-red-900/50 dark:text-red-300",
    },
    important: {
        bg: "bg-amber-50/80 dark:bg-amber-950/30",
        border: "border-amber-200 dark:border-amber-800/40",
        badge: "bg-amber-100 text-amber-700 dark:bg-amber-900/50 dark:text-amber-300",
    },
    supportive: {
        bg: "bg-emerald-50/80 dark:bg-emerald-950/30",
        border: "border-emerald-200 dark:border-emerald-800/40",
        badge: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/50 dark:text-emerald-300",
    },
};

export default function CureSection() {
    const sectionRef = useRef<HTMLElement>(null);
    const contentRef = useRef<HTMLDivElement>(null);
    const [activeTab, setActiveTab] = useState<DiseaseTab>("coccidiosis");
    // Use the global language context — no per-component translation state
    const { t, tBatch, lang } = useLanguage();

    // Pre-warm translation cache whenever tab or language changes
    useEffect(() => {
        if (lang === "en-IN") return;
        const allSteps = [...coccidiosisSteps, ...fowlpoxSteps, ...bumblefootSteps];
        const allTexts: string[] = [];
        allSteps.forEach((s) => { allTexts.push(s.title, s.description, ...s.details); });
        tBatch(allTexts);
    }, [lang, tBatch]);

    useEffect(() => {
        gsap.registerPlugin(ScrollTrigger);

        if (contentRef.current) {
            gsap.fromTo(
                contentRef.current,
                { opacity: 0, y: 120, scale: 0.95 },
                {
                    opacity: 1,
                    y: 0,
                    scale: 1,
                    duration: 1.5,
                    ease: "power3.out",
                    scrollTrigger: {
                        trigger: contentRef.current,
                        start: "top 85%",
                        toggleActions: "play none none reverse",
                    },
                }
            );
        }
    }, []);

    const activeSteps =
        activeTab === "coccidiosis"
            ? coccidiosisSteps
            : [...fowlpoxSteps, ...bumblefootSteps];

    const subtitleText =
        activeTab === "coccidiosis"
            ? t("Coccidiosis is common but treatable. Follow these expert-recommended steps to restore your flock's health and prevent recurrence.")
            : t("Fowlpox and Bumblefoot require different treatment approaches. Follow these veterinary-level protocols for each condition.");

    return (
        <section
            id="cure-section"
            ref={sectionRef}
            className="relative py-32 overflow-hidden bg-linear-to-b from-red-50 via-white to-orange-50 dark:from-gray-900 dark:via-gray-950 dark:to-gray-900"
        >
            <LiquidEther
                colors={["#f87171", "#fbbf24", "#fb923c", "#facc15"]}
                autoSpeed={0.3}
                autoIntensity={1.8}
            />

            <div
                ref={contentRef}
                className="container mx-auto px-6 relative z-10"
            >
                {/* Header */}
                <div className="text-center mb-12">
                    <div className="w-20 h-20 bg-linear-to-br from-red-500 to-orange-400 rounded-full flex items-center justify-center mx-auto mb-8 shadow-2xl">
                        <HeartPulse className="w-10 h-10 text-white" />
                    </div>
                    <h2 className="text-5xl md:text-6xl font-bold mb-6 text-gray-900 dark:text-white">
                        {t("Recovery")} &{" "}
                        <span className="bg-linear-to-r from-red-500 to-orange-500 bg-clip-text text-transparent">
                            {t("Prevention")}
                        </span>
                    </h2>
                    <p className="text-lg text-gray-700 dark:text-gray-300 max-w-3xl mx-auto">
                        {subtitleText}
                    </p>
                </div>

                {/* Disease Tab Selector — language selector is now in the Navigation bar */}
                <div className="flex justify-center mb-16">
                    <div className="inline-flex gap-3 p-2 bg-white/60 dark:bg-gray-800/60 backdrop-blur-lg rounded-2xl shadow-lg border border-gray-200/50 dark:border-gray-700/50">
                        <button
                            onClick={() => setActiveTab("coccidiosis")}
                            className={`flex items-center gap-2 px-6 py-3 rounded-xl font-semibold text-sm transition-all duration-300 ${activeTab === "coccidiosis"
                                ? "bg-gradient-to-r from-blue-500 to-purple-500 text-white shadow-lg shadow-blue-500/25 scale-105"
                                : "text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700/50"
                                }`}
                        >
                            <Bug className="w-4 h-4" />
                            {t("Coccidiosis")}
                        </button>
                        <button
                            onClick={() => setActiveTab("external-lesion")}
                            className={`flex items-center gap-2 px-6 py-3 rounded-xl font-semibold text-sm transition-all duration-300 ${activeTab === "external-lesion"
                                ? "bg-gradient-to-r from-orange-500 to-red-500 text-white shadow-lg shadow-orange-500/25 scale-105"
                                : "text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700/50"
                                }`}
                        >
                            <Stethoscope className="w-4 h-4" />
                            {t("Bumblefoot & Fowlpox")}
                        </button>
                    </div>
                </div>

                {/* Disease Guide Cards */}
                {activeTab === "external-lesion" && (
                    <div className="text-center mb-10">
                        <h3 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
                            🐔 {t("Fowlpox Treatment Protocol")}
                        </h3>
                        <p className="text-gray-500 dark:text-gray-400 text-sm">
                            {t("Fowlpox is a viral infection — no antiviral cure exists, but supportive care and prevention are highly effective.")}
                        </p>
                    </div>
                )}

                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-7xl mx-auto">
                    {(activeTab === "external-lesion"
                        ? fowlpoxSteps
                        : coccidiosisSteps
                    ).map((step, index) => {
                        const colors = severityColors[step.severity];
                        return (
                            <div
                                key={`${activeTab}-${index}`}
                                className={`p-6 rounded-2xl border ${colors.bg} ${colors.border} backdrop-blur-sm shadow-md hover:shadow-xl hover:scale-[1.02] transition-all duration-300`}
                            >
                                <div className="flex items-start justify-between mb-4">
                                    <div
                                        className={`p-2.5 rounded-xl ${step.severity === "critical"
                                            ? "bg-red-100 text-red-600 dark:bg-red-900/40 dark:text-red-400"
                                            : step.severity === "important"
                                                ? "bg-amber-100 text-amber-600 dark:bg-amber-900/40 dark:text-amber-400"
                                                : "bg-emerald-100 text-emerald-600 dark:bg-emerald-900/40 dark:text-emerald-400"
                                            }`}
                                    >
                                        {step.icon}
                                    </div>
                                    <span
                                        className={`text-xs font-bold uppercase tracking-wider px-2.5 py-1 rounded-full ${colors.badge}`}
                                    >
                                        {step.severity}
                                    </span>
                                </div>
                                <div className="flex items-start justify-between gap-2 mb-2">
                                    <h3 className="text-lg font-bold text-gray-900 dark:text-white">
                                        {t(step.title)}
                                    </h3>
                                    <TTSButton text={t(step.title)} />
                                </div>
                                <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                                    {t(step.description)}
                                </p>
                                <ul className="space-y-2">
                                    {step.details.map((detail, i) => (
                                        <li
                                            key={i}
                                            className="flex items-start gap-2 text-xs text-gray-700 dark:text-gray-300"
                                        >
                                            <span className="mt-1 w-1.5 h-1.5 bg-current rounded-full shrink-0 opacity-50" />
                                            {t(detail)}
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        );
                    })}
                </div>

                {/* Bumblefoot Section (shown when external-lesion tab is active) */}
                {activeTab === "external-lesion" && (
                    <>
                        <div className="text-center mt-20 mb-10">
                            <h3 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
                                🦶 {t("Bumblefoot Treatment Protocol")}
                            </h3>
                            <p className="text-gray-500 dark:text-gray-400 text-sm">
                                {t("Bumblefoot (pododermatitis) is a bacterial foot infection caused by Staphylococcus. Early treatment prevents joint/bone damage.")}
                            </p>
                        </div>

                        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-7xl mx-auto">
                            {bumblefootSteps.map((step, index) => {
                                const colors = severityColors[step.severity];
                                return (
                                    <div
                                        key={`bumblefoot-${index}`}
                                        className={`p-6 rounded-2xl border ${colors.bg} ${colors.border} backdrop-blur-sm shadow-md hover:shadow-xl hover:scale-[1.02] transition-all duration-300`}
                                    >
                                        <div className="flex items-start justify-between mb-4">
                                            <div
                                                className={`p-2.5 rounded-xl ${step.severity === "critical"
                                                    ? "bg-red-100 text-red-600 dark:bg-red-900/40 dark:text-red-400"
                                                    : step.severity === "important"
                                                        ? "bg-amber-100 text-amber-600 dark:bg-amber-900/40 dark:text-amber-400"
                                                        : "bg-emerald-100 text-emerald-600 dark:bg-emerald-900/40 dark:text-emerald-400"
                                                    }`}
                                            >
                                                {step.icon}
                                            </div>
                                            <span
                                                className={`text-xs font-bold uppercase tracking-wider px-2.5 py-1 rounded-full ${colors.badge}`}
                                            >
                                                {step.severity}
                                            </span>
                                        </div>
                                        <div className="flex items-start justify-between gap-2 mb-2">
                                            <h3 className="text-lg font-bold text-gray-900 dark:text-white">
                                                {t(step.title)}
                                            </h3>
                                            <TTSButton text={t(step.title)} />
                                        </div>
                                        <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                                            {t(step.description)}
                                        </p>
                                        <ul className="space-y-2">
                                            {step.details.map((detail, i) => (
                                                <li
                                                    key={i}
                                                    className="flex items-start gap-2 text-xs text-gray-700 dark:text-gray-300"
                                                >
                                                    <span className="mt-1 w-1.5 h-1.5 bg-current rounded-full shrink-0 opacity-50" />
                                                    {t(detail)}
                                                </li>
                                            ))}
                                        </ul>
                                    </div>
                                );
                            })}
                        </div>
                    </>
                )}

                {/* Disclaimer */}
                <div className="mt-16 max-w-3xl mx-auto text-center">
                    <div className="p-5 bg-amber-50/80 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800/30 rounded-2xl">
                        <p className="text-xs text-amber-700 dark:text-amber-300 leading-relaxed">
                            ⚠️ <strong>{t("Veterinary Disclaimer:")} </strong>{t("This guide is for educational purposes. Always consult a qualified poultry veterinarian for proper diagnosis, dosing, and treatment. Dosages may vary based on breed, age, weight, and severity of infection.")}
                        </p>
                    </div>
                </div>

                {/* Back to Diagnosis CTA */}
                <div className="mt-10 text-center">
                    <button
                        onClick={() =>
                            document
                                .getElementById("diagnosis")
                                ?.scrollIntoView({ behavior: "smooth" })
                        }
                        className="bg-gradient-to-r from-red-500 to-orange-500 text-white px-10 py-4 text-lg font-semibold shadow-xl hover:shadow-2xl hover:scale-105 transition-all duration-300 rounded-xl"
                    >
                        🩺 {t("AI Diagnosis Tool")}
                    </button>
                </div>
            </div>
        </section>
    );
}

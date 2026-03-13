"""
RAG Engine for Dynamic Treatment Plan Generation.

Uses sentence-transformers for retrieval and Google Gemini for generation,
with OpenAI as secondary and template-based fallback when APIs are unavailable.
"""

import os
import json
import hashlib
import numpy as np
from typing import List, Dict, Any, Optional
from cachetools import LRUCache

# ─── Globals (initialised lazily) ─────────────────────────────────────────────
_knowledge_base: Optional[List[Dict]] = None
_embeddings: Optional[np.ndarray] = None
_embed_model = None
_gemini_model = None

# LRU cache for generated plans (key: hash of disease + context)
_plan_cache = LRUCache(maxsize=50)

# ─── Knowledge Base ──────────────────────────────────────────────────────────

def _load_knowledge_base() -> List[Dict]:
    """Load veterinary knowledge chunks from JSON file."""
    global _knowledge_base
    if _knowledge_base is not None:
        return _knowledge_base

    kb_path = os.path.join(os.path.dirname(__file__), "knowledge_base.json")
    with open(kb_path, "r", encoding="utf-8") as f:
        data = json.load(f)
    _knowledge_base = data["chunks"]
    print(f"📚 Loaded {len(_knowledge_base)} knowledge chunks")
    return _knowledge_base


def _get_embed_model():
    """Lazily load the sentence-transformers model (22MB, CPU-friendly)."""
    global _embed_model
    if _embed_model is not None:
        return _embed_model

    try:
        from sentence_transformers import SentenceTransformer
        _embed_model = SentenceTransformer("all-MiniLM-L6-v2")
        print("🧠 Loaded sentence-transformers model: all-MiniLM-L6-v2")
    except ImportError:
        print("⚠️ sentence-transformers not installed — using keyword fallback")
        _embed_model = None
    return _embed_model


def _compute_embeddings() -> Optional[np.ndarray]:
    """Compute embeddings for all knowledge chunks (once at startup)."""
    global _embeddings
    if _embeddings is not None:
        return _embeddings

    model = _get_embed_model()
    if model is None:
        return None

    chunks = _load_knowledge_base()
    texts = [f"{c['title']}. {c['content']}" for c in chunks]
    _embeddings = model.encode(texts, normalize_embeddings=True)
    print(f"✅ Computed embeddings for {len(texts)} chunks")
    return _embeddings


def _get_gemini_client():
    """Lazily initialise the Gemini client using the new google-genai SDK."""
    global _gemini_model
    if _gemini_model is not None:
        return _gemini_model

    api_key = os.getenv("GEMINI_API_KEY", "")
    if not api_key:
        print("⚠️ GEMINI_API_KEY not set — will try OpenAI or template fallback")
        return None

    try:
        from google import genai
        client = genai.Client(api_key=api_key)
        _gemini_model = client
        print("🤖 Gemini client initialised (google-genai SDK)")
    except ImportError:
        print("⚠️ google-genai not installed — will try OpenAI or template fallback")
        _gemini_model = None
    except Exception as e:
        print(f"⚠️ Gemini init error: {e}")
        _gemini_model = None
    return _gemini_model


# ─── Retrieval ────────────────────────────────────────────────────────────────

def retrieve(
    disease: str,
    user_context: Dict[str, Any],
    top_k: int = 8,
) -> List[Dict]:
    """
    Retrieve the most relevant knowledge chunks for a disease + context.

    Uses semantic similarity if sentence-transformers is available,
    otherwise falls back to metadata-based keyword filtering.
    """
    chunks = _load_knowledge_base()

    # Filter by disease (include general chunks too)
    disease_lower = disease.lower().strip()
    # Map common names
    disease_map = {
        "coccidiosis": "coccidiosis",
        "fowlpox": "fowlpox",
        "bumblefoot": "bumblefoot",
        "coryza": "coryza",
        "newcastle": "newcastle",
        "mareks": "mareks",
        "marek's": "mareks",
        "avian_influenza": "avian_influenza",
        "bird_flu": "avian_influenza",
        "healthy": "healthy",
    }
    target_disease = disease_map.get(disease_lower, disease_lower)
    filtered = [c for c in chunks if c["disease"] in (target_disease, "general", "healthy")]

    # Filter by severity
    severity = user_context.get("severity", "moderate").lower()
    filtered = [c for c in filtered if severity in c.get("severity_applies", ["moderate"])]

    # Try semantic retrieval
    embeddings = _compute_embeddings()
    model = _get_embed_model()

    if embeddings is not None and model is not None:
        # Build query from context
        symptoms = user_context.get("symptoms", "")
        query = f"{disease} treatment for {severity} case. {symptoms}".strip()
        query_emb = model.encode([query], normalize_embeddings=True)

        # Get indices of filtered chunks in the full list
        all_chunks = _load_knowledge_base()
        filtered_indices = [all_chunks.index(c) for c in filtered]

        # Compute similarities for filtered chunks only
        similarities = []
        for idx, chunk in zip(filtered_indices, filtered):
            sim = float(np.dot(query_emb[0], embeddings[idx]))
            # Boost by priority (lower priority number = higher boost)
            priority_boost = 1.0 + (0.1 * (6 - chunk.get("priority", 3)))
            similarities.append((sim * priority_boost, chunk))

        # Sort by similarity (descending) and take top_k
        similarities.sort(key=lambda x: x[0], reverse=True)
        return [c for _, c in similarities[:top_k]]
    else:
        # Fallback: sort by priority
        filtered.sort(key=lambda c: c.get("priority", 99))
        return filtered[:top_k]


# ─── System Prompt (shared between Gemini and OpenAI) ─────────────────────────

SYSTEM_PROMPT = """You are a warm, professional veterinary AI assistant specialising in poultry diseases.
You are given RETRIEVED KNOWLEDGE from our curated veterinary database
and CONTEXT about the farmer's specific situation.

RULES:
1. ONLY use information from the RETRIEVED KNOWLEDGE. Never invent drug names, dosages, or protocols not in the provided knowledge.
2. Use a calming, reassuring, and professional tone — the farmer may be worried.
3. Start with a brief reassuring opening addressing the farmer directly.
4. Structure the plan into clear sections with exactly these emoji headers. The emoji and the text MUST be on the exact same line (e.g. "🚨 Immediate Actions"):
   🚨 Immediate Actions
   💊 Medication & Treatment
   🥗 Nutrition & Supportive Care
   🏠 Housing & Environment
   🛡️ Prevention & Long-Term Care
   🩺 When to Call a Vet
   📅 Treatment Timeline
5. Adapt the plan to the farmer's context (flock size, bird age, severity).
6. Use simple, actionable language. Assume the reader is a poultry farmer, not a vet.
7. Include specific dosages, durations, and timelines from the knowledge base.
8. Use bullet points for actionable steps — make each step clear and concise.
9. Keep the plan thorough but readable — aim for 500-700 words.
10. If user provided symptoms, acknowledge them specifically and reassure.
11. Do NOT use raw markdown headers (# or ##). Instead use the exact emoji section separators above.
12. Use **bold** for drug names and important terms only sparingly.
13. End on a positive, encouraging note."""


def _build_user_message(
    retrieved_chunks: List[Dict],
    disease: str,
    user_context: Dict[str, Any],
) -> str:
    """Build the user message from retrieved chunks and context."""
    knowledge_text = ""
    for i, chunk in enumerate(retrieved_chunks, 1):
        knowledge_text += f"\nSource {i} — {chunk['title']}:\n{chunk['content']}\n"

    confidence = user_context.get("confidence", "unknown")
    flock_size = user_context.get("flock_size", "unknown")
    bird_age = user_context.get("bird_age", "unknown")
    severity = user_context.get("severity", "moderate")
    symptoms = user_context.get("symptoms", "none provided")
    language = user_context.get("language", "en-US")

    return f"""RETRIEVED KNOWLEDGE:
{knowledge_text}

FARMER'S CONTEXT:
- Disease detected: {disease}
- AI confidence: {confidence}%
- Flock size: {flock_size} birds
- Bird age: {bird_age}
- Observed severity: {severity}
- Symptoms described: {symptoms}

CRITICAL INSTRUCTION: You MUST generate the entire treatment plan in the language corresponding to this language code: '{language}'. For example, if it is 'hi-IN', write in Hindi. If it is 'or-IN', write in Odia. Translate all medical terms accurately into this language.

Generate a personalised, calming, and professional treatment plan based ONLY on the retrieved knowledge above."""


# ─── Generation: Option A — Gemini ────────────────────────────────────────────

def generate_plan_gemini(
    retrieved_chunks: List[Dict],
    disease: str,
    user_context: Dict[str, Any],
) -> Optional[str]:
    """Generate a personalised treatment plan using Google Gemini via google-genai SDK."""
    client = _get_gemini_client()
    if client is None:
        return None

    user_message = _build_user_message(retrieved_chunks, disease, user_context)
    full_prompt = f"{SYSTEM_PROMPT}\n\n{user_message}"

    # Try models in order of preference
    models_to_try = [
        "gemini-2.5-flash",
        "gemini-2.0-flash",
        "gemini-2.0-flash-lite",
    ]

    from google.genai import types

    for model_name in models_to_try:
        try:
            print(f"🔄 Trying Gemini model: {model_name}")
            response = client.models.generate_content(
                model=model_name,
                contents=full_prompt,
                config=types.GenerateContentConfig(
                    temperature=0.3,
                ),
            )
            text = response.text
            if text:
                print(f"✅ Gemini ({model_name}) generated {len(text)} chars")
                return text
        except Exception as e:
            error_str = str(e)
            if "429" in error_str or "quota" in error_str.lower():
                print(f"⚠️ {model_name} quota exhausted, trying next model...")
                continue
            elif "404" in error_str:
                print(f"⚠️ {model_name} not found, trying next model...")
                continue
            else:
                print(f"❌ Gemini ({model_name}) error: {e}")
                continue

    print("❌ All Gemini models failed")
    return None


# ─── Generation: Option B — Template Fallback ────────────────────────────────

def generate_plan_template(
    retrieved_chunks: List[Dict],
    disease: str,
    user_context: Dict[str, Any],
) -> str:
    """Generate a structured treatment plan using templates (no API needed)."""
    severity = user_context.get("severity", "moderate")
    flock_size = user_context.get("flock_size", "unknown")
    bird_age = user_context.get("bird_age", "unknown")
    symptoms = user_context.get("symptoms", "")

    # Group chunks by category
    categories = {
        "immediate_action": [],
        "medication": [],
        "treatment": [],
        "supportive_care": [],
        "nutrition": [],
        "environmental": [],
        "recovery": [],
        "prevention": [],
        "emergency": [],
    }
    for chunk in retrieved_chunks:
        cat = chunk.get("category", "treatment")
        if cat in categories:
            categories[cat].append(chunk)
        else:
            categories["treatment"].append(chunk)

    # Build the plan with a calming tone
    plan_parts = []
    plan_parts.append(f"🩺 Personalised Treatment Plan: {disease.title()}\n")
    plan_parts.append(f"We understand your concern. Here is a step-by-step treatment plan tailored for your flock.\n")
    plan_parts.append(f"Severity: {severity.title()}  •  Flock Size: {flock_size}  •  Bird Age: {bird_age}\n")

    if symptoms:
        plan_parts.append(f"Based on the symptoms you described ({symptoms}), here is what we recommend:\n")

    # Critical actions
    critical = categories["immediate_action"] + [
        c for c in categories["treatment"] if c.get("priority", 99) <= 2
    ]
    if critical:
        plan_parts.append("\n🚨 Immediate Actions\n")
        for chunk in critical:
            plan_parts.append(f"  {chunk['title']}\n")
            sentences = [s.strip() for s in chunk['content'].split('.') if s.strip()]
            for s in sentences:
                plan_parts.append(f"  • {s}.\n")
            plan_parts.append("")

    # Medication
    meds = categories["medication"] + [
        c for c in categories["treatment"] if c.get("priority", 99) > 2
    ]
    if meds:
        plan_parts.append("\n💊 Medication & Treatment\n")
        for chunk in meds:
            plan_parts.append(f"  {chunk['title']}\n")
            sentences = [s.strip() for s in chunk['content'].split('.') if s.strip()]
            for s in sentences:
                plan_parts.append(f"  • {s}.\n")
            plan_parts.append("")

    # Supportive care + nutrition
    supportive = categories["supportive_care"] + categories["nutrition"] + categories["recovery"]
    if supportive:
        plan_parts.append("\n🥗 Nutrition & Supportive Care\n")
        for chunk in supportive:
            plan_parts.append(f"  {chunk['title']}\n")
            sentences = [s.strip() for s in chunk['content'].split('.') if s.strip()]
            for s in sentences:
                plan_parts.append(f"  • {s}.\n")
            plan_parts.append("")

    # Environmental + prevention
    prevention = categories["environmental"] + categories["prevention"]
    if prevention:
        plan_parts.append("\n🛡️ Prevention & Environment\n")
        for chunk in prevention:
            plan_parts.append(f"  {chunk['title']}\n")
            sentences = [s.strip() for s in chunk['content'].split('.') if s.strip()]
            for s in sentences:
                plan_parts.append(f"  • {s}.\n")
            plan_parts.append("")

    # Emergency
    emergency = categories["emergency"]
    if emergency:
        plan_parts.append("\n🩺 When to Call a Vet\n")
        for chunk in emergency:
            sentences = [s.strip() for s in chunk['content'].split(';') if s.strip()]
            for s in sentences:
                plan_parts.append(f"  • {s.strip()}.\n")

    # Timeline
    plan_parts.append("\n📅 Treatment Timeline\n")
    if severity == "severe":
        plan_parts.append("  • Day 1–2: Isolate immediately, begin medication, start rehydration therapy.\n")
        plan_parts.append("  • Day 3–5: Continue medication, monitor closely, supplement vitamins.\n")
        plan_parts.append("  • Week 2: Assess recovery progress, deep clean the housing, adjust feed.\n")
        plan_parts.append("  • Week 3–4: Gradual reintroduction, implement prevention measures.\n")
    elif severity == "mild":
        plan_parts.append("  • Day 1–3: Isolate affected birds, start conservative treatment.\n")
        plan_parts.append("  • Day 4–7: Monitor improvement, supplement vitamins and electrolytes.\n")
        plan_parts.append("  • Week 2: Clean housing thoroughly, begin prevention protocol.\n")
    else:
        plan_parts.append("  • Day 1–2: Isolate affected birds, begin primary medication.\n")
        plan_parts.append("  • Day 3–7: Continue treatment, add nutritional support.\n")
        plan_parts.append("  • Week 2: Assess progress, clean housing, start prevention.\n")
        plan_parts.append("  • Week 3: Monitor entire flock, implement long-term prevention.\n")

    plan_parts.append("\nYour flock's health is our priority. With timely action and proper care, recovery is very achievable. Stay positive! 💚")

    return "\n".join(plan_parts)


# ─── Main Entry Point ────────────────────────────────────────────────────────

def generate_treatment_plan(
    disease: str,
    user_context: Dict[str, Any],
) -> Dict[str, Any]:
    """
    Main entry point: retrieve relevant knowledge and generate a treatment plan.
    Uses Gemini as primary, template as fallback.
    """
    # Check cache first
    cache_key = hashlib.md5(
        json.dumps({"disease": disease, **user_context}, sort_keys=True).encode()
    ).hexdigest()

    if cache_key in _plan_cache:
        cached = _plan_cache[cache_key]
        print(f"✅ Treatment plan cache HIT for {disease}")
        return {**cached, "cached": True}

    # Step 1: Retrieve
    chunks = retrieve(disease, user_context)
    source_ids = [c["id"] for c in chunks]
    print(f"📖 Retrieved {len(chunks)} chunks for {disease}: {source_ids}")

    # Step 2: Generate (Gemini primary → template fallback)
    plan = generate_plan_gemini(chunks, disease, user_context)
    method = "gemini"

    if plan is None:
        print("⚠️ Gemini unavailable — using template fallback")
        plan = generate_plan_template(chunks, disease, user_context)
        method = "template"

    result = {
        "plan": plan,
        "sources": source_ids,
        "method": method,
        "disease": disease,
    }

    # Cache the result
    _plan_cache[cache_key] = result
    print(f"✅ Generated {method} plan for {disease} ({len(plan)} chars)")

    return result


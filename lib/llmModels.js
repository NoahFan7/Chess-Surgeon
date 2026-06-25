/**
 * LLM model configs for playing against different AI models.
 *
 * All models are routed through the OpenAI-compatible chat completions API
 * (Infer To Go by default). Set the URL + key via environment variables.
 */

export const LLM_MODELS = [
  {
    id: "gpt-4o",
    name: "GPT-4o",
    provider: "OpenAI",
    model: "gpt-4o",
    description: "OpenAI's flagship model. Strong reasoning, sometimes too creative.",
  },
  {
    id: "claude-sonnet",
    name: "Claude 3.5 Sonnet",
    provider: "Anthropic",
    model: "claude-3-5-sonnet-20241022",
    description: "Anthropic's top model. Methodical and careful.",
  },
  {
    id: "deepseek-v3",
    name: "DeepSeek V3",
    provider: "DeepSeek",
    model: "deepseek-chat",
    description: "Viral reasoning model. Thinks deeply before moving.",
  },
  {
    id: "gemini-pro",
    name: "Gemini 1.5 Pro",
    provider: "Google",
    model: "gemini-1.5-pro",
    description: "Google's flagship. Fast and surprisingly tactical.",
  },
  {
    id: "llama-70b",
    name: "Llama 3.3 70B",
    provider: "Meta",
    model: "llama-3.3-70b-instruct",
    description: "Top open-source model. Unpredictable but fun.",
  },
];

export const DEFAULT_LLM_MODEL = "gpt-4o";

export function getLLMModel(id) {
  return LLM_MODELS.find((m) => m.id === id) || null;
}

export function getModelName(id) {
  const model = getLLMModel(id);
  return model ? model.name : id;
}

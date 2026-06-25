/**
 * LLM model configs for playing against different AI models.
 *
 * All models are routed through the ai& API (OpenAI-compatible).
 * Set AIAND_API_URL and AIAND_API_KEY via environment variables.
 */

export const LLM_MODELS = [
  {
    id: "glm-5.2",
    name: "GLM-5.2",
    provider: "ZhipuAI",
    model: "zai-org/glm-5.2",
    description: "Strong reasoning and tool-calling. ZhipuAI's flagship model.",
  },
  {
    id: "deepseek-v4-pro",
    name: "DeepSeek V4 Pro",
    provider: "DeepSeek",
    model: "deepseek-ai/deepseek-v4-pro",
    description: "DeepSeek's strongest model. Deep reasoning and analysis.",
  },
  {
    id: "deepseek-v4-flash",
    name: "DeepSeek V4 Flash",
    provider: "DeepSeek",
    model: "deepseek-ai/deepseek-v4-flash",
    description: "Fast and lightweight. Quick moves, sometimes surprising.",
  },
  {
    id: "kimi-k2.7-code",
    name: "Kimi K2.7 Code",
    provider: "Moonshot AI",
    model: "moonshotai/kimi-k2.7-code",
    description: "Moonshot's latest code model with vision and reasoning.",
  },
  {
    id: "kimi-k2.6",
    name: "Kimi K2.6",
    provider: "Moonshot AI",
    model: "moonshotai/kimi-k2.6",
    description: "Moonshot's K2.6 with vision and document understanding.",
  },
  {
    id: "gpt-oss-120b",
    name: "GPT OSS 120B",
    provider: "OpenAI",
    model: "openai/gpt-oss-120b",
    description: "OpenAI's open-source 120B parameter model.",
  },
  {
    id: "qwen3.6-27b",
    name: "Qwen 3.6 27B",
    provider: "Qwen",
    model: "qwen/qwen3.6-27b",
    description: "Alibaba's Qwen model. Free to use.",
  },
  {
    id: "gemma-4-31b",
    name: "Gemma 4 31B",
    provider: "Google",
    model: "google/gemma-4-31b-it",
    description: "Google's open model with vision and video support.",
  },
  {
    id: "glm-5.1",
    name: "GLM-5.1",
    provider: "ZhipuAI",
    model: "zai-org/glm-5.1",
    description: "ZhipuAI's GLM-5.1. Solid reasoning model.",
  },
];

export const DEFAULT_LLM_MODEL = "glm-5.2";

export function getLLMModel(id) {
  return LLM_MODELS.find((m) => m.id === id) || null;
}

export function getModelName(id) {
  const model = getLLMModel(id);
  return model ? model.name : id;
}

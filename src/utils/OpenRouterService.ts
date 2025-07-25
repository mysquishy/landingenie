interface OpenRouterResponse {
  choices: Array<{
    message: {
      content: string;
    };
  }>;
}

export class OpenRouterService {
  private static API_KEY_STORAGE_KEY = 'openrouter_api_key';

  static saveApiKey(apiKey: string): void {
    localStorage.setItem(this.API_KEY_STORAGE_KEY, apiKey);
  }

  static getApiKey(): string | null {
    return localStorage.getItem(this.API_KEY_STORAGE_KEY);
  }

  static async testApiKey(apiKey: string): Promise<boolean> {
    try {
      const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
          'HTTP-Referer': window.location.origin,
        },
        body: JSON.stringify({
          model: 'openai/gpt-3.5-turbo',
          messages: [
            {
              role: 'user',
              content: 'Test message'
            }
          ],
          max_tokens: 10,
          temperature: 0.2
        }),
      });
      
      return response.ok;
    } catch (error) {
      console.error('Error testing OpenRouter API key:', error);
      return false;
    }
  }

  static async analyzeContent(prompt: string, model: string = 'openai/gpt-4'): Promise<any> {
    const apiKey = this.getApiKey();
    if (!apiKey) {
      throw new Error('OpenRouter API key not found');
    }

    try {
      const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
          'HTTP-Referer': window.location.origin,
        },
        body: JSON.stringify({
          model,
          messages: [
            {
              role: 'system',
              content: 'You are an expert at analyzing marketing content and extracting structured data. Always return valid JSON responses.'
            },
            {
              role: 'user',
              content: prompt
            }
          ],
          temperature: 0.2,
          max_tokens: 2000
        }),
      });

      if (!response.ok) {
        throw new Error(`OpenRouter API error: ${response.statusText}`);
      }

      const data: OpenRouterResponse = await response.json();
      
      if (!data.choices || data.choices.length === 0) {
        throw new Error('No response from OpenRouter API');
      }

      return JSON.parse(data.choices[0].message.content);
    } catch (error) {
      console.error('Error calling OpenRouter API:', error);
      throw error;
    }
  }

  static getAvailableModels() {
    return [
      // OpenAI Models
      { id: 'openai/gpt-3.5-turbo', name: 'GPT-3.5 Turbo', description: 'Fastest OpenAI model optimized for chat' },
      { id: 'openai/gpt-3.5-turbo-16k', name: 'GPT-3.5 Turbo 16K', description: 'GPT-3.5 with 16K token context' },
      { id: 'openai/gpt-4', name: 'GPT-4', description: 'Most capable OpenAI model' },
      { id: 'openai/gpt-4-turbo', name: 'GPT-4 Turbo', description: 'Optimized, faster, cost-effective GPT-4' },
      { id: 'openai/gpt-4-32k', name: 'GPT-4 32K', description: 'GPT-4 with 32K token context length' },
      { id: 'openai/gpt-4o', name: 'GPT-4o (Multimodal)', description: 'Supports multiple input modalities' },
      { id: 'openai/gpt-4o-mini', name: 'GPT-4o Mini', description: 'Smaller, faster reasoning model' },
      { id: 'openai/gpt-4-turbo-vision', name: 'GPT-4 Turbo Vision', description: 'Advanced GPT-4 with vision capabilities' },
      
      // Anthropic Models
      { id: 'anthropic/claude-opus-4', name: 'Claude Opus 4', description: 'Top-tier coding model with extended reasoning' },
      { id: 'anthropic/claude-sonnet-4', name: 'Claude Sonnet 4', description: 'Powerful coding and reasoning model' },
      { id: 'anthropic/claude-3.7-sonnet', name: 'Claude Sonnet 3.7', description: 'Balance of intelligence and speed' },
      { id: 'anthropic/claude-3.5-sonnet', name: 'Claude 3.5 Sonnet', description: 'Latest Claude 3.5 model' },
      { id: 'anthropic/claude-3.5-haiku', name: 'Claude Haiku 3.5', description: 'Fast, cost-effective Claude model' },
      { id: 'anthropic/claude-3-opus', name: 'Claude 3 Opus', description: 'Most powerful Claude 3 model' },
      { id: 'anthropic/claude-3-sonnet', name: 'Claude 3 Sonnet', description: 'Balanced Claude 3 performance' },
      { id: 'anthropic/claude-3-haiku', name: 'Claude 3 Haiku', description: 'Fastest Claude 3 model' },
      { id: 'anthropic/claude-2', name: 'Claude 2.0', description: 'Strong reasoning with 100K tokens context' },
      
      // Perplexity Models
      { id: 'perplexity/llama-3.1-sonar-large-128k-online', name: 'Perplexity Sonar Large', description: 'Online search capabilities' },
      { id: 'perplexity/llama-3.1-sonar-small-128k-online', name: 'Perplexity Sonar Small', description: 'Fast with search' },
      { id: 'perplexity/sonar-reasoning', name: 'Sonar Reasoning', description: 'Enhanced reasoning capabilities' },
      { id: 'perplexity/sonar-deep-research', name: 'Sonar Deep Research', description: 'Deep research and analysis' },
      { id: 'perplexity/sonar-pro', name: 'Sonar Pro', description: 'Professional-grade analysis' },
      
      // Google Models
      { id: 'google/gemini-2.5-pro', name: 'Gemini 2.5 Pro', description: 'Latest advanced model with 1M token context' },
      { id: 'google/gemini-2.5-flash', name: 'Gemini 2.5 Flash', description: 'Optimized for faster inference' },
      { id: 'google/gemini-2.0-flash', name: 'Gemini 2.0 Flash', description: 'Fast inference with good performance' },
      { id: 'google/gemini-pro-vision', name: 'Gemini Pro Vision', description: 'Advanced visual understanding' },
      { id: 'google/gemini-pro-1.5', name: 'Gemini Pro 1.5', description: 'Google\'s flagship model' },
      { id: 'google/gemini-pro', name: 'Gemini Pro', description: 'Google\'s core model' },
      { id: 'google/palm-2-chat-bison', name: 'PaLM 2 Chat Bison', description: 'Chat-optimized model' },
      { id: 'google/palm-2-codechat-bison', name: 'PaLM 2 CodeChat Bison', description: 'Specialized for coding tasks' },
      
      // Meta Models
      { id: 'meta-llama/llama-3.1-405b-instruct', name: 'Llama 3.1 405B', description: 'Largest Llama model' },
      { id: 'meta-llama/llama-3.1-70b-instruct', name: 'Llama 3.1 70B', description: 'High performance open model' },
      { id: 'meta-llama/llama-3.1-8b-instruct', name: 'Llama 3.1 8B', description: 'Fast and efficient' },
      
      // Mistral Models
      { id: 'mistralai/mistral-large', name: 'Mistral Large', description: 'Mistral\'s most capable model' },
      { id: 'mistralai/mistral-medium', name: 'Mistral Medium', description: 'Balanced performance' },
      { id: 'mistralai/mixtral-8x7b-instruct', name: 'Mixtral 8x7B', description: 'Mixture of experts model' },
      
      // Cohere Models
      { id: 'cohere/command-r-plus', name: 'Command R+', description: 'Cohere\'s flagship model' },
      { id: 'cohere/command-r', name: 'Command R', description: 'Optimized for RAG' },
      
      // Other Popular Models
      { id: 'qwen/qwen-2-72b-instruct', name: 'Qwen 2 72B', description: 'Alibaba\'s powerful model' },
      { id: 'microsoft/wizardlm-2-8x22b', name: 'WizardLM 2 8x22B', description: 'Microsoft\'s mixture model' },
      { id: 'nous-research/nous-hermes-2-mixtral-8x7b-dpo', name: 'Nous Hermes 2', description: 'Fine-tuned for following instructions' }
    ];
  }
}
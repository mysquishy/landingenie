interface PerplexityResponse {
  choices: Array<{
    message: {
      content: string;
    };
  }>;
}

export class PerplexityService {
  private static API_KEY_STORAGE_KEY = 'perplexity_api_key';

  static saveApiKey(apiKey: string): void {
    localStorage.setItem(this.API_KEY_STORAGE_KEY, apiKey);
  }

  static getApiKey(): string | null {
    return localStorage.getItem(this.API_KEY_STORAGE_KEY);
  }

  static async testApiKey(apiKey: string): Promise<boolean> {
    try {
      const response = await fetch('https://api.perplexity.ai/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'llama-3.1-sonar-small-128k-online',
          messages: [
            {
              role: 'system',
              content: 'Be precise and concise.'
            },
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
      console.error('Error testing Perplexity API key:', error);
      return false;
    }
  }

  static async analyzeContent(prompt: string): Promise<any> {
    const apiKey = this.getApiKey();
    if (!apiKey) {
      throw new Error('Perplexity API key not found');
    }

    try {
      const response = await fetch('https://api.perplexity.ai/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'llama-3.1-sonar-large-128k-online',
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
          top_p: 0.9,
          max_tokens: 2000,
          return_images: false,
          return_related_questions: false,
          frequency_penalty: 1,
          presence_penalty: 0
        }),
      });

      if (!response.ok) {
        throw new Error(`Perplexity API error: ${response.statusText}`);
      }

      const data: PerplexityResponse = await response.json();
      
      if (!data.choices || data.choices.length === 0) {
        throw new Error('No response from Perplexity API');
      }

      return JSON.parse(data.choices[0].message.content);
    } catch (error) {
      console.error('Error calling Perplexity API:', error);
      throw error;
    }
  }
}
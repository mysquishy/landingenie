interface ApifyResponse {
  success: boolean;
  data?: any;
  error?: string;
}

interface ApifyRunResponse {
  data: {
    id: string;
    defaultDatasetId: string;
    status: string;
  };
}

export class ApifyService {
  private static API_TOKEN_STORAGE_KEY = 'apify_api_token';
  private static BASE_URL = 'https://api.apify.com/v2';

  static saveApiToken(token: string): void {
    localStorage.setItem(this.API_TOKEN_STORAGE_KEY, token);
  }

  static getApiToken(): string | null {
    return localStorage.getItem(this.API_TOKEN_STORAGE_KEY);
  }

  static async testApiToken(token: string): Promise<boolean> {
    try {
      const response = await fetch(`${this.BASE_URL}/users/me?token=${token}`);
      return response.ok;
    } catch (error) {
      console.error('Error testing Apify token:', error);
      return false;
    }
  }

  static async scrapeWebsite(url: string): Promise<ApifyResponse> {
    const token = this.getApiToken();
    if (!token) {
      return { success: false, error: 'Apify token not found' };
    }

    try {
      // Start the Web Scraper actor
      const runResponse = await fetch(
        `${this.BASE_URL}/acts/apify~web-scraper/runs?token=${token}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            startUrls: [{ url }],
            linkSelector: '',
            pageFunction: `
              async function pageFunction(context) {
                const { page } = context;
                
                await page.waitForTimeout(3000);
                
                return {
                  url: page.url(),
                  title: await page.title(),
                  headlines: await page.$$eval('h1, h2, .headline, [class*="hero"], [class*="title"]', 
                    els => els.map(el => el.textContent?.trim()).filter(Boolean).slice(0, 10)
                  ),
                  testimonials: await page.$$eval('.testimonial, [class*="review"], [class*="feedback"], [class*="quote"]', 
                    els => els.map(el => el.textContent?.trim()).filter(Boolean).slice(0, 10)
                  ),
                  pricing: await page.$$eval('.price, [class*="cost"], [class*="money"], [class*="dollar"]', 
                    els => els.map(el => el.textContent?.trim()).filter(Boolean).slice(0, 5)
                  ),
                  benefits: await page.$$eval('.benefit, [class*="feature"], li, [class*="advantage"]', 
                    els => els.map(el => el.textContent?.trim()).filter(Boolean).slice(0, 15)
                  ),
                  ctas: await page.$$eval('button, .btn, [class*="cta"], [class*="button"], input[type="submit"]', 
                    els => els.map(el => el.textContent?.trim() || el.value).filter(Boolean).slice(0, 8)
                  ),
                  guarantees: await page.$$eval('[class*="guarantee"], [class*="refund"], [class*="risk"]', 
                    els => els.map(el => el.textContent?.trim()).filter(Boolean).slice(0, 5)
                  ),
                  socialProof: await page.$$eval('[class*="social"], [class*="proof"], [class*="rating"], [class*="star"]', 
                    els => els.map(el => el.textContent?.trim()).filter(Boolean).slice(0, 5)
                  )
                };
              }
            `,
            maxRequestRetries: 2,
            maxPagesPerCrawl: 1,
            maxRequestsPerCrawl: 1
          })
        }
      );

      if (!runResponse.ok) {
        throw new Error(`Failed to start Apify scraper: ${runResponse.status}`);
      }

      const runData: ApifyRunResponse = await runResponse.json();
      const result = await this.pollForCompletion(runData.data.id, runData.data.defaultDatasetId, token);

      return {
        success: true,
        data: result
      };
    } catch (error) {
      console.error('Error during Apify scraping:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to connect to Apify'
      };
    }
  }

  private static async pollForCompletion(runId: string, datasetId: string, token: string, maxAttempts = 20): Promise<any> {
    for (let i = 0; i < maxAttempts; i++) {
      const statusResponse = await fetch(`${this.BASE_URL}/actor-runs/${runId}?token=${token}`);
      const statusData = await statusResponse.json();
      const status = statusData.data.status;

      if (status === 'SUCCEEDED') {
        const datasetResponse = await fetch(`${this.BASE_URL}/datasets/${datasetId}/items?token=${token}`);
        const results = await datasetResponse.json();
        return results[0] || {};
      }

      if (status === 'FAILED') {
        throw new Error('Apify scraping failed');
      }

      await new Promise(resolve => setTimeout(resolve, 3000));
    }

    throw new Error('Apify scraping timeout');
  }
}
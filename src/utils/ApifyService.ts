
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
      // Enhanced Web Scraper actor configuration for affiliate/sales pages
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
                
                await page.waitForTimeout(5000);
                
                // Enhanced extraction for sales/affiliate pages
                return {
                  url: page.url(),
                  title: await page.title(),
                  
                  // Product name extraction
                  productName: await page.evaluate(() => {
                    const selectors = [
                      'h1', '.product-title', '.product-name', '[class*="product"]',
                      '.title', '[class*="title"]', '[class*="hero"]'
                    ];
                    for (const selector of selectors) {
                      const el = document.querySelector(selector);
                      if (el && el.textContent.trim().length > 3) {
                        return el.textContent.trim();
                      }
                    }
                    return '';
                  }),
                  
                  // Headlines and main benefits
                  headlines: await page.$$eval('h1, h2, h3, .headline, [class*="hero"], [class*="title"], [class*="benefit"], .main-title', 
                    els => els.map(el => el.textContent?.trim()).filter(Boolean).slice(0, 15)
                  ),
                  
                  // Enhanced testimonials extraction
                  testimonials: await page.evaluate(() => {
                    const testimonialSelectors = [
                      '.testimonial', '[class*="review"]', '[class*="feedback"]', 
                      '[class*="quote"]', '[class*="testimonial"]', '.customer-review',
                      '[class*="story"]', '.success-story', '[class*="experience"]'
                    ];
                    const testimonials = [];
                    
                    for (const selector of testimonialSelectors) {
                      const elements = document.querySelectorAll(selector);
                      elements.forEach(el => {
                        const text = el.textContent?.trim();
                        if (text && text.length > 30 && text.length < 500) {
                          testimonials.push(text);
                        }
                      });
                    }
                    
                    // Also look for quoted text
                    const quotes = document.querySelectorAll('blockquote, .quote');
                    quotes.forEach(el => {
                      const text = el.textContent?.trim();
                      if (text && text.length > 30 && text.length < 300) {
                        testimonials.push(text);
                      }
                    });
                    
                    return testimonials.slice(0, 10);
                  }),
                  
                  // Enhanced pricing extraction
                  pricing: await page.evaluate(() => {
                    const priceSelectors = [
                      '.price', '[class*="cost"]', '[class*="money"]', '[class*="dollar"]',
                      '[class*="price"]', '.pricing', '[class*="amount"]', '.total',
                      '[data-price]', '[class*="payment"]'
                    ];
                    const prices = [];
                    
                    for (const selector of priceSelectors) {
                      const elements = document.querySelectorAll(selector);
                      elements.forEach(el => {
                        const text = el.textContent?.trim();
                        if (text && (text.includes('$') || text.includes('price') || /\d+/.test(text))) {
                          prices.push(text);
                        }
                      });
                    }
                    
                    return [...new Set(prices)].slice(0, 8);
                  }),
                  
                  // Enhanced benefits extraction
                  benefits: await page.evaluate(() => {
                    const benefitSelectors = [
                      '.benefit', '[class*="feature"]', 'li', '[class*="advantage"]',
                      '[class*="benefit"]', '.feature-list li', '.benefits li',
                      '[class*="result"]', '[class*="outcome"]'
                    ];
                    const benefits = [];
                    
                    for (const selector of benefitSelectors) {
                      const elements = document.querySelectorAll(selector);
                      elements.forEach(el => {
                        const text = el.textContent?.trim();
                        if (text && text.length > 10 && text.length < 200 &&
                            !text.toLowerCase().includes('click') &&
                            !text.toLowerCase().includes('order')) {
                          benefits.push(text);
                        }
                      });
                    }
                    
                    return [...new Set(benefits)].slice(0, 20);
                  }),
                  
                  // Enhanced CTA extraction
                  ctas: await page.evaluate(() => {
                    const ctaSelectors = [
                      'button', '.btn', '[class*="cta"]', '[class*="button"]', 
                      'input[type="submit"]', '.order-button', '[class*="buy"]',
                      '[class*="purchase"]', '[class*="add-to-cart"]'
                    ];
                    const ctas = [];
                    
                    for (const selector of ctaSelectors) {
                      const elements = document.querySelectorAll(selector);
                      elements.forEach(el => {
                        const text = el.textContent?.trim() || el.value || el.getAttribute('alt');
                        if (text && text.length > 2 && text.length < 100) {
                          ctas.push(text);
                        }
                      });
                    }
                    
                    return [...new Set(ctas)].slice(0, 10);
                  }),
                  
                  // Enhanced guarantees extraction
                  guarantees: await page.evaluate(() => {
                    const guaranteeSelectors = [
                      '[class*="guarantee"]', '[class*="refund"]', '[class*="risk"]',
                      '[class*="money-back"]', '.guarantee', '[class*="satisfaction"]'
                    ];
                    const guarantees = [];
                    
                    for (const selector of guaranteeSelectors) {
                      const elements = document.querySelectorAll(selector);
                      elements.forEach(el => {
                        const text = el.textContent?.trim();
                        if (text && text.length > 10 && text.length < 200) {
                          guarantees.push(text);
                        }
                      });
                    }
                    
                    // Also search for guarantee text in all text content
                    const bodyText = document.body.textContent || '';
                    const guaranteeMatches = bodyText.match(/\d+\s*day[s]?\s*(?:money.{0,20}back|guarantee|refund)/gi);
                    if (guaranteeMatches) {
                      guarantees.push(...guaranteeMatches.slice(0, 3));
                    }
                    
                    return [...new Set(guarantees)].slice(0, 8);
                  }),
                  
                  // Enhanced social proof extraction
                  socialProof: await page.evaluate(() => {
                    const socialSelectors = [
                      '[class*="social"]', '[class*="proof"]', '[class*="rating"]', 
                      '[class*="star"]', '[class*="review-count"]', '[class*="customer-count"]',
                      '[class*="satisfied"]', '[class*="success"]'
                    ];
                    const socialProof = [];
                    
                    for (const selector of socialSelectors) {
                      const elements = document.querySelectorAll(selector);
                      elements.forEach(el => {
                        const text = el.textContent?.trim();
                        if (text && text.length > 3 && text.length < 100) {
                          socialProof.push(text);
                        }
                      });
                    }
                    
                    // Look for numbers in text that indicate social proof
                    const bodyText = document.body.textContent || '';
                    const numberMatches = bodyText.match(/\d+(?:,\d{3})*\s*(?:customers|users|people|satisfied)/gi);
                    if (numberMatches) {
                      socialProof.push(...numberMatches.slice(0, 5));
                    }
                    
                    return [...new Set(socialProof)].slice(0, 10);
                  }),
                  
                  // Full text content for fallback analysis
                  fullText: await page.evaluate(() => {
                    return document.body.textContent?.substring(0, 10000) || '';
                  }),
                  
                  // Meta description
                  metaDescription: await page.evaluate(() => {
                    const metaDesc = document.querySelector('meta[name="description"]');
                    return metaDesc ? metaDesc.getAttribute('content') : '';
                  })
                };
              }
            `,
            maxRequestRetries: 3,
            maxPagesPerCrawl: 1,
            maxRequestsPerCrawl: 1,
            maxConcurrency: 1
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

  private static async pollForCompletion(runId: string, datasetId: string, token: string, maxAttempts = 25): Promise<any> {
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

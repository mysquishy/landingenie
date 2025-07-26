import FirecrawlApp from '@mendable/firecrawl-js';

interface ErrorResponse {
  success: false;
  error: string;
}

interface ScrapeResponse {
  success: true;
  data: {
    markdown: string;
    html: string;
    metadata: {
      title: string;
      description: string;
      keywords?: string;
    };
  };
}

type FirecrawlResponse = ScrapeResponse | ErrorResponse;

export class FirecrawlService {
  private static API_KEY_STORAGE_KEY = 'firecrawl_api_key';
  private static firecrawlApp: FirecrawlApp | null = null;

  static saveApiKey(apiKey: string): void {
    localStorage.setItem(this.API_KEY_STORAGE_KEY, apiKey);
    this.firecrawlApp = new FirecrawlApp({ apiKey });
  }

  static getApiKey(): string | null {
    return localStorage.getItem(this.API_KEY_STORAGE_KEY);
  }

  static async testApiKey(apiKey: string): Promise<boolean> {
    try {
      this.firecrawlApp = new FirecrawlApp({ apiKey });
      const testResponse = await this.firecrawlApp.scrapeUrl('https://example.com');
      return testResponse.success;
    } catch (error) {
      console.error('Error testing API key:', error);
      return false;
    }
  }

  static async scrapeWebsite(url: string): Promise<{ success: boolean; error?: string; data?: any }> {
    const apiKey = this.getApiKey();
    if (!apiKey) {
      return { success: false, error: 'API key not found' };
    }

    try {
      if (!this.firecrawlApp) {
        this.firecrawlApp = new FirecrawlApp({ apiKey });
      }

      // Check if this is an affiliate/sales page for enhanced extraction
      const isAffiliatePage = url.includes('clickbank') || url.includes('hop') || 
                              url.includes('affiliate') || url.includes('cbpage');

      let scrapeResponse: FirecrawlResponse;

      if (isAffiliatePage) {
        // Enhanced configuration for affiliate/sales pages
        scrapeResponse = await this.firecrawlApp.scrapeUrl(url, {
          formats: ['markdown', 'html'],
          waitFor: 8000, // Wait longer for redirects and JS loading
          timeout: 20000,
          onlyMainContent: true,
          includeTags: ['title', 'meta', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'p', 'div', 'span', 'button', 'a', 'ul', 'li', 'section', 'article', 'main', 'blockquote', 'strong', 'em', 'b', 'i', 'form', 'input'],
          excludeTags: ['script', 'style', 'nav', 'footer', 'header', 'aside', 'noscript', 'iframe']
        }) as FirecrawlResponse;
      } else {
        // Standard configuration for regular pages
        scrapeResponse = await this.firecrawlApp.scrapeUrl(url, {
          formats: ['markdown', 'html'],
          includeTags: ['title', 'meta', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'p', 'div', 'span', 'button', 'a', 'ul', 'li', 'section', 'article', 'main', 'blockquote', 'strong', 'em', 'b', 'i'],
          excludeTags: ['script', 'style', 'nav', 'footer', 'header', 'aside', 'noscript', 'iframe'],
          waitFor: 3000,
          timeout: 15000,
          onlyMainContent: true
        }) as FirecrawlResponse;
      }

      if (!scrapeResponse.success) {
        return { 
          success: false, 
          error: (scrapeResponse as ErrorResponse).error || 'Failed to scrape website' 
        };
      }

      // Validate extraction quality for affiliate pages
      if (isAffiliatePage && scrapeResponse.data) {
        const extractedData = (scrapeResponse.data as any).extract;
        const hasProductName = extractedData?.productName && 
                              extractedData.productName !== 'Unknown' && 
                              extractedData.productName.length > 3;
        const hasContent = extractedData?.benefits?.length > 0 || 
                          extractedData?.testimonials?.length > 0;
        
        if (!hasProductName && !hasContent) {
          console.warn('Firecrawl extraction quality insufficient for affiliate page');
          // Still return the data - let the content analyzer handle it
        }
      }

      return { 
        success: true,
        data: scrapeResponse.data
      };
    } catch (error) {
      console.error('Error during scraping:', error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Failed to connect to Firecrawl API' 
      };
    }
  }
}
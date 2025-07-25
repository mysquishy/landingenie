import { FirecrawlService } from './FirecrawlService';
import { ApifyService } from './ApifyService';

interface ScrapingResult {
  success: boolean;
  data?: any;
  error?: string;
  method: string;
  qualityScore?: number;
  processingTime?: number;
  cost?: number;
}

interface URLAnalysis {
  domain: string;
  isComplex: boolean;
  recommendedService: 'firecrawl' | 'apify';
  reasoning: string;
}

export class IntelligentScraper {
  static analyzeURL(url: string): URLAnalysis {
    const domain = new URL(url).hostname;
    
    const complexPlatforms = [
      'shopify.com', 'clickfunnels.com', 'leadpages.net',
      'squarespace.com', 'wix.com', 'webflow.io',
      'samcart.com', 'thrivecart.com', 'gumroad.com'
    ];
    
    const isComplex = complexPlatforms.some(platform => domain.includes(platform));
    
    return {
      domain,
      isComplex,
      recommendedService: isComplex ? 'apify' : 'firecrawl',
      reasoning: isComplex 
        ? 'Complex platform detected, needs full browser rendering' 
        : 'Standard landing page, content extraction sufficient'
    };
  }

  static async scrapeURL(url: string, preferredService: 'auto' | 'firecrawl' | 'apify' = 'auto'): Promise<ScrapingResult> {
    const startTime = Date.now();
    const analysis = this.analyzeURL(url);
    
    let service: 'firecrawl' | 'apify';
    
    if (preferredService === 'auto') {
      service = analysis.recommendedService;
    } else {
      service = preferredService;
    }

    console.log(`Using ${service} for ${url} (${analysis.reasoning})`);

    try {
      let result: ScrapingResult;

      // Try primary service
      if (service === 'firecrawl') {
        const firecrawlResult = await FirecrawlService.scrapeWebsite(url);
        result = {
          success: firecrawlResult.success,
          data: firecrawlResult.data,
          error: firecrawlResult.error,
          method: 'firecrawl',
          cost: 0.01
        };
      } else {
        const apifyResult = await ApifyService.scrapeWebsite(url);
        result = {
          success: apifyResult.success,
          data: apifyResult.data,
          error: apifyResult.error,
          method: 'apify',
          cost: 0.05
        };
      }

      // Try fallback if primary fails
      if (!result.success) {
        console.log(`${service} failed, trying fallback...`);
        
        if (service === 'firecrawl') {
          const apifyResult = await ApifyService.scrapeWebsite(url);
          if (apifyResult.success) {
            result = {
              success: true,
              data: apifyResult.data,
              method: 'apify-fallback',
              cost: 0.05
            };
          }
        } else {
          const firecrawlResult = await FirecrawlService.scrapeWebsite(url);
          if (firecrawlResult.success) {
            result = {
              success: true,
              data: firecrawlResult.data,
              method: 'firecrawl-fallback',
              cost: 0.01
            };
          }
        }
      }

      // Calculate quality score and processing time
      if (result.success && result.data) {
        result.qualityScore = this.calculateQualityScore(result.data);
        result.processingTime = Date.now() - startTime;
      }

      return result;
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Scraping failed',
        method: 'failed',
        processingTime: Date.now() - startTime
      };
    }
  }

  private static calculateQualityScore(data: any): number {
    if (!data) return 0;

    // For Firecrawl data structure
    if (data.markdown || data.metadata) {
      const hasTitle = !!(data.metadata?.title || data.title);
      const hasContent = !!(data.markdown && data.markdown.length > 100);
      const hasStructure = !!(data.html && data.html.includes('<h'));
      
      return (
        (hasTitle ? 0.3 : 0) +
        (hasContent ? 0.4 : 0) +
        (hasStructure ? 0.3 : 0)
      );
    }

    // For Apify data structure
    const headlines = data.headlines || [];
    const testimonials = data.testimonials || [];
    const benefits = data.benefits || [];
    const ctas = data.ctas || [];
    const pricing = data.pricing || [];

    return (
      (headlines.length > 0 ? 0.25 : 0) +
      (testimonials.length > 0 ? 0.2 : 0) +
      (benefits.length > 2 ? 0.25 : 0) +
      (ctas.length > 0 ? 0.15 : 0) +
      (pricing.length > 0 ? 0.15 : 0)
    );
  }

  static validateDataQuality(data: any) {
    const score = this.calculateQualityScore(data);
    
    return {
      score,
      isGood: score > 0.6,
      isComplete: score > 0.8,
      missing: {
        headlines: !data.headlines || data.headlines.length === 0,
        testimonials: !data.testimonials || data.testimonials.length === 0,
        benefits: !data.benefits || data.benefits.length < 3,
        ctas: !data.ctas || data.ctas.length === 0,
        pricing: !data.pricing || data.pricing.length === 0
      }
    };
  }
}
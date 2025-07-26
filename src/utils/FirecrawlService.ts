import FirecrawlApp from '@mendable/firecrawl-js';

// ==================== INTERFACES ====================

interface ScrapingConfig {
  timeout: number;
  waitFor: number;
  maxRetries: number;
  enableCache: boolean;
  affiliateTimeout: number;
  affiliateWaitFor: number;
}

interface UrlValidationResult {
  isValid: boolean;
  error?: string;
  suggestions?: string[];
}

interface ErrorResponse {
  success: false;
  error: string;
}

interface ScrapeResponse {
  success: true;
  data: {
    markdown?: string;
    html?: string;
    json?: ExtractedMarketingData;
    metadata: {
      title: string;
      description: string;
      keywords?: string;
      sourceURL?: string;
    };
  };
}

interface ExtractedMarketingData {
  productName: string;
  headlines: string[];
  testimonials: string[];
  pricing: string[];
  benefits: string[];
  ctas: string[];
  guarantees: string[];
  timeframes: string[];
  socialProof: string[];
  category?: string;
  targetAudience?: string;
  mainBenefit?: string;
}

interface ContentAnalysisResult {
  extractedData: ExtractedMarketingData;
  qualityScore: number;
  completenessScore: number;
  missingFields: string[];
  confidence: 'high' | 'medium' | 'low';
  extractionMethod: 'llm' | 'parsing' | 'hybrid';
}

interface ScrapingResult {
  success: boolean;
  error?: string;
  data?: {
    raw: ScrapeResponse['data'];
    analyzed: ContentAnalysisResult;
    metadata: {
      processingTime: number;
      finalURL: string;
      isAffiliatePage: boolean;
      extractionMethod: string;
    };
  };
}

type FirecrawlResponse = ScrapeResponse | ErrorResponse;

// ==================== MAIN SERVICE CLASS ====================

export class FirecrawlService {
  private static API_KEY_STORAGE_KEY = 'firecrawl_api_key';
  private static firecrawlApp: FirecrawlApp | null = null;
  
  // ==================== CACHING & CONFIGURATION ====================
  
  private static cache = new Map<string, ScrapingResult>();
  private static readonly CACHE_TTL = 1000 * 60 * 30; // 30 minutes
  private static cacheTimestamps = new Map<string, number>();
  
  private static config: ScrapingConfig = {
    timeout: 15000,
    waitFor: 3000,
    maxRetries: 3,
    enableCache: true,
    affiliateTimeout: 30000,
    affiliateWaitFor: 10000
  };
  
  // Enhanced pattern recognition
  private static readonly ENHANCED_PATTERNS = {
    pricing: [
      /(?:only|just|starting at|from)\s*\$(\d+(?:\.\d{2})?)/i,
      /(\d+(?:\.\d{2})?)\s*(?:dollars?|usd|€|£)/i,
      /save\s+(\d+%|\$\d+)/i,
      /(?:price|cost|fee|charge).*?\$?(\d+(?:\.\d{2})?)/i,
      /\$(\d+(?:\.\d{2})?)(?:\s*(?:per|\/|month|year|day))?/i
    ],
    urgency: [
      /limited time/i,
      /act now/i,
      /expires (?:soon|today|tomorrow)/i,
      /only \d+ left/i,
      /hurry(?:\s*up)?/i,
      /don't miss out/i,
      /while supplies last/i
    ],
    testimonials: [
      /"([^"]{20,200})"/,
      /testimonial/i,
      /review/i,
      /customer says?/i,
      /(?:★|⭐|stars?)\s*\d/i
    ],
    guarantees: [
      /(?:\d+[-\s]*(?:day|week|month|year)?\s*)?(?:money[-\s]*back|satisfaction|guarantee)/i,
      /risk[-\s]*free/i,
      /(?:no questions asked|full refund)/i
    ]
  };

  // ==================== API KEY MANAGEMENT ====================

  static saveApiKey(apiKey: string): void {
    console.log('Saving Firecrawl API key:', apiKey.substring(0, 10) + '...');
    localStorage.setItem(this.API_KEY_STORAGE_KEY, apiKey);
    this.firecrawlApp = new FirecrawlApp({ apiKey });
    console.log('Firecrawl API key saved and initialized');
  }

  static getApiKey(): string | null {
    return localStorage.getItem(this.API_KEY_STORAGE_KEY);
  }

  static async testApiKey(apiKey: string): Promise<boolean> {
    try {
      const testApp = new FirecrawlApp({ apiKey });
      const testResponse = await testApp.scrapeUrl('https://example.com', {
        formats: ['markdown'],
        timeout: 10000
      });
      return testResponse.success;
    } catch (error) {
      console.error('Error testing API key:', error);
      return false;
    }
  }

  static removeApiKey(): void {
    localStorage.removeItem(this.API_KEY_STORAGE_KEY);
    this.firecrawlApp = null;
  }
  
  // ==================== CONFIGURATION MANAGEMENT ====================
  
  static updateConfig(newConfig: Partial<ScrapingConfig>): void {
    this.config = { ...this.config, ...newConfig };
    console.log('Updated scraping configuration:', this.config);
  }
  
  static getConfig(): ScrapingConfig {
    return { ...this.config };
  }
  
  // ==================== ENHANCED URL VALIDATION ====================
  
  static async validateUrl(url: string): Promise<UrlValidationResult> {
    try {
      const urlObj = new URL(url);
      
      // Check for common issues
      const suggestions: string[] = [];
      if (!urlObj.protocol.startsWith('http')) {
        suggestions.push('URL should start with http:// or https://');
      }
      
      // Test actual connectivity with timeout
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000);
      
      try {
        const response = await fetch(url, { 
          method: 'HEAD', 
          signal: controller.signal,
          mode: 'no-cors' // Changed from 'cors' to avoid CORS issues
        });
        clearTimeout(timeoutId);
        
        return { isValid: true, suggestions };
      } catch (fetchError) {
        clearTimeout(timeoutId);
        
        // If HEAD fails, the URL might still be scrapable by Firecrawl
        return { 
          isValid: true, // Allow Firecrawl to try
          suggestions: ['URL might have CORS restrictions but should be scrapable'],
          error: `Connectivity test failed: ${fetchError instanceof Error ? fetchError.message : 'Unknown error'}`
        };
      }
    } catch (error) {
      return { 
        isValid: false, 
        error: error instanceof Error ? error.message : 'Unknown error',
        suggestions: ['Check URL format', 'Verify site is accessible', 'Ensure URL starts with http:// or https://']
      };
    }
  }
  
  // ==================== CACHING METHODS ====================
  
  private static getCacheKey(url: string): string {
    return url.toLowerCase().trim();
  }
  
  private static isCacheValid(key: string): boolean {
    if (!this.config.enableCache) return false;
    
    const timestamp = this.cacheTimestamps.get(key);
    if (!timestamp) return false;
    
    return Date.now() - timestamp < this.CACHE_TTL;
  }
  
  private static getCachedResult(url: string): ScrapingResult | null {
    const key = this.getCacheKey(url);
    if (this.isCacheValid(key)) {
      const cached = this.cache.get(key);
      if (cached) {
        console.log('Returning cached result for:', url);
        return cached;
      }
    }
    return null;
  }
  
  private static setCachedResult(url: string, result: ScrapingResult): void {
    if (!this.config.enableCache || !result.success) return;
    
    const key = this.getCacheKey(url);
    this.cache.set(key, result);
    this.cacheTimestamps.set(key, Date.now());
    
    // Clean old cache entries (simple LRU)
    if (this.cache.size > 100) {
      const oldestKey = this.cache.keys().next().value;
      this.cache.delete(oldestKey);
      this.cacheTimestamps.delete(oldestKey);
    }
  }
  
  static clearCache(): void {
    this.cache.clear();
    this.cacheTimestamps.clear();
    console.log('Cache cleared');
  }

  // ==================== URL ANALYSIS ====================

  private static analyzeURL(url: string): {
    isAffiliatePage: boolean;
    platform: string;
    confidence: number;
    reasoning: string;
  } {
    const urlLower = url.toLowerCase();
    
    const affiliateIndicators = [
      'clickbank', 'hop.clickbank', 'cbpage', 'affiliate', 'ref=', 'aff=',
      'partner=', 'campaign=', 'leadpages', 'clickfunnels', 'shopify'
    ];
    
    const isAffiliate = affiliateIndicators.some(indicator => 
      urlLower.includes(indicator)
    );
    
    let platform = 'unknown';
    if (urlLower.includes('clickbank') || urlLower.includes('hop.clickbank')) {
      platform = 'clickbank';
    } else if (urlLower.includes('leadpages')) {
      platform = 'leadpages';
    } else if (urlLower.includes('clickfunnels')) {
      platform = 'clickfunnels';
    } else if (urlLower.includes('shopify')) {
      platform = 'shopify';
    }
    
    return {
      isAffiliatePage: isAffiliate,
      platform,
      confidence: isAffiliate ? 0.9 : 0.3,
      reasoning: isAffiliate 
        ? `Detected ${platform} affiliate/sales page` 
        : 'Standard webpage detected'
    };
  }

  // ==================== MAIN SCRAPING METHOD ====================

  static async scrapeWebsite(url: string, useCache = true): Promise<ScrapingResult> {
    const startTime = Date.now();
    
    // Check cache first
    if (useCache) {
      const cached = this.getCachedResult(url);
      if (cached) return cached;
    }
    
    // Validate URL
    const validation = await this.validateUrl(url);
    if (!validation.isValid) {
      return {
        success: false,
        error: `Invalid URL: ${validation.error}. Suggestions: ${validation.suggestions?.join(', ')}`
      };
    }
    
    const apiKey = this.getApiKey();
    if (!apiKey) {
      return { 
        success: false, 
        error: 'Firecrawl API key not found. Please add your API key in settings.' 
      };
    }

    try {
      if (!this.firecrawlApp) {
        console.log('Initializing Firecrawl with API key...');
        this.firecrawlApp = new FirecrawlApp({ apiKey });
      }

      const urlAnalysis = this.analyzeURL(url);
      console.log('URL Analysis:', urlAnalysis);

      let scrapeResponse: FirecrawlResponse;

      // Retry logic with exponential backoff
      let lastError: Error | null = null;
      for (let attempt = 1; attempt <= this.config.maxRetries; attempt++) {
        try {
          if (urlAnalysis.isAffiliatePage) {
            scrapeResponse = await this.scrapeAffiliatePage(url);
          } else {
            scrapeResponse = await this.scrapeRegularPage(url);
          }
          break; // Success, exit retry loop
        } catch (error) {
          lastError = error instanceof Error ? error : new Error('Unknown error');
          console.warn(`Scraping attempt ${attempt} failed:`, lastError.message);
          
          if (attempt < this.config.maxRetries) {
            const delay = Math.pow(2, attempt - 1) * 1000; // Exponential backoff
            console.log(`Retrying in ${delay}ms...`);
            await new Promise(resolve => setTimeout(resolve, delay));
          }
        }
      }
      
      if (lastError) {
        throw lastError;
      }

      if (!scrapeResponse.success) {
        return { 
          success: false, 
          error: (scrapeResponse as ErrorResponse).error || 'Failed to scrape website' 
        };
      }

      // Handle case where Firecrawl succeeds but returns no data
      // Firecrawl returns data directly on response object, not nested under 'data'
      const hasContent = !!(scrapeResponse as any).markdown || !!(scrapeResponse as any).html;
      console.log('Checking Firecrawl response data:', {
        hasMarkdown: !!(scrapeResponse as any).markdown,
        hasHtml: !!(scrapeResponse as any).html,
        markdownLength: (scrapeResponse as any).markdown?.length || 0,
        htmlLength: (scrapeResponse as any).html?.length || 0,
        success: scrapeResponse.success
      });

      if (!hasContent) {
        console.log('Firecrawl succeeded but returned no data, using minimal fallback');
        const fallbackData = {
          markdown: 'No content extracted',
          html: '',
          metadata: { 
            title: 'Unknown Page', 
            description: 'No description available',
            sourceURL: url 
          }
        };
        
        // Still run analysis on empty data to get proper structure
        const analyzed = await this.analyzeScrapedContent(fallbackData, false);
        const processingTime = Date.now() - startTime;
        
        return {
          success: true,
          data: {
            raw: fallbackData,
            analyzed,
            metadata: {
              processingTime,
              finalURL: url,
              isAffiliatePage: false,
              extractionMethod: analyzed.extractionMethod
            }
          }
        };
      } else {
        // Normalize the response for the rest of the code that expects nested structure
        const normalizedData = {
          markdown: (scrapeResponse as any).markdown,
          html: (scrapeResponse as any).html,
          metadata: (scrapeResponse as any).metadata || {
            title: '',
            description: '',
            sourceURL: url
          }
        };
        
        console.log('Normalized Firecrawl data:', {
          markdownLength: normalizedData.markdown?.length || 0,
          htmlLength: normalizedData.html?.length || 0,
          hasMetadata: !!normalizedData.metadata
        });

        // Analyze and structure the content
        const analyzed = await this.analyzeScrapedContent(
          normalizedData, 
          urlAnalysis.isAffiliatePage
        );

        const processingTime = Date.now() - startTime;

        const result = { 
          success: true,
          data: {
            raw: normalizedData,
            analyzed,
            metadata: {
              processingTime,
              finalURL: normalizedData.metadata.sourceURL || url,
              isAffiliatePage: urlAnalysis.isAffiliatePage,
              extractionMethod: analyzed.extractionMethod
            }
          }
        } as ScrapingResult;
      
      // Cache successful result
      if (useCache) {
        this.setCachedResult(url, result);
      }
      
        return result;
      }

    } catch (error) {
      console.error('Error during scraping:', error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Failed to connect to Firecrawl API' 
      };
    }
  }

  // ==================== SPECIALIZED SCRAPING METHODS ====================

  private static async scrapeAffiliatePage(url: string): Promise<FirecrawlResponse> {
    console.log('Scraping affiliate page with enhanced configuration...');
    
    try {
      const result = await this.firecrawlApp!.scrapeUrl(url, {
        formats: ['markdown', 'html'],
        onlyMainContent: false, // Get all content for affiliate pages
        blockAds: false, // Don't block ads - might block content
        removeBase64Images: true,
        mobile: false,
        waitFor: this.config.affiliateWaitFor,
        timeout: this.config.affiliateTimeout,
        skipTlsVerification: true, // Help with problematic SSL
        actions: [
          {
            type: "wait",
            milliseconds: 5000
          }
        ]
      }) as any;

      // Right after: const result = await this.firecrawlApp!.scrapeUrl(...)
      console.log('=== IMMEDIATE RESPONSE CHECK ===');
      console.log('Type of result:', typeof result);
      console.log('Result keys:', result ? Object.keys(result) : 'null');
      console.log('Raw result:', JSON.stringify(result, null, 2).substring(0, 1000));
      console.log('=== END IMMEDIATE CHECK ===');
      
      console.log('Affiliate page scraping completed:', result.success);
      console.log('FIRECRAWL AFFILIATE RESPONSE:', JSON.stringify(result, null, 2));
      
      // Log the actual content to debug (Firecrawl returns data directly)
      if (result.success) {
        console.log('Markdown content length:', result.markdown?.length || 0);
        console.log('HTML content length:', result.html?.length || 0);
        console.log('Has metadata:', !!result.metadata);
      }
      
      return result;
    } catch (error) {
      console.error('Firecrawl affiliate scraping failed:', error);
      throw error;
    }
  }

  private static async scrapeRegularPage(url: string): Promise<FirecrawlResponse> {
    console.log('Scraping regular page with enhanced configuration...');
    
    const response = await this.firecrawlApp!.scrapeUrl(url, {
      formats: ['markdown', 'html'],
      onlyMainContent: true,
      blockAds: true,
      removeBase64Images: true,
      mobile: false,
      waitFor: this.config.waitFor,
      timeout: this.config.timeout,
      includeTags: [
        'title', 'meta', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
        'p', 'div', 'span', 'button', 'a', 'ul', 'li', 'section', 
        'article', 'main', 'blockquote', 'strong', 'em', 'b', 'i'
      ],
      excludeTags: [
        'script', 'style', 'nav', 'footer', 'header', 'aside', 
        'noscript', 'iframe', 'canvas', 'svg'
      ]
    }) as any;

    console.log('FIRECRAWL REGULAR RESPONSE:', JSON.stringify(response, null, 2));
    
    // Log the actual content to debug (Firecrawl returns data directly)
    if (response.success) {
      console.log('Markdown content length:', response.markdown?.length || 0);
      console.log('HTML content length:', response.html?.length || 0);
      console.log('Has metadata:', !!response.metadata);
    }
    
    return response;
  }

  // ==================== CONTENT ANALYSIS ====================

  private static async analyzeScrapedContent(
    scrapedData: ScrapeResponse['data'], 
    isAffiliatePage: boolean
  ): Promise<ContentAnalysisResult> {
    let extractedData: ExtractedMarketingData;
    let extractionMethod: 'llm' | 'parsing' | 'hybrid' = 'parsing';

    // Try to use LLM extracted data first
    if (scrapedData.json) {
      extractedData = this.validateAndCleanLLMData(scrapedData.json);
      extractionMethod = 'llm';
    } else {
      // Fallback to parsing markdown/html
      extractedData = this.parseMarkdownContent(scrapedData.markdown || '');
      extractionMethod = 'parsing';
    }

    // Enhance with HTML parsing if needed
    if (scrapedData.html && this.isDataIncomplete(extractedData)) {
      const htmlParsed = this.parseHtmlContent(scrapedData.html);
      extractedData = this.mergeExtractedData(extractedData, htmlParsed);
      extractionMethod = extractionMethod === 'llm' ? 'hybrid' : 'parsing';
    }

    // Calculate quality metrics
    const qualityScore = this.calculateQualityScore(extractedData, isAffiliatePage);
    const completenessScore = this.calculateCompletenessScore(extractedData);
    const missingFields = this.identifyMissingFields(extractedData, isAffiliatePage);
    const confidence = this.determineConfidence(qualityScore, extractionMethod);

    return {
      extractedData,
      qualityScore,
      completenessScore,
      missingFields,
      confidence,
      extractionMethod
    };
  }

  // ==================== DATA VALIDATION & CLEANING ====================

  private static validateAndCleanLLMData(jsonData: any): ExtractedMarketingData {
    return {
      productName: this.cleanString(jsonData.productName) || 'Unknown Product',
      headlines: this.cleanStringArray(jsonData.headlines),
      testimonials: this.cleanStringArray(jsonData.testimonials),
      pricing: this.cleanStringArray(jsonData.pricing),
      benefits: this.cleanStringArray(jsonData.benefits),
      ctas: this.cleanStringArray(jsonData.ctas),
      guarantees: this.cleanStringArray(jsonData.guarantees),
      timeframes: this.cleanStringArray(jsonData.timeframes),
      socialProof: this.cleanStringArray(jsonData.socialProof),
      category: this.cleanString(jsonData.category),
      targetAudience: this.cleanString(jsonData.targetAudience),
      mainBenefit: this.cleanString(jsonData.mainBenefit)
    };
  }

  private static cleanString(str: any): string {
    if (typeof str !== 'string') return '';
    return str.trim().replace(/\s+/g, ' ').substring(0, 500);
  }

  private static cleanStringArray(arr: any): string[] {
    if (!Array.isArray(arr)) return [];
    return arr
      .filter(item => typeof item === 'string' && item.trim().length > 0)
      .map(item => this.cleanString(item))
      .filter(item => item.length > 0)
      .slice(0, 20); // Limit array size
  }

  // ==================== CONTENT PARSING ====================

  private static parseMarkdownContent(markdown: string): ExtractedMarketingData {
    if (!markdown) {
      return this.getEmptyExtractedData();
    }

    const lines = markdown.split('\n').map(line => line.trim()).filter(Boolean);
    
    return {
      productName: this.extractProductName(lines, markdown),
      headlines: this.extractHeadlines(lines),
      testimonials: this.extractTestimonials(lines),
      pricing: this.extractPricing(lines),
      benefits: this.extractBenefits(lines),
      ctas: this.extractCTAs(lines),
      guarantees: this.extractGuarantees(lines),
      timeframes: this.extractTimeframes(lines),
      socialProof: this.extractSocialProof(lines),
      category: this.inferCategory(markdown),
      targetAudience: this.inferTargetAudience(markdown),
      mainBenefit: this.extractMainBenefit(lines)
    };
  }

  private static parseHtmlContent(html: string): Partial<ExtractedMarketingData> {
    // Create a DOM parser to extract specific elements
    const parser = new DOMParser();
    const doc = parser.parseFromString(html, 'text/html');
    
    return {
      headlines: this.extractHtmlHeadlines(doc),
      testimonials: this.extractHtmlTestimonials(doc),
      pricing: this.extractHtmlPricing(doc),
      ctas: this.extractHtmlCTAs(doc)
    };
  }

  // ==================== SPECIFIC EXTRACTION METHODS ====================

  private static extractProductName(lines: string[], fullText: string): string {
    // Look for title patterns
    const titlePatterns = [
      /^#\s+(.+)$/,
      /^##\s+(.+)$/,
      /title["\s]*[:=]\s*["']?([^"'\n]+)["']?/i
    ];

    for (const line of lines) {
      for (const pattern of titlePatterns) {
        const match = line.match(pattern);
        if (match && match[1] && match[1].length > 3 && match[1].length < 100) {
          return match[1].trim();
        }
      }
    }

    // Fallback: look for brand names or product names in text
    const productPatterns = [
      /(?:introducing|presenting|discover)\s+([A-Z][a-zA-Z\s]{3,30})/i,
      /([A-Z][a-zA-Z]+(?:\s+[A-Z][a-zA-Z]+)*)\s+(?:formula|system|method|solution)/i
    ];

    for (const pattern of productPatterns) {
      const match = fullText.match(pattern);
      if (match && match[1]) {
        return match[1].trim();
      }
    }

    return 'Unknown Product';
  }

  private static extractHeadlines(lines: string[]): string[] {
    const headlines: string[] = [];
    const headlinePatterns = [
      /^#{1,3}\s+(.+)$/,
      /^(.{10,100})$/
    ];

    for (const line of lines.slice(0, 50)) { // Check first 50 lines
      for (const pattern of headlinePatterns) {
        const match = line.match(pattern);
        if (match && match[1] && match[1].length > 10 && match[1].length < 200) {
          headlines.push(match[1].trim());
        }
      }
    }

    return [...new Set(headlines)].slice(0, 10);
  }

  private static extractTestimonials(lines: string[]): string[] {
    const testimonials: string[] = [];
    
    for (const line of lines) {
      // Look for quoted text
      if ((line.includes('"') || line.includes('"') || line.includes('"')) && 
          line.length > 20 && line.length < 500) {
        testimonials.push(line);
      }
      
      // Look for testimonial indicators
      if (/\b(testimonial|review|customer|says?|amazing|incredible|transformed|changed my life)/i.test(line) &&
          line.length > 15) {
        testimonials.push(line);
      }
    }

    return [...new Set(testimonials)].slice(0, 10);
  }

  private static extractPricing(lines: string[]): string[] {
    const pricing: string[] = [];
    const pricePatterns = [
      /\$\d+(?:\.\d{2})?/,
      /\d+\s*dollars?/i,
      /price[:\s]+\$?\d+/i,
      /only\s+\$?\d+/i,
      /save\s+\$?\d+/i,
      /\d+%\s*off/i,
      /discount/i,
      /special\s+offer/i
    ];

    for (const line of lines) {
      for (const pattern of pricePatterns) {
        if (pattern.test(line) && line.length < 200) {
          pricing.push(line);
          break;
        }
      }
    }

    return [...new Set(pricing)].slice(0, 5);
  }

  private static extractBenefits(lines: string[]): string[] {
    const benefits: string[] = [];
    
    for (const line of lines) {
      // Look for list items
      if (/^[\-\*\+]\s+(.+)$/.test(line) || /^\d+\.\s+(.+)$/.test(line)) {
        const cleanLine = line.replace(/^[\-\*\+\d\.\s]+/, '').trim();
        if (cleanLine.length > 5 && cleanLine.length < 200) {
          benefits.push(cleanLine);
        }
      }
      
      // Look for benefit keywords
      if (/\b(benefit|advantage|feature|helps?|improves?|increases?|reduces?|eliminates?)/i.test(line) &&
          line.length > 10 && line.length < 200) {
        benefits.push(line);
      }
    }

    return [...new Set(benefits)].slice(0, 15);
  }

  private static extractCTAs(lines: string[]): string[] {
    const ctas: string[] = [];
    const ctaPatterns = [
      /\b(buy now|order now|get started|click here|download|purchase|try now|start today|get instant access|claim now|join now)\b/i,
      /\[(.*?)\]/,
      /button.*?:\s*(.+)/i
    ];

    for (const line of lines) {
      for (const pattern of ctaPatterns) {
        const match = line.match(pattern);
        if (match && (match[1] || match[0])) {
          const cta = (match[1] || match[0]).trim();
          if (cta.length > 3 && cta.length < 100) {
            ctas.push(cta);
          }
        }
      }
    }

    return [...new Set(ctas)].slice(0, 8);
  }

  private static extractGuarantees(lines: string[]): string[] {
    const guarantees: string[] = [];
    
    for (const line of lines) {
      if (/\b(guarantee|refund|risk.free|money.back|satisfaction|no.questions.asked)\b/i.test(line) &&
          line.length > 10 && line.length < 300) {
        guarantees.push(line);
      }
    }

    return [...new Set(guarantees)].slice(0, 5);
  }

  private static extractTimeframes(lines: string[]): string[] {
    const timeframes: string[] = [];
    const timePatterns = [
      /\b\d+\s*(?:days?|hours?|minutes?|weeks?|months?|years?)\b/i,
      /\b(?:instant|immediately|same.day|overnight|within|in just)\b/i
    ];

    for (const line of lines) {
      for (const pattern of timePatterns) {
        if (pattern.test(line) && line.length > 5 && line.length < 200) {
          timeframes.push(line);
          break;
        }
      }
    }

    return [...new Set(timeframes)].slice(0, 5);
  }

  private static extractSocialProof(lines: string[]): string[] {
    const socialProof: string[] = [];
    const proofPatterns = [
      /\b\d+(?:,\d{3})*\+?\s*(?:customers?|users?|people|reviews?|satisfied|happy)\b/i,
      /\b(?:thousands?|millions?|hundreds?)\s+of\s+(?:customers?|users?|people)\b/i,
      /\b\d+(?:\.\d+)?\s*(?:stars?|rating|out of \d+)\b/i,
      /\b(?:trusted by|used by|recommended by)\b/i
    ];

    for (const line of lines) {
      for (const pattern of proofPatterns) {
        if (pattern.test(line) && line.length > 5 && line.length < 200) {
          socialProof.push(line);
          break;
        }
      }
    }

    return [...new Set(socialProof)].slice(0, 5);
  }

  private static extractMainBenefit(lines: string[]): string {
    // Look for compelling value propositions in first few lines
    for (const line of lines.slice(0, 10)) {
      if (line.length > 20 && line.length < 200 && 
          /\b(?:discover|learn|get|achieve|transform|improve|increase|reduce|eliminate)\b/i.test(line)) {
        return line;
      }
    }
    return '';
  }

  private static inferCategory(text: string): string {
    const categories = {
      health: ['health', 'fitness', 'weight', 'diet', 'nutrition', 'supplement', 'wellness'],
      business: ['business', 'marketing', 'sales', 'revenue', 'profit', 'entrepreneur'],
      education: ['course', 'training', 'learn', 'education', 'skill', 'knowledge'],
      technology: ['software', 'app', 'digital', 'automation', 'tech', 'online'],
      finance: ['money', 'investment', 'trading', 'forex', 'crypto', 'wealth']
    };

    const textLower = text.toLowerCase();
    
    for (const [category, keywords] of Object.entries(categories)) {
      if (keywords.some(keyword => textLower.includes(keyword))) {
        return category;
      }
    }
    
    return 'general';
  }

  private static inferTargetAudience(text: string): string {
    const audiences = {
      'entrepreneurs': ['entrepreneur', 'business owner', 'startup', 'ceo'],
      'fitness enthusiasts': ['fitness', 'gym', 'workout', 'athlete', 'bodybuilder'],
      'investors': ['investor', 'trading', 'portfolio', 'stocks', 'forex'],
      'students': ['student', 'college', 'university', 'learn', 'education'],
      'professionals': ['professional', 'career', 'workplace', 'corporate']
    };

    const textLower = text.toLowerCase();
    
    for (const [audience, keywords] of Object.entries(audiences)) {
      if (keywords.some(keyword => textLower.includes(keyword))) {
        return audience;
      }
    }
    
    return 'general audience';
  }

  // ==================== HTML PARSING METHODS ====================

  private static extractHtmlHeadlines(doc: Document): string[] {
    const headlines: string[] = [];
    const selectors = ['h1', 'h2', 'h3', '.headline', '[class*="hero"]'];
    
    for (const selector of selectors) {
      const elements = doc.querySelectorAll(selector);
      elements.forEach(el => {
        const text = el.textContent?.trim();
        if (text && text.length > 5 && text.length < 200) {
          headlines.push(text);
        }
      });
    }
    
    return [...new Set(headlines)].slice(0, 10);
  }

  private static extractHtmlTestimonials(doc: Document): string[] {
    const testimonials: string[] = [];
    const selectors = [
      '.testimonial', '[class*="review"]', '[class*="feedback"]', 
      '.quote', 'blockquote', '[class*="testimonial"]'
    ];
    
    for (const selector of selectors) {
      const elements = doc.querySelectorAll(selector);
      elements.forEach(el => {
        const text = el.textContent?.trim();
        if (text && text.length > 10 && text.length < 500) {
          testimonials.push(text);
        }
      });
    }
    
    return [...new Set(testimonials)].slice(0, 10);
  }

  private static extractHtmlPricing(doc: Document): string[] {
    const pricing: string[] = [];
    const selectors = [
      '.price', '[class*="cost"]', '[class*="money"]', '[class*="pricing"]',
      '.offer', '[class*="discount"]'
    ];
    
    for (const selector of selectors) {
      const elements = doc.querySelectorAll(selector);
      elements.forEach(el => {
        const text = el.textContent?.trim();
        if (text && text.length > 1 && text.length < 200) {
          pricing.push(text);
        }
      });
    }
    
    return [...new Set(pricing)].slice(0, 5);
  }

  private static extractHtmlCTAs(doc: Document): string[] {
    const ctas: string[] = [];
    const selectors = [
      'button', '.btn', '[class*="cta"]', '.button', 
      'a[class*="button"]', 'input[type="submit"]'
    ];
    
    for (const selector of selectors) {
      const elements = doc.querySelectorAll(selector);
      elements.forEach(el => {
        const text = el.textContent?.trim() || el.getAttribute('value')?.trim();
        if (text && text.length > 2 && text.length < 100) {
          ctas.push(text);
        }
      });
    }
    
    return [...new Set(ctas)].slice(0, 8);
  }

  // ==================== QUALITY ANALYSIS ====================

  private static calculateQualityScore(data: ExtractedMarketingData, isAffiliatePage: boolean): number {
    const weights = isAffiliatePage ? {
      productName: 0.15,
      headlines: 0.15,
      testimonials: 0.15,
      pricing: 0.15,
      benefits: 0.15,
      ctas: 0.10,
      guarantees: 0.10,
      socialProof: 0.05
    } : {
      productName: 0.20,
      headlines: 0.25,
      benefits: 0.20,
      ctas: 0.15,
      testimonials: 0.10,
      pricing: 0.10
    };

    let score = 0;
    
    if (data.productName && data.productName !== 'Unknown Product' && data.productName.length > 3) {
      score += weights.productName;
    }
    if (data.headlines.length > 0) score += weights.headlines * Math.min(data.headlines.length / 3, 1);
    if (data.testimonials.length > 0) score += weights.testimonials * Math.min(data.testimonials.length / 2, 1);
    if (data.pricing.length > 0) score += weights.pricing;
    if (data.benefits.length > 0) score += weights.benefits * Math.min(data.benefits.length / 5, 1);
    if (data.ctas.length > 0) score += weights.ctas * Math.min(data.ctas.length / 2, 1);
    if (data.guarantees.length > 0) score += weights.guarantees;
    if (data.socialProof.length > 0) score += weights.socialProof;

    return Math.min(score, 1);
  }

  private static calculateCompletenessScore(data: ExtractedMarketingData): number {
    const requiredFields = ['productName', 'headlines', 'benefits', 'ctas'];
    const optionalFields = ['testimonials', 'pricing', 'guarantees', 'socialProof', 'timeframes'];
    
    let score = 0;
    
    // Required fields (weighted higher)
    for (const field of requiredFields) {
      const value = data[field as keyof ExtractedMarketingData];
      if (Array.isArray(value) ? value.length > 0 : value && value !== 'Unknown Product') {
        score += 2; // Double weight for required fields
      }
    }
    
    // Optional fields
    for (const field of optionalFields) {
      const value = data[field as keyof ExtractedMarketingData];
      if (Array.isArray(value) ? value.length > 0 : value) {
        score += 1;
      }
    }
    
    return Math.min(score / (requiredFields.length * 2 + optionalFields.length), 1);
  }

  private static identifyMissingFields(data: ExtractedMarketingData, isAffiliatePage: boolean): string[] {
    const missing: string[] = [];
    
    if (!data.productName || data.productName === 'Unknown Product') {
      missing.push('Product Name');
    }
    if (data.headlines.length === 0) {
      missing.push('Headlines');
    }
    if (data.benefits.length === 0) {
      missing.push('Benefits');
    }
    if (data.ctas.length === 0) {
      missing.push('Call-to-Actions');
    }
    
    if (isAffiliatePage) {
      if (data.testimonials.length === 0) {
        missing.push('Testimonials');
      }
      if (data.pricing.length === 0) {
        missing.push('Pricing Information');
      }
      if (data.guarantees.length === 0) {
        missing.push('Guarantees');
      }
    }
    
    return missing;
  }

  private static determineConfidence(qualityScore: number, extractionMethod: string): 'high' | 'medium' | 'low' {
    if (extractionMethod === 'llm' && qualityScore > 0.8) return 'high';
    if (qualityScore > 0.7) return 'high';
    if (qualityScore > 0.5) return 'medium';
    return 'low';
  }

  // ==================== UTILITY METHODS ====================

  private static isDataIncomplete(data: ExtractedMarketingData): boolean {
    return (
      data.headlines.length === 0 ||
      data.benefits.length === 0 ||
      data.ctas.length === 0 ||
      (data.productName === 'Unknown Product')
    );
  }

  private static mergeExtractedData(
    primary: ExtractedMarketingData, 
    secondary: Partial<ExtractedMarketingData>
  ): ExtractedMarketingData {
    return {
      productName: primary.productName !== 'Unknown Product' ? primary.productName : (secondary.productName || primary.productName),
      headlines: [...new Set([...primary.headlines, ...(secondary.headlines || [])])].slice(0, 10),
      testimonials: [...new Set([...primary.testimonials, ...(secondary.testimonials || [])])].slice(0, 10),
      pricing: [...new Set([...primary.pricing, ...(secondary.pricing || [])])].slice(0, 5),
      benefits: [...new Set([...primary.benefits, ...(secondary.benefits || [])])].slice(0, 15),
      ctas: [...new Set([...primary.ctas, ...(secondary.ctas || [])])].slice(0, 8),
      guarantees: [...new Set([...primary.guarantees, ...(secondary.guarantees || [])])].slice(0, 5),
      timeframes: [...new Set([...primary.timeframes, ...(secondary.timeframes || [])])].slice(0, 5),
      socialProof: [...new Set([...primary.socialProof, ...(secondary.socialProof || [])])].slice(0, 5),
      category: primary.category || secondary.category,
      targetAudience: primary.targetAudience || secondary.targetAudience,
      mainBenefit: primary.mainBenefit || secondary.mainBenefit
    };
  }

  private static getEmptyExtractedData(): ExtractedMarketingData {
    return {
      productName: 'Unknown Product',
      headlines: [],
      testimonials: [],
      pricing: [],
      benefits: [],
      ctas: [],
      guarantees: [],
      timeframes: [],
      socialProof: [],
      category: '',
      targetAudience: '',
      mainBenefit: ''
    };
  }

  // ==================== PUBLIC UTILITY METHODS ====================

  static getExtractionSummary(result: ScrapingResult): string {
    if (!result.success || !result.data) {
      return 'Extraction failed';
    }

    const { analyzed, metadata } = result.data;
    const { extractedData, qualityScore, confidence } = analyzed;
    
    return `Extracted ${extractedData.headlines.length} headlines, ${extractedData.benefits.length} benefits, ${extractedData.testimonials.length} testimonials. Quality: ${Math.round(qualityScore * 100)}% (${confidence} confidence)`;
  }

  static generateExtractionReport(result: ScrapingResult): {
    success: boolean;
    summary: string;
    details: {
      qualityScore: number;
      completenessScore: number;
      confidence: string;
      extractionMethod: string;
      processingTime: number;
      missingFields: string[];
      extractedCounts: {
        headlines: number;
        testimonials: number;
        benefits: number;
        ctas: number;
        pricing: number;
        guarantees: number;
      };
    };
  } {
    if (!result.success || !result.data) {
      return {
        success: false,
        summary: 'Extraction failed',
        details: {
          qualityScore: 0,
          completenessScore: 0,
          confidence: 'low',
          extractionMethod: 'none',
          processingTime: 0,
          missingFields: [],
          extractedCounts: {
            headlines: 0,
            testimonials: 0,
            benefits: 0,
            ctas: 0,
            pricing: 0,
            guarantees: 0
          }
        }
      };
    }

    const { analyzed, metadata } = result.data;
    const { extractedData, qualityScore, completenessScore, confidence, extractionMethod, missingFields } = analyzed;

    return {
      success: true,
      summary: this.getExtractionSummary(result),
      details: {
        qualityScore: Math.round(qualityScore * 100) / 100,
        completenessScore: Math.round(completenessScore * 100) / 100,
        confidence,
        extractionMethod,
        processingTime: metadata.processingTime,
        missingFields,
        extractedCounts: {
          headlines: extractedData.headlines.length,
          testimonials: extractedData.testimonials.length,
          benefits: extractedData.benefits.length,
          ctas: extractedData.ctas.length,
          pricing: extractedData.pricing.length,
          guarantees: extractedData.guarantees.length
        }
      }
    };
  }

  // ==================== DEBUGGING METHODS ====================

  static async testExtraction(url: string): Promise<{
    urlAnalysis: ReturnType<typeof FirecrawlService.analyzeURL>;
    scrapingResult: ScrapingResult;
    extractionReport: ReturnType<typeof FirecrawlService.generateExtractionReport>;
  }> {
    const urlAnalysis = this.analyzeURL(url);
    const scrapingResult = await this.scrapeWebsite(url);
    const extractionReport = this.generateExtractionReport(scrapingResult);

    return {
      urlAnalysis,
      scrapingResult,
      extractionReport
    };
  }

  static getApiKeyStatus(): {
    hasApiKey: boolean;
    isConfigured: boolean;
    message: string;
  } {
    const apiKey = this.getApiKey();
    
    if (!apiKey) {
      return {
        hasApiKey: false,
        isConfigured: false,
        message: 'No Firecrawl API key found. Please add your API key in settings.'
      };
    }

    return {
      hasApiKey: true,
      isConfigured: !!this.firecrawlApp,
      message: 'Firecrawl API key configured and ready to use.'
    };
  }

  // ==================== ENHANCED DATA SUGGESTIONS ====================

  static generateMissingDataSuggestions(data: ExtractedMarketingData, category: string): {
    headlines: string[];
    testimonials: string[];
    benefits: string[];
    ctas: string[];
    guarantees: string[];
  } {
    const suggestions = {
      health: {
        headlines: [
          'Transform Your Health in 30 Days',
          'The #1 Doctor-Recommended Solution',
          'Breakthrough Health Discovery',
          'Natural Health Revolution',
          'Reclaim Your Vitality Today'
        ],
        testimonials: [
          '"This changed my life completely!"',
          '"I feel 20 years younger!"',
          '"Results in just 2 weeks!"',
          '"My doctor was amazed!"',
          '"Best investment I ever made!"'
        ],
        benefits: [
          'Boost energy levels naturally',
          'Improve overall health',
          'Feel younger and stronger',
          'Doctor-approved formula',
          'No side effects'
        ],
        ctas: [
          'Get Your Health Transformation',
          'Start Your Journey Today',
          'Claim Your Discount Now',
          'Order Risk-Free',
          'Join Thousands of Success Stories'
        ],
        guarantees: [
          '60-day money-back guarantee',
          '100% satisfaction guaranteed',
          'Risk-free trial',
          'No questions asked refund'
        ]
      },
      business: {
        headlines: [
          'Double Your Revenue in 90 Days',
          'The Business Growth Blueprint',
          'From Startup to Success Story',
          'Scale Your Business Fast',
          'Proven Profit Strategies'
        ],
        testimonials: [
          '"Increased sales by 300%!"',
          '"Best business decision ever!"',
          '"ROI in first month!"',
          '"Game-changing strategies!"',
          '"Transformed my business!"'
        ],
        benefits: [
          'Increase revenue quickly',
          'Streamline operations',
          'Scale efficiently',
          'Proven strategies',
          'Expert guidance'
        ],
        ctas: [
          'Start Growing Your Business',
          'Get Instant Access',
          'Download Your Blueprint',
          'Join Successful Entrepreneurs',
          'Claim Your Success Kit'
        ],
        guarantees: [
          '30-day money-back guarantee',
          'Results or refund',
          'Success guaranteed',
          'Risk-free investment'
        ]
      },
      general: {
        headlines: [
          'Discover the Secret to Success',
          'Transform Your Life Today',
          'The Ultimate Solution',
          'Revolutionary Breakthrough',
          'Change Your Life Forever'
        ],
        testimonials: [
          '"Absolutely life-changing!"',
          '"Results beyond expectations!"',
          '"Highly recommended!"',
          '"Worth every penny!"',
          '"Amazing transformation!"'
        ],
        benefits: [
          'Proven results',
          'Easy to use',
          'Fast implementation',
          'Expert support',
          'Guaranteed success'
        ],
        ctas: [
          'Get Started Now',
          'Claim Your Copy',
          'Download Instantly',
          'Join Today',
          'Start Your Transformation'
        ],
        guarantees: [
          'Money-back guarantee',
          'Satisfaction guaranteed',
          'Risk-free trial',
          'Full refund available'
        ]
      }
    };

    const categoryData = suggestions[category as keyof typeof suggestions] || suggestions.general;
    
    return {
      headlines: data.headlines.length === 0 ? categoryData.headlines : [],
      testimonials: data.testimonials.length === 0 ? categoryData.testimonials : [],
      benefits: data.benefits.length < 3 ? categoryData.benefits : [],
      ctas: data.ctas.length === 0 ? categoryData.ctas : [],
      guarantees: data.guarantees.length === 0 ? categoryData.guarantees : []
    };
  }

  // ==================== BATCH PROCESSING ====================

  static async scrapeMultipleUrls(urls: string[]): Promise<{
    results: ScrapingResult[];
    summary: {
      total: number;
      successful: number;
      failed: number;
      averageQuality: number;
    };
  }> {
    const results: ScrapingResult[] = [];
    
    for (const url of urls) {
      try {
        const result = await this.scrapeWebsite(url);
        results.push(result);
        
        // Add delay to avoid rate limiting
        await new Promise(resolve => setTimeout(resolve, 1000));
      } catch (error) {
        results.push({
          success: false,
          error: `Failed to scrape ${url}: ${error instanceof Error ? error.message : 'Unknown error'}`
        });
      }
    }

    const successful = results.filter(r => r.success);
    const failed = results.filter(r => !r.success);
    const averageQuality = successful.length > 0 
      ? successful.reduce((sum, r) => sum + (r.data?.analyzed.qualityScore || 0), 0) / successful.length
      : 0;

    return {
      results,
      summary: {
        total: urls.length,
        successful: successful.length,
        failed: failed.length,
        averageQuality: Math.round(averageQuality * 100) / 100
      }
    };
  }

  // ==================== CONTENT ENHANCEMENT ====================

  static enhanceExtractedData(data: ExtractedMarketingData): ExtractedMarketingData {
    return {
      ...data,
      headlines: this.enhanceHeadlines(data.headlines),
      benefits: this.enhanceBenefits(data.benefits),
      ctas: this.enhanceCTAs(data.ctas),
      testimonials: this.enhanceTestimonials(data.testimonials)
    };
  }

  private static enhanceHeadlines(headlines: string[]): string[] {
    return headlines.map(headline => {
      // Remove common prefixes/suffixes
      return headline
        .replace(/^(introducing|discover|learn about|read about)\s+/i, '')
        .replace(/\s+(here|now|today)$/i, '')
        .trim();
    });
  }

  private static enhanceBenefits(benefits: string[]): string[] {
    return benefits.map(benefit => {
      // Ensure benefits start with action words
      if (!/^(get|achieve|improve|increase|reduce|eliminate|discover|learn)/i.test(benefit)) {
        return benefit;
      }
      return benefit;
    });
  }

  private static enhanceCTAs(ctas: string[]): string[] {
    return ctas.map(cta => {
      // Remove common wrapper text
      return cta
        .replace(/^(click|press|tap)\s+/i, '')
        .replace(/\s+(button|link)$/i, '')
        .trim();
    });
  }

  private static enhanceTestimonials(testimonials: string[]): string[] {
    return testimonials.map(testimonial => {
      // Clean up testimonial formatting
      return testimonial
        .replace(/^["'""]|["'""]$/g, '') // Remove quotes at start/end
        .replace(/\s+/g, ' ') // Normalize whitespace
        .trim();
    });
  }
}

// ==================== EXPORT TYPES ====================

export type {
  ExtractedMarketingData,
  ContentAnalysisResult,
  ScrapingResult,
  FirecrawlResponse
};
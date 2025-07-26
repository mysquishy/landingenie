export interface ProductData {
  // Core Value Equation Components (Alex Hormozi Framework)
  dreamOutcome: {
    mainBenefit: string;
    secondaryBenefits: string[];
    targetAudience: string;
    emotionalOutcome: string;
  };
  perceivedLikelihood: {
    testimonials: string[];
    socialProofNumbers: string[];
    guarantees: string[];
  };
  timeDelay: {
    deliveryTimeframe: string;
    resultsTimeframe: string;
  };
  effortSacrifice: {
    difficultyLevel: number; // 1-10
    prerequisites: string[];
    easeOfUse: string;
  };
  
  // Classification Data
  productInfo: {
    name: string;
    category: 'software' | 'physical' | 'service' | 'info' | 'health';
    industry: string;
    pricePoint: 'low' | 'medium' | 'high' | 'premium';
  };
  
  // Quality Metadata
  extractionQuality: {
    completenessScore: number; // 0-1
    confidenceLevel: 'high' | 'medium' | 'low';
    missingFields: string[];
  };
}

export class ContentAnalyzer {
  static async analyzeContent(scrapedData: any): Promise<ProductData> {
    // Handle undefined or null scrapedData
    if (!scrapedData || typeof scrapedData !== 'object') {
      console.warn('Invalid scraped data provided, using fallback analysis');
      return this.fallbackAnalysis('', { title: 'Unknown' });
    }

    const { markdown = '', metadata = {} } = scrapedData;
    
    const analysisPrompt = `
      EXTRACT LANDING PAGE DATA from this content for Alex Hormozi's Value Equation:
      
      Content: ${JSON.stringify({ markdown: markdown.substring(0, 8000), metadata })}
      
      RETURN STRUCTURED JSON WITH EXACTLY THIS FORMAT:
      {
        "dreamOutcome": {
          "mainBenefit": "primary transformation or outcome",
          "secondaryBenefits": ["benefit1", "benefit2", "benefit3"],
          "targetAudience": "specific audience description",
          "emotionalOutcome": "emotional transformation"
        },
        "perceivedLikelihood": {
          "testimonials": ["testimonial1", "testimonial2"],
          "socialProofNumbers": ["metric1", "metric2"],
          "guarantees": ["guarantee1", "guarantee2"]
        },
        "timeDelay": {
          "deliveryTimeframe": "how quickly they get access",
          "resultsTimeframe": "how quickly they see results"
        },
        "effortSacrifice": {
          "difficultyLevel": 5,
          "prerequisites": ["requirement1", "requirement2"],
          "easeOfUse": "description of ease"
        },
        "productInfo": {
          "name": "product name",
          "category": "software|physical|service|info|health",
          "industry": "industry name",
          "pricePoint": "low|medium|high|premium"
        },
        "extractionQuality": {
          "completenessScore": 0.8,
          "confidenceLevel": "high|medium|low",
          "missingFields": ["field1", "field2"]
        }
      }
      
      Mark missing data as "MISSING" - do not fabricate information.
      Provide confidence scores based on data availability.
      Ensure all fields are present in the response.
    `;

    try {
      // Try OpenRouter first if available, then Perplexity as fallback
      let structuredData;
      
      try {
        const { OpenRouterService } = await import('./OpenRouterService');
        if (OpenRouterService.getApiKey()) {
          console.log('Using OpenRouter for content analysis');
          // Use a more capable model for better extraction
          structuredData = await OpenRouterService.analyzeContent(analysisPrompt, 'anthropic/claude-3.5-sonnet');
        } else {
          throw new Error('OpenRouter API key not available');
        }
      } catch (openRouterError) {
        console.log('OpenRouter failed, trying Perplexity:', openRouterError);
        try {
          const { PerplexityService } = await import('./PerplexityService');
          if (PerplexityService.getApiKey()) {
            console.log('Using Perplexity for content analysis');
            structuredData = await PerplexityService.analyzeContent(analysisPrompt);
          } else {
            throw new Error('No AI service available');
          }
        } catch (perplexityError) {
          console.log('Both AI services failed, using enhanced fallback');
          throw new Error('All AI services failed');
        }
      }
      
      // Validate and ensure all required fields
      const validatedData = this.validateAndCleanData(structuredData);
      console.log('AI analysis successful, completeness score:', validatedData.extractionQuality.completenessScore);
      return validatedData;
    } catch (error) {
      console.error('AI analysis failed, falling back to enhanced extraction:', error);
      return this.fallbackAnalysis(markdown, metadata);
    }
  }

  private static validateAndCleanData(data: any): ProductData {
    // Ensure all required fields exist with defaults
    return {
      dreamOutcome: {
        mainBenefit: data.dreamOutcome?.mainBenefit || 'MISSING',
        secondaryBenefits: data.dreamOutcome?.secondaryBenefits || [],
        targetAudience: data.dreamOutcome?.targetAudience || 'MISSING',
        emotionalOutcome: data.dreamOutcome?.emotionalOutcome || 'MISSING'
      },
      perceivedLikelihood: {
        testimonials: data.perceivedLikelihood?.testimonials || [],
        socialProofNumbers: data.perceivedLikelihood?.socialProofNumbers || [],
        guarantees: data.perceivedLikelihood?.guarantees || []
      },
      timeDelay: {
        deliveryTimeframe: data.timeDelay?.deliveryTimeframe || 'MISSING',
        resultsTimeframe: data.timeDelay?.resultsTimeframe || 'MISSING'
      },
      effortSacrifice: {
        difficultyLevel: data.effortSacrifice?.difficultyLevel || 5,
        prerequisites: data.effortSacrifice?.prerequisites || [],
        easeOfUse: data.effortSacrifice?.easeOfUse || 'MISSING'
      },
      productInfo: {
        name: data.productInfo?.name || 'Unknown Product',
        category: this.validateCategory(data.productInfo?.category) || 'info',
        industry: data.productInfo?.industry || 'General',
        pricePoint: this.validatePricePoint(data.productInfo?.pricePoint) || 'medium'
      },
      extractionQuality: {
        completenessScore: data.extractionQuality?.completenessScore || 0.5,
        confidenceLevel: this.validateConfidenceLevel(data.extractionQuality?.confidenceLevel) || 'medium',
        missingFields: data.extractionQuality?.missingFields || []
      }
    };
  }

  private static fallbackAnalysis(markdown: string, metadata: any): ProductData {
    console.log('Running enhanced fallback analysis on content length:', markdown.length);
    
    const productName = this.extractProductName(markdown, metadata.title);
    const mainBenefit = this.extractMainBenefit(markdown);
    const targetAudience = this.extractTargetAudience(markdown);
    const industry = 'Health & Wellness'; // Default for affiliate products
    const category = 'health'; // Default for affiliate products
    const pricePoint = 'medium'; // Default pricing
    const emotionalOutcome = 'improved confidence and well-being';
    const testimonials = this.extractTestimonials(markdown);
    const socialProof = this.extractSocialProof(markdown);
    const guarantees = this.extractGuarantees(markdown);
    
    // Enhanced quality scoring with more specific checks
    let qualityScore = 0.1; // Base score for any content
    
    // Product name scoring
    if (productName && productName !== 'Unknown Product' && productName !== 'Product Analysis' && productName.length > 3) {
      qualityScore += 0.15;
    }
    
    // Main benefit scoring - look for sales page language
    if (mainBenefit && mainBenefit.length > 30 && 
        !mainBenefit.includes('Transform your results') &&
        (mainBenefit.toLowerCase().includes('get ') || 
         mainBenefit.toLowerCase().includes('achieve ') ||
         mainBenefit.toLowerCase().includes('improve ') ||
         mainBenefit.toLowerCase().includes('discover ') ||
         mainBenefit.toLowerCase().includes('eliminate ') ||
         mainBenefit.toLowerCase().includes('reduce '))) {
      qualityScore += 0.2;
    }
    
    // Target audience scoring
    if (targetAudience && targetAudience !== 'professionals and entrepreneurs' && targetAudience.length > 10) {
      qualityScore += 0.1;
    }
    
    // Industry classification - always health for affiliate products
    qualityScore += 0.1;
    
    // Category classification - always health for affiliate products
    qualityScore += 0.1;
    
    // Testimonials found
    if (testimonials.length > 0) {
      qualityScore += 0.15;
    }
    
    // Social proof found
    if (socialProof.length > 0) {
      qualityScore += 0.1;
    }
    
    // Guarantees found
    if (guarantees.length > 0) {
      qualityScore += 0.1;
    }
    
    // Cap at 1.0
    qualityScore = Math.min(qualityScore, 1.0);
    
    const missingFields = [];
    if (mainBenefit.includes('Transform your results')) missingFields.push('mainBenefit');
    if (targetAudience === 'professionals and entrepreneurs') missingFields.push('targetAudience');
    if (emotionalOutcome.includes('confidence and success')) missingFields.push('emotionalOutcome');
    if (testimonials.length === 0) missingFields.push('testimonials');
    if (socialProof.length === 0) missingFields.push('socialProof');
    if (guarantees.length === 0) missingFields.push('guarantees');
    
    console.log('Fallback analysis results:', { 
      productName, 
      mainBenefit: mainBenefit.substring(0, 50), 
      qualityScore,
      testimonialsFound: testimonials.length,
      socialProofFound: socialProof.length,
      guaranteesFound: guarantees.length
    });
    
    return {
      dreamOutcome: {
        mainBenefit,
        secondaryBenefits: [], // Will be extracted from benefits
        targetAudience,
        emotionalOutcome
      },
      perceivedLikelihood: {
        testimonials,
        socialProofNumbers: socialProof,
        guarantees
      },
      timeDelay: {
        deliveryTimeframe: this.extractDeliveryTime(markdown),
        resultsTimeframe: this.extractResultsTime(markdown)
      },
      effortSacrifice: {
        difficultyLevel: this.assessDifficulty(markdown),
        prerequisites: this.extractPrerequisites(markdown),
        easeOfUse: this.extractEaseOfUse(markdown)
      },
      productInfo: {
        name: productName,
        category: this.validateCategory(category) || 'health', // Default to health for ProDentim-like products
        industry,
        pricePoint: this.validatePricePoint(pricePoint) || 'medium'
      },
      extractionQuality: {
        completenessScore: qualityScore,
        confidenceLevel: qualityScore > 0.7 ? 'high' : qualityScore > 0.5 ? 'medium' : 'low',
        missingFields
      }
    };
  }

  private static validateCategory(category: string): 'software' | 'physical' | 'service' | 'info' | 'health' {
    const validCategories = ['software', 'physical', 'service', 'info', 'health'];
    return validCategories.includes(category) ? category as any : 'info';
  }

  private static validatePricePoint(pricePoint: string): 'low' | 'medium' | 'high' | 'premium' {
    const validPricePoints = ['low', 'medium', 'high', 'premium'];
    return validPricePoints.includes(pricePoint) ? pricePoint as any : 'medium';
  }

  private static validateConfidenceLevel(level: string): 'high' | 'medium' | 'low' {
    const validLevels = ['high', 'medium', 'low'];
    return validLevels.includes(level) ? level as any : 'medium';
  }

  private static extractProductName(markdown: string, title: string): string {
    // Enhanced product name extraction for affiliate/sales pages
    
    // First check for common health product patterns
    const healthProductPatterns = [
      /prodentim|pro-dentim|pro dentim/gi,
      /(\w+\s*(?:plus|pro|max|ultra|premium|advanced))/gi,
      /([A-Z][a-z]+(?:Pro|Plus|Max|Ultra|Premium|Advanced))/g
    ];

    for (const pattern of healthProductPatterns) {
      const matches = markdown.match(pattern);
      if (matches && matches[0].length > 2) {
        return this.cleanProductName(matches[0]);
      }
    }

    // Try to extract from title first, clean it up
    if (title && title.length > 0 && title !== 'Untitled') {
      const cleanTitle = title
        .replace(/[|\-–—].*$/, '') // Remove everything after separators
        .replace(/\s*[-–—]\s*.*$/, '') // Alternative separator cleanup
        .replace(/^\W+|\W+$/g, '') // Remove leading/trailing non-word chars
        .trim();
      if (cleanTitle.length > 2 && !cleanTitle.toLowerCase().includes('clickbank')) {
        return this.cleanProductName(cleanTitle);
      }
    }

    // Look for product names in headings with sales page context
    const salesHeadingPatterns = [
      /^#{1,3}\s+([^#\n]{5,60})/gm,
      /\*\*([A-Z][^*]{3,50})\*\*/g,
      /"([A-Z][^"]{3,50})"/g
    ];

    for (const pattern of salesHeadingPatterns) {
      const matches = [...markdown.matchAll(pattern)];
      for (const match of matches) {
        const candidate = this.cleanProductName(match[1]);
        if (candidate && candidate.length > 3 && candidate.length < 60 &&
            !candidate.toLowerCase().includes('welcome') &&
            !candidate.toLowerCase().includes('discover') &&
            !candidate.toLowerCase().includes('finally') &&
            !candidate.toLowerCase().includes('breakthrough')) {
          return candidate;
        }
      }
    }

    return 'Product Analysis';
  }

  private static cleanProductName(name: string): string {
    return name
      .replace(/^\W+|\W+$/g, '') // Remove leading/trailing non-word chars
      .replace(/\s+/g, ' ') // Normalize spaces
      .trim();
  }

  private static extractMainBenefit(markdown: string): string {
    // Enhanced benefit extraction for sales pages
    const salesBenefitPatterns = [
      // Direct benefit statements
      /(?:get|achieve|experience|enjoy|discover|unlock|obtain)\s+([^.!?\n]{20,150})/gi,
      // Health/wellness specific benefits
      /(?:improve|boost|enhance|strengthen|restore|rebuild|support)\s+(?:your\s+)?([^.!?\n]{15,120})/gi,
      // Problem-solution patterns
      /(?:eliminate|reduce|stop|prevent|avoid|end)\s+([^.!?\n]{15,120})/gi,
      // Transformation patterns
      /(?:transform|change|revolutionize)\s+(?:your\s+)?([^.!?\n]{15,120})/gi,
      // Sales headline patterns
      /(?:finally|now you can|you can now|imagine if you could)\s+([^.!?\n]{15,150})/gi,
      // Direct promise patterns
      /(?:guaranteed to|proven to|designed to|created to)\s+([^.!?\n]{15,120})/gi
    ];

    for (const pattern of salesBenefitPatterns) {
      const matches = [...markdown.matchAll(pattern)];
      if (matches.length > 0) {
        const benefit = matches[0][1].trim();
        if (benefit.length > 20 && !benefit.toLowerCase().includes('undefined') &&
            !benefit.toLowerCase().includes('click here') &&
            !benefit.toLowerCase().includes('order now')) {
          return benefit;
        }
      }
    }

    // Look for compelling headlines that suggest benefits
    const headlinePatterns = [
      /^#{1,3}\s+([^#\n]{25,150})/gm,
      /\*\*([^*]{25,150})\*\*/g
    ];

    for (const pattern of headlinePatterns) {
      const matches = [...markdown.matchAll(pattern)];
      for (const match of matches) {
        const headline = match[1].trim();
        if (headline.length > 25 && headline.length < 150 &&
            (headline.toLowerCase().includes('get ') ||
             headline.toLowerCase().includes('improve ') ||
             headline.toLowerCase().includes('eliminate ') ||
             headline.toLowerCase().includes('discover ') ||
             headline.toLowerCase().includes('achieve '))) {
          return headline;
        }
      }
    }

    // Fallback to strong value propositions
    const sentences = markdown.split(/[.!?]+/).filter(s => s.trim().length > 30);
    for (const sentence of sentences.slice(0, 10)) {
      const clean = sentence.trim();
      if (clean.length > 30 && clean.length < 150 && 
          !clean.toLowerCase().includes('cookie') && 
          !clean.toLowerCase().includes('privacy') &&
          !clean.toLowerCase().includes('terms') &&
          (clean.toLowerCase().includes('health') ||
           clean.toLowerCase().includes('improve') ||
           clean.toLowerCase().includes('better') ||
           clean.toLowerCase().includes('solution'))) {
        return clean;
      }
    }

    return 'Transform your health and wellness with this breakthrough solution';
  }

  private static extractTargetAudience(markdown: string): string {
    const salesAudiencePatterns = [
      // Direct audience targeting
      /(?:if you(?:'re| are)|are you)\s+([^.!?\n]{15,100})/gi,
      /(?:for|designed for|perfect for|ideal for|targeting)\s+([^.!?\n]{10,80})/gi,
      // Problem-focused audience
      /(?:people who|individuals who|those who)\s+([^.!?\n]{15,100})/gi,
      // Age/demographic patterns
      /(?:men and women|adults|people)\s+(?:over|above|aged)\s+(\d+[^.!?\n]{5,80})/gi,
      // Health-specific audiences
      /(?:anyone|people|individuals)\s+(?:suffering from|struggling with|dealing with)\s+([^.!?\n]{10,80})/gi
    ];

    for (const pattern of salesAudiencePatterns) {
      const matches = [...markdown.matchAll(pattern)];
      if (matches.length > 0) {
        const audience = matches[0][1] ? matches[0][1].trim() : matches[0][0].trim();
        if (audience.length > 10 && !audience.toLowerCase().includes('undefined')) {
          return audience;
        }
      }
    }

    // Look for health-related audience indicators
    if (markdown.toLowerCase().includes('dental') || markdown.toLowerCase().includes('teeth') || markdown.toLowerCase().includes('gum')) {
      return 'adults concerned about oral and dental health';
    }
    if (markdown.toLowerCase().includes('weight') || markdown.toLowerCase().includes('diet')) {
      return 'individuals looking to manage their weight and improve health';
    }

    return 'health-conscious adults seeking natural wellness solutions';
  }

  private static extractTestimonials(markdown: string): string[] {
    const testimonials = [];
    
    // Enhanced testimonial patterns for sales pages
    const testimonialPatterns = [
      /"([^"]{30,300})"/g,
      /'([^']{30,300})'/g,
      /testimonial[:\s]*([^.!?\n]{30,300})/gi,
      /review[:\s]*([^.!?\n]{30,300})/gi,
      /(?:customer|client|user)\s+(?:says?|reports?|shares?)[:\s]*([^.!?\n]{30,300})/gi,
      /(?:i|we)\s+(?:was|were|am|are)\s+([^.!?\n]{30,200})/gi
    ];

    for (const pattern of testimonialPatterns) {
      const matches = [...markdown.matchAll(pattern)];
      for (const match of matches) {
        const testimonial = match[1].trim();
        if (testimonial.length > 30 && testimonial.length < 300 &&
            !testimonial.toLowerCase().includes('click') &&
            !testimonial.toLowerCase().includes('order') &&
            !testimonial.toLowerCase().includes('buy')) {
          testimonials.push(testimonial);
          if (testimonials.length >= 5) break;
        }
      }
    }
    
    return testimonials;
  }

  private static extractSocialProof(markdown: string): string[] {
    const proofNumbers = [];
    
    // Enhanced social proof patterns for sales pages
    const socialProofPatterns = [
      /(\d+(?:,\d{3})*)\s*(?:\+\s*)?(?:customers|users|clients|people|individuals|men|women)/gi,
      /(?:over|more than|above)\s+(\d+(?:,\d{3})*)\s*(?:customers|users|people|satisfied)/gi,
      /(\d+(?:\.\d+)?[%])\s*(?:success|satisfaction|effective|improvement|better)/gi,
      /(\d+(?:,\d{3})*)\s*(?:bottles sold|units sold|satisfied customers)/gi,
      /(\d+(?:\.\d+)?\s*(?:star|stars))/gi,
      /(\d+(?:,\d{3})*)\s*(?:reviews|ratings|testimonials)/gi
    ];

    for (const pattern of socialProofPatterns) {
      const matches = [...markdown.matchAll(pattern)];
      for (const match of matches) {
        proofNumbers.push(match[0]);
        if (proofNumbers.length >= 5) break;
      }
    }
    
    return proofNumbers;
  }

  private static extractGuarantees(markdown: string): string[] {
    const guarantees = [];
    
    // Enhanced guarantee patterns for sales pages
    const guaranteePatterns = [
      /(\d+\s*(?:day|days|month|months))\s*(?:money.{0,20}back|guarantee|refund)/gi,
      /money.{0,20}back.{0,20}guarantee/gi,
      /satisfaction.{0,20}guaranteed/gi,
      /risk.{0,15}free/gi,
      /no.{0,10}(?:risk|questions asked)/gi,
      /100[%]?\s*(?:guarantee|satisfaction|refund)/gi,
      /(?:full|complete|total)\s*(?:refund|money back)/gi
    ];

    for (const pattern of guaranteePatterns) {
      const matches = [...markdown.matchAll(pattern)];
      for (const match of matches) {
        guarantees.push(match[0]);
        if (guarantees.length >= 3) break;
      }
    }
    
    return guarantees;
  }

  private static extractDeliveryTime(markdown: string): string {
    const timePatterns = [
      /(?:instant|immediate|within\s+\d+\s+(?:minutes|hours|days))/gi,
      /(?:download|access)\s+(?:immediately|instantly|right away)/gi
    ];

    for (const pattern of timePatterns) {
      const match = markdown.match(pattern);
      if (match) return match[0];
    }
    
    return 'MISSING';
  }

  private static extractResultsTime(markdown: string): string {
    const resultPatterns = [
      /(?:results|benefits|changes)\s+(?:in|within)\s+(\d+\s+(?:days|weeks|months))/gi,
      /(?:see|notice|experience)\s+(?:results|benefits|changes)\s+(?:in|within)\s+(\d+\s+(?:days|weeks|months))/gi
    ];

    for (const pattern of resultPatterns) {
      const match = markdown.match(pattern);
      if (match) return match[1] || match[0];
    }
    
    return 'MISSING';
  }

  private static assessDifficulty(markdown: string): number {
    const easyWords = ['easy', 'simple', 'effortless', 'automatic', 'beginner'];
    const hardWords = ['advanced', 'complex', 'expert', 'difficult', 'challenging'];
    
    const content = markdown.toLowerCase();
    const easyCount = easyWords.filter(word => content.includes(word)).length;
    const hardCount = hardWords.filter(word => content.includes(word)).length;
    
    if (easyCount > hardCount) return 3;
    if (hardCount > easyCount) return 7;
    return 5;
  }

  private static extractPrerequisites(markdown: string): string[] {
    const prerequisites = [];
    const prereqPatterns = [
      /(?:requires?|need|must have)\s+([^.!?\n]{10,80})/gi,
      /(?:prerequisite|requirement):\s*([^.!?\n]{10,80})/gi
    ];

    for (const pattern of prereqPatterns) {
      const matches = [...markdown.matchAll(pattern)];
      for (const match of matches.slice(0, 3)) {
        prerequisites.push(match[1].trim());
      }
    }
    
    return prerequisites;
  }

  private static extractEaseOfUse(markdown: string): string {
    const easePatterns = [
      /(?:easy to use|user.?friendly|simple to operate|intuitive)/gi,
      /(?:plug.?and.?play|one.?click|drag.?and.?drop)/gi
    ];

    for (const pattern of easePatterns) {
      const match = markdown.match(pattern);
      if (match) return match[0];
    }
    
    return 'MISSING';
  }

  private static calculateQualityScore(data: any): number {
    let score = 0;
    
    if (data.productName && data.productName !== 'Unknown Product') score += 0.25;
    if (data.mainBenefit && data.mainBenefit.length > 20) score += 0.25;
    if (data.targetAudience && data.targetAudience.length > 10) score += 0.25;
    if (data.industry && data.industry !== 'General') score += 0.25;
    
    return Math.round(score * 100) / 100;
  }
}

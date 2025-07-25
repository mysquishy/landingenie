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
    const industry = this.classifyIndustry(markdown);
    const category = this.classifyCategory(markdown);
    const pricePoint = this.determinePricePoint(markdown);
    const emotionalOutcome = this.extractEmotionalOutcome(markdown);
    
    // Calculate a better quality score based on what we found
    let qualityScore = 0.3; // Base score
    if (productName !== 'Unknown Product' && productName !== 'Product Analysis') qualityScore += 0.2;
    if (mainBenefit.length > 30 && !mainBenefit.includes('Transform your results')) qualityScore += 0.2;
    if (targetAudience !== 'professionals and entrepreneurs') qualityScore += 0.1;
    if (industry !== 'General') qualityScore += 0.1;
    if (category !== 'info') qualityScore += 0.1;
    
    const missingFields = [];
    if (mainBenefit.includes('Transform your results')) missingFields.push('mainBenefit');
    if (targetAudience === 'professionals and entrepreneurs') missingFields.push('targetAudience');
    if (emotionalOutcome.includes('confidence and success')) missingFields.push('emotionalOutcome');
    
    console.log('Fallback analysis results:', { productName, mainBenefit: mainBenefit.substring(0, 50), qualityScore });
    
    return {
      dreamOutcome: {
        mainBenefit,
        secondaryBenefits: this.extractSecondaryBenefits(markdown),
        targetAudience,
        emotionalOutcome
      },
      perceivedLikelihood: {
        testimonials: this.extractTestimonials(markdown),
        socialProofNumbers: this.extractSocialProof(markdown),
        guarantees: this.extractGuarantees(markdown)
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
        category: this.validateCategory(category) || 'info',
        industry,
        pricePoint: this.validatePricePoint(pricePoint) || 'medium'
      },
      extractionQuality: {
        completenessScore: Math.min(qualityScore, 1.0),
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
    // Try to extract from title first, clean it up
    if (title && title.length > 0 && title !== 'Untitled') {
      const cleanTitle = title
        .replace(/[|\-–—].*$/, '') // Remove everything after separators
        .replace(/\s*[-–—]\s*.*$/, '') // Alternative separator cleanup
        .replace(/^\W+|\W+$/g, '') // Remove leading/trailing non-word chars
        .trim();
      if (cleanTitle.length > 2) {
        return cleanTitle;
      }
    }

    // Extract from first meaningful heading
    const headingMatches = markdown.match(/^#{1,3}\s+(.+)$/gm);
    if (headingMatches) {
      for (const heading of headingMatches) {
        const cleanHeading = heading.replace(/^#+\s+/, '').trim();
        if (cleanHeading.length > 3 && cleanHeading.length < 80 &&
            !cleanHeading.toLowerCase().includes('welcome') &&
            !cleanHeading.toLowerCase().includes('home') &&
            !cleanHeading.toLowerCase().includes('about')) {
          return cleanHeading;
        }
      }
    }

    // Look for product names in strong text or links
    const strongMatches = markdown.match(/\*\*([^*]{3,50})\*\*/g);
    if (strongMatches) {
      for (const match of strongMatches) {
        const clean = match.replace(/\*\*/g, '').trim();
        if (clean.length > 3 && clean.length < 50) {
          return clean;
        }
      }
    }

    // Fallback to first meaningful content line
    const lines = markdown.split('\n')
      .map(line => line.trim())
      .filter(line => line.length > 10 && line.length < 100)
      .filter(line => !line.startsWith('#') && !line.startsWith('*') && !line.startsWith('-'));
    
    return lines[0] || 'Product Analysis';
  }

  private static extractMainBenefit(markdown: string): string {
    // First try to find clear benefit statements
    const benefitPatterns = [
      /(?:get|achieve|learn|discover|unlock|master|increase|improve|boost|grow|build|create|generate|earn|save|transform|eliminate|reduce|stop|prevent|avoid)\s+([^.!?\n]{15,120})/gi,
      /(?:helps? you|allows? you to|enables? you to|designed to help you)\s+([^.!?\n]{15,120})/gi,
      /(?:guaranteed to|proven to|designed to)\s+([^.!?\n]{15,120})/gi,
      /(?:solution (?:for|to)|answer to|key to)\s+([^.!?\n]{15,120})/gi,
      /(?:finally|now you can|you can now)\s+([^.!?\n]{15,120})/gi
    ];

    for (const pattern of benefitPatterns) {
      const matches = [...markdown.matchAll(pattern)];
      if (matches.length > 0) {
        const benefit = matches[0][1].trim();
        if (benefit.length > 20 && !benefit.toLowerCase().includes('undefined')) {
          return benefit;
        }
      }
    }

    // Try to find value propositions in headers
    const headers = markdown.match(/^#{1,3}\s+(.+)$/gm);
    if (headers) {
      for (const header of headers) {
        const cleanHeader = header.replace(/^#+\s+/, '').trim();
        if (cleanHeader.length > 20 && cleanHeader.length < 100) {
          return cleanHeader;
        }
      }
    }

    // Look for compelling first sentences
    const sentences = markdown.split(/[.!?]+/).filter(s => s.trim().length > 30);
    for (const sentence of sentences.slice(0, 5)) {
      const clean = sentence.trim();
      if (clean.length > 30 && clean.length < 150 && 
          !clean.toLowerCase().includes('cookie') && 
          !clean.toLowerCase().includes('privacy') &&
          !clean.toLowerCase().includes('terms')) {
        return clean;
      }
    }

    return 'Transform your results with this powerful solution';
  }

  private static extractTargetAudience(markdown: string): string {
    const audiencePatterns = [
      /(?:for|targeting|designed for|perfect for|ideal for)\s+([^.!?\n]{10,80})/gi,
      /(?:entrepreneurs|business owners|marketers|professionals|students|beginners|experts|coaches|consultants|freelancers|creators)/gi
    ];

    for (const pattern of audiencePatterns) {
      const matches = [...markdown.matchAll(pattern)];
      if (matches.length > 0) {
        return matches[0][1] || matches[0][0];
      }
    }

    return 'professionals and entrepreneurs';
  }

  private static classifyIndustry(markdown: string): string {
    const industryKeywords = {
      'Digital Marketing': ['marketing', 'seo', 'advertising', 'social media', 'email marketing'],
      'Business': ['business', 'entrepreneur', 'startup', 'revenue', 'profit'],
      'Education': ['course', 'training', 'learn', 'education', 'certification'],
      'Health & Fitness': ['health', 'fitness', 'weight loss', 'nutrition', 'workout'],
      'Technology': ['software', 'app', 'tech', 'programming', 'code'],
      'Finance': ['investing', 'money', 'financial', 'trading', 'cryptocurrency']
    };

    const lowercaseContent = markdown.toLowerCase();
    
    for (const [industry, keywords] of Object.entries(industryKeywords)) {
      const matches = keywords.filter(keyword => lowercaseContent.includes(keyword)).length;
      if (matches >= 2) {
        return industry;
      }
    }

    return 'General';
  }

  private static classifyCategory(markdown: string): string {
    const lowercaseContent = markdown.toLowerCase();
    
    if (lowercaseContent.includes('course') || lowercaseContent.includes('training')) {
      return 'education';
    }
    if (lowercaseContent.includes('software') || lowercaseContent.includes('app')) {
      return 'software';
    }
    if (lowercaseContent.includes('service') || lowercaseContent.includes('consulting')) {
      return 'service';
    }
    if (lowercaseContent.includes('book') || lowercaseContent.includes('guide')) {
      return 'info';
    }
    
    return 'product';
  }

  private static determinePricePoint(markdown: string): string {
    const priceMatches = markdown.match(/\$(\d+(?:,\d{3})*(?:\.\d{2})?)/g);
    
    if (priceMatches) {
      const prices = priceMatches.map(p => parseFloat(p.replace(/[$,]/g, '')));
      const maxPrice = Math.max(...prices);
      
      if (maxPrice > 1000) return 'premium';
      if (maxPrice > 200) return 'high';
      if (maxPrice > 50) return 'medium';
      return 'low';
    }

    // Fallback based on content analysis
    const lowercaseContent = markdown.toLowerCase();
    if (lowercaseContent.includes('premium') || lowercaseContent.includes('exclusive')) {
      return 'premium';
    }
    if (lowercaseContent.includes('professional') || lowercaseContent.includes('advanced')) {
      return 'high';
    }
    
    return 'medium';
  }

  private static extractEmotionalOutcome(markdown: string): string {
    const emotionalPatterns = [
      /(?:feel|become|achieve|experience)\s+([^.!?\n]{10,60})/gi,
      /(?:confidence|freedom|success|peace of mind|security|happiness|fulfillment)/gi
    ];

    for (const pattern of emotionalPatterns) {
      const matches = [...markdown.matchAll(pattern)];
      if (matches.length > 0) {
        return matches[0][1] || matches[0][0];
      }
    }

    return 'confidence and success in your goals';
  }

  private static extractSecondaryBenefits(markdown: string): string[] {
    const benefits = [];
    const listItems = markdown.match(/^[*\-+]\s+(.+)$/gm);
    
    if (listItems) {
      for (const item of listItems.slice(0, 5)) {
        const clean = item.replace(/^[*\-+]\s+/, '').trim();
        if (clean.length > 15 && clean.length < 100) {
          benefits.push(clean);
        }
      }
    }
    
    return benefits;
  }

  private static extractTestimonials(markdown: string): string[] {
    const testimonials = [];
    const quoteMatches = markdown.match(/"([^"]{30,200})"/g);
    
    if (quoteMatches) {
      for (const quote of quoteMatches.slice(0, 3)) {
        testimonials.push(quote.replace(/"/g, ''));
      }
    }
    
    return testimonials;
  }

  private static extractSocialProof(markdown: string): string[] {
    const proofNumbers = [];
    const numberPatterns = [
      /(\d+(?:,\d{3})*)\s*(?:customers|users|clients|students|members)/gi,
      /(\d+(?:\.\d+)?[%])\s*(?:success|satisfaction|results)/gi,
      /(\d+(?:,\d{3})*)\s*(?:downloads|sales|reviews)/gi
    ];

    for (const pattern of numberPatterns) {
      const matches = [...markdown.matchAll(pattern)];
      for (const match of matches.slice(0, 3)) {
        proofNumbers.push(match[0]);
      }
    }
    
    return proofNumbers;
  }

  private static extractGuarantees(markdown: string): string[] {
    const guarantees = [];
    const guaranteePatterns = [
      /money.{0,20}back.{0,20}guarantee/gi,
      /(\d+).{0,10}day.{0,10}guarantee/gi,
      /satisfaction.{0,20}guaranteed/gi,
      /risk.{0,10}free/gi
    ];

    for (const pattern of guaranteePatterns) {
      const matches = [...markdown.matchAll(pattern)];
      for (const match of matches) {
        guarantees.push(match[0]);
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

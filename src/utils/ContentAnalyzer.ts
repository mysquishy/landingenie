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
    const { markdown, metadata } = scrapedData;
    
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
          structuredData = await OpenRouterService.analyzeContent(analysisPrompt);
        } else {
          throw new Error('OpenRouter API key not available');
        }
      } catch (openRouterError) {
        console.log('OpenRouter failed, trying Perplexity:', openRouterError);
        const { PerplexityService } = await import('./PerplexityService');
        if (PerplexityService.getApiKey()) {
          console.log('Using Perplexity for content analysis');
          structuredData = await PerplexityService.analyzeContent(analysisPrompt);
        } else {
          throw new Error('No AI service available');
        }
      }
      
      // Validate and ensure all required fields
      return this.validateAndCleanData(structuredData);
    } catch (error) {
      console.error('AI analysis failed, falling back to basic extraction:', error);
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
    const productName = this.extractProductName(markdown, metadata.title);
    const mainBenefit = this.extractMainBenefit(markdown);
    const targetAudience = this.extractTargetAudience(markdown);
    const industry = this.classifyIndustry(markdown);
    const category = this.classifyCategory(markdown);
    const pricePoint = this.determinePricePoint(markdown);
    
    return {
      dreamOutcome: {
        mainBenefit,
        secondaryBenefits: [],
        targetAudience,
        emotionalOutcome: this.extractEmotionalOutcome(markdown)
      },
      perceivedLikelihood: {
        testimonials: [],
        socialProofNumbers: [],
        guarantees: []
      },
      timeDelay: {
        deliveryTimeframe: 'MISSING',
        resultsTimeframe: 'MISSING'
      },
      effortSacrifice: {
        difficultyLevel: 5,
        prerequisites: [],
        easeOfUse: 'MISSING'
      },
      productInfo: {
        name: productName,
        category: this.validateCategory(category) || 'info',
        industry,
        pricePoint: this.validatePricePoint(pricePoint) || 'medium'
      },
      extractionQuality: {
        completenessScore: 0.3,
        confidenceLevel: 'low',
        missingFields: ['secondaryBenefits', 'testimonials', 'guarantees', 'timeDelay', 'effortSacrifice']
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
    // Try to extract from title first
    if (title && title.length > 0 && title !== 'Untitled') {
      return title.replace(/[|\-–—].*$/, '').trim();
    }

    // Extract from first H1 or H2
    const headingMatch = markdown.match(/^#{1,2}\s+(.+)$/m);
    if (headingMatch) {
      return headingMatch[1].trim();
    }

    // Fallback to first meaningful line
    const lines = markdown.split('\n').filter(line => line.trim().length > 10);
    return lines[0]?.trim() || 'Unknown Product';
  }

  private static extractMainBenefit(markdown: string): string {
    // Look for benefit-oriented phrases
    const benefitPatterns = [
      /(?:get|achieve|learn|discover|unlock|master|increase|improve|boost|grow|build|create|generate|earn|save|transform|eliminate)\s+([^.!?\n]{20,100})/gi,
      /(?:helps? you|allows? you to|enables? you to)\s+([^.!?\n]{20,100})/gi,
      /(?:guaranteed to|proven to|designed to)\s+([^.!?\n]{20,100})/gi
    ];

    for (const pattern of benefitPatterns) {
      const matches = [...markdown.matchAll(pattern)];
      if (matches.length > 0) {
        return matches[0][1].trim();
      }
    }

    // Fallback to first paragraph
    const paragraphs = markdown.split('\n\n').filter(p => p.trim().length > 50);
    return paragraphs[0]?.trim().substring(0, 100) + '...' || 'Transform your results';
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

  private static calculateQualityScore(data: any): number {
    let score = 0;
    
    if (data.productName && data.productName !== 'Unknown Product') score += 0.25;
    if (data.mainBenefit && data.mainBenefit.length > 20) score += 0.25;
    if (data.targetAudience && data.targetAudience.length > 10) score += 0.25;
    if (data.industry && data.industry !== 'General') score += 0.25;
    
    return Math.round(score * 100) / 100;
  }
}
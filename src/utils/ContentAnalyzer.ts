export interface ProductData {
  productInfo: {
    name: string;
    category: string;
    industry: string;
    pricePoint: string;
  };
  dreamOutcome: {
    mainBenefit: string;
    targetAudience: string;
    emotionalOutcome: string;
  };
  extractionQuality: {
    completenessScore: number;
    confidenceLevel: string;
  };
}

export class ContentAnalyzer {
  static async analyzeContent(scrapedData: any): Promise<ProductData> {
    const { markdown, metadata } = scrapedData;
    
    // Extract product name from title or first heading
    const productName = this.extractProductName(markdown, metadata.title);
    
    // Extract main benefit from content
    const mainBenefit = this.extractMainBenefit(markdown);
    
    // Determine target audience
    const targetAudience = this.extractTargetAudience(markdown);
    
    // Classify industry and category
    const industry = this.classifyIndustry(markdown);
    const category = this.classifyCategory(markdown);
    
    // Determine price point
    const pricePoint = this.determinePricePoint(markdown);
    
    // Calculate quality score
    const qualityScore = this.calculateQualityScore({
      productName,
      mainBenefit,
      targetAudience,
      industry
    });

    return {
      productInfo: {
        name: productName,
        category,
        industry,
        pricePoint
      },
      dreamOutcome: {
        mainBenefit,
        targetAudience,
        emotionalOutcome: this.extractEmotionalOutcome(markdown)
      },
      extractionQuality: {
        completenessScore: qualityScore,
        confidenceLevel: qualityScore > 0.7 ? 'high' : qualityScore > 0.4 ? 'medium' : 'low'
      }
    };
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
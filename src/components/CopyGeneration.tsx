import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';
import { Progress } from '@/components/ui/progress';
import { useToast } from '@/hooks/use-toast';
import { OpenRouterService } from '@/utils/OpenRouterService';
import { 
  FileText, 
  Zap, 
  RefreshCw, 
  CheckCircle, 
  TrendingUp,
  Target,
  Heart,
  MessageSquare
} from 'lucide-react';

interface CopyGenerationProps {
  productData: any;
  pageType: string;
  onComplete: (generatedCopy: GeneratedCopy) => void;
}

interface GeneratedCopy {
  headline: string;
  subheadline: string;
  heroText: string;
  benefits: string[];
  socialProof: string;
  cta: string;
  urgency: string;
  objectionHandling: string[];
  guarantee: string;
}

const pageTypeLabels = {
  vsl: 'Video Sales Letter',
  freebie: 'Lead Magnet Page', 
  product: 'Product Showcase'
};

export const CopyGeneration = ({ productData, pageType, onComplete }: CopyGenerationProps) => {
  const [isGenerating, setIsGenerating] = useState(false);
  const [progress, setProgress] = useState(0);
  const [currentStage, setCurrentStage] = useState('');
  const [generatedCopy, setGeneratedCopy] = useState<GeneratedCopy | null>(null);
  const [activeTab, setActiveTab] = useState('headline');
  const { toast } = useToast();

  const generatePrompt = (stage: string) => {
    const baseContext = `
Product: ${productData.productInfo.name}
Category: ${productData.productInfo.category}
Page Type: ${pageType}
Main Benefit: ${productData.dreamOutcome.mainBenefit}
Target Audience: ${productData.dreamOutcome.targetAudience}
Emotional Outcome: ${productData.dreamOutcome.emotionalOutcome}
`;

    const prompts = {
      headline: `Create a compelling headline for a ${pageTypeLabels[pageType as keyof typeof pageTypeLabels]} that:
- Uses the value equation (Dream Outcome + Perceived Likelihood) / (Time Delay + Effort & Sacrifice)
- Speaks directly to ${productData.dreamOutcome.targetAudience}
- Promises ${productData.dreamOutcome.mainBenefit}
- Creates urgency and desire

${baseContext}

Return only the headline text, no quotes or formatting.`,

      subheadline: `Create a supporting subheadline that:
- Reinforces the main headline
- Adds credibility with specific benefits
- Builds on the emotional outcome: ${productData.dreamOutcome.emotionalOutcome}
- Maximum 2 sentences

${baseContext}

Return only the subheadline text.`,

      heroText: `Write compelling hero section copy for this ${pageTypeLabels[pageType as keyof typeof pageTypeLabels]} that:
- Opens with a hook that resonates with ${productData.dreamOutcome.targetAudience}
- Tells a relatable story or presents a problem
- Introduces the solution (${productData.productInfo.name})
- Uses conversational, persuasive language
- 150-200 words

${baseContext}

Return only the hero text.`,

      benefits: `List the top 5 benefits of ${productData.productInfo.name} that:
- Go beyond features to emotional outcomes
- Address specific pain points of ${productData.dreamOutcome.targetAudience}
- Use "you will" language
- Are specific and measurable where possible

${baseContext}

Return as a JSON array of benefit strings.`,

      socialProof: `Create social proof copy that includes:
- Customer testimonial quotes (create realistic ones based on the product)
- Usage statistics or social proof numbers
- Trust indicators
- 100-150 words total

${baseContext}

Return only the social proof text.`,

      cta: `Create 3 different call-to-action options for this ${pageTypeLabels[pageType as keyof typeof pageTypeLabels]}:
- One urgent/scarcity-based
- One benefit-focused  
- One risk-reversal focused

${baseContext}

Return as a JSON array of 3 CTA strings.`,

      urgency: `Create urgency copy that:
- Creates legitimate scarcity or time pressure
- Doesn't feel fake or manipulative
- Relates to the product context
- 50-75 words

${baseContext}

Return only the urgency text.`,

      objections: `List the top 3 objections ${productData.dreamOutcome.targetAudience} might have about ${productData.productInfo.name} and provide responses that:
- Acknowledge the concern
- Provide logical counter-arguments
- Offer proof or guarantees

${baseContext}

Return as a JSON array of objection-response pairs: [{"objection": "...", "response": "..."}]`,

      guarantee: `Create a guarantee/risk-reversal statement that:
- Removes risk from the buyer
- Shows confidence in the product
- Is specific and compelling
- 50-100 words

${baseContext}

Return only the guarantee text.`
    };

    return prompts[stage as keyof typeof prompts] || '';
  };

  const generateCopy = async () => {
    setIsGenerating(true);
    setProgress(0);
    
    const stages = [
      'headline', 'subheadline', 'heroText', 'benefits', 
      'socialProof', 'cta', 'urgency', 'objections', 'guarantee'
    ];
    
    const results: any = {};

    try {
      for (let i = 0; i < stages.length; i++) {
        const stage = stages[i];
        setCurrentStage(stage);
        setProgress(((i + 1) / stages.length) * 100);

        const prompt = generatePrompt(stage);
        const response = await OpenRouterService.analyzeContent(prompt, 'anthropic/claude-3.5-sonnet');
        
        // Handle different response types
        if (stage === 'benefits' || stage === 'cta') {
          results[stage] = Array.isArray(response) ? response : JSON.parse(response);
        } else if (stage === 'objections') {
          const objectionData = Array.isArray(response) ? response : JSON.parse(response);
          results['objectionHandling'] = objectionData.map((item: any) => item.response);
        } else {
          results[stage] = typeof response === 'string' ? response : response.content || response;
        }

        // Add small delay for better UX
        await new Promise(resolve => setTimeout(resolve, 500));
      }

      // Format final copy object
      const finalCopy: GeneratedCopy = {
        headline: results.headline,
        subheadline: results.subheadline, 
        heroText: results.heroText,
        benefits: results.benefits,
        socialProof: results.socialProof,
        cta: Array.isArray(results.cta) ? results.cta[0] : results.cta,
        urgency: results.urgency,
        objectionHandling: results.objectionHandling,
        guarantee: results.guarantee
      };

      setGeneratedCopy(finalCopy);
      
      toast({
        title: "Copy Generated Successfully!",
        description: "Your landing page copy is ready for review.",
      });

    } catch (error) {
      console.error('Error generating copy:', error);
      toast({
        title: "Generation Failed",
        description: "There was an error generating your copy. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsGenerating(false);
      setCurrentStage('');
      setProgress(100);
    }
  };

  const handleCopyEdit = (section: keyof GeneratedCopy, newValue: string) => {
    if (!generatedCopy) return;
    
    setGeneratedCopy({
      ...generatedCopy,
      [section]: newValue
    });
  };

  const handleComplete = () => {
    if (generatedCopy) {
      onComplete(generatedCopy);
    }
  };

  return (
    <div className="space-y-6">
      <div className="text-center space-y-2">
        <FileText className="w-12 h-12 mx-auto text-primary" />
        <h2 className="text-2xl font-bold">AI Copy Generation</h2>
        <p className="text-muted-foreground">
          Creating persuasive copy for your {pageTypeLabels[pageType as keyof typeof pageTypeLabels]}
        </p>
      </div>

      {!generatedCopy && (
        <Card className="p-6 bg-gradient-surface border-primary/20">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold">Ready to Generate Copy</h3>
              <Badge variant="secondary">
                {pageTypeLabels[pageType as keyof typeof pageTypeLabels]}
              </Badge>
            </div>
            
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <Target className="w-4 h-4 text-primary" />
                  <span className="font-medium">Product</span>
                </div>
                <p className="text-muted-foreground">{productData.productInfo.name}</p>
              </div>
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <Heart className="w-4 h-4 text-primary" />
                  <span className="font-medium">Main Benefit</span>
                </div>
                <p className="text-muted-foreground text-xs">{productData.dreamOutcome.mainBenefit}</p>
              </div>
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <TrendingUp className="w-4 h-4 text-primary" />
                  <span className="font-medium">Audience</span>
                </div>
                <p className="text-muted-foreground text-xs">{productData.dreamOutcome.targetAudience}</p>
              </div>
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <MessageSquare className="w-4 h-4 text-primary" />
                  <span className="font-medium">Category</span>
                </div>
                <p className="text-muted-foreground">{productData.productInfo.category}</p>
              </div>
            </div>

            {isGenerating ? (
              <div className="space-y-3">
                <div className="flex items-center justify-between text-sm">
                  <span>Generating {currentStage}...</span>
                  <span>{Math.round(progress)}%</span>
                </div>
                <Progress value={progress} className="h-2" />
              </div>
            ) : (
              <Button 
                onClick={generateCopy} 
                variant="hero" 
                size="lg" 
                className="w-full"
              >
                <Zap className="w-4 h-4 mr-2" />
                Generate Landing Page Copy
              </Button>
            )}
          </div>
        </Card>
      )}

      {generatedCopy && (
        <div className="space-y-6">
          <Card className="p-6">
            <Tabs value={activeTab} onValueChange={setActiveTab}>
              <TabsList className="grid grid-cols-4 lg:grid-cols-9 gap-1">
                <TabsTrigger value="headline" className="text-xs">Headline</TabsTrigger>
                <TabsTrigger value="hero" className="text-xs">Hero</TabsTrigger>
                <TabsTrigger value="benefits" className="text-xs">Benefits</TabsTrigger>
                <TabsTrigger value="social" className="text-xs">Social Proof</TabsTrigger>
                <TabsTrigger value="cta" className="text-xs">CTA</TabsTrigger>
                <TabsTrigger value="urgency" className="text-xs">Urgency</TabsTrigger>
                <TabsTrigger value="objections" className="text-xs">Objections</TabsTrigger>
                <TabsTrigger value="guarantee" className="text-xs">Guarantee</TabsTrigger>
                <TabsTrigger value="preview" className="text-xs">Preview</TabsTrigger>
              </TabsList>

              <TabsContent value="headline" className="space-y-4">
                <div>
                  <label className="text-sm font-medium">Main Headline</label>
                  <Textarea
                    value={generatedCopy.headline}
                    onChange={(e) => handleCopyEdit('headline', e.target.value)}
                    className="mt-2"
                    rows={3}
                  />
                </div>
                <div>
                  <label className="text-sm font-medium">Subheadline</label>
                  <Textarea
                    value={generatedCopy.subheadline}
                    onChange={(e) => handleCopyEdit('subheadline', e.target.value)}
                    className="mt-2"
                    rows={2}
                  />
                </div>
              </TabsContent>

              <TabsContent value="hero" className="space-y-4">
                <div>
                  <label className="text-sm font-medium">Hero Section Text</label>
                  <Textarea
                    value={generatedCopy.heroText}
                    onChange={(e) => handleCopyEdit('heroText', e.target.value)}
                    className="mt-2"
                    rows={8}
                  />
                </div>
              </TabsContent>

              <TabsContent value="benefits" className="space-y-4">
                <div>
                  <label className="text-sm font-medium">Key Benefits</label>
                  <div className="space-y-2 mt-2">
                    {generatedCopy.benefits.map((benefit, index) => (
                      <Textarea
                        key={index}
                        value={benefit}
                        onChange={(e) => {
                          const newBenefits = [...generatedCopy.benefits];
                          newBenefits[index] = e.target.value;
                          handleCopyEdit('benefits', newBenefits as any);
                        }}
                        rows={2}
                        placeholder={`Benefit ${index + 1}`}
                      />
                    ))}
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="social" className="space-y-4">
                <div>
                  <label className="text-sm font-medium">Social Proof</label>
                  <Textarea
                    value={generatedCopy.socialProof}
                    onChange={(e) => handleCopyEdit('socialProof', e.target.value)}
                    className="mt-2"
                    rows={6}
                  />
                </div>
              </TabsContent>

              <TabsContent value="cta" className="space-y-4">
                <div>
                  <label className="text-sm font-medium">Call to Action</label>
                  <Textarea
                    value={generatedCopy.cta}
                    onChange={(e) => handleCopyEdit('cta', e.target.value)}
                    className="mt-2"
                    rows={2}
                  />
                </div>
              </TabsContent>

              <TabsContent value="urgency" className="space-y-4">
                <div>
                  <label className="text-sm font-medium">Urgency Text</label>
                  <Textarea
                    value={generatedCopy.urgency}
                    onChange={(e) => handleCopyEdit('urgency', e.target.value)}
                    className="mt-2"
                    rows={3}
                  />
                </div>
              </TabsContent>

              <TabsContent value="objections" className="space-y-4">
                <div>
                  <label className="text-sm font-medium">Objection Handling</label>
                  <div className="space-y-2 mt-2">
                    {generatedCopy.objectionHandling.map((objection, index) => (
                      <Textarea
                        key={index}
                        value={objection}
                        onChange={(e) => {
                          const newObjections = [...generatedCopy.objectionHandling];
                          newObjections[index] = e.target.value;
                          handleCopyEdit('objectionHandling', newObjections as any);
                        }}
                        rows={3}
                        placeholder={`Objection response ${index + 1}`}
                      />
                    ))}
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="guarantee" className="space-y-4">
                <div>
                  <label className="text-sm font-medium">Guarantee/Risk Reversal</label>
                  <Textarea
                    value={generatedCopy.guarantee}
                    onChange={(e) => handleCopyEdit('guarantee', e.target.value)}
                    className="mt-2"
                    rows={4}
                  />
                </div>
              </TabsContent>

              <TabsContent value="preview" className="space-y-6">
                <div className="bg-muted/30 p-6 rounded-lg">
                  <h3 className="text-2xl font-bold mb-2">{generatedCopy.headline}</h3>
                  <p className="text-lg text-muted-foreground mb-4">{generatedCopy.subheadline}</p>
                  <div className="space-y-4 text-sm">
                    <p>{generatedCopy.heroText}</p>
                    <div>
                      <h4 className="font-semibold mb-2">Key Benefits:</h4>
                      <ul className="list-disc list-inside space-y-1">
                        {generatedCopy.benefits.map((benefit, index) => (
                          <li key={index}>{benefit}</li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </div>
              </TabsContent>
            </Tabs>
          </Card>

          <div className="flex gap-4 justify-center">
            <Button 
              variant="outline" 
              onClick={generateCopy}
              disabled={isGenerating}
            >
              <RefreshCw className="w-4 h-4 mr-2" />
              Regenerate Copy
            </Button>
            <Button 
              variant="hero" 
              size="lg" 
              onClick={handleComplete}
            >
              <CheckCircle className="w-4 h-4 mr-2" />
              Continue to Image Selection
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};
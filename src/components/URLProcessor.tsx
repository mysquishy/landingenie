import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { useToast } from '@/hooks/use-toast';
import { CheckCircle, AlertCircle, Loader2, Globe, Key } from 'lucide-react';
import { FirecrawlService } from '@/utils/FirecrawlService';
import { PerplexityService } from '@/utils/PerplexityService';
import { OpenRouterService } from '@/utils/OpenRouterService';
import { ApifyService } from '@/utils/ApifyService';
import { IntelligentScraper } from '@/utils/IntelligentScraper';
import { ContentAnalyzer, type ProductData } from '@/utils/ContentAnalyzer';

interface URLValidation {
  isValid: boolean;
  isAccessible: boolean;
  redirectedURL?: string;
  errorMessage?: string;
}

interface URLProcessorProps {
  onProcessingComplete: (data: any) => void;
}

export const URLProcessor = ({ onProcessingComplete }: URLProcessorProps) => {
  const [url, setUrl] = useState('');
  const [firecrawlApiKey, setFirecrawlApiKey] = useState(FirecrawlService.getApiKey() || '');
  const [perplexityApiKey, setPerplexityApiKey] = useState(PerplexityService.getApiKey() || '');
  const [openRouterApiKey, setOpenRouterApiKey] = useState(OpenRouterService.getApiKey() || '');
  const [selectedModel, setSelectedModel] = useState('openai/gpt-4');
  const [apifyToken, setApifyToken] = useState(ApifyService.getApiToken() || '');
  const [preferredService, setPreferredService] = useState<'auto' | 'firecrawl' | 'apify'>('auto');
  const [isProcessing, setIsProcessing] = useState(false);
  const [validation, setValidation] = useState<URLValidation | null>(null);
  const [progress, setProgress] = useState(0);
  const [showApiKeyInput, setShowApiKeyInput] = useState(!FirecrawlService.getApiKey() || (!PerplexityService.getApiKey() && !OpenRouterService.getApiKey()));
  const { toast } = useToast();

  console.log('URLProcessor rendered - no apiKey reference should exist');

  const validateURL = (url: string): boolean => {
    try {
      new URL(url);
      return true;
    } catch {
      return false;
    }
  };

  const saveApiKeys = () => {
    const hasAiService = perplexityApiKey.trim() || openRouterApiKey.trim();
    
    if (firecrawlApiKey.trim() && hasAiService) {
      FirecrawlService.saveApiKey(firecrawlApiKey.trim());
      
      if (perplexityApiKey.trim()) {
        PerplexityService.saveApiKey(perplexityApiKey.trim());
      }
      
      if (openRouterApiKey.trim()) {
        OpenRouterService.saveApiKey(openRouterApiKey.trim());
      }
      
      if (apifyToken.trim()) {
        ApifyService.saveApiToken(apifyToken.trim());
      }
      
      setShowApiKeyInput(false);
      toast({
        title: "API Keys Saved",
        description: "You can now analyze affiliate URLs with AI-powered analysis",
      });
    } else {
      toast({
        title: "Missing API Keys",
        description: "Please enter Firecrawl key and at least one AI service (Perplexity or OpenRouter)",
        variant: "destructive"
      });
    }
  };

  const processURL = async () => {
    const hasAiService = PerplexityService.getApiKey() || OpenRouterService.getApiKey();
    
    if (!FirecrawlService.getApiKey() || !hasAiService) {
      toast({
        title: "API Keys Required",
        description: "Please enter Firecrawl key and at least one AI service (Perplexity or OpenRouter)",
        variant: "destructive"
      });
      setShowApiKeyInput(true);
      return;
    }

    setIsProcessing(true);
    setProgress(0);
    setValidation(null);

    try {
      // Step 1: Validate URL
      setProgress(10);
      if (!validateURL(url)) {
        setValidation({
          isValid: false,
          isAccessible: false,
          errorMessage: 'Invalid URL format'
        });
        setIsProcessing(false);
        return;
      }

      // Step 2: Intelligent scraping with auto-fallback
      setProgress(20);
      const analysis = IntelligentScraper.analyzeURL(url);
      setValidation({
        isValid: true,
        isAccessible: true,
        redirectedURL: `Using ${analysis.recommendedService} - ${analysis.reasoning}`
      });
      
      setProgress(40);
      const scrapeResult = await IntelligentScraper.scrapeURL(url, preferredService);
      
      if (!scrapeResult.success) {
        setValidation({
          isValid: true,
          isAccessible: false,
          errorMessage: scrapeResult.error || 'Failed to access website'
        });
        setIsProcessing(false);
        return;
      }

      // Step 3: Analyze content with AI
      setProgress(70);
      const productData: ProductData = await ContentAnalyzer.analyzeContent(scrapeResult.data);
      
      // Add scraping metadata
      (productData as any).scrapingMetadata = {
        method: scrapeResult.method,
        qualityScore: scrapeResult.qualityScore,
        processingTime: scrapeResult.processingTime,
        cost: scrapeResult.cost
      };

      // Step 4: Complete
      setProgress(100);
      setValidation({
        isValid: true,
        isAccessible: true,
        redirectedURL: `✅ Extracted using ${scrapeResult.method} (${Math.round((scrapeResult.qualityScore || 0) * 100)}% quality)`
      });

      setTimeout(() => {
        onProcessingComplete(productData);
        toast({
          title: "Analysis Complete",
          description: `Extracted using ${scrapeResult.method} with ${Math.round((scrapeResult.qualityScore || 0) * 100)}% quality score`,
        });
      }, 500);

    } catch (error) {
      console.error('Error processing URL:', error);
      setValidation({
        isValid: false,
        isAccessible: false,
        errorMessage: 'Failed to process URL'
      });
      toast({
        title: "Processing Failed",
        description: "Unable to analyze the URL. Please try again.",
        variant: "destructive"
      });
    }

    setIsProcessing(false);
  };

  return (
    <Card className="p-8 bg-gradient-surface border-primary/20 shadow-card">
      <div className="space-y-6">
        <div className="text-center space-y-2">
          <Globe className="w-12 h-12 mx-auto text-primary" />
          <h2 className="text-2xl font-bold">Analyze Your Affiliate URL</h2>
          <p className="text-muted-foreground">
            Enter any affiliate URL to extract product data and generate high-converting landing pages
          </p>
        </div>

        <div className="space-y-4">
          {showApiKeyInput && (
            <div className="space-y-4 p-4 bg-muted/50 rounded-lg border">
              <div className="space-y-2">
                <label htmlFor="firecrawlApiKey" className="text-sm font-medium flex items-center gap-2">
                  <Key className="w-4 h-4" />
                  Firecrawl API Key
                </label>
                <Input
                  id="firecrawlApiKey"
                  type="password"
                  value={firecrawlApiKey}
                  onChange={(e) => setFirecrawlApiKey(e.target.value)}
                  placeholder="Enter your Firecrawl API key"
                />
                <p className="text-xs text-muted-foreground">
                  Get your API key from{' '}
                  <a href="https://firecrawl.dev" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">
                    firecrawl.dev
                  </a>
                </p>
              </div>
              
              <div className="space-y-2">
                <label htmlFor="perplexityApiKey" className="text-sm font-medium flex items-center gap-2">
                  <Key className="w-4 h-4" />
                  Perplexity API Key (Optional)
                </label>
                <Input
                  id="perplexityApiKey"
                  type="password"
                  value={perplexityApiKey}
                  onChange={(e) => setPerplexityApiKey(e.target.value)}
                  placeholder="Enter your Perplexity API key"
                />
                <p className="text-xs text-muted-foreground">
                  Get your API key from{' '}
                  <a href="https://perplexity.ai" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">
                    perplexity.ai
                  </a>
                </p>
              </div>
              
              <div className="space-y-2">
                <label htmlFor="openRouterApiKey" className="text-sm font-medium flex items-center gap-2">
                  <Key className="w-4 h-4" />
                  OpenRouter API Key (Optional)
                </label>
                <Input
                  id="openRouterApiKey"
                  type="password"
                  value={openRouterApiKey}
                  onChange={(e) => setOpenRouterApiKey(e.target.value)}
                  placeholder="Enter your OpenRouter API key"
                />
                <p className="text-xs text-muted-foreground">
                  Get your API key from{' '}
                  <a href="https://openrouter.ai" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">
                    openrouter.ai
                  </a>
                </p>
              </div>
              
              {openRouterApiKey && (
                <div className="space-y-2">
                  <label htmlFor="selectedModel" className="text-sm font-medium">
                    OpenRouter Model
                  </label>
                  <select
                    id="selectedModel"
                    value={selectedModel}
                    onChange={(e) => setSelectedModel(e.target.value)}
                    className="w-full p-2 border border-input rounded-md bg-background text-foreground"
                  >
                    {OpenRouterService.getAvailableModels().map((model) => (
                      <option key={model.id} value={model.id}>
                        {model.name} - {model.description}
                      </option>
                    ))}
                  </select>
                  <p className="text-xs text-muted-foreground">
                    Choose the AI model for content analysis
                  </p>
                </div>
              )}
              
              <div className="space-y-2">
                <label htmlFor="apifyToken" className="text-sm font-medium flex items-center gap-2">
                  <Key className="w-4 h-4" />
                  Apify Token (Optional)
                </label>
                <Input
                  id="apifyToken"
                  type="password"
                  value={apifyToken}
                  onChange={(e) => setApifyToken(e.target.value)}
                  placeholder="Enter your Apify token"
                />
                <p className="text-xs text-muted-foreground">
                  For complex JavaScript sites. Get token from{' '}
                  <a href="https://apify.com" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">
                    apify.com
                  </a>
                </p>
              </div>
              
              <div className="space-y-2">
                <label htmlFor="preferredService" className="text-sm font-medium">
                  Preferred Service
                </label>
                <select
                  id="preferredService"
                  value={preferredService}
                  onChange={(e) => setPreferredService(e.target.value as 'auto' | 'firecrawl' | 'apify')}
                  className="w-full p-2 border border-input rounded-md bg-background text-foreground"
                >
                  <option value="auto">Auto-select best service</option>
                  <option value="firecrawl">Always use Firecrawl</option>
                  <option value="apify">Always use Apify (requires token)</option>
                </select>
                <p className="text-xs text-muted-foreground">
                  Auto-selection uses Firecrawl for most sites, Apify for complex platforms
                </p>
              </div>
              
              <Button onClick={saveApiKeys} variant="outline" className="w-full">
                Save API Keys
              </Button>
            </div>
          )}

          <div className="space-y-2">
            <label htmlFor="url" className="text-sm font-medium">
              Product or Sales Page URL
            </label>
            <Input
              id="url"
              type="url"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="https://example.com/product-page"
              className="h-12 text-lg"
              disabled={isProcessing}
            />
          </div>

          {isProcessing && (
            <div className="space-y-3">
              <Progress value={progress} className="h-3" />
              <div className="text-center text-sm text-muted-foreground">
                {progress < 25 && "Validating URL..."}
                {progress >= 25 && progress < 50 && "Extracting content..."}
                {progress >= 50 && progress < 75 && "Analyzing product data..."}
                {progress >= 75 && "Generating insights..."}
              </div>
            </div>
          )}

          {validation && (
            <div className={`flex items-center gap-2 p-3 rounded-lg ${
              validation.isValid 
                ? 'bg-success/10 text-success border border-success/20' 
                : 'bg-destructive/10 text-destructive border border-destructive/20'
            }`}>
              {validation.isValid ? (
                <CheckCircle className="w-5 h-5" />
              ) : (
                <AlertCircle className="w-5 h-5" />
              )}
              <span className="text-sm">
                {validation.isValid 
                  ? 'URL validated and content extracted successfully'
                  : validation.errorMessage
                }
              </span>
            </div>
          )}

          <Button
            onClick={processURL}
            disabled={!url || isProcessing}
            variant="hero"
            size="lg"
            className="w-full h-12"
          >
            {isProcessing ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                Processing...
              </>
            ) : (
              'Analyze URL'
            )}
          </Button>
        </div>
      </div>
    </Card>
  );
};
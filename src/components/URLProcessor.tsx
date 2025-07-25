import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { useToast } from '@/hooks/use-toast';
import { CheckCircle, AlertCircle, Loader2, Globe } from 'lucide-react';

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
  const [isProcessing, setIsProcessing] = useState(false);
  const [validation, setValidation] = useState<URLValidation | null>(null);
  const [progress, setProgress] = useState(0);
  const { toast } = useToast();

  const validateURL = (url: string): boolean => {
    try {
      new URL(url);
      return true;
    } catch {
      return false;
    }
  };

  const simulateProcessing = async () => {
    setIsProcessing(true);
    setProgress(0);

    // Simulate validation
    await new Promise(resolve => setTimeout(resolve, 1000));
    setProgress(25);

    if (!validateURL(url)) {
      setValidation({
        isValid: false,
        isAccessible: false,
        errorMessage: 'Invalid URL format'
      });
      setIsProcessing(false);
      return;
    }

    // Simulate scraping
    await new Promise(resolve => setTimeout(resolve, 1500));
    setProgress(50);

    // Simulate analysis
    await new Promise(resolve => setTimeout(resolve, 2000));
    setProgress(75);

    // Simulate completion
    await new Promise(resolve => setTimeout(resolve, 1000));
    setProgress(100);

    setValidation({
      isValid: true,
      isAccessible: true,
      redirectedURL: url
    });

    const mockData = {
      productInfo: {
        name: "Premium Marketing Course",
        category: "education",
        industry: "Digital Marketing",
        pricePoint: "high"
      },
      dreamOutcome: {
        mainBenefit: "10x Your Marketing ROI in 90 Days",
        targetAudience: "Small business owners and marketers",
        emotionalOutcome: "Financial freedom and business growth"
      },
      extractionQuality: {
        completenessScore: 0.85,
        confidenceLevel: "high"
      }
    };

    setTimeout(() => {
      onProcessingComplete(mockData);
      toast({
        title: "Processing Complete",
        description: "URL analyzed successfully",
      });
    }, 500);

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
            onClick={simulateProcessing}
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
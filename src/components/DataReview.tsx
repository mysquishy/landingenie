import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { CheckCircle, TrendingUp, Users, Clock, Zap } from 'lucide-react';

interface ProductData {
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

interface DataReviewProps {
  data: ProductData;
  onConfirm: () => void;
}

export const DataReview = ({ data, onConfirm }: DataReviewProps) => {
  const getQualityColor = (score: number) => {
    if (score >= 0.8) return 'text-success';
    if (score >= 0.6) return 'text-warning';
    return 'text-destructive';
  };

  const getQualityLabel = (score: number) => {
    if (score >= 0.8) return 'Excellent';
    if (score >= 0.6) return 'Good';
    return 'Needs Review';
  };

  return (
    <div className="space-y-6">
      <div className="text-center space-y-2">
        <CheckCircle className="w-12 h-12 mx-auto text-success" />
        <h2 className="text-2xl font-bold">Product Data Extracted</h2>
        <p className="text-muted-foreground">
          Review the extracted data before generating your landing page
        </p>
      </div>

      <Card className="p-6 bg-gradient-surface border-primary/20 shadow-card">
        <div className="space-y-6">
          {/* Quality Score */}
          <div className="flex items-center justify-between p-4 bg-primary/5 rounded-lg border border-primary/20">
            <div>
              <h3 className="font-semibold">Extraction Quality</h3>
              <p className="text-sm text-muted-foreground">
                Confidence: {data.extractionQuality.confidenceLevel}
              </p>
            </div>
            <div className="text-right">
              <div className={`text-2xl font-bold ${getQualityColor(data.extractionQuality.completenessScore)}`}>
                {Math.round(data.extractionQuality.completenessScore * 100)}%
              </div>
              <Badge variant="secondary">
                {getQualityLabel(data.extractionQuality.completenessScore)}
              </Badge>
            </div>
          </div>

          {/* Product Info */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <h3 className="text-lg font-semibold flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-primary" />
                Product Information
              </h3>
              <div className="space-y-3">
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Product Name</label>
                  <p className="font-medium">{data.productInfo.name}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Category</label>
                  <Badge variant="outline" className="ml-2">
                    {data.productInfo.category}
                  </Badge>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Industry</label>
                  <p className="font-medium">{data.productInfo.industry}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Price Point</label>
                  <Badge variant="secondary" className="ml-2">
                    {data.productInfo.pricePoint}
                  </Badge>
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <h3 className="text-lg font-semibold flex items-center gap-2">
                <Zap className="w-5 h-5 text-primary" />
                Value Proposition
              </h3>
              <div className="space-y-3">
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Main Benefit</label>
                  <p className="font-medium">{data.dreamOutcome.mainBenefit}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Target Audience</label>
                  <div className="flex items-center gap-2">
                    <Users className="w-4 h-4 text-muted-foreground" />
                    <p className="font-medium">{data.dreamOutcome.targetAudience}</p>
                  </div>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Emotional Outcome</label>
                  <p className="font-medium">{data.dreamOutcome.emotionalOutcome}</p>
                </div>
              </div>
            </div>
          </div>

          <div className="flex justify-center pt-4">
            <Button onClick={onConfirm} variant="hero" size="lg">
              Continue to Page Generation
            </Button>
          </div>
        </div>
      </Card>
    </div>
  );
};
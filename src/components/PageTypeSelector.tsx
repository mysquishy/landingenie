import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Video, Download, ShoppingBag, Sparkles } from 'lucide-react';

interface PageTypeOption {
  type: 'vsl' | 'freebie' | 'product';
  title: string;
  description: string;
  icon: React.ReactNode;
  recommended: boolean;
  features: string[];
}

interface PageTypeSelectorProps {
  onSelect: (type: string) => void;
}

export const PageTypeSelector = ({ onSelect }: PageTypeSelectorProps) => {
  const [selectedType, setSelectedType] = useState<string | null>(null);

  const pageTypes: PageTypeOption[] = [
    {
      type: 'vsl',
      title: 'Video Sales Letter',
      description: 'High-converting video-focused landing page perfect for complex, high-ticket offers',
      icon: <Video className="w-8 h-8" />,
      recommended: true,
      features: [
        'Video thumbnail with play overlay',
        'Story-driven copy structure', 
        'Social proof integration',
        'Strong urgency elements'
      ]
    },
    {
      type: 'freebie',
      title: 'Lead Magnet Page',
      description: 'Capture leads with irresistible free downloads and valuable content offers',
      icon: <Download className="w-8 h-8" />,
      recommended: false,
      features: [
        'Download preview mockups',
        'Benefit-focused headlines',
        'Simple opt-in forms',
        'Trust badges and guarantees'
      ]
    },
    {
      type: 'product',
      title: 'Product Showcase',
      description: 'Direct product sales page with clear features, benefits, and strong CTAs',
      icon: <ShoppingBag className="w-8 h-8" />,
      recommended: false,
      features: [
        'Product hero images',
        'Feature/benefit comparisons',
        'Customer testimonials',
        'Multiple CTA placements'
      ]
    }
  ];

  const handleSelect = (type: string) => {
    setSelectedType(type);
  };

  const handleContinue = () => {
    if (selectedType) {
      onSelect(selectedType);
    }
  };

  return (
    <div className="space-y-6">
      <div className="text-center space-y-2">
        <Sparkles className="w-12 h-12 mx-auto text-primary" />
        <h2 className="text-2xl font-bold">Choose Your Landing Page Type</h2>
        <p className="text-muted-foreground">
          AI recommends the best page type based on your product analysis
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {pageTypes.map((pageType) => (
          <Card
            key={pageType.type}
            className={`p-6 cursor-pointer transition-all duration-300 hover:shadow-elegant ${
              selectedType === pageType.type
                ? 'border-primary bg-primary/5 shadow-glow'
                : 'bg-gradient-surface border-primary/20 hover:border-primary/40'
            }`}
            onClick={() => handleSelect(pageType.type)}
          >
            <div className="space-y-4">
              <div className="flex items-start justify-between">
                <div className={`p-3 rounded-lg ${
                  selectedType === pageType.type 
                    ? 'bg-primary text-primary-foreground' 
                    : 'bg-primary/10 text-primary'
                }`}>
                  {pageType.icon}
                </div>
                {pageType.recommended && (
                  <Badge className="bg-gradient-primary text-primary-foreground">
                    AI Recommended
                  </Badge>
                )}
              </div>

              <div>
                <h3 className="text-lg font-semibold mb-2">{pageType.title}</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  {pageType.description}
                </p>
              </div>

              <div className="space-y-2">
                <h4 className="text-sm font-medium">Key Features:</h4>
                <ul className="space-y-1">
                  {pageType.features.map((feature, index) => (
                    <li key={index} className="text-xs text-muted-foreground flex items-center gap-2">
                      <div className="w-1 h-1 bg-primary rounded-full" />
                      {feature}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </Card>
        ))}
      </div>

      {selectedType && (
        <div className="flex justify-center">
          <Button onClick={handleContinue} variant="hero" size="lg">
            Generate Copy for {pageTypes.find(p => p.type === selectedType)?.title}
          </Button>
        </div>
      )}
    </div>
  );
};
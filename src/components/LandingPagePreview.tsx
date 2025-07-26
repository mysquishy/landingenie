import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import { 
  Eye, 
  Code, 
  Download, 
  Share,
  Monitor,
  Smartphone,
  Tablet,
  CheckCircle,
  Star,
  Quote,
  ShoppingCart,
  Play
} from 'lucide-react';

interface LandingPagePreviewProps {
  productData: any;
  pageType: string;
  generatedCopy: any;
  selectedImages: any;
  onComplete: () => void;
}

export const LandingPagePreview = ({ 
  productData, 
  pageType, 
  generatedCopy, 
  selectedImages,
  onComplete 
}: LandingPagePreviewProps) => {
  const [viewMode, setViewMode] = useState<'desktop' | 'tablet' | 'mobile'>('desktop');
  const [activeTab, setActiveTab] = useState('preview');
  const { toast } = useToast();

  const getViewportClasses = () => {
    switch (viewMode) {
      case 'mobile': return 'w-full max-w-sm mx-auto';
      case 'tablet': return 'w-full max-w-2xl mx-auto';
      default: return 'w-full';
    }
  };

  const handleExport = (format: 'html' | 'pdf' | 'image') => {
    toast({
      title: "Export Started",
      description: `Preparing your landing page in ${format.toUpperCase()} format...`,
    });
    
    // Simulate export process
    setTimeout(() => {
      toast({
        title: "Export Complete!",
        description: `Your landing page has been exported as ${format.toUpperCase()}.`,
      });
    }, 2000);
  };

  const renderVSLPage = () => (
    <div className="space-y-8">
      {/* Hero Section with Video */}
      <section 
        className="relative min-h-screen flex items-center justify-center bg-cover bg-center"
        style={{ backgroundImage: `linear-gradient(rgba(0,0,0,0.4), rgba(0,0,0,0.4)), url(${selectedImages.hero})` }}
      >
        <div className="container mx-auto px-4 text-center text-white">
          <h1 className="text-4xl md:text-6xl font-bold mb-4">
            {generatedCopy.headline}
          </h1>
          <p className="text-xl md:text-2xl mb-8 opacity-90">
            {generatedCopy.subheadline}
          </p>
          
          {/* Video Player Mockup */}
          <div className="max-w-4xl mx-auto bg-black rounded-lg overflow-hidden mb-8">
            <div className="aspect-video flex items-center justify-center bg-gradient-to-br from-gray-800 to-gray-900">
              <Button variant="ghost" size="lg" className="text-white hover:bg-white/20">
                <Play className="w-12 h-12" />
              </Button>
            </div>
          </div>
          
          <Button size="lg" className="bg-primary text-white hover:bg-primary/90 px-8 py-4 text-lg">
            {generatedCopy.cta}
          </Button>
        </div>
      </section>

      {/* Story/Benefits Section */}
      <section className="py-16 bg-background">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            <div className="prose prose-lg mx-auto mb-12">
              {generatedCopy.heroText.split('\n').map((paragraph: string, index: number) => (
                <p key={index} className="mb-4">{paragraph}</p>
              ))}
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {generatedCopy.benefits.slice(0, 6).map((benefit: string, index: number) => (
                <div key={index} className="flex items-start gap-3 p-4 bg-muted/30 rounded-lg">
                  <CheckCircle className="w-6 h-6 text-primary flex-shrink-0 mt-1" />
                  <p className="text-sm">{benefit}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Social Proof */}
      <section className="py-16 bg-muted/20">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl font-bold mb-8">What Our Customers Say</h2>
          <div className="max-w-2xl mx-auto">
            <Quote className="w-8 h-8 text-primary mx-auto mb-4" />
            <div className="prose mx-auto">
              {generatedCopy.socialProof.split('\n').map((line: string, index: number) => (
                <p key={index} className="mb-2">{line}</p>
              ))}
            </div>
            <div className="flex justify-center mt-4">
              {[1,2,3,4,5].map((star) => (
                <Star key={star} className="w-5 h-5 text-yellow-400 fill-current" />
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Urgency & CTA */}
      <section className="py-16 bg-primary text-primary-foreground">
        <div className="container mx-auto px-4 text-center">
          <div className="max-w-2xl mx-auto">
            <h2 className="text-3xl font-bold mb-4">Don't Wait - Act Now!</h2>
            <p className="text-lg mb-6 opacity-90">{generatedCopy.urgency}</p>
            <Button size="lg" variant="secondary" className="px-8 py-4 text-lg">
              <ShoppingCart className="w-5 h-5 mr-2" />
              {generatedCopy.cta}
            </Button>
            <p className="text-sm mt-4 opacity-75">{generatedCopy.guarantee}</p>
          </div>
        </div>
      </section>
    </div>
  );

  const renderFreebiePage = () => (
    <div className="space-y-8">
      {/* Hero Section */}
      <section 
        className="relative min-h-screen flex items-center justify-center bg-cover bg-center"
        style={{ backgroundImage: `linear-gradient(rgba(0,0,0,0.3), rgba(0,0,0,0.3)), url(${selectedImages.hero})` }}
      >
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
            <div className="text-white">
              <h1 className="text-4xl md:text-5xl font-bold mb-4">
                {generatedCopy.headline}
              </h1>
              <p className="text-xl mb-6 opacity-90">
                {generatedCopy.subheadline}
              </p>
              <div className="prose text-white/80 mb-8">
                {generatedCopy.heroText.split('\n').slice(0, 2).map((line: string, index: number) => (
                  <p key={index}>{line}</p>
                ))}
              </div>
            </div>
            
            {/* Opt-in Form */}
            <Card className="p-8 bg-white">
              <h3 className="text-2xl font-bold mb-4 text-center">Get Your Free Download</h3>
              <div className="space-y-4">
                <input 
                  type="text" 
                  placeholder="Enter your name" 
                  className="w-full p-3 border rounded-lg"
                />
                <input 
                  type="email" 
                  placeholder="Enter your email" 
                  className="w-full p-3 border rounded-lg"
                />
                <Button className="w-full" size="lg">
                  <Download className="w-5 h-5 mr-2" />
                  Download Now - 100% Free
                </Button>
                <p className="text-xs text-center text-muted-foreground">
                  No spam. Unsubscribe anytime.
                </p>
              </div>
            </Card>
          </div>
        </div>
      </section>

      {/* Benefits */}
      <section className="py-16">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-bold text-center mb-12">What You'll Get Inside</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {generatedCopy.benefits.map((benefit: string, index: number) => (
              <div key={index} className="text-center p-6 bg-muted/30 rounded-lg">
                <div className="w-12 h-12 bg-primary rounded-full flex items-center justify-center mx-auto mb-4">
                  <CheckCircle className="w-6 h-6 text-primary-foreground" />
                </div>
                <p className="font-medium">{benefit}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Social Proof */}
      <section className="py-16 bg-muted/20">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl font-bold mb-8">Join Thousands of Others</h2>
          <div className="max-w-2xl mx-auto bg-white p-8 rounded-lg">
            <div className="prose mx-auto">
              {generatedCopy.socialProof.split('\n').map((line: string, index: number) => (
                <p key={index} className="mb-2">{line}</p>
              ))}
            </div>
          </div>
        </div>
      </section>
    </div>
  );

  const renderProductPage = () => (
    <div className="space-y-8">
      {/* Hero Product Section */}
      <section className="py-16">
        <div className="container mx-auto px-4">
          <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div>
              <h1 className="text-4xl md:text-5xl font-bold mb-4">
                {generatedCopy.headline}
              </h1>
              <p className="text-xl mb-6 text-muted-foreground">
                {generatedCopy.subheadline}
              </p>
              <div className="prose mb-8">
                {generatedCopy.heroText.split('\n').slice(0, 3).map((line: string, index: number) => (
                  <p key={index}>{line}</p>
                ))}
              </div>
              <Button size="lg" className="px-8 py-4 text-lg">
                <ShoppingCart className="w-5 h-5 mr-2" />
                {generatedCopy.cta}
              </Button>
            </div>
            <div className="relative">
              <img 
                src={selectedImages.hero} 
                alt="Product"
                className="w-full rounded-lg shadow-2xl"
              />
            </div>
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section className="py-16 bg-muted/20">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-bold text-center mb-12">Key Benefits</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {generatedCopy.benefits.map((benefit: string, index: number) => (
              <Card key={index} className="p-6 text-center">
                <div className="w-12 h-12 bg-primary rounded-full flex items-center justify-center mx-auto mb-4">
                  <span className="text-primary-foreground font-bold">{index + 1}</span>
                </div>
                <h3 className="font-semibold mb-2">Benefit {index + 1}</h3>
                <p className="text-sm text-muted-foreground">{benefit}</p>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="py-16">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-bold text-center mb-12">Customer Reviews</h2>
          <div className="max-w-4xl mx-auto">
            <Card className="p-8 text-center">
              <Quote className="w-8 h-8 text-primary mx-auto mb-4" />
              <div className="prose mx-auto mb-6">
                {generatedCopy.socialProof.split('\n').map((line: string, index: number) => (
                  <p key={index}>{line}</p>
                ))}
              </div>
              <div className="flex justify-center mb-4">
                {[1,2,3,4,5].map((star) => (
                  <Star key={star} className="w-5 h-5 text-yellow-400 fill-current" />
                ))}
              </div>
            </Card>
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="py-16 bg-primary text-primary-foreground">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl font-bold mb-4">Ready to Get Started?</h2>
          <p className="text-lg mb-6 opacity-90">{generatedCopy.urgency}</p>
          <Button size="lg" variant="secondary" className="px-8 py-4 text-lg mb-4">
            <ShoppingCart className="w-5 h-5 mr-2" />
            {generatedCopy.cta}
          </Button>
          <p className="text-sm opacity-75">{generatedCopy.guarantee}</p>
        </div>
      </section>
    </div>
  );

  const renderPreview = () => {
    switch (pageType) {
      case 'vsl': return renderVSLPage();
      case 'freebie': return renderFreebiePage();
      case 'product': return renderProductPage();
      default: return renderVSLPage();
    }
  };

  const generateHTMLCode = () => {
    return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${generatedCopy.headline}</title>
    <script src="https://cdn.tailwindcss.com"></script>
</head>
<body>
    <!-- Generated Landing Page -->
    <div class="min-h-screen">
        <!-- Hero Section -->
        <section class="relative min-h-screen flex items-center justify-center bg-cover bg-center" 
                 style="background-image: linear-gradient(rgba(0,0,0,0.4), rgba(0,0,0,0.4)), url('${selectedImages.hero}')">
            <div class="container mx-auto px-4 text-center text-white">
                <h1 class="text-4xl md:text-6xl font-bold mb-4">${generatedCopy.headline}</h1>
                <p class="text-xl md:text-2xl mb-8 opacity-90">${generatedCopy.subheadline}</p>
                <button class="bg-blue-600 text-white px-8 py-4 rounded-lg text-lg hover:bg-blue-700">
                    ${generatedCopy.cta}
                </button>
            </div>
        </section>
        
        <!-- Add more sections as needed -->
    </div>
</body>
</html>`;
  };

  return (
    <div className="space-y-6">
      <div className="text-center space-y-2">
        <Eye className="w-12 h-12 mx-auto text-primary" />
        <h2 className="text-2xl font-bold">Landing Page Preview</h2>
        <p className="text-muted-foreground">
          Review your generated landing page and export when ready
        </p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid grid-cols-2">
          <TabsTrigger value="preview">Live Preview</TabsTrigger>
          <TabsTrigger value="code">Export Code</TabsTrigger>
        </TabsList>

        <TabsContent value="preview" className="space-y-4">
          {/* Viewport Controls */}
          <div className="flex justify-center gap-2">
            <Button
              variant={viewMode === 'desktop' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setViewMode('desktop')}
            >
              <Monitor className="w-4 h-4 mr-2" />
              Desktop
            </Button>
            <Button
              variant={viewMode === 'tablet' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setViewMode('tablet')}
            >
              <Tablet className="w-4 h-4 mr-2" />
              Tablet
            </Button>
            <Button
              variant={viewMode === 'mobile' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setViewMode('mobile')}
            >
              <Smartphone className="w-4 h-4 mr-2" />
              Mobile
            </Button>
          </div>

          {/* Preview Window */}
          <div className="border rounded-lg overflow-hidden bg-white">
            <div className={getViewportClasses()}>
              <div className="min-h-screen overflow-y-auto">
                {renderPreview()}
              </div>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="code" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Button
              onClick={() => handleExport('html')}
              variant="outline"
              className="p-6 h-auto flex-col"
            >
              <Code className="w-8 h-8 mb-2" />
              <span className="font-medium">HTML Export</span>
              <span className="text-xs text-muted-foreground">Complete HTML file</span>
            </Button>
            
            <Button
              onClick={() => handleExport('pdf')}
              variant="outline"
              className="p-6 h-auto flex-col"
            >
              <Download className="w-8 h-8 mb-2" />
              <span className="font-medium">PDF Export</span>
              <span className="text-xs text-muted-foreground">Printable version</span>
            </Button>
            
            <Button
              onClick={() => handleExport('image')}
              variant="outline"
              className="p-6 h-auto flex-col"
            >
              <Share className="w-8 h-8 mb-2" />
              <span className="font-medium">Image Export</span>
              <span className="text-xs text-muted-foreground">PNG/JPG mockup</span>
            </Button>
          </div>

          <Card className="p-4">
            <h3 className="font-semibold mb-2">HTML Code Preview</h3>
            <pre className="bg-muted p-4 rounded text-xs overflow-auto max-h-64">
              {generateHTMLCode()}
            </pre>
          </Card>
        </TabsContent>
      </Tabs>

      <Card className="p-4 bg-gradient-surface border-primary/20">
        <h3 className="font-semibold mb-2">Project Summary</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
          <div>
            <span className="font-medium">Product:</span>
            <p className="text-muted-foreground">{productData.productInfo.name}</p>
          </div>
          <div>
            <span className="font-medium">Page Type:</span>
            <p className="text-muted-foreground">{pageType === 'vsl' ? 'Video Sales Letter' : pageType === 'freebie' ? 'Lead Magnet' : 'Product Showcase'}</p>
          </div>
          <div>
            <span className="font-medium">Quality Score:</span>
            <p className="text-muted-foreground">{Math.round(productData.extractionQuality.completenessScore * 100)}%</p>
          </div>
          <div>
            <span className="font-medium">Images:</span>
            <p className="text-muted-foreground">{Object.values(selectedImages).filter(Boolean).length} selected</p>
          </div>
        </div>
      </Card>

      <div className="flex justify-center">
        <Button 
          onClick={onComplete}
          variant="hero" 
          size="lg"
        >
          <CheckCircle className="w-4 h-4 mr-2" />
          Complete Project
        </Button>
      </div>
    </div>
  );
};
import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { 
  ImageIcon, 
  Sparkles, 
  Upload, 
  Search,
  CheckCircle,
  RefreshCw,
  Zap,
  Download
} from 'lucide-react';

interface ImageSelectionProps {
  productData: any;
  pageType: string;
  generatedCopy: any;
  onComplete: (selectedImages: SelectedImages) => void;
}

interface SelectedImages {
  hero: string;
  product?: string;
  testimonial?: string;
  background?: string;
  icons: string[];
}

interface GeneratedImage {
  id: string;
  url: string;
  prompt: string;
  type: 'hero' | 'product' | 'testimonial' | 'background' | 'icon';
}

const placeholderImages = {
  tech: [
    'https://images.unsplash.com/photo-1488590528505-98d2b5aba04b?w=800&h=600&fit=crop',
    'https://images.unsplash.com/photo-1461749280684-dccba630e2f6?w=800&h=600&fit=crop',
    'https://images.unsplash.com/photo-1487058792275-0ad4aaf24ca7?w=800&h=600&fit=crop'
  ],
  business: [
    'https://images.unsplash.com/photo-1531297484001-80022131f5a1?w=800&h=600&fit=crop',
    'https://images.unsplash.com/photo-1498050108023-c5249f4df085?w=800&h=600&fit=crop',
    'https://images.unsplash.com/photo-1483058712412-4245e9b90334?w=800&h=600&fit=crop'
  ],
  health: [
    'https://images.unsplash.com/photo-1559757148-5c350d0d3c56?w=800&h=600&fit=crop',
    'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=800&h=600&fit=crop',
    'https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?w=800&h=600&fit=crop'
  ],
  fitness: [
    'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=800&h=600&fit=crop',
    'https://images.unsplash.com/photo-1541534741688-6078c6bfb5c5?w=800&h=600&fit=crop',
    'https://images.unsplash.com/photo-1549476464-37392f717541?w=800&h=600&fit=crop'
  ]
};

export const ImageSelection = ({ productData, pageType, generatedCopy, onComplete }: ImageSelectionProps) => {
  const [selectedImages, setSelectedImages] = useState<SelectedImages>({
    hero: '',
    icons: []
  });
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedImages, setGeneratedImages] = useState<GeneratedImage[]>([]);
  const [activeTab, setActiveTab] = useState('hero');
  const [customPrompt, setCustomPrompt] = useState('');
  const { toast } = useToast();

  // Get relevant placeholder images based on product category
  const getPlaceholderImages = () => {
    const category = productData.productInfo.category.toLowerCase();
    if (category.includes('tech') || category.includes('software')) return placeholderImages.tech;
    if (category.includes('business') || category.includes('finance')) return placeholderImages.business;
    if (category.includes('health') || category.includes('wellness')) return placeholderImages.health;
    if (category.includes('fitness') || category.includes('workout')) return placeholderImages.fitness;
    return placeholderImages.business; // Default
  };

  const generateImagePrompts = () => {
    const productName = productData.productInfo.name;
    const category = productData.productInfo.category;
    const targetAudience = productData.dreamOutcome.targetAudience;
    
    return {
      hero: `Professional hero image for ${category} landing page featuring ${targetAudience}, clean modern design, high quality, inspiring and trustworthy, ${pageType === 'vsl' ? 'with space for video player overlay' : 'showcasing the main benefit'}, 16:9 aspect ratio`,
      
      product: `Product showcase image of ${productName} in ${category} category, professional product photography, clean background, high quality, detailed view, commercial style`,
      
      testimonial: `Professional headshot photos of diverse happy customers using ${category} products, authentic expressions, various ages and backgrounds, high quality portrait photography`,
      
      background: `Subtle background pattern or texture suitable for ${category} landing page, modern, clean, not distracting, professional color scheme`,
      
      icons: `Simple modern icons representing benefits of ${category} products, minimalist style, consistent design, vector-style icons`
    };
  };

  const simulateImageGeneration = async (type: keyof ReturnType<typeof generateImagePrompts>) => {
    setIsGenerating(true);
    
    try {
      // Simulate API call delay
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      const prompts = generateImagePrompts();
      const placeholder = getPlaceholderImages();
      
      // For demo purposes, use placeholder images
      const newImages: GeneratedImage[] = [
        {
          id: `${type}-1`,
          url: placeholder[0],
          prompt: prompts[type],
          type: type as any
        },
        {
          id: `${type}-2`, 
          url: placeholder[1],
          prompt: prompts[type],
          type: type as any
        },
        {
          id: `${type}-3`,
          url: placeholder[2], 
          prompt: prompts[type],
          type: type as any
        }
      ];
      
      setGeneratedImages(prev => [...prev.filter(img => img.type !== type), ...newImages]);
      
      toast({
        title: "Images Generated!",
        description: `Generated ${newImages.length} ${type} images for your landing page.`,
      });
      
    } catch (error) {
      toast({
        title: "Generation Failed",
        description: "There was an error generating images. Using placeholder images instead.",
        variant: "destructive",
      });
    } finally {
      setIsGenerating(false);
    }
  };

  const generateCustomImage = async () => {
    if (!customPrompt.trim()) {
      toast({
        title: "Enter a Prompt",
        description: "Please enter a description for the image you want to generate.",
        variant: "destructive",
      });
      return;
    }

    setIsGenerating(true);
    
    try {
      await new Promise(resolve => setTimeout(resolve, 3000));
      
      const placeholder = getPlaceholderImages();
      const newImage: GeneratedImage = {
        id: `custom-${Date.now()}`,
        url: placeholder[0],
        prompt: customPrompt,
        type: 'hero'
      };
      
      setGeneratedImages(prev => [newImage, ...prev]);
      setCustomPrompt('');
      
      toast({
        title: "Custom Image Generated!",
        description: "Your custom image has been created.",
      });
      
    } catch (error) {
      toast({
        title: "Generation Failed", 
        description: "There was an error generating your custom image.",
        variant: "destructive",
      });
    } finally {
      setIsGenerating(false);
    }
  };

  const selectImage = (imageUrl: string, type: keyof SelectedImages) => {
    if (type === 'icons') {
      setSelectedImages(prev => ({
        ...prev,
        icons: [...prev.icons, imageUrl]
      }));
    } else {
      setSelectedImages(prev => ({
        ...prev,
        [type]: imageUrl
      }));
    }
  };

  const removeIcon = (index: number) => {
    setSelectedImages(prev => ({
      ...prev,
      icons: prev.icons.filter((_, i) => i !== index)
    }));
  };

  const handleComplete = () => {
    if (!selectedImages.hero) {
      toast({
        title: "Select Hero Image",
        description: "Please select at least a hero image to continue.",
        variant: "destructive",
      });
      return;
    }
    
    onComplete(selectedImages);
  };

  // Auto-select first placeholder on load
  useEffect(() => {
    const placeholders = getPlaceholderImages();
    if (placeholders.length > 0 && !selectedImages.hero) {
      setSelectedImages(prev => ({
        ...prev,
        hero: placeholders[0]
      }));
    }
  }, []);

  return (
    <div className="space-y-6">
      <div className="text-center space-y-2">
        <ImageIcon className="w-12 h-12 mx-auto text-primary" />
        <h2 className="text-2xl font-bold">Select Landing Page Images</h2>
        <p className="text-muted-foreground">
          Choose or generate images that complement your copy and convert visitors
        </p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid grid-cols-3 lg:grid-cols-6">
          <TabsTrigger value="hero">Hero</TabsTrigger>
          <TabsTrigger value="product">Product</TabsTrigger>
          <TabsTrigger value="testimonial">Testimonials</TabsTrigger>
          <TabsTrigger value="background">Backgrounds</TabsTrigger>
          <TabsTrigger value="icons">Icons</TabsTrigger>
          <TabsTrigger value="custom">Custom</TabsTrigger>
        </TabsList>

        <TabsContent value="hero" className="space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-semibold">Hero Section Image</h3>
            <Button 
              onClick={() => simulateImageGeneration('hero')}
              disabled={isGenerating}
              variant="outline"
            >
              <Sparkles className="w-4 h-4 mr-2" />
              Generate New
            </Button>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {getPlaceholderImages().map((url, index) => (
              <Card 
                key={index}
                className={`p-2 cursor-pointer transition-all ${
                  selectedImages.hero === url ? 'border-primary bg-primary/5' : 'hover:border-primary/50'
                }`}
                onClick={() => selectImage(url, 'hero')}
              >
                <div className="relative">
                  <img 
                    src={url} 
                    alt={`Hero option ${index + 1}`}
                    className="w-full h-48 object-cover rounded"
                  />
                  {selectedImages.hero === url && (
                    <div className="absolute top-2 right-2">
                      <CheckCircle className="w-6 h-6 text-primary bg-white rounded-full" />
                    </div>
                  )}
                </div>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="product" className="space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-semibold">Product Images</h3>
            <Button 
              onClick={() => simulateImageGeneration('product')}
              disabled={isGenerating}
              variant="outline"
            >
              <Sparkles className="w-4 h-4 mr-2" />
              Generate New
            </Button>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {getPlaceholderImages().map((url, index) => (
              <Card 
                key={index}
                className={`p-2 cursor-pointer transition-all ${
                  selectedImages.product === url ? 'border-primary bg-primary/5' : 'hover:border-primary/50'
                }`}
                onClick={() => selectImage(url, 'product')}
              >
                <img 
                  src={url} 
                  alt={`Product option ${index + 1}`}
                  className="w-full h-32 object-cover rounded"
                />
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="testimonial" className="space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-semibold">Testimonial Images</h3>
            <Button 
              onClick={() => simulateImageGeneration('testimonial')}
              disabled={isGenerating}
              variant="outline"
            >
              <Sparkles className="w-4 h-4 mr-2" />
              Generate New
            </Button>
          </div>
          
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {getPlaceholderImages().map((url, index) => (
              <Card 
                key={index}
                className={`p-2 cursor-pointer transition-all ${
                  selectedImages.testimonial === url ? 'border-primary bg-primary/5' : 'hover:border-primary/50'
                }`}
                onClick={() => selectImage(url, 'testimonial')}
              >
                <img 
                  src={url} 
                  alt={`Testimonial ${index + 1}`}
                  className="w-full h-24 object-cover rounded-full"
                />
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="background" className="space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-semibold">Background Patterns</h3>
            <Button 
              onClick={() => simulateImageGeneration('background')}
              disabled={isGenerating}
              variant="outline"
            >
              <Sparkles className="w-4 h-4 mr-2" />
              Generate New
            </Button>
          </div>
          
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {getPlaceholderImages().map((url, index) => (
              <Card 
                key={index}
                className={`p-2 cursor-pointer transition-all ${
                  selectedImages.background === url ? 'border-primary bg-primary/5' : 'hover:border-primary/50'
                }`}
                onClick={() => selectImage(url, 'background')}
              >
                <div 
                  className="w-full h-20 rounded opacity-30"
                  style={{ backgroundImage: `url(${url})`, backgroundSize: 'cover' }}
                />
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="icons" className="space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-semibold">Benefit Icons</h3>
            <Button 
              onClick={() => simulateImageGeneration('icons')}
              disabled={isGenerating}
              variant="outline"
            >
              <Sparkles className="w-4 h-4 mr-2" />
              Generate New
            </Button>
          </div>
          
          {selectedImages.icons.length > 0 && (
            <div>
              <h4 className="text-sm font-medium mb-2">Selected Icons:</h4>
              <div className="flex gap-2 flex-wrap">
                {selectedImages.icons.map((icon, index) => (
                  <Badge 
                    key={index} 
                    variant="secondary" 
                    className="cursor-pointer"
                    onClick={() => removeIcon(index)}
                  >
                    Icon {index + 1} ×
                  </Badge>
                ))}
              </div>
            </div>
          )}
          
          <div className="grid grid-cols-3 md:grid-cols-6 gap-4">
            {getPlaceholderImages().map((url, index) => (
              <Card 
                key={index}
                className="p-2 cursor-pointer transition-all hover:border-primary/50"
                onClick={() => selectImage(url, 'icons')}
              >
                <div className="w-full h-16 bg-muted rounded flex items-center justify-center">
                  <span className="text-xs">Icon {index + 1}</span>
                </div>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="custom" className="space-y-4">
          <div>
            <h3 className="text-lg font-semibold mb-4">Generate Custom Image</h3>
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium">Describe the image you want:</label>
                <Input
                  value={customPrompt}
                  onChange={(e) => setCustomPrompt(e.target.value)}
                  placeholder="e.g., Professional woman using tablet in modern office, clean lighting..."
                  className="mt-2"
                />
              </div>
              <Button 
                onClick={generateCustomImage}
                disabled={isGenerating || !customPrompt.trim()}
                variant="hero"
              >
                <Zap className="w-4 h-4 mr-2" />
                {isGenerating ? 'Generating...' : 'Generate Image'}
              </Button>
            </div>
          </div>

          {generatedImages.length > 0 && (
            <div>
              <h4 className="text-sm font-medium mb-2">Generated Images:</h4>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {generatedImages.slice(0, 6).map((image) => (
                  <Card 
                    key={image.id}
                    className="p-2 cursor-pointer transition-all hover:border-primary/50"
                    onClick={() => selectImage(image.url, 'hero')}
                  >
                    <img 
                      src={image.url} 
                      alt="Generated"
                      className="w-full h-32 object-cover rounded"
                    />
                    <p className="text-xs text-muted-foreground mt-1 truncate">
                      {image.prompt}
                    </p>
                  </Card>
                ))}
              </div>
            </div>
          )}
        </TabsContent>
      </Tabs>

      <Card className="p-4 bg-muted/30">
        <h3 className="font-semibold mb-2">Selection Summary</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
          <div>
            <span className="font-medium">Hero Image:</span>
            <p className="text-muted-foreground">{selectedImages.hero ? '✓ Selected' : '○ Not selected'}</p>
          </div>
          <div>
            <span className="font-medium">Product Image:</span>
            <p className="text-muted-foreground">{selectedImages.product ? '✓ Selected' : '○ Optional'}</p>
          </div>
          <div>
            <span className="font-medium">Testimonial Image:</span>
            <p className="text-muted-foreground">{selectedImages.testimonial ? '✓ Selected' : '○ Optional'}</p>
          </div>
          <div>
            <span className="font-medium">Icons:</span>
            <p className="text-muted-foreground">{selectedImages.icons.length} selected</p>
          </div>
        </div>
      </Card>

      <div className="flex justify-center">
        <Button 
          onClick={handleComplete}
          variant="hero" 
          size="lg"
          disabled={!selectedImages.hero}
        >
          <CheckCircle className="w-4 h-4 mr-2" />
          Continue to Preview
        </Button>
      </div>
    </div>
  );
};
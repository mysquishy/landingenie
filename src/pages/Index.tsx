import { useState } from 'react';
import { URLProcessor } from '@/components/URLProcessor';
import { DataReview } from '@/components/DataReview';
import { PageTypeSelector } from '@/components/PageTypeSelector';
import { CopyGeneration } from '@/components/CopyGeneration';
import { ImageSelection } from '@/components/ImageSelection';
import { LandingPagePreview } from '@/components/LandingPagePreview';
import heroImage from '@/assets/hero-image.jpg';

type Step = 'url-input' | 'data-review' | 'page-type' | 'copy-generation' | 'image-selection' | 'preview';

const Index = () => {
  const [currentStep, setCurrentStep] = useState<Step>('url-input');
  const [productData, setProductData] = useState<any>(null);
  const [selectedPageType, setSelectedPageType] = useState<string>('');
  const [generatedCopy, setGeneratedCopy] = useState<any>(null);
  const [selectedImages, setSelectedImages] = useState<any>(null);

  const handleURLProcessed = (data: any) => {
    console.log('handleURLProcessed called with data:', data);
    setProductData(data);
    console.log('Setting currentStep to data-review');
    setCurrentStep('data-review');
  };

  const handleDataConfirmed = () => {
    setCurrentStep('page-type');
  };

  const handlePageTypeSelected = (type: string) => {
    setSelectedPageType(type);
    setCurrentStep('copy-generation');
  };

  const handleCopyGenerated = (copy: any) => {
    setGeneratedCopy(copy);
    setCurrentStep('image-selection');
  };

  const handleImagesSelected = (images: any) => {
    setSelectedImages(images);
    setCurrentStep('preview');
  };

  const handleProjectComplete = () => {
    // Could reset state or navigate to dashboard
    setCurrentStep('url-input');
    setProductData(null);
    setSelectedPageType('');
    setGeneratedCopy(null);
    setSelectedImages(null);
  };

  const renderCurrentStep = () => {
    switch (currentStep) {
      case 'url-input':
        return <URLProcessor onProcessingComplete={handleURLProcessed} />;
      case 'data-review':
        return <DataReview data={productData} onConfirm={handleDataConfirmed} />;
      case 'page-type':
        return <PageTypeSelector onSelect={handlePageTypeSelected} />;
      case 'copy-generation':
        return (
          <CopyGeneration 
            productData={productData}
            pageType={selectedPageType}
            onComplete={handleCopyGenerated}
          />
        );
      case 'image-selection':
        return (
          <ImageSelection
            productData={productData}
            pageType={selectedPageType}
            generatedCopy={generatedCopy}
            onComplete={handleImagesSelected}
          />
        );
      case 'preview':
        return (
          <LandingPagePreview
            productData={productData}
            pageType={selectedPageType}
            generatedCopy={generatedCopy}
            selectedImages={selectedImages}
            onComplete={handleProjectComplete}
          />
        );
      default:
        return <URLProcessor onProcessingComplete={handleURLProcessed} />;
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Hero Section */}
      <div className="relative overflow-hidden">
        <div 
          className="absolute inset-0 bg-cover bg-center bg-no-repeat opacity-20"
          style={{ backgroundImage: `url(${heroImage})` }}
        />
        <div className="absolute inset-0 bg-gradient-to-br from-background via-background/80 to-transparent" />
        
        <div className="relative container mx-auto px-4 py-16">
          <div className="text-center space-y-6 mb-12">
            <h1 className="text-4xl md:text-6xl font-bold bg-gradient-primary bg-clip-text text-transparent">
              AI Landing Page Generator
            </h1>
            <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
              Transform any affiliate URL into high-converting landing pages using Alex Hormozi's Value Equation framework and AI-powered copywriting
            </p>
          </div>

          {/* Progress Indicator */}
          <div className="flex justify-center mb-8">
            <div className="flex items-center space-x-4">
              {[
                { step: 'url-input', label: 'URL Analysis' },
                { step: 'data-review', label: 'Data Review' },
                { step: 'page-type', label: 'Page Type' },
                { step: 'copy-generation', label: 'Copy Generation' },
                { step: 'image-selection', label: 'Images' },
                { step: 'preview', label: 'Preview' }
              ].map((item, index) => (
                <div key={item.step} className="flex items-center">
                  <div
                    className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium transition-all ${
                      currentStep === item.step
                        ? 'bg-primary text-primary-foreground'
                        : ['url-input', 'data-review', 'page-type', 'copy-generation', 'image-selection', 'preview'].indexOf(currentStep) > index
                        ? 'bg-success text-white'
                        : 'bg-muted text-muted-foreground'
                    }`}
                  >
                    {index + 1}
                  </div>
                  <span className="ml-2 text-sm text-muted-foreground hidden md:block">
                    {item.label}
                  </span>
                  {index < 5 && (
                    <div className="w-8 h-px bg-muted mx-4" />
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Current Step Content */}
          <div className="max-w-4xl mx-auto">
            {renderCurrentStep()}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Index;

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Upload, Video, Brain, Loader2, Zap, Settings } from "lucide-react";
import { VideoUploader } from "./VideoUploader";
import { RecentAnalyses } from "./RecentAnalyses";
import { RealTimeProgress } from "./RealTimeProgress";
import { PerformanceOptimizer } from "./PerformanceOptimizer";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useNavigate } from "react-router-dom";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export const EnhancedVideoAnalyzer = () => {
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [currentAnalysisId, setCurrentAnalysisId] = useState<string | null>(null);
  const [analysisMode, setAnalysisMode] = useState<'standard' | 'premium' | 'enterprise'>('standard');
  const { toast } = useToast();
  const navigate = useNavigate();

  const handleVideoUploaded = async (videoId: string) => {
    setIsAnalyzing(true);
    
    try {
      console.log('Starting AI analysis for video:', videoId);
      
      const { data, error } = await supabase.functions.invoke('analyze-speech', {
        body: { videoId }
      });

      if (error) {
        throw error;
      }

      if (data?.success) {
        setCurrentAnalysisId(data.analysisId);
        
        // Start background processing for premium features if needed
        if (analysisMode !== 'standard') {
          await supabase.functions.invoke('process-analysis', {
            body: { 
              analysisId: data.analysisId,
              priority: analysisMode === 'enterprise' ? 'high' : 'normal'
            }
          });
        }
        
        toast({
          title: "Analysis Started",
          description: "AI processing has begun. Watch the progress below!",
        });
      } else {
        throw new Error(data?.error || 'Analysis failed to start');
      }
    } catch (error) {
      console.error('Analysis error:', error);
      toast({
        title: "Analysis Failed", 
        description: error instanceof Error ? error.message : "Failed to start analysis",
        variant: "destructive",
      });
      setIsAnalyzing(false);
    }
  };

  const handleAnalysisComplete = (analysis: any) => {
    setIsAnalyzing(false);
    setCurrentAnalysisId(null);
    
    toast({
      title: "Analysis Complete!",
      description: `Your ${analysisMode} analysis is ready for review.`,
    });
    
    // Navigate to detailed results
    navigate(`/analysis/${analysis.id}`);
  };

  const handleAnalysisError = (error: string) => {
    setIsAnalyzing(false);
    setCurrentAnalysisId(null);
    
    toast({
      title: "Analysis Failed",
      description: error,
      variant: "destructive",
    });
  };

  return (
    <div className="space-y-6">
      {/* Analysis Mode Selection */}
      <Card className="glass shadow-elegant">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="w-5 h-5 text-primary" />
            Analysis Mode
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div 
              className={`p-4 border-2 rounded-lg cursor-pointer transition-all ${
                analysisMode === 'standard' ? 'border-primary bg-primary/5' : 'border-border hover:border-primary/50'
              }`}
              onClick={() => setAnalysisMode('standard')}
            >
              <div className="flex items-center gap-2 mb-2">
                <Video className="w-5 h-5 text-blue-500" />
                <span className="font-semibold">Standard</span>
                <Badge variant="outline">Free</Badge>
              </div>
              <p className="text-sm text-muted-foreground">
                Basic sentiment analysis and transcription
              </p>
            </div>
            
            <div 
              className={`p-4 border-2 rounded-lg cursor-pointer transition-all ${
                analysisMode === 'premium' ? 'border-primary bg-primary/5' : 'border-border hover:border-primary/50'
              }`}
              onClick={() => setAnalysisMode('premium')}
            >
              <div className="flex items-center gap-2 mb-2">
                <Brain className="w-5 h-5 text-purple-500" />
                <span className="font-semibold">Premium</span>
                <Badge className="bg-purple-100 text-purple-800">Pro</Badge>
              </div>
              <p className="text-sm text-muted-foreground">
                Advanced emotional profiling and topic analysis
              </p>
            </div>
            
            <div 
              className={`p-4 border-2 rounded-lg cursor-pointer transition-all ${
                analysisMode === 'enterprise' ? 'border-primary bg-primary/5' : 'border-border hover:border-primary/50'
              }`}
              onClick={() => setAnalysisMode('enterprise')}
            >
              <div className="flex items-center gap-2 mb-2">
                <Zap className="w-5 h-5 text-amber-500" />
                <span className="font-semibold">Enterprise</span>
                <Badge className="bg-amber-100 text-amber-800">Elite</Badge>
              </div>
              <p className="text-sm text-muted-foreground">
                Full timeline analysis and authenticity scoring
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Main Analysis Section */}
      <Card className="glass shadow-elegant">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Brain className="w-6 h-6 text-speech-primary" />
            AI-Powered Speech Analysis
            <Badge className="bg-gradient-primary text-white">
              {analysisMode.charAt(0).toUpperCase() + analysisMode.slice(1)}
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {currentAnalysisId ? (
            <RealTimeProgress 
              analysisId={currentAnalysisId}
              onComplete={handleAnalysisComplete}
              onError={handleAnalysisError}
            />
          ) : isAnalyzing ? (
            <div className="text-center py-8">
              <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4 text-speech-primary" />
              <h3 className="text-lg font-semibold mb-2">Initializing Analysis</h3>
              <p className="text-muted-foreground">
                Preparing your video for AI processing...
              </p>
            </div>
          ) : (
            <VideoUploader onAnalyze={handleVideoUploaded} />
          )}
        </CardContent>
      </Card>

      {/* Tabs for Analysis History and Performance */}
      <Tabs defaultValue="history" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="history">Analysis History</TabsTrigger>
          <TabsTrigger value="performance">Performance</TabsTrigger>
        </TabsList>
        
        <TabsContent value="history" className="space-y-4">
          <RecentAnalyses />
        </TabsContent>
        
        <TabsContent value="performance" className="space-y-4">
          <PerformanceOptimizer 
            onOptimizationApplied={(metric, improvement) => {
              toast({
                title: "Performance Improved",
                description: `${metric} optimization applied: +${improvement}% improvement`,
              });
            }}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
};
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Mic, Upload, Play, Pause, Square, AudioWaveform, Brain, Activity, Video, LogOut } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { AudioRecorder } from "@/components/AudioRecorder";
import { AudioUploader } from "@/components/AudioUploader";
import { VideoUploader } from "@/components/VideoUploader";
import { AnalysisResults } from "@/components/AnalysisResults";
import { AnalysisHistory } from "@/components/AnalysisHistory";

export default function Dashboard() {
  const { user, loading, signOut } = useAuth();
  const navigate = useNavigate();
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisProgress, setAnalysisProgress] = useState(0);
  const [currentAnalysis, setCurrentAnalysis] = useState(null);

  useEffect(() => {
    // Redirect unauthenticated users to auth page
    if (!loading && !user) {
      navigate("/auth");
    }
  }, [user, loading, navigate]);

  const handleSignOut = async () => {
    await signOut();
    navigate("/auth");
  };

  // Show loading state while checking auth
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-speech-primary"></div>
      </div>
    );
  }

  // Don't render content if user is not authenticated (will redirect)
  if (!user) {
    return null;
  }

  const handleStartAnalysis = async (audioData: Blob | File) => {
    setIsAnalyzing(true);
    setAnalysisProgress(0);

    // Simulate analysis progress for audio
    const interval = setInterval(() => {
      setAnalysisProgress(prev => {
        if (prev >= 100) {
          clearInterval(interval);
          setIsAnalyzing(false);
          // Mock analysis results
          setCurrentAnalysis({
            id: Date.now().toString(),
            timestamp: new Date().toISOString(),
            duration: "2m 34s",
            sentiment: "Positive",
            confidence: 87,
            emotions: {
              joy: 65,
              confidence: 78,
              neutral: 45,
              concern: 23
            },
            keywords: ["innovation", "growth", "success", "team", "project"],
            transcription: "This is a sample transcription of the analyzed speech content...",
            insights: [
              "Speaker shows high confidence throughout the speech",
              "Positive sentiment indicates good morale",
              "Clear articulation suggests good presentation skills"
            ]
          });
          return 100;
        }
        return prev + 2;
      });
    }, 100);
  };

  const handleVideoAnalysis = async (videoId: string) => {
    setIsAnalyzing(true);
    setAnalysisProgress(0);

    try {
      // Start the analysis process
      const response = await supabase.functions.invoke('analyze-speech', {
        body: { video_id: videoId }
      });

      if (response.error) {
        throw new Error(response.error.message);
      }

      // Poll for analysis completion
      const checkProgress = setInterval(async () => {
        const { data: analysisData } = await supabase
          .from('analysis_results')
          .select('*')
          .eq('video_id', videoId)
          .single();

        if (analysisData && analysisData.processing_status === 'completed') {
          clearInterval(checkProgress);
          setIsAnalyzing(false);
          setAnalysisProgress(100);
          
          // Use the full analysis data directly for enhanced features
          setCurrentAnalysis(analysisData);
        } else {
          setAnalysisProgress(prev => Math.min(prev + 5, 95));
        }
      }, 2000);

    } catch (error) {
      console.error('Analysis error:', error);
      setIsAnalyzing(false);
      setAnalysisProgress(0);
    }
  };

  return (
    <div className="min-h-screen bg-background p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-4xl font-bold gradient-text">AI Speech Analysis</h1>
          <p className="text-muted-foreground mt-2">
            Advanced speech analysis powered by artificial intelligence
          </p>
        </div>
        <div className="flex items-center gap-4">
          <Badge variant="secondary" className="glass">
            <Activity className="w-4 h-4 mr-1" />
            Live Analysis
          </Badge>
          <span className="text-sm text-muted-foreground">
            {user.email}
          </span>
          <Button variant="outline" size="sm" onClick={handleSignOut}>
            <LogOut className="w-4 h-4 mr-2" />
            Sign Out
          </Button>
        </div>
      </div>

      {/* Analysis Status */}
      {isAnalyzing && (
        <Card className="glass shadow-glow animate-pulse-glow">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Brain className="w-5 h-5 text-speech-primary animate-pulse" />
              Analyzing Speech...
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Processing audio</span>
                <span>{analysisProgress}%</span>
              </div>
              <Progress value={analysisProgress} className="h-2" />
              <p className="text-sm text-muted-foreground">
                Extracting features, analyzing sentiment, and generating insights...
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Analysis Panel */}
        <div className="lg:col-span-2 space-y-6">
          <Card className="glass shadow-elegant">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <AudioWaveform className="w-5 h-5 text-speech-primary" />
                Speech Input
              </CardTitle>
            </CardHeader>
            <CardContent>
            <Tabs defaultValue="video" className="w-full">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="video" className="flex items-center gap-2">
                  <Video className="w-4 h-4" />
                  Video Analysis
                </TabsTrigger>
                <TabsTrigger value="record" className="flex items-center gap-2">
                  <Mic className="w-4 h-4" />
                  Record Audio
                </TabsTrigger>
                <TabsTrigger value="upload" className="flex items-center gap-2">
                  <Upload className="w-4 h-4" />
                  Upload Audio
                </TabsTrigger>
              </TabsList>
              
              <TabsContent value="video" className="mt-4">
                <VideoUploader onAnalyze={handleVideoAnalysis} />
              </TabsContent>
              
              <TabsContent value="record" className="mt-4">
                <AudioRecorder onAnalyze={handleStartAnalysis} />
              </TabsContent>
              
              <TabsContent value="upload" className="mt-4">
                <AudioUploader onAnalyze={handleStartAnalysis} />
              </TabsContent>
            </Tabs>
            </CardContent>
          </Card>

          {/* Analysis Results */}
          {currentAnalysis && (
            <AnalysisResults analysis={currentAnalysis} />
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Quick Stats */}
          <Card className="glass">
            <CardHeader>
              <CardTitle className="text-sm font-medium">Today's Analytics</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Analyses</span>
                <span className="font-semibold">12</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Avg. Sentiment</span>
                <Badge variant="secondary">Positive</Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Confidence</span>
                <span className="font-semibold">84%</span>
              </div>
            </CardContent>
          </Card>

          {/* Analysis History */}
          <AnalysisHistory onSelectAnalysis={setCurrentAnalysis} />
        </div>
      </div>
    </div>
  );
}
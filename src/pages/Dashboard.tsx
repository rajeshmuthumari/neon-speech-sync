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
import { EnhancedVideoAnalyzer } from "@/components/EnhancedVideoAnalyzer";
import { AnalysisResults } from "@/components/AnalysisResults";

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
    try {
      await signOut();
      // Only navigate after successful signout
      navigate("/auth");
    } catch (error) {
      console.error('Logout failed:', error);
    }
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

    try {
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      
      if (authError || !user) {
        throw new Error('Please log in to analyze audio');
      }

      // Create a FormData to upload the audio file first
      const timestamp = Date.now();
      const fileName = `${user.id}/audio_${timestamp}.wav`;
      
      // Convert Blob to File if needed
      const audioFile = audioData instanceof File ? audioData : new File([audioData], 'recording.wav', { type: 'audio/wav' });
      
      // Upload audio to Supabase Storage
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('videos') // Using same bucket for simplicity
        .upload(fileName, audioFile);

      if (uploadError) throw uploadError;

      // Create video record for the audio file
      const { data: videoData, error: videoError } = await supabase
        .from('videos')
        .insert({
          user_id: user.id,
          title: audioFile.name,
          file_path: uploadData.path,
          file_size: audioFile.size,
          mime_type: audioFile.type,
          upload_status: 'uploaded'
        })
        .select()
        .single();

      if (videoError) throw videoError;

      // Start AI analysis using the same edge function
      const response = await supabase.functions.invoke('analyze-speech', {
        body: { videoId: videoData.id }
      });

      if (response.error) {
        throw new Error(response.error.message);
      }

      // Poll for analysis completion
      const checkProgress = setInterval(async () => {
        const { data: analysisData } = await supabase
          .from('analysis_results')
          .select('*')
          .eq('video_id', videoData.id)
          .single();

        if (analysisData && analysisData.processing_status === 'completed') {
          clearInterval(checkProgress);
          setIsAnalyzing(false);
          setAnalysisProgress(100);
          setCurrentAnalysis(analysisData);
        } else {
          setAnalysisProgress(prev => Math.min(prev + 5, 95));
        }
      }, 2000);

    } catch (error) {
      console.error('Audio analysis error:', error);
      setIsAnalyzing(false);
      setAnalysisProgress(0);
      // Show error toast would be good here
    }
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

      <div className="space-y-6">
        {/* Main Analysis Panel */}
        <div className="space-y-6">
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
                <EnhancedVideoAnalyzer />
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
            <Card className="glass shadow-elegant">
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Brain className="w-5 h-5 text-speech-primary" />
                    Quick Analysis Preview
                  </div>
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => navigate(`/analysis/${currentAnalysis.id}`)}
                  >
                    View Detailed Analysis
                    <Activity className="w-4 h-4 ml-2" />
                  </Button>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-speech-primary">
                      {currentAnalysis.overall_sentiment || 'N/A'}
                    </div>
                    <div className="text-xs text-muted-foreground">Sentiment</div>
                  </div>
                  
                  <div className="text-center">
                    <div className="text-2xl font-bold text-blue-500">
                      {currentAnalysis.empathy_score || 'N/A'}%
                    </div>
                    <div className="text-xs text-muted-foreground">Empathy</div>
                  </div>
                  
                  <div className="text-center">
                    <div className="text-2xl font-bold text-purple-500">
                      {currentAnalysis.political_positioning || 'N/A'}
                    </div>
                    <div className="text-xs text-muted-foreground">Positioning</div>
                  </div>
                  
                  <div className="text-center">
                    <div className="text-2xl font-bold text-orange-500">
                      {currentAnalysis.urgency_level || 'N/A'}
                    </div>
                    <div className="text-xs text-muted-foreground">Urgency</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Brain, Clock, Target, Download, Share } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { AnalysisResults } from "@/components/AnalysisResults";
import { useToast } from "@/hooks/use-toast";

export default function DetailedAnalysis() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user, loading } = useAuth();
  const { toast } = useToast();
  const [analysis, setAnalysis] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Redirect unauthenticated users
    if (!loading && !user) {
      navigate("/auth");
      return;
    }

    if (id && user) {
      fetchAnalysis();
    }
  }, [id, user, loading, navigate]);

  const fetchAnalysis = async () => {
    try {
      const { data, error } = await supabase
        .from('analysis_results')
        .select('*')
        .eq('id', id)
        .eq('user_id', user.id)
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          toast({
            title: "Analysis not found",
            description: "The analysis you're looking for doesn't exist or you don't have access to it.",
            variant: "destructive",
          });
          navigate("/dashboard");
          return;
        }
        throw error;
      }

      setAnalysis(data);
    } catch (error) {
      console.error('Error fetching analysis:', error);
      toast({
        title: "Error loading analysis",
        description: "Failed to load the analysis details.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleDownloadReport = () => {
    // TODO: Implement PDF report generation
    toast({
      title: "Feature coming soon",
      description: "PDF report download will be available soon.",
    });
  };

  const handleShareAnalysis = () => {
    // TODO: Implement sharing functionality
    toast({
      title: "Feature coming soon",
      description: "Analysis sharing will be available soon.",
    });
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString() + ' at ' + date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  // Show loading state
  if (loading || isLoading) {
    return (
      <div className="min-h-screen bg-background p-6">
        <div className="max-w-7xl mx-auto">
          <div className="animate-pulse space-y-6">
            <div className="h-16 bg-muted/50 rounded-lg" />
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2 space-y-6">
                <div className="h-96 bg-muted/50 rounded-lg" />
                <div className="h-64 bg-muted/50 rounded-lg" />
              </div>
              <div className="space-y-6">
                <div className="h-32 bg-muted/50 rounded-lg" />
                <div className="h-48 bg-muted/50 rounded-lg" />
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Don't render if user is not authenticated
  if (!user) {
    return null;
  }

  // Show error if analysis not found
  if (!analysis) {
    return (
      <div className="min-h-screen bg-background p-6">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col items-center justify-center min-h-[60vh] text-center">
            <Brain className="w-16 h-16 text-muted-foreground mb-4" />
            <h1 className="text-2xl font-bold mb-2">Analysis Not Found</h1>
            <p className="text-muted-foreground mb-6">
              The analysis you're looking for doesn't exist or you don't have access to it.
            </p>
            <Button onClick={() => navigate("/dashboard")}>
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Dashboard
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background p-6 space-y-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => navigate("/dashboard")}
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Dashboard
            </Button>
            <div>
              <h1 className="text-3xl font-bold gradient-text">Detailed Analysis</h1>
              <p className="text-muted-foreground mt-1">
                Comprehensive political speech analysis results
              </p>
            </div>
          </div>
          
          <div className="flex items-center gap-3">
            <Button variant="outline" size="sm" onClick={handleShareAnalysis}>
              <Share className="w-4 h-4 mr-2" />
              Share
            </Button>
            <Button variant="outline" size="sm" onClick={handleDownloadReport}>
              <Download className="w-4 h-4 mr-2" />
              Download Report
            </Button>
          </div>
        </div>

        {/* Analysis Info Card */}
        <Card className="glass shadow-elegant">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Brain className="w-5 h-5 text-speech-primary" />
              Analysis Overview
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-muted-foreground" />
                <div>
                  <p className="text-sm text-muted-foreground">Analyzed</p>
                  <p className="font-medium">{formatDate(analysis.created_at)}</p>
                </div>
              </div>
              
              <div className="flex items-center gap-2">
                <Target className="w-4 h-4 text-muted-foreground" />
                <div>
                  <p className="text-sm text-muted-foreground">Confidence</p>
                  <p className="font-medium">
                    {analysis.sentiment_confidence 
                      ? `${Math.round(analysis.sentiment_confidence * 100)}%` 
                      : 'N/A'}
                  </p>
                </div>
              </div>

              <div>
                <p className="text-sm text-muted-foreground">Sentiment</p>
                <Badge className={
                  analysis.overall_sentiment?.toLowerCase() === 'positive' 
                    ? 'bg-green-100 text-green-800' 
                    : analysis.overall_sentiment?.toLowerCase() === 'negative'
                    ? 'bg-red-100 text-red-800'
                    : 'bg-gray-100 text-gray-800'
                }>
                  {analysis.overall_sentiment || 'Processing'}
                </Badge>
              </div>

              <div>
                <p className="text-sm text-muted-foreground">Status</p>
                <Badge variant={analysis.processing_status === 'completed' ? 'default' : 'secondary'}>
                  {analysis.processing_status}
                </Badge>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Main Analysis Results */}
        <AnalysisResults analysis={analysis} />

        {/* Additional Analysis Metadata */}
        {(analysis.processing_error || analysis.detected_language) && (
          <Card className="glass">
            <CardHeader>
              <CardTitle>Analysis Metadata</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {analysis.detected_language && (
                <div>
                  <p className="text-sm text-muted-foreground">Detected Language</p>
                  <p className="font-medium capitalize">{analysis.detected_language}</p>
                </div>
              )}
              
              {analysis.processing_error && (
                <div>
                  <p className="text-sm text-muted-foreground">Processing Notes</p>
                  <p className="text-sm text-red-600">{analysis.processing_error}</p>
                </div>
              )}
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
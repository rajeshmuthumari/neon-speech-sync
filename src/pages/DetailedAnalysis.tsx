import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Brain, Clock, Target, Download, Share, Copy, Link } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { AnalysisResults } from "@/components/AnalysisResults";
import { useToast } from "@/hooks/use-toast";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import jsPDF from "jspdf";
import html2canvas from "html2canvas";

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

  const handleDownloadReport = async () => {
    try {
      // Create PDF from the analysis content
      const pdf = new jsPDF('p', 'mm', 'a4');
      
      // Add header
      pdf.setFontSize(20);
      pdf.text('Political Speech Analysis Report', 20, 30);
      
      // Add analysis date
      pdf.setFontSize(12);
      pdf.text(`Analysis Date: ${formatDate(analysis.created_at)}`, 20, 45);
      
      // Add basic analysis data
      let yPos = 60;
      
      if (analysis.overall_sentiment) {
        pdf.text(`Overall Sentiment: ${analysis.overall_sentiment}`, 20, yPos);
        yPos += 10;
      }
      
      if (analysis.sentiment_score) {
        pdf.text(`Sentiment Score: ${(analysis.sentiment_score * 100).toFixed(1)}%`, 20, yPos);
        yPos += 10;
      }
      
      if (analysis.empathy_score) {
        pdf.text(`Empathy Score: ${analysis.empathy_score}/10`, 20, yPos);
        yPos += 10;
      }
      
      if (analysis.political_positioning) {
        pdf.text(`Political Positioning: ${analysis.political_positioning}`, 20, yPos);
        yPos += 10;
      }
      
      if (analysis.key_themes && analysis.key_themes.length > 0) {
        yPos += 10;
        pdf.text('Key Themes:', 20, yPos);
        yPos += 10;
        analysis.key_themes.forEach((theme: string) => {
          pdf.text(`• ${theme}`, 25, yPos);
          yPos += 8;
        });
      }
      
      if (analysis.transcription) {
        yPos += 10;
        pdf.text('Transcription:', 20, yPos);
        yPos += 10;
        const transcriptLines = pdf.splitTextToSize(analysis.transcription, 170);
        pdf.text(transcriptLines, 20, yPos);
      }
      
      // Save the PDF
      pdf.save(`speech-analysis-${analysis.id}.pdf`);
      
      toast({
        title: "Report downloaded",
        description: "Your analysis report has been downloaded successfully.",
      });
    } catch (error) {
      console.error('Error generating PDF:', error);
      toast({
        title: "Download failed",
        description: "There was an error generating the PDF report.",
        variant: "destructive",
      });
    }
  };

  const handleShareAnalysis = async () => {
    const shareUrl = `${window.location.origin}/analysis/${analysis.id}`;
    
    try {
      await navigator.clipboard.writeText(shareUrl);
      toast({
        title: "Link copied",
        description: "Analysis link has been copied to your clipboard.",
      });
    } catch (error) {
      console.error('Error copying to clipboard:', error);
      toast({
        title: "Copy failed",
        description: "Unable to copy link to clipboard.",
        variant: "destructive",
      });
    }
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
            <Dialog>
              <DialogTrigger asChild>
                <Button variant="outline" size="sm">
                  <Share className="w-4 h-4 mr-2" />
                  Share
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-md">
                <DialogHeader>
                  <DialogTitle>Share Analysis</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <div className="flex items-center space-x-2">
                    <div className="grid flex-1 gap-2">
                      <label htmlFor="link" className="sr-only">Link</label>
                      <input
                        id="link"
                        defaultValue={`${window.location.origin}/analysis/${analysis.id}`}
                        readOnly
                        className="w-full px-3 py-2 text-sm border rounded-md bg-background"
                      />
                    </div>
                    <Button type="button" size="sm" className="px-3" onClick={handleShareAnalysis}>
                      <Copy className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
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
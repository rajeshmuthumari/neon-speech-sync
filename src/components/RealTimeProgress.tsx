import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Loader2, CheckCircle, XCircle, Clock } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

interface RealTimeProgressProps {
  analysisId: string;
  onComplete?: (analysis: any) => void;
  onError?: (error: string) => void;
}

export const RealTimeProgress = ({ analysisId, onComplete, onError }: RealTimeProgressProps) => {
  const [progress, setProgress] = useState(0);
  const [status, setStatus] = useState<'processing' | 'completed' | 'error' | 'pending'>('processing');
  const [currentStage, setCurrentStage] = useState('Initializing...');
  const [analysis, setAnalysis] = useState<any>(null);

  useEffect(() => {
    if (!analysisId) return;

    // Set up real-time subscription to analysis updates
    const subscription = supabase
      .channel(`analysis-${analysisId}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'analysis_results',
          filter: `id=eq.${analysisId}`,
        },
        (payload) => {
          const updatedAnalysis = payload.new;
          console.log('Analysis update received:', updatedAnalysis);
          
          setAnalysis(updatedAnalysis);
          setStatus(updatedAnalysis.processing_status as 'processing' | 'completed' | 'error' | 'pending');
          
          // Update progress based on confidence_score during processing
          if (updatedAnalysis.processing_status === 'processing' && updatedAnalysis.confidence_score) {
            const progressPercent = Math.round(updatedAnalysis.confidence_score * 100);
            setProgress(progressPercent);
            
            // Update stage based on progress
            if (progressPercent < 20) {
              setCurrentStage('Processing video file...');
            } else if (progressPercent < 40) {
              setCurrentStage('Extracting audio...');
            } else if (progressPercent < 60) {
              setCurrentStage('Analyzing visual elements...');
            } else if (progressPercent < 80) {
              setCurrentStage('Transcribing speech...');
            } else if (progressPercent < 95) {
              setCurrentStage('Computing sentiment analysis...');
            } else {
              setCurrentStage('Finalizing results...');
            }
          } else if (updatedAnalysis.processing_status === 'completed') {
            setProgress(100);
            setCurrentStage('Analysis completed!');
            onComplete?.(updatedAnalysis);
          } else if (updatedAnalysis.processing_status === 'error') {
            setCurrentStage('Analysis failed');
            onError?.(updatedAnalysis.processing_error || 'Unknown error occurred');
          }
        }
      )
      .subscribe();

    // Fetch initial state
    const fetchInitialState = async () => {
      const { data, error } = await supabase
        .from('analysis_results')
        .select('*')
        .eq('id', analysisId)
        .single();

      if (error) {
        console.error('Error fetching analysis:', error);
        onError?.('Failed to fetch analysis status');
        return;
      }

      if (data) {
        setAnalysis(data);
        setStatus(data.processing_status as 'processing' | 'completed' | 'error' | 'pending');
        
        if (data.processing_status === 'completed') {
          setProgress(100);
          setCurrentStage('Analysis completed!');
          onComplete?.(data);
        } else if (data.processing_status === 'error') {
          setCurrentStage('Analysis failed');
          onError?.(data.processing_error || 'Unknown error occurred');
        }
      }
    };

    fetchInitialState();

    return () => {
      subscription.unsubscribe();
    };
  }, [analysisId, onComplete, onError]);

  const getStatusIcon = () => {
    switch (status) {
      case 'processing':
        return <Loader2 className="w-5 h-5 animate-spin text-primary" />;
      case 'completed':
        return <CheckCircle className="w-5 h-5 text-green-600" />;
      case 'error':
        return <XCircle className="w-5 h-5 text-red-600" />;
      default:
        return <Clock className="w-5 h-5 text-muted-foreground" />;
    }
  };

  const getStatusBadge = () => {
    switch (status) {
      case 'processing':
        return <Badge variant="secondary" className="bg-blue-100 text-blue-800">Processing</Badge>;
      case 'completed':
        return <Badge variant="secondary" className="bg-green-100 text-green-800">Completed</Badge>;
      case 'error':
        return <Badge variant="destructive">Failed</Badge>;
      default:
        return <Badge variant="outline">Pending</Badge>;
    }
  };

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          {getStatusIcon()}
          AI Speech Analysis Progress
          {getStatusBadge()}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <div className="flex justify-between items-center">
            <span className="text-sm font-medium">{currentStage}</span>
            <span className="text-sm text-muted-foreground">{progress}%</span>
          </div>
          <Progress value={progress} className="w-full" />
        </div>

        {status === 'processing' && (
          <div className="text-sm text-muted-foreground">
            <p>Our AI is analyzing your political speech using advanced natural language processing and computer vision techniques.</p>
            <ul className="mt-2 ml-4 list-disc space-y-1">
              <li>Speech-to-text transcription</li>
              <li>Sentiment and emotion analysis</li>
              <li>Political positioning detection</li>
              <li>Rhetorical style evaluation</li>
              <li>Visual engagement metrics</li>
            </ul>
          </div>
        )}

        {status === 'completed' && analysis && (
          <div className="bg-green-50 p-4 rounded-lg">
            <h4 className="font-semibold text-green-800 mb-2">Analysis Complete!</h4>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-muted-foreground">Sentiment:</span>
                <span className="ml-2 font-medium">{analysis.overall_sentiment || 'N/A'}</span>
              </div>
              <div>
                <span className="text-muted-foreground">Confidence:</span>
                <span className="ml-2 font-medium">
                  {analysis.confidence_score ? `${Math.round(analysis.confidence_score * 100)}%` : 'N/A'}
                </span>
              </div>
              <div>
                <span className="text-muted-foreground">Positioning:</span>
                <span className="ml-2 font-medium">{analysis.political_positioning || 'N/A'}</span>
              </div>
              <div>
                <span className="text-muted-foreground">Empathy Score:</span>
                <span className="ml-2 font-medium">{analysis.empathy_score || 'N/A'}/10</span>
              </div>
            </div>
          </div>
        )}

        {status === 'error' && (
          <div className="bg-red-50 p-4 rounded-lg">
            <h4 className="font-semibold text-red-800 mb-2">Analysis Failed</h4>
            <p className="text-sm text-red-700">
              {analysis?.processing_error || 'An error occurred during analysis. Please try again.'}
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
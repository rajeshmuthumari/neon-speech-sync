import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Clock, Brain, FileText, TrendingUp, Heart } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

interface AnalysisHistoryItem {
  id: string;
  created_at: string;
  transcription: string;
  overall_sentiment: string;
  sentiment_score: number;
  empathy_score: number;
  political_positioning: string;
  urgency_level: string;
  key_themes: string[];
  processing_status: string;
}

interface AnalysisHistoryProps {
  onSelectAnalysis: (analysis: any) => void;
}

export function AnalysisHistory({ onSelectAnalysis }: AnalysisHistoryProps) {
  const [analyses, setAnalyses] = useState<AnalysisHistoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();

  useEffect(() => {
    fetchAnalysisHistory();
  }, [user]);

  const fetchAnalysisHistory = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('analysis_results')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(10);

      if (error) throw error;
      setAnalyses(data || []);
    } catch (error) {
      console.error('Error fetching analysis history:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString() + ' ' + date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const getSentimentColor = (sentiment: string) => {
    switch (sentiment?.toLowerCase()) {
      case 'positive': return 'bg-green-100 text-green-800 border-green-200';
      case 'negative': return 'bg-red-100 text-red-800 border-red-200';
      case 'neutral': return 'bg-gray-100 text-gray-800 border-gray-200';
      default: return 'bg-blue-100 text-blue-800 border-blue-200';
    }
  };

  const getPositioningColor = (positioning: string) => {
    switch (positioning?.toLowerCase()) {
      case 'aggressor': return 'bg-red-100 text-red-800';
      case 'defender': return 'bg-blue-100 text-blue-800';
      case 'visionary': return 'bg-purple-100 text-purple-800';
      case 'neutral': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getUrgencyColor = (urgency: string) => {
    switch (urgency?.toLowerCase()) {
      case 'high': return 'bg-red-100 text-red-800';
      case 'medium': return 'bg-yellow-100 text-yellow-800';
      case 'low': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  if (loading) {
    return (
      <Card className="glass">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="w-5 h-5" />
            Analysis History
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="animate-pulse space-y-3">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="h-20 bg-muted/50 rounded-lg" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="glass">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Clock className="w-5 h-5" />
          Analysis History ({analyses.length})
        </CardTitle>
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-96">
          <div className="space-y-3">
            {analyses.map((analysis) => (
              <div
                key={analysis.id}
                className="p-4 rounded-lg border bg-card/50 hover:bg-card/70 transition-colors cursor-pointer"
                onClick={() => onSelectAnalysis(analysis)}
              >
                <div className="flex items-start justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <Brain className="w-4 h-4 text-primary" />
                    <span className="text-sm font-medium">
                      {formatDate(analysis.created_at)}
                    </span>
                  </div>
                  <Badge variant={analysis.processing_status === 'completed' ? 'default' : 'secondary'}>
                    {analysis.processing_status}
                  </Badge>
                </div>

                {/* Transcription Preview */}
                <div className="mb-3">
                  <div className="flex items-center gap-1 mb-1">
                    <FileText className="w-3 h-3 text-muted-foreground" />
                    <span className="text-xs text-muted-foreground">Transcript</span>
                  </div>
                  <p className="text-sm text-muted-foreground line-clamp-2">
                    {analysis.transcription?.substring(0, 120)}...
                  </p>
                </div>

                {/* Analysis Metrics */}
                <div className="grid grid-cols-2 gap-2 mb-3">
                  {analysis.overall_sentiment && (
                    <div className="flex items-center gap-1">
                      <TrendingUp className="w-3 h-3" />
                      <Badge className={`${getSentimentColor(analysis.overall_sentiment)} text-xs`}>
                        {analysis.overall_sentiment}
                      </Badge>
                      {analysis.sentiment_score && (
                        <span className="text-xs text-muted-foreground">
                          ({analysis.sentiment_score > 0 ? '+' : ''}{analysis.sentiment_score?.toFixed(2)})
                        </span>
                      )}
                    </div>
                  )}

                  {analysis.empathy_score && (
                    <div className="flex items-center gap-1">
                      <Heart className="w-3 h-3" />
                      <span className="text-xs">Empathy: {analysis.empathy_score}%</span>
                    </div>
                  )}
                </div>

                {/* Enhanced Metrics */}
                <div className="flex flex-wrap gap-1">
                  {analysis.political_positioning && (
                    <Badge className={`${getPositioningColor(analysis.political_positioning)} text-xs`}>
                      {analysis.political_positioning}
                    </Badge>
                  )}
                  
                  {analysis.urgency_level && (
                    <Badge className={`${getUrgencyColor(analysis.urgency_level)} text-xs`}>
                      {analysis.urgency_level} Urgency
                    </Badge>
                  )}

                  {analysis.key_themes && analysis.key_themes.length > 0 && (
                    <Badge variant="outline" className="text-xs">
                      {analysis.key_themes.length} themes
                    </Badge>
                  )}
                </div>
              </div>
            ))}

            {analyses.length === 0 && (
              <div className="text-center py-8 text-muted-foreground">
                <Brain className="w-12 h-12 mx-auto mb-2 opacity-50" />
                <p>No analysis history yet</p>
                <p className="text-sm">Upload a video to get started</p>
              </div>
            )}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
}
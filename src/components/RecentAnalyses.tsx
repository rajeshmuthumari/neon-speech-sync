import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import { 
  History, 
  Clock, 
  TrendingUp, 
  Eye, 
  MoreHorizontal,
  Calendar,
  FileAudio,
  Brain
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useNavigate } from "react-router-dom";

interface RecentAnalysis {
  id: string;
  created_at: string;
  transcription: string;
  overall_sentiment: string;
  sentiment_score: number;
  empathy_score: number;
  processing_status: string;
}

export function RecentAnalyses() {
  const [analyses, setAnalyses] = useState<RecentAnalysis[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    fetchRecentAnalyses();
  }, [user]);

  const fetchRecentAnalyses = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('analysis_results')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(5);

      if (error) throw error;
      setAnalyses(data || []);
    } catch (error) {
      console.error('Error fetching recent analyses:', error);
    } finally {
      setLoading(false);
    }
  };

  const getSentimentColor = (sentiment: string) => {
    switch (sentiment?.toLowerCase()) {
      case 'positive': return 'bg-green-100 text-green-800 border-green-200';
      case 'negative': return 'bg-red-100 text-red-800 border-red-200';
      case 'neutral': return 'bg-gray-100 text-gray-800 border-gray-200';
      case 'mixed': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      default: return 'bg-blue-100 text-blue-800 border-blue-200';
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffHours / 24);

    if (diffHours < 1) return 'Just now';
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString();
  };

  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 90) return 'text-green-600';
    if (confidence >= 75) return 'text-blue-600';
    if (confidence >= 60) return 'text-yellow-600';
    return 'text-red-600';
  };

  if (loading) {
    return (
      <Card className="glass">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base">
            <History className="w-4 h-4" />
            Recent Analyses
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
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-base">
          <History className="w-4 h-4" />
          Recent Analyses
        </CardTitle>
      </CardHeader>
      
      <CardContent className="p-0">
        <ScrollArea className="h-96">
          <div className="px-6 space-y-3">
            {analyses.length > 0 ? analyses.map((analysis, index) => (
              <div key={analysis.id}>
                <div className="space-y-3 py-3">
                  {/* Header with title and actions */}
                  <div className="flex items-start justify-between">
                    <div className="flex-1 min-w-0">
                      <h4 className="font-medium text-sm truncate">
                        Analysis #{analysis.id.slice(-8)}
                      </h4>
                      <div className="flex items-center gap-2 mt-1">
                        <div className="flex items-center gap-1 text-xs text-muted-foreground">
                          <Clock className="w-3 h-3" />
                          {formatDate(analysis.created_at)}
                        </div>
                        <Badge variant={analysis.processing_status === 'completed' ? 'default' : 'secondary'} className="text-xs">
                          {analysis.processing_status}
                        </Badge>
                      </div>
                    </div>
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      className="h-8 w-8 p-0"
                      onClick={() => navigate(`/analysis/${analysis.id}`)}
                    >
                      <Eye className="w-3 h-3" />
                    </Button>
                  </div>
                  
                  {/* Transcription Preview */}
                  {analysis.transcription && (
                    <div className="mb-2">
                      <p className="text-xs text-muted-foreground line-clamp-2">
                        {analysis.transcription.substring(0, 100)}...
                      </p>
                    </div>
                  )}
                  
                  {/* Analysis metrics */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      {analysis.overall_sentiment && (
                        <Badge className={`text-xs px-2 py-1 ${getSentimentColor(analysis.overall_sentiment)}`}>
                          {analysis.overall_sentiment}
                        </Badge>
                      )}
                      {analysis.sentiment_score && (
                        <div className="flex items-center gap-1">
                          <TrendingUp className="w-3 h-3 text-muted-foreground" />
                          <span className={`text-xs font-medium ${getConfidenceColor(Math.abs(analysis.sentiment_score * 100))}`}>
                            {Math.abs(analysis.sentiment_score * 100).toFixed(0)}%
                          </span>
                        </div>
                      )}
                      {analysis.empathy_score && (
                        <span className="text-xs text-muted-foreground">
                          Empathy: {analysis.empathy_score}%
                        </span>
                      )}
                    </div>
                    
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      className="h-7 px-2 text-xs"
                      onClick={() => navigate(`/analysis/${analysis.id}`)}
                    >
                      <Eye className="w-3 h-3 mr-1" />
                      View
                    </Button>
                  </div>
                </div>
                
                {index < analyses.length - 1 && (
                  <Separator className="opacity-50" />
                )}
              </div>
            )) : (
              <div className="text-center py-8 text-muted-foreground">
                <Brain className="w-12 h-12 mx-auto mb-2 opacity-50" />
                <p>No recent analyses</p>
                <p className="text-sm">Upload a video to get started</p>
              </div>
            )}
          </div>
        </ScrollArea>
        
        {/* Footer */}
        <div className="p-4 pt-3 border-t">
          <Button variant="outline" className="w-full text-sm" size="sm">
            <Calendar className="w-3 h-3 mr-2" />
            View All History
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
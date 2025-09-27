import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Activity, TrendingUp, Brain } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

interface TodayStats {
  totalAnalyses: number;
  avgSentiment: string;
  avgConfidence: number;
  completedToday: number;
}

export function TodaysAnalytics() {
  const [stats, setStats] = useState<TodayStats>({
    totalAnalyses: 0,
    avgSentiment: 'N/A',
    avgConfidence: 0,
    completedToday: 0
  });
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();

  useEffect(() => {
    fetchTodayStats();
  }, [user]);

  const fetchTodayStats = async () => {
    if (!user) return;

    try {
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      // Get today's completed analyses
      const { data: todayAnalyses, error } = await supabase
        .from('analysis_results')
        .select('*')
        .eq('user_id', user.id)
        .gte('created_at', today.toISOString())
        .eq('processing_status', 'completed');

      if (error) throw error;

      // Get total analyses count
      const { count: totalCount } = await supabase
        .from('analysis_results')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user.id);

      const completedToday = todayAnalyses?.length || 0;
      
      // Calculate average sentiment
      let avgSentiment = 'N/A';
      let avgConfidence = 0;

      if (todayAnalyses && todayAnalyses.length > 0) {
        const sentiments = todayAnalyses.map(a => a.overall_sentiment).filter(Boolean);
        const confidences = todayAnalyses.map(a => a.sentiment_confidence || a.confidence_score).filter(Boolean);
        
        // Most common sentiment
        if (sentiments.length > 0) {
          const sentimentCounts = sentiments.reduce((acc: any, sentiment) => {
            acc[sentiment] = (acc[sentiment] || 0) + 1;
            return acc;
          }, {});
          avgSentiment = Object.keys(sentimentCounts).reduce((a, b) => 
            sentimentCounts[a] > sentimentCounts[b] ? a : b
          );
        }

        // Average confidence
        if (confidences.length > 0) {
          avgConfidence = Math.round(
            confidences.reduce((sum, conf) => sum + (conf * 100), 0) / confidences.length
          );
        }
      }

      setStats({
        totalAnalyses: totalCount || 0,
        avgSentiment,
        avgConfidence,
        completedToday
      });
    } catch (error) {
      console.error('Error fetching today stats:', error);
    } finally {
      setLoading(false);
    }
  };

  const getSentimentColor = (sentiment: string) => {
    switch (sentiment?.toLowerCase()) {
      case 'positive': return 'bg-green-100 text-green-800';
      case 'negative': return 'bg-red-100 text-red-800';
      case 'neutral': return 'bg-gray-100 text-gray-800';
      default: return 'bg-blue-100 text-blue-800';
    }
  };

  if (loading) {
    return (
      <Card className="glass">
        <CardHeader>
          <CardTitle className="text-sm font-medium">Today's Analytics</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="animate-pulse space-y-4">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-6 bg-muted/50 rounded" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="glass">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-sm font-medium">
          <Activity className="w-4 h-4 text-primary" />
          Today's Analytics
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center justify-between">
          <span className="text-sm text-muted-foreground">Total Analyses</span>
          <span className="font-semibold">{stats.totalAnalyses}</span>
        </div>
        
        <div className="flex items-center justify-between">
          <span className="text-sm text-muted-foreground">Completed Today</span>
          <div className="flex items-center gap-1">
            <Brain className="w-3 h-3 text-primary" />
            <span className="font-semibold">{stats.completedToday}</span>
          </div>
        </div>
        
        <div className="flex items-center justify-between">
          <span className="text-sm text-muted-foreground">Avg. Sentiment</span>
          <Badge className={getSentimentColor(stats.avgSentiment)}>
            {stats.avgSentiment}
          </Badge>
        </div>
        
        <div className="flex items-center justify-between">
          <span className="text-sm text-muted-foreground">Avg. Confidence</span>
          <div className="flex items-center gap-1">
            <TrendingUp className="w-3 h-3 text-muted-foreground" />
            <span className="font-semibold">
              {stats.avgConfidence > 0 ? `${stats.avgConfidence}%` : 'N/A'}
            </span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
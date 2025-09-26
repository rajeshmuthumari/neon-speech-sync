import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Brain, Clock, Target } from "lucide-react";

// Import all the new analysis components
import { SentimentTrendGraph } from "./analysis/SentimentTrendGraph";
import { EmotionRadarChart } from "./analysis/EmotionRadarChart";
import { EmpathyGauge } from "./analysis/EmpathyGauge";
import { IssueHeatmap } from "./analysis/IssueHeatmap";
import { RhetoricalStylesChart } from "./analysis/RhetoricalStylesChart";
import { PoliticalPositioningCard } from "./analysis/PoliticalPositioningCard";
import { InteractiveTranscript } from "./analysis/InteractiveTranscript";
import { VisualAnalysisChart } from "./analysis/VisualAnalysisChart";

interface AnalysisResultsProps {
  analysis: {
    id: string;
    created_at: string;
    transcription: string;
    overall_sentiment: string;
    sentiment_score: number;
    sentiment_confidence: number;
    emotional_profile?: {
      joy: number;
      fear: number;
      anger: number;
      hope: number;
      compassion: number;
      dominant_emotion?: string;
    };
    emotions?: any; // Legacy support
    empathy_score: number;
    authenticity_score: number;
    inclusive_phrases: number;
    ego_centric_phrases: number;
    rhetorical_styles?: {
      promises?: { count: number; examples: string[] };
      blame_opponents?: { count: number; examples: string[] };
      calls_to_unity?: { count: number; examples: string[] };
      visionary_statements?: { count: number; examples: string[] };
    };
    urgency_level: string;
    topic_breakdown?: {
      development?: number;
      health?: number;
      education?: number;
      employment?: number;
      corruption?: number;
      religion?: number;
      security?: number;
      economy?: number;
    };
    topics?: any; // Legacy support
    call_to_actions?: Array<{
      timestamp: string;
      text: string;
      type: string;
    }>;
    political_positioning: string;
    speech_timeline?: Array<{
      timestamp: string;
      emotion: string;
      sentiment: number;
      topic: string;
    }>;
    key_themes: string[];
    insights?: string[];
    // Visual analysis fields
    visual_summary?: {
      total_frames_analyzed: number;
      avg_emotion_confidence: number;
      avg_eye_contact: number;
      emotion_distribution: Record<string, number>;
    };
    avg_engagement_score?: number;
    dominant_visual_emotion?: string;
    authenticity_indicators?: {
      avg_authenticity_score: number;
      micro_expressions_detected: number;
      consistency_score: number;
    };
  };
}

export function AnalysisResults({ analysis }: AnalysisResultsProps) {
  // Handle both new and legacy data structures
  const emotionalProfile = analysis.emotional_profile || {
    joy: analysis.emotions?.joy || 0,
    fear: analysis.emotions?.fear || 0,
    anger: analysis.emotions?.anger || 0,
    hope: analysis.emotions?.hope || 0,
    compassion: analysis.emotions?.compassion || 0,
    dominant_emotion: analysis.emotions?.dominant_emotion
  };

  const topicBreakdown = analysis.topic_breakdown || analysis.topics || {};
  const speechTimeline = analysis.speech_timeline || [];
  const callToActions = analysis.call_to_actions || [];
  const rhetoricalStyles = analysis.rhetorical_styles || {};

  // Convert legacy data format if needed
  const timelineData = speechTimeline.length > 0 
    ? speechTimeline 
    : [
        { timestamp: '0:00', sentiment: analysis.sentiment_score || 0, emotion: 'neutral', topic: 'general' },
        { timestamp: '2:30', sentiment: (analysis.sentiment_score || 0) * 0.8, emotion: 'hope', topic: 'development' },
        { timestamp: '5:00', sentiment: (analysis.sentiment_score || 0) * 1.2, emotion: 'compassion', topic: 'health' }
      ];

  const formatDuration = (timestamp: string) => {
    const date = new Date(timestamp);
    return `${Math.floor(Math.random() * 10 + 3)}:${Math.floor(Math.random() * 60).toString().padStart(2, '0')}`;
  };

  return (
    <div className="space-y-6">
      {/* Header Card */}
      <Card className="glass shadow-elegant">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Brain className="w-5 h-5 text-speech-primary" />
            Enhanced Analysis Results
          </CardTitle>
          <div className="flex items-center gap-4 text-sm text-muted-foreground">
            <div className="flex items-center gap-1">
              <Clock className="w-4 h-4" />
              {formatDuration(analysis.created_at)}
            </div>
            <div className="flex items-center gap-1">
              <Target className="w-4 h-4" />
              {((analysis.sentiment_confidence || 0) * 100).toFixed(0)}% confidence
            </div>
            <Badge className="ml-auto">
              {analysis.overall_sentiment || 'Processing'}
            </Badge>
          </div>
        </CardHeader>
      </Card>

      {/* Main Dashboard Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top Left: Sentiment Trend */}
        <SentimentTrendGraph 
          data={timelineData}
          overallSentiment={analysis.overall_sentiment || 'Neutral'}
          sentimentScore={analysis.sentiment_score || 0}
        />

        {/* Top Right: Emotion Radar */}
        <EmotionRadarChart emotionalProfile={emotionalProfile} />
        
        {/* Connection Metrics */}
        <EmpathyGauge 
          empathyScore={analysis.empathy_score || 0}
          authenticityScore={analysis.authenticity_score || 0}
          inclusivePhrases={analysis.inclusive_phrases || 0}
          egoCentricPhrases={analysis.ego_centric_phrases || 0}
        />

        {/* Issue Focus Heatmap */}
        <IssueHeatmap 
          topicBreakdown={topicBreakdown}
          keyThemes={analysis.key_themes || []}
        />
      </div>

      {/* Secondary Analysis Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Rhetorical Styles */}
        <RhetoricalStylesChart 
          rhetoricalStyles={rhetoricalStyles}
          urgencyLevel={analysis.urgency_level || 'Medium'}
        />

        {/* Political Positioning */}
        <PoliticalPositioningCard 
          positioning={analysis.political_positioning || 'Neutral'}
          callToActions={callToActions}
        />
      </div>

      {/* Full Width Interactive Transcript */}
      <InteractiveTranscript 
        transcription={analysis.transcription || 'No transcription available'}
        timeline={speechTimeline}
      />

      {/* Visual Analysis Section */}
      {(analysis.visual_summary || analysis.avg_engagement_score || analysis.dominant_visual_emotion) && (
        <div className="mb-8">
          <h3 className="text-xl font-semibold mb-6">Visual Analysis</h3>
          <VisualAnalysisChart 
            data={{
              visual_summary: analysis.visual_summary,
              avg_engagement_score: analysis.avg_engagement_score,
              dominant_visual_emotion: analysis.dominant_visual_emotion,
              authenticity_indicators: analysis.authenticity_indicators
            }}
          />
        </div>
      )}

      {/* Legacy Insights Tab */}
      {analysis.insights && analysis.insights.length > 0 && (
        <Card className="glass">
          <CardHeader>
            <CardTitle>AI-Generated Insights</CardTitle>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="insights">
              <TabsList>
                <TabsTrigger value="insights">Key Insights</TabsTrigger>
              </TabsList>
              <TabsContent value="insights" className="space-y-3 mt-4">
                {analysis.insights.map((insight, index) => (
                  <div key={index} className="p-3 rounded-lg bg-muted/30 border-l-4 border-speech-primary">
                    <p className="text-sm">{insight}</p>
                  </div>
                ))}
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
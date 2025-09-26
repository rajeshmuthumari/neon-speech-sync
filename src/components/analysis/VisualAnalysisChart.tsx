import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from 'recharts';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';

interface VisualAnalysisData {
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
}

interface VisualAnalysisChartProps {
  data: VisualAnalysisData;
}

export const VisualAnalysisChart = ({ data }: VisualAnalysisChartProps) => {
  const {
    visual_summary,
    avg_engagement_score,
    dominant_visual_emotion,
    authenticity_indicators
  } = data;

  // Prepare emotion distribution data for chart
  const emotionData = visual_summary?.emotion_distribution 
    ? Object.entries(visual_summary.emotion_distribution).map(([emotion, count]) => ({
        emotion: emotion.charAt(0).toUpperCase() + emotion.slice(1),
        count: Number(count),
        percentage: Number(count) / visual_summary.total_frames_analyzed * 100
      }))
    : [];

  // Mock timeline data for demonstration
  const timelineData = [
    { timestamp: '0:00', engagement: 0.8, emotion_confidence: 0.9 },
    { timestamp: '1:00', engagement: 0.7, emotion_confidence: 0.85 },
    { timestamp: '2:00', engagement: 0.9, emotion_confidence: 0.92 },
    { timestamp: '3:00', engagement: 0.6, emotion_confidence: 0.78 },
    { timestamp: '4:00', engagement: 0.8, emotion_confidence: 0.88 },
  ];

  return (
    <div className="space-y-6">
      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Engagement Score</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {avg_engagement_score ? Math.round(avg_engagement_score * 100) : 0}%
            </div>
            <Progress 
              value={avg_engagement_score ? avg_engagement_score * 100 : 0} 
              className="mt-2" 
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Dominant Emotion</CardTitle>
          </CardHeader>
          <CardContent>
            <Badge variant="secondary" className="text-lg">
              {dominant_visual_emotion || 'N/A'}
            </Badge>
            <div className="text-sm text-muted-foreground mt-2">
              Throughout the speech
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Authenticity</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {authenticity_indicators ? Math.round(authenticity_indicators.avg_authenticity_score * 100) : 0}%
            </div>
            <div className="text-sm text-muted-foreground mt-2">
              Consistency score: {authenticity_indicators ? Math.round(authenticity_indicators.consistency_score * 100) : 0}%
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Emotion Distribution */}
      {emotionData.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Emotion Distribution</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={emotionData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="emotion" />
                <YAxis />
                <Tooltip 
                  formatter={(value, name) => [
                    name === 'count' ? `${value} frames` : `${Number(value).toFixed(1)}%`,
                    name === 'count' ? 'Frame Count' : 'Percentage'
                  ]}
                />
                <Bar dataKey="count" fill="hsl(var(--primary))" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      )}

      {/* Engagement Timeline */}
      <Card>
        <CardHeader>
          <CardTitle>Engagement & Emotion Timeline</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={timelineData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="timestamp" />
              <YAxis domain={[0, 1]} />
              <Tooltip 
                formatter={(value) => [`${(Number(value) * 100).toFixed(1)}%`, '']}
              />
              <Line 
                type="monotone" 
                dataKey="engagement" 
                stroke="hsl(var(--primary))" 
                strokeWidth={2}
                name="Engagement"
              />
              <Line 
                type="monotone" 
                dataKey="emotion_confidence" 
                stroke="hsl(var(--secondary))" 
                strokeWidth={2}
                name="Emotion Confidence"
              />
            </LineChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Analysis Summary */}
      {visual_summary && (
        <Card>
          <CardHeader>
            <CardTitle>Analysis Summary</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="font-medium">Frames Analyzed:</span>
                <span className="ml-2">{visual_summary.total_frames_analyzed}</span>
              </div>
              <div>
                <span className="font-medium">Avg Emotion Confidence:</span>
                <span className="ml-2">{Math.round(visual_summary.avg_emotion_confidence * 100)}%</span>
              </div>
              <div>
                <span className="font-medium">Avg Eye Contact:</span>
                <span className="ml-2">{Math.round(visual_summary.avg_eye_contact * 100)}%</span>
              </div>
              {authenticity_indicators && (
                <div>
                  <span className="font-medium">Micro-expressions:</span>
                  <span className="ml-2">{authenticity_indicators.micro_expressions_detected}</span>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};
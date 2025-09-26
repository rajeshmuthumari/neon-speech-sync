import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface SentimentTrendData {
  timestamp: string;
  sentiment: number;
  emotion: string;
  topic: string;
}

interface SentimentTrendGraphProps {
  data: SentimentTrendData[];
  overallSentiment: string;
  sentimentScore: number;
}

export function SentimentTrendGraph({ data, overallSentiment, sentimentScore }: SentimentTrendGraphProps) {
  const getSentimentColor = (score: number) => {
    if (score > 0.3) return '#10b981'; // Green for positive
    if (score < -0.3) return '#ef4444'; // Red for negative
    return '#f59e0b'; // Yellow for neutral
  };

  const formatSentimentScore = (score: number) => {
    return score > 0 ? `+${score.toFixed(2)}` : score.toFixed(2);
  };

  return (
    <Card className="glass">
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span>Sentiment Timeline</span>
          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground">{overallSentiment}</span>
            <span 
              className="text-lg font-bold"
              style={{ color: getSentimentColor(sentimentScore) }}
            >
              {formatSentimentScore(sentimentScore)}
            </span>
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={data}>
              <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
              <XAxis 
                dataKey="timestamp" 
                className="text-xs"
                tick={{ fontSize: 12 }}
              />
              <YAxis 
                domain={[-1, 1]}
                className="text-xs"
                tick={{ fontSize: 12 }}
              />
              <Tooltip 
                content={({ active, payload, label }) => {
                  if (active && payload && payload.length) {
                    const data = payload[0].payload;
                    return (
                      <div className="bg-background/95 backdrop-blur-sm border rounded-lg p-3 shadow-lg">
                        <p className="font-semibold">{`Time: ${label}`}</p>
                        <p style={{ color: getSentimentColor(data.sentiment) }}>
                          {`Sentiment: ${formatSentimentScore(data.sentiment)}`}
                        </p>
                        <p className="text-sm text-muted-foreground">{`Emotion: ${data.emotion}`}</p>
                        <p className="text-sm text-muted-foreground">{`Topic: ${data.topic}`}</p>
                      </div>
                    );
                  }
                  return null;
                }}
              />
              <Line 
                type="monotone" 
                dataKey="sentiment" 
                stroke={getSentimentColor(sentimentScore)}
                strokeWidth={3}
                dot={{ fill: getSentimentColor(sentimentScore), strokeWidth: 2, r: 4 }}
                activeDot={{ r: 6, stroke: getSentimentColor(sentimentScore), strokeWidth: 2 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}
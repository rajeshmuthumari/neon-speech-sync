import { Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, ResponsiveContainer } from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface EmotionalProfile {
  joy: number;
  fear: number;
  anger: number;
  hope: number;
  compassion: number;
  dominant_emotion?: string;
}

interface EmotionRadarChartProps {
  emotionalProfile: EmotionalProfile;
}

export function EmotionRadarChart({ emotionalProfile }: EmotionRadarChartProps) {
  const data = [
    {
      emotion: 'Joy',
      value: emotionalProfile.joy || 0,
      fullMark: 100,
    },
    {
      emotion: 'Hope',
      value: emotionalProfile.hope || 0,
      fullMark: 100,
    },
    {
      emotion: 'Compassion',
      value: emotionalProfile.compassion || 0,
      fullMark: 100,
    },
    {
      emotion: 'Fear',
      value: emotionalProfile.fear || 0,
      fullMark: 100,
    },
    {
      emotion: 'Anger',
      value: emotionalProfile.anger || 0,
      fullMark: 100,
    },
  ];

  const getEmotionColor = (emotion: string) => {
    const colors = {
      'joy': '#10b981',
      'hope': '#3b82f6',
      'compassion': '#8b5cf6',
      'fear': '#f59e0b',
      'anger': '#ef4444',
    };
    return colors[emotion.toLowerCase() as keyof typeof colors] || '#6b7280';
  };

  const dominantEmotion = emotionalProfile.dominant_emotion || 
    data.reduce((prev, current) => (prev.value > current.value) ? prev : current).emotion.toLowerCase();

  return (
    <Card className="glass">
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span>Emotional Profile</span>
          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground">Dominant:</span>
            <span 
              className="text-sm font-semibold capitalize"
              style={{ color: getEmotionColor(dominantEmotion) }}
            >
              {dominantEmotion}
            </span>
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <RadarChart data={data}>
              <PolarGrid gridType="polygon" className="opacity-30" />
              <PolarAngleAxis 
                dataKey="emotion" 
                tick={{ fontSize: 12, fill: 'currentColor' }}
                className="text-foreground"
              />
              <PolarRadiusAxis
                angle={90}
                domain={[0, 100]}
                tick={{ fontSize: 10, fill: 'currentColor' }}
                className="text-muted-foreground"
              />
              <Radar
                name="Emotional Intensity"
                dataKey="value"
                stroke="hsl(var(--primary))"
                fill="hsl(var(--primary))"
                fillOpacity={0.3}
                strokeWidth={2}
                dot={{ fill: 'hsl(var(--primary))', strokeWidth: 2, r: 4 }}
              />
            </RadarChart>
          </ResponsiveContainer>
        </div>
        
        {/* Emotion Legend */}
        <div className="grid grid-cols-2 gap-2 mt-4 text-sm">
          {data.map((item) => (
            <div key={item.emotion} className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div 
                  className="w-3 h-3 rounded-full"
                  style={{ backgroundColor: getEmotionColor(item.emotion) }}
                />
                <span>{item.emotion}</span>
              </div>
              <span className="font-semibold">{item.value}%</span>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
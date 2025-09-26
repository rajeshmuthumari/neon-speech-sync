import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer, Tooltip } from 'recharts';
import { Badge } from "@/components/ui/badge";

interface TopicBreakdown {
  development?: number;
  health?: number;
  education?: number;
  employment?: number;
  corruption?: number;
  religion?: number;
  security?: number;
  economy?: number;
}

interface IssueHeatmapProps {
  topicBreakdown: TopicBreakdown;
  keyThemes: string[];
}

export function IssueHeatmap({ topicBreakdown, keyThemes }: IssueHeatmapProps) {
  const topicData = Object.entries(topicBreakdown || {})
    .map(([topic, percentage]) => ({
      topic: topic.charAt(0).toUpperCase() + topic.slice(1),
      percentage: typeof percentage === 'number' ? percentage : 0,
      value: typeof percentage === 'number' ? percentage : 0,
    }))
    .sort((a, b) => b.percentage - a.percentage);

  const getIntensityColor = (percentage: number) => {
    if (percentage >= 20) return '#ef4444'; // High intensity - red
    if (percentage >= 15) return '#f97316'; // Medium-high intensity - orange  
    if (percentage >= 10) return '#eab308'; // Medium intensity - yellow
    if (percentage >= 5) return '#22c55e'; // Low-medium intensity - green
    return '#64748b'; // Low intensity - gray
  };

  const getIntensityLabel = (percentage: number) => {
    if (percentage >= 20) return 'High Focus';
    if (percentage >= 15) return 'Strong Focus';
    if (percentage >= 10) return 'Moderate Focus';
    if (percentage >= 5) return 'Light Focus';
    return 'Minimal Focus';
  };

  return (
    <Card className="glass">
      <CardHeader>
        <CardTitle>Issue Focus Heatmap</CardTitle>
        <p className="text-sm text-muted-foreground">
          Percentage of speech time spent on each topic
        </p>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Bar Chart */}
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={topicData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
              <XAxis 
                dataKey="topic" 
                angle={-45}
                textAnchor="end"
                height={80}
                tick={{ fontSize: 11 }}
              />
              <YAxis 
                tick={{ fontSize: 11 }}
                label={{ value: '% of Speech', angle: -90, position: 'insideLeft' }}
              />
              <Tooltip 
                content={({ active, payload, label }) => {
                  if (active && payload && payload.length) {
                    const data = payload[0].payload;
                    return (
                      <div className="bg-background/95 backdrop-blur-sm border rounded-lg p-3 shadow-lg">
                        <p className="font-semibold">{label}</p>
                        <p style={{ color: getIntensityColor(data.percentage) }}>
                          {`${data.percentage.toFixed(1)}% of speech`}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          {getIntensityLabel(data.percentage)}
                        </p>
                      </div>
                    );
                  }
                  return null;
                }}
              />
              <Bar 
                dataKey="percentage" 
                fill="hsl(var(--primary))"
                radius={[4, 4, 0, 0]}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Topic Grid */}
        <div className="grid grid-cols-2 gap-3">
          {topicData.map((item) => (
            <div key={item.topic} className="flex items-center justify-between p-3 rounded-lg border bg-card/50">
              <div className="flex items-center gap-2">
                <div 
                  className="w-3 h-3 rounded-full"
                  style={{ backgroundColor: getIntensityColor(item.percentage) }}
                />
                <span className="text-sm font-medium">{item.topic}</span>
              </div>
              <div className="text-right">
                <div className="text-sm font-bold">{item.percentage.toFixed(1)}%</div>
                <div className="text-xs text-muted-foreground">
                  {getIntensityLabel(item.percentage)}
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Key Themes */}
        {keyThemes && keyThemes.length > 0 && (
          <div className="space-y-2">
            <h4 className="text-sm font-medium">Key Themes</h4>
            <div className="flex flex-wrap gap-2">
              {keyThemes.map((theme, index) => (
                <Badge key={index} variant="secondary" className="text-xs">
                  {theme}
                </Badge>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
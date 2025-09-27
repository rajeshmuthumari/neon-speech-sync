import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  ArrowLeft, 
  TrendingUp, 
  TrendingDown, 
  Minus,
  Brain,
  BarChart3,
  Target,
  Clock
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar } from 'recharts';

interface ComparisonAnalysis {
  id: string;
  created_at: string;
  video_title: string;
  overall_sentiment: string;
  empathy_score: number;
  political_positioning: string;
  urgency_level: string;
  confidence_score: number;
  authenticity_score: number;
  emotions: any;
  rhetorical_styles: any;
}

export default function SpeechComparison() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [searchParams] = useSearchParams();
  const [analyses, setAnalyses] = useState<ComparisonAnalysis[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      fetchComparisonData();
    }
  }, [user, searchParams]);

  const fetchComparisonData = async () => {
    try {
      const analysisIds = searchParams.get('analyses')?.split(',') || [];
      
      if (analysisIds.length < 2) {
        toast({
          title: "Invalid Selection",
          description: "Please select at least 2 analyses to compare",
          variant: "destructive"
        });
        navigate('/history');
        return;
      }

      const { data, error } = await supabase
        .from('analysis_results')
        .select(`
          id,
          created_at,
          overall_sentiment,
          empathy_score,
          political_positioning,
          urgency_level,
          confidence_score,
          authenticity_score,
          emotions,
          rhetorical_styles,
          videos (
            title
          )
        `)
        .in('id', analysisIds)
        .eq('user_id', user?.id);

      if (error) throw error;

      const formattedData = data?.map(item => ({
        ...item,
        video_title: item.videos?.title || 'Untitled'
      })) || [];

      setAnalyses(formattedData);
    } catch (error) {
      console.error('Error fetching comparison data:', error);
      toast({
        title: "Error",
        description: "Failed to load comparison data",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const getScoreComparison = (current: number, previous: number) => {
    const diff = current - previous;
    if (Math.abs(diff) < 1) return { icon: Minus, color: 'text-gray-500', text: 'No change' };
    if (diff > 0) return { icon: TrendingUp, color: 'text-green-500', text: `+${diff.toFixed(1)}` };
    return { icon: TrendingDown, color: 'text-red-500', text: diff.toFixed(1) };
  };

  const getRadarData = () => {
    return analyses.map((analysis, index) => ({
      name: `Speech ${index + 1}`,
      empathy: analysis.empathy_score || 0,
      confidence: (analysis.confidence_score || 0) * 100,
      authenticity: (analysis.authenticity_score || 0) * 100,
    }));
  };

  const getTimelineData = () => {
    return analyses.map((analysis, index) => ({
      name: `Speech ${index + 1}`,
      date: new Date(analysis.created_at).toLocaleDateString(),
      empathy: analysis.empathy_score || 0,
      confidence: (analysis.confidence_score || 0) * 100,
      authenticity: (analysis.authenticity_score || 0) * 100,
    }));
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-speech-primary"></div>
      </div>
    );
  }

  if (analyses.length < 2) {
    return (
      <div className="min-h-screen bg-background p-6">
        <Card className="max-w-2xl mx-auto glass text-center py-12">
          <CardContent>
            <Brain className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-xl font-semibold mb-2">Insufficient Data</h3>
            <p className="text-muted-foreground mb-4">
              At least 2 analyses are required for comparison
            </p>
            <Button onClick={() => navigate('/history')}>
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to History
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" onClick={() => navigate('/history')}>
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to History
        </Button>
        <div>
          <h1 className="text-4xl font-bold gradient-text">Speech Comparison</h1>
          <p className="text-muted-foreground mt-2">
            Compare {analyses.length} speeches to track improvement and identify patterns
          </p>
        </div>
      </div>

      <Tabs defaultValue="overview" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="metrics">Key Metrics</TabsTrigger>
          <TabsTrigger value="evolution">Evolution</TabsTrigger>
          <TabsTrigger value="insights">Insights</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          {/* Speech Overview Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {analyses.map((analysis, index) => (
              <Card key={analysis.id} className="glass">
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    <span className="line-clamp-1">Speech {index + 1}</span>
                    <Badge variant="secondary">
                      {new Date(analysis.created_at).toLocaleDateString()}
                    </Badge>
                  </CardTitle>
                  <p className="text-sm text-muted-foreground line-clamp-2">
                    {analysis.video_title}
                  </p>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>Empathy Score</span>
                      <span className="font-semibold">{analysis.empathy_score || 0}%</span>
                    </div>
                    <Progress value={analysis.empathy_score || 0} className="h-2" />
                  </div>
                  
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>Confidence</span>
                      <span className="font-semibold">{Math.round((analysis.confidence_score || 0) * 100)}%</span>
                    </div>
                    <Progress value={(analysis.confidence_score || 0) * 100} className="h-2" />
                  </div>

                  <div className="pt-2 space-y-1">
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Sentiment:</span>
                      <Badge variant="outline" className="text-xs">
                        {analysis.overall_sentiment || 'Unknown'}
                      </Badge>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Position:</span>
                      <span className="text-xs font-medium line-clamp-1">
                        {analysis.political_positioning || 'Not analyzed'}
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="metrics" className="space-y-6">
          {/* Radar Chart Comparison */}
          <Card className="glass">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Target className="w-5 h-5" />
                Performance Radar
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={400}>
                <RadarChart data={getRadarData()}>
                  <PolarGrid />
                  <PolarAngleAxis dataKey="name" />
                  <PolarRadiusAxis domain={[0, 100]} />
                  {analyses.map((_, index) => (
                    <Radar
                      key={index}
                      name={`Speech ${index + 1}`}
                      dataKey={`speech${index + 1}`}
                      stroke={`hsl(${(index * 120) % 360}, 70%, 50%)`}
                      fill={`hsl(${(index * 120) % 360}, 70%, 50%)`}
                      fillOpacity={0.1}
                    />
                  ))}
                  <Legend />
                </RadarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Metric Comparisons */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card className="glass">
              <CardHeader>
                <CardTitle className="text-lg">Empathy Score Trend</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {analyses.map((analysis, index) => {
                    const prevScore = index > 0 ? analyses[index - 1].empathy_score : analysis.empathy_score;
                    const comparison = getScoreComparison(analysis.empathy_score || 0, prevScore || 0);
                    const Icon = comparison.icon;
                    
                    return (
                      <div key={analysis.id} className="flex items-center justify-between">
                        <span className="text-sm">Speech {index + 1}</span>
                        <div className="flex items-center gap-2">
                          <span className="font-semibold">{analysis.empathy_score || 0}%</span>
                          {index > 0 && (
                            <div className={`flex items-center gap-1 ${comparison.color}`}>
                              <Icon className="w-4 h-4" />
                              <span className="text-xs">{comparison.text}</span>
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>

            <Card className="glass">
              <CardHeader>
                <CardTitle className="text-lg">Confidence Trend</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {analyses.map((analysis, index) => {
                    const currentScore = (analysis.confidence_score || 0) * 100;
                    const prevScore = index > 0 ? (analyses[index - 1].confidence_score || 0) * 100 : currentScore;
                    const comparison = getScoreComparison(currentScore, prevScore);
                    const Icon = comparison.icon;
                    
                    return (
                      <div key={analysis.id} className="flex items-center justify-between">
                        <span className="text-sm">Speech {index + 1}</span>
                        <div className="flex items-center gap-2">
                          <span className="font-semibold">{Math.round(currentScore)}%</span>
                          {index > 0 && (
                            <div className={`flex items-center gap-1 ${comparison.color}`}>
                              <Icon className="w-4 h-4" />
                              <span className="text-xs">{comparison.text}</span>
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>

            <Card className="glass">
              <CardHeader>
                <CardTitle className="text-lg">Authenticity Trend</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {analyses.map((analysis, index) => {
                    const currentScore = (analysis.authenticity_score || 0) * 100;
                    const prevScore = index > 0 ? (analyses[index - 1].authenticity_score || 0) * 100 : currentScore;
                    const comparison = getScoreComparison(currentScore, prevScore);
                    const Icon = comparison.icon;
                    
                    return (
                      <div key={analysis.id} className="flex items-center justify-between">
                        <span className="text-sm">Speech {index + 1}</span>
                        <div className="flex items-center gap-2">
                          <span className="font-semibold">{Math.round(currentScore)}%</span>
                          {index > 0 && (
                            <div className={`flex items-center gap-1 ${comparison.color}`}>
                              <Icon className="w-4 h-4" />
                              <span className="text-xs">{comparison.text}</span>
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="evolution" className="space-y-6">
          <Card className="glass">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="w-5 h-5" />
                Performance Evolution
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={400}>
                <LineChart data={getTimelineData()}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis domain={[0, 100]} />
                  <Tooltip />
                  <Legend />
                  <Line 
                    type="monotone" 
                    dataKey="empathy" 
                    stroke="hsl(var(--primary))" 
                    strokeWidth={2}
                    name="Empathy Score"
                  />
                  <Line 
                    type="monotone" 
                    dataKey="confidence" 
                    stroke="hsl(220, 70%, 50%)" 
                    strokeWidth={2}
                    name="Confidence Score"
                  />
                  <Line 
                    type="monotone" 
                    dataKey="authenticity" 
                    stroke="hsl(280, 70%, 50%)" 
                    strokeWidth={2}
                    name="Authenticity Score"
                  />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="insights" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card className="glass">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Brain className="w-5 h-5" />
                  Key Improvements
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {analyses.length > 1 && (
                    <>
                      <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
                        <h4 className="font-semibold text-green-800 mb-1">Strengths</h4>
                        <p className="text-sm text-green-700">
                          Your empathy scores show consistent improvement over time.
                        </p>
                      </div>
                      <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                        <h4 className="font-semibold text-blue-800 mb-1">Opportunities</h4>
                        <p className="text-sm text-blue-700">
                          Focus on maintaining authenticity while building confidence.
                        </p>
                      </div>
                    </>
                  )}
                </div>
              </CardContent>
            </Card>

            <Card className="glass">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BarChart3 className="w-5 h-5" />
                  Recommendations
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="p-3 bg-purple-50 border border-purple-200 rounded-lg">
                    <h4 className="font-semibold text-purple-800 mb-1">Next Steps</h4>
                    <ul className="text-sm text-purple-700 space-y-1">
                      <li>• Practice emotional storytelling techniques</li>
                      <li>• Work on consistent body language</li>
                      <li>• Develop signature rhetorical patterns</li>
                    </ul>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
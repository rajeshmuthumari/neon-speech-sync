import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { 
  ArrowLeft, 
  TrendingUp, 
  Calendar,
  Activity,
  Users,
  Target,
  BarChart3,
  PieChart,
  LineChart
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { 
  LineChart as RechartsLineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  ResponsiveContainer,
  BarChart,
  Bar,
  PieChart as RechartsPieChart,
  Pie,
  Cell,
  AreaChart,
  Area
} from 'recharts';

interface AnalyticsData {
  totalAnalyses: number;
  thisMonthAnalyses: number;
  avgEmpathyScore: number;
  avgConfidenceScore: number;
  sentimentDistribution: { [key: string]: number };
  monthlyTrends: Array<{ month: string; analyses: number; avgEmpathy: number; avgConfidence: number }>;
  topTopics: Array<{ topic: string; count: number }>;
  performanceMetrics: Array<{ metric: string; current: number; previous: number; change: number }>;
}

const COLORS = ['#8884d8', '#82ca9d', '#ffc658', '#ff7c7c', '#8dd1e1'];

export default function AnalyticsDashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [timeRange, setTimeRange] = useState("6months");

  useEffect(() => {
    if (user) {
      fetchAnalytics();
    }
  }, [user, timeRange]);

  const fetchAnalytics = async () => {
    try {
      // Calculate date range
      const endDate = new Date();
      const startDate = new Date();
      
      switch (timeRange) {
        case "1month":
          startDate.setMonth(endDate.getMonth() - 1);
          break;
        case "3months":
          startDate.setMonth(endDate.getMonth() - 3);
          break;
        case "6months":
          startDate.setMonth(endDate.getMonth() - 6);
          break;
        case "1year":
          startDate.setFullYear(endDate.getFullYear() - 1);
          break;
      }

      // Fetch analysis data
      const { data: analysesData, error } = await supabase
        .from('analysis_results')
        .select('*')
        .eq('user_id', user?.id)
        .gte('created_at', startDate.toISOString())
        .order('created_at', { ascending: true });

      if (error) throw error;

      // Process analytics data
      const processedData = processAnalyticsData(analysesData || []);
      setAnalytics(processedData);
      
    } catch (error) {
      console.error('Error fetching analytics:', error);
      toast({
        title: "Error",
        description: "Failed to load analytics data",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const processAnalyticsData = (data: any[]): AnalyticsData => {
    const totalAnalyses = data.length;
    
    // This month analyses
    const thisMonth = new Date();
    thisMonth.setDate(1);
    const thisMonthAnalyses = data.filter(item => 
      new Date(item.created_at) >= thisMonth
    ).length;

    // Average scores
    const empathyScores = data.filter(item => item.empathy_score !== null).map(item => item.empathy_score);
    const confidenceScores = data.filter(item => item.confidence_score !== null).map(item => item.confidence_score * 100);
    
    const avgEmpathyScore = empathyScores.length > 0 
      ? empathyScores.reduce((a, b) => a + b, 0) / empathyScores.length 
      : 0;
    
    const avgConfidenceScore = confidenceScores.length > 0 
      ? confidenceScores.reduce((a, b) => a + b, 0) / confidenceScores.length 
      : 0;

    // Sentiment distribution
    const sentimentDistribution: { [key: string]: number } = {};
    data.forEach(item => {
      const sentiment = item.overall_sentiment || 'Unknown';
      sentimentDistribution[sentiment] = (sentimentDistribution[sentiment] || 0) + 1;
    });

    // Monthly trends
    const monthlyData: { [key: string]: { count: number; empathy: number[]; confidence: number[] } } = {};
    data.forEach(item => {
      const month = new Date(item.created_at).toLocaleDateString('en-US', { year: 'numeric', month: 'short' });
      if (!monthlyData[month]) {
        monthlyData[month] = { count: 0, empathy: [], confidence: [] };
      }
      monthlyData[month].count++;
      if (item.empathy_score !== null) monthlyData[month].empathy.push(item.empathy_score);
      if (item.confidence_score !== null) monthlyData[month].confidence.push(item.confidence_score * 100);
    });

    const monthlyTrends = Object.entries(monthlyData).map(([month, stats]) => ({
      month,
      analyses: stats.count,
      avgEmpathy: stats.empathy.length > 0 ? stats.empathy.reduce((a, b) => a + b, 0) / stats.empathy.length : 0,
      avgConfidence: stats.confidence.length > 0 ? stats.confidence.reduce((a, b) => a + b, 0) / stats.confidence.length : 0,
    }));

    // Top topics (placeholder - would need topic extraction from analysis)
    const topTopics = [
      { topic: 'Leadership', count: Math.floor(totalAnalyses * 0.3) },
      { topic: 'Policy', count: Math.floor(totalAnalyses * 0.25) },
      { topic: 'Community', count: Math.floor(totalAnalyses * 0.2) },
      { topic: 'Innovation', count: Math.floor(totalAnalyses * 0.15) },
      { topic: 'Other', count: Math.floor(totalAnalyses * 0.1) },
    ];

    // Performance metrics
    const performanceMetrics = [
      {
        metric: 'Empathy Score',
        current: avgEmpathyScore,
        previous: avgEmpathyScore * 0.9, // Simulated previous period
        change: avgEmpathyScore * 0.1
      },
      {
        metric: 'Confidence Score',
        current: avgConfidenceScore,
        previous: avgConfidenceScore * 0.85,
        change: avgConfidenceScore * 0.15
      },
      {
        metric: 'Analysis Frequency',
        current: thisMonthAnalyses,
        previous: thisMonthAnalyses * 0.8,
        change: thisMonthAnalyses * 0.2
      }
    ];

    return {
      totalAnalyses,
      thisMonthAnalyses,
      avgEmpathyScore,
      avgConfidenceScore,
      sentimentDistribution,
      monthlyTrends,
      topTopics,
      performanceMetrics
    };
  };

  const getSentimentChartData = () => {
    if (!analytics) return [];
    return Object.entries(analytics.sentimentDistribution).map(([name, value]) => ({
      name,
      value
    }));
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-speech-primary"></div>
      </div>
    );
  }

  if (!analytics) {
    return (
      <div className="min-h-screen bg-background p-6">
        <Card className="max-w-2xl mx-auto glass text-center py-12">
          <CardContent>
            <BarChart3 className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-xl font-semibold mb-2">No Data Available</h3>
            <p className="text-muted-foreground mb-4">
              Start analyzing speeches to see your analytics dashboard
            </p>
            <Button onClick={() => navigate('/dashboard')}>
              Go to Dashboard
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" onClick={() => navigate('/dashboard')}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Dashboard
          </Button>
          <div>
            <h1 className="text-4xl font-bold gradient-text">Analytics Dashboard</h1>
            <p className="text-muted-foreground mt-2">
              Track your speech analysis performance and trends
            </p>
          </div>
        </div>
        <Select value={timeRange} onValueChange={setTimeRange}>
          <SelectTrigger className="w-40">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="1month">Last Month</SelectItem>
            <SelectItem value="3months">Last 3 Months</SelectItem>
            <SelectItem value="6months">Last 6 Months</SelectItem>
            <SelectItem value="1year">Last Year</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card className="glass">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Analyses</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{analytics.totalAnalyses}</div>
            <p className="text-xs text-muted-foreground">
              +{analytics.thisMonthAnalyses} this month
            </p>
          </CardContent>
        </Card>

        <Card className="glass">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg Empathy Score</CardTitle>
            <Target className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{Math.round(analytics.avgEmpathyScore)}%</div>
            <p className="text-xs text-green-600">
              <TrendingUp className="w-3 h-3 inline mr-1" />
              +5% from last period
            </p>
          </CardContent>
        </Card>

        <Card className="glass">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg Confidence</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{Math.round(analytics.avgConfidenceScore)}%</div>
            <p className="text-xs text-green-600">
              <TrendingUp className="w-3 h-3 inline mr-1" />
              +8% from last period
            </p>
          </CardContent>
        </Card>

        <Card className="glass">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">This Month</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{analytics.thisMonthAnalyses}</div>
            <p className="text-xs text-muted-foreground">
              analyses completed
            </p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="trends" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="trends">Trends</TabsTrigger>
          <TabsTrigger value="performance">Performance</TabsTrigger>
          <TabsTrigger value="sentiment">Sentiment</TabsTrigger>
          <TabsTrigger value="topics">Topics</TabsTrigger>
        </TabsList>

        <TabsContent value="trends" className="space-y-6">
          <Card className="glass">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <LineChart className="w-5 h-5" />
                Performance Trends Over Time
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={400}>
                <AreaChart data={analytics.monthlyTrends}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Area 
                    type="monotone" 
                    dataKey="avgEmpathy" 
                    stackId="1"
                    stroke="hsl(var(--primary))" 
                    fill="hsl(var(--primary))"
                    fillOpacity={0.3}
                    name="Avg Empathy Score"
                  />
                  <Area 
                    type="monotone" 
                    dataKey="avgConfidence" 
                    stackId="2"
                    stroke="hsl(220, 70%, 50%)" 
                    fill="hsl(220, 70%, 50%)"
                    fillOpacity={0.3}
                    name="Avg Confidence Score"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <Card className="glass">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="w-5 h-5" />
                Analysis Frequency
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={analytics.monthlyTrends}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="analyses" fill="hsl(var(--primary))" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="performance" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {analytics.performanceMetrics.map((metric, index) => (
              <Card key={index} className="glass">
                <CardHeader>
                  <CardTitle className="text-lg">{metric.metric}</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">Current</span>
                      <span className="text-2xl font-bold">
                        {Math.round(metric.current)}{metric.metric.includes('Score') ? '%' : ''}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">Previous</span>
                      <span className="text-sm">
                        {Math.round(metric.previous)}{metric.metric.includes('Score') ? '%' : ''}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">Change</span>
                      <div className="flex items-center gap-1 text-green-600">
                        <TrendingUp className="w-3 h-3" />
                        <span className="text-sm">
                          +{Math.round(metric.change)}{metric.metric.includes('Score') ? '%' : ''}
                        </span>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="sentiment" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card className="glass">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <PieChart className="w-5 h-5" />
                  Sentiment Distribution
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <RechartsPieChart>
                    <Pie
                      data={getSentimentChartData()}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {getSentimentChartData().map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </RechartsPieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card className="glass">
              <CardHeader>
                <CardTitle>Sentiment Breakdown</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {Object.entries(analytics.sentimentDistribution).map(([sentiment, count], index) => (
                    <div key={sentiment} className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div 
                          className="w-3 h-3 rounded-full" 
                          style={{ backgroundColor: COLORS[index % COLORS.length] }}
                        />
                        <span className="capitalize">{sentiment}</span>
                      </div>
                      <Badge variant="secondary">{count} analyses</Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="topics" className="space-y-6">
          <Card className="glass">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Target className="w-5 h-5" />
                Most Discussed Topics
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={400}>
                <BarChart data={analytics.topTopics} layout="horizontal">
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis type="number" />
                  <YAxis dataKey="topic" type="category" width={80} />
                  <Tooltip />
                  <Bar dataKey="count" fill="hsl(var(--primary))" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
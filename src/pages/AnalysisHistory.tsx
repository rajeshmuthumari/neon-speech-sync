import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { 
  Search, 
  Calendar, 
  Filter, 
  Eye, 
  Download, 
  GitCompare,
  ArrowLeft,
  Brain,
  Activity,
  TrendingUp
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";

interface AnalysisRecord {
  id: string;
  created_at: string;
  video_id: string;
  overall_sentiment: string;
  empathy_score: number;
  political_positioning: string;
  urgency_level: string;
  processing_status: string;
  confidence_score: number;
  video_title: string;
}

export default function AnalysisHistory() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [analyses, setAnalyses] = useState<AnalysisRecord[]>([]);
  const [filteredAnalyses, setFilteredAnalyses] = useState<AnalysisRecord[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [sentimentFilter, setSentimentFilter] = useState("all");
  const [sortBy, setSortBy] = useState("created_at");
  const [loading, setLoading] = useState(true);
  const [selectedAnalyses, setSelectedAnalyses] = useState<string[]>([]);

  useEffect(() => {
    if (user) {
      fetchAnalyses();
    }
  }, [user]);

  useEffect(() => {
    filterAndSortAnalyses();
  }, [analyses, searchTerm, sentimentFilter, sortBy]);

  const fetchAnalyses = async () => {
    try {
      const { data, error } = await supabase
        .from('analysis_results')
        .select(`
          id,
          created_at,
          video_id,
          overall_sentiment,
          empathy_score,
          political_positioning,
          urgency_level,
          processing_status,
          confidence_score,
          videos (
            title
          )
        `)
        .eq('user_id', user?.id)
        .order('created_at', { ascending: false });

      if (error) throw error;

      const formattedData = data?.map(item => ({
        ...item,
        video_title: item.videos?.title || 'Untitled'
      })) || [];

      setAnalyses(formattedData);
    } catch (error) {
      console.error('Error fetching analyses:', error);
      toast({
        title: "Error",
        description: "Failed to load analysis history",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const filterAndSortAnalyses = () => {
    let filtered = [...analyses];

    // Search filter
    if (searchTerm) {
      filtered = filtered.filter(analysis =>
        analysis.video_title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        analysis.political_positioning?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Sentiment filter
    if (sentimentFilter !== "all") {
      filtered = filtered.filter(analysis => 
        analysis.overall_sentiment?.toLowerCase() === sentimentFilter
      );
    }

    // Sort
    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'created_at':
          return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
        case 'empathy_score':
          return (b.empathy_score || 0) - (a.empathy_score || 0);
        case 'confidence_score':
          return (b.confidence_score || 0) - (a.confidence_score || 0);
        default:
          return 0;
      }
    });

    setFilteredAnalyses(filtered);
  };

  const handleAnalysisSelect = (analysisId: string) => {
    setSelectedAnalyses(prev => 
      prev.includes(analysisId) 
        ? prev.filter(id => id !== analysisId)
        : [...prev, analysisId]
    );
  };

  const handleCompareSelected = () => {
    if (selectedAnalyses.length < 2) {
      toast({
        title: "Selection Required",
        description: "Please select at least 2 analyses to compare",
        variant: "destructive"
      });
      return;
    }
    navigate(`/compare?analyses=${selectedAnalyses.join(',')}`);
  };

  const getSentimentColor = (sentiment: string) => {
    switch (sentiment?.toLowerCase()) {
      case 'positive': return 'bg-green-100 text-green-800 border-green-200';
      case 'negative': return 'bg-red-100 text-red-800 border-red-200';
      case 'neutral': return 'bg-gray-100 text-gray-800 border-gray-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getUrgencyColor = (urgency: string) => {
    switch (urgency?.toLowerCase()) {
      case 'high': return 'bg-red-100 text-red-800 border-red-200';
      case 'medium': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'low': return 'bg-green-100 text-green-800 border-green-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-speech-primary"></div>
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
            <h1 className="text-4xl font-bold gradient-text">Analysis History</h1>
            <p className="text-muted-foreground mt-2">
              View and manage your past speech analyses
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {selectedAnalyses.length > 0 && (
            <Button onClick={handleCompareSelected} className="glass">
              <GitCompare className="w-4 h-4 mr-2" />
              Compare Selected ({selectedAnalyses.length})
            </Button>
          )}
        </div>
      </div>

      {/* Filters */}
      <Card className="glass">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="w-5 h-5" />
            Filters & Search
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by title or topic..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            
            <Select value={sentimentFilter} onValueChange={setSentimentFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Filter by sentiment" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Sentiments</SelectItem>
                <SelectItem value="positive">Positive</SelectItem>
                <SelectItem value="neutral">Neutral</SelectItem>
                <SelectItem value="negative">Negative</SelectItem>
              </SelectContent>
            </Select>

            <Select value={sortBy} onValueChange={setSortBy}>
              <SelectTrigger>
                <SelectValue placeholder="Sort by" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="created_at">Date Created</SelectItem>
                <SelectItem value="empathy_score">Empathy Score</SelectItem>
                <SelectItem value="confidence_score">Confidence Score</SelectItem>
              </SelectContent>
            </Select>

            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Activity className="w-4 h-4" />
              {filteredAnalyses.length} of {analyses.length} analyses
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Analysis Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredAnalyses.map((analysis) => (
          <Card 
            key={analysis.id} 
            className={`glass cursor-pointer transition-all hover:shadow-glow ${
              selectedAnalyses.includes(analysis.id) ? 'ring-2 ring-speech-primary' : ''
            }`}
            onClick={() => handleAnalysisSelect(analysis.id)}
          >
            <CardHeader>
              <div className="flex items-start justify-between">
                <CardTitle className="text-lg line-clamp-2">
                  {analysis.video_title}
                </CardTitle>
                <input
                  type="checkbox"
                  checked={selectedAnalyses.includes(analysis.id)}
                  onChange={() => handleAnalysisSelect(analysis.id)}
                  className="w-4 h-4 text-speech-primary focus:ring-speech-primary"
                />
              </div>
              <p className="text-sm text-muted-foreground">
                {new Date(analysis.created_at).toLocaleDateString()}
              </p>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-2">
                <Badge 
                  variant="secondary" 
                  className={getSentimentColor(analysis.overall_sentiment)}
                >
                  {analysis.overall_sentiment || 'Unknown'}
                </Badge>
                <Badge 
                  variant="secondary" 
                  className={getUrgencyColor(analysis.urgency_level)}
                >
                  {analysis.urgency_level || 'Unknown'}
                </Badge>
              </div>

              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Empathy Score</span>
                  <span className="font-semibold">{analysis.empathy_score || 0}%</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>Confidence</span>
                  <span className="font-semibold">{Math.round((analysis.confidence_score || 0) * 100)}%</span>
                </div>
                <div className="text-sm">
                  <span className="text-muted-foreground">Position: </span>
                  <span className="font-medium">{analysis.political_positioning || 'Not analyzed'}</span>
                </div>
              </div>

              <div className="flex gap-2 pt-2">
                <Button 
                  size="sm" 
                  variant="outline" 
                  onClick={(e) => {
                    e.stopPropagation();
                    navigate(`/analysis/${analysis.id}`);
                  }}
                  className="flex-1"
                >
                  <Eye className="w-4 h-4 mr-1" />
                  View
                </Button>
                <Button 
                  size="sm" 
                  variant="outline"
                  onClick={(e) => {
                    e.stopPropagation();
                    // Export functionality will be implemented
                    toast({
                      title: "Export",
                      description: "Export functionality coming soon"
                    });
                  }}
                >
                  <Download className="w-4 h-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {filteredAnalyses.length === 0 && (
        <Card className="glass text-center py-12">
          <CardContent>
            <Brain className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-xl font-semibold mb-2">No Analyses Found</h3>
            <p className="text-muted-foreground mb-4">
              {searchTerm || sentimentFilter !== "all" 
                ? "Try adjusting your filters or search terms"
                : "Start by analyzing your first speech on the dashboard"
              }
            </p>
            <Button onClick={() => navigate('/dashboard')}>
              <TrendingUp className="w-4 h-4 mr-2" />
              Go to Dashboard
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
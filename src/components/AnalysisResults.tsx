import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Brain, 
  Heart, 
  TrendingUp, 
  MessageSquare, 
  Clock, 
  Target,
  BarChart3,
  Volume2,
  Lightbulb,
  CheckCircle
} from "lucide-react";

interface AnalysisResultsProps {
  analysis: {
    id: string;
    timestamp: string;
    duration: string;
    sentiment: string;
    confidence: number;
    emotions: {
      joy: number;
      confidence: number;
      neutral: number;
      concern: number;
    };
    keywords: string[];
    transcription: string;
    insights: string[];
  };
}

export function AnalysisResults({ analysis }: AnalysisResultsProps) {
  const getSentimentColor = (sentiment: string) => {
    switch (sentiment.toLowerCase()) {
      case 'positive': return 'bg-speech-success';
      case 'negative': return 'bg-speech-error';
      case 'neutral': return 'bg-speech-secondary';
      default: return 'bg-muted';
    }
  };

  const getEmotionColor = (emotion: string, value: number) => {
    const intensity = value > 70 ? 'high' : value > 40 ? 'medium' : 'low';
    switch (emotion) {
      case 'joy': return intensity === 'high' ? 'bg-speech-success' : 'bg-speech-success/60';
      case 'confidence': return intensity === 'high' ? 'bg-speech-primary' : 'bg-speech-primary/60';
      case 'concern': return intensity === 'high' ? 'bg-speech-warning' : 'bg-speech-warning/60';
      default: return 'bg-muted';
    }
  };

  return (
    <Card className="glass shadow-elegant">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Brain className="w-5 h-5 text-speech-primary" />
          Analysis Results
        </CardTitle>
        <div className="flex items-center gap-4 text-sm text-muted-foreground">
          <div className="flex items-center gap-1">
            <Clock className="w-4 h-4" />
            {analysis.duration}
          </div>
          <div className="flex items-center gap-1">
            <Target className="w-4 h-4" />
            {analysis.confidence}% confidence
          </div>
        </div>
      </CardHeader>
      
      <CardContent>
        <Tabs defaultValue="overview" className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="emotions">Emotions</TabsTrigger>
            <TabsTrigger value="transcript">Transcript</TabsTrigger>
            <TabsTrigger value="insights">Insights</TabsTrigger>
          </TabsList>
          
          <TabsContent value="overview" className="space-y-6 mt-6">
            {/* Sentiment Analysis */}
            <div className="space-y-3">
              <h4 className="font-semibold flex items-center gap-2">
                <TrendingUp className="w-4 h-4" />
                Overall Sentiment
              </h4>
              <div className="flex items-center gap-3">
                <Badge className={getSentimentColor(analysis.sentiment)}>
                  {analysis.sentiment}
                </Badge>
                <div className="flex-1">
                  <Progress value={analysis.confidence} className="h-2" />
                </div>
                <span className="text-sm text-muted-foreground">
                  {analysis.confidence}%
                </span>
              </div>
            </div>
            
            <Separator />
            
            {/* Key Emotions */}
            <div className="space-y-3">
              <h4 className="font-semibold flex items-center gap-2">
                <Heart className="w-4 h-4" />
                Emotional Profile
              </h4>
              <div className="grid grid-cols-2 gap-3">
                {Object.entries(analysis.emotions).map(([emotion, value]) => (
                  <div key={emotion} className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="capitalize font-medium">{emotion}</span>
                      <span>{value}%</span>
                    </div>
                    <div className="w-full bg-muted rounded-full h-2">
                      <div 
                        className={`h-2 rounded-full ${getEmotionColor(emotion, value)}`}
                        style={{ width: `${value}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
            
            <Separator />
            
            {/* Keywords */}
            <div className="space-y-3">
              <h4 className="font-semibold flex items-center gap-2">
                <MessageSquare className="w-4 h-4" />
                Key Topics
              </h4>
              <div className="flex flex-wrap gap-2">
                {analysis.keywords.map((keyword, index) => (
                  <Badge key={index} variant="outline" className="text-speech-primary border-speech-primary">
                    {keyword}
                  </Badge>
                ))}
              </div>
            </div>
          </TabsContent>
          
          <TabsContent value="emotions" className="space-y-6 mt-6">
            <div className="space-y-4">
              <h4 className="font-semibold flex items-center gap-2">
                <BarChart3 className="w-4 h-4" />
                Detailed Emotional Analysis
              </h4>
              
              {Object.entries(analysis.emotions).map(([emotion, value]) => (
                <div key={emotion} className="space-y-3 p-4 rounded-lg bg-muted/30">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className={`w-3 h-3 rounded-full ${getEmotionColor(emotion, value)}`} />
                      <span className="font-medium capitalize">{emotion}</span>
                    </div>
                    <Badge variant="secondary">{value}%</Badge>
                  </div>
                  
                  <Progress value={value} className="h-3" />
                  
                  <p className="text-sm text-muted-foreground">
                    {emotion === 'joy' && "Positive emotional indicators detected in speech patterns"}
                    {emotion === 'confidence' && "Strong conviction and certainty in voice delivery"}
                    {emotion === 'neutral' && "Balanced and objective tone throughout"}
                    {emotion === 'concern' && "Some hesitation or uncertainty detected"}
                  </p>
                </div>
              ))}
            </div>
          </TabsContent>
          
          <TabsContent value="transcript" className="space-y-6 mt-6">
            <div className="space-y-4">
              <h4 className="font-semibold flex items-center gap-2">
                <Volume2 className="w-4 h-4" />
                Speech Transcript
              </h4>
              
              <div className="p-4 bg-muted/30 rounded-lg">
                <p className="text-sm leading-relaxed">
                  {analysis.transcription}
                </p>
              </div>
              
              <div className="text-xs text-muted-foreground">
                * Transcript generated using AI speech-to-text technology
              </div>
            </div>
          </TabsContent>
          
          <TabsContent value="insights" className="space-y-6 mt-6">
            <div className="space-y-4">
              <h4 className="font-semibold flex items-center gap-2">
                <Lightbulb className="w-4 h-4" />
                AI-Generated Insights
              </h4>
              
              <div className="space-y-3">
                {analysis.insights.map((insight, index) => (
                  <div key={index} className="flex gap-3 p-3 rounded-lg bg-muted/30">
                    <CheckCircle className="w-5 h-5 text-speech-success mt-0.5 flex-shrink-0" />
                    <p className="text-sm">{insight}</p>
                  </div>
                ))}
              </div>
              
              <div className="mt-6 p-4 bg-speech-primary/10 rounded-lg border border-speech-primary/20">
                <h5 className="font-medium text-speech-primary mb-2">Recommendations</h5>
                <ul className="text-sm space-y-1 text-muted-foreground">
                  <li>• Consider practicing vocal variety to enhance engagement</li>
                  <li>• Maintain the positive energy detected in your speech</li>
                  <li>• Focus on key topics that resonated well with the analysis</li>
                </ul>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}
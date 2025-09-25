import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import { 
  History, 
  Clock, 
  TrendingUp, 
  Eye, 
  MoreHorizontal,
  Calendar,
  FileAudio
} from "lucide-react";

// Mock data for recent analyses
const recentAnalyses = [
  {
    id: "1",
    title: "Team Meeting Presentation",
    timestamp: "2 hours ago",
    duration: "3m 45s",
    sentiment: "Positive",
    confidence: 92,
    date: "Today"
  },
  {
    id: "2", 
    title: "Customer Call Recording",
    timestamp: "5 hours ago",
    duration: "12m 30s",
    sentiment: "Neutral",
    confidence: 78,
    date: "Today"
  },
  {
    id: "3",
    title: "Product Demo Session",
    timestamp: "1 day ago", 
    duration: "8m 15s",
    sentiment: "Positive",
    confidence: 89,
    date: "Yesterday"
  },
  {
    id: "4",
    title: "Training Workshop",
    timestamp: "2 days ago",
    duration: "15m 22s", 
    sentiment: "Positive",
    confidence: 85,
    date: "Dec 23"
  },
  {
    id: "5",
    title: "Feedback Session",
    timestamp: "3 days ago",
    duration: "6m 18s",
    sentiment: "Mixed",
    confidence: 74,
    date: "Dec 22"
  }
];

export function RecentAnalyses() {
  const getSentimentColor = (sentiment: string) => {
    switch (sentiment.toLowerCase()) {
      case 'positive': return 'bg-speech-success text-white';
      case 'negative': return 'bg-speech-error text-white';
      case 'neutral': return 'bg-speech-secondary text-white';
      case 'mixed': return 'bg-speech-warning text-white';
      default: return 'bg-muted';
    }
  };

  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 90) return 'text-speech-success';
    if (confidence >= 75) return 'text-speech-primary';
    if (confidence >= 60) return 'text-speech-warning';
    return 'text-speech-error';
  };

  return (
    <Card className="glass">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-base">
          <History className="w-4 h-4" />
          Recent Analyses
        </CardTitle>
      </CardHeader>
      
      <CardContent className="p-0">
        <ScrollArea className="h-96">
          <div className="px-6 space-y-3">
            {recentAnalyses.map((analysis, index) => (
              <div key={analysis.id}>
                <div className="space-y-3 py-3">
                  {/* Header with title and actions */}
                  <div className="flex items-start justify-between">
                    <div className="flex-1 min-w-0">
                      <h4 className="font-medium text-sm truncate">
                        {analysis.title}
                      </h4>
                      <div className="flex items-center gap-2 mt-1">
                        <div className="flex items-center gap-1 text-xs text-muted-foreground">
                          <Clock className="w-3 h-3" />
                          {analysis.timestamp}
                        </div>
                        <div className="flex items-center gap-1 text-xs text-muted-foreground">
                          <FileAudio className="w-3 h-3" />
                          {analysis.duration}
                        </div>
                      </div>
                    </div>
                    <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                      <MoreHorizontal className="w-3 h-3" />
                    </Button>
                  </div>
                  
                  {/* Analysis metrics */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Badge 
                        className={`text-xs px-2 py-1 ${getSentimentColor(analysis.sentiment)}`}
                      >
                        {analysis.sentiment}
                      </Badge>
                      <div className="flex items-center gap-1">
                        <TrendingUp className="w-3 h-3 text-muted-foreground" />
                        <span className={`text-xs font-medium ${getConfidenceColor(analysis.confidence)}`}>
                          {analysis.confidence}%
                        </span>
                      </div>
                    </div>
                    
                    <Button variant="ghost" size="sm" className="h-7 px-2 text-xs">
                      <Eye className="w-3 h-3 mr-1" />
                      View
                    </Button>
                  </div>
                </div>
                
                {index < recentAnalyses.length - 1 && (
                  <Separator className="opacity-50" />
                )}
              </div>
            ))}
          </div>
        </ScrollArea>
        
        {/* Footer */}
        <div className="p-4 pt-3 border-t">
          <Button variant="outline" className="w-full text-sm" size="sm">
            <Calendar className="w-3 h-3 mr-2" />
            View All History
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
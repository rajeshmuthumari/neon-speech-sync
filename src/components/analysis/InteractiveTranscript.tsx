import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Play, Pause, FileText, Filter } from "lucide-react";

interface TimelinePoint {
  timestamp: string;
  emotion: string;
  sentiment: number;
  topic: string;
}

interface InteractiveTranscriptProps {
  transcription: string;
  timeline: TimelinePoint[];
}

export function InteractiveTranscript({ transcription, timeline }: InteractiveTranscriptProps) {
  const [selectedFilter, setSelectedFilter] = useState<string>('all');
  const [isPlaying, setIsPlaying] = useState(false);

  // Mock function to parse transcript into segments based on timeline
  const parseTranscriptSegments = () => {
    if (!transcription || !timeline?.length) {
      return [{ text: transcription || 'No transcription available', timestamp: '0:00', emotion: 'neutral', sentiment: 0, topic: 'general' }];
    }

    // For demo purposes, split transcript into roughly equal segments based on timeline
    const words = transcription.split(' ');
    const segmentSize = Math.ceil(words.length / timeline.length);
    
    return timeline.map((point, index) => {
      const startIndex = index * segmentSize;
      const endIndex = Math.min(startIndex + segmentSize, words.length);
      const segmentText = words.slice(startIndex, endIndex).join(' ');
      
      return {
        text: segmentText,
        timestamp: point.timestamp,
        emotion: point.emotion,
        sentiment: point.sentiment,
        topic: point.topic
      };
    });
  };

  const segments = parseTranscriptSegments();
  
  const getEmotionColor = (emotion: string) => {
    const colors = {
      'joy': 'bg-green-100 text-green-800 border-green-200',
      'hope': 'bg-blue-100 text-blue-800 border-blue-200',
      'compassion': 'bg-purple-100 text-purple-800 border-purple-200',
      'fear': 'bg-yellow-100 text-yellow-800 border-yellow-200',
      'anger': 'bg-red-100 text-red-800 border-red-200',
      'neutral': 'bg-gray-100 text-gray-800 border-gray-200'
    };
    return colors[emotion as keyof typeof colors] || colors.neutral;
  };

  const getSentimentIntensity = (sentiment: number) => {
    const intensity = Math.abs(sentiment);
    if (intensity > 0.7) return 'border-l-4';
    if (intensity > 0.4) return 'border-l-3';
    return 'border-l-2';
  };

  const uniqueEmotions = [...new Set(segments.map(s => s.emotion))];
  const uniqueTopics = [...new Set(segments.map(s => s.topic))];

  const filteredSegments = selectedFilter === 'all' 
    ? segments 
    : segments.filter(s => s.emotion === selectedFilter || s.topic === selectedFilter);

  return (
    <Card className="glass">
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <FileText className="w-5 h-5" />
            Interactive Transcript
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsPlaying(!isPlaying)}
              className="flex items-center gap-1"
            >
              {isPlaying ? <Pause className="w-3 h-3" /> : <Play className="w-3 h-3" />}
              {isPlaying ? 'Pause' : 'Play'}
            </Button>
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Filters */}
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-muted-foreground" />
            <span className="text-sm font-medium">Filter by:</span>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button
              variant={selectedFilter === 'all' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setSelectedFilter('all')}
            >
              All
            </Button>
            {uniqueEmotions.map(emotion => (
              <Button
                key={emotion}
                variant={selectedFilter === emotion ? 'default' : 'outline'}
                size="sm"
                onClick={() => setSelectedFilter(emotion)}
                className={selectedFilter === emotion ? '' : getEmotionColor(emotion)}
              >
                {emotion}
              </Button>
            ))}
          </div>
        </div>

        {/* Transcript */}
        <ScrollArea className="h-96">
          <div className="space-y-3 pr-4">
            {filteredSegments.map((segment, index) => (
              <div
                key={index}
                className={`p-3 rounded-lg border-l-4 bg-card/50 hover:bg-card/70 transition-colors cursor-pointer ${getSentimentIntensity(segment.sentiment)}`}
                style={{
                  borderLeftColor: segment.sentiment > 0 ? '#10b981' : segment.sentiment < 0 ? '#ef4444' : '#6b7280'
                }}
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="text-xs">
                      {segment.timestamp}
                    </Badge>
                    <Badge className={`${getEmotionColor(segment.emotion)} text-xs`}>
                      {segment.emotion}
                    </Badge>
                    <Badge variant="secondary" className="text-xs">
                      {segment.topic}
                    </Badge>
                  </div>
                  <div className="flex items-center gap-1">
                    <span className="text-xs text-muted-foreground">
                      Sentiment: {segment.sentiment > 0 ? '+' : ''}{segment.sentiment.toFixed(2)}
                    </span>
                  </div>
                </div>
                <p className="text-sm leading-relaxed">{segment.text}</p>
              </div>
            ))}
          </div>
        </ScrollArea>

        {/* Summary */}
        <div className="pt-3 border-t">
          <div className="grid grid-cols-3 gap-4 text-center">
            <div>
              <div className="text-lg font-bold">{segments.length}</div>
              <div className="text-xs text-muted-foreground">Segments</div>
            </div>
            <div>
              <div className="text-lg font-bold">{uniqueEmotions.length}</div>
              <div className="text-xs text-muted-foreground">Emotions</div>
            </div>
            <div>
              <div className="text-lg font-bold">{uniqueTopics.length}</div>
              <div className="text-xs text-muted-foreground">Topics</div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
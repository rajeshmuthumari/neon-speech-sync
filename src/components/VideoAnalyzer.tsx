import { useState, useRef, useCallback } from 'react';
import { pipeline, env } from '@huggingface/transformers';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Loader2, Play, Pause, Camera } from 'lucide-react';

// Configure transformers.js
env.allowLocalModels = false;
env.useBrowserCache = true;

interface VisualFrame {
  timestamp: number;
  emotion: string;
  emotion_confidence: number;
  engagement_score: number;
  eye_contact_score: number;
  authenticity_score: number;
}

interface VideoAnalyzerProps {
  videoFile: File;
  onAnalysisComplete: (frames: VisualFrame[]) => void;
}

export const VideoAnalyzer = ({ videoFile, onAnalysisComplete }: VideoAnalyzerProps) => {
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [currentStage, setCurrentStage] = useState('');
  const [analyzedFrames, setAnalyzedFrames] = useState<VisualFrame[]>([]);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const analyzeVideo = useCallback(async () => {
    if (!videoFile || !videoRef.current || !canvasRef.current) return;

    setIsAnalyzing(true);
    setProgress(0);
    setCurrentStage('Loading models...');

    try {
      // Load emotion recognition model
      const emotionClassifier = await pipeline(
        'image-classification',
        'onnx-community/emotion-ferplus-8',
        { device: 'webgpu' }
      );

      setCurrentStage('Processing video frames...');

      const video = videoRef.current;
      const canvas = canvasRef.current;
      const ctx = canvas.getContext('2d');

      if (!ctx) throw new Error('Could not get canvas context');

      // Set canvas dimensions
      canvas.width = 224;
      canvas.height = 224;

      const frames: VisualFrame[] = [];
      const frameInterval = 2; // Analyze every 2 seconds
      const videoDuration = video.duration;
      const totalFrames = Math.floor(videoDuration / frameInterval);

      for (let i = 0; i < totalFrames; i++) {
        const timestamp = i * frameInterval;
        
        // Seek to timestamp
        video.currentTime = timestamp;
        await new Promise(resolve => {
          video.onseeked = resolve;
        });

        // Draw frame to canvas
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

        // Get image data
        const imageData = canvas.toDataURL('image/jpeg', 0.8);

        try {
          // Analyze emotion
          const emotionResults = await emotionClassifier(imageData);
          
          // Handle different return types from the classifier
          const topEmotion = Array.isArray(emotionResults) ? emotionResults[0] : emotionResults;
          
          // Ensure we have the correct properties
          const emotionLabel = (topEmotion as any).label || 'neutral';
          const emotionScore = (topEmotion as any).score || 0.5;

          // Calculate engagement and authenticity scores (simplified)
          const engagementScore = Math.random() * 0.3 + 0.7; // Mock for now
          const eyeContactScore = Math.random() * 0.4 + 0.6; // Mock for now
          const authenticityScore = emotionScore > 0.8 ? 0.9 : 0.7; // Based on confidence

          const frame: VisualFrame = {
            timestamp,
            emotion: emotionLabel.toLowerCase(),
            emotion_confidence: emotionScore,
            engagement_score: engagementScore,
            eye_contact_score: eyeContactScore,
            authenticity_score: authenticityScore
          };

          frames.push(frame);
          setAnalyzedFrames([...frames]);

        } catch (error) {
          console.warn('Failed to analyze frame at', timestamp, error);
        }

        // Update progress
        const progress = ((i + 1) / totalFrames) * 100;
        setProgress(progress);
        setCurrentStage(`Analyzing frame ${i + 1} of ${totalFrames}`);
      }

      setCurrentStage('Analysis complete!');
      onAnalysisComplete(frames);

    } catch (error) {
      console.error('Video analysis error:', error);
      setCurrentStage('Analysis failed');
    } finally {
      setIsAnalyzing(false);
    }
  }, [videoFile, onAnalysisComplete]);

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Camera className="h-5 w-5" />
          Visual Analysis
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Hidden video and canvas elements */}
        <video
          ref={videoRef}
          src={videoFile ? URL.createObjectURL(videoFile) : ''}
          className="hidden"
          preload="metadata"
        />
        <canvas ref={canvasRef} className="hidden" />

        {/* Analysis controls */}
        <div className="flex gap-2">
          <Button
            onClick={analyzeVideo}
            disabled={isAnalyzing || !videoFile}
            className="flex items-center gap-2"
          >
            {isAnalyzing ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Play className="h-4 w-4" />
            )}
            {isAnalyzing ? 'Analyzing...' : 'Start Visual Analysis'}
          </Button>
        </div>

        {/* Progress */}
        {isAnalyzing && (
          <div className="space-y-2">
            <Progress value={progress} className="w-full" />
            <p className="text-sm text-muted-foreground">{currentStage}</p>
          </div>
        )}

        {/* Results preview */}
        {analyzedFrames.length > 0 && (
          <div className="space-y-2">
            <h4 className="font-semibold">Analysis Progress</h4>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
              {analyzedFrames.slice(-8).map((frame, index) => (
                <Card key={index} className="p-2">
                  <div className="text-xs space-y-1">
                    <div className="font-mono">{Math.floor(frame.timestamp / 60)}:{String(Math.floor(frame.timestamp % 60)).padStart(2, '0')}</div>
                    <Badge variant="secondary" className="text-xs">
                      {frame.emotion}
                    </Badge>
                    <div className="text-xs text-muted-foreground">
                      {Math.round(frame.emotion_confidence * 100)}% confidence
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
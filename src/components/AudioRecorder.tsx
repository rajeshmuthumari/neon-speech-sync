import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Mic, Square, Play, Pause } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface AudioRecorderProps {
  onAnalyze: (audioBlob: Blob) => void;
}

export function AudioRecorder({ onAnalyze }: AudioRecorderProps) {
  const [isRecording, setIsRecording] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const [audioUrl, setAudioUrl] = useState<string>("");
  
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      if (audioUrl) URL.revokeObjectURL(audioUrl);
    };
  }, [audioUrl]);

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      mediaRecorderRef.current = new MediaRecorder(stream);
      chunksRef.current = [];

      mediaRecorderRef.current.ondataavailable = (event) => {
        if (event.data.size > 0) {
          chunksRef.current.push(event.data);
        }
      };

      mediaRecorderRef.current.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: "audio/wav" });
        setAudioBlob(blob);
        const url = URL.createObjectURL(blob);
        setAudioUrl(url);
        
        // Stop all tracks to release microphone
        stream.getTracks().forEach(track => track.stop());
      };

      mediaRecorderRef.current.start();
      setIsRecording(true);
      setRecordingTime(0);

      timerRef.current = setInterval(() => {
        setRecordingTime(prev => prev + 1);
      }, 1000);

      toast({
        title: "Recording started",
        description: "Speak clearly into your microphone",
      });
    } catch (error) {
      toast({
        title: "Recording failed",
        description: "Please allow microphone access and try again",
        variant: "destructive",
      });
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      setIsPaused(false);
      
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  const handleAnalyze = () => {
    if (audioBlob) {
      onAnalyze(audioBlob);
    }
  };

  return (
    <Card className="glass">
      <CardContent className="p-6 text-center space-y-4">
        {/* Recording Visualization */}
        <div className="flex items-center justify-center space-x-2 h-16">
          {isRecording ? (
            <div className="flex items-center space-x-1">
              {Array.from({ length: 5 }).map((_, i) => (
                <div
                  key={i}
                  className="w-2 h-8 bg-speech-primary rounded animate-wave"
                  style={{ animationDelay: `${i * 0.1}s` }}
                />
              ))}
            </div>
          ) : (
            <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center">
              <Mic className="w-8 h-8 text-muted-foreground" />
            </div>
          )}
        </div>

        {/* Timer */}
        <div className="text-2xl font-mono">
          {formatTime(recordingTime)}
        </div>

        {/* Recording Controls */}
        <div className="flex items-center justify-center space-x-4">
          {!isRecording ? (
            <Button
              onClick={startRecording}
              size="lg"
              className="bg-speech-error hover:bg-speech-error/80 shadow-elegant"
            >
              <Mic className="w-5 h-5 mr-2" />
              Start Recording
            </Button>
          ) : (
            <Button
              onClick={stopRecording}
              size="lg"
              variant="outline"
              className="border-speech-error text-speech-error hover:bg-speech-error hover:text-white"
            >
              <Square className="w-5 h-5 mr-2" />
              Stop Recording
            </Button>
          )}
        </div>

        {/* Audio Playback */}
        {audioUrl && (
          <div className="space-y-4 pt-4 border-t">
            <audio controls src={audioUrl} className="w-full" />
            <Button
              onClick={handleAnalyze}
              className="w-full bg-speech-primary hover:bg-speech-secondary shadow-elegant"
            >
              Analyze Speech
            </Button>
          </div>
        )}

        <p className="text-sm text-muted-foreground">
          {isRecording 
            ? "Recording in progress. Click stop when finished."
            : "Click the record button to start capturing audio"
          }
        </p>
      </CardContent>
    </Card>
  );
}
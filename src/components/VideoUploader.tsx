import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Card, CardContent } from "@/components/ui/card";
import { Upload, Video, X, CheckCircle, AlertCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { VideoAnalyzer } from './VideoAnalyzer';

interface VideoUploaderProps {
  onAnalyze: (videoId: string) => void;
}

export function VideoUploader({ onAnalyze }: VideoUploaderProps) {
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isUploading, setIsUploading] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploadStatus, setUploadStatus] = useState<'idle' | 'uploading' | 'success' | 'error'>('idle');
  const [showVisualAnalyzer, setShowVisualAnalyzer] = useState(false);
  const [visualFrames, setVisualFrames] = useState<any[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('video/')) {
      toast({
        title: "Invalid file type",
        description: "Please select a video file.",
        variant: "destructive",
      });
      return;
    }

    // Validate file size (50MB limit)
    const maxSize = 50 * 1024 * 1024;
    if (file.size > maxSize) {
      toast({
        title: "File too large",
        description: "Please select a video file smaller than 50MB.",
        variant: "destructive",
      });
      return;
    }

    setSelectedFile(file);
    setUploadStatus('idle');
  };

  const handleVisualAnalysisComplete = (frames: any[]) => {
    setVisualFrames(frames);
    setShowVisualAnalyzer(false);
  };

  const uploadVideo = async () => {
    if (!selectedFile) return;

    setIsUploading(true);
    setUploadStatus('uploading');
    setUploadProgress(0);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        throw new Error('Please log in to upload videos');
      }

      // Create unique filename with sanitized name
      const timestamp = Date.now();
      // Sanitize filename to remove special characters
      const sanitizedName = selectedFile.name
        .replace(/[^\w\s.-]/g, '') // Remove special characters except word chars, spaces, dots, hyphens
        .replace(/\s+/g, '_') // Replace spaces with underscores
        .toLowerCase();
      const fileName = `${user.id}/${timestamp}_${sanitizedName}`;
      
      console.log('Uploading file with path:', fileName);
      
      // Upload to Supabase Storage
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('videos')
        .upload(fileName, selectedFile);

      if (uploadError) throw uploadError;

      // Simulate progress for user feedback
      const progressInterval = setInterval(() => {
        setUploadProgress(prev => {
          if (prev >= 100) {
            clearInterval(progressInterval);
            return 100;
          }
          return prev + 10;
        });
      }, 200);

      // Save video metadata to database
      const { data: videoData, error: dbError } = await supabase
        .from('videos')
        .insert({
          user_id: user.id,
          title: selectedFile.name,
          file_path: uploadData.path,
          file_size: selectedFile.size,
          mime_type: selectedFile.type,
          upload_status: 'uploaded'
        })
        .select()
        .single();

      if (dbError) throw dbError;

      // Start analysis
      onAnalyze(videoData.id);

      // Start analysis with visual frames if available
      const { error: analysisError } = await supabase.functions.invoke('analyze-speech', {
        body: { 
          video_id: videoData.id,
          visual_frames: visualFrames.length > 0 ? visualFrames : null
        }
      });

      if (analysisError) {
        console.error('Analysis error:', analysisError);
        throw new Error('Failed to start analysis');
      }

    } catch (error) {
      console.error('Upload error:', error);
      setUploadStatus('error');
      toast({
        title: "Upload failed",
        description: error instanceof Error ? error.message : "Failed to upload video",
        variant: "destructive",
      });
    } finally {
      setIsUploading(false);
    }
  };

  const clearSelection = () => {
    setSelectedFile(null);
    setUploadStatus('idle');
    setUploadProgress(0);
    setVisualFrames([]);
    setShowVisualAnalyzer(false);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const getVideoDuration = (file: File): Promise<number> => {
    return new Promise((resolve) => {
      const video = document.createElement('video');
      video.preload = 'metadata';
      video.onloadedmetadata = () => {
        resolve(video.duration);
      };
      video.src = URL.createObjectURL(file);
    });
  };

  return (
    <div className="space-y-4">
      <input
        ref={fileInputRef}
        type="file"
        accept="video/*"
        onChange={handleFileSelect}
        className="hidden"
      />

      {!selectedFile ? (
        <Card 
          className="border-2 border-dashed border-speech-primary/30 hover:border-speech-primary/50 transition-colors cursor-pointer"
          onClick={() => fileInputRef.current?.click()}
        >
          <CardContent className="flex flex-col items-center justify-center p-8 text-center">
            <Upload className="w-12 h-12 text-speech-primary mb-4" />
            <h3 className="text-lg font-semibold mb-2">Upload Video</h3>
            <p className="text-muted-foreground mb-4">
              Select a video file for political speech analysis
            </p>
            <p className="text-sm text-muted-foreground">
              Supports MP4, MOV, AVI, WebM • Max 50MB
            </p>
          </CardContent>
        </Card>
      ) : (
        <Card className="glass">
          <CardContent className="p-4">
            <div className="flex items-start gap-4">
              <Video className="w-10 h-10 text-speech-primary flex-shrink-0 mt-1" />
              
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between mb-2">
                  <h4 className="font-medium truncate">{selectedFile.name}</h4>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={clearSelection}
                    disabled={isUploading}
                  >
                    <X className="w-4 h-4" />
                  </Button>
                </div>
                
                <div className="flex items-center gap-4 text-sm text-muted-foreground mb-3">
                  <span>{formatFileSize(selectedFile.size)}</span>
                  <span>{selectedFile.type}</span>
                </div>

                {uploadStatus === 'uploading' && (
                  <div className="space-y-2 mb-3">
                    <div className="flex justify-between text-sm">
                      <span>Uploading...</span>
                      <span>{Math.round(uploadProgress)}%</span>
                    </div>
                    <Progress value={uploadProgress} className="h-2" />
                  </div>
                )}

                {uploadStatus === 'success' && (
                  <div className="flex items-center gap-2 text-speech-success text-sm mb-3">
                    <CheckCircle className="w-4 h-4" />
                    Upload successful
                  </div>
                )}

                {uploadStatus === 'error' && (
                  <div className="flex items-center gap-2 text-speech-error text-sm mb-3">
                    <AlertCircle className="w-4 h-4" />
                    Upload failed
                  </div>
                )}

                <div className="space-y-2">
                  <Button
                    onClick={() => setShowVisualAnalyzer(true)}
                    disabled={isUploading || uploadStatus === 'success'}
                    variant="outline"
                    className="w-full"
                  >
                    {visualFrames.length > 0 ? `Visual Analysis Complete (${visualFrames.length} frames)` : 'Start Visual Analysis'}
                  </Button>
                
                  <Button 
                    onClick={uploadVideo}
                    disabled={isUploading || uploadStatus === 'success'}
                    className="w-full"
                  >
                    {isUploading ? 'Uploading...' : 'Upload & Analyze'}
                  </Button>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Visual Analyzer Modal */}
      {showVisualAnalyzer && selectedFile && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-background rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-4 border-b flex justify-between items-center">
              <h2 className="text-lg font-semibold">Visual Analysis</h2>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowVisualAnalyzer(false)}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
            <div className="p-4">
              <VideoAnalyzer 
                videoFile={selectedFile} 
                onAnalysisComplete={handleVisualAnalysisComplete}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
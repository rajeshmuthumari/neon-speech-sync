import { useState, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { 
  Upload, 
  X, 
  CheckCircle, 
  AlertCircle, 
  Clock,
  FileAudio,
  FileVideo,
  Brain
} from "lucide-react";
import { useDropzone } from "react-dropzone";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";

interface BatchFile {
  file: File;
  id: string;
  status: 'pending' | 'uploading' | 'analyzing' | 'completed' | 'error';
  progress: number;
  videoId?: string;
  analysisId?: string;
  error?: string;
}

export function BatchAnalyzer() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [files, setFiles] = useState<BatchFile[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);

  const onDrop = useCallback((acceptedFiles: File[]) => {
    const newFiles: BatchFile[] = acceptedFiles.map((file) => ({
      file,
      id: `${Date.now()}-${Math.random()}`,
      status: 'pending',
      progress: 0
    }));
    
    setFiles(prev => [...prev, ...newFiles]);
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'audio/*': ['.mp3', '.wav', '.m4a', '.aac'],
      'video/*': ['.mp4', '.webm', '.mov', '.avi']
    },
    multiple: true,
    maxSize: 200 * 1024 * 1024 // 200MB
  });

  const removeFile = (fileId: string) => {
    setFiles(prev => prev.filter(f => f.id !== fileId));
  };

  const updateFileStatus = (fileId: string, updates: Partial<BatchFile>) => {
    setFiles(prev => prev.map(f => 
      f.id === fileId ? { ...f, ...updates } : f
    ));
  };

  const processFile = async (batchFile: BatchFile) => {
    try {
      if (!user) throw new Error('User not authenticated');

      // Update status to uploading
      updateFileStatus(batchFile.id, { status: 'uploading', progress: 10 });

      // Upload file to Supabase Storage
      const timestamp = Date.now();
      const fileName = `${user.id}/batch_${timestamp}_${batchFile.file.name}`;
      
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('videos')
        .upload(fileName, batchFile.file);

      if (uploadError) throw uploadError;

      updateFileStatus(batchFile.id, { progress: 30 });

      // Create video record
      const { data: videoData, error: videoError } = await supabase
        .from('videos')
        .insert({
          user_id: user.id,
          title: batchFile.file.name,
          file_path: uploadData.path,
          file_size: batchFile.file.size,
          mime_type: batchFile.file.type,
          upload_status: 'uploaded'
        })
        .select()
        .single();

      if (videoError) throw videoError;

      updateFileStatus(batchFile.id, { 
        status: 'analyzing', 
        progress: 50, 
        videoId: videoData.id 
      });

      // Start analysis
      const response = await supabase.functions.invoke('analyze-speech', {
        body: { videoId: videoData.id }
      });

      if (response.error) {
        throw new Error(response.error.message);
      }

      updateFileStatus(batchFile.id, { progress: 70 });

      // Poll for completion
      const pollForCompletion = async () => {
        const maxAttempts = 60; // 2 minutes max
        let attempts = 0;

        while (attempts < maxAttempts) {
          const { data: analysisData } = await supabase
            .from('analysis_results')
            .select('*')
            .eq('video_id', videoData.id)
            .single();

          if (analysisData && analysisData.processing_status === 'completed') {
            updateFileStatus(batchFile.id, { 
              status: 'completed', 
              progress: 100,
              analysisId: analysisData.id 
            });
            return;
          }

          if (analysisData && analysisData.processing_status === 'error') {
            throw new Error(analysisData.processing_error || 'Analysis failed');
          }

          attempts++;
          await new Promise(resolve => setTimeout(resolve, 2000));
          
          // Update progress during polling
          const pollProgress = 70 + (attempts / maxAttempts) * 25;
          updateFileStatus(batchFile.id, { progress: pollProgress });
        }

        throw new Error('Analysis timeout - please try again');
      };

      await pollForCompletion();

    } catch (error) {
      console.error('Batch processing error:', error);
      updateFileStatus(batchFile.id, { 
        status: 'error', 
        error: error instanceof Error ? error.message : 'Unknown error',
        progress: 0
      });
    }
  };

  const startBatchProcessing = async () => {
    if (files.length === 0) {
      toast({
        title: "No Files",
        description: "Please add files before starting batch processing",
        variant: "destructive"
      });
      return;
    }

    setIsProcessing(true);

    try {
      // Process files sequentially to avoid overwhelming the system
      for (const file of files.filter(f => f.status === 'pending')) {
        await processFile(file);
      }

      toast({
        title: "Batch Processing Complete",
        description: `Successfully processed ${files.filter(f => f.status === 'completed').length} files`
      });
    } catch (error) {
      console.error('Batch processing error:', error);
      toast({
        title: "Batch Processing Error",
        description: "Some files failed to process. Check individual file status.",
        variant: "destructive"
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const getStatusIcon = (status: BatchFile['status']) => {
    switch (status) {
      case 'pending': return <Clock className="w-4 h-4 text-gray-500" />;
      case 'uploading': 
      case 'analyzing': return <Brain className="w-4 h-4 text-blue-500 animate-pulse" />;
      case 'completed': return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'error': return <AlertCircle className="w-4 h-4 text-red-500" />;
    }
  };

  const getStatusColor = (status: BatchFile['status']) => {
    switch (status) {
      case 'pending': return 'bg-gray-100 text-gray-800';
      case 'uploading': 
      case 'analyzing': return 'bg-blue-100 text-blue-800';
      case 'completed': return 'bg-green-100 text-green-800';
      case 'error': return 'bg-red-100 text-red-800';
    }
  };

  const completedCount = files.filter(f => f.status === 'completed').length;
  const errorCount = files.filter(f => f.status === 'error').length;
  const totalFiles = files.length;

  return (
    <Card className="glass">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Upload className="w-5 h-5" />
          Batch Analysis
        </CardTitle>
        <p className="text-sm text-muted-foreground">
          Upload multiple audio/video files for simultaneous analysis
        </p>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Drop Zone */}
        <div
          {...getRootProps()}
          className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors ${
            isDragActive 
              ? 'border-speech-primary bg-speech-primary/5' 
              : 'border-muted-foreground/25 hover:border-speech-primary/50'
          }`}
        >
          <input {...getInputProps()} />
          <Upload className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
          <p className="text-lg font-medium mb-2">
            {isDragActive ? 'Drop files here...' : 'Drag & drop files or click to browse'}
          </p>
          <p className="text-sm text-muted-foreground">
            Supports audio (MP3, WAV, M4A) and video (MP4, WebM, MOV) files up to 200MB each
          </p>
        </div>

        {/* File List */}
        {files.length > 0 && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h4 className="font-medium">Files ({totalFiles})</h4>
              <div className="flex items-center gap-4 text-sm">
                {completedCount > 0 && (
                  <Badge variant="secondary" className="bg-green-100 text-green-800">
                    {completedCount} completed
                  </Badge>
                )}
                {errorCount > 0 && (
                  <Badge variant="secondary" className="bg-red-100 text-red-800">
                    {errorCount} failed
                  </Badge>
                )}
              </div>
            </div>

            <ScrollArea className="h-64 w-full border rounded-lg p-2">
              <div className="space-y-2">
                {files.map((batchFile) => (
                  <div 
                    key={batchFile.id}
                    className="flex items-center gap-3 p-3 bg-background/50 rounded-lg border"
                  >
                    <div className="flex-shrink-0">
                      {batchFile.file.type.startsWith('video/') 
                        ? <FileVideo className="w-5 h-5 text-blue-500" />
                        : <FileAudio className="w-5 h-5 text-green-500" />
                      }
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">
                        {batchFile.file.name}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {(batchFile.file.size / (1024 * 1024)).toFixed(1)} MB
                      </p>
                      
                      {(batchFile.status === 'uploading' || batchFile.status === 'analyzing') && (
                        <div className="mt-1">
                          <Progress value={batchFile.progress} className="h-1" />
                        </div>
                      )}
                      
                      {batchFile.error && (
                        <p className="text-xs text-red-600 mt-1">
                          {batchFile.error}
                        </p>
                      )}
                    </div>
                    
                    <div className="flex items-center gap-2">
                      {getStatusIcon(batchFile.status)}
                      <Badge 
                        variant="secondary" 
                        className={getStatusColor(batchFile.status)}
                      >
                        {batchFile.status}
                      </Badge>
                      {batchFile.status === 'pending' && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => removeFile(batchFile.id)}
                        >
                          <X className="w-4 h-4" />
                        </Button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </ScrollArea>

            <div className="flex gap-2">
              <Button 
                onClick={startBatchProcessing}
                disabled={isProcessing || files.every(f => f.status !== 'pending')}
                className="flex-1"
              >
                {isProcessing ? (
                  <>
                    <Brain className="w-4 h-4 mr-2 animate-pulse" />
                    Processing...
                  </>
                ) : (
                  <>
                    <Upload className="w-4 h-4 mr-2" />
                    Start Batch Analysis
                  </>
                )}
              </Button>
              
              <Button 
                variant="outline"
                onClick={() => setFiles([])}
                disabled={isProcessing}
              >
                Clear All
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
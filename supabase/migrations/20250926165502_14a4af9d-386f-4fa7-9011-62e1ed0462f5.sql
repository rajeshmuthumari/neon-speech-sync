-- Enable real-time for analysis_results table
ALTER TABLE public.analysis_results REPLICA IDENTITY FULL;

-- Add analysis_results to the realtime publication
ALTER PUBLICATION supabase_realtime ADD TABLE public.analysis_results;

-- Add performance indexes for faster queries
CREATE INDEX IF NOT EXISTS idx_analysis_results_user_created 
ON public.analysis_results(user_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_analysis_results_status 
ON public.analysis_results(processing_status);

CREATE INDEX IF NOT EXISTS idx_analysis_results_sentiment 
ON public.analysis_results(overall_sentiment) 
WHERE overall_sentiment IS NOT NULL;

-- Add full-text search index for transcriptions
CREATE INDEX IF NOT EXISTS idx_analysis_results_transcription_fts 
ON public.analysis_results 
USING gin(to_tsvector('english', transcription)) 
WHERE transcription IS NOT NULL;

-- Add index for key themes array searches
CREATE INDEX IF NOT EXISTS idx_analysis_results_themes 
ON public.analysis_results 
USING gin(key_themes) 
WHERE key_themes IS NOT NULL;

-- Add composite index for dashboard queries
CREATE INDEX IF NOT EXISTS idx_analysis_results_user_video_status 
ON public.analysis_results(user_id, video_id, processing_status);

-- Optimize video table for file operations
CREATE INDEX IF NOT EXISTS idx_videos_user_created 
ON public.videos(user_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_videos_status 
ON public.videos(upload_status) 
WHERE upload_status IS NOT NULL;
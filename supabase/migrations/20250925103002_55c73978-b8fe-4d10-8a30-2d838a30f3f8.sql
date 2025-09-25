-- Create videos table for storing uploaded videos
CREATE TABLE public.videos (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  file_path TEXT NOT NULL,
  file_size BIGINT NOT NULL,
  duration_seconds INTEGER,
  mime_type TEXT NOT NULL,
  upload_status TEXT DEFAULT 'uploaded' CHECK (upload_status IN ('uploading', 'uploaded', 'processing', 'completed', 'failed')),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create analysis_results table for comprehensive analysis data
CREATE TABLE public.analysis_results (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  video_id UUID REFERENCES public.videos(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- Speech-to-text results
  transcription TEXT,
  detected_language TEXT,
  
  -- Sentiment and emotion analysis
  overall_sentiment TEXT,
  sentiment_confidence DECIMAL(3,2),
  emotions JSONB, -- {joy: 0.8, anger: 0.2, fear: 0.1, etc.}
  
  -- Empathy and political analysis
  empathy_score INTEGER CHECK (empathy_score >= 0 AND empathy_score <= 100),
  inclusive_phrases INTEGER DEFAULT 0,
  ego_centric_phrases INTEGER DEFAULT 0,
  
  -- Topic classification
  topics JSONB, -- {development: 0.9, health: 0.3, education: 0.7}
  key_themes TEXT[],
  
  -- Visual analysis
  facial_emotions JSONB, -- Timeline of facial expressions
  body_language JSONB, -- Gestures, posture analysis
  eye_contact_score DECIMAL(3,2),
  confidence_score DECIMAL(3,2),
  
  -- Processing metadata
  processing_status TEXT DEFAULT 'pending' CHECK (processing_status IN ('pending', 'processing', 'completed', 'failed')),
  processing_error TEXT,
  
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create timeline_analysis table for moment-by-moment analysis
CREATE TABLE public.timeline_analysis (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  analysis_id UUID REFERENCES public.analysis_results(id) ON DELETE CASCADE NOT NULL,
  timestamp_seconds DECIMAL(8,2) NOT NULL,
  
  -- Text analysis at this moment
  text_segment TEXT,
  sentiment TEXT,
  emotion TEXT,
  
  -- Visual analysis at this moment
  facial_expression TEXT,
  body_gesture TEXT,
  confidence_level DECIMAL(3,2),
  
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.videos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.analysis_results ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.timeline_analysis ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for videos
CREATE POLICY "Users can view their own videos" 
ON public.videos FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own videos" 
ON public.videos FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own videos" 
ON public.videos FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own videos" 
ON public.videos FOR DELETE 
USING (auth.uid() = user_id);

-- Create RLS policies for analysis_results
CREATE POLICY "Users can view their own analysis results" 
ON public.analysis_results FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own analysis results" 
ON public.analysis_results FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own analysis results" 
ON public.analysis_results FOR UPDATE 
USING (auth.uid() = user_id);

-- Create RLS policies for timeline_analysis
CREATE POLICY "Users can view timeline analysis for their videos" 
ON public.timeline_analysis FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM public.analysis_results ar 
    JOIN public.videos v ON ar.video_id = v.id 
    WHERE ar.id = timeline_analysis.analysis_id 
    AND v.user_id = auth.uid()
  )
);

CREATE POLICY "Users can insert timeline analysis for their videos" 
ON public.timeline_analysis FOR INSERT 
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.analysis_results ar 
    JOIN public.videos v ON ar.video_id = v.id 
    WHERE ar.id = timeline_analysis.analysis_id 
    AND v.user_id = auth.uid()
  )
);

-- Create storage bucket for videos
INSERT INTO storage.buckets (id, name, public) VALUES ('videos', 'videos', false);

-- Create storage policies for video uploads
CREATE POLICY "Users can upload their own videos" 
ON storage.objects FOR INSERT 
WITH CHECK (
  bucket_id = 'videos' AND 
  auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Users can view their own videos" 
ON storage.objects FOR SELECT 
USING (
  bucket_id = 'videos' AND 
  auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Users can update their own videos" 
ON storage.objects FOR UPDATE 
USING (
  bucket_id = 'videos' AND 
  auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Users can delete their own videos" 
ON storage.objects FOR DELETE 
USING (
  bucket_id = 'videos' AND 
  auth.uid()::text = (storage.foldername(name))[1]
);

-- Create function to update timestamps
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Create triggers for automatic timestamp updates
CREATE TRIGGER update_videos_updated_at
  BEFORE UPDATE ON public.videos
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_analysis_results_updated_at
  BEFORE UPDATE ON public.analysis_results
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();
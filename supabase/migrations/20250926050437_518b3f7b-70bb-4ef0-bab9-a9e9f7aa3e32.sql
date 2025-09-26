-- Create table for visual analysis results
CREATE TABLE public.visual_analysis (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  analysis_id UUID NOT NULL REFERENCES public.analysis_results(id) ON DELETE CASCADE,
  frame_timestamp DECIMAL NOT NULL, -- Timestamp in seconds
  facial_emotions JSONB, -- {joy: 0.8, anger: 0.1, fear: 0.05, etc}
  dominant_emotion TEXT,
  emotion_confidence DECIMAL,
  eye_contact_score DECIMAL, -- 0-1 scale
  body_language JSONB, -- {posture: "confident", gesture_type: "open", etc}
  micro_expressions JSONB, -- {authentic_smile: true, suppressed_anger: false, etc}
  engagement_score DECIMAL, -- Overall engagement 0-1
  confidence_score DECIMAL, -- Overall confidence in analysis 0-1
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.visual_analysis ENABLE ROW LEVEL SECURITY;

-- Create policies for visual analysis
CREATE POLICY "Users can view their own visual analysis" 
ON public.visual_analysis 
FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM public.analysis_results ar 
    WHERE ar.id = visual_analysis.analysis_id 
    AND ar.user_id = auth.uid()
  )
);

CREATE POLICY "System can insert visual analysis" 
ON public.visual_analysis 
FOR INSERT 
WITH CHECK (true);

-- Create index for efficient querying
CREATE INDEX idx_visual_analysis_analysis_id ON public.visual_analysis(analysis_id);
CREATE INDEX idx_visual_analysis_timestamp ON public.visual_analysis(frame_timestamp);

-- Add visual analysis summary to analysis_results table
ALTER TABLE public.analysis_results 
ADD COLUMN visual_summary JSONB,
ADD COLUMN avg_engagement_score DECIMAL,
ADD COLUMN dominant_visual_emotion TEXT,
ADD COLUMN authenticity_indicators JSONB;

-- Create function to calculate visual summary
CREATE OR REPLACE FUNCTION calculate_visual_summary(analysis_uuid UUID)
RETURNS VOID AS $$
BEGIN
  UPDATE public.analysis_results 
  SET 
    avg_engagement_score = (
      SELECT AVG(engagement_score) 
      FROM public.visual_analysis 
      WHERE analysis_id = analysis_uuid
    ),
    dominant_visual_emotion = (
      SELECT mode() WITHIN GROUP (ORDER BY dominant_emotion)
      FROM public.visual_analysis 
      WHERE analysis_id = analysis_uuid
    ),
    visual_summary = (
      SELECT jsonb_build_object(
        'total_frames_analyzed', COUNT(*),
        'avg_emotion_confidence', AVG(emotion_confidence),
        'avg_eye_contact', AVG(eye_contact_score),
        'emotion_distribution', jsonb_object_agg(dominant_emotion, emotion_count)
      )
      FROM (
        SELECT 
          dominant_emotion,
          COUNT(*) as emotion_count
        FROM public.visual_analysis 
        WHERE analysis_id = analysis_uuid
        GROUP BY dominant_emotion
      ) emotion_stats
    )
  WHERE id = analysis_uuid;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
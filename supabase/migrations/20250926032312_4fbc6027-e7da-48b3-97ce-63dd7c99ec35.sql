-- Add new columns for enhanced analysis
ALTER TABLE analysis_results 
ADD COLUMN sentiment_score NUMERIC CHECK (sentiment_score >= -1 AND sentiment_score <= 1),
ADD COLUMN emotional_profile JSONB,
ADD COLUMN rhetorical_styles JSONB,
ADD COLUMN urgency_level TEXT CHECK (urgency_level IN ('Low', 'Medium', 'High')),
ADD COLUMN topic_breakdown JSONB,
ADD COLUMN call_to_actions JSONB,
ADD COLUMN political_positioning TEXT CHECK (political_positioning IN ('Aggressor', 'Defender', 'Visionary', 'Neutral')),
ADD COLUMN authenticity_score NUMERIC CHECK (authenticity_score >= 0 AND authenticity_score <= 100),
ADD COLUMN speech_timeline JSONB;

-- Add new table for detailed timeline analysis
CREATE TABLE IF NOT EXISTS speech_segments (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  analysis_id UUID NOT NULL,
  start_timestamp NUMERIC NOT NULL,
  end_timestamp NUMERIC NOT NULL,
  text_content TEXT,
  sentiment_score NUMERIC,
  dominant_emotion TEXT,
  emotion_scores JSONB,
  rhetorical_style TEXT,
  topic_tags TEXT[],
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS on speech_segments
ALTER TABLE speech_segments ENABLE ROW LEVEL SECURITY;

-- Create policies for speech_segments
CREATE POLICY "Users can view speech segments for their analyses" 
ON speech_segments 
FOR SELECT 
USING (EXISTS (
  SELECT 1 FROM analysis_results ar 
  JOIN videos v ON ar.video_id = v.id 
  WHERE ar.id = speech_segments.analysis_id 
  AND v.user_id = auth.uid()
));

CREATE POLICY "Users can insert speech segments for their analyses" 
ON speech_segments 
FOR INSERT 
WITH CHECK (EXISTS (
  SELECT 1 FROM analysis_results ar 
  JOIN videos v ON ar.video_id = v.id 
  WHERE ar.id = speech_segments.analysis_id 
  AND v.user_id = auth.uid()
));
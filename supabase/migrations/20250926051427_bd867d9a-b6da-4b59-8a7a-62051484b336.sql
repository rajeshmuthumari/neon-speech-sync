-- Fix function search path security issue
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
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;
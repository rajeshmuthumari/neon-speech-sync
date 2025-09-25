import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.38.4';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Initialize Supabase client
const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
const supabase = createClient(supabaseUrl, supabaseKey);

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { video_id } = await req.json();
    
    if (!video_id) {
      throw new Error('Video ID is required');
    }

    console.log('Starting analysis for video:', video_id);

    // Get video details
    const { data: video, error: videoError } = await supabase
      .from('videos')
      .select('*')
      .eq('id', video_id)
      .single();

    if (videoError || !video) {
      throw new Error('Video not found');
    }

    // Update video status to processing
    await supabase
      .from('videos')
      .update({ upload_status: 'processing' })
      .eq('id', video_id);

    // Get video file from storage
    const { data: fileData, error: downloadError } = await supabase.storage
      .from('videos')
      .download(video.file_path);

    if (downloadError || !fileData) {
      throw new Error('Failed to download video file');
    }

    console.log('Video downloaded, extracting audio...');

    // Convert video to audio using Web APIs (simplified approach)
    // In production, you'd use FFmpeg or similar for better audio extraction
    const audioBlob = fileData; // Simplified - in reality, extract audio from video

    // Convert to proper format for Whisper
    const formData = new FormData();
    formData.append('file', audioBlob, 'audio.mp3');
    formData.append('model', 'whisper-1');
    formData.append('language', 'hi'); // Hindi by default, can be auto-detected

    console.log('Sending to OpenAI Whisper...');

    // Send to OpenAI Whisper for transcription
    const whisperResponse = await fetch('https://api.openai.com/v1/audio/transcriptions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${Deno.env.get('OPENAI_API_KEY')}`,
      },
      body: formData,
    });

    if (!whisperResponse.ok) {
      const error = await whisperResponse.text();
      console.error('Whisper API error:', error);
      throw new Error('Failed to transcribe audio');
    }

    const whisperResult = await whisperResponse.json();
    const transcription = whisperResult.text;

    console.log('Transcription completed, analyzing content...');

    // Analyze sentiment and emotions using GPT
    const analysisPrompt = `
Analyze this political speech in detail. Provide a comprehensive analysis including:

1. Overall sentiment (Positive/Negative/Neutral)
2. Emotional analysis (joy, anger, fear, hope, compassion percentages)
3. Empathy scoring based on inclusive language vs ego-centric language
4. Topic classification (development, health, education, employment, corruption, religion)
5. Key themes and phrases

Speech text: "${transcription}"

Please respond in valid JSON format with this structure:
{
  "overall_sentiment": "Positive/Negative/Neutral",
  "sentiment_confidence": 0.85,
  "emotions": {
    "joy": 65,
    "anger": 10,
    "fear": 5,
    "hope": 80,
    "compassion": 70
  },
  "empathy_score": 75,
  "inclusive_phrases": 8,
  "ego_centric_phrases": 2,
  "topics": {
    "development": 0.9,
    "health": 0.3,
    "education": 0.7,
    "employment": 0.6,
    "corruption": 0.1,
    "religion": 0.2
  },
  "key_themes": ["development", "progress", "unity", "future"],
  "insights": [
    "Speaker demonstrates high empathy through inclusive language",
    "Strong focus on development and progress themes",
    "Positive emotional tone throughout the speech"
  ]
}`;

    const gptResponse = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${Deno.env.get('OPENAI_API_KEY')}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4',
        messages: [
          { role: 'system', content: 'You are an expert political speech analyst. Always respond with valid JSON.' },
          { role: 'user', content: analysisPrompt }
        ],
        temperature: 0.3,
      }),
    });

    if (!gptResponse.ok) {
      const error = await gptResponse.text();
      console.error('GPT API error:', error);
      throw new Error('Failed to analyze speech content');
    }

    const gptResult = await gptResponse.json();
    const analysisText = gptResult.choices[0].message.content;
    
    let analysis;
    try {
      analysis = JSON.parse(analysisText);
    } catch (parseError) {
      console.error('Failed to parse GPT response:', analysisText);
      throw new Error('Failed to parse analysis results');
    }

    console.log('Analysis completed, saving results...');

    // Save analysis results to database
    const { data: analysisResult, error: analysisError } = await supabase
      .from('analysis_results')
      .insert({
        video_id: video_id,
        user_id: video.user_id,
        transcription: transcription,
        detected_language: 'hi', // Could be detected from Whisper
        overall_sentiment: analysis.overall_sentiment,
        sentiment_confidence: analysis.sentiment_confidence,
        emotions: analysis.emotions,
        empathy_score: analysis.empathy_score,
        inclusive_phrases: analysis.inclusive_phrases,
        ego_centric_phrases: analysis.ego_centric_phrases,
        topics: analysis.topics,
        key_themes: analysis.key_themes,
        processing_status: 'completed'
      })
      .select()
      .single();

    if (analysisError) {
      console.error('Database error:', analysisError);
      throw new Error('Failed to save analysis results');
    }

    // Update video status to completed
    await supabase
      .from('videos')
      .update({ upload_status: 'completed' })
      .eq('id', video_id);

    console.log('Analysis completed successfully');

    return new Response(
      JSON.stringify({ 
        success: true, 
        analysis_id: analysisResult.id,
        message: 'Analysis completed successfully' 
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Analysis error:', error);
    
    // Update status to failed if we have video_id
    const { video_id } = await req.json().catch(() => ({}));
    if (video_id) {
      await supabase
        .from('videos')
        .update({ upload_status: 'failed' })
        .eq('id', video_id);
    }

    return new Response(
      JSON.stringify({ 
        error: error instanceof Error ? error.message : 'Analysis failed' 
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
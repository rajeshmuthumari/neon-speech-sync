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

    console.log('Video downloaded, processing for transcription...');

    // Check file size (Whisper has a 25MB limit)
    const maxFileSize = 25 * 1024 * 1024; // 25MB
    if (fileData.size > maxFileSize) {
      throw new Error(`File too large: ${Math.round(fileData.size / 1024 / 1024)}MB. Maximum allowed is 25MB.`);
    }

    console.log(`Processing file: ${video.file_path}, Size: ${Math.round(fileData.size / 1024 / 1024)}MB`);

    // Prepare the file for Whisper API
    // Whisper can handle many formats including mp4, webm, etc.
    const formData = new FormData();
    
    // Determine the file type from the video details
    const fileExtension = video.file_path.split('.').pop()?.toLowerCase() || 'mp4';
    const mimeType = video.mime_type || `video/${fileExtension}`;
    
    console.log(`File type: ${fileExtension}, MIME: ${mimeType}`);
    
    // Create a blob with the correct MIME type
    const mediaBlob = new Blob([fileData], { type: mimeType });
    
    // Use the original filename for better processing
    const fileName = `media.${fileExtension}`;
    formData.append('file', mediaBlob, fileName);
    formData.append('model', 'whisper-1');
    
    // Remove language parameter to let Whisper auto-detect
    // This prevents issues with incorrect language detection

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
      const errorText = await whisperResponse.text();
      console.error('Whisper API error details:', {
        status: whisperResponse.status,
        statusText: whisperResponse.statusText,
        error: errorText,
        fileSize: Math.round(fileData.size / 1024 / 1024) + 'MB',
        fileType: fileExtension,
        mimeType: mimeType
      });
      
      // Provide more specific error messages
      if (whisperResponse.status === 413) {
        throw new Error('File too large for Whisper API (max 25MB)');
      } else if (whisperResponse.status === 400) {
        throw new Error('Invalid file format or corrupted file');
      } else {
        throw new Error(`Whisper API failed: ${whisperResponse.status} - ${errorText}`);
      }
    }

    const whisperResult = await whisperResponse.json();
    const transcription = whisperResult.text;

    console.log('Transcription completed, analyzing content...');

    // Analyze sentiment and emotions using GPT with enhanced prompting
    const analysisPrompt = `
Analyze this political speech comprehensively. Provide detailed analysis including:

1. SENTIMENT ANALYSIS:
   - Overall sentiment (Positive/Negative/Neutral)
   - Sentiment score (-1 to +1, where -1 is most negative, +1 is most positive)
   - Confidence level

2. EMOTIONAL PROFILE:
   - Joy, Fear, Anger, Hope, Compassion (0-100 percentages)
   - Dominant emotion throughout speech

3. EMPATHY & AUTHENTICITY:
   - Empathy score (0-100)
   - Authenticity score (0-100)
   - Count of inclusive vs ego-centric phrases

4. RHETORICAL STYLES:
   - Promises made (count and examples)
   - Blame toward opponents (count and examples)
   - Calls to unity (count and examples)
   - Visionary statements (count and examples)

5. URGENCY ANALYSIS:
   - Overall urgency level (Low/Medium/High)
   - Urgency indicators and language patterns

6. TOPIC BREAKDOWN:
   - Percentage of speech time on each topic
   - Key topics: development, health, education, employment, corruption, religion, security, economy

7. CALL-TO-ACTION STATEMENTS:
   - Identify specific calls to action with approximate timestamps
   - Type of action requested

8. POLITICAL POSITIONING:
   - Overall positioning: Aggressor, Defender, Visionary, or Neutral
   - Supporting evidence

9. TIMELINE ANALYSIS:
   - Emotion spikes at different timestamps
   - Sentiment changes throughout speech

Speech text: "${transcription}"

Respond in valid JSON format:
{
  "overall_sentiment": "Positive/Negative/Neutral",
  "sentiment_score": 0.75,
  "sentiment_confidence": 0.85,
  "emotional_profile": {
    "joy": 65,
    "fear": 15,
    "anger": 10,
    "hope": 80,
    "compassion": 70,
    "dominant_emotion": "hope"
  },
  "empathy_score": 75,
  "authenticity_score": 82,
  "inclusive_phrases": 8,
  "ego_centric_phrases": 2,
  "rhetorical_styles": {
    "promises": {
      "count": 5,
      "examples": ["We will build new hospitals", "Jobs for every citizen"]
    },
    "blame_opponents": {
      "count": 2,
      "examples": ["Previous government failed", "Opposition blocked progress"]
    },
    "calls_to_unity": {
      "count": 3,
      "examples": ["We must stand together", "United we progress"]
    },
    "visionary_statements": {
      "count": 4,
      "examples": ["Future of prosperity", "Nation of opportunities"]
    }
  },
  "urgency_level": "Medium",
  "topic_breakdown": {
    "development": 25.5,
    "health": 15.3,
    "education": 18.7,
    "employment": 16.6,
    "corruption": 5.1,
    "religion": 3.2,
    "security": 8.4,
    "economy": 12.2
  },
  "call_to_actions": [
    {
      "timestamp": "2:30",
      "text": "Vote for change in the upcoming election",
      "type": "electoral"
    },
    {
      "timestamp": "8:45",
      "text": "Join our development programs",
      "type": "participation"
    }
  ],
  "political_positioning": "Visionary",
  "speech_timeline": [
    {
      "timestamp": "0:30",
      "emotion": "hope",
      "sentiment": 0.6,
      "topic": "development"
    },
    {
      "timestamp": "3:15",
      "emotion": "compassion",
      "sentiment": 0.8,
      "topic": "health"
    }
  ],
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
    "Positive emotional tone throughout the speech",
    "Uses visionary rhetoric to inspire hope",
    "Moderate urgency suggests measured approach"
  ]
}`;

    const gptResponse = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${Deno.env.get('OPENAI_API_KEY')}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          { role: 'system', content: 'You are an expert political speech analyst. Always respond with valid JSON only, no additional text.' },
          { role: 'user', content: analysisPrompt }
        ],
        max_tokens: 2000,
      }),
    });

    if (!gptResponse.ok) {
      const error = await gptResponse.text();
      console.error('GPT API error:', error);
      throw new Error('Failed to analyze speech content');
    }

    const gptResult = await gptResponse.json();
    const analysisText = gptResult.choices[0].message.content;
    
    console.log('Raw GPT response:', analysisText);
    
    let analysis;
    try {
      // Clean the response to ensure it's valid JSON
      const cleanedText = analysisText.trim().replace(/```json\n?/g, '').replace(/```\n?/g, '');
      analysis = JSON.parse(cleanedText);
      console.log('Parsed analysis:', JSON.stringify(analysis, null, 2));
    } catch (parseError) {
      console.error('Failed to parse GPT response:', analysisText);
      console.error('Parse error:', parseError);
      throw new Error('Failed to parse analysis results');
    }

    console.log('Analysis completed, saving results...');
    console.log('Data to insert:', {
      video_id: video_id,
      user_id: video.user_id,
      transcription: transcription.substring(0, 100) + '...',
      overall_sentiment: analysis.overall_sentiment,
      sentiment_score: analysis.sentiment_score,
      emotional_profile: analysis.emotional_profile,
      rhetorical_styles: analysis.rhetorical_styles,
      urgency_level: analysis.urgency_level,
      political_positioning: analysis.political_positioning
    });

    // Save analysis results to database
    const { data: analysisResult, error: analysisError } = await supabase
      .from('analysis_results')
      .insert({
        video_id: video_id,
        user_id: video.user_id,
        transcription: transcription,
        detected_language: 'hi',
        overall_sentiment: analysis.overall_sentiment,
        sentiment_score: analysis.sentiment_score,
        sentiment_confidence: analysis.sentiment_confidence,
        emotions: analysis.emotions || analysis.emotional_profile,
        emotional_profile: analysis.emotional_profile,
        empathy_score: analysis.empathy_score,
        authenticity_score: analysis.authenticity_score,
        inclusive_phrases: analysis.inclusive_phrases || 0,
        ego_centric_phrases: analysis.ego_centric_phrases || 0,
        rhetorical_styles: analysis.rhetorical_styles,
        urgency_level: analysis.urgency_level,
        topics: analysis.topics,
        topic_breakdown: analysis.topic_breakdown,
        call_to_actions: analysis.call_to_actions,
        political_positioning: analysis.political_positioning,
        speech_timeline: analysis.speech_timeline,
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
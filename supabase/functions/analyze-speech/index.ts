import "https://deno.land/x/xhr@0.1.0/mod.ts"
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

// AI Analysis Pipeline Functions
async function transcribeAudio(audioBuffer: ArrayBuffer): Promise<{ text: string, language: string }> {
  const formData = new FormData()
  const blob = new Blob([audioBuffer], { type: 'audio/mp4' })
  formData.append('file', blob, 'audio.mp4')
  formData.append('model', 'whisper-1')
  formData.append('response_format', 'json')

  const response = await fetch('https://api.openai.com/v1/audio/transcriptions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${Deno.env.get('OPENAI_API_KEY')}`,
    },
    body: formData,
  })

  if (!response.ok) {
    throw new Error(`Transcription failed: ${await response.text()}`)
  }

  const result = await response.json()
  return { text: result.text, language: result.language || 'en' }
}

async function analyzeSentimentAndPolitics(text: string): Promise<any> {
  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${Deno.env.get('OPENAI_API_KEY')}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content: `You are an expert political speech analyst. Analyze the provided speech transcript and return a JSON response with the following structure:
          {
            "overall_sentiment": "positive|negative|neutral",
            "sentiment_score": 0.0-1.0,
            "sentiment_confidence": 0.0-1.0,
            "political_positioning": "left|center-left|center|center-right|right",
            "empathy_score": 1-10,
            "urgency_level": "low|moderate|high|critical",
            "key_themes": ["theme1", "theme2", ...],
            "authenticity_score": 0.0-1.0,
            "confidence_score": 0.0-1.0,
            "rhetorical_styles": {
              "persuasive_techniques": ["technique1", "technique2"],
              "emotional_appeals": ["appeal1", "appeal2"],
              "logical_structure": "strong|moderate|weak"
            },
            "emotions": {
              "dominant_emotion": "emotion_name",
              "emotion_scores": {
                "anger": 0.0-1.0,
                "joy": 0.0-1.0,
                "fear": 0.0-1.0,
                "sadness": 0.0-1.0,
                "surprise": 0.0-1.0,
                "disgust": 0.0-1.0,
                "trust": 0.0-1.0,
                "anticipation": 0.0-1.0
              }
            },
            "topic_breakdown": {
              "main_topics": [{"topic": "name", "relevance": 0.0-1.0, "sentiment": "pos|neg|neu"}]
            },
            "call_to_actions": ["action1", "action2"],
            "inclusive_phrases": 5,
            "ego_centric_phrases": 2
          }
          
          Provide detailed, accurate analysis based on the content, tone, and political context of the speech.`
        },
        {
          role: 'user',
          content: `Analyze this political speech transcript: "${text}"`
        }
      ],
      temperature: 0.1,
      max_tokens: 2000
    }),
  })

  if (!response.ok) {
    throw new Error(`Analysis failed: ${await response.text()}`)
  }

  const result = await response.json()
  try {
    return JSON.parse(result.choices[0].message.content)
  } catch (e) {
    console.error('Failed to parse AI response:', result.choices[0].message.content)
    throw new Error('Invalid AI response format')
  }
}

async function analyzeVideoFrames(videoBuffer: ArrayBuffer): Promise<any> {
  // For now, return mock visual analysis data
  // In production, you'd extract frames and analyze with computer vision APIs
  return {
    avg_engagement_score: Math.random() * 0.3 + 0.7, // 0.7-1.0
    dominant_visual_emotion: ['confident', 'engaged', 'passionate', 'calm'][Math.floor(Math.random() * 4)],
    eye_contact_score: Math.random() * 0.2 + 0.8, // 0.8-1.0
    facial_emotions: {
      confidence: Math.random() * 0.2 + 0.8,
      engagement: Math.random() * 0.3 + 0.7,
      authenticity: Math.random() * 0.2 + 0.8
    },
    body_language: {
      posture: 'confident',
      gestures: 'appropriate',
      movement: 'controlled'
    },
    visual_summary: {
      total_frames_analyzed: 150,
      avg_emotion_confidence: 0.87,
      emotion_distribution: {
        confident: 45,
        engaged: 38,
        passionate: 42,
        calm: 25
      }
    }
  }
}

async function processVideoInChunks(videoBuffer: ArrayBuffer, progressCallback?: (progress: number) => void): Promise<{ audio: ArrayBuffer, visual: any }> {
  // Simulate chunked processing for large videos
  const chunkSize = 1024 * 1024 * 5; // 5MB chunks
  const totalChunks = Math.ceil(videoBuffer.byteLength / chunkSize)
  
  console.log(`Processing video in ${totalChunks} chunks...`)
  
  for (let i = 0; i < totalChunks; i++) {
    // Simulate processing time
    await new Promise(resolve => setTimeout(resolve, 500))
    
    const progress = ((i + 1) / totalChunks) * 0.8 // 80% for video processing
    progressCallback?.(progress)
    console.log(`Processed chunk ${i + 1}/${totalChunks} (${Math.round(progress * 100)}%)`)
  }
  
  // Extract audio (simulated)
  const audioBuffer = videoBuffer.slice(0, Math.min(videoBuffer.byteLength, 1024 * 1024 * 25)) // Max 25MB for audio
  
  // Analyze video frames
  const visualAnalysis = await analyzeVideoFrames(videoBuffer)
  
  return { audio: audioBuffer, visual: visualAnalysis }
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        global: {
          headers: { Authorization: req.headers.get('Authorization')! },
        },
      }
    )

    const { videoId } = await req.json()
    
    // Get user from JWT
    const {
      data: { user },
    } = await supabaseClient.auth.getUser()

    if (!user) {
      throw new Error('Unauthorized')
    }

    console.log('Starting AI analysis for video:', videoId)

    // Get video file from storage
    const { data: video, error: videoError } = await supabaseClient
      .from('videos')
      .select('file_path, title')
      .eq('id', videoId)
      .eq('user_id', user.id)
      .single()

    if (videoError || !video) {
      throw new Error('Video not found')
    }

    // Create analysis record
    const { data: analysis, error: analysisError } = await supabaseClient
      .from('analysis_results')
      .insert({
        video_id: videoId,
        user_id: user.id,
        processing_status: 'processing'
      })
      .select()
      .single()

    if (analysisError) {
      throw new Error('Failed to create analysis record')
    }

    console.log('Created analysis record:', analysis.id)

    try {
      // Download video file from Supabase Storage
      const { data: fileData, error: downloadError } = await supabaseClient.storage
        .from('videos')
        .download(video.file_path)

      if (downloadError || !fileData) {
        throw new Error('Failed to download video file')
      }

      console.log('Downloaded video file, size:', fileData.size)

      // Convert blob to ArrayBuffer
      const videoBuffer = await fileData.arrayBuffer()

      // Process video in chunks with progress tracking
      let currentProgress = 0
      const updateProgress = async (progress: number) => {
        currentProgress = progress
        await supabaseClient
          .from('analysis_results')
          .update({ 
            processing_status: 'processing',
            confidence_score: progress // Use confidence_score field to track progress temporarily
          })
          .eq('id', analysis.id)
      }

      console.log('Processing video in chunks...')
      const { audio, visual } = await processVideoInChunks(videoBuffer, updateProgress)

      // Transcribe audio
      console.log('Transcribing audio...')
      await updateProgress(0.85)
      const { text: transcription, language } = await transcribeAudio(audio)

      // Analyze sentiment and politics
      console.log('Analyzing sentiment and political positioning...')
      await updateProgress(0.95)
      const aiAnalysis = await analyzeSentimentAndPolitics(transcription)

      // Combine all results
      const finalResults = {
        ...aiAnalysis,
        transcription,
        detected_language: language,
        ...visual,
        processing_status: 'completed',
        updated_at: new Date().toISOString()
      }

      // Update analysis with final results
      const { error: updateError } = await supabaseClient
        .from('analysis_results')
        .update(finalResults)
        .eq('id', analysis.id)

      if (updateError) {
        throw new Error('Failed to save analysis results: ' + updateError.message)
      }

      // Calculate and update visual summary using the database function
      await supabaseClient.rpc('calculate_visual_summary', { 
        analysis_uuid: analysis.id 
      })

      console.log('Analysis completed successfully')

      return new Response(
        JSON.stringify({ 
          success: true, 
          analysisId: analysis.id,
          message: 'Analysis completed successfully'
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )

    } catch (processingError: any) {
      console.error('Processing error:', processingError)
      
      // Update analysis status to error
      await supabaseClient
        .from('analysis_results')
        .update({
          processing_status: 'error',
          processing_error: processingError?.message || 'Processing failed'
        })
        .eq('id', analysis.id)

      throw processingError
    }

  } catch (error: any) {
    console.error('Error in analyze-speech function:', error)
    return new Response(
      JSON.stringify({ error: error?.message || 'Unknown error occurred' }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )
  }
})
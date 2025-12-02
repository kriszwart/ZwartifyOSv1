import { NextRequest, NextResponse } from "next/server"

/**
 * ElevenLabs Text-to-Speech API Route
 * Converts text to speech using ElevenLabs API
 */
export async function POST(request: NextRequest) {
  try {
    const { text, voiceId = "21m00Tcm4TlvDq8ikWAM" } = await request.json()

    if (!text || typeof text !== "string") {
      console.error("ElevenLabs API: Invalid text parameter")
      return NextResponse.json(
        { error: "Text is required and must be a string" },
        { status: 400 }
      )
    }

    if (text.length === 0) {
      console.error("ElevenLabs API: Empty text provided")
      return NextResponse.json(
        { error: "Text cannot be empty" },
        { status: 400 }
      )
    }

    const apiKey = process.env.ELEVENLABS_API_KEY

    if (!apiKey) {
      console.error("ElevenLabs API: API key not configured")
      return NextResponse.json(
        { error: "ElevenLabs API key not configured. Please add ELEVENLABS_API_KEY to your .env.local file." },
        { status: 500 }
      )
    }

    // Basic validation - just check it's not empty (let ElevenLabs API validate the format)
    if (apiKey.trim().length === 0) {
      console.error("ElevenLabs API: API key is empty")
      return NextResponse.json(
        { error: "ElevenLabs API key is empty. Please check your .env.local file." },
        { status: 500 }
      )
    }

    console.log(`ElevenLabs API: Generating speech for ${text.length} characters, voice: ${voiceId}`)

    // Call ElevenLabs API
    const response = await fetch(
      `https://api.elevenlabs.io/v1/text-to-speech/${voiceId}`,
      {
        method: "POST",
        headers: {
          Accept: "audio/mpeg",
          "Content-Type": "application/json",
          "xi-api-key": apiKey,
        },
        body: JSON.stringify({
          text,
          model_id: "eleven_multilingual_v2",
          voice_settings: {
            stability: 0.5,
            similarity_boost: 0.75,
          },
        }),
      }
    )

    if (!response.ok) {
      const errorText = await response.text()
      let errorMessage = `ElevenLabs API error: ${response.status} ${response.statusText}`
      
      try {
        const errorData = JSON.parse(errorText)
        if (errorData.detail?.message) {
          errorMessage = `ElevenLabs API error: ${errorData.detail.message}`
        } else if (errorData.message) {
          errorMessage = `ElevenLabs API error: ${errorData.message}`
        }
      } catch {
        // If JSON parsing fails, use the text as-is
        if (errorText) {
          errorMessage = `ElevenLabs API error: ${errorText.substring(0, 200)}`
        }
      }
      
      console.error("ElevenLabs API error:", {
        status: response.status,
        statusText: response.statusText,
        errorText: errorText.substring(0, 500),
      })
      
      return NextResponse.json(
        { error: errorMessage },
        { status: response.status }
      )
    }

    // Get audio data
    const audioBuffer = await response.arrayBuffer()
    
    if (audioBuffer.byteLength === 0) {
      console.error("ElevenLabs API: Received empty audio buffer")
      return NextResponse.json(
        { error: "Received empty audio data from ElevenLabs API" },
        { status: 500 }
      )
    }

    console.log(`ElevenLabs API: Received ${audioBuffer.byteLength} bytes of audio data`)

    // Return audio as base64 or blob URL
    const base64Audio = Buffer.from(audioBuffer).toString("base64")

    return NextResponse.json({
      audio: `data:audio/mpeg;base64,${base64Audio}`,
      format: "mp3",
      size: audioBuffer.byteLength,
    })
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error"
    console.error("Error calling ElevenLabs API:", {
      error: errorMessage,
      stack: error instanceof Error ? error.stack : undefined,
    })
    return NextResponse.json(
      { error: `Failed to generate speech: ${errorMessage}` },
      { status: 500 }
    )
  }
}


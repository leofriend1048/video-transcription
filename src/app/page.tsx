"use client"

import { useState, useEffect } from "react"
import { FileUpload } from "@/components/FileUpload"
import { TranscriptDisplay } from "@/components/TranscriptDisplay"
import { Button } from "@/components/ui/button"
import { Toaster } from "@/components/ui/toaster"
import { useToast } from "@/hooks/use-toast"
import { FileHistory } from "@/components/FileHistory"

export default function Home() {
  const [file, setFile] = useState<File | null>(null)
  const [url, setUrl] = useState<string>("")
  const [transcript, setTranscript] = useState<string>("")
  const [suggestions, setSuggestions] = useState<string>("")
  const [isLoading, setIsLoading] = useState(false)
  const [executionUuid, setExecutionUuid] = useState<string | null>(null)
  const [suggestionsUuid, setSuggestionsUuid] = useState<string | null>(null)
  const { toast } = useToast()
  const [history, setHistory] = useState<Array<{ name: string; date: Date }>>([])

  useEffect(() => {
    const pollForTranscript = async () => {
      if (!executionUuid) return

      try {
        const resultResponse = await fetch(
          `https://api.airops.com/public_api/airops_apps/executions/${executionUuid}`,
          {
            method: "GET",
            headers: {
              Authorization: `Bearer ${process.env.NEXT_PUBLIC_AIROPS_API_KEY}`,
            },
          },
        )

        console.log("Polling Transcript Response:", resultResponse)

        if (!resultResponse.ok) {
          throw new Error("Failed to get execution result")
        }

        const resultData = await resultResponse.json()
        console.log("Polling Transcript Data:", resultData)

        if (resultData.status === "success" || resultData.status === "failed") {
          const transcriptText = resultData.output || "No transcript available"
          setTranscript(transcriptText)
          
          // Make the second AirOps call for suggestions
          try {
            const suggestionsResponse = await fetch(
              "https://api.airops.com/public_api/airops_apps/4b582737-a30b-48cf-8d51-21dd402a4892/async_execute",
              {
                method: "POST",
                headers: {
                  Authorization: `Bearer ${process.env.NEXT_PUBLIC_AIROPS_API_KEY}`,
                  "Content-Type": "application/json",
                },
                body: JSON.stringify({
                  inputs: {
                    text: transcriptText,
                  },
                }),
              }
            )

            if (!suggestionsResponse.ok) {
              throw new Error("Failed to get suggestions")
            }

            const suggestionsData = await suggestionsResponse.json()
            setSuggestionsUuid(suggestionsData.airops_app_execution.id)
          } catch (error) {
            console.error("Error getting suggestions:", error)
            toast({
              title: "Error",
              description: "Failed to get suggestions.",
              variant: "destructive",
            })
          }

          setExecutionUuid(null) // Clear the executionUuid to stop polling
        } else {
          setTimeout(pollForTranscript, 5000)
        }
      } catch (error) {
        console.error("Error:", error)
        toast({
          title: "Error",
          description: "An error occurred while polling for the transcript.",
          variant: "destructive",
        })
        setIsLoading(false)
      }
    }

    pollForTranscript()
  }, [executionUuid, toast])

  useEffect(() => {
    const pollForSuggestions = async () => {
      if (!suggestionsUuid) return

      try {
        const resultResponse = await fetch(
          `https://api.airops.com/public_api/airops_apps/executions/${suggestionsUuid}`,
          {
            method: "GET",
            headers: {
              Authorization: `Bearer ${process.env.NEXT_PUBLIC_AIROPS_API_KEY}`,
            },
          },
        )

        console.log("Polling Suggestions Response:", resultResponse)

        if (!resultResponse.ok) {
          throw new Error("Failed to get suggestions result")
        }

        const resultData = await resultResponse.json()
        console.log("Polling Suggestions Data:", resultData)

        if (resultData.status === "success" || resultData.status === "failed") {
          setSuggestions(resultData.output || "No suggestions available")
          setSuggestionsUuid(null) // Clear the suggestionsUuid to stop polling
          setIsLoading(false)
        } else {
          setTimeout(pollForSuggestions, 5000)
        }
      } catch (error) {
        console.error("Error:", error)
        toast({
          title: "Error",
          description: "An error occurred while polling for suggestions.",
          variant: "destructive",
        })
        setIsLoading(false)
      }
    }

    pollForSuggestions()
  }, [suggestionsUuid, toast])

  const handleFileSelect = (selectedFile: File | null) => {
    setFile(selectedFile)
  }

  const handleUrlInput = (inputUrl: string) => {
    setUrl(inputUrl)
  }

  const handleSubmit = async () => {
    if (!file && !url) {
      toast({
        title: "No input selected",
        description: "Please select a file or enter a video URL to transcribe.",
        variant: "destructive",
      })
      return
    }

    setIsLoading(true)

    try {
      let fileId: string

      if (file) {
        // Handle file upload
        const formData = new FormData()
        formData.append("file", file)

        const uploadResponse = await fetch("https://api.airops.com/public_api/workspace_files", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${process.env.NEXT_PUBLIC_AIROPS_API_KEY}`,
          },
          body: formData,
        })

        if (!uploadResponse.ok) {
          const errorText = await uploadResponse.text()
          throw new Error(`File upload failed: ${errorText}`)
        }

        const uploadData = await uploadResponse.json()
        fileId = uploadData.id
      } else {
        // Handle URL input
        try {
          // First, fetch the file from the URL with CORS mode
          const fileResponse = await fetch(url, {
            mode: 'cors',
            headers: {
              'Accept': 'audio/*, video/*, application/octet-stream'
            }
          })

          if (!fileResponse.ok) {
            throw new Error(`Failed to fetch file from URL: ${fileResponse.statusText}`)
          }

          const contentType = fileResponse.headers.get('content-type')
          if (!contentType || (!contentType.includes('audio/') && !contentType.includes('video/'))) {
            throw new Error('Invalid file type. URL must point to an audio or video file.')
          }

          const blob = await fileResponse.blob()
          const fileName = url.split('/').pop() || 'video'
          
          // Create a File object from the blob
          const file = new File([blob], fileName, { type: contentType })
          
          // Upload the file using FormData
          const formData = new FormData()
          formData.append("file", file)

          const uploadResponse = await fetch("https://api.airops.com/public_api/workspace_files", {
            method: "POST",
            headers: {
              Authorization: `Bearer ${process.env.NEXT_PUBLIC_AIROPS_API_KEY}`,
            },
            body: formData,
          })

          if (!uploadResponse.ok) {
            const errorText = await uploadResponse.text()
            throw new Error(`Upload failed: ${errorText}`)
          }

          const uploadData = await uploadResponse.json()
          fileId = uploadData.id
        } catch (error) {
          if (error instanceof Error) {
            throw new Error(`URL processing failed: ${error.message}`)
          }
          throw error
        }
      }

      const asyncExecuteResponse = await fetch(
        "https://api.airops.com/public_api/airops_apps/adf8f6f5-515d-4f60-9a58-9ae51a3218ec/async_execute",
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${process.env.NEXT_PUBLIC_AIROPS_API_KEY}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            inputs: {
              video: fileId,
            },
          }),
        },
      )

      if (!asyncExecuteResponse.ok) throw new Error("Transcription failed")

      const asyncExecuteData = await asyncExecuteResponse.json()
      setExecutionUuid(asyncExecuteData.airops_app_execution.id)

      // Add to history
      setHistory((prev) => [...prev, { 
        name: file ? file.name : url,
        date: new Date() 
      }])
    } catch (error) {
      console.error("Error:", error)
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "An error occurred while processing the input.",
        variant: "destructive",
      })
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-900">
      <main className="container mx-auto px-4 py-12 max-w-3xl">
        <div className="space-y-8">
          <div>
            <h1 className="text-2xl font-medium text-zinc-900 dark:text-zinc-50">Audio Transcription</h1>
            <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-1">
              Upload MP3/MP4 files or enter a video URL to generate transcripts
            </p>
          </div>

          <div className="bg-white dark:bg-zinc-800 rounded-lg border border-zinc-200 dark:border-zinc-700 p-6 space-y-6">
            <FileUpload onFileSelect={handleFileSelect} onUrlInput={handleUrlInput} />

            {isLoading && <p className="text-sm text-zinc-500 dark:text-zinc-400">Processing input...</p>}

            <Button onClick={handleSubmit} disabled={(!file && !url) || isLoading} className="w-full">
              {isLoading ? "Processing..." : "Transcribe"}
            </Button>
          </div>

          {transcript && <TranscriptDisplay transcript={transcript} suggestions={suggestions} />}

          {history.length > 0 && (
            <div className="bg-white dark:bg-zinc-800 rounded-lg border border-zinc-200 dark:border-zinc-700 p-6">
              <FileHistory history={history} />
            </div>
          )}
        </div>
      </main>
      <Toaster />
    </div>
  )
}
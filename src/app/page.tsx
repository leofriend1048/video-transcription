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
  const [transcript, setTranscript] = useState<string>("")
  const [isLoading, setIsLoading] = useState(false)
  const [executionUuid, setExecutionUuid] = useState<string | null>(null)
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
          setTranscript(resultData.output || "No transcript available")
          setIsLoading(false)
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

  const handleFileSelect = (selectedFile: File) => {
    setFile(selectedFile)
  }

  const handleSubmit = async () => {
    if (!file) {
      toast({
        title: "No file selected",
        description: "Please select an MP3 or MP4 file to transcribe.",
        variant: "destructive",
      })
      return
    }

    setIsLoading(true)

    try {
      const formData = new FormData()
      formData.append("file", file)

      const uploadResponse = await fetch("https://app.airops.com/public_api/workspace_files", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${process.env.NEXT_PUBLIC_AIROPS_API_KEY}`,
        },
        body: formData,
      })

      if (!uploadResponse.ok) throw new Error("File upload failed")

      const uploadData = await uploadResponse.json()
      const fileId = uploadData.id

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
      setHistory((prev) => [...prev, { name: file.name, date: new Date() }])
    } catch (error) {
      console.error("Error:", error)
      toast({
        title: "Error",
        description: "An error occurred while processing the file.",
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
              Upload MP3 or MP4 files to generate transcripts
            </p>
          </div>

          <div className="bg-white dark:bg-zinc-800 rounded-lg border border-zinc-200 dark:border-zinc-700 p-6 space-y-6">
            <FileUpload onFileSelect={handleFileSelect} />

            {isLoading && <p className="text-sm text-zinc-500 dark:text-zinc-400">Processing file...</p>}

            <Button onClick={handleSubmit} disabled={!file || isLoading} className="w-full">
              {isLoading ? "Processing..." : "Transcribe"}
            </Button>
          </div>

          {transcript && <TranscriptDisplay transcript={transcript} />}

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


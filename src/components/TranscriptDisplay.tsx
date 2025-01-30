import { useState } from 'react';
import { Button } from "@/components/ui/button"
import { Copy, Download } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

interface TranscriptDisplayProps {
  transcript: string
  suggestions: string
}

export function TranscriptDisplay({ transcript, suggestions }: TranscriptDisplayProps) {
  const { toast } = useToast()
  const [isDownloading, setIsDownloading] = useState(false)

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(transcript)
      toast({
        title: "Success",
        description: "Transcript copied to clipboard.",
      })
    } catch {
      toast({
        title: "Error",
        description: "Failed to copy transcript.",
        variant: "destructive",
      })
    }
  }

  const downloadTxt = () => {
    setIsDownloading(true);
    const element = document.createElement("a")
    const file = new Blob([transcript], { type: "text/plain" })
    element.href = URL.createObjectURL(file)
    element.download = "transcript.txt"
    document.body.appendChild(element)
    element.click()
    document.body.removeChild(element)
    setIsDownloading(false);
  }

  return (
    <div className="space-y-6">
      <div className="bg-white dark:bg-zinc-800 rounded-lg border border-zinc-200 dark:border-zinc-700 p-6 space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-medium text-zinc-900 dark:text-zinc-50">Transcript</h2>
          <span className="text-xs text-zinc-500 dark:text-zinc-400">{transcript.split(/\s+/).length} words</span>
        </div>

        <div className="rounded-md p-4 max-h-96 overflow-y-auto">
          <p className="text-sm text-zinc-700 dark:text-zinc-300 whitespace-pre-wrap">{transcript}</p>
        </div>

        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={copyToClipboard}>
            <Copy className="h-4 w-4 mr-2" />
            Copy
          </Button>
          <Button variant="outline" size="sm" onClick={downloadTxt} disabled={isDownloading}>
            {isDownloading ? (
              <>
                <Download className="h-4 w-4 mr-2 animate-spin" />
                Downloading...
              </>
            ) : (
              <>
                <Download className="h-4 w-4 mr-2" />
                Download
              </>
            )}
          </Button>
        </div>
      </div>

      {suggestions && (
        <div className="bg-white dark:bg-zinc-800 rounded-lg border border-zinc-200 dark:border-zinc-700 p-6 space-y-4">
          <h2 className="text-sm font-medium text-zinc-900 dark:text-zinc-50">Suggestions</h2>
          <div className="rounded-md p-4 max-h-96 overflow-y-auto">
            <p className="text-sm text-zinc-700 dark:text-zinc-300 whitespace-pre-wrap">{suggestions}</p>
          </div>
        </div>
      )}
    </div>
  )
}
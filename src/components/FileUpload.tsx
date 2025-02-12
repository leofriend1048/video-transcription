import { type ChangeEvent, useState } from "react"
import { Input } from "@/components/ui/input"
import { Upload } from "lucide-react"

interface FileUploadProps {
  onFileSelect: (file: File | null) => void
  onUrlInput: (url: string) => void
}

export function FileUpload({ onFileSelect, onUrlInput }: FileUploadProps) {
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [url, setUrl] = useState("")

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0]
      if (file.type === "audio/mpeg" || file.type === "video/mp4") {
        setSelectedFile(file)
        onFileSelect(file)
        setUrl("") // Clear URL when file is selected
        onUrlInput("") // Reset URL in parent
      } else {
        alert("Please select an MP3 or MP4 file.")
      }
    }
  }

  const handleUrlChange = (e: ChangeEvent<HTMLInputElement>) => {
    const newUrl = e.target.value
    setUrl(newUrl)
    onUrlInput(newUrl)
    setSelectedFile(null) // Clear file when URL is input
    onFileSelect(null) // Reset file in parent
  }

  return (
    <div className="space-y-3">
      <label
        htmlFor="file-upload"
        className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-zinc-200 dark:border-zinc-700 rounded-lg cursor-pointer hover:border-zinc-300 dark:hover:border-zinc-600 transition-colors"
      >
        <div className="flex flex-col items-center justify-center pt-5 pb-6">
          <Upload className="h-6 w-6 text-zinc-500 dark:text-zinc-400 mb-2" />
          <p className="text-sm text-zinc-700 dark:text-zinc-300">Drop your file here or click to upload</p>
          <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">MP3 or MP4 files supported</p>
        </div>
        <Input id="file-upload" type="file" accept=".mp3,.mp4" onChange={handleFileChange} className="hidden" />
      </label>
      
      <div className="space-y-2">
        <p className="text-sm text-zinc-700 dark:text-zinc-300">Or enter a video URL:</p>
        <Input
          type="url"
          placeholder="Enter video source URL"
          value={url}
          onChange={handleUrlChange}
          className="w-full"
        />
      </div>
      {selectedFile && <p className="text-sm text-zinc-500 dark:text-zinc-400">Selected file: {selectedFile.name}</p>}
      {url && <p className="text-sm text-zinc-500 dark:text-zinc-400">Selected URL: {url}</p>}
    </div>
  )
}
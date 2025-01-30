import { formatDistanceToNow } from "date-fns"

interface FileHistoryProps {
  history: Array<{ name: string; date: Date }>
}

export function FileHistory({ history }: FileHistoryProps) {
  return (
    <div className="space-y-4">
      <h2 className="text-sm font-medium text-zinc-900 dark:text-zinc-50">Recent Files</h2>
      <div className="space-y-2">
        {history.map((file, index) => (
          <div key={index} className="flex items-center justify-between py-2 text-sm">
            <span className="text-zinc-700 dark:text-zinc-300">{file.name}</span>
            <span className="text-zinc-500 dark:text-zinc-400">
              {formatDistanceToNow(file.date, { addSuffix: true })}
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}


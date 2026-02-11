import Image from "next/image"

export function TerminalHeader() {
  return (
    <header className="flex items-center gap-4 border-b border-border p-4">
      <Image
        src="/clawdev-logo.png"
        alt="ClawDev Logo"
        width={48}
        height={48}
        className="pixel-crisp rounded-sm"
      />
      <div className="flex-1">
        <h1 className="text-lg font-bold text-primary text-glow">
          ClawDev v1.0.0
        </h1>
        <p className="text-xs text-muted-foreground">
          The First AI Crypto Developer // pump.fun Agent // Solana
        </p>
      </div>
      <div className="flex items-center gap-3 text-xs">
        <StatusIndicator label="AGENT" status="online" />
        <StatusIndicator label="RPC" status="online" />
        <StatusIndicator label="AI" status="online" />
      </div>
    </header>
  )
}

function StatusIndicator({
  label,
  status,
}: {
  label: string
  status: "online" | "offline" | "error"
}) {
  const colors = {
    online: "bg-green-500",
    offline: "bg-muted-foreground",
    error: "bg-destructive",
  }

  return (
    <div className="flex items-center gap-1.5">
      <div className={`h-1.5 w-1.5 rounded-full ${colors[status]}`} />
      <span className="text-muted-foreground">{label}</span>
    </div>
  )
}

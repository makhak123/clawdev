import { TerminalHeader } from "@/components/clawdev/terminal-header"
import { StatusPanel } from "@/components/clawdev/status-panel"
import { ChatTerminal } from "@/components/clawdev/chat-terminal"
import { LogViewer } from "@/components/clawdev/log-viewer"
import { IdeasPanel } from "@/components/clawdev/ideas-panel"

export default function ClawDevDashboard() {
  return (
    <main className="flex h-screen flex-col overflow-hidden bg-background scanlines relative">
      <TerminalHeader />
      <StatusPanel />
      <div className="flex flex-1 overflow-hidden">
        <div className="flex flex-1 flex-col border-r border-border">
          <ChatTerminal />
        </div>
        <div className="hidden w-80 flex-col lg:flex xl:w-96">
          <div className="flex-1 overflow-hidden">
            <IdeasPanel />
          </div>
          <div className="h-64 border-t border-border">
            <LogViewer />
          </div>
        </div>
      </div>
    </main>
  )
}

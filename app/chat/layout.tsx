import { SidebarProvider, SidebarInset } from '@/components/ui/sidebar'
import { ChatSidebar } from '@/components/chat/Sidebar'

export default function ChatLayout({ children }: { children: React.ReactNode }) {
  return (
    <SidebarProvider>
      <ChatSidebar />
      <SidebarInset className="flex h-screen flex-col overflow-hidden">{children}</SidebarInset>
    </SidebarProvider>
  )
}

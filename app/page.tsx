import Link from 'next/link'

export default function Home() {
  return (
    <div className="flex min-h-screen flex-col">
      {/* Nav */}
      <header className="border-b">
        <nav className="mx-auto flex max-w-4xl items-center justify-between px-6 py-4">
          <span className="text-lg font-bold">My App</span>
          <div className="flex gap-6 text-sm">
            <Link href="/chat" className="text-muted-foreground hover:text-foreground transition-colors">Chat</Link>
            <Link href="/blog" className="text-muted-foreground hover:text-foreground transition-colors">Blog</Link>
            <Link href="/settings/providers" className="text-muted-foreground hover:text-foreground transition-colors">Settings</Link>
          </div>
        </nav>
      </header>

      {/* Hero */}
      <main className="flex flex-1 flex-col items-center justify-center gap-6 text-center px-6">
        <h1 className="text-5xl font-bold tracking-tight">Welcome</h1>
        <p className="max-w-md text-muted-foreground text-lg">AI 对话 · 博客 · 一站式平台</p>
        <div className="flex gap-4">
          <Link
            href="/chat"
            className="inline-flex h-10 items-center rounded-md bg-primary px-6 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors"
          >
            开始对话
          </Link>
          <Link
            href="/blog"
            className="inline-flex h-10 items-center rounded-md border px-6 text-sm font-medium hover:bg-muted transition-colors"
          >
            阅读博客
          </Link>
        </div>
      </main>
    </div>
  )
}

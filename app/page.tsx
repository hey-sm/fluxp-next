import Link from 'next/link'

export default function Home() {
  return (
    <div className="flex min-h-screen flex-col">
      {/* Nav */}
      <header className="border-b">
        <nav className="mx-auto flex max-w-4xl items-center justify-between px-6 py-4">
          <span className="text-lg font-bold">My App</span>
          <div className="flex gap-6 text-sm">
            <Link
              href="/chat"
              className="text-muted-foreground hover:text-foreground transition-colors"
            >
              Chat
            </Link>
            <Link
              href="/blog"
              className="text-muted-foreground hover:text-foreground transition-colors"
            >
              Blog
            </Link>
          </div>
        </nav>
      </header>

      {/* Hero */}
      <main className="flex flex-1 flex-col items-center justify-center gap-6 px-6 text-center">
        <h1 className="text-5xl font-bold tracking-tight">Welcome</h1>
        <p className="text-muted-foreground max-w-md text-lg">AI 对话 · 博客 · 一站式平台</p>
        <div className="flex gap-4">
          <Link
            href="/chat"
            className="bg-primary text-primary-foreground hover:bg-primary/90 inline-flex h-10 items-center rounded-md px-6 text-sm font-medium transition-colors"
          >
            开始对话
          </Link>
          <Link
            href="/blog"
            className="hover:bg-muted inline-flex h-10 items-center rounded-md border px-6 text-sm font-medium transition-colors"
          >
            阅读博客
          </Link>
        </div>
      </main>
    </div>
  )
}

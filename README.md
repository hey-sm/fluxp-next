# Fluxp Next

一个基于 Next.js App Router 构建的 AI 对话与博客项目，支持：

- 多服务商 AI 对话
- 流式消息输出
- 本地会话存储
- Supabase 登录与服务商配置管理
- MDX 博客内容展示

当前仓库更偏向一个可继续迭代的产品骨架，已经具备聊天、服务商管理、登录、博客页面这些核心模块。

## 功能概览

### 1. AI 对话

- 支持通过服务商配置切换 `Claude` / `OpenAI` 类型模型
- 使用 Vercel AI SDK 进行流式响应
- 聊天消息保存在浏览器本地 IndexedDB
- 支持对话摘要压缩，减少长上下文开销

### 2. 服务商管理

- 在聊天页侧边栏的设置 Sheet 中新增、编辑、删除服务商
- 可配置：
  - 名称
  - 类型
  - Base URL
  - API Key
  - 模型列表
  - 默认模型
  - 启用状态
- 支持服务连通性测试

### 3. 登录鉴权

- 使用 Supabase Auth 邮箱密码登录
- 登录和服务商管理都在聊天页侧边栏内完成

### 4. 博客系统

- 基于本地 `content/blog/**/*.mdx` 内容渲染
- 支持博客首页、详情页、左侧文档导航、右侧目录导航
- 支持代码高亮、图片、表格、blockquote、上下章导航

## 技术栈

- `Next.js 16` + App Router
- `React 19`
- `Tailwind CSS 4`
- `shadcn/ui` + `Base UI`
- `Supabase`
- `Vercel AI SDK`
- `IndexedDB(idb)`
- `MDX`

## 项目结构

```text
app/
  api/
    chat/                # 聊天与摘要接口
    providers/           # 服务商 CRUD 与测试接口
  blog/                  # 博客列表与详情
  chat/                  # 对话首页与对话详情

components/
  blog/                  # 博客布局、导航、MDX 组件
  chat/                  # 聊天相关组件
  ui/                    # 通用 UI 组件

content/blog/            # MDX 博客内容
lib/
  ai/                    # AI 相关封装
  blog/                  # 博客索引与文档解析
  db/                    # IndexedDB 本地存储
  supabase/              # Supabase client/admin/server
  server/                # 服务商模型装配
```

## 博客实现过程

这一部分把博客系统从“仓库里的 `.mdx` 文件”到“浏览器里的文档页”完整串起来，后面要继续扩展博客时，优先看这一段就能快速建立上下文。

### 1. 先定内容来源：全部来自本地 `content/blog`

博客内容没有放到数据库，也没有接 CMS，而是直接放在仓库里：

- `content/blog/react/*.mdx`
- `content/blog/vue/*.mdx`
- `content/blog/**/assets/*`

这样做的原因比较直接：

1. 写作成本低，直接用 Markdown/MDX 即可。
2. 版本可追踪，文章和代码一起走 Git。
3. 本地开发简单，不需要再接一个后台内容系统。
4. 文档站和博客站的结构可以统一，天然适合技术文章。

当前项目里，`assets` 目录是给文章配图用的，但不会参与路由生成。

### 2. 每篇文章的数据长什么样

每篇文章本质上是一个带 frontmatter 的 `.mdx` 文件，当前实现会读取这些字段：

- `title`
- `date`
- `excerpt`
- `tags`
- `slug`

示例：

```mdx
---
title: React Hooks Guide
date: 2026-03-20
excerpt: React Hooks 的使用方式与常见陷阱
tags:
  - React
  - Hooks
slug: react-hooks-guide
---

## 什么是 Hook
```

这里有几个实际约定：

1. `title` 没写时，会回退到文件名推导的标题。
2. `slug` 没写时，会回退到文件名。
3. 中文、空格、特殊字符最终都会被转换成稳定的 URL 段。
4. 文件名前缀像 `01.`, `02-` 这种排序号不会直接出现在展示标题里，但会参与排序。

### 3. 索引层是博客系统的核心

博客的核心不是页面组件，而是 `lib/blog/mdx.ts` 这一层。它把离散的文件系统内容整理成页面可以直接消费的结构。

它主要负责这些事情：

1. 从 `content/blog` 开始递归扫描所有 `.md` / `.mdx` 文件。
2. 跳过 `assets` 这类只存资源、不参与内容路由的目录。
3. 用 `gray-matter` 解析 frontmatter 和正文。
4. 生成统一的 `BlogDoc`、`BlogDocMeta`、`BlogNavItem`、`BlogHomeSection` 等数据结构。
5. 为详情页准备正文、标题目录、上下章信息。
6. 为首页准备分组 section 和 featured docs。
7. 为 App Router 生成静态参数。

可以把它理解成一个很轻量的“本地内容编译层”。

### 4. 扫描文件时做了哪些处理

`lib/blog/mdx.ts` 里先通过 `listContentFiles` 递归读取目录，再筛出符合 `\.(md|mdx)$` 的文件。

这里的几个实现细节比较关键：

- `BLOG_DIR` 固定指向 `content/blog`
- `CONTENT_FILE_PATTERN` 只允许 Markdown/MDX 文件进入索引
- `IGNORED_DIRECTORIES` 当前包含 `assets`

也就是说，像 `content/blog/vue/assets/image.png` 这类文件虽然属于博客资源，但不会被误识别成文章。

### 5. slug 是怎么生成的

为了让文章 URL 更稳定，项目没有直接把原文件名裸用在地址里，而是统一走 `slugifyValue`。

这一步会做这些转换：

1. 如果内容里有中文，先用 `pinyin-pro` 转成拼音数组。
2. 对结果做 `NFKD` 标准化，去掉音标等附加符号。
3. 统一转成小写。
4. 删除引号等不稳定字符。
5. 把非字母数字内容替换成 `-`。
6. 去掉首尾多余的 `-`。

这样像中文标题、带空格标题、带符号标题都能得到稳定 URL。

当前最终路由段的优先级是：

1. frontmatter 里的 `slug`
2. 文件名
3. 兜底值 `document`

### 6. 排序规则不是按文件系统原始顺序

博客索引最终会对文档排序，排序逻辑在 `compareBySortName`。

它不是简单的字母排序，而是专门兼容了技术文档常见的序号写法，比如：

- `01.Vue-design-philosophy.mdx`
- `02.Reactivity.mdx`
- `10.xxx.mdx`

排序过程大致是：

1. 优先识别文件名开头的数字前缀。
2. 数字前缀不同，就按数值比较。
3. 数字相同时，去掉排序前缀后再做自然排序。
4. 最后再用标题兜底比较。

这能保证“章节式文档”看起来是按作者预期排的，而不是字符串字典序。

### 7. 文档对象是在读文件时一次性组装出来的

`readBlogFile` 会把每篇文章整理成统一对象，主要包括：

- `title`
- `slug`
- `segments`
- `href`
- `date`
- `excerpt`
- `tags`
- `content`
- `headings`

其中几个字段很重要：

- `segments`：当前文档的完整路由段数组
- `href`：最终页面链接，比如 `/blog/react/react-hooks-guide`
- `headings`：从正文中提取的 `h2 / h3`，给右侧 TOC 用

这一步完成后，页面层其实就不用关心文件系统细节了。

### 8. 标题目录不是渲染时临时扫 DOM，而是内容解析时提前提取

标题提取逻辑在 `extractHeadings`。

这里不是直接用正则匹配 Markdown，而是走 AST：

1. `remark-parse` 解析 Markdown
2. `remark-mdx` 兼容 MDX 语法
3. `unist-util-visit` 遍历 AST
4. 只收集 `depth === 2` 和 `depth === 3` 的标题
5. 用 `github-slugger` 生成与标题文本一致的锚点 id

这样做的好处是：

- 比正则更稳定
- 能兼容 MDX 结构
- 生成的 id 和页面标题 anchor 规则一致
- TOC 所需数据在服务端就准备好了

### 9. 为什么用 `segments` 而不是单个 `slug`

博客详情页用的是：

- `app/blog/[...segments]/page.tsx`

而不是：

- `app/blog/[slug]/page.tsx`

原因是项目已经支持多级目录内容，例如：

- `/blog/react/react-hooks-guide`
- `/blog/vue/reactivity`

这样目录结构和 URL 是一一对应的：

1. 内容目录不用额外映射。
2. 文章分组天然来自文件夹层级。
3. 左侧导航构建会更直接。
4. 后面如果增加更深层级，也不用推倒重做。

### 10. 重名 slug 也做了兜底

索引构建完成后，`getBlogIndex` 还会额外做一次去重检查。

如果两篇文章最终算出来的 `segments` 完全相同，就会：

1. 优先退回到基于文件名生成的 `fileSlug`
2. 如果还冲突，就继续追加 `-2`、`-3` 这样的后缀

这样做是为了避免：

- 两篇不同文章 frontmatter 里意外写了相同 `slug`
- 中文标题转拼音后撞车
- 文件移动后出现同路径冲突

这一步虽然用户平时看不见，但能避免静态路由生成阶段直接出错。

### 11. 为什么博客相关函数都集中在一个索引缓存里

`getBlogIndex` 被 `cache(...)` 包了一层。

这意味着同一次渲染周期里：

- `getBlogNavigation()`
- `getBlogStaticParams()`
- `getBlogDocBySegments()`
- `getAdjacentBlogDocs()`
- `getBlogHomeData()`

这些函数虽然看起来分别做不同的事，但底层共用的是同一份已解析好的索引结果，不会每次都重复扫磁盘、读文件、解析 frontmatter。

对于这种本地内容站来说，这个优化非常实用，也能让数据来源保持一致。

### 12. 首页和详情页都只是消费索引层数据

页面层做的事情其实很薄，职责划分比较清晰：

- `app/blog/page.tsx`：博客首页
- `app/blog/[...segments]/page.tsx`：博客详情页
- `app/blog/layout.tsx`：博客区域总布局入口

也就是说，博客“怎么找数据”主要在 `lib/blog/mdx.ts`，博客“怎么展示数据”主要在 `app/blog/*` 和 `components/blog/*`。

### 13. 博客首页的数据是怎么组织的

首页通过 `getBlogHomeData()` 取数据。

它会基于当前全部文档生成两类结果：

1. `sections`
2. `featuredDocs`

其中：

- `sections` 用来展示分组列表
- `featuredDocs` 直接取排好序后的前 6 篇

分组规则也有一个细节：

- 如果文档本身就在 `content/blog` 根目录下，没有额外目录层级，就归到 `General`
- 如果文档位于 `content/blog/react/...`，分组标题就来自第一层目录名

首页最终渲染成三部分：

1. 顶部引导卡片
2. featured docs 快捷入口
3. 按 section 输出的文章列表卡片

### 14. 详情页是怎么完成静态渲染的

详情页在 `app/blog/[...segments]/page.tsx` 里完成。

完整流程如下：

1. `generateStaticParams()` 调用 `getBlogStaticParams()`
2. 构建阶段提前拿到所有文章的 `segments`
3. 访问某个详情页时，通过路由参数取到当前 `segments`
4. `getBlogDocBySegments(segments)` 返回当前文档
5. 文档不存在时直接 `notFound()`
6. 文档存在时，把正文交给 `MDXRemote` 渲染
7. 同时把 `doc.headings` 传给布局组件
8. 再通过 `getAdjacentBlogDocs(segments)` 生成上一章 / 下一章

所以详情页本身更像一个“内容装配器”，而不是再去处理底层内容解析。

### 15. MDX 渲染链路里分别做了什么

当前详情页用了 `next-mdx-remote/rsc` 的 `MDXRemote`，并挂了三组核心插件：

- `remark-gfm`
- `rehype-slug`
- `rehype-pretty-code`

它们的职责分别是：

1. `remark-gfm`
   支持表格、任务列表、删除线等 GitHub Flavored Markdown 语法。
2. `rehype-slug`
   给标题自动补锚点 id，方便 TOC 和标题链接统一工作。
3. `rehype-pretty-code`
   给代码块加上高亮结构和 token class，支持亮色 / 暗色主题变量。

这一层只负责“把 MDX 变成可渲染的结构”，真正的视觉表现还要靠自定义组件和全局样式。

### 16. 为什么单独维护 `MdxComponents`

项目里有一个专门的 `components/blog/MdxComponents.tsx`，它负责接管一部分默认 HTML 标签渲染。

目前主要处理：

- `h1`
- `h2`
- `h3`
- `p`
- `a`
- `img`
- `pre`
- `code`
- `blockquote`
- `table`

这么做主要是为了四件事：

1. 保证文档站视觉统一，不完全依赖浏览器默认样式。
2. 让标题、链接、表格、引用块更适合长文阅读。
3. 把 Markdown 图片安全接到 `next/image`。
4. 把一些容易造成 hydration 问题的结构提前处理掉。

### 17. 标题 anchor 和右侧 TOC 是一套联动逻辑

标题的交互不是“只是有个目录”，而是分成两层协作：

1. `rehype-slug` 给正文标题生成 id
2. `BlogHeading` 把 `h2 / h3` 渲染成带 `#anchor` 的标题
3. `extractHeadings` 在服务端提前拿到标题文本和 id
4. `TableOfContents` 根据这些数据渲染右侧目录

这样点击标题上的 `#` 和点击右侧 TOC，都能跳到同一个位置，不会出现 id 规则不一致的问题。

### 18. 图片为什么要自己包一层组件

`BlogImage` 把 Markdown 里的图片渲染成：

1. 外层 `figure`
2. 内层可点击原图链接
3. 实际图片使用 `next/image`
4. 如果有 `title`，就渲染 `figcaption`

同时它还会：

- 读取传入的 `width / height`
- 如果没提供尺寸，就回退到 `1600 x 900`
- 使用 `sizes` 提示响应式尺寸
- 保持懒加载

这能让图片在文档里既清晰，也更符合文章阅读语义。

### 19. 之前的 hydration 问题是怎么修掉的

这部分值得单独记一下，因为它不是样式问题，而是 HTML 结构问题。

Markdown 图片默认可能会落在段落标签里，如果 `img` 被自定义渲染成 `figure`，就容易出现：

```html
<p>
  <figure>...</figure>
</p>
```

这在 HTML 语义上是非法嵌套，React/Next.js 在 hydration 时会报警。

现在的处理方式是：

1. `img` 由 `BlogImage` 渲染成 `figure`
2. `p` 由 `BlogParagraph` 接管
3. 如果段落里只有图片节点，就不输出 `p`，改成普通 `div`

这样就同时解决了：

- 图片语义化展示
- `next/image` 接入
- hydration 结构冲突

### 20. 左侧导航是怎么从文档列表长出来的

左侧导航不是手写配置，而是索引层动态构建。

核心步骤在 `buildNavigationTree`：

1. 遍历所有已解析好的文档
2. 取每篇文档的目录层级 `segments`
3. 把中间层转成 group 节点
4. 把最后一层转成文档叶子节点
5. 最终序列化成 `BlogNavItem[]`

这里 group 和文档节点共用同一棵树结构，但展示行为不同：

- group 节点：可折叠、可展开
- 文档节点：可跳转、可高亮

### 21. 为什么 `app/blog/layout.tsx` 只做一件事

`app/blog/layout.tsx` 很薄，只做下面这一步：

1. 服务端调用 `getBlogNavigation()`
2. 把结果交给 `BlogShell`

这个设计的好处是：

- 服务端先把导航数据准备好
- 客户端组件只负责交互
- 页面组件不用重复拉导航

这是博客模块里比较典型的“服务端准备数据，客户端负责体验”的拆法。

### 22. `BlogShell` 和 `BlogSidebar` 的职责怎么分

这一层的拆分也很明确：

- `BlogShell`
  负责整个博客外壳、移动端顶部栏、`SidebarProvider`
- `BlogSidebar`
  负责左侧导航的具体交互和渲染

`BlogShell` 会根据当前 pathname 计算出当前标题，在移动端顶部栏展示当前页面名；`BlogSidebar` 则负责：

- 顶部 logo 区
- “首页”入口
- 文档树
- 折叠按钮
- 当前路径对应的激活态
- 当前文档所在目录的自动展开

### 23. 左侧导航交互为什么放到客户端

`BlogSidebar` 是客户端组件，因为它依赖：

- `usePathname`
- `useRouter`
- `useSidebar`
- `useEffect`
- `useState`

它当前的交互逻辑包括：

1. 根据当前 pathname 判断哪个文档是 active
2. 递归判断某个 group 是否包含 active descendant
3. 初始化时自动展开当前所在目录
4. 路由切换后把需要展开的目录重新合并进状态
5. 支持用户手动折叠 / 展开目录
6. 在折叠模式下保留 icon sidebar 行为

这里有一个体验上的取舍：

- 目录节点本身不强调“选中态”
- 真正高亮的是叶子文档节点

这样更符合文档站阅读习惯，用户能更清楚自己“正在读哪篇”，而不是“正在停在哪个目录”。

### 24. 中间正文和右侧 TOC 的布局为什么单独抽成 `BlogContentLayout`

首页和详情页都共用了 `components/blog/BlogContentLayout.tsx`。

它主要负责统一这几个布局规则：

1. 桌面端两列布局
2. 左边是正文列
3. 右边是 TOC 列
4. 正文区域独立滚动
5. 右侧 TOC sticky 固定
6. 移动端把 TOC 提前放到正文上方

这样一来：

- 首页即使没有 TOC，也能复用同一套宽度和节奏
- 详情页会自动获得更像文档站的阅读框架
- 响应式逻辑只需要维护一处

### 25. 右侧 TOC 的高亮不是点击态，而是滚动感知

`components/blog/TableOfContents.tsx` 是客户端组件。

它的工作方式是：

1. 接收服务端已经提取好的 `headings`
2. 在浏览器里通过 `document.getElementById` 找到对应标题元素
3. 使用 `IntersectionObserver` 监听这些标题
4. 根据进入视口的标题更新 `activeId`
5. 把当前标题高亮显示在 TOC 中

这里设置了：

- `rootMargin: '0px 0px -70% 0px'`
- `threshold: [0, 1]`

目的不是精确计算阅读进度，而是让 TOC 在用户向下阅读时更自然地切换激活标题。

### 26. 代码高亮为什么还需要配合全局样式

`rehype-pretty-code` 只负责生成结构和 token 信息，并不会自动帮你把博客风格做完整。

所以项目还在 `app/globals.css` 里补了博客相关样式，大致包括：

- 代码块容器
- 行内代码
- 标题锚点区域
- 表格与引用块的阅读样式
- Shiki 主题变量映射
- 高亮行和高亮字符样式

可以把它理解成：

1. 插件提供“语义结构”
2. 全局样式负责“最终视觉”

两层都在，代码块体验才完整。

### 27. 上一章 / 下一章为什么能自动工作

详情页底部的章节导航没有单独维护前后关系。

它依赖 `getAdjacentBlogDocs(segments)`：

1. 先在当前排好序的文档列表里找到当前文章索引
2. 再取 `index - 1` 和 `index + 1`
3. 页面层按结果渲染上一章 / 下一章卡片

所以它天然继承索引层的排序规则：

- 目录顺序变了，章节导航顺序也会一起变
- 不需要再维护额外配置
- 特别适合这种以文档顺序为主的博客结构

### 28. 新增一篇文章时，系统内部会发生什么

如果后面继续写文章，完整链路其实是这样的：

1. 在 `content/blog/<topic>/` 下新增一个 `.mdx` 文件
2. 写 frontmatter 和正文
3. 本地启动后，索引层重新扫描到新文件
4. `readBlogFile` 生成该文章的 `BlogDoc`
5. `extractHeadings` 提取 `h2 / h3`
6. `buildNavigationTree` 自动把它挂到左侧导航
7. `getBlogStaticParams()` 自动把它纳入详情页静态路由
8. `getBlogHomeData()` 自动把它纳入首页分组和 featured docs 的候选
9. 详情页和上下章导航也会自动更新

也就是说，新增文章通常不需要改页面代码，只要内容文件本身符合约定即可。

### 29. 后续如果要改博客，优先看这些文件

- `lib/blog/mdx.ts`
  博客内容扫描、frontmatter 解析、slug 处理、排序、导航树、TOC 数据、静态参数都在这里。
- `app/blog/layout.tsx`
  博客区域服务端布局入口。
- `app/blog/page.tsx`
  博客首页。
- `app/blog/[...segments]/page.tsx`
  博客详情页渲染入口。
- `components/blog/BlogShell.tsx`
  博客外壳和移动端顶部栏。
- `components/blog/BlogSidebar.tsx`
  左侧导航交互。
- `components/blog/BlogContentLayout.tsx`
  正文列与 TOC 列的响应式布局。
- `components/blog/TableOfContents.tsx`
  右侧目录滚动高亮逻辑。
- `components/blog/MdxComponents.tsx`
  Markdown 标签到 React 组件的映射。
- `app/globals.css`
  博客 prose、代码高亮和一些阅读样式补充。

### 30. 这个实现方案目前最适合什么场景

当前这套博客实现最适合：

- 个人技术博客
- 团队内部知识库
- 文档型产品站
- 以阅读体验为主、内容量中等的 MDX 站点

它当前的优点是：

- 结构简单
- 内容可版本化
- 路由天然和目录对应
- 不依赖外部 CMS
- 改动一篇文章不会牵动很多代码

对应的边界也很明确：

- 还没有搜索
- 还没有标签页 / 分类页
- 还没有 RSS / sitemap / SEO metadata 的完整链路
- 还没有 MDX 自定义组件注册体系
- 内容量非常大时，纯文件扫描方案后面可能需要再做索引优化

### 31. 如果后续继续扩展，建议按这个顺序推进

1. 先补 metadata、sitemap、RSS，让博客基础 SEO 完整。
2. 再补标签页、分类页、搜索，让内容查找成本下降。
3. 然后补封面、阅读进度、更新时间，让阅读体验更完整。
4. 最后再考虑 MDX 自定义组件、全文索引、远端内容源等增强能力。

## 环境变量

在项目根目录创建 `.env.local`：

```bash
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key
```

说明：

- `NEXT_PUBLIC_SUPABASE_URL`：Supabase 项目地址
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`：前端可用匿名 key
- `SUPABASE_SERVICE_ROLE_KEY`：服务端管理 providers 表时使用，请不要泄露

## 数据表

项目依赖 Supabase 中的 `providers` 表来存储服务商配置，示例结构如下：

```sql
create table if not exists providers (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  type text not null,
  base_url text,
  api_key text not null,
  api_mode text not null default 'responses' check (api_mode in ('responses', 'chat')),
  models text[] not null default '{}',
  default_model text,
  enabled boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
```

如果你已经有现成的 `providers` 表，至少需要补上这条迁移：

```sql
alter table providers
add column if not exists api_mode text not null default 'responses';
```

如果你已经有自己的表结构，也可以按当前接口字段自行调整。

## 本地启动

推荐使用 `pnpm`：

```bash
pnpm install
pnpm dev
```

打开 [http://localhost:3000](http://localhost:3000)。

常用命令：

```bash
pnpm dev
pnpm build
pnpm start
pnpm lint
pnpm format
```

## 当前页面

- `/`：首页
- `/chat`：新对话页
- `/chat/[id]`：具体对话页
- `/blog`：博客首页
- `/blog/[...segments]`：博客详情页，支持多级目录路由

## 开发说明

- 聊天内容存储在浏览器本地，不直接写入云数据库
- Provider 的 API Key 由服务端从 Supabase 读取并转发请求
- 博客内容直接来自仓库内的本地 mdx 文件
- 目前更适合自部署或个人/团队内部使用

## 忽略文件说明

仓库已经忽略以下本地文件与目录：

- `.env*`
- `.next/`
- `node_modules/`
- `.pnpm-store/`
- `.agents/`
- `.claude/`
- `project-plan.md`
- `skills-lock.json`

这样首次提交到 GitHub 时，会尽量避免把本地环境、AI 工具配置和构建产物一起传上去。

## 后续可继续完善

- 增加正式首页视觉设计
- 增加对话删除、重命名、搜索
- 增加服务商权限控制
- 增加博客封面、标签、分页、搜索
- 增加部署文档和数据库初始化脚本

## License

如需开源发布，建议你后续补充 `LICENSE` 文件并明确许可证类型。

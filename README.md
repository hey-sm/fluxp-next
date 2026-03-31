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

- 基于本地 `content/blog/*.mdx` 内容渲染
- 支持文章列表与详情页

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
  chat/                  # 聊天相关组件
  settings/              # 服务商表单
  ui/                    # 通用 UI 组件

content/blog/            # MDX 博客内容
lib/
  ai/                    # AI 相关封装
  db/                    # IndexedDB 本地存储
  supabase/              # Supabase client/admin/server
  server/                # 服务商模型装配
```

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
  models text[] not null default '{}',
  default_model text,
  enabled boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
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
pnpm exec eslint .
```

## 当前页面

- `/`：首页
- `/chat`：新对话页
- `/chat/[id]`：具体对话页
- `/blog`：博客列表
- `/blog/[slug]`：博客详情

## 开发说明

- 聊天内容存储在浏览器本地，不直接写入云数据库
- Provider 的 API Key 由服务端从 Supabase 读取并转发请求
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
- 增加博客封面、标签、分页
- 增加部署文档和数据库初始化脚本

## License

如需开源发布，建议你后续补充 `LICENSE` 文件并明确许可证类型。

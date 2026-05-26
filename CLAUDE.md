# CLAUDE.md — onecompany-cs 项目指南

## 项目概述

一人公司客服系统（OneCompany CS）— 轻量级客户管理与 AI 接待系统，为独立开发者/小型工作室设计。

## 技术栈

- **框架**: Next.js 16 (App Router, TypeScript)
- **数据库**: SQLite (Prisma ORM + `@prisma/adapter-better-sqlite3`)
- **UI**: Tailwind CSS 4 + shadcn/ui (base-nova 风格) + Lucide Icons
- **AI**: 可插拔 LLM Provider 接口（当前为规则引擎 Mock 实现）

## 项目结构

```
onecompany-cs/
├── prisma/
│   ├── schema.prisma          # 数据模型（Customer, Conversation, StatusLog, KnowledgeBase）
│   ├── seed.ts                # 知识库种子数据
│   └── dev.db                 # SQLite 数据库
├── src/
│   ├── app/
│   │   ├── page.tsx           # 控制面板
│   │   ├── customers/         # 客户列表、新建、详情页
│   │   ├── knowledge/         # 知识库管理页
│   │   └── api/               # REST API 路由（每个资源一个 route.ts）
│   ├── components/ui/         # shadcn/ui 组件
│   └── lib/
│       ├── db.ts              # Prisma 单例客户端
│       ├── utils.ts           # cn() 工具函数
│       ├── types/index.ts     # 所有类型定义、常量、状态流转规则
│       ├── ai/                # AI Provider 接口与实现
│       └── services/          # 业务逻辑层（纯函数，不依赖 Next.js）
```

## 常用命令

```bash
npm run dev          # 启动开发服务器 (localhost:3000)
npm run build        # 构建生产版本
npm run seed         # 填充知识库种子数据
npx prisma db push   # 同步 schema 到数据库
npx prisma studio    # 打开数据库可视化工具
```

## 架构约定

### 分层结构
- **API Routes** (`src/app/api/`)：处理请求解析与参数校验，调用 Service 层
- **Service 层** (`src/lib/services/`)：纯业务逻辑，直接操作 Prisma，返回数据
- **类型与常量** (`src/lib/types/index.ts`)：所有业务类型、枚举常量、状态流转规则集中定义

### 状态流转
客户状态有 10 个阶段，受 `STATUS_TRANSITIONS` 严格约束。新增状态或修改流转规则需同步更新：
- `src/lib/types/index.ts` 中的 `STATUSES` 和 `STATUS_TRANSITIONS`
- `src/lib/services/customer.service.ts` 中的校验逻辑

### AI Provider 模式
- 接口定义在 `src/lib/ai/provider.ts`（`LLMProvider`）
- 当前使用 `MockAiProvider`（`src/lib/ai/mock.ts`）基于正则规则模拟
- 接入真实 LLM 时，实现 `LLMProvider` 接口并在 `ai.service.ts` 中替换即可

### UI 组件
- 使用 shadcn/ui（base-nova 变体），组件放在 `src/components/ui/`
- 布局模式：页面使用 `max-w-5xl` 居中布局
- 表格/列表：客户列表等使用原生 HTML `<table>` 而非 UI 库

## 环境变量

在 `onecompany-cs/.env` 中配置：
- `DATABASE_URL` — SQLite 数据库路径
- `LLM_API_URL` / `LLM_API_KEY` / `LLM_MODEL` — 真实 LLM 接入配置
- `APP_OWNER_NAME` — 工作室名称

## 注意事项

- Prisma 使用新版本 `prisma.config.ts` 配置方式（非传统 `schema.prisma` 中的 datasource），且依赖 `dotenv/config` 加载环境变量
- 数据库为 SQLite，开发环境文件在 `prisma/dev.db`
- AGENTS.md 提醒：Next.js 16 有破坏性变更，写代码前请参考 `node_modules/next/dist/docs/`

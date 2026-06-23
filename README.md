# OneCompany CS

OneCompany CS 是一个面向独立开发者和小型工作室的本地客户线索管理 MVP。它把客户资料、状态流转、人工对话记录、知识库维护和可选的模型调用放在一个 Next.js 应用中，用于演示单用户工作流。

> [!WARNING]
> 当前版本没有登录、鉴权、权限隔离、请求限流、生产数据库和备份方案。所有 API 都可直接访问和修改数据，因此项目只适合本地开发与演示，不应直接部署到公网。加入认证与生产安全措施之前，本项目不提供自动部署说明或部署按钮。

## 项目状态

- 状态：MVP / Demo
- 使用场景：本地开发、代码审阅、单用户流程演示
- 不属于：生产级 SaaS、可公开访问的客服系统、真实客户消息渠道
- AI 接待入口位于后台客户详情页，由操作者手动提交客户消息；当前没有接入微信、邮件、网页聊天组件等外部渠道

## 已实现功能

- 客户录入、编辑、搜索、筛选和删除
- 受控的客户状态流转、状态日志和下次跟进时间
- 客户、人工与 AI 三类对话记录
- 知识库条目的增删改查、分类、排序和启用控制
- Mock 与 OpenAI-compatible Provider 的页面选择
- 真实 Provider 响应的结构化解析与保守 fallback
- 基于 SQLite 知识库的关键词加权 topK 检索
- 基于数据库条件的待跟进和阶段提醒看板

看板中的“待人工确认信息”根据客户处于 `serving` 状态且已有 `aiSummary` 生成，不表示系统持久化了独立的 AI 建议。报价、成交和交付区块按客户最近更新时间筛选，并明确显示“最近更新于 X 天前”；它们不表示客户进入当前阶段的精确时长。

## Mock 与真实 Provider 的边界

### Mock 模式

```env
LLM_PROVIDER=mock
```

Mock 是一个本地规则模拟器，不调用大模型，也不代表真实模型能力。它仅分析当前最后一条客户消息，通过正则和固定规则生成演示回复及部分分析结果：

- 不使用历史对话进行跨轮信息累计
- 不读取或使用检索出的知识库上下文
- 不验证真实模型的推理、理解或生成质量
- 适合离线跑通消息保存、界面展示和保守状态流转

因此，在 Mock 模式下修改知识库不会改变 Mock 的规则回复。

### OpenAI-compatible 模式

```env
LLM_PROVIDER=openai-compatible
LLM_API_URL=https://api.deepseek.com/chat/completions
LLM_API_KEY=替换为本地密钥
LLM_MODEL=deepseek-v4-flash
LLM_TEMPERATURE=0.7
LLM_MAX_TOKENS=2048
```

真实 Provider 会收到当前客户信息、最近最多 20 条对话，以及根据当前消息检索出的最多 3 条知识库上下文。模型被要求返回客户回复和结构化分析，但实际输出质量取决于所配置的外部模型，项目不能保证模型始终返回完整或正确的字段。

页面会显示当前配置的模型标识，并允许为当前页面后续请求选择 Mock 或已配置的真实 Provider。显式选择真实 Provider 但缺少 URL、API key 或 model 时，请求会失败并提示检查服务端环境变量，不会伪装成真实调用成功。

## 知识库检索边界

当前检索实现是本地关键词匹配，不是语义 RAG：

- 只读取启用条目
- 对标题、分类和正文命中进行不同权重计分
- 按得分、人工排序和 ID 排序后取 topK
- 没有 embedding、向量数据库、重排模型或检索质量评估
- 检索结果只会进入真实 OpenAI-compatible Provider 的 Prompt；Mock 会忽略这些上下文

## Demo 数据声明

`prisma/seed.ts` 中的知识库内容全部是虚构 Demo 数据，只用于本地界面和流程演示：

- 不代表真实客户、真实项目、真实成交或已验证案例
- 价格、周期、服务和案例描述不构成商业承诺
- 执行 seed 会先清空现有 `knowledge_base` 表，再写入 Demo 条目

不要对包含需要保留数据的数据库执行 `npm run seed`。

## 技术栈

- Next.js 16 App Router、React 19、TypeScript
- Tailwind CSS 4、shadcn/base-ui 组件
- Prisma 7、SQLite、better-sqlite3 adapter
- OpenAI-compatible Chat Completions API

## 本地运行

仅在本地开发环境中运行：

```bash
npm install
copy .env.example .env
npx prisma generate
npx prisma db push
npm run seed
npm run dev
```

浏览器访问 [http://localhost:3000](http://localhost:3000)。macOS/Linux 可将复制命令替换为 `cp .env.example .env`。

如果不需要预置 Demo 知识库，可以跳过 `npm run seed`，在页面中手动新增知识库条目。

常用检查：

```bash
npm run lint
npm run build
```

## 环境变量

| 变量 | 说明 | 示例 |
| --- | --- | --- |
| `DATABASE_URL` | 本地 SQLite 数据库地址 | `file:./prisma/dev.db` |
| `APP_OWNER_NAME` | AI Prompt 中的演示工作室名称 | `我的工作室` |
| `LLM_PROVIDER` | 默认 Provider：`mock` 或 `openai-compatible` | `mock` |
| `LLM_API_URL` | Chat Completions 完整地址 | `https://api.deepseek.com/chat/completions` |
| `LLM_API_KEY` | 外部模型 API key，仅保存在本地 `.env` | － |
| `LLM_MODEL` | 外部模型 API 标识 | `deepseek-v4-flash` |
| `LLM_TEMPERATURE` | 默认温度 | `0.7` |
| `LLM_MAX_TOKENS` | 默认最大输出 token | `2048` |

所有 `.env*` 默认被 Git 忽略，只有不含密钥的 `.env.example` 允许提交。

## 数据模型

- `Customer`：联系方式、来源、状态、意向等级、跟进时间、备注和 AI 摘要
- `Conversation`：客户、人工和 AI 的消息内容及时间
- `StatusLog`：状态来源、目标状态、操作者、备注和时间
- `KnowledgeBase`：分类、标题、正文、排序、启用状态和更新时间

## 主要接口

- `GET/POST /api/customers`
- `GET/PUT/DELETE /api/customers/:id`
- `GET/POST /api/customers/:id/chats`
- `POST /api/customers/:id/ai-chat`
- `GET /api/customers/:id/status`
- `GET/POST /api/knowledge`
- `GET/PUT/DELETE /api/knowledge/:id`
- `GET /api/dashboard`

这些接口当前全部无鉴权，仅供本地应用调用。

## 当前未实现

- 登录、鉴权、权限控制和多租户隔离
- 生产数据库、数据迁移、备份和恢复策略
- 请求限流、审计日志和完整可观测性
- embedding、向量数据库和语义检索
- 外部客户消息渠道和主动通知
- SSE/流式输出
- 客户数据导入导出
- 自动化测试套件
- 生产部署和自动部署流程

在完成认证、安全审查和生产数据方案之前，不建议将本项目暴露在公网。

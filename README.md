# OneCompany CS — 一人公司客服系统

为独立开发者 / 小型工作室设计的轻量级客户管理与 AI 接待系统。

> **当前版本**：本地 MVP（v0.1.0）。适合 clone 后直接运行，体验完整业务闭环。

## 项目定位

一人公司客服系统不是一个通用 SaaS，而是为「一个人干活」的开发者/工作室设计的客户管理工具：

- 客户从哪里来、当前什么状态、下一步该做什么 — 一目了然
- 客户来咨询时，AI 自动接待、识别意图、提取需求、标记风险
- 知识库驱动回复，保证信息一致性

## 核心功能

### 客户管理

- 客户 CRUD（创建、查看、编辑、删除）
- 按状态、意向度、来源、关键词筛选，分页浏览
- 10 阶段状态流转：`新线索 → 接待中 → 需求确认 → 已报价 → 已成交 → 交付中 → 已交付 → 售后中 → 已完结 / 已丢失`
- 状态变更审计日志

### AI 接待

- 基于知识库的自动回复与需求采集
- 意图识别（9 种意图类型）与意向度评估
- 自动提取项目类型、功能需求、预算、工期
- 风险标记（低预算、紧急、意向不清）
- 结构化 AI 摘要，辅助人工跟进

### 知识库

- 5 大分类管理：服务范围、价格区间、合作流程、常见问题、案例说明
- CRUD、启停用、排序
- 预置 19 条种子数据

### 控制面板

- 各状态客户数量概览
- 今日待跟进 / 逾期跟进提醒
- 超时预警（报价未响应 7 天、成交未交付 3 天、交付未确认 7 天）

## 技术栈

| 层面 | 技术 |
|------|------|
| 框架 | Next.js 16 (App Router) |
| 语言 | TypeScript 5 |
| UI | React 19 + Tailwind CSS 4 + shadcn/ui + Lucide Icons |
| 数据库 | SQLite (Prisma 7 ORM) |
| AI | 可插拔 `LLMProvider` 接口（当前为规则引擎 Mock） |

## 本地启动

```bash
# 克隆仓库
git clone https://github.com/<your-username>/onecompany-cs.git
cd onecompany-cs

# 安装依赖
npm install

# 配置环境变量
cp .env.example .env
# .env 中的默认值即可直接使用，无需修改

# 初始化数据库
npx prisma db push

# 填充种子数据（19 条知识库预设）
npm run seed

# 启动开发服务器
npm run dev
```

访问 [http://localhost:3000](http://localhost:3000) 即可使用。

## 环境变量

项目通过 `.env` 文件配置环境变量（`.env.example` 已提供模板）：

| 变量 | 默认值 | 说明 |
|------|--------|------|
| `DATABASE_URL` | `file:./prisma/dev.db` | SQLite 数据库路径 |
| `APP_OWNER_NAME` | `我的工作室` | 工作室名称，用于 AI 回复中的自称 |
| `LLM_API_URL` | `https://api.openai.com/v1` | LLM API 地址（预留，当前 Mock 不使用） |
| `LLM_API_KEY` | `sk-your-api-key-here` | LLM API Key（预留） |
| `LLM_MODEL` | `gpt-3.5-turbo` | 模型名称（预留） |

> **注意**：`.env` 文件和 SQLite 数据库文件均不会提交到 GitHub。

## 关于 AI 模块

当前 AI 接待使用 **MockAiProvider**（规则引擎模拟），支持：

- 意图识别：询价、合作、投诉、咨询等 9 种意图分类
- 需求提取：自动识别项目类型、功能需求、预算范围、工期预期
- 风险标记：低预算、紧急交付、意向不清等风险自动检测
- 知识库检索：基于关键词匹配检索相关知识库条目作为回复依据

系统已设计 `LLMProvider` 接口，接入真实 LLM（如 OpenAI、Claude）只需：

1. 实现 `LLMProvider` 接口的 `chat()` 方法
2. 在 `src/lib/services/ai.service.ts` 中替换 `MockAiProvider` 实例
3. 配置 `.env` 中的 LLM 相关变量

## 截图

<!-- 截图待补充 — 启动项目后截取以下页面 -->

| 控制面板 | 客户列表 |
|:---:|:---:|
| ![Dashboard](screenshots/dashboard.png) | ![客户列表](screenshots/customers.png) |

| 客户详情 | AI 接待对话 |
|:---:|:---:|
| ![客户详情](screenshots/customer-detail.png) | ![AI 接待](screenshots/ai-chat.png) |

## 项目结构

```
src/
├── app/
│   ├── page.tsx                  # 控制面板
│   ├── customers/
│   │   ├── page.tsx              # 客户列表
│   │   ├── new/page.tsx          # 新建客户
│   │   └── [id]/page.tsx         # 客户详情（编辑/状态/对话/AI 聊天）
│   ├── knowledge/page.tsx        # 知识库管理
│   └── api/                      # REST API 路由
├── components/ui/                # shadcn/ui 组件
└── lib/
    ├── ai/
    │   ├── provider.ts           # LLMProvider 接口
    │   ├── mock.ts               # 规则引擎 Mock 实现
    │   └── prompts.ts            # AI 系统提示词
    ├── services/                 # 业务逻辑层
    ├── types/index.ts            # 类型定义与状态流转规则
    ├── db.ts                     # Prisma 单例
    └── utils.ts                  # 工具函数
prisma/
├── schema.prisma                # 数据模型
├── seed.ts                      # 种子数据
└── dev.db                       # SQLite 数据库（不提交）
```

## 后续规划

- [ ] 接入真实 OpenAI-compatible API
- [ ] 对话流式输出 (SSE)
- [ ] 用户认证与权限管理
- [ ] 客户数据导出 (CSV)
- [ ] 部署到 Vercel / Railway
- [ ] 国际化 (i18n)

## License

[MIT](LICENSE)

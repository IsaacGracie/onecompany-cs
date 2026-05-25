# OneCompany CS — 一人公司客服系统

轻量级客户管理与 AI 接待系统，为独立开发者 / 小型工作室设计的 CRM 工具。

## 功能

### 客户管理
- 客户 CRUD（创建、查看、编辑、删除）
- 按状态、意向度、来源、关键词筛选，分页浏览
- 10 阶段状态流转：新线索 → 接待中 → 需求确认 → 已报价 → 已成交 → 交付中 → 已交付 → 售后中 → 已完结 / 已丢失
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
| UI | React 19 + Tailwind CSS 4 + shadcn/ui |
| 数据库 | SQLite (Prisma ORM) |
| AI | 可插拔 Provider 接口（当前为规则引擎 Mock） |

## 快速开始

```bash
# 克隆
git clone https://github.com/IsaacGracie/onecompany-cs.git
cd onecompany-cs

# 安装依赖
npm install

# 初始化数据库 & 填充种子数据
npx prisma db push
npm run seed

# 启动开发服务器
npm run dev
```

访问 [http://localhost:3000](http://localhost:3000) 即可使用。

## 环境变量

复制 `.env` 并按需修改：

```env
DATABASE_URL="file:./prisma/dev.db"

# LLM 配置（接入真实 AI 后生效）
LLM_API_URL="https://api.openai.com/v1"
LLM_API_KEY="sk-your-api-key-here"
LLM_MODEL="gpt-3.5-turbo"

# 工作室名称
APP_OWNER_NAME="我的工作室"
```

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
├── lib/
│   ├── ai/
│   │   ├── provider.ts           # LLM Provider 接口
│   │   ├── mock.ts               # 规则引擎 Mock 实现
│   │   └── prompts.ts            # AI 系统提示词
│   ├── services/                 # 业务逻辑层
│   └── types/index.ts            # 类型定义与状态流转规则
prisma/
├── schema.prisma                 # 数据模型
├── seed.ts                       # 种子数据
└── dev.db                        # SQLite 数据库
```

## License

[MIT](LICENSE)

import { prisma } from "../src/lib/db";

// 以下内容全部是虚构 Demo 数据，仅用于本地界面和流程演示。
// 不代表真实客户、真实项目、真实成交、真实报价或已验证案例。
const knowledgeData = [
  {
    category: "service",
    title: "网站开发",
    content: "虚构 Demo 服务范围可包括企业官网、展示型网站、Landing Page 和个人品牌网站，并以 Next.js、响应式适配作为示例技术要求。该描述仅用于演示需求问答。",
    sortOrder: 1,
    isActive: true,
  },
  {
    category: "service",
    title: "小程序开发",
    content: "虚构 Demo 服务范围可包括预约、产品展示和简单商城等轻量小程序场景。该描述仅用于演示分类检索和需求追问。",
    sortOrder: 2,
    isActive: true,
  },
  {
    category: "service",
    title: "自动化工具",
    content: "虚构 Demo 服务范围可包括数据处理自动化、定时任务、API 对接和内部工具，并通过追问了解场景复杂度。该描述不代表实际项目经验。",
    sortOrder: 3,
    isActive: true,
  },
  {
    category: "service",
    title: "AI 相关项目",
    content: "虚构 Demo 服务范围可包括智能回复、AI 内容生成集成和数据分析可视化，并提示由人工评估可行性。该描述不代表实际项目经验或能力验证。",
    sortOrder: 4,
    isActive: true,
  },
  {
    category: "price",
    title: "网站开发价格区间",
    content: "以下为本地 Demo 的虚构价格口径：简单展示型网站可设为几千元区间，功能型网站可设为一到几万元区间。该内容仅用于演示 AI 如何引用知识库，不构成真实报价或商业承诺。",
    sortOrder: 1,
    isActive: true,
  },
  {
    category: "price",
    title: "小程序价格区间",
    content: "以下为本地 Demo 的虚构价格口径：展示型小程序可设为几千元区间，带业务逻辑的小程序可设为一到几万元区间。该内容仅用于演示，不构成真实报价。",
    sortOrder: 2,
    isActive: true,
  },
  {
    category: "price",
    title: "自动化工具价格区间",
    content: "以下为本地 Demo 的虚构价格口径：简单脚本与多系统业务工具可使用不同报价区间。该条目只用于演示需求收集和知识库问答，不构成真实报价。",
    sortOrder: 3,
    isActive: true,
  },
  {
    category: "price",
    title: "报价流程说明",
    content: "流程是这样的：先通过对话了解您的需求 → 我整理成需求摘要 → 老板确认可行性 → 老板亲自给您报价。我们不会在需求不清楚的时候随便给价格。",
    sortOrder: 4,
    isActive: true,
  },
  {
    category: "process",
    title: "合作流程概述",
    content: "简单来说是四步：① 需求沟通（就是现在这一步）→ ② 老板报价确认 → ③ 签合同开工 → ④ 交付验收。过程中老板会全程跟进，我负责前期沟通和信息整理。",
    sortOrder: 1,
    isActive: true,
  },
  {
    category: "process",
    title: "付款方式",
    content: "通常的付款方式是开工前付一部分定金，交付后付尾款。具体比例老板会在报价时跟您协商。",
    sortOrder: 2,
    isActive: true,
  },
  {
    category: "process",
    title: "交付方式",
    content: "网站类项目会部署到您指定的服务器或平台。源代码和相关文档会交付给您。具体的交付细节会在合同里约定。",
    sortOrder: 3,
    isActive: true,
  },
  {
    category: "faq",
    title: "做完之后还能改吗",
    content: "合同范围内的修改在验收前都可以调整。交付后的小幅修改一般包含在售后期内。大的功能变更需要另行协商。",
    sortOrder: 1,
    isActive: true,
  },
  {
    category: "faq",
    title: "需要准备什么材料",
    content: "一般来说，您需要提供：公司/项目的基本介绍、想要的功能说明（哪怕很粗略也行）、参考网站或案例（如果有的话）。有需求文档最好，没有的话通过对话我也可以帮您整理。",
    sortOrder: 2,
    isActive: true,
  },
  {
    category: "faq",
    title: "大概多久能做完",
    content: "这取决于项目的复杂程度和当前的排期。简单项目可能一两周，复杂项目可能一两个月。老板在报价时会给您一个准确的排期承诺。",
    sortOrder: 3,
    isActive: true,
  },
  {
    category: "faq",
    title: "售后包含什么",
    content: "有的。交付后会有一个售后观察期，期间的 Bug 修复和小幅调整是包含在内的。具体的售后范围和时长会在合同里写明。",
    sortOrder: 4,
    isActive: true,
  },
  {
    category: "faq",
    title: "有案例可以看吗",
    content: "本地 Demo 不包含可验证的真实案例。该条目用于演示系统在缺少案例资料时应转由人工补充，而不是虚构项目经历。",
    sortOrder: 5,
    isActive: true,
  },
  {
    category: "case",
    title: "企业官网演示场景",
    content: "虚构 Demo 场景：某展示型企业官网包含公司介绍、团队展示、服务说明和联系方式，并要求响应式适配。该描述仅用于演示知识库检索，不对应真实客户或已交付项目。",
    sortOrder: 1,
    isActive: true,
  },
  {
    category: "case",
    title: "内部工具演示场景",
    content: "虚构 Demo 场景：一个内部数据看板汇总多个来源并生成日报，另一个定时任务整理指定来源的数据。该描述不对应真实客户、真实成交或已交付项目。",
    sortOrder: 2,
    isActive: true,
  },
  {
    category: "case",
    title: "小程序演示场景",
    content: "虚构 Demo 场景：预约类小程序用于选择服务时间，展示类小程序用于浏览产品目录。该描述只用于本地功能演示，不是实际客户案例。",
    sortOrder: 3,
    isActive: true,
  },
  {
    category: "case",
    title: "AI 集成演示场景",
    content: "虚构 Demo 场景：在业务系统中演示智能回复、内容生成或数据摘要等能力。该条目用于测试知识库检索和模型回答，不代表真实客户案例或能力验证结果。",
    sortOrder: 4,
    isActive: true,
  },
];

async function main() {
  console.log("注意：即将清空 knowledge_base 并写入虚构 Demo 数据。");
  console.log("开始清空 knowledge_base 表...");
  await prisma.knowledgeBase.deleteMany();
  console.log("knowledge_base 表已清空");

  console.log(`开始导入 ${knowledgeData.length} 条知识库数据...`);

  for (const item of knowledgeData) {
    const demoItem = {
      ...item,
      title: `[Demo] ${item.title}`,
      content: `虚构 Demo 数据：${item.content}`,
    };
    await prisma.knowledgeBase.create({ data: demoItem });
    console.log(`  ✓ [${demoItem.category}] ${demoItem.title}`);
  }

  const count = await prisma.knowledgeBase.count();
  console.log(`\n导入完成，当前 knowledge_base 表共 ${count} 条记录`);
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error("Seed 失败:", e);
    await prisma.$disconnect();
    process.exit(1);
  });

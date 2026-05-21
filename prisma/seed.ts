import { prisma } from "../src/lib/db";

const knowledgeData = [
  {
    category: "service",
    title: "网站开发",
    content: "可以。我们提供企业官网、展示型网站、Landing Page、个人品牌网站等类型的开发服务。技术栈以 Next.js 为主，支持响应式适配。具体方案需要根据您的需求评估。",
    sortOrder: 1,
    isActive: true,
  },
  {
    category: "service",
    title: "小程序开发",
    content: "支持微信小程序的开发，主要面向轻量级业务场景，比如预约系统、产品展示、简单商城等。具体是否适合您的场景，老板会根据需求判断。",
    sortOrder: 2,
    isActive: true,
  },
  {
    category: "service",
    title: "自动化工具",
    content: "可以评估。我们接过一些数据处理自动化、定时任务、API 对接、内部工具类的需求。具体要看场景复杂度，建议您先说说想解决什么问题。",
    sortOrder: 3,
    isActive: true,
  },
  {
    category: "service",
    title: "AI 相关项目",
    content: "有这方面的经验，比如智能客服对接、AI 内容生成集成、数据分析可视化等。具体方案需要老板评估可行性后给您反馈。",
    sortOrder: 4,
    isActive: true,
  },
  {
    category: "price",
    title: "网站开发价格区间",
    content: "根据我们过往项目，简单展示型网站一般在几千元，功能型网站（带后台管理、用户系统等）一般在一到几万元。具体价格取决于页面数量、功能复杂度和设计要求，最终以老板报价为准。",
    sortOrder: 1,
    isActive: true,
  },
  {
    category: "price",
    title: "小程序价格区间",
    content: "轻量级小程序（展示为主）一般几千元起，带业务逻辑的小程序一般在一万到几万之间。复杂度不同价格差异较大，老板会根据您的具体需求报价。",
    sortOrder: 2,
    isActive: true,
  },
  {
    category: "price",
    title: "自动化工具价格区间",
    content: "简单的数据处理脚本或定时任务类需求，费用一般较低。涉及多系统对接、复杂业务逻辑的工具，费用会高一些。建议您先说清楚需求，老板会给您一个准确的报价。",
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
    content: "我可以给您介绍一些过往的项目类型。详细的案例展示老板会在正式沟通时分享给您。",
    sortOrder: 5,
    isActive: true,
  },
  {
    category: "case",
    title: "企业官网案例",
    content: "我们做过多个行业的企业官网，包括科技公司、咨询公司、个人品牌等。主要功能是公司介绍、团队展示、服务说明、联系方式等。采用响应式设计，手机端体验良好。",
    sortOrder: 1,
    isActive: true,
  },
  {
    category: "case",
    title: "内部工具案例",
    content: "有的。比如给客户做过一个简单的数据看板工具，用来汇总多个平台的数据并生成日报。也做过一个自动化脚本，定时从指定来源抓取数据并整理成表格。",
    sortOrder: 2,
    isActive: true,
  },
  {
    category: "case",
    title: "小程序案例",
    content: "做过预约类小程序（客户在线预约服务时间）和展示类小程序（产品目录浏览）。功能相对轻量，注重用户体验和简洁交互。",
    sortOrder: 3,
    isActive: true,
  },
  {
    category: "case",
    title: "AI 集成案例",
    content: "有的。比如将 AI 能力集成到现有的业务系统中，实现智能回复、内容生成、数据摘要等功能。也做过 AI 辅助的客服对话系统。具体案例老板会根据您的需求对应分享。",
    sortOrder: 4,
    isActive: true,
  },
];

async function main() {
  console.log("开始清空 knowledge_base 表...");
  await prisma.knowledgeBase.deleteMany();
  console.log("knowledge_base 表已清空");

  console.log(`开始导入 ${knowledgeData.length} 条知识库数据...`);

  for (const item of knowledgeData) {
    await prisma.knowledgeBase.create({ data: item });
    console.log(`  ✓ [${item.category}] ${item.title}`);
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

import type { LLMProvider, ChatMessage, ChatOptions, ChatResponse } from "./provider";

/** 从用户消息中检测已提供的信息 */
function detectProvidedInfo(userContent: string): {
  project_type: string | null;
  key_features: string | null;
  budget_range: string | null;
  timeline: string | null;
} {
  const text = userContent.toLowerCase();

  // 检测项目类型
  let project_type: string | null = null;
  if (/企业官网|公司官网|品牌官网|官方网站/.test(userContent)) project_type = "企业官网";
  else if (/展示型网站|展示网站|landing\s?page/.test(userContent)) project_type = "展示型网站";
  else if (/商城|电商|购物/.test(userContent)) project_type = "电商平台";
  else if (/小程序/.test(userContent)) project_type = "小程序";
  else if (/网站/.test(userContent)) project_type = "网站";
  else if (/app|应用/.test(text)) project_type = "APP";
  else if (/管理系统|后台|crm|erp/.test(text)) project_type = "管理系统";
  else if (/自动化工具|工具/.test(userContent)) project_type = "自动化工具";

  // 检测关键功能
  let key_features: string | null = null;
  const featureMatches: string[] = [];
  if (/\d+\s*个?\s*页面?/.test(userContent)) {
    const m = userContent.match(/(\d+)\s*个?\s*页面?/);
    if (m) featureMatches.push(`${m[1]}个页面`);
  }
  if (/预约/.test(userContent)) featureMatches.push("预约功能");
  if (/支付|付款/.test(userContent)) featureMatches.push("支付功能");
  if (/登录|注册|会员/.test(userContent)) featureMatches.push("用户系统");
  if (/后台管理/.test(userContent)) featureMatches.push("后台管理");
  if (/响应式|手机端|移动端/.test(userContent)) featureMatches.push("移动端适配");
  if (/seo|搜索引擎/.test(text)) featureMatches.push("SEO优化");
  if (/多语言|英文版|国际化/.test(userContent)) featureMatches.push("多语言支持");
  if (/cms|内容管理/.test(text)) featureMatches.push("CMS内容管理");
  if (/数据统计|报表|dashboard/.test(text)) featureMatches.push("数据报表");
  if (featureMatches.length > 0) key_features = featureMatches.join("、");

  // 检测预算
  let budget_range: string | null = null;
  const budgetPatterns = [
    /预算[：:\s]*(\d[\d,]*)\s*[元块万]?/i,
    /(\d[\d,]*)\s*[元块万]\s*[以之]?(?:内|下|左右|上下)/,
    /(\d[\d,]*)\s*左右/i,
    /大约\s*(\d[\d,]*)/i,
  ];
  for (const p of budgetPatterns) {
    const m = userContent.match(p);
    if (m) {
      budget_range = `${m[1]}元`;
      break;
    }
  }

  // 检测时间
  let timeline: string | null = null;
  if (/下个月|下月/.test(userContent)) timeline = "下个月";
  else if (/这周|本周/.test(userContent)) timeline = "本周";
  else if (/月底/.test(userContent)) timeline = "本月底";
  else if (/年底/.test(userContent)) timeline = "年底";
  else if (/尽快|越快越好|加急/.test(userContent)) timeline = "尽快";
  else if (/(\d+)\s*个?\s*月/.test(userContent)) {
    const m = userContent.match(/(\d+)\s*个?\s*月/);
    if (m) timeline = `${m[1]}个月内`;
  }
  else if (/季度|3个月|三个月/.test(userContent)) timeline = "3个月内";
  else if (/半年/.test(userContent)) timeline = "半年内";

  return { project_type, key_features, budget_range, timeline };
}

/** 汇总信息生成摘要 */
function buildSummary(
  info: ReturnType<typeof detectProvidedInfo>,
  userContent: string
): string {
  const parts: string[] = [];
  if (info.project_type) parts.push(`项目类型：${info.project_type}`);
  if (info.key_features) parts.push(`功能需求：${info.key_features}`);
  if (info.budget_range) parts.push(`预算：${info.budget_range}`);
  if (info.timeline) parts.push(`期望时间：${info.timeline}`);
  if (parts.length === 0) return "";
  return `客户${userContent.length > 20 ? "表示" : "说："}"${userContent.slice(0, 80)}${userContent.length > 80 ? "..." : ""}"。已收集信息：${parts.join("；")}。`;
}

interface DetectedInfo {
  project_type: string | null;
  key_features: string | null;
  budget_range: string | null;
  timeline: string | null;
}

function buildReply(info: DetectedInfo, userContent: string): string {
  const missing: string[] = [];
  if (!info.project_type) missing.push("项目类型");
  if (!info.key_features) missing.push("关键功能");
  if (!info.budget_range) missing.push("预算范围");
  if (!info.timeline) missing.push("期望时间");

  // 全部收集齐 → 生成摘要并引导人工
  if (missing.length === 0) {
    return [
      "好的，我已经帮您整理好需求了！",
      "",
      "📋 需求摘要：",
      `- 项目类型：${info.project_type}`,
      `- 功能需求：${info.key_features}`,
      `- 预算：${info.budget_range}`,
      `- 期望时间：${info.timeline}`,
      "",
      "我会把信息转给老板，老板会尽快跟您确认方案和报价。还有其他想补充的吗？",
    ].join("\n");
  }

  // 部分信息已收集 → 针对性追问缺失项
  const provided: string[] = [];
  if (info.project_type) provided.push(`项目类型「${info.project_type}」`);
  if (info.key_features) provided.push(`功能需求「${info.key_features}」`);
  if (info.budget_range) provided.push(`预算「${info.budget_range}」`);
  if (info.timeline) provided.push(`时间「${info.timeline}」`);

  const lines = [`收到！我了解到您需要${info.project_type ? "做" + info.project_type : "的信息"}，`];
  if (provided.length > 0) {
    lines.push(`${provided.join("、")}，我记下了。`);
  }

  lines.push("");
  lines.push("还有几个信息想确认一下：");

  // 用序号列出缺失项
  let idx = 1;
  if (!info.project_type) lines.push(`${idx++}. 您想做什么类型的项目？（网站/小程序/APP/其他）`);
  if (!info.key_features) lines.push(`${idx++}. 有哪些关键功能需求？大概需要几个页面？`);
  if (!info.budget_range) lines.push(`${idx++}. 大概的预算范围是？`);
  if (!info.timeline) lines.push(`${idx++}. 希望什么时候能上线？`);

  lines.push("");
  lines.push("哪怕只有一个大概方向也可以，我帮您整理。");
  return lines.join("\n");
}

const presetReplies = [
  {
    trigger: "随便看看",
    reply: "没问题！如果您之后有任何想法，随时来找我聊。我们做网站开发、小程序、自动化工具这些，有需要的时候可以详细聊聊。",
    analysis: {
      intent: "casual_chat",
      intent_level: "low",
      is_effective_lead: false,
      need_human: false,
      suggested_action: "close_conversation",
      summary: null,
      missing_info: [],
      risk_flags: ["客户表示只是随便看看"],
    },
  },
  {
    trigger: "流程",
    reply: "合作流程很简单：\n① 现在这一步——需求沟通\n② 老板根据需求给您报价\n③ 确认后签合同开工\n④ 开发完成交付验收\n\n老板全程跟进，我负责前期沟通和信息整理。您现在可以先说说您的需求。",
    analysis: {
      intent: "inquiry_process",
      intent_level: "medium",
      is_effective_lead: false,
      need_human: false,
      suggested_action: "continue_collect",
      summary: null,
      missing_info: ["project_type", "key_features"],
      risk_flags: [],
    },
  },
  {
    trigger: "多少钱",
    reply: null, // 特殊处理：走上下文检测流程
    analysis: null,
  },
  {
    trigger: "价格",
    reply: null, // 特殊处理：走上下文检测流程
    analysis: null,
  },
];

export class MockAiProvider implements LLMProvider {
  async chat(messages: ChatMessage[], _options?: ChatOptions): Promise<ChatResponse> {
    const lastUserMessage = messages.filter((m) => m.role === "user").pop();
    const userContent = lastUserMessage?.content || "";

    // 特殊预设回复（闲聊、流程等）
    for (const r of presetReplies) {
      if (r.trigger === "随便看看" || r.trigger === "流程") {
        if (userContent.includes(r.trigger)) {
          return {
            content: `${r.reply}\n\n---ANALYSIS---\n${JSON.stringify(r.analysis)}`,
          };
        }
      }
    }

    // 上下文感知的核心逻辑
    const info = detectProvidedInfo(userContent);
    const missing_info: string[] = [];
    if (!info.project_type) missing_info.push("project_type");
    if (!info.key_features) missing_info.push("key_features");
    if (!info.budget_range) missing_info.push("budget_range");
    if (!info.timeline) missing_info.push("timeline");

    const isComplete = missing_info.length === 0;
    const providedCount = 4 - missing_info.length;

    // 判断意图：先看是否提交了需求信息，再看纯询价/询流程等
    let intent = "inquiry_service";
    if (providedCount >= 2 && (info.project_type || info.key_features)) {
      // 检测到 2+ 项需求信息且含项目类型或功能 → 提交需求
      intent = "submit_requirement";
    } else if (/^(价格|多少钱|报价|费用|怎么收费|什么价位|收费)[吗吧呢]?$/.test(userContent.replace(/\s/g, ""))) {
      // 纯询价表达（无其他需求信息）
      intent = "inquiry_price";
    } else if (/价格|多少钱|报价|费用|怎么收费/.test(userContent)) {
      // 包含询价关键词但不纯 → 看是否伴随需求
      intent = info.project_type ? "submit_requirement" : "inquiry_price";
    } else if (/流程|怎么合作|合作方式/.test(userContent)) {
      intent = "inquiry_process";
    } else if (/投诉|不满|差评/.test(userContent)) {
      intent = "complaint";
    } else if (/跟进|上次|之前/.test(userContent)) {
      intent = "follow_up";
    } else if (info.project_type || info.key_features) {
      intent = "submit_requirement";
    }

    // 判断意向等级
    let intent_level = "unknown";
    if (info.budget_range && info.timeline) intent_level = "high";
    else if (info.project_type || info.budget_range) intent_level = "medium";
    else if (/随便|看看|了解/.test(userContent)) intent_level = "low";

    const is_effective_lead = isComplete || (providedCount >= 2 && info.budget_range !== null);
    const need_human = isComplete;

    // 构建回复
    let reply: string;
    if (isComplete) {
      reply = buildReply(info, userContent);
    } else if (/价格|多少钱|报价|费用/.test(userContent)) {
      // 客户问价但信息不全
      const infoLines: string[] = [];
      if (info.project_type) infoLines.push(`您说的「${info.project_type}」`);
      if (info.budget_range) infoLines.push(`预算「${info.budget_range}」`);
      const prefix = infoLines.length > 0
        ? `${infoLines.join("、")}我记下了。关于价格，`
        : "关于价格，";
      reply = [
        `${prefix}需要先了解具体需求才能给您一个合理的范围。`,
        "",
        "简单来说：",
        "- 展示型网站一般几千元起",
        "- 功能型网站/小程序一般一万到几万",
        "- 具体取决于功能复杂度和设计要求",
        "",
        ...missing_info.map((k, i) => {
          const labels: Record<string, string> = {
            project_type: "您想做什么类型的项目？",
            key_features: "有哪些关键功能？",
            budget_range: "您大概的预算范围是？",
            timeline: "希望什么时候上线？",
          };
          return `${i + 1}. ${labels[k] || k}`;
        }),
        "",
        "了解这些后我可以帮您整理需求，老板会给您准确报价。",
      ].join("\n");
    } else {
      reply = buildReply(info, userContent);
    }

    // 生成摘要
    const summary = isComplete ? buildSummary(info, userContent) : null;

    const analysis = {
      intent,
      intent_level,
      is_effective_lead,
      need_human,
      suggested_action: isComplete ? "collect_summary" : "continue_collect",
      summary: summary || null,
      missing_info,
      risk_flags: [] as string[],
    };

    // 风险标记
    if (/便宜|没钱|预算低|几千块/.test(userContent)) {
      analysis.risk_flags.push("预算可能偏低");
    }
    if (/急|加急|赶时间|马上/.test(userContent)) {
      analysis.risk_flags.push("客户催促进度");
    }
    if (/不确定|可能|也许|先看看/.test(userContent)) {
      analysis.risk_flags.push("客户意向不明确");
    }

    return {
      content: `${reply}\n\n---ANALYSIS---\n${JSON.stringify(analysis)}`,
    };
  }
}

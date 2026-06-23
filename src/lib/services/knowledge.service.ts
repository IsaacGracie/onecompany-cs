import { prisma } from "@/lib/db";
import { VALID_KNOWLEDGE_CATEGORIES } from "@/lib/types";

interface KnowledgeQueryParams {
  category?: string;
  isActive?: boolean;
}

const CATEGORY_LABELS: Record<string, string> = {
  service: "服务范围",
  price: "价格区间",
  process: "合作流程",
  faq: "常见问题",
  case: "案例说明",
};

function tokenizeQuery(query: string): string[] {
  const segments = query
    .toLowerCase()
    .split(/[^\p{L}\p{N}]+/u)
    .filter(Boolean);
  const terms = new Set<string>();

  for (const segment of segments) {
    terms.add(segment);

    if (/\p{Script=Han}/u.test(segment) && segment.length > 2) {
      for (let index = 0; index < segment.length - 1; index += 1) {
        terms.add(segment.slice(index, index + 2));
      }
    }
  }

  return [...terms];
}

function countOccurrences(text: string, term: string): number {
  if (!term) return 0;

  let count = 0;
  let start = 0;
  while ((start = text.indexOf(term, start)) >= 0) {
    count += 1;
    start += term.length;
  }
  return count;
}

function scoreKnowledgeItem(
  item: { title: string; category: string; content: string },
  terms: string[]
): number {
  const title = item.title.toLowerCase();
  const category = `${item.category} ${CATEGORY_LABELS[item.category] || ""}`.toLowerCase();
  const content = item.content.toLowerCase();

  return terms.reduce(
    (score, term) =>
      score +
      countOccurrences(title, term) * 5 +
      countOccurrences(category, term) * 3 +
      countOccurrences(content, term),
    0
  );
}

/**
 * 基于 SQLite 现有字段的轻量 RAG-like 检索。
 * 当前 schema 没有 keywords 字段，因此只对 title/category/content 加权；
 * 后续可在不改变调用方的情况下替换为 embedding 检索。
 */
export async function retrieveKnowledgeContext(
  query: string,
  topK = 3
): Promise<string> {
  const terms = tokenizeQuery(query.trim());
  if (terms.length === 0) return "";

  const limit = Math.max(1, Math.min(Math.floor(topK) || 3, 10));
  const items = await prisma.knowledgeBase.findMany({
    where: { isActive: true },
  });

  return items
    .map((item) => ({ item, score: scoreKnowledgeItem(item, terms) }))
    .filter((result) => result.score > 0)
    .sort(
      (left, right) =>
        right.score - left.score ||
        left.item.sortOrder - right.item.sortOrder ||
        left.item.id - right.item.id
    )
    .slice(0, limit)
    .map(
      ({ item }) =>
        `【${CATEGORY_LABELS[item.category] || item.category}｜${item.title}】\n${item.content}`
    )
    .join("\n\n");
}

export async function getKnowledgeList(params: KnowledgeQueryParams) {
  const where: Record<string, unknown> = {};

  if (params.category) where.category = params.category;
  if (params.isActive !== undefined) where.isActive = params.isActive;

  return prisma.knowledgeBase.findMany({
    where,
    orderBy: [{ sortOrder: "asc" }, { createdAt: "desc" }],
  });
}

export async function getKnowledgeById(id: number) {
  return prisma.knowledgeBase.findUnique({ where: { id } });
}

export async function createKnowledge(data: {
  category: string;
  title: string;
  content: string;
  sortOrder?: number;
}) {
  if (!VALID_KNOWLEDGE_CATEGORIES.includes(data.category)) {
    throw new Error(`Invalid category: ${data.category}`);
  }

  if (!data.title || data.title.trim() === "") {
    throw new Error("title cannot be empty");
  }

  if (!data.content || data.content.trim() === "") {
    throw new Error("content cannot be empty");
  }

  return prisma.knowledgeBase.create({
    data: {
      category: data.category,
      title: data.title.trim(),
      content: data.content.trim(),
      sortOrder: data.sortOrder ?? 0,
    },
  });
}

export async function updateKnowledge(
  id: number,
  data: {
    category?: string;
    title?: string;
    content?: string;
    sortOrder?: number;
    isActive?: boolean;
  }
) {
  const existing = await prisma.knowledgeBase.findUnique({ where: { id } });
  if (!existing) return null;

  const updateData: Record<string, unknown> = {};

  if (data.category !== undefined) {
    if (!VALID_KNOWLEDGE_CATEGORIES.includes(data.category)) {
      throw new Error(`Invalid category: ${data.category}`);
    }
    updateData.category = data.category;
  }

  if (data.title !== undefined) {
    if (!data.title || data.title.trim() === "") {
      throw new Error("title cannot be empty");
    }
    updateData.title = data.title.trim();
  }

  if (data.content !== undefined) {
    if (!data.content || data.content.trim() === "") {
      throw new Error("content cannot be empty");
    }
    updateData.content = data.content.trim();
  }

  if (data.sortOrder !== undefined) {
    updateData.sortOrder = data.sortOrder;
  }

  if (data.isActive !== undefined) {
    updateData.isActive = data.isActive;
  }

  return prisma.knowledgeBase.update({
    where: { id },
    data: updateData,
  });
}

export async function deleteKnowledge(id: number) {
  const existing = await prisma.knowledgeBase.findUnique({ where: { id } });
  if (!existing) return false;

  await prisma.knowledgeBase.delete({ where: { id } });
  return true;
}

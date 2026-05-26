import { prisma } from "@/lib/db";
import { VALID_KNOWLEDGE_CATEGORIES } from "@/lib/types";

interface KnowledgeQueryParams {
  category?: string;
  isActive?: boolean;
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

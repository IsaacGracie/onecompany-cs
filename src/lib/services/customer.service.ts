import { prisma } from "@/lib/db";
import type { CustomerQueryParams, CreateCustomerInput, UpdateCustomerInput } from "@/lib/types";
import { STATUSES, VALID_STATUSES, isValidTransition, getNextStatuses } from "@/lib/types";

export async function getCustomers(params: CustomerQueryParams) {
  const { page = 1, pageSize = 10, status, intentLevel, source, keyword } = params;

  const where: Record<string, unknown> = {};

  if (status) where.status = status;
  if (intentLevel) where.intentLevel = intentLevel;
  if (source) where.source = source;

  if (keyword) {
    where.OR = [
      { nickname: { contains: keyword } },
      { contactInfo: { contains: keyword } },
      { notes: { contains: keyword } },
    ];
  }

  const [data, total] = await Promise.all([
    prisma.customer.findMany({
      where,
      orderBy: { updatedAt: "desc" },
      skip: (page - 1) * pageSize,
      take: pageSize,
    }),
    prisma.customer.count({ where }),
  ]);

  return {
    data,
    total,
    page,
    pageSize,
    totalPages: Math.ceil(total / pageSize),
  };
}

export async function getCustomerById(id: number) {
  return prisma.customer.findUnique({
    where: { id },
  });
}

export async function createCustomer(input: CreateCustomerInput) {
  const customer = await prisma.customer.create({
    data: {
      nickname: input.nickname,
      contactInfo: input.contactInfo || null,
      contactType: input.contactType || "wechat",
      source: input.source || "other",
      notes: input.notes || null,
    },
  });

  // 记录初始状态日志
  await prisma.statusLog.create({
    data: {
      customerId: customer.id,
      fromStatus: null,
      toStatus: "new",
      changedBy: "human",
      remark: "创建客户",
    },
  });

  return customer;
}

export async function updateCustomer(id: number, input: UpdateCustomerInput) {
  const current = await prisma.customer.findUnique({ where: { id } });
  if (!current) return null;

  const updateData: Record<string, unknown> = {};

  if (input.nickname !== undefined) updateData.nickname = input.nickname;
  if (input.contactInfo !== undefined) updateData.contactInfo = input.contactInfo || null;
  if (input.contactType !== undefined) updateData.contactType = input.contactType;
  if (input.source !== undefined) updateData.source = input.source;
  if (input.intentLevel !== undefined) updateData.intentLevel = input.intentLevel;
  if (input.notes !== undefined) updateData.notes = input.notes || null;

  if (input.nextFollowAt !== undefined) {
    updateData.nextFollowAt = input.nextFollowAt ? new Date(input.nextFollowAt) : null;
  }

  // 状态变更需要校验流转规则并记录日志
  if (input.status !== undefined && input.status !== current.status) {
    if (!VALID_STATUSES.includes(input.status)) {
      throw new Error(`Invalid status: ${input.status}`);
    }

    if (!isValidTransition(current.status, input.status)) {
      const allowed = getNextStatuses(current.status);
      const allowedLabels = allowed.map(
        (s) => STATUSES.find((st) => st.value === s)?.label || s
      );
      const currentLabel = STATUSES.find((s) => s.value === current.status)?.label || current.status;
      const targetLabel = STATUSES.find((s) => s.value === input.status)?.label || input.status;
      throw new Error(
        `非法状态流转: 「${currentLabel}」不允许流转到「${targetLabel}」。当前允许的流转: ${allowedLabels.length > 0 ? allowedLabels.join("、") : "无（终态）"}`
      );
    }

    updateData.status = input.status;

    await prisma.statusLog.create({
      data: {
        customerId: id,
        fromStatus: current.status,
        toStatus: input.status,
        changedBy: "human",
        remark: input.remark || `状态变更: ${current.status} → ${input.status}`,
      },
    });
  }

  return prisma.customer.update({
    where: { id },
    data: updateData,
  });
}

export async function deleteCustomer(id: number) {
  const customer = await prisma.customer.findUnique({ where: { id } });
  if (!customer) return false;

  await prisma.customer.delete({ where: { id } });
  return true;
}

export async function getStatusLogs(customerId: number) {
  return prisma.statusLog.findMany({
    where: { customerId },
    orderBy: { createdAt: "desc" },
  });
}

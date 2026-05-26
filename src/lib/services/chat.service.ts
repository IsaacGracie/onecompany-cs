import { prisma } from "@/lib/db";
import { VALID_SENDER_TYPES } from "@/lib/types";

export async function getConversations(customerId: number) {
  return prisma.conversation.findMany({
    where: { customerId },
    orderBy: { createdAt: "asc" },
  });
}

export async function createConversation(
  customerId: number,
  senderType: string,
  messageContent: string
) {
  if (!VALID_SENDER_TYPES.includes(senderType)) {
    throw new Error(`Invalid senderType: ${senderType}`);
  }

  if (!messageContent || messageContent.trim() === "") {
    throw new Error("messageContent cannot be empty");
  }

  const customer = await prisma.customer.findUnique({ where: { id: customerId } });
  if (!customer) {
    throw new Error("Customer not found");
  }

  const [conversation] = await prisma.$transaction([
    prisma.conversation.create({
      data: {
        customerId,
        senderType,
        messageContent: messageContent.trim(),
      },
    }),
    prisma.customer.update({
      where: { id: customerId },
      data: { lastContactAt: new Date() },
    }),
  ]);

  return conversation;
}

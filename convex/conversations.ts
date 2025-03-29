import { v } from "convex/values";
import { mutation } from "./_generated/server";
import { auth } from "./auth";

export const createOrGet = mutation({
  args: {
    workspaceId: v.id("workspaces"),
    memberId: v.id("members"),
  },
  handler: async (ctx, args) => {
    const userId = await auth.getUserId(ctx);
    if (!userId) {
      throw new Error("Unauthorized");
    }

    const currentMember = await ctx.db
      .query("members")
      .withIndex("by_workspace_id_user_id", (q) =>
        q.eq("workspaceId", args.workspaceId).eq("userId", userId)
      )
      .unique();

    const otherMember = await ctx.db.get(args.memberId);

    if (!currentMember || !otherMember) {
      throw new Error("Member not found!");
    }

    const existingConversation = await ctx.db
      .query("conversations")
      .filter((q) => q.eq(q.field("workspaceId"), args.workspaceId))
      .filter((q) =>
        q.or(
          q.and(
            q.eq(q.field("memberOne"), currentMember._id),
            q.eq(q.field("memberTwo"), otherMember._id)
          ),
          q.and(
            q.eq(q.field("memberOne"), otherMember._id),
            q.eq(q.field("memberTwo"), currentMember._id)
          )
        )
      )
      .unique();

    if (existingConversation) {
      return existingConversation._id;
    }

    const conversationId = await ctx.db.insert("conversations", {
      workspaceId: args.workspaceId,
      memberOne: currentMember._id,
      memberTwo: otherMember._id,
    });

    return conversationId;
  },
});

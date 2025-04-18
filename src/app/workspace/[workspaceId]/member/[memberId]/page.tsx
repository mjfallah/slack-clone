"use client";

import { useEffect, useState } from "react";

import { toast } from "sonner";

import { AlertTriangle, Loader } from "lucide-react";

import { useCreateOrGetConversation } from "@/features/conversations/api/use-create-or-get-conversation";
import { useMemberId } from "@/hooks/use-member-id";
import { useWorkspaceId } from "@/hooks/use-workspaceId";

import { Conversation } from "./conversation";
import { Id } from "../../../../../../convex/_generated/dataModel";

const MemberIdPage = () => {
  const workspaceId = useWorkspaceId();
  const memberId = useMemberId();

  const [conversationId, setConversationId] =
    useState<Id<"conversations"> | null>(null);

  const { mutate, isPending } = useCreateOrGetConversation();

  useEffect(() => {
    mutate(
      { memberId, workspaceId },
      {
        onSuccess(data) {
          setConversationId(data);
        },
        onError() {
          toast.error("Failed to load or get conversation");
        },
      }
    );
  }, [mutate, memberId, workspaceId]);

  if (isPending) {
    return (
      <div className="h-full flex items-center justify-center">
        <Loader className="size-12 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!conversationId) {
    return (
      <div className="h-full flex flex-col gap-y-2 items-center justify-center">
        <AlertTriangle className="size-12 text-muted-foreground" />
        <span className="text-sm text-muted-foreground">
          Conversation not found!
        </span>
      </div>
    );
  }

  return (
    <Conversation conversationId={conversationId as Id<"conversations">} />
  );
};

export default MemberIdPage;

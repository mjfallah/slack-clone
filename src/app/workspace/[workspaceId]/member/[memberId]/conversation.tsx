import { Id } from "../../../../../../convex/_generated/dataModel";

import { Loader } from "lucide-react";

import { Header } from "./header";
import { ChatInput } from "./chat-input";

import { MessageList } from "@/components/message-list";

import { useMemberId } from "@/hooks/use-member-id";
import { useGetMember } from "@/features/members/api/use-get-member";
import { useGetMessages } from "@/features/messages/api/use-get-messages";

interface ConversationProps {
  conversationId: Id<"conversations">;
}

export const Conversation = ({ conversationId }: ConversationProps) => {
  const memberId = useMemberId();
  const { data: member, isLoading: isLoadingMember } = useGetMember({
    id: memberId,
  });

  const { results, status, loadMore } = useGetMessages({
    conversationId,
  });

  if (isLoadingMember || status === "LoadingFirstPage") {
    return (
      <div className="h-full flex items-center justify-center">
        <Loader className="size-12 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      <Header
        memberName={member?.user.name}
        memberImage={member?.user.image}
        onClick={() => {}}
      />
      <MessageList
        variant="conversation"
        memberName={member?.user.name}
        memberImage={member?.user.image}
        data={results}
        loadMore={loadMore}
        isLoadingMore={status === "LoadingMore"}
        canLoadMore={status === "CanLoadMore"}
      />
      <ChatInput
        placeholder={`Message ${member?.user.name}`}
        conversationId={conversationId}
      />
    </div>
  );
};

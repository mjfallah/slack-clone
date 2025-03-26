"use client";

import { Loader, TriangleAlert } from "lucide-react";

import { Header } from "./header";
import { ChatInput } from "./chat-input";
import { MessageList } from "@/components/message-list";

import { useGetChannel } from "@/features/channels/api/use-get-channel";
import { useChannelId } from "@/hooks/use-channelId";
import { useGetMessages } from "@/features/messages/api/use-get-messages";

const ChannelIdPage = () => {
  const channelId = useChannelId();
  const { data: channel, isLoading: channelLoading } = useGetChannel({
    id: channelId,
  });
  const { results, status, loadMore } = useGetMessages({ channelId });

  if (channelLoading || status === "LoadingFirstPage") {
    return (
      <div className="h-full flex-1 flex items-center justify-center">
        <Loader className="size-8 animate-spin text-muted-foreground" />
      </div>
    );
  }
  if (!channel) {
    return (
      <div className="h-full flex-1 flex flex-col items-center justify-center gap-y-2">
        <TriangleAlert className="size-8  text-muted-foreground" />
        <span className="text-sm text-muted-foreground">
          Channel not found!
        </span>
      </div>
    );
  }
  return (
    <div className="flex flex-col h-full">
      <Header title={channel.name} />
      <MessageList
        channelName={channel.name}
        channelCreationTime={channel._creationTime}
        data={results}
        loadMore={loadMore}
        isLoadingMore={status === "LoadingMore"}
        canLoadMore={status === "CanLoadMore"}
      />
      <ChatInput placeholder={`Message # ${channel.name}`} />
    </div>
  );
};

export default ChannelIdPage;

import { useState } from "react";

import { Id } from "../../convex/_generated/dataModel";

import { differenceInMinutes, format, isToday, isYesterday } from "date-fns";

import { GetMessagesReturnType } from "@/features/messages/api/use-get-messages";

import { useWorkspaceId } from "@/hooks/use-workspaceId";
import { useCurrentMember } from "@/features/members/api/use-current-member";

import { Message } from "./message";
import { ChannelHero } from "./channel-hero";

const formatDateLabel = (dateStr: string) => {
  const date = new Date(dateStr);
  if (isToday(date)) return "Today";
  if (isYesterday(date)) return "Yesterday";
  return format(date, "EEEE,MMM d");
};

const TIME_THRESHOLD = 5;

interface MessageListProps {
  memberName?: string;
  memberImage?: string;
  channelName?: string;
  channelCreationTime?: number;
  variant?: "channel" | "thread" | "conversation";
  data: GetMessagesReturnType | undefined;
  loadMore: () => void;
  isLoadingMore: boolean;
  canLoadMore: boolean;
}

export const MessageList = ({
  memberName,
  canLoadMore,
  data,
  isLoadingMore,
  loadMore,
  channelCreationTime,
  channelName,
  memberImage,
  variant = "channel",
}: MessageListProps) => {
  const [editingId, setEditingId] = useState<Id<"messages"> | null>(null);

  const workspaceId = useWorkspaceId();

  const { data: currentMember } = useCurrentMember({ workspaceId });

  const groupedMessages = data?.reduce(
    (groups, message) => {
      const date = new Date(message!._creationTime);
      const dateKey = format(date, "yyyy-MM-dd");
      if (!groups[dateKey]) {
        groups[dateKey] = [];
      }
      groups[dateKey].unshift(message);
      return groups;
    },
    {} as Record<string, typeof data>
  );
  return (
    <div className="flex flex-1 flex-col-reverse pb-4 overflow-y-auto messages-scrollbar">
      {Object.entries(groupedMessages || {}).map(([dataKey, messages]) => (
        <div key={dataKey}>
          <div className="text-center my-2 relative">
            <hr className="absolute top-1/2 left-0 right-0 border-t border-gray-300" />
            <span className="relative inline-block bg-white px-4 py-1 rounded-full text-xs border border-gray-300 shadow-sm">
              {formatDateLabel(dataKey)}
            </span>
          </div>
          {messages.map((message, index) => {
            const prevMessage = messages[index - 1];
            const isCompact =
              prevMessage &&
              prevMessage.user._id === message!.user._id &&
              differenceInMinutes(
                new Date(message!._creationTime),
                new Date(prevMessage._creationTime)
              ) < TIME_THRESHOLD;
            return (
              <Message
                key={message?._id}
                id={message!._id}
                memberId={message!.memberId}
                authorImage={message?.user.image}
                authorName={message?.user.name}
                isAuthor={message?.memberId === currentMember?._id}
                reactions={message!.reactions}
                body={message!.body}
                image={message?.image}
                updatedAt={message?.updatedAt}
                createdAt={message!._creationTime}
                isEditing={editingId === message?._id}
                setEditingId={setEditingId}
                isCompact={isCompact as boolean}
                hideThreadButton={variant === "thread"}
                threadCount={message?.threadCount}
                threadImage={message?.threadImage}
                threadTimeStamp={message?.threadTimeStamp}
              />
            );
          })}
        </div>
      ))}
      {variant === "channel" && channelName && channelCreationTime && (
        <ChannelHero name={channelName} creationTime={channelCreationTime} />
      )}
    </div>
  );
};

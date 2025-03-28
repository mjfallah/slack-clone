import { useRef, useState } from "react";

import Quill from "quill";

import { differenceInMinutes, format, isToday, isYesterday } from "date-fns";

import { Id } from "../../../../convex/_generated/dataModel";

import { Button } from "@/components/ui/button";
import { AlertTriangle, Loader, XIcon } from "lucide-react";
import { toast } from "sonner";

import { Message } from "@/components/message";

import { useGetMessage } from "../api/use-get-message";
import { useCurrentMember } from "@/features/members/api/use-current-member";
import { useWorkspaceId } from "@/hooks/use-workspaceId";
import { useCreateMessage } from "../api/use-create-message";
import { useGenerateUploadUrl } from "@/features/upload/api/use-generate-upload-url";
import { useChannelId } from "@/hooks/use-channelId";
import { useGetMessages } from "@/features/messages/api/use-get-messages";

import dynamic from "next/dynamic";
const Editor = dynamic(() => import("@/components/editor"), { ssr: false });

interface ThreadProps {
  messageId: Id<"messages">;
  onClose: () => void;
}

type CreateMessageValues = {
  channelId: Id<"channels">;
  workspaceId: Id<"workspaces">;
  parentMessageId: Id<"messages">;
  body: string;
  image?: Id<"_storage"> | undefined;
};

const formatDateLabel = (dateStr: string) => {
  const date = new Date(dateStr);
  if (isToday(date)) return "Today";
  if (isYesterday(date)) return "Yesterday";
  return format(date, "EEEE,MMM d");
};

const TIME_THRESHOLD = 5;

export const Thread = ({ messageId, onClose }: ThreadProps) => {
  const [editorKey, setEditorKey] = useState(0);
  const [isPending, setIsPending] = useState(false);

  const channelId = useChannelId();

  const editorRef = useRef<Quill | null>(null);

  const [editingId, setEditingId] = useState<Id<"messages"> | null>(null);

  const workspaceId = useWorkspaceId();

  const { data: currentMember } = useCurrentMember({ workspaceId });

  const { data: message, isLoading: isLoadingMessage } = useGetMessage({
    id: messageId,
  });

  const { results, status, loadMore } = useGetMessages({
    channelId,
    parentMessageId: messageId,
  });

  const { mutate: createMessage } = useCreateMessage();

  const { mutate: generateUploadUrl } = useGenerateUploadUrl();

  const canLoadMore = status === "CanLoadMore";
  const isLoadingMore = status === "LoadingMore";

  const handleSubmit = async ({
    body,
    image,
  }: {
    body: string;
    image: File | null;
  }) => {
    try {
      setIsPending(true);
      editorRef?.current?.enable(false);

      const values: CreateMessageValues = {
        channelId,
        workspaceId,
        parentMessageId: messageId,
        body,
        image: undefined,
      };

      if (image) {
        const url = await generateUploadUrl({}, { throwError: true });

        if (!url) {
          throw new Error("Url not found!");
        }

        const result = await fetch(url, {
          method: "POST",
          headers: { "Content-Type": image.type },
          body: image,
        });

        if (!result.ok) {
          throw new Error("Failed to upload image!");
        }

        const { storageId } = await result.json();

        values.image = storageId;
      }
      createMessage(values, { throwError: true });

      setEditorKey((prev) => prev + 1);
    } catch (error) {
      console.log(error);
      toast.error("Failed to send message!");
    } finally {
      setIsPending(false);
      editorRef?.current?.enable(true);
    }
  };

  const groupedMessages = results?.reduce(
    (groups, message) => {
      const date = new Date(message!._creationTime);
      const dateKey = format(date, "yyyy-MM-dd");
      if (!groups[dateKey]) {
        groups[dateKey] = [];
      }
      groups[dateKey].unshift(message);
      return groups;
    },
    {} as Record<string, typeof results>
  );

  if (isLoadingMessage || status === "LoadingFirstPage") {
    return (
      <div className=" h-full flex flex-col">
        <div className="h-[49px] flex justify-between items-center px-4 border-b">
          <p className="text-lg font-bold">Thread</p>
          <Button onClick={onClose} variant="ghost" size="iconSm">
            <XIcon className="size-5 stroke-[1.5]" />
          </Button>
        </div>
        <div className="flex h-full flex-col gap-y-2 items-center justify-center">
          <Loader className="size-5 animate-spin text-muted-foreground" />
        </div>
      </div>
    );
  }

  if (!message) {
    return (
      <div className=" h-full flex flex-col">
        <div className="h-[49px] flex justify-between items-center px-4 border-b">
          <p className="text-lg font-bold">Thread</p>
          <Button onClick={onClose} variant="ghost" size="iconSm">
            <XIcon className="size-5 stroke-[1.5]" />
          </Button>
        </div>
        <div className="flex h-full flex-col gap-y-2 items-center justify-center">
          <AlertTriangle className="size-5 text-muted-foreground" />
          <p className="text-sm text-muted-foreground">Message not found!</p>
        </div>
      </div>
    );
  }

  return (
    <div className=" h-full flex flex-col">
      <div className="h-[49px] flex justify-between items-center px-4 border-b">
        <p className="text-lg font-bold">Thread</p>
        <Button onClick={onClose} variant="ghost" size="iconSm">
          <XIcon className="size-5 stroke-[1.5]" />
        </Button>
      </div>
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
                  hideThreadButton={true}
                  threadCount={message?.threadCount}
                  threadImage={message?.threadImage}
                  threadTimeStamp={message?.threadTimeStamp}
                />
              );
            })}
          </div>
        ))}
        <div
          className="h-1"
          ref={(el) => {
            if (el) {
              const observer = new IntersectionObserver(
                ([entry]) => {
                  if (entry.isIntersecting && canLoadMore) {
                    loadMore();
                  }
                },
                { threshold: 1.0 }
              );
              observer.observe(el);
              return () => {
                observer.disconnect();
              };
            }
          }}
        />
        {isLoadingMore && (
          <div className="text-center my-2 relative">
            <hr className="absolute top-1/2 left-0 right-0 border-t border-gray-300" />
            <span className="relative inline-block bg-white px-4 py-1 rounded-full text-xs border border-gray-300 shadow-sm">
              <Loader className="size-4 animate-spin" />
            </span>
          </div>
        )}
        <Message
          hideThreadButton
          memberId={message.memberId}
          authorName={message.user.name}
          authorImage={message.user.image}
          isAuthor={message.memberId === currentMember?._id}
          body={message.body}
          image={message.image}
          createdAt={message._creationTime}
          updatedAt={message.updatedAt}
          id={message._id}
          reactions={message.reactions}
          isEditing={editingId === message._id}
          setEditingId={setEditingId}
        />
      </div>
      <div className="px-4">
        <Editor
          key={editorKey}
          onSubmit={handleSubmit}
          innerRef={editorRef}
          disabled={isPending}
          placeholder="Reply..."
        />
      </div>
    </div>
  );
};

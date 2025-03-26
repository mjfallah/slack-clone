import Link from "next/link";

import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

import { cva, type VariantProps } from "class-variance-authority";
import { Id } from "../../../../convex/_generated/dataModel";
import { cn } from "@/lib/utils";

import { useWorkspaceId } from "@/hooks/use-workspaceId";

const userItemVariants = cva(
  "flex items-center gap-1.5 justify-start font-normal h-7 px-4 text-sm overflow-hidden",
  {
    variants: {
      variant: {
        default: "text-[#f9EDFFCC]",
        active: "text-[#481349] bg-white/90 hover:bg-white/90",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
);

interface UserItemProps {
  id: Id<"members">;
  label?: string;
  image?: string;
  variant?: VariantProps<typeof userItemVariants>["variant"];
}

export const UserItem = ({ id, image, label, variant }: UserItemProps) => {
  const workspaceId = useWorkspaceId();
  const avatarFallback = label?.charAt(0).toUpperCase();
  return (
    <Button
      variant="transparent"
      className={cn(userItemVariants({ variant }))}
      size="sm"
      asChild
    >
      <Link href={`/workspace/${workspaceId}/member/${id}`}>
        <Avatar className="size-5 mr-1">
          <AvatarImage src={image} />
          <AvatarFallback>{avatarFallback}</AvatarFallback>
        </Avatar>
        <span className="text-sm truncate">{label}</span>
      </Link>
    </Button>
  );
};

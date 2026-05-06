"use client";

import { useState } from "react";
import { Bookmark } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toggleBookmark } from "@/app/dashboard/bookmarks/actions";

type BookmarkButtonProps = {
  questionId: string;
  initialBookmarked: boolean;
  onToggle?: (questionId: string, bookmarked: boolean) => void;
  size?: "sm" | "md";
  className?: string;
};

export function BookmarkButton({
  questionId,
  initialBookmarked,
  onToggle,
  size = "md",
  className,
}: BookmarkButtonProps) {
  const [bookmarked, setBookmarked] = useState(initialBookmarked);
  const [loading, setLoading] = useState(false);

  async function handleClick() {
    if (loading) return;
    const prev = bookmarked;
    setLoading(true);
    setBookmarked(!prev);

    const result = await toggleBookmark(questionId);

    if ("error" in result) {
      setBookmarked(prev);
    } else {
      onToggle?.(questionId, result.bookmarked);
    }

    setLoading(false);
  }

  return (
    <Button
      variant="ghost"
      size="icon"
      disabled={loading}
      onClick={handleClick}
      aria-label={bookmarked ? "Remove bookmark" : "Save question"}
      className={`transition-colors duration-150 ${
        bookmarked
          ? "text-primary hover:text-primary/80"
          : "text-muted-foreground hover:text-primary"
      } ${size === "sm" ? "h-7 w-7" : "h-9 w-9"} ${className ?? ""}`}
    >
      <Bookmark
        className={size === "sm" ? "w-3.5 h-3.5" : "w-4 h-4"}
        fill={bookmarked ? "currentColor" : "none"}
      />
    </Button>
  );
}

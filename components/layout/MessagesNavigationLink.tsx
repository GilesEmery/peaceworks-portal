"use client";

import Link from "next/link";
import { MessageCircle } from "lucide-react";
import { useCallback, useEffect, useState } from "react";

import { routes } from "../../lib/navigation";
import { supabase } from "../../lib/supabase";

export default function MessagesNavigationLink({
  mobile = false,
  onClick,
}: {
  mobile?: boolean;
  onClick?: () => void;
}) {
  const [unreadCount, setUnreadCount] = useState(0);

  const loadUnreadCount = useCallback(async () => {
    const {
      data: { session },
    } = await supabase.auth.getSession();
    if (!session) return;
    const response = await fetch("/api/messages/unread-count", {
      headers: { Authorization: `Bearer ${session.access_token}` },
      cache: "no-store",
    });
    if (!response.ok) return;
    const payload = (await response.json()) as { unreadCount?: number };
    setUnreadCount(Math.max(0, Number(payload.unreadCount) || 0));
  }, []);

  useEffect(() => {
    void Promise.resolve().then(loadUnreadCount);
    window.addEventListener("peaceworks-messages-updated", loadUnreadCount);
    return () => window.removeEventListener("peaceworks-messages-updated", loadUnreadCount);
  }, [loadUnreadCount]);

  return (
    <Link
      className={mobile ? "" : "messages-nav-link"}
      href={routes.messages}
      aria-label={unreadCount ? `Messages, ${unreadCount} unread` : "Messages"}
      onClick={onClick}
    >
      {!mobile && <MessageCircle size={20} aria-hidden="true" />}
      <span>Messages</span>
      {unreadCount > 0 && (
        <span className="messages-unread-badge" aria-hidden="true">
          {unreadCount > 99 ? "99+" : unreadCount}
        </span>
      )}
    </Link>
  );
}

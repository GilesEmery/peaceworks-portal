"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

import type { ConversationSummary } from "../../lib/messaging/service";
import { routes } from "../../lib/navigation";
import { supabase } from "../../lib/supabase";

export default function DashboardMessagesCard() {
  const router = useRouter();
  const [conversations, setConversations] = useState<ConversationSummary[]>([]);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    async function load() {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (!session) return;
      const response = await fetch("/api/messages", {
        headers: { Authorization: `Bearer ${session.access_token}` },
        cache: "no-store",
      });
      if (response.ok) {
        const payload = (await response.json()) as {
          conversations?: ConversationSummary[];
        };
        setConversations(payload.conversations || []);
      }
      setLoaded(true);
    }
    void load();
  }, []);

  if (!loaded) return null;
  const latest = conversations.slice(0, 3);
  const unreadCount = conversations.filter((conversation) => conversation.unread).length;

  return (
    <section className="dashboard-messages-card portal-card">
      <div>
        <span className="eyebrow">Messages</span>
        <h2>{unreadCount ? `${unreadCount} unread conversation${unreadCount === 1 ? "" : "s"}` : "Stay connected"}</h2>
      </div>
      {latest.length > 0 && (
        <div className="dashboard-message-preview-list">
          {latest.map((conversation) => (
            <button
              key={conversation.id}
              type="button"
              onClick={() => router.push(routes.messages)}
            >
              <strong>{conversation.title}</strong>
              <span>{conversation.latestMessagePreview}</span>
              {conversation.unread && <i aria-label="Unread" />}
            </button>
          ))}
        </div>
      )}
      <div className="dashboard-card-actions">
        <button className="btn btn-primary" type="button" onClick={() => router.push(routes.messages)}>
          Open Messages
        </button>
        {latest.length === 0 && (
          <button
            className="btn btn-secondary"
            type="button"
            onClick={() => router.push(routes.messages)}
          >
            Contact PeaceWorks
          </button>
        )}
      </div>
    </section>
  );
}

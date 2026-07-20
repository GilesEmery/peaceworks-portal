"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";

import type {
  ConversationDetail,
  ConversationSummary,
  EligibleMessagingRecipient,
  MessagingPermissions,
} from "../../lib/messaging/service";
import { routes } from "../../lib/navigation";
import { supabase } from "../../lib/supabase";
import SiteFooter from "../layout/SiteFooter";
import SiteHeader from "../layout/SiteHeader";

type InboxPayload = {
  ok: true;
  conversations: ConversationSummary[];
  permissions: MessagingPermissions;
};
type RecipientsPayload = {
  ok: true;
  recipients: EligibleMessagingRecipient[];
  circles: Array<{ id: string; name: string }>;
  permissions: MessagingPermissions;
  regularMemberOnly: boolean;
};

export default function MessagesPage() {
  const router = useRouter();
  const [token, setToken] = useState("");
  const [inbox, setInbox] = useState<InboxPayload | null>(null);
  const [detail, setDetail] = useState<ConversationDetail | null>(null);
  const [recipients, setRecipients] = useState<RecipientsPayload | null>(null);
  const [archived, setArchived] = useState(false);
  const [composing, setComposing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");

  const loadInbox = useCallback(
    async (accessToken: string, showArchived = archived) => {
      const payload = await messagingFetch<InboxPayload>(
        showArchived ? "/api/messages/archived" : "/api/messages",
        accessToken
      );
      setInbox(payload);
      setLoading(false);
    },
    [archived]
  );

  useEffect(() => {
    async function initialize() {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (!session) {
        router.replace(routes.login);
        return;
      }
      setToken(session.access_token);
      try {
        await loadInbox(session.access_token);
      } catch (error) {
        setMessage(error instanceof Error ? error.message : "Messages could not be loaded.");
        setLoading(false);
      }
    }
    void initialize();
  }, [loadInbox, router]);

  async function openConversation(id: string) {
    try {
      const result = await messagingFetch<{ ok: true; conversation: ConversationDetail }>(
        `/api/messages/conversations/${id}`,
        token
      );
      setDetail(result.conversation);
      setComposing(false);
      await messagingFetch(`/api/messages/conversations/${id}/read`, token, {
        method: "POST",
      });
      await loadInbox(token);
      window.dispatchEvent(new Event("peaceworks-messages-updated"));
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Conversation could not be opened.");
    }
  }

  async function openComposer() {
    try {
      const payload = await messagingFetch<RecipientsPayload>(
        "/api/messages/eligible-recipients",
        token
      );
      setRecipients(payload);
      setComposing(true);
      setDetail(null);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "New message is unavailable.");
    }
  }

  async function refreshConversation(conversationId: string) {
    await openConversation(conversationId);
    await loadInbox(token);
  }

  return (
    <main className="portal-page">
      <SiteHeader />
      <section className="messages-shell">
        <div className="container">
          <header className="messages-page-head">
            <div>
              <span className="eyebrow">PeaceWorks Portal</span>
              <h1>Messages</h1>
            </div>
            <button className="btn btn-primary" type="button" onClick={openComposer}>
              New Message
            </button>
          </header>
          {message && <div className="admin-message">{message}</div>}
          <div className={`messages-layout${detail || composing ? " thread-open" : ""}`}>
            <aside className="messages-inbox-panel">
              <div className="messages-filter">
                <button
                  className={!archived ? "active" : ""}
                  type="button"
                  onClick={() => {
                    setArchived(false);
                    setDetail(null);
                    void loadInbox(token, false);
                  }}
                >
                  Inbox
                </button>
                <button
                  className={archived ? "active" : ""}
                  type="button"
                  onClick={() => {
                    setArchived(true);
                    setDetail(null);
                    void loadInbox(token, true);
                  }}
                >
                  Archived
                </button>
              </div>
              {loading ? (
                <p>Loading messages...</p>
              ) : inbox?.conversations.length ? (
                <div className="messages-conversation-list">
                  {inbox.conversations.map((conversation) => (
                    <button
                      className={`${conversation.unread ? "unread" : ""}${
                        detail?.id === conversation.id ? " selected" : ""
                      }`}
                      key={conversation.id}
                      type="button"
                      onClick={() => void openConversation(conversation.id)}
                    >
                      <span>
                        <strong>{conversation.title}</strong>
                        {conversation.unread && <i aria-label="Unread conversation" />}
                      </span>
                      {conversation.participantSummary && (
                        <small>{conversation.participantSummary}</small>
                      )}
                      <p>{conversation.latestMessagePreview}</p>
                      {conversation.latestMessageAt && (
                        <small>{formatDateTime(conversation.latestMessageAt)}</small>
                      )}
                    </button>
                  ))}
                </div>
              ) : (
                <div className="messages-empty">
                  <p>{archived ? "No archived conversations." : "No messages yet."}</p>
                  {!archived && (
                    <button className="admin-link-button" type="button" onClick={openComposer}>
                      Contact PeaceWorks
                    </button>
                  )}
                </div>
              )}
            </aside>
            <section className="messages-thread-panel">
              {(detail || composing) && (
                <button
                  className="messages-mobile-back"
                  type="button"
                  onClick={() => {
                    setDetail(null);
                    setComposing(false);
                  }}
                >
                  Back to conversations
                </button>
              )}
              {composing && recipients ? (
                <NewMessageComposer
                  payload={recipients}
                  token={token}
                  onCreated={(conversation) => {
                    setComposing(false);
                    setDetail(conversation);
                    void loadInbox(token);
                  }}
                  onError={setMessage}
                />
              ) : detail ? (
                <ConversationThread
                  conversation={detail}
                  token={token}
                  onChanged={() => refreshConversation(detail.id)}
                  onRemoved={() => {
                    setDetail(null);
                    void loadInbox(token, archived);
                  }}
                  onError={setMessage}
                />
              ) : (
                <div className="messages-thread-placeholder">
                  <h2>Select a conversation</h2>
                  <p>Your PeaceWorks messages will appear here.</p>
                </div>
              )}
            </section>
          </div>
        </div>
      </section>
      <SiteFooter />
    </main>
  );
}

function ConversationThread({
  conversation,
  token,
  onChanged,
  onRemoved,
  onError,
}: {
  conversation: ConversationDetail;
  token: string;
  onChanged: () => Promise<void>;
  onRemoved: () => void;
  onError: (message: string) => void;
}) {
  const [body, setBody] = useState("");
  const [sending, setSending] = useState(false);

  async function act(action: "archive" | "unarchive" | "delete-for-me") {
    if (
      action === "delete-for-me" &&
      !window.confirm(
        "Remove this conversation from your Messages? Other participants will still retain it."
      )
    ) {
      return;
    }
    try {
      await messagingFetch(
        `/api/messages/conversations/${conversation.id}/${action}`,
        token,
        {
          method: "POST",
          body: action === "delete-for-me" ? JSON.stringify({ confirmed: true }) : undefined,
        }
      );
      if (action === "delete-for-me") onRemoved();
      else await onChanged();
      window.dispatchEvent(new Event("peaceworks-messages-updated"));
    } catch (error) {
      onError(error instanceof Error ? error.message : "Conversation could not be updated.");
    }
  }

  async function send() {
    if (!body.trim() || sending) return;
    setSending(true);
    try {
      await messagingFetch(`/api/messages/conversations/${conversation.id}/messages`, token, {
        method: "POST",
        body: JSON.stringify({ body }),
      });
      setBody("");
      await onChanged();
      window.dispatchEvent(new Event("peaceworks-messages-updated"));
    } catch (error) {
      onError(error instanceof Error ? error.message : "Message could not be sent.");
    } finally {
      setSending(false);
    }
  }

  return (
    <div className="messages-thread">
      <header>
        <div>
          <span className="card-label">{conversation.circle?.name || "Conversation"}</span>
          <h2>{conversation.title}</h2>
          <small>{conversation.participantSummary}</small>
        </div>
        <div>
          <button
            className="admin-link-button"
            type="button"
            onClick={() => void act(conversation.archived ? "unarchive" : "archive")}
          >
            {conversation.archived ? "Return to Inbox" : "Archive"}
          </button>
          <button
            className="admin-link-button danger"
            type="button"
            onClick={() => void act("delete-for-me")}
          >
            Remove from My Messages
          </button>
        </div>
      </header>
      <div className="messages-history">
        {conversation.messages.map((message) => (
          <article key={message.id}>
            <strong>{message.sender?.displayName || "PeaceWorks"}</strong>
            <p>{message.body}</p>
            <small>{formatDateTime(message.createdAt)}</small>
          </article>
        ))}
      </div>
      {conversation.repliesEnabled ? (
        <div className="messages-composer">
          <label htmlFor="message-reply">Reply message</label>
          <textarea
            id="message-reply"
            maxLength={10000}
            value={body}
            onChange={(event) => setBody(event.target.value)}
          />
          <button
            className="btn btn-primary"
            type="button"
            disabled={!body.trim() || sending}
            onClick={() => void send()}
          >
            {sending ? "Sending..." : "Send Reply"}
          </button>
        </div>
      ) : (
        <p className="messages-replies-disabled">Replies are disabled for this announcement.</p>
      )}
    </div>
  );
}

function NewMessageComposer({
  payload,
  token,
  onCreated,
  onError,
}: {
  payload: RecipientsPayload;
  token: string;
  onCreated: (conversation: ConversationDetail) => void;
  onError: (message: string) => void;
}) {
  const defaultType = payload.regularMemberOnly ? "admin_support" : "admin_support";
  const [type, setType] = useState(defaultType);
  const [circleId, setCircleId] = useState("");
  const [recipientIds, setRecipientIds] = useState<string[]>([]);
  const [topic, setTopic] = useState("");
  const [body, setBody] = useState("");
  const [requestId] = useState(
    () => `${Date.now()}_${Math.random().toString(36).slice(2)}`
  );
  const [sending, setSending] = useState(false);

  async function create() {
    setSending(true);
    try {
      const result = await messagingFetch<{ ok: true; conversation: ConversationDetail }>(
        "/api/messages/conversations",
        token,
        {
          method: "POST",
          body: JSON.stringify({
            conversationType: type === "circle_topic" ? "group" : type,
            circleId,
            circleDiscussion: type === "circle_topic",
            recipientIds,
            title:
              type === "circle"
                ? payload.circles.find((circle) => circle.id === circleId)?.name || "Circle"
                : topic,
            initialMessage: body,
            requestId,
          }),
        }
      );
      onCreated(result.conversation);
      window.dispatchEvent(new Event("peaceworks-messages-updated"));
    } catch (error) {
      onError(error instanceof Error ? error.message : "Conversation could not be created.");
    } finally {
      setSending(false);
    }
  }

  return (
    <div className="messages-new">
      <span className="card-label">New Message</span>
      <h2>{payload.regularMemberOnly ? "Contact PeaceWorks" : "Start a conversation"}</h2>
      {!payload.regularMemberOnly && (
        <label>
          <span>Conversation</span>
          <select value={type} onChange={(event) => setType(event.target.value)}>
            <option value="admin_support">Contact PeaceWorks</option>
            {payload.circles.length > 0 && (
              <>
                <option value="circle">My Circle — ongoing conversation</option>
                <option value="circle_topic">New Circle discussion</option>
              </>
            )}
            <option value="direct">Individual</option>
            {payload.permissions.canCreateGroups && <option value="group">Selected people</option>}
          </select>
        </label>
      )}
      {(type === "circle" || type === "circle_topic") && (
        <label>
          <span>Circle</span>
          <select value={circleId} onChange={(event) => setCircleId(event.target.value)}>
            <option value="">Choose Circle</option>
            {payload.circles.map((circle) => (
              <option key={circle.id} value={circle.id}>
                {circle.name}
              </option>
            ))}
          </select>
        </label>
      )}
      {(type === "direct" || type === "group") && (
        <fieldset>
          <legend>Recipients</legend>
          {payload.recipients.map((recipient) => (
            <label key={recipient.id}>
              <input
                checked={recipientIds.includes(recipient.id)}
                name="message-recipient"
                type={type === "direct" ? "radio" : "checkbox"}
                onChange={() =>
                  setRecipientIds((current) =>
                    type === "direct"
                      ? [recipient.id]
                      : current.includes(recipient.id)
                        ? current.filter((id) => id !== recipient.id)
                        : [...current, recipient.id]
                  )
                }
              />
              <span>{recipient.displayName}</span>
            </label>
          ))}
        </fieldset>
      )}
      {type !== "circle" && (
        <label>
          <span>Topic</span>
          <input
            maxLength={150}
            value={topic}
            onChange={(event) => setTopic(event.target.value)}
          />
          <small>Give this conversation a clear subject.</small>
        </label>
      )}
      <label>
        <span>Message</span>
        <textarea maxLength={10000} value={body} onChange={(event) => setBody(event.target.value)} />
      </label>
      <button
        className="btn btn-primary"
        type="button"
        disabled={(type !== "circle" && !topic.trim()) || !body.trim() || sending}
        onClick={() => void create()}
      >
        {sending ? "Sending..." : "Send Message"}
      </button>
    </div>
  );
}

async function messagingFetch<T = { ok: true }>(
  url: string,
  token: string,
  init?: RequestInit
) {
  const response = await fetch(url, {
    ...init,
    headers: {
      Authorization: `Bearer ${token}`,
      ...(init?.body ? { "Content-Type": "application/json" } : {}),
      ...init?.headers,
    },
    cache: "no-store",
  });
  const payload = (await response.json().catch(() => null)) as
    | T
    | { ok?: false; message?: string }
    | null;
  if (!response.ok || !payload) {
    const errorMessage =
      payload &&
      typeof payload === "object" &&
      "message" in payload &&
      typeof payload.message === "string"
        ? payload.message
        : "Messaging request failed.";
    throw new Error(errorMessage);
  }
  return payload as T;
}

function formatDateTime(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(date);
}

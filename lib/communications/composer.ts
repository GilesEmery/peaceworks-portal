import { shouldResetComposerAfterEmailSend } from "./recipients.ts";

type ComposerChannelState = {
  id: string;
  channels: string[];
  channelStatuses: Record<string, string>;
};

export function applySuccessfulEmailSend<T extends ComposerChannelState>(
  current: T,
  empty: T,
  communication?: Partial<ComposerChannelState>
): T {
  const channels = communication?.channels || current.channels;
  const channelStatuses = communication?.channelStatuses || {
    ...current.channelStatuses,
    email: "sent",
  };

  if (shouldResetComposerAfterEmailSend(channels, channelStatuses)) return empty;

  return {
    ...current,
    id: communication?.id || current.id,
    channelStatuses,
  };
}

export function applyFailedEmailSend<T extends ComposerChannelState>(
  current: T,
  communicationId?: string
): T {
  return {
    ...current,
    id: communicationId || current.id,
    channelStatuses: { ...current.channelStatuses, email: "failed" },
  };
}

export function getCommunicationPresentationStatus(communication: ComposerChannelState) {
  if (communication.channels.includes("my_dashboard")) {
    return communication.channelStatuses.my_dashboard === "active"
      ? "Site Message: Published"
      : "Site Message: Draft";
  }

  if (communication.channels.includes("email")) {
    if (communication.channelStatuses.email === "sent") return "Email: Sent";
    if (communication.channelStatuses.email === "failed") return "Email: Failed";
    return "Email: Ready";
  }

  return "Draft";
}

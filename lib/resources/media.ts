export type ResourceMedia =
  | {
      kind: "video-embed";
      provider: "youtube" | "vimeo";
      embedUrl: string;
      originalUrl: string;
    }
  | {
      kind: "audio-embed";
      provider: "spotify";
      embedUrl: string;
      originalUrl: string;
    }
  | {
      kind: "video-file";
      provider: "direct";
      src: string;
      originalUrl: string;
    }
  | {
      kind: "audio-file";
      provider: "direct";
      src: string;
      originalUrl: string;
    }
  | {
      kind: "external-video" | "external-audio" | "external-link";
      provider: string;
      originalUrl: string;
    }
  | {
      kind: "none";
    };

const videoExtensions = new Set(["mp4", "webm", "ogg"]);
const audioExtensions = new Set(["mp3", "m4a", "wav", "ogg", "aac"]);

export function normalizeResourceMedia(
  resourceType: string,
  rawUrl: string | null | undefined
): ResourceMedia {
  const url = parseSafeUrl(rawUrl);
  if (!url) return { kind: "none" };

  const normalizedType = resourceType.trim().toLowerCase();
  const originalUrl = url.toString();

  if (normalizedType === "video") {
    const youtubeId = getYouTubeId(url);
    if (youtubeId) {
      return {
        kind: "video-embed",
        provider: "youtube",
        embedUrl: `https://www.youtube-nocookie.com/embed/${youtubeId}`,
        originalUrl,
      };
    }

    const vimeoId = getVimeoId(url);
    if (vimeoId) {
      return {
        kind: "video-embed",
        provider: "vimeo",
        embedUrl: `https://player.vimeo.com/video/${vimeoId}`,
        originalUrl,
      };
    }

    if (videoExtensions.has(getExtension(url))) {
      return {
        kind: "video-file",
        provider: "direct",
        src: originalUrl,
        originalUrl,
      };
    }

    return {
      kind: "external-video",
      provider: getProviderLabel(url),
      originalUrl,
    };
  }

  if (normalizedType === "audio") {
    const spotifyEpisodeId = getSpotifyEpisodeId(url);
    if (spotifyEpisodeId) {
      return {
        kind: "audio-embed",
        provider: "spotify",
        embedUrl: `https://open.spotify.com/embed/episode/${spotifyEpisodeId}`,
        originalUrl,
      };
    }

    if (audioExtensions.has(getExtension(url))) {
      return {
        kind: "audio-file",
        provider: "direct",
        src: originalUrl,
        originalUrl,
      };
    }

    return {
      kind: "external-audio",
      provider: getProviderLabel(url),
      originalUrl,
    };
  }

  return {
    kind: "external-link",
    provider: getProviderLabel(url),
    originalUrl,
  };
}

function parseSafeUrl(rawUrl: string | null | undefined) {
  const value = rawUrl?.trim();
  if (!value) return null;

  try {
    const url = new URL(value);
    return url.protocol === "https:" ? url : null;
  } catch {
    return null;
  }
}

function getYouTubeId(url: URL) {
  const host = normalizeHost(url.hostname);
  let candidate = "";

  if (host === "youtu.be") {
    candidate = url.pathname.split("/").filter(Boolean)[0] || "";
  } else if (host === "youtube.com" || host === "m.youtube.com") {
    if (url.pathname === "/watch") {
      candidate = url.searchParams.get("v") || "";
    } else {
      const parts = url.pathname.split("/").filter(Boolean);
      if (parts[0] === "shorts" || parts[0] === "embed") {
        candidate = parts[1] || "";
      }
    }
  }

  return /^[a-zA-Z0-9_-]{6,20}$/.test(candidate) ? candidate : "";
}

function getVimeoId(url: URL) {
  const host = normalizeHost(url.hostname);
  const parts = url.pathname.split("/").filter(Boolean);
  let candidate = "";

  if (host === "vimeo.com" && parts.length === 1) {
    candidate = parts[0] || "";
  } else if (
    host === "player.vimeo.com" &&
    parts.length === 2 &&
    parts[0] === "video"
  ) {
    candidate = parts[1] || "";
  }

  return /^\d{5,12}$/.test(candidate) ? candidate : "";
}

function getSpotifyEpisodeId(url: URL) {
  if (normalizeHost(url.hostname) !== "open.spotify.com") return "";

  const parts = url.pathname.split("/").filter(Boolean);
  const candidate = parts[0] === "episode" ? parts[1] || "" : "";
  return /^[a-zA-Z0-9]{10,40}$/.test(candidate) ? candidate : "";
}

function getExtension(url: URL) {
  const fileName = url.pathname.split("/").pop() || "";
  const dotIndex = fileName.lastIndexOf(".");
  return dotIndex >= 0 ? fileName.slice(dotIndex + 1).toLowerCase() : "";
}

function getProviderLabel(url: URL) {
  const host = normalizeHost(url.hostname);
  if (host === "podcasts.apple.com") return "Apple Podcasts";
  if (host === "open.spotify.com") return "Spotify";
  if (host === "soundcloud.com" || host === "w.soundcloud.com") {
    return "SoundCloud";
  }
  return host;
}

function normalizeHost(hostname: string) {
  return hostname.toLowerCase().replace(/^www\./, "");
}

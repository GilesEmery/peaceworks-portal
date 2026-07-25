import type { ResourceMedia } from "../../lib/resources/media";

type ResourceMediaPlayerProps = {
  media: ResourceMedia;
  resourceTitle: string;
  resourceType: string;
};

export default function ResourceMediaPlayer({
  media,
  resourceTitle,
  resourceType,
}: ResourceMediaPlayerProps) {
  if (media.kind === "video-embed") {
    return (
      <div className="resource-media-block">
        <div className="resource-video-frame">
          <iframe
            src={media.embedUrl}
            title={`${resourceTitle} video`}
            loading="lazy"
            allow="encrypted-media; fullscreen; picture-in-picture"
            allowFullScreen
            referrerPolicy="strict-origin-when-cross-origin"
          />
        </div>
        <ResourceSourceLink href={media.originalUrl} label="Open original video" />
      </div>
    );
  }

  if (media.kind === "video-file") {
    return (
      <div className="resource-media-block">
        <video
          className="resource-native-video"
          controls
          playsInline
          preload="metadata"
          src={media.src}
        >
          This video cannot be played in your browser.
        </video>
        <ResourceSourceLink href={media.originalUrl} label="Open original video" />
      </div>
    );
  }

  if (media.kind === "audio-embed") {
    return (
      <div className="resource-media-block">
        <iframe
          className="resource-audio-embed"
          src={media.embedUrl}
          title={`${resourceTitle} audio player`}
          loading="lazy"
          allow="encrypted-media; fullscreen; picture-in-picture"
          referrerPolicy="strict-origin-when-cross-origin"
        />
        <ResourceSourceLink href={media.originalUrl} label="Open original audio" />
      </div>
    );
  }

  if (media.kind === "audio-file") {
    return (
      <div className="resource-media-block">
        <audio
          className="resource-native-audio"
          controls
          preload="metadata"
          src={media.src}
        >
          This audio cannot be played in your browser.
        </audio>
        <ResourceSourceLink href={media.originalUrl} label="Open original audio" />
      </div>
    );
  }

  if (media.kind === "external-video" || media.kind === "external-audio") {
    const isVideo = media.kind === "external-video";
    return (
      <div className="resource-media-block">
        <div className="resource-media-fallback" role="note">
          <strong>{isVideo ? "Video resource" : "Audio resource"}</strong>
          <span>This media cannot be played here.</span>
          {media.provider && <small>Available from {media.provider}</small>}
        </div>
        <ResourceSourceLink
          href={media.originalUrl}
          label={isVideo ? "Watch video" : "Listen to podcast"}
          primary
        />
      </div>
    );
  }

  if (media.kind === "external-link") {
    return (
      <ResourceSourceLink
        href={media.originalUrl}
        label={`Open ${formatResourceType(resourceType)}`}
        primary
      />
    );
  }

  return (
    <button className="btn btn-secondary" type="button" disabled>
      Resource Unavailable
    </button>
  );
}

function ResourceSourceLink({
  href,
  label,
  primary = false,
}: {
  href: string;
  label: string;
  primary?: boolean;
}) {
  return (
    <a
      className={primary ? "btn btn-primary" : "resource-original-link"}
      href={href}
      target="_blank"
      rel="noopener noreferrer"
    >
      {label}
    </a>
  );
}

function formatResourceType(value: string) {
  return value.replaceAll("_", " ").toLowerCase();
}

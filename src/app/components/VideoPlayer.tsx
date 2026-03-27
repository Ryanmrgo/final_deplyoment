"use client";

type VideoPlayerProps = {
  sourceUrl: string;
  type: 'video' | 'youtube';
};

export function VideoPlayer({ sourceUrl, type }: VideoPlayerProps) {
  if (!sourceUrl) return null;

  if (type === 'youtube') {
    return (
      <div className="aspect-video w-full overflow-hidden rounded-lg border bg-black">
        <iframe
          title="Lesson video"
          src={sourceUrl}
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
          className="h-full w-full"
        />
      </div>
    );
  }

  return (
    <video className="w-full rounded-lg border bg-black" controls preload="metadata">
      <source src={sourceUrl} />
      Your browser does not support this video.
    </video>
  );
}

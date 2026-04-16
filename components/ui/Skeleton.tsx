export function Skeleton({
  className = "",
  width,
  height,
}: {
  className?: string;
  width?: string;
  height?: string;
}) {
  return (
    <div
      className={`animate-pulse rounded bg-[var(--skeleton-pulse)] ${className}`}
      style={{ width, height: height ?? "1rem" }}
    />
  );
}

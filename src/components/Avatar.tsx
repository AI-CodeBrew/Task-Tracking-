import { avatarColor, initials } from "@/lib/avatar";

export default function Avatar({
  url,
  label,
  id,
  size = "sm",
}: {
  url?: string | null;
  label: string;
  id: string;
  size?: "sm" | "md" | "lg";
}) {
  const sizeClass = size === "lg" ? "h-16 w-16 text-lg" : size === "md" ? "h-8 w-8 text-xs" : "h-5 w-5 text-[10px]";

  if (url) {
    // eslint-disable-next-line @next/next/no-img-element
    return (
      <img
        src={url}
        alt={label}
        title={label}
        className={`${sizeClass} flex-shrink-0 rounded-full object-cover`}
      />
    );
  }

  return (
    <div
      title={label}
      className={`${sizeClass} flex flex-shrink-0 items-center justify-center rounded-full font-medium text-white ${avatarColor(id)}`}
    >
      {initials(label)}
    </div>
  );
}

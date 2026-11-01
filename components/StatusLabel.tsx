import { RoomStatus, statusText } from "@/lib/schedule";

export default function StatusLabel({
  status,
  className = "",
}: {
  status: RoomStatus;
  className?: string;
}) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 text-[13px] ${
        status.free ? "text-ok" : "text-label-2"
      } ${className}`}
    >
      <span
        className={`size-2 shrink-0 rounded-full ${
          status.free ? "bg-ok-dot" : "bg-busy-dot"
        }`}
      />
      {statusText(status)}
    </span>
  );
}

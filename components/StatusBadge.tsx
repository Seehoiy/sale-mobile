const COLORS: Record<string, string> = {
  IN_STOCK: "bg-ok/15 text-ok",
  RESERVED: "bg-warn/15 text-warn",
  TRANSFER_OUT: "bg-warn/15 text-warn",
  IN_TRANSIT: "bg-warn/15 text-warn",
  SOLD: "bg-muted/15 text-muted",
  IN_REPAIR: "bg-signal/15 text-signal",
  CLAIMED_OUT: "bg-danger/15 text-danger",
  SECOND_HAND: "bg-signal/15 text-signal",
  DAMAGED: "bg-danger/15 text-danger",
  PENDING: "bg-warn/15 text-warn",
  IN_PROGRESS: "bg-signal/15 text-signal",
  WAITING_FOR_PARTS: "bg-danger/15 text-danger",
  DONE: "bg-ok/15 text-ok",
  DELIVERED: "bg-muted/15 text-muted",
  EVALUATED: "bg-warn/15 text-warn",
  ACCEPTED: "bg-ok/15 text-ok",
  REJECTED: "bg-danger/15 text-danger",
  CONVERTED_TO_STOCK: "bg-signal/15 text-signal",
  RECEIVED: "bg-warn/15 text-warn",
  SENT_TO_CENTER: "bg-signal/15 text-signal",
  SWAPPED: "bg-ok/15 text-ok",
  RETURNED_TO_CUSTOMER: "bg-muted/15 text-muted",
};

export default function StatusBadge({ status }: { status: string }) {
  return (
    <span className={`badge ${COLORS[status] ?? "bg-muted/15 text-muted"}`}>
      {status.replaceAll("_", " ")}
    </span>
  );
}

/**
 * DiscrepancyBanner — a single alert/verification banner inside
 * the Financial Comparison Discrepancy section.
 *
 * Props:
 *  discrepancy: { id, type, icon, message }
 *    type: "error" | "success"
 */
export default function DiscrepancyBanner({ discrepancy }) {
  const isError = discrepancy.type === "error";

  const containerClass = isError
    ? "bg-error text-on-error border border-error"
    : "bg-[#009668] text-white border border-[#009668]/20";

  return (
    <div
      className={`${containerClass} rounded-lg p-md flex gap-md items-start shadow-sm`}
    >
      <span
        className="material-symbols-outlined shrink-0"
        style={{ fontVariationSettings: "'FILL' 1" }}
      >
        {discrepancy.icon}
      </span>
      <p className="font-body-md text-body-md font-semibold">
        {discrepancy.message}
      </p>
    </div>
  );
}

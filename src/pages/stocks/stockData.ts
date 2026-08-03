import type { StockReason } from "./stockTypes";

// Daftar reason. Grup pada dropdown ditentukan oleh field `action`.
// Catatan: "Recount" sengaja ada di kedua grup (bisa nambah atau ngurang).
export const STOCK_REASONS: StockReason[] = [
	// Stock in (+)
	{ value: "received_shipment", label: "Received shipment", action: "in" },
	{ value: "returned", label: "Returned", action: "in" },
	{ value: "made_in_workshop", label: "Made in workshop", action: "in" },
	{ value: "recount_in", label: "Recount", action: "in" },
	{ value: "stock_transfer_in", label: "Stock transfer in", action: "in" },
	// Stock out (−)
	{ value: "shipped_to_customer", label: "Shipped to customer", action: "out" },
	{ value: "sold_in_showroom", label: "Sold in showroom", action: "out" },
	{ value: "marketplace_sale", label: "Marketplace sale", action: "out" },
	{ value: "damaged", label: "Damaged", action: "out" },
	{ value: "lost", label: "Lost", action: "out" },
	{ value: "recount_out", label: "Recount", action: "out" },
	{ value: "stock_transfer_out", label: "Stock transfer out", action: "out" },
];

/**
 * Bentuk data untuk Mantine `Select` bergrup:
 * `[{ group: "Stock in (+)", items: [{value,label}, ...] }, ...]`.
 */
export const STOCK_REASON_GROUPS = [
	{
		group: "Stock in (+)",
		items: STOCK_REASONS.filter((r) => r.action === "in").map((r) => ({
			value: r.value,
			label: r.label,
		})),
	},
	{
		group: "Stock out (−)",
		items: STOCK_REASONS.filter((r) => r.action === "out").map((r) => ({
			value: r.value,
			label: r.label,
		})),
	},
];

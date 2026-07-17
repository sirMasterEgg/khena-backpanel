import type { StockActivity, StockReason } from "./stockTypes";

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

// Beberapa entri contoh bersumber "import" supaya empty-state tidak selalu
// tampil dan badge sumber import bisa terlihat.
export const initialActivity: StockActivity[] = [
	{
		id: "act-seed-1",
		source: "import",
		sku: "SOFA-001",
		productName: "Modern Sofa Set",
		change: 5,
		reasonLabel: "Received shipment",
		by: "Admin",
		at: "2026-07-16T09:24:00.000Z",
	},
	{
		id: "act-seed-2",
		source: "import",
		sku: "TABLE-001",
		productName: "Dining Table",
		change: -2,
		reasonLabel: "Marketplace sale",
		by: "Admin",
		at: "2026-07-15T14:10:00.000Z",
	},
	{
		id: "act-seed-3",
		source: "import",
		sku: "LAMP-001",
		productName: "Floor Lamp",
		change: 10,
		reasonLabel: "Stock transfer in",
		by: "Admin",
		at: "2026-07-15T08:00:00.000Z",
	},
];

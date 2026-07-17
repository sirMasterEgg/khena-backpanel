export type StockAction = "in" | "out"; // (+) atau (−)

// Sumber perubahan. Karena scan ditiadakan, hanya 2 sumber yang mungkin.
export type StockSource = "manual" | "import";

export type StockReason = {
	value: string; // key unik, mis. "received_shipment"
	label: string; // teks tampil, mis. "Received shipment"
	action: StockAction; // menentukan grup "Stock in (+)" / "Stock out (−)"
};

export type StockActivity = {
	id: string; // mis. crypto.randomUUID()
	source: StockSource; // "manual" | "import"
	sku: string;
	productName: string;
	change: number; // bertanda: +5 atau -3
	reasonLabel: string;
	by: string; // nama operator, mock: "You" / "Admin"
	at: string; // ISO date-time
};

// Hasil dari handler applyChange terpusat di StocksPage.
export type ApplyResult =
	| { ok: true; productName: string; newStock: number }
	| { ok: false; reason: "not_found" | "negative" };

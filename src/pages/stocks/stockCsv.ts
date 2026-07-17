import { STOCK_REASONS } from "./stockData";
import type { StockAction } from "./stockTypes";

export type ParsedStockRow = {
	sku: string;
	action: StockAction;
	qty: number;
	reason: string;
};

// Kolom wajib (urutan): SKU,Action,Qty,Reason
const CSV_HEADER = "SKU,Action,Qty,Reason";

/** Bangun isi CSV template: header + 1 baris contoh. */
export function buildTemplateCsv(): string {
	return `${CSV_HEADER}\nSOFA-001,in,5,Received shipment`;
}

/**
 * Parse teks CSV menjadi baris-baris terstruktur.
 * Parsing sederhana: split baris, buang header, split koma, trim.
 * Baris kosong / tak lengkap / action tak valid / qty non-positif dilewati.
 */
export function parseStockCsv(text: string): ParsedStockRow[] {
	const lines = text.split("\n");
	const rows: ParsedStockRow[] = [];

	for (let i = 0; i < lines.length; i++) {
		const line = lines[i].trim();
		if (!line) continue;

		const cells = line.split(",").map((c) => c.trim());
		const [rawSku, rawAction, rawQty, rawReason = ""] = cells;

		// Lewati baris header (baik di baris pertama maupun terselip).
		if (rawSku?.toLowerCase() === "sku") continue;

		const action = rawAction?.toLowerCase();
		if (action !== "in" && action !== "out") continue;

		const qty = Number.parseInt(rawQty ?? "", 10);
		if (!rawSku || !Number.isFinite(qty) || qty <= 0) continue;

		// Kalau reason cocok dengan salah satu label STOCK_REASONS pakai itu,
		// kalau tidak simpan apa adanya.
		const matched = STOCK_REASONS.find(
			(r) => r.label.toLowerCase() === rawReason.toLowerCase(),
		);

		rows.push({
			sku: rawSku,
			action,
			qty,
			reason: matched ? matched.label : rawReason,
		});
	}

	return rows;
}

/** Unduh CSV template sebagai file `stock-template.csv`. */
export function downloadTemplateCsv(): void {
	const csv = buildTemplateCsv();
	const blob = new Blob([csv], { type: "text/csv" });
	const url = URL.createObjectURL(blob);
	const a = document.createElement("a");
	a.href = url;
	a.download = "stock-template.csv";
	a.click();
	URL.revokeObjectURL(url);
}

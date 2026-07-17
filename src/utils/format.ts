/** Format angka Rupiah, mis. formatIDR(12450000) → "Rp 12.450.000". */
export function formatIDR(value: number): string {
	return new Intl.NumberFormat("id-ID", {
		style: "currency",
		currency: "IDR",
		maximumFractionDigits: 0,
	}).format(value);
}

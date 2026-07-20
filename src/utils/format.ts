/** Format angka Rupiah, mis. formatIDR(12450000) → "Rp 12.450.000". */
export function formatIDR(value: number): string {
	return new Intl.NumberFormat("id-ID", {
		style: "currency",
		currency: "IDR",
		maximumFractionDigits: 0,
	}).format(value);
}

/**
 * Rupiah ringkas untuk label sumbu grafik supaya tidak melebar & overflow.
 * mis. 4500000 → "Rp 4,5jt", 420000000 → "Rp 420jt", 12000 → "Rp 12rb".
 */
export function formatIDRCompact(value: number): string {
	const opts = { maximumFractionDigits: 1 } as const;
	if (value >= 1_000_000_000) {
		return `Rp ${(value / 1_000_000_000).toLocaleString("id-ID", opts)}m`;
	}
	if (value >= 1_000_000) {
		return `Rp ${(value / 1_000_000).toLocaleString("id-ID", opts)}jt`;
	}
	if (value >= 1_000) {
		return `Rp ${Math.round(value / 1_000).toLocaleString("id-ID")}rb`;
	}
	return `Rp ${value}`;
}

export function titleCase(s: string): string {
	const words = s.split(" ");
	for (let i = 0; i < words.length; i++) {
		words[i] =
			words[i].charAt(0).toUpperCase() + words[i].slice(1).toLowerCase();
	}
	s = words.join(" ");
	return s;
}

export function sentenceCase(s: string): string {
	return s.charAt(0).toUpperCase() + s.slice(1).toLowerCase();
}

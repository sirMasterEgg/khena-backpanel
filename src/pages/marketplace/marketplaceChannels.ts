export type MarketplaceChannel = "tokopedia" | "shopee";

export const MARKETPLACE_CHANNELS: MarketplaceChannel[] = [
	"tokopedia",
	"shopee",
];

export const CHANNEL_META: Record<
	MarketplaceChannel,
	{
		label: string;
		initial: string;
		/** Warna khas kanal, dipakai untuk kotak inisial & badge. */
		color: string;
	}
> = {
	tokopedia: { label: "Tokopedia", initial: "T", color: "#03AC0E" },
	shopee: { label: "Shopee", initial: "S", color: "#EE4D2D" },
};

/**
 * Server mengirim teks bebas ("Shopee", "shopee", "lazada"), dan
 * `channels[].marketplace` di /stats bahkan bisa null. Normalkan dulu.
 */
export function normalizeChannel(value: string | null | undefined): string {
	return (value ?? "").trim().toLowerCase();
}

/** true untuk kanal yang punya kartu & tab sendiri. */
export function isKnownChannel(
	value: string | null | undefined,
): value is MarketplaceChannel {
	return (MARKETPLACE_CHANNELS as string[]).includes(normalizeChannel(value));
}

/** Label tampilan; kanal tak dikenal ditampilkan apa adanya. */
export function channelLabel(value: string | null | undefined): string {
	const key = normalizeChannel(value);
	if (isKnownChannel(key)) return CHANNEL_META[key].label;
	return value?.trim() || "Unknown";
}

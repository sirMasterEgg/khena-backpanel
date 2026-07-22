export const STATUS = [
	{ label: "Published", value: "published" },
	{ label: "Draft", value: "draft" },
] as const;

export const BRAND_COLOR = {
	name: "Brand",
	locked: true,
	colors: [
		{ id: "1", name: "Primary Black", hex: "#121212" },
		{ id: "2", name: "Canvas", hex: "#F9F8F4" },
		{ id: "3", name: "Cream", hex: "#F4EFEA" },
		{ id: "4", name: "Khaki Accent", hex: "#C58A6A" },
	],
} as const;

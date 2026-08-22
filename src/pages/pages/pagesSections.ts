export type PageSection =
	| "landing"
	| "faq"
	| "returns"
	| "shipping"
	| "care"
	| "assembly"
	| "contract";

export const PAGE_SECTIONS: {
	value: PageSection;
	label: string;
	subtitle: string;
}[] = [
	{
		value: "landing",
		label: "Landing Page",
		subtitle:
			"Manage the hero and carousel blocks shown on the storefront home page",
	},
	{
		value: "faq",
		label: "FAQ",
		subtitle: "Manage frequently asked questions and their topic categories",
	},
	{
		value: "returns",
		label: "Returns",
		subtitle: "Manage the questions and answers shown on the returns page",
	},
	{
		value: "shipping",
		label: "shipping",
		subtitle: "Manage the questions and answers shown on the shipping page",
	},
	{
		value: "care",
		label: "Care and Maintenance",
		subtitle:
			"Manage the care and maintenance guidance shown on the storefront",
	},
	{
		value: "assembly",
		label: "Assembly Manuals",
		subtitle: "Upload assembly manual PDFs for each product",
	},
	{
		value: "contract",
		label: "Contract Projects",
		subtitle: "Manage the project list shown on the trade / contract page",
	},
];

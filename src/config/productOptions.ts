export const STATUS_OPTIONS = [
	{ label: "Published", value: "published" },
	{ label: "Draft", value: "draft" },
	{ label: "Scheduled", value: "scheduled" },
	{ label: "Archived", value: "archived" },
] as const;

export const VISIBILITY_OPTIONS = [
	{ value: "visible", label: "Visible" },
	{ value: "hidden", label: "Hidden" },
];

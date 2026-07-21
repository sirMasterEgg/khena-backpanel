import { Checkbox, Stack, Text } from "@mantine/core";

export type FileTypeFilter = "all" | "image" | "video" | "audio" | "document";

interface FileTypePanelProps {
	value: FileTypeFilter;
	onChange: (value: FileTypeFilter) => void;
}

const OPTIONS: { value: FileTypeFilter; label: string }[] = [
	{ value: "all", label: "All" },
	{ value: "image", label: "Image" },
	{ value: "video", label: "Video" },
	{ value: "audio", label: "Audio" },
	{ value: "document", label: "Document" },
];

export function FileTypePanel({ value, onChange }: FileTypePanelProps) {
	return (
		<Stack gap="sm">
			<Text size="xs" fw={600} c="dimmed">
				FILE TYPE
			</Text>
			<Stack gap="xs">
				{OPTIONS.map((option) => (
					<Checkbox
						key={option.value}
						label={option.label}
						checked={value === option.value}
						onChange={() => onChange(option.value)}
					/>
				))}
			</Stack>
		</Stack>
	);
}

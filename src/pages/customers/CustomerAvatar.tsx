import { Avatar } from "@mantine/core";

interface CustomerAvatarProps {
	name: string;
	color?: string;
}

/** Ambil inisial dari nama, mis. "John Doe" → "JD" (maks 2 huruf). */
function getInitials(name: string): string {
	const parts = name.trim().split(/\s+/).filter(Boolean);
	if (parts.length === 0) return "?";
	const initials = parts.slice(0, 2).map((p) => p[0]);
	return initials.join("").toUpperCase();
}

/** Avatar inisial untuk customer. */
export function CustomerAvatar({ name, color }: CustomerAvatarProps) {
	return (
		<Avatar color={color ?? "gray"} radius="xl">
			{getInitials(name)}
		</Avatar>
	);
}

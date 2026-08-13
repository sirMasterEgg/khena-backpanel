import { Box, Group, Stack, Text } from "@mantine/core";
import type { Inquiry } from "@/api/inquiries";
import { CustomerAvatar } from "@/pages/customers/CustomerAvatar";
import { formatInboxTime } from "./format";

interface MessageListItemProps {
	inquiry: Inquiry;
	selected: boolean;
	onClick: () => void;
}

export function MessageListItem({
	inquiry,
	selected,
	onClick,
}: MessageListItemProps) {
	const unread = inquiry.readAt === null;

	return (
		<Group
			wrap="nowrap"
			gap="sm"
			p="sm"
			onClick={onClick}
			bg={selected ? "var(--mantine-color-blue-light)" : undefined}
			style={{ cursor: "pointer" }}
		>
			{/* Titik unread — kalau sudah dibaca, sisakan ruang kosong selebar sama */}
			<Box w={8} style={{ flexShrink: 0 }}>
				{unread && (
					<Box w={8} h={8} bg="blue.6" style={{ borderRadius: "50%" }} />
				)}
			</Box>
			<CustomerAvatar name={inquiry.name} />
			<Stack gap={2} style={{ flex: 1, minWidth: 0 }}>
				<Group justify="space-between" wrap="nowrap">
					<Text fw={unread ? 700 : 500} truncate>
						{inquiry.name}
					</Text>
					<Text size="xs" c="dimmed" style={{ flexShrink: 0 }}>
						{formatInboxTime(inquiry.createdAt)}
					</Text>
				</Group>
				<Text fw={unread ? 700 : 400} size="sm" truncate>
					{inquiry.subject}
				</Text>
				<Text size="sm" c="dimmed" lineClamp={1}>
					{inquiry.message}
				</Text>
			</Stack>
		</Group>
	);
}

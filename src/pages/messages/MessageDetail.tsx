import {
	ActionIcon,
	Anchor,
	Divider,
	Group,
	Loader,
	Stack,
	Text,
	Title,
} from "@mantine/core";
import { IconPaperclip, IconStar, IconTrash } from "@tabler/icons-react";
import type { Inquiry } from "@/api/inquiries";
import { StatusBadge } from "@/components/StatusBadge";
import { CustomerAvatar } from "@/pages/customers/CustomerAvatar";
import { attachmentFileName, formatFullDate } from "./format";
import { ReplyComposer } from "./ReplyComposer";

interface MessageDetailProps {
	inquiry: Inquiry | null;
	canUpdate: boolean;
	canDelete: boolean;
	onStar: (id: string) => void;
	onDelete: (inquiry: Inquiry) => void;
	onSent: (updated: Inquiry) => void;
	starLoading: boolean;
}

/** Urutan status: repliedAt → readAt → belum dibaca. */
function statusFor(inquiry: Inquiry): "replied" | "read" | "unread" {
	if (inquiry.repliedAt) return "replied";
	if (inquiry.readAt) return "read";
	return "unread";
}

export function MessageDetail({
	inquiry,
	canUpdate,
	canDelete,
	onStar,
	onDelete,
	onSent,
	starLoading,
}: MessageDetailProps) {
	if (!inquiry) {
		return (
			<Text c="dimmed" ta="center" p="2rem">
				Select a message to read it
			</Text>
		);
	}

	return (
		<Stack gap="md" p="md">
			<Group justify="space-between" align="flex-start">
				<Stack gap={4}>
					<Title order={4}>{inquiry.subject}</Title>
					<Group gap="xs">
						<StatusBadge status={statusFor(inquiry)} />
						<Text size="sm" c="dimmed">
							{formatFullDate(inquiry.createdAt)}
						</Text>
					</Group>
				</Stack>
				<Group gap="xs">
					{canUpdate &&
						(starLoading ? (
							<Loader size="xs" />
						) : (
							<ActionIcon
								variant="subtle"
								color="yellow"
								onClick={() => onStar(inquiry.id)}
							>
								<IconStar
									size={18}
									fill={inquiry.starredAt ? "currentColor" : "none"}
								/>
							</ActionIcon>
						))}
					{canDelete && (
						<ActionIcon
							variant="subtle"
							color="red"
							onClick={() => onDelete(inquiry)}
						>
							<IconTrash size={18} />
						</ActionIcon>
					)}
				</Group>
			</Group>

			<Divider />
			<Group>
				<CustomerAvatar name={inquiry.name} />
				<Stack gap={0}>
					<Text fw={500}>{inquiry.name}</Text>
					<Text size="sm" c="dimmed">
						{inquiry.email}
					</Text>
					{inquiry.phone && (
						<Text size="sm" c="dimmed">
							{inquiry.phone}
						</Text>
					)}
				</Stack>
			</Group>
			<Divider />

			<Text style={{ whiteSpace: "pre-wrap" }}>{inquiry.message}</Text>

			{inquiry.attachment && (
				<Anchor
					href={inquiry.attachment.url}
					target="_blank"
					rel="noopener noreferrer"
					size="sm"
				>
					<Group gap={4}>
						<IconPaperclip size={14} />
						{attachmentFileName(inquiry.attachment.objectKey)}
					</Group>
				</Anchor>
			)}

			<Divider />
			<ReplyComposer inquiry={inquiry} canUpdate={canUpdate} onSent={onSent} />
		</Stack>
	);
}

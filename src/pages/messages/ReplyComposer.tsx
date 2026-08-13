import { Button, Stack, Text } from "@mantine/core";
import { IconCheck } from "@tabler/icons-react";
import { useMutation } from "@tanstack/react-query";
import { getApiErrorMessage } from "@/api/client";
import { type Inquiry, markInquiryReplied } from "@/api/inquiries";
import { notify } from "@/components/notify";

interface ReplyComposerProps {
	inquiry: Inquiry;
	canUpdate: boolean;
	onSent: (updated: Inquiry) => void;
}

export function ReplyComposer({
	inquiry,
	canUpdate,
	onSent,
}: ReplyComposerProps) {
	const replyMutation = useMutation({
		mutationFn: (id: string) => markInquiryReplied(id),
		onSuccess: (updated) => {
			notify.success("Ditandai sudah dibalas");
			onSent(updated);
		},
		onError: (err) => notify.error(getApiErrorMessage(err)),
	});

	const alreadyReplied = inquiry.repliedAt !== null;

	return (
		<Stack gap="sm">
			<Button
				leftSection={<IconCheck size={16} />}
				onClick={() => replyMutation.mutate(inquiry.id)}
				loading={replyMutation.isPending}
				disabled={!canUpdate || alreadyReplied}
			>
				{alreadyReplied ? "Replied" : "Already replied"}
			</Button>
			<Text size="xs" c="dimmed">
				Balasan dikirim di luar sistem ini (mis. lewat email). Tombol ini
				hanya mencatat kapan pesan ditandai sudah dibalas.
			</Text>
		</Stack>
	);
}

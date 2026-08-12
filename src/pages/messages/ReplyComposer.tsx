import { Button, Group, Stack, Text, Textarea, Tooltip } from "@mantine/core";
import { IconPaperclip, IconSend, IconSparkles } from "@tabler/icons-react";
import { useMutation } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { getApiErrorMessage } from "@/api/client";
import { type Inquiry, markInquiryReplied } from "@/api/inquiries";
import { notify } from "@/components/notify";

interface ReplyComposerProps {
	inquiry: Inquiry;
	canUpdate: boolean;
	onSent: (updated: Inquiry) => void;
}

function draftKey(id: string) {
	return `inquiry-draft:${id}`;
}

export function ReplyComposer({
	inquiry,
	canUpdate,
	onSent,
}: ReplyComposerProps) {
	const [text, setText] = useState("");

	// Muat draft tersimpan tiap kali pesan yang dibuka berganti.
	useEffect(() => {
		setText(localStorage.getItem(draftKey(inquiry.id)) ?? "");
	}, [inquiry.id]);

	const replyMutation = useMutation({
		mutationFn: (id: string) => markInquiryReplied(id),
		onSuccess: (updated) => {
			localStorage.removeItem(draftKey(inquiry.id));
			setText("");
			notify.success("Ditandai sudah dibalas");
			onSent(updated);
		},
		onError: (err) => notify.error(getApiErrorMessage(err)),
	});

	const handleSaveDraft = () => {
		localStorage.setItem(draftKey(inquiry.id), text);
		notify.success("Draft disimpan di browser ini");
	};

	const handleSendReply = () => {
		// Balasan sungguhan dikirim lewat email client admin — sistem hanya
		// mencatat kapan pesan ini dibalas (tidak ada mailer di backend).
		const mailto =
			`mailto:${encodeURIComponent(inquiry.email)}` +
			`?subject=${encodeURIComponent(`Re: ${inquiry.subject}`)}` +
			`&body=${encodeURIComponent(text)}`;
		window.location.href = mailto;
		replyMutation.mutate(inquiry.id);
	};

	const disabled = !canUpdate;

	return (
		<Stack gap="sm">
			<Textarea
				autosize
				minRows={4}
				placeholder={`Reply to ${inquiry.name}…`}
				value={text}
				onChange={(e) => setText(e.currentTarget.value)}
				disabled={disabled}
			/>
			<Group justify="space-between">
				<Group gap="xs">
					{/* data-disabled (bukan `disabled`) supaya Tooltip tetap menerima
					event mouse — tombol beneran `disabled` tidak memicu hover. */}
					<Tooltip label="Lampiran tidak bisa dibawa lewat email client — lampirkan langsung di email Anda.">
						<Button
							variant="default"
							leftSection={<IconPaperclip size={16} />}
							data-disabled
							onClick={(e) => e.preventDefault()}
						>
							Attach files
						</Button>
					</Tooltip>
					<Tooltip label="Coming soon">
						<Button
							variant="default"
							leftSection={<IconSparkles size={16} />}
							data-disabled
							onClick={(e) => e.preventDefault()}
						>
							Draft with AI
						</Button>
					</Tooltip>
				</Group>
				<Group gap="xs">
					<Button
						variant="default"
						onClick={handleSaveDraft}
						disabled={disabled || text.trim().length === 0}
					>
						Save draft
					</Button>
					<Button
						leftSection={<IconSend size={16} />}
						onClick={handleSendReply}
						loading={replyMutation.isPending}
						disabled={disabled || text.trim().length === 0}
					>
						Send reply
					</Button>
				</Group>
			</Group>
			<Text size="xs" c="dimmed">
				Balasan dikirim lewat email client Anda. Sistem hanya mencatat kapan
				pesan ini dibalas.
			</Text>
		</Stack>
	);
}

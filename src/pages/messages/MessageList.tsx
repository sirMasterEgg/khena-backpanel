import { Divider, Group, Loader, ScrollArea, Text } from "@mantine/core";
import { useIntersection } from "@mantine/hooks";
import { useEffect } from "react";
import { getApiErrorMessage } from "@/api/client";
import type { Inquiry } from "@/api/inquiries";
import { MessageListItem } from "./MessageListItem";

interface MessageListProps {
	inquiries: Inquiry[];
	selectedId: string | null;
	onSelect: (inquiry: Inquiry) => void;
	isLoading: boolean;
	isError: boolean;
	error: unknown;
	emptyLabel: string;
	hasNextPage: boolean;
	isFetchingNextPage: boolean;
	onLoadMore: () => void;
}

export function MessageList({
	inquiries,
	selectedId,
	onSelect,
	isLoading,
	isError,
	error,
	emptyLabel,
	hasNextPage,
	isFetchingNextPage,
	onLoadMore,
}: MessageListProps) {
	const { ref, entry } = useIntersection({
		root: null,
		threshold: 0,
	});

	useEffect(() => {
		if (entry?.isIntersecting && hasNextPage && !isFetchingNextPage) {
			onLoadMore();
		}
	}, [entry?.isIntersecting, hasNextPage, isFetchingNextPage, onLoadMore]);

	if (isLoading) {
		return (
			<Group justify="center" p="xl">
				<Loader size="sm" />
			</Group>
		);
	}

	if (isError) {
		return (
			<Text c="red" size="sm" p="md">
				{getApiErrorMessage(error)}
			</Text>
		);
	}

	if (inquiries.length === 0) {
		return (
			<Text c="dimmed" ta="center" p="2rem">
				{emptyLabel}
			</Text>
		);
	}

	return (
		<ScrollArea h={620}>
			{inquiries.map((inquiry, index) => (
				<div key={inquiry.id}>
					<MessageListItem
						inquiry={inquiry}
						selected={inquiry.id === selectedId}
						onClick={() => onSelect(inquiry)}
					/>
					{index < inquiries.length - 1 && <Divider />}
				</div>
			))}
			{/* Sentinel infinite scroll */}
			<div ref={ref} />
			{isFetchingNextPage && (
				<Group justify="center" p="sm">
					<Loader size="xs" />
				</Group>
			)}
		</ScrollArea>
	);
}

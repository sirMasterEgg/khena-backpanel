import {
	Breadcrumbs,
	Button,
	Card,
	Container,
	Grid,
	Tabs,
	Text,
} from "@mantine/core";
import { modals } from "@mantine/modals";
import { IconRefresh } from "@tabler/icons-react";
import {
	useInfiniteQuery,
	useMutation,
	useQuery,
	useQueryClient,
} from "@tanstack/react-query";
import { useEffect } from "react";
import { useLocation, useNavigate, useParams } from "react-router";
import { getApiErrorMessage } from "@/api/client";
import {
	deleteInquiry,
	getInquiry,
	type Inquiry,
	listInquiries,
	markInquiryRead,
	toggleInquiryStar,
} from "@/api/inquiries";
import { notify } from "@/components/notify";
import { PageHeader } from "@/components/PageHeader";
import { useFilterParams } from "@/hooks/useFilterParams";
import { usePageTitle } from "@/hooks/usePageTitle";
import { usePermissions } from "@/hooks/usePermissions";
import { MessageDetail } from "./MessageDetail";
import { MessageList } from "./MessageList";

const PAGE_SIZE = 20;

type MessageTab = "all" | "unread";

export function ContactMessages() {
	usePageTitle("Contact Messages");
	const queryClient = useQueryClient();
	const { can } = usePermissions();
	const navigate = useNavigate();
	const location = useLocation();
	const { id } = useParams();

	const canRead = can("inquiry.read");
	const canUpdate = can("inquiry.update");
	const canDelete = can("inquiry.delete");

	const [filters, setFilters] = useFilterParams({ tab: "all" });
	const tab: MessageTab = filters.tab === "unread" ? "unread" : "all";

	// Simpan objek Inquiry-nya, bukan cuma id — di tab Unread, pesan yang baru
	// ditandai terbaca langsung hilang dari hasil list, jadi panel kanan tidak
	// bisa mengandalkan lookup ke list untuk isinya. Karena URL hanya menyimpan
	// id, detail diambil lewat query terpisah, bukan `inquiries.find(...)`.
	const detailQuery = useQuery({
		queryKey: ["inquiries", "detail", id],
		queryFn: () => getInquiry(id as string),
		enabled: Boolean(id) && canRead,
	});
	const selected = detailQuery.data ?? null;

	useEffect(() => {
		// id di URL sudah dihapus/tidak ada -> jangan tampilkan panel error, balik ke list.
		if (id && detailQuery.isError) {
			navigate("/messages", { replace: true });
		}
	}, [id, detailQuery.isError, navigate]);

	const listQuery = useInfiniteQuery({
		queryKey: ["inquiries", "list", { tab }],
		queryFn: ({ pageParam }) =>
			listInquiries({
				read: tab === "unread" ? false : undefined,
				page: pageParam,
				limit: PAGE_SIZE,
			}),
		initialPageParam: 1,
		getNextPageParam: (lastPage) =>
			lastPage.meta.page < lastPage.meta.totalPages
				? lastPage.meta.page + 1
				: undefined,
		enabled: canRead,
	});
	const inquiries = listQuery.data?.pages.flatMap((p) => p.data) ?? [];

	// Angka jumlah untuk label tab — hanya butuh meta.total, bukan datanya.
	const allCount = useQuery({
		queryKey: ["inquiries", "count", "all"],
		queryFn: () => listInquiries({ limit: 1 }),
		enabled: canRead,
	});
	const unreadCount = useQuery({
		queryKey: ["inquiries", "count", "unread"],
		queryFn: () => listInquiries({ read: false, limit: 1 }),
		enabled: canRead,
	});

	const readMutation = useMutation({
		mutationFn: (id: string) => markInquiryRead(id),
		onSuccess: () => {
			// invalidate ["inquiries"] di bawah ini sudah mencakup ["inquiries", "detail", id].
			queryClient.invalidateQueries({ queryKey: ["inquiries"] });
		},
		onError: (err) => notify.error(getApiErrorMessage(err)),
	});

	const starMutation = useMutation({
		mutationFn: (id: string) => toggleInquiryStar(id),
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ["inquiries"] });
		},
		onError: (err) => notify.error(getApiErrorMessage(err)),
	});

	const deleteMutation = useMutation({
		mutationFn: (id: string) => deleteInquiry(id),
		onSuccess: () => {
			notify.success("Pesan dihapus");
			navigate(`/messages${location.search}`);
			queryClient.invalidateQueries({ queryKey: ["inquiries"] });
		},
		onError: (err) => notify.error(getApiErrorMessage(err)),
	});

	const handleSelect = (inquiry: Inquiry) => {
		navigate(`/messages/${inquiry.id}${location.search}`);
		// Endpoint /read idempoten, tapi jangan panggil kalau sudah terbaca —
		// tidak ada gunanya menembak API tiap kali baris diklik.
		if (inquiry.readAt === null && canUpdate) readMutation.mutate(inquiry.id);
	};

	const confirmDelete = (inquiry: Inquiry) => {
		modals.openConfirmModal({
			title: "Delete message",
			children: (
				<Text size="sm">
					Delete the message from <strong>{inquiry.name}</strong>? The message
					and its attachment will be permanently deleted. This action cannot be
					undone.
				</Text>
			),
			labels: { confirm: "Delete", cancel: "Cancel" },
			confirmProps: { color: "red" },
			onConfirm: () => deleteMutation.mutate(inquiry.id),
		});
	};

	const handleRefresh = () =>
		queryClient.invalidateQueries({ queryKey: ["inquiries"] });

	if (!canRead) {
		return (
			<Container size="xl">
				<Text c="dimmed">You don't have access to contact messages.</Text>
			</Container>
		);
	}

	const allTotal = allCount.data?.meta.total ?? 0;
	const unreadTotal = unreadCount.data?.meta.total ?? 0;

	return (
		<Container size="xl">
			<Breadcrumbs mb="xs" separator="›">
				<Text size="sm" c="dimmed">
					Communication
				</Text>
				<Text size="sm" c="dimmed">
					Contact Messages
				</Text>
			</Breadcrumbs>

			<PageHeader
				title="Contact Messages"
				subtitle="Customer enquiries from your website's contact form."
				actions={
					<Button
						variant="default"
						leftSection={<IconRefresh size={16} />}
						onClick={handleRefresh}
						loading={listQuery.isRefetching}
					>
						Refresh
					</Button>
				}
			/>

			<Tabs
				value={tab}
				onChange={(val) => setFilters({ tab: (val as MessageTab) ?? "all" })}
				mb="md"
			>
				<Tabs.List>
					<Tabs.Tab value="all">All ({allTotal})</Tabs.Tab>
					<Tabs.Tab value="unread">Unread ({unreadTotal})</Tabs.Tab>
				</Tabs.List>
			</Tabs>

			<Grid>
				<Grid.Col span={{ base: 12, md: 5 }}>
					<Card withBorder p={0}>
						<MessageList
							inquiries={inquiries}
							selectedId={selected?.id ?? null}
							onSelect={handleSelect}
							isLoading={listQuery.isLoading}
							isError={listQuery.isError}
							error={listQuery.error}
							emptyLabel={
								tab === "unread" ? "No unread messages" : "No messages yet"
							}
							hasNextPage={listQuery.hasNextPage}
							isFetchingNextPage={listQuery.isFetchingNextPage}
							onLoadMore={() => listQuery.fetchNextPage()}
						/>
					</Card>
				</Grid.Col>
				<Grid.Col span={{ base: 12, md: 7 }}>
					<Card withBorder p={0}>
						<MessageDetail
							inquiry={selected}
							canUpdate={canUpdate}
							canDelete={canDelete}
							onStar={(id) => starMutation.mutate(id)}
							onDelete={confirmDelete}
							onSent={() => {
								queryClient.invalidateQueries({ queryKey: ["inquiries"] });
							}}
							starLoading={starMutation.isPending}
						/>
					</Card>
				</Grid.Col>
			</Grid>
		</Container>
	);
}

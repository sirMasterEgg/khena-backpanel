import {
	Button,
	Center,
	Divider,
	Group,
	Loader,
	Modal,
	ScrollArea,
	Stack,
	Text,
	TextInput,
	UnstyledButton,
} from "@mantine/core";
import { useDebouncedValue } from "@mantine/hooks";
import { IconSearch, IconUserPlus } from "@tabler/icons-react";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { getApiErrorMessage } from "@/api/client";
import { listCustomers } from "@/api/customers";
import { CustomerAvatar } from "./CustomerAvatar";
import { CustomerFormModal } from "./CustomerFormModal";
import type { PickedCustomer } from "./pickedCustomer";

interface CustomerPickerModalProps {
	opened: boolean;
	onClose: () => void;
	onSelect: (customer: PickedCustomer) => void;
}

/** Modal "Select customer": cari via API lalu pilih satu, atau tambah baru. */
export function CustomerPickerModal({
	opened,
	onClose,
	onSelect,
}: CustomerPickerModalProps) {
	const [search, setSearch] = useState("");
	const [debouncedSearch] = useDebouncedValue(search, 300);
	const [formOpened, setFormOpened] = useState(false);

	const { data, isLoading, isError, error } = useQuery({
		queryKey: ["customers", { search: debouncedSearch, limit: 20 }],
		queryFn: () =>
			listCustomers({ search: debouncedSearch || undefined, limit: 20 }),
		enabled: opened,
	});
	const customers = data?.data ?? [];

	const handleSelect = (customer: PickedCustomer) => {
		onSelect(customer);
		onClose();
	};

	return (
		<>
			<Modal opened={opened} onClose={onClose} title="Select customer" centered>
				<Stack gap="md">
					<TextInput
						placeholder="Search customer..."
						leftSection={<IconSearch size={16} />}
						value={search}
						onChange={(e) => setSearch(e.currentTarget.value)}
						data-autofocus
					/>

					<ScrollArea.Autosize mah={320}>
						{isLoading ? (
							<Center py="md">
								<Loader size="sm" />
							</Center>
						) : isError ? (
							<Text c="red" size="sm" ta="center" py="md">
								{getApiErrorMessage(error)}
							</Text>
						) : (
							<Stack gap={4}>
								{customers.length > 0 ? (
									customers.map((c) => (
										<UnstyledButton
											key={c.id}
											onClick={() =>
												handleSelect({
													id: c.id,
													name: c.name,
													phone: c.phone,
													segment: c.segment,
												})
											}
											p="xs"
											style={{
												borderRadius: "var(--mantine-radius-sm)",
												width: "100%",
											}}
										>
											<Group gap="sm" wrap="nowrap">
												<CustomerAvatar name={c.name} />
												<Stack gap={0} style={{ minWidth: 0 }}>
													<Text size="sm" fw={500} lineClamp={1}>
														{c.name}
													</Text>
													<Text size="xs" c="dimmed" lineClamp={1}>
														{c.email}
													</Text>
												</Stack>
											</Group>
										</UnstyledButton>
									))
								) : (
									<Text size="sm" c="dimmed" ta="center" py="md">
										No customers found
									</Text>
								)}
							</Stack>
						)}
					</ScrollArea.Autosize>

					<Divider />

					<Button
						type="button"
						variant="light"
						leftSection={<IconUserPlus size={16} />}
						onClick={() => setFormOpened(true)}
					>
						Add new customer
					</Button>
				</Stack>
			</Modal>

			<CustomerFormModal
				opened={formOpened}
				onClose={() => setFormOpened(false)}
				onSuccess={(created) => {
					// Response POST /customers tidak punya `segment` — biarkan undefined,
					// SegmentBadge akan disembunyikan untuk customer yang baru dibuat.
					handleSelect({
						id: created.id,
						name: created.name,
						phone: created.phone,
					});
				}}
			/>
		</>
	);
}

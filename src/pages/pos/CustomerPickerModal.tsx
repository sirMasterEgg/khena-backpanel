import {
	Button,
	Divider,
	Group,
	ScrollArea,
	Stack,
	Text,
	TextInput,
	UnstyledButton,
} from "@mantine/core";
import { modals } from "@mantine/modals";
import { IconSearch, IconUserPlus } from "@tabler/icons-react";
import { useMemo, useState } from "react";
import { type Customer, dummyCustomers } from "@/data/dummy";
import { openAddCustomerModal } from "@/pages/customers/AddCustomerModal";
import { CustomerAvatar } from "@/pages/customers/CustomerAvatar";

interface CustomerPickerProps {
	onSelect: (customer: Customer) => void;
	/** Buka form "Add new customer". */
	onAddNew: () => void;
}

/** Isi modal picker: cari customer dari dummyCustomers lalu pilih satu. */
function CustomerPicker({ onSelect, onAddNew }: CustomerPickerProps) {
	const [search, setSearch] = useState("");
	// Snapshot dummyCustomers saat modal dibuka (termasuk yang baru ditambah).
	const [customers] = useState<Customer[]>(() => [...dummyCustomers]);

	const results = useMemo(() => {
		const q = search.trim().toLowerCase();
		if (!q) return customers;
		return customers.filter(
			(c) =>
				c.name.toLowerCase().includes(q) ||
				c.email.toLowerCase().includes(q) ||
				(c.phone ?? "").toLowerCase().includes(q),
		);
	}, [customers, search]);

	return (
		<Stack gap="md">
			<TextInput
				placeholder="Search customer..."
				leftSection={<IconSearch size={16} />}
				value={search}
				onChange={(e) => setSearch(e.currentTarget.value)}
				data-autofocus
			/>

			<ScrollArea.Autosize mah={320}>
				<Stack gap={4}>
					{results.length > 0 ? (
						results.map((customer) => (
							<UnstyledButton
								key={customer.id}
								onClick={() => onSelect(customer)}
								p="xs"
								style={{
									borderRadius: "var(--mantine-radius-sm)",
									width: "100%",
								}}
							>
								<Group gap="sm" wrap="nowrap">
									<CustomerAvatar
										name={customer.name}
										color={customer.avatarColor}
									/>
									<Stack gap={0} style={{ minWidth: 0 }}>
										<Text size="sm" fw={500} lineClamp={1}>
											{customer.name}
										</Text>
										<Text size="xs" c="dimmed" lineClamp={1}>
											{customer.email}
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
			</ScrollArea.Autosize>

			<Divider />

			<Button
				variant="light"
				leftSection={<IconUserPlus size={16} />}
				onClick={onAddNew}
			>
				Add new customer
			</Button>
		</Stack>
	);
}

/**
 * Buka modal "Select customer" untuk memilih (atau menambah) customer.
 * `onSelect` dipanggil dengan customer terpilih sebelum modal ditutup.
 */
export function openCustomerPickerModal(
	onSelect: (customer: Customer) => void,
) {
	const id = modals.open({
		title: "Select customer",
		centered: true,
		children: (
			<CustomerPicker
				onSelect={(customer) => {
					onSelect(customer);
					modals.close(id);
				}}
				onAddNew={() => {
					modals.close(id);
					// Pakai ulang form Add customer dari halaman Customers.
					openAddCustomerModal((customer) => {
						dummyCustomers.unshift(customer);
						onSelect(customer);
					});
				}}
			/>
		),
	});
}

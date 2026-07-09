import {
	Button,
	Card,
	Container,
	Group,
	SimpleGrid,
	Stack,
	Text,
} from "@mantine/core";
import { IconArrowLeft } from "@tabler/icons-react";
import { useNavigate, useParams } from "react-router";
import { PageHeader } from "@/components/PageHeader";
import { dummyCustomers } from "@/data/dummy";
import { usePageTitle } from "@/hooks/usePageTitle";
import { CustomerAvatar } from "./CustomerAvatar";
import { formatCurrency, formatDate } from "./format";
import { SegmentBadge } from "./SegmentBadge";

interface FieldProps {
	label: string;
	value: string | number;
}

function Field({ label, value }: FieldProps) {
	return (
		<Stack gap={2}>
			<Text size="xs" c="dimmed" tt="uppercase" fw={500}>
				{label}
			</Text>
			<Text fw={500}>{value}</Text>
		</Stack>
	);
}

export function CustomerDetail() {
	const navigate = useNavigate();
	const { id } = useParams();
	const customer = dummyCustomers.find((c) => String(c.id) === id);

	usePageTitle(customer ? customer.name : "Customer");

	if (!customer) {
		return (
			<Container size="md">
				<PageHeader title="Customer not found" />
				<Button
					variant="default"
					leftSection={<IconArrowLeft size={16} />}
					onClick={() => navigate("/customers")}
				>
					Back to customers
				</Button>
			</Container>
		);
	}

	return (
		<Container size="md">
			<Button
				variant="subtle"
				leftSection={<IconArrowLeft size={16} />}
				onClick={() => navigate("/customers")}
				mb="md"
				px={0}
			>
				Back to customers
			</Button>

			<PageHeader title={customer.name} subtitle={customer.email || "—"} />

			<Card withBorder mb="md">
				<Group>
					<CustomerAvatar name={customer.name} color={customer.avatarColor} />
					<Stack gap={4}>
						<Text fw={600} size="lg">
							{customer.name}
						</Text>
						<SegmentBadge segment={customer.segment} />
					</Stack>
				</Group>
			</Card>

			<Card withBorder>
				<SimpleGrid cols={{ base: 1, sm: 2, md: 3 }} spacing="lg">
					<Field label="Email" value={customer.email || "—"} />
					<Field label="Phone" value={customer.phone || "—"} />
					<Field label="City" value={customer.city || "—"} />
					<Field label="Orders" value={customer.ordersCount} />
					<Field
						label="Lifetime Value"
						value={formatCurrency(customer.lifetimeValue)}
					/>
					<Field label="Last order" value={formatDate(customer.lastOrderAt)} />
					<Field label="Joined" value={formatDate(customer.joinedAt)} />
				</SimpleGrid>
			</Card>
		</Container>
	);
}

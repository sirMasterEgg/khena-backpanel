import {
	ActionIcon,
	Button,
	Card,
	Container,
	Grid,
	Group,
	Menu,
	Progress,
	Stack,
	Table,
	Text,
} from "@mantine/core";
import {
	IconCurrencyDollar,
	IconDots,
	IconEye,
	IconMail,
	IconShoppingCart,
	IconUsers,
} from "@tabler/icons-react";
import { PageHeader } from "@/components/PageHeader";
import { StatTile } from "@/components/StatTile";
import { StatusBadge } from "@/components/StatusBadge";
import { dummyOrders } from "@/data/dummy";
import { usePageTitle } from "@/hooks/usePageTitle";

export function Dashboard() {
	usePageTitle("Dashboard");

	return (
		<Container size="xl" px="0">
			<PageHeader
				title="Good morning, Knox"
				subtitle="Here's what's happening with your store today."
				actions={
					<Menu>
						<Menu.Target>
							<Button variant="light">This Week ▾</Button>
						</Menu.Target>
						<Menu.Dropdown>
							<Menu.Item>This Week</Menu.Item>
							<Menu.Item>This Month</Menu.Item>
							<Menu.Item>This Year</Menu.Item>
						</Menu.Dropdown>
					</Menu>
				}
			/>

			{/* Stats Grid */}
			<Grid gap="md" mb="xl">
				<Grid.Col span={{ base: 12, sm: 6, md: 4, lg: 2.4 }}>
					<StatTile
						icon={<IconCurrencyDollar size={20} />}
						label="Total Revenue"
						value="$12,450"
						delta={18.6}
					/>
				</Grid.Col>
				<Grid.Col span={{ base: 12, sm: 6, md: 4, lg: 2.4 }}>
					<StatTile
						icon={<IconShoppingCart size={20} />}
						label="Orders"
						value="128"
						delta={12.3}
					/>
				</Grid.Col>
				<Grid.Col span={{ base: 12, sm: 6, md: 4, lg: 2.4 }}>
					<StatTile
						icon={<IconUsers size={20} />}
						label="New Customers"
						value="23"
						delta={5.2}
					/>
				</Grid.Col>
				<Grid.Col span={{ base: 12, sm: 6, md: 4, lg: 2.4 }}>
					<StatTile
						icon={<IconEye size={20} />}
						label="Page Views"
						value="4,521"
						delta={22.1}
					/>
				</Grid.Col>
				<Grid.Col span={{ base: 12, sm: 6, md: 4, lg: 2.4 }}>
					<StatTile
						icon={<IconMail size={20} />}
						label="Contact Messages"
						value="5"
						delta={-3.5}
					/>
				</Grid.Col>
			</Grid>

			{/* Main content grid */}
			<Grid gap="md">
				{/* Sales Overview */}
				<Grid.Col span={{ base: 12, md: 8 }}>
					<Card withBorder>
						<Card.Section inheritPadding py="md" pb="lg">
							<Group justify="space-between">
								<Text fw={600}>Sales Overview</Text>
								<Menu>
									<Menu.Target>
										<ActionIcon variant="subtle">
											<IconDots size={16} />
										</ActionIcon>
									</Menu.Target>
									<Menu.Dropdown>
										<Menu.Item>View Details</Menu.Item>
										<Menu.Item>Export</Menu.Item>
									</Menu.Dropdown>
								</Menu>
							</Group>
						</Card.Section>

						<Card.Section inheritPadding pb="md">
							<Stack gap="md">
								{[
									{ label: "Monday", value: 45 },
									{ label: "Tuesday", value: 62 },
									{ label: "Wednesday", value: 58 },
									{ label: "Thursday", value: 75 },
									{ label: "Friday", value: 89 },
									{ label: "Saturday", value: 72 },
									{ label: "Sunday", value: 55 },
								].map((day) => (
									<Stack key={day.label} gap="xs">
										<Group justify="space-between">
											<Text size="sm">{day.label}</Text>
											<Text size="sm" fw={500}>
												${day.value * 100}
											</Text>
										</Group>
										<Progress value={day.value} color="blue" />
									</Stack>
								))}
							</Stack>
						</Card.Section>
					</Card>
				</Grid.Col>

				{/* Quick Actions */}
				<Grid.Col span={{ base: 12, md: 4 }}>
					<Card withBorder>
						<Card.Section inheritPadding py="md" pb="lg">
							<Text fw={600}>Quick Actions</Text>
						</Card.Section>
						<Card.Section inheritPadding pb="md">
							<Stack gap="sm">
								{[
									"Add New Product",
									"Add New Collection",
									"View Orders",
									"Manage Users & Roles",
									"Upload Media",
								].map((action) => (
									<Button
										key={action}
										variant="light"
										fullWidth
										justify="space-between"
									>
										{action}
										<span>→</span>
									</Button>
								))}
							</Stack>
						</Card.Section>
					</Card>
				</Grid.Col>
			</Grid>

			{/* Recent Orders */}
			<Card withBorder mt="md">
				<Card.Section inheritPadding py="md" pb="lg">
					<Group justify="space-between">
						<Text fw={600}>Recent Orders</Text>
						<Text c="blue" size="sm" fw={500} style={{ cursor: "pointer" }}>
							View All
						</Text>
					</Group>
				</Card.Section>
				<Card.Section inheritPadding pb="md">
					<Table striped>
						<Table.Thead>
							<Table.Tr>
								<Table.Th>Order ID</Table.Th>
								<Table.Th>Customer</Table.Th>
								<Table.Th>Status</Table.Th>
								<Table.Th>Total</Table.Th>
								<Table.Th>Date</Table.Th>
								<Table.Th>Action</Table.Th>
							</Table.Tr>
						</Table.Thead>
						<Table.Tbody>
							{dummyOrders.map((order) => (
								<Table.Tr key={order.id}>
									<Table.Td>
										<Text fw={500} size="sm">
											{order.id}
										</Text>
									</Table.Td>
									<Table.Td>{order.customerName}</Table.Td>
									<Table.Td>
										<StatusBadge
											status={
												order.status as "processing" | "shipped" | "pending"
											}
										/>
									</Table.Td>
									<Table.Td>${order.total}</Table.Td>
									<Table.Td>{order.date}</Table.Td>
									<Table.Td>
										<Menu>
											<Menu.Target>
												<ActionIcon size="sm" variant="subtle">
													<IconDots size={14} />
												</ActionIcon>
											</Menu.Target>
											<Menu.Dropdown>
												<Menu.Item>View Details</Menu.Item>
												<Menu.Item>Print Invoice</Menu.Item>
											</Menu.Dropdown>
										</Menu>
									</Table.Td>
								</Table.Tr>
							))}
						</Table.Tbody>
					</Table>
				</Card.Section>
			</Card>
		</Container>
	);
}

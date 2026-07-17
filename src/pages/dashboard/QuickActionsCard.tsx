import {
	Button,
	Card,
	type MantineSpacing,
	SimpleGrid,
	Text,
} from "@mantine/core";
import { IconArrowRight } from "@tabler/icons-react";
import { Link } from "react-router";

const actions: { label: string; to: string }[] = [
	{ label: "Add New Product", to: "/products/new" },
	{ label: "Add New Collection", to: "/collections/new" },
	{ label: "View Orders", to: "/orders" },
	{ label: "Manage Users & Roles", to: "/settings/users" },
	{ label: "Upload Media", to: "/media" },
];

interface QuickActionsCardProps {
	mb?: MantineSpacing;
}

export function QuickActionsCard({ mb }: QuickActionsCardProps) {
	return (
		<Card withBorder mb={mb}>
			<Card.Section inheritPadding py="md">
				<Text fw={600}>Quick Action</Text>
			</Card.Section>

			<Card.Section inheritPadding pb="md">
				<SimpleGrid cols={{ base: 1, xs: 2, sm: 3, md: 5 }} spacing="sm">
					{actions.map((action) => (
						<Button
							key={action.label}
							component={Link}
							to={action.to}
							variant="light"
							fullWidth
							justify="space-between"
							rightSection={<IconArrowRight size={16} />}
						>
							{action.label}
						</Button>
					))}
				</SimpleGrid>
			</Card.Section>
		</Card>
	);
}

import {
	ActionIcon,
	AppShell,
	Avatar,
	Badge,
	Burger,
	Divider,
	Group,
	Indicator,
	Menu,
	NavLink,
	Stack,
	Text,
	Title,
} from "@mantine/core";
import { useDisclosure } from "@mantine/hooks";
import {
	IconBell,
	IconBox,
	IconBriefcase,
	IconChevronDown,
	IconFileText,
	IconFolderOpen,
	IconHome,
	IconList,
	IconListCheck,
	IconLogout,
	IconMail,
	IconPalette,
	IconPercentage,
	IconPhoto,
	IconReceipt,
	IconSend,
	IconSettings,
	IconShoppingCart,
	IconTruck,
	IconUsers,
} from "@tabler/icons-react";
import type { ComponentType, ForwardRefExoticComponent, SVGProps } from "react";
import { Outlet, useLocation, useNavigate } from "react-router";
import "./AppLayout.css";

type IconType =
	| ComponentType<{ size?: number | string }>
	| ForwardRefExoticComponent<
			SVGProps<SVGSVGElement> & {
				size?: number | string;
				title?: string;
				titleId?: string;
			}
	  >;

interface NavItem {
	label: string;
	icon: IconType;
	path: string;
	badge?: string;
}

interface NavSection {
	group: string | null;
	items: NavItem[];
}

export function AppLayout() {
	const navigate = useNavigate();
	const location = useLocation();
	const [mobileOpened, { toggle: toggleMobile }] = useDisclosure();
	const [desktopOpened, { toggle: toggleDesktop }] = useDisclosure(true);

	const isActive = (path: string) => location.pathname === path;

	const navItems: NavSection[] = [
		{
			group: null,
			items: [
				{ label: "Dashboard", icon: IconHome, path: "/" },
				{ label: "Point of Sale", icon: IconShoppingCart, path: "/pos" },
			],
		},
		{
			group: "CONTENT",
			items: [
				{ label: "Products", icon: IconBox, path: "/products" },
				{ label: "Collections", icon: IconFolderOpen, path: "/collections" },
				{ label: "Categories", icon: IconList, path: "/categories" },
				{ label: "Jobs", icon: IconBriefcase, path: "/jobs" },
				{ label: "Applications", icon: IconFileText, path: "/applications" },
				{ label: "Pages", icon: IconFileText, path: "/pages" },
				{ label: "Media Library", icon: IconPhoto, path: "/media" },
				{ label: "Color", icon: IconPalette, path: "/color" },
			],
		},
		{
			group: "SALES",
			items: [
				{ label: "Orders", icon: IconReceipt, path: "/orders", badge: "12" },
				{ label: "Deliveries", icon: IconTruck, path: "/deliveries" },
				{ label: "Customers", icon: IconUsers, path: "/customers" },
				{ label: "Discounts", icon: IconPercentage, path: "/discounts" },
				{ label: "Stocks", icon: IconListCheck, path: "/stocks" },
				{ label: "Purchasing", icon: IconShoppingCart, path: "/purchasing" },
				{ label: "Marketplaces", icon: IconFolderOpen, path: "/marketplaces" },
			],
		},
		{
			group: "COMMUNICATION",
			items: [
				{
					label: "Contact Messages",
					icon: IconMail,
					path: "/messages",
					badge: "5",
				},
				{ label: "Newsletter", icon: IconSend, path: "/newsletter" },
			],
		},
		{
			group: "SETTING",
			items: [
				{ label: "General", icon: IconSettings, path: "/settings/general" },
				{ label: "Payments", icon: IconReceipt, path: "/settings/payments" },
				{
					label: "Integrations",
					icon: IconShoppingCart,
					path: "/settings/integrations",
				},
				{
					label: "Shipping & Returns",
					icon: IconTruck,
					path: "/settings/shipping",
				},
				{ label: "Users & Roles", icon: IconUsers, path: "/settings/users" },
			],
		},
	];

	return (
		<AppShell
			layout="alt"
			header={{ height: 70 }}
			navbar={{
				width: 265,
				breakpoint: "sm",
				collapsed: { mobile: !mobileOpened, desktop: !desktopOpened },
			}}
			padding="md"
			footer={{ height: 30 }}
		>
			<AppShell.Navbar p="md">
				<Stack gap="lg" h="100%">
					{/* Logo */}
					<Title
						order={2}
						display="flex"
						style={{ alignItems: "center" }}
						py="xs"
					>
						KHENA
					</Title>

					{/* Navigation items */}
					<Stack
						gap={0}
						style={{
							flex: 1,
							overflow: "auto",
						}}
					>
						{navItems.map((section) => (
							<Stack
								key={section.group || "primary-nav"}
								gap={0}
								mb={section.group ? "md" : 0}
							>
								{section.group && (
									<Text size="xs" fw={600} c="dimmed" mb="sm" mt="md">
										{section.group}
									</Text>
								)}
								{section.items.map((item: NavItem) => (
									<NavLink
										key={item.path}
										label={item.label}
										leftSection={<item.icon size={18} />}
										rightSection={
											item.badge ? (
												<Badge size="sm" variant="light">
													{item.badge}
												</Badge>
											) : null
										}
										active={isActive(item.path)}
										onClick={() => navigate(item.path)}
										style={{ borderRadius: "8px", marginBottom: "4px" }}
									/>
								))}
							</Stack>
						))}
					</Stack>
				</Stack>
			</AppShell.Navbar>
			<AppShell.Header p="md" display="flex" style={{ alignItems: "center" }}>
				<Group justify="space-between" style={{ flex: 1 }}>
					{/* Sidebar toggle */}
					<Burger
						opened={mobileOpened}
						onClick={toggleMobile}
						hiddenFrom="sm"
						size="sm"
						aria-label="Toggle sidebar"
					/>
					<Burger
						opened={desktopOpened}
						onClick={toggleDesktop}
						visibleFrom="sm"
						size="sm"
						aria-label="Toggle sidebar"
					/>

					<Group gap="lg">
						{/* Notification bell */}
						<Indicator color="red" size={8}>
							<ActionIcon variant="light" size="lg">
								<IconBell size={20} />
							</ActionIcon>
						</Indicator>

						<Divider size="sm" orientation="vertical" />

						{/* User menu */}
						<Menu position="bottom-end">
							<Menu.Target>
								<Group gap="xs" style={{ cursor: "pointer" }}>
									<Avatar size="sm" color="blue">
										A
									</Avatar>
									<Stack gap={0}>
										<Text size="sm" fw={500}>
											Admin
										</Text>
										<Text size="xs" c="dimmed">
											khena@kehna.com &bull; Owner
										</Text>
									</Stack>

									<IconChevronDown size={16} />
								</Group>
							</Menu.Target>
							<Menu.Dropdown>
								<Menu.Label>
									<Text c="black" fw={500} size="sm">
										Admin
									</Text>
									<Text size="xs" c="dimmed">
										khena@kehna.com
									</Text>
									<Text c="black" fw={500} size="sm">
										Admin
									</Text>
								</Menu.Label>
								<Menu.Divider />
								<Menu.Item
									leftSection={<IconLogout size={14} />}
									onClick={() => navigate("/sign-in")}
								>
									Profile
								</Menu.Item>
								<Menu.Item
									leftSection={<IconLogout size={14} />}
									onClick={() => navigate("/sign-in")}
								>
									Users and Roles
								</Menu.Item>
								<Menu.Item
									leftSection={<IconLogout size={14} />}
									onClick={() => navigate("/sign-in")}
								>
									Logout
								</Menu.Item>
							</Menu.Dropdown>
						</Menu>
					</Group>
				</Group>
			</AppShell.Header>
			<AppShell.Main>
				<Outlet />
			</AppShell.Main>

			<AppShell.Footer>
				<Text
					size="xs"
					c="dimmed"
					style={{
						display: "flex",
						alignItems: "center",
						justifyContent: "center",
						height: "100%",
					}}
					ta="center"
				>
					© 2026 Khena Living. All rights reserved.
				</Text>
			</AppShell.Footer>
		</AppShell>
	);
}

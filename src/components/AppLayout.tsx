import {
	ActionIcon,
	AppShell,
	Avatar,
	Badge,
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
	IconChevronLeft,
	IconChevronRight,
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
	IconUser,
	IconUserShield,
	IconUsers,
} from "@tabler/icons-react";
import { useMutation } from "@tanstack/react-query";
import type { ComponentType, ForwardRefExoticComponent, SVGProps } from "react";
import { Outlet, useLocation, useNavigate } from "react-router";
import { logout } from "@/api/auth";
import { queryClient } from "@/config/queryClient";
import { useAuthStore } from "@/stores/authStore";
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

	const admin = useAuthStore((state) => state.admin);

	const logoutMutation = useMutation({
		mutationFn: logout,
		// Logout idempotent: apa pun hasilnya, bersihkan sesi lokal & keluar.
		onSettled: () => {
			useAuthStore.getState().clearAuth();
			queryClient.clear();
			navigate("/sign-in");
		},
	});

	const isActive = (path: string) => location.pathname === path;

	const navItems: NavSection[] = [
		{
			group: null,
			items: [
				{ label: "Dashboard", icon: IconHome, path: "/" },
				{ label: "Point of Sale", icon: IconShoppingCart, path: "/pos" },
				{ label: "Order Sales", icon: IconReceipt, path: "/order-sales" },
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
					<ActionIcon
						variant="subtle"
						color="gray"
						size="lg"
						onClick={toggleMobile}
						hiddenFrom="sm"
						aria-label="Toggle sidebar"
					>
						{mobileOpened ? (
							<IconChevronLeft size={20} />
						) : (
							<IconChevronRight size={20} />
						)}
					</ActionIcon>
					<ActionIcon
						variant="subtle"
						color="gray"
						size="lg"
						onClick={toggleDesktop}
						visibleFrom="sm"
						aria-label="Toggle sidebar"
					>
						{desktopOpened ? (
							<IconChevronLeft size={20} />
						) : (
							<IconChevronRight size={20} />
						)}
					</ActionIcon>

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
										{admin?.name?.charAt(0).toUpperCase() ?? "A"}
									</Avatar>
									<Stack gap={0}>
										<Text size="sm" fw={500}>
											{admin?.name}
										</Text>
										<Text size="xs" c="dimmed">
											{admin?.email} &bull; {admin?.role ?? "-"}
										</Text>
									</Stack>

									<IconChevronDown size={16} />
								</Group>
							</Menu.Target>
							<Menu.Dropdown>
								<Menu.Label>
									<Text c="black" fw={500} size="sm">
										{admin?.name}
									</Text>
									<Text size="xs" c="dimmed">
										{admin?.email}
									</Text>
									<Badge
										leftSection={<IconUserShield size={14} />}
										variant="light"
										mt={6}
									>
										{admin?.role ?? "-"}
									</Badge>
								</Menu.Label>
								<Menu.Divider />
								<Menu.Item leftSection={<IconUser size={14} />}>
									Profile
								</Menu.Item>
								<Menu.Item leftSection={<IconUsers size={14} />}>
									Users and Roles
								</Menu.Item>
								<Menu.Item
									leftSection={<IconLogout size={14} />}
									onClick={() => logoutMutation.mutate()}
									disabled={logoutMutation.isPending}
									color="red"
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

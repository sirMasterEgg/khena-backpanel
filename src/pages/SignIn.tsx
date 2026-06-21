import {
	Box,
	Button,
	Center,
	Checkbox,
	Divider,
	Grid,
	Group,
	PasswordInput,
	Stack,
	Text,
	TextInput,
	Title,
} from "@mantine/core";
import { IconBrandGoogle } from "@tabler/icons-react";
import { useNavigate } from "react-router";

export function SignIn() {
	const navigate = useNavigate();

	const handleSignIn = () => {
		navigate("/");
	};

	return (
		<Box style={{ minHeight: "100vh", display: "flex", alignItems: "center" }}>
			<Grid gap="xl" grow style={{ width: "100%", alignItems: "center" }}>
				{/* Left panel */}
				<Grid.Col span={{ base: 12, sm: 6 }}>
					<Center
						h="100%"
						style={{ background: "linear-gradient(135deg, #4a5568, #2d3748)" }}
					>
						<Stack gap="lg" align="center" c="white">
							<Title order={1} size={48} fw={700}>
								KHENA
							</Title>
							<Text size="xl" fw={500}>
								LIVING
							</Text>
						</Stack>
					</Center>
				</Grid.Col>

				{/* Right panel - Form */}
				<Grid.Col span={{ base: 12, sm: 6 }}>
					<Center h="100%">
						<Stack gap="lg" style={{ width: "100%", maxWidth: "400px" }}>
							<Stack gap="xs">
								<Title order={2}>Welcome Back</Title>
								<Text c="dimmed">
									Sign in to access your KHENA admin panel.
								</Text>
							</Stack>

							<Stack gap="md">
								<TextInput
									label="Email Address"
									placeholder="admin@khena.com"
									type="email"
								/>
								<PasswordInput label="Password" placeholder="Enter password" />

								<Group justify="space-between">
									<Checkbox label="Remember me" />
									<Text
										size="sm"
										c="blue"
										style={{ cursor: "pointer" }}
										fw={500}
									>
										Forgot password?
									</Text>
								</Group>

								<Button fullWidth onClick={handleSignIn}>
									Sign in
								</Button>

								<Divider label="or" />

								<Button
									variant="default"
									fullWidth
									leftSection={<IconBrandGoogle size={18} />}
								>
									Sign in with Google
								</Button>
							</Stack>

							<Text size="xs" c="dimmed" ta="center">
								Secure admin access. Only authorized users.
							</Text>
						</Stack>
					</Center>
				</Grid.Col>
			</Grid>
		</Box>
	);
}

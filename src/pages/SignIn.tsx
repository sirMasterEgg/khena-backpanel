import { zodResolver } from "@hookform/resolvers/zod";
import {
	Box,
	Button,
	Center,
	PasswordInput,
	Stack,
	Text,
	TextInput,
	Title,
} from "@mantine/core";
import { isAxiosError } from "axios";
import { useForm } from "react-hook-form";
import { useNavigate } from "react-router";
import { notify } from "@/components/notify";
import { useLogin } from "@/features/auth/useLogin";
import { type SignInFormData, signInSchema } from "./signInSchema";

export function SignIn() {
	const navigate = useNavigate();
	const loginMutation = useLogin();

	const {
		register,
		handleSubmit,
		formState: { errors },
	} = useForm<SignInFormData>({
		resolver: zodResolver(signInSchema),
		defaultValues: {
			email: "",
			password: "",
		},
	});

	const onSubmit = (data: SignInFormData) => {
		loginMutation.mutate(data, {
			onSuccess: () => navigate("/", { replace: true }),
			onError: (err) => {
				let pesan = "Terjadi kesalahan. Coba lagi nanti.";
				if (isAxiosError(err)) {
					const status = err.response?.status;
					if (status === 400) pesan = "Email atau password salah.";
					else if (status === 422) pesan = "Data yang dimasukkan tidak valid.";
					else if (status === 403)
						pesan = "Sesi keamanan kedaluwarsa, coba lagi.";
				}
				notify.error(pesan);
			},
		});
	};

	return (
		<Box style={{ minHeight: "100vh", display: "flex" }}>
			{/* Left panel */}
			<Center
				style={{
					flex: 1,
					background: "linear-gradient(135deg, #4a5568, #2d3748)",
				}}
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

			{/* Right panel - Form */}
			<Center style={{ flex: 1 }}>
				<Stack gap="lg" style={{ width: "100%", maxWidth: "400px" }}>
					<Stack gap="xs">
						<Title order={2}>Welcome Back</Title>
						<Text c="dimmed">Sign in to access your KHENA admin panel.</Text>
					</Stack>

					<form onSubmit={handleSubmit(onSubmit)}>
						<Stack gap="md">
							<TextInput
								label="Email Address"
								placeholder="admin@khena.com"
								type="email"
								{...register("email")}
								error={errors.email?.message}
							/>
							<PasswordInput
								label="Password"
								placeholder="Enter password"
								{...register("password")}
								error={errors.password?.message}
							/>

							<Button type="submit" fullWidth loading={loginMutation.isPending}>
								Sign in
							</Button>
						</Stack>
					</form>

					<Text size="xs" c="dimmed" ta="center">
						Secure admin access. Only authorized users.
					</Text>
				</Stack>
			</Center>
		</Box>
	);
}

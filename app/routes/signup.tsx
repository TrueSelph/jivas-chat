import {
	Alert,
	Anchor,
	Button,
	Checkbox,
	Container,
	Group,
	Paper,
	PasswordInput,
	Text,
	TextInput,
	Title,
} from "@mantine/core";
import { Link, redirect, useFetcher } from "react-router";
import classes from "~/styles/Auth.module.css";
import type { Route } from "./+types/signup";
import { authenticator, sessionStorage } from "~/auth.server";

export async function action({ request }: Route.ActionArgs) {
	try {
		let user = await authenticator.authenticate("user-pass", request);
		let session = await sessionStorage.getSession(
			request.headers.get("cookie"),
		);
		session.set("user", user);

		// Redirect to the home page after successful login
		return redirect("/chats", {
			headers: {
				"Set-Cookie": await sessionStorage.commitSession(session),
			},
		});
	} catch (error) {
		// Return validation errors or authentication errors
		if (error instanceof Error) {
			return { error: error.message };
		}

		// Re-throw any other errors (including redirects)
		throw error;
	}
}

export async function loader({ request }: Route.LoaderArgs) {
	const session = await sessionStorage.getSession(
		request.headers.get("cookie"),
	);

	const user = session.get("user");

	if (user) throw redirect("/chats");

	return {};
}

export default function SignupPage() {
	const fetcher = useFetcher();

	return (
		<Container size={420} my={40}>
			<Title ta="center" className={classes.title}>
				Create an account
			</Title>

			<Text className={classes.subtitle}>
				Already have an account yet?{" "}
				<Anchor component={Link} to="/login">
					Login
				</Anchor>
			</Text>

			<fetcher.Form method="POST">
				<Paper withBorder shadow="sm" p={22} mt={30} radius="md">
					<TextInput
						label="Email"
						type="email"
						placeholder="user@mail.com"
						name="email"
						required
						radius="md"
					/>
					<PasswordInput
						label="Password"
						placeholder="Your password"
						name="password"
						required
						mt="md"
						radius="md"
					/>

					<input name="_action" value="signup" readOnly hidden />

					<Group justify="space-between" mt="lg">
						<Checkbox label="Remember me" />
						<Anchor component="button" size="sm">
							Forgot password?
						</Anchor>
					</Group>
					<Button
						fullWidth
						mt="xl"
						radius="md"
						type="submit"
						loading={fetcher.state !== "idle"}
					>
						Sign Up
					</Button>

					{fetcher?.data?.error ? (
						<Alert mt="lg" color="red">
							{fetcher?.data?.error}
						</Alert>
					) : null}
				</Paper>
			</fetcher.Form>
		</Container>
	);
}

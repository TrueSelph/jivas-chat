import {
	Button,
	Modal,
	TextInput,
	Stack,
	Fieldset,
	Group,
} from "@mantine/core";
import { useDisclosure } from "@mantine/hooks";
import { cloneElement, useEffect, useState, type ReactNode } from "react";
import { config } from "../utils/config";
import { useMutation, useQueryClient } from "@tanstack/react-query";

export function SettingsModal({ children }: { children: ReactNode }) {
	const [opened, { open, close }] = useDisclosure(false);

	const [value, setValue] = useState("");
	const [host, setHost] = useState(config.defaultHost);
	const [agent, setAgent] = useState(config.defaultAgent);

	const [email, setEmail] = useState("");
	const [password, setPassword] = useState("");

	const queryClient = useQueryClient();

	const loginMutation = useMutation({
		mutationFn: ({ email, password }: { email: string; password: string }) => {
			return fetch(`${host}/user/login`, {
				body: JSON.stringify({
					email,
					password,
				}),
				method: "POST",
				headers: { "Content-Type": "application/json" },
			}).then(
				async (res) =>
					(await res.json()) as {
						user: { id: string; email: string };
						token: string;
					},
			);
		},
		onSuccess: async (data) => {
			localStorage.setItem(
				"settings",
				JSON.stringify({
					jivasHost: host,
					jivasAgent: agent,
					token: data.token,
				}),
			);

			queryClient.invalidateQueries({ queryKey: ["frames"] });
		},
	});

	useEffect(() => {
		const settings = JSON.parse(localStorage.getItem("settings") || "{}");

		if (settings?.jivasHost) {
			setHost(settings.jivasHost);
		}
		if (settings?.jivasAgent) {
			setAgent(settings.jivasAgent);
		}
	}, []);

	return (
		<>
			{cloneElement(children, { onClick: open })}
			<Modal opened={opened} onClose={close} title="Settings" size="lg">
				<Stack>
					<Fieldset legend="Authentication" mb="sm">
						<Stack gap="xs">
							<TextInput
								type="url"
								value={host}
								onChange={(event) => setHost(event.currentTarget.value)}
								label="Jivas Host"
							></TextInput>
							<TextInput
								type="email"
								value={email}
								onChange={(event) => setEmail(event.currentTarget.value)}
								label="Email"
							></TextInput>
							<TextInput
								type="password"
								value={password}
								onChange={(event) => setPassword(event.currentTarget.value)}
								label="Password"
							></TextInput>
							<TextInput
								label="Agent ID"
								value={agent}
								onChange={(event) => setAgent(event.currentTarget.value)}
							></TextInput>
						</Stack>

						<Group justify="end" mt="lg">
							<Button
								type="submit"
								loading={loginMutation.status === "pending"}
								onClick={() => {
									loginMutation.mutate({ email, password });
								}}
							>
								Save
							</Button>
						</Group>
					</Fieldset>
				</Stack>
			</Modal>
		</>
	);
}

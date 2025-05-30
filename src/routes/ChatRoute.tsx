import {
	Box,
	Card,
	Container,
	Flex,
	Group,
	Skeleton,
	Stack,
	Textarea,
	useMantineColorScheme,
	ActionIcon,
	rem,
} from "@mantine/core";
import { useMemo, useState } from "react";
import { MessageItem } from "../components/MessageItem";
import { useChatId } from "../hooks/useChatId";
import { useMutationState, useQuery } from "@tanstack/react-query";
import { ChatInput } from "~/components/ChatInput";

export type Interaction = {
	id: string;
	agent_id: string;
	channel: string;
	utterance: string;
	tokens: number;
	time_stamp: string;
	trail: string[];
	intents: any[]; // Replace 'any' with a more specific type if the structure is known
	functions: Record<string, any>; // Or a more specific type
	directives: string[];
	context_data: Record<string, any>; // Or a more specific type like { new_user?: boolean }
	events: any[]; // Replace 'any' with a more specific type if the structure is known
	response: {
		session_id: string;
		message_type: string; // Consider a union type if known, e.g., "TEXT"
		message: {
			message_type: string; // Consider a union type if known, e.g., "TEXT"
			content: string;
			meta: Record<string, any>; // Or a more specific type
		};
		tokens: number;
	};
	data: Record<string, any>; // Or a more specific type
	closed: boolean;
};

export function ChatRoute() {
	const chatId = useChatId();
	const [streamContent, setStreamContent] = useState("");

	const settings = JSON.parse(localStorage.getItem("settings") || "{}");

	const { data: messages } = useQuery({
		queryKey: ["messages", chatId],
		queryFn: () =>
			fetch(`${settings?.jivasHost}/walker/get_interactions`, {
				method: "POST",
				body: JSON.stringify({
					agent_id: settings?.jivasAgent,
					session_id: chatId,
				}),
				headers: {
					"Content-Type": "application/json",
					Authorization: `Bearer ${settings?.token}`,
				},
			})
				.then(async (res) => await res.json())
				.then((res) => res.reports as Interaction[]),
		enabled: !!chatId && !!settings?.token,
	});

	const streamMutationStates = useMutationState({
		filters: { mutationKey: ["stream", chatId] },
	});

	const lastStreamMutation = useMemo(
		() => streamMutationStates[streamMutationStates?.length - 1],
		[chatId],
	);

	if (!chatId) return null;
	const scheme = useMantineColorScheme();

	return (
		<Box
			pos="relative"
			display={"flex"}
			mih="calc(100vh - 60px)"
			style={{ flexDirection: "column", justifyContent: "space-between" }}
			w="100%"
		>
			<Container pt="xl" w="100%" pb={40}>
				<Stack gap="xs">
					{messages?.map((message) => (
						<>
							<MessageItem
								key={message.id + "-user"}
								message={{
									chatId: chatId,
									content: message.utterance || "",
									createdAt: new Date(),
									role: "user",
									id: "",
								}}
							/>
							<MessageItem
								key={message.id + "-assistant"}
								message={{
									chatId: chatId,
									content: message.response?.message.content || "",
									createdAt: new Date(),
									role: "assistant",
									id: "",
								}}
							/>
						</>
					))}
				</Stack>

				{lastStreamMutation?.status === "pending" &&
				!messages?.[messages?.length - 1]?.id?.startsWith("stream") ? (
					<Card withBorder mt="xs">
						<Skeleton height={8} radius="xl" />
						<Skeleton height={8} mt={6} radius="xl" />
						<Skeleton height={8} mt={6} radius="xl" />
						<Skeleton height={8} mt={6} radius="xl" />
						<Skeleton height={8} mt={6} width="70%" radius="xl" />
					</Card>
				) : null}
			</Container>
			<Box
				py="lg"
				style={(theme) => ({
					position: "sticky",
					bottom: 0,
					left: 0,
					right: 0,
					[`@media (min-width: ${theme.breakpoints.md})`]: {
						left: 300,
					},
					backgroundColor:
						scheme.colorScheme === "dark"
							? theme.colors.dark[8]
							: theme.colors.gray[0],
				})}
			>
				<Container
					w="100%"
					left={0}
					right={0}
					mx="auto"
					style={{ display: "flex", justifyContent: "center" }}
				>
					<Flex gap="sm" justify="center" w="100%">
						<ChatInput chatId={chatId} setStreamContent={setStreamContent} />
						{/* </Show> */}
					</Flex>
				</Container>
			</Box>
		</Box>
	);
}

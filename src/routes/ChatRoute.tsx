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
import { useMemo, useState, type ChangeEvent } from "react";
import { AiOutlineSend } from "react-icons/ai";
import { MessageItem } from "../components/MessageItem";
import { useChatId } from "../hooks/useChatId";
import { streamInteract } from "../utils/openai";
import {
	useMutation,
	useMutationState,
	useQuery,
	useQueryClient,
} from "@tanstack/react-query";
import { useNavigate } from "@tanstack/react-location";

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

export function ChatInput({
	chatId,
	setStreamContent,
}: {
	chatId: string;
	setStreamContent: (content: string) => void;
}) {
	const [content, setContent] = useState("");
	const [contentDraft, setContentDraft] = useState("");
	const [userMsgIndex, setUserMsgIndex] = useState(0);
	const queryClient = useQueryClient();
	const navigate = useNavigate();

	const onContentChange = (event: ChangeEvent<HTMLTextAreaElement>) => {
		const { value } = event.currentTarget;
		setContent(value);
		setContentDraft(value);
		setUserMsgIndex(0);
	};

	const streamMutation = useMutation({
		mutationKey: ["stream", chatId],
		mutationFn: async (data: { chatId: string; content: string }) => {
			setContent("");
			return await streamInteract(
				data.chatId,
				data.content,
				setStreamContent,
				(event) => {
					if (chatId !== event.session_id) {
						queryClient.refetchQueries({ queryKey: ["frames"] });
						navigate({ to: `/chats/${event.session_id}`, replace: true });
					}
				},
				queryClient,
			);
		},
		onSettled: () => {},
		onSuccess: () => {
			// alert("submitted fully");
		},
	});

	// const submit = async () => {
	// 	if (submitting) return;

	// 	if (!chatId) {
	// 		notifications.show({
	// 			title: "Error",
	// 			color: "red",
	// 			message: "chatId is not defined. Please create a chat to get started.",
	// 		});
	// 		return;
	// 	}

	// 	// if (!apiKey) {
	// 	// 	notifications.show({
	// 	// 		title: "Error",
	// 	// 		color: "red",
	// 	// 		message: "OpenAI API Key is not defined. Please set your API Key",
	// 	// 	});
	// 	// 	return;
	// 	// }

	// 	try {
	// 		setSubmitting(true);

	// 		setSubmitting(false);
	// 	} catch (error: any) {
	// 		if (error.toJSON().message === "Network Error") {
	// 			notifications.show({
	// 				title: "Error",
	// 				color: "red",
	// 				message: "No internet connection.",
	// 			});
	// 		}
	// 		const message = error.response?.data?.error?.message;
	// 		if (message) {
	// 			notifications.show({
	// 				title: "Error",
	// 				color: "red",
	// 				message,
	// 			});
	// 		}
	// 	} finally {
	// 		setSubmitting(false);
	// 	}
	// };

	return (
		<>
			<Textarea
				key={chatId}
				flex={1}
				placeholder="Your message here..."
				autosize
				autoFocus
				size="lg"
				radius={"lg"}
				disabled={streamMutation.status === "pending"}
				minRows={1}
				style={{ "--mantine-font-size-lg": rem(16) }}
				maxRows={5}
				value={content}
				onChange={onContentChange}
				onKeyDown={async (event) => {
					if (event.code === "Enter" && !event.shiftKey) {
						event.preventDefault();
						streamMutation.mutate({ chatId, content });
						setUserMsgIndex(0);
					}
					if (event.code === "ArrowUp") {
						// onUserMsgToggle(event);
					}
					if (event.code === "ArrowDown") {
						// onUserMsgToggle(event);
					}
				}}
				rightSectionWidth={"auto"}
				rightSection={
					<Group h="100%" align="end">
						<ActionIcon
							mb="sm"
							mr="lg"
							color="gray"
							h="auto"
							onClick={() => {
								streamMutation.mutate({ chatId, content });
							}}
						>
							<AiOutlineSend />
						</ActionIcon>
					</Group>
				}
			/>
			{/* <Show largerThan="sm" styles={{ display: "none" }}> */}
		</>
	);
}

import {
	Box,
	Card,
	Container,
	Flex,
	Skeleton,
	Stack,
	useMantineColorScheme,
} from "@mantine/core";
import { useEffect, useMemo, useState } from "react";
import { MessageItem } from "../components/MessageItem";
import { useChatId } from "../hooks/useChatId";
import { useMutationState, useQuery } from "@tanstack/react-query";
import { ChatInput } from "~/components/ChatInput";
import type { Route } from "./+types/chats.$chatId";
import type { Frame } from "~/components/Chats";
import { useFetcher, useOutletContext, useRevalidator } from "react-router";
import { Jivas } from "~/utils/jivas.server";
import { sessionStorage } from "~/auth.server";
import { db, eq } from "~/db/db.server";
import { threadsTable, usersTable } from "~/db/schema";

export const meta: Route.MetaFunction = ({ data }) => {
	return [{ title: `${data.thread?.label} | Jivas Chat` }];
};

export async function loader({ request, params }: Route.LoaderArgs) {
	const session = await sessionStorage.getSession(
		request.headers.get("cookie"),
	);
	const user = session.get("user") as { id: string; email: string };
	const [userData] = await db
		.select()
		.from(usersTable)
		.where(eq(usersTable.id, user.id));

	const jivas = new Jivas(user);

	const interactions = await jivas.getInteractions({
		sessionId: params.chatId,
	});

	const [thread] = await db
		.select()
		.from(threadsTable)
		.where(eq(threadsTable.sessionId, params.chatId));

	const avatar = await jivas.getAvatar(
		process.env.JIVAS_AGENT_ID || userData.selectedAgentId || "",
	);

	return {
		interactions,
		thread,
		avatar:
			!avatar?.includes?.("unable") && !!avatar
				? `data:image/png;base64,${avatar}`
				: "",
	};
}

export function action() {
	return {};
}

export default function ChatRoute({ loaderData }: Route.ComponentProps) {
	const chatId = useChatId();
	const [streamContent, setStreamContent] = useState<{
		utterance: string;
		status: "idle" | "pending";
		sessionId: string;
		content: string;
	}>({
		utterance: "",
		status: "idle",
		sessionId: "",
		content: "",
	});

	// const settings = JSON.parse(localStorage.getItem("settings") || "{}");
	const settings = {};

	const streamMutationStates = useMutationState({
		filters: { mutationKey: ["stream", chatId] },
	});

	const lastStreamMutation = useMemo(
		() => streamMutationStates[streamMutationStates?.length - 1],
		[chatId],
	);

	if (!chatId) return null;
	const scheme = useMantineColorScheme();
	// const revalidator = useRevalidator();
	const fetcher = useFetcher();
	const { allInteractions, setAllInteractions } = useOutletContext();

	// const [allInteractions, setAllInteractions] = useState(
	// 	[...(loaderData?.interactions || [])].filter((m) => !!m),
	// );

	useEffect(() => {
		setAllInteractions(loaderData?.interactions?.filter((m) => !!m));

		if (
			!loaderData?.thread?.label ||
			loaderData?.thread?.label === "New chat"
		) {
			const firstInteraction = allInteractions?.[0];
			const simpleLabel =
				firstInteraction?.utterance?.split(" ").slice(0, 5).join(" ") ||
				firstInteraction?.utterance;
			fetcher.submit(
				{
					label: simpleLabel,
					description: "yooo",
					sessionId: chatId,
					_action: "updateFrame",
				},
				{ method: "POST", action: "/chats" },
			);
		}
	}, [loaderData?.interactions]);

	// useEffect(() => {
	// 	if (streamContent.status == "idle" && streamContent.content) {
	// 		setTimeout(() => {
	// 			fetcher.submit({}, { method: "POST" });
	// 			setStreamContent({
	// 				content: "",
	// 				status: "idle",
	// 				sessionId: "",
	// 				utterance: "",
	// 			});
	// 		}, 3000);
	// 		// alert("yo");
	// 		// revalidator.revalidate();
	// 	}
	// }, [streamContent.status]);

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
					{/* {JSON.stringify(allInteractions)} */}
					{allInteractions?.map((message) => (
						<>
							{typeof message === "object" ? (
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
										avatar={loaderData.avatar}
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
							) : null}
						</>
					))}
				</Stack>

				{lastStreamMutation?.status === "pending" &&
				!loaderData.interactions?.[
					loaderData.interactions?.length - 1
				]?.id?.startsWith("stream") ? (
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
						<ChatInput
							chatId={chatId}
							setAllInteractions={setAllInteractions}
						/>
						{/* </Show> */}
					</Flex>
				</Container>
			</Box>
		</Box>
	);
}

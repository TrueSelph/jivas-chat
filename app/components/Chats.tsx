import { Text } from "@mantine/core";
// import { useQuery } from "@triplit/react";
import { useMemo } from "react";
import { useChatId } from "../hooks/useChatId";
import { ChatItem } from "./ChatItem";
import { useLoaderData } from "react-router";

export type Frame = {
	id: string;
	agent_id: string;
	session_id: string;
	label: string;
	variables: { message_window: { count: number; start: string; end: string } };
};

export function Chats({ search }: { search: string }) {
	const chatId = useChatId();
	// const settings = JSON.parse(localStorage.getItem("settings") || "{}");
	const settings = {};

	const { frames: chats } = useLoaderData<{ frames: Frame[] }>();
	// console.log({ chats });
	// const chats = [];

	// const { data: chats } = useQuery({
	// 	queryKey: ["frames"],
	// 	queryFn: () =>
	// 		fetch(`${settings?.jivasHost}/walker/get_frames`, {
	// 			method: "POST",
	// 			body: JSON.stringify({
	// 				agent_id: settings?.jivasAgent,
	// 			}),
	// 			headers: {
	// 				"Content-Type": "application/json",
	// 				Authorization: `Bearer ${settings?.token}`,
	// 			},
	// 		})
	// 			.then(async (res) => await res.json())
	// 			.then((res) => res.reports as Frame[]),
	// 	enabled: !!settings?.token,
	// });

	const filteredChats = useMemo(
		() =>
			(chats ?? []).filter((chat) => {
				if (!search) return true;
				return chat.sessionId.toLowerCase().includes(search);
			}),
		[chats, search],
	);

	// const pinnedChats = useMemo(
	// 	() => filteredChats.filter((chat) => chat.pinned),
	// 	[filteredChats],
	// );
	// const unpinnedChats = useMemo(
	// 	() => filteredChats.filter((chat) => !chat.pinned),
	// 	[filteredChats],
	// );

	return (
		<>
			{/* {pinnedChats?.length > 0 ? (
				<>
					<Text p="xs" fz="xs" fw={700} c="gray" children={"Pinned"} />
					{pinnedChats?.map((chat) => (
						<ChatItem chat={chat} isActive={chatId === chat.id} />
					))}

					{unpinnedChats?.length > 0 ? (
						<Text p="xs" fz="xs" fw={700} c="gray" children={"Unpinned"} />
					) : null}
				</>
			) : null} */}

			{filteredChats?.map((chat) => (
				<ChatItem
					chat={chat}
					key={chat.id}
					isActive={chatId === chat.sessionId}
				/>
			))}
		</>
	);
}

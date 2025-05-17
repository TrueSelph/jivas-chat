import {
	Group,
	Text,
	ThemeIcon,
	UnstyledButton,
	useMantineColorScheme,
} from "@mantine/core";
import { useLiveQuery } from "dexie-react-hooks";
import { db } from "../db";
import { useQuery, useQueryOne } from "@triplit/react";
import { Frame } from "./Chats";

interface MainLinkProps {
	icon: React.ReactNode;
	color: string;
	label: string;
	chat: Frame;
}

export function MainLink({ icon, color, label, chat }: MainLinkProps) {
	// const firstMessage = useLiveQuery(async () => {
	// 	return (await db.messages.orderBy("createdAt").toArray()).filter(
	// 		(m) => m.chatId === chat.id,
	// 	)[0];
	// }, [chat]);
	const { colorScheme } = useMantineColorScheme();

	return (
		<UnstyledButton
			style={(theme) => ({
				// display: "block",
				width: "100%",
				padding: theme.spacing.xs,
				borderRadius: theme.radius.sm,
				color: colorScheme === "dark" ? theme.colors.dark[0] : theme.black,
			})}
		>
			<Group>
				<ThemeIcon color={color} variant="light">
					{icon}
				</ThemeIcon>
				<Text
					size="sm"
					style={{
						textOverflow: "ellipsis",
						whiteSpace: "nowrap",
						overflow: "hidden",
						flex: 1,
						width: 0,
					}}
				>
					{label} <br />
					{/* {firstMessage?.content} */}
				</Text>
			</Group>
		</UnstyledButton>
	);
}

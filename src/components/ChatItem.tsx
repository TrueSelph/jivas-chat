import { ActionIcon, Flex, Menu, useMantineColorScheme } from "@mantine/core";
import {
	IconDotsVertical,
	IconMessages,
	IconPencil,
	IconTrash,
} from "@tabler/icons-react";
import { Link } from "@tanstack/react-location";
import { DeleteChatModal } from "./DeleteChatModal";
import { EditChatModal } from "./EditChatModal";
import { MainLink } from "./MainLink";
import classes from "./ChatItem.module.css";
import { Frame } from "./Chats";

export function ChatItem({
	chat,
	isActive,
}: {
	chat: Frame;
	isActive: boolean;
}) {
	return (
		<Flex
			key={chat.session_id}
			className={`${isActive ? classes.active : undefined} ${classes.root}`}
		>
			<Link to={`/chats/${chat.session_id}`} style={{ flex: 1 }}>
				<MainLink
					icon={<IconMessages size="1rem" />}
					color="blue"
					chat={chat}
					label={chat.label || "New chat"}
				/>
			</Link>
			<Menu shadow="md" width={200} keepMounted>
				<Menu.Target>
					<ActionIcon variant="transparent" style={{ height: "auto" }}>
						<IconDotsVertical size={20} />
					</ActionIcon>
				</Menu.Target>
				<Menu.Dropdown>
					{/* <Menu.Item
						icon={
							chat.pinned ? (
								<IconPinnedOff size="1rem" />
							) : (
								<IconPin size="1rem" />
							)
						}
						onClick={(event) => toggleChatPin(chat.id, event)}
					>
						{chat.pinned ? "Remove pin" : "Pin chat"}
					</Menu.Item> */}
					<EditChatModal chat={chat}>
						<Menu.Item icon={<IconPencil size="1rem" />}>Edit</Menu.Item>
					</EditChatModal>
					<DeleteChatModal chat={chat}>
						<Menu.Item color="red" icon={<IconTrash size="1rem" />}>
							Delete
						</Menu.Item>
					</DeleteChatModal>
				</Menu.Dropdown>
			</Menu>
		</Flex>
	);
}

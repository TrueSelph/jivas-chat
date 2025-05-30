import { ActionIcon, Group, rem, Textarea } from "@mantine/core";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState, type ChangeEvent } from "react";
import { AiOutlineSend } from "react-icons/ai";
import { useFetcher, useNavigate, useRevalidator } from "react-router";
import type { Interaction } from "~/routes/chats.$chatId";
import { streamInteract } from "~/utils/openai";

export function ChatInput({
	chatId,
	setAllInteractions,
}: {
	chatId: string;
	setAllInteractions: React.Dispatch<React.SetStateAction<Interaction[]>>;
	// setStreamContent: (data: {
	// 	status: "idle" | "pending" | "success" | "error";
	// 	sessionId: string;
	// 	content: string;
	// }) => void;
}) {
	const [content, setContent] = useState("");
	const [contentDraft, setContentDraft] = useState("");
	const [userMsgIndex, setUserMsgIndex] = useState(0);
	const queryClient = useQueryClient();
	const navigate = useNavigate();
	const revalidator = useRevalidator();
	const fetcher = useFetcher();

	const onContentChange = (event: ChangeEvent<HTMLTextAreaElement>) => {
		const { value } = event.currentTarget;
		setContent(value);
		setContentDraft(value);
		setUserMsgIndex(0);
	};

	// useEffect(() => {
	// 	if(revalidator.state === "idle") {
	// 		setAllInteractions(loaderData?.interactions)
	// 	}
	// }, [revalidator.state])

	const streamMutation = useMutation({
		mutationKey: ["stream", chatId],
		mutationFn: async (data: { chatId: string; content: string }) => {
			setContent("");
			return await streamInteract(
				data.chatId,
				data.content,
				setAllInteractions,
				() => {
					// revalidator.revalidate();
					fetcher.submit({}, { method: "POST" });
				},
				(event) => {
					// if (chatId !== event.session_id) {
					// 	navigate({ href: `/chats/${event.session_id}` });
					// }
				},
			);
		},
		onSettled: () => {},
		onSuccess: () => {
			// alert("submitted fully");
		},
	});

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

import { ActionIcon, Group, Paper, rem, Textarea } from "@mantine/core";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useEffect, useRef, useState, type ChangeEvent } from "react";
import {
	AiOutlineArrowUp,
	AiOutlinePause,
	AiOutlineSend,
	AiOutlineStop,
} from "react-icons/ai";
import { HiOutlineMicrophone, HiOutlineStop } from "react-icons/hi";
import { useFetcher, useNavigate, useRevalidator } from "react-router";
import type { Interaction } from "~/routes/chats.$chatId";
import { streamInteract } from "~/utils/openai";
import classes from "./ChatInput.module.css";
import { useAudioRecorder } from "react-audio-voice-recorder";
import { AudioVisualizer, LiveAudioVisualizer } from "react-audio-visualize";

function reconstituteRecursive(flatList) {
	const result = {};
	let i = 0;

	while (i < flatList.length) {
		const item = flatList[i];

		if (Array.isArray(item)) {
			// Recursively process nested array
			const nestedResult = reconstituteRecursive(item);
			i++;
			continue;
		}

		if (typeof item === "object" && !Array.isArray(item)) {
			// Merge object into result
			for (const [key, value] of Object.entries(item)) {
				// If value is array, recurse
				result[key] = Array.isArray(value)
					? reconstituteRecursive(value)
					: value;
			}
			i++;
		} else if (typeof item === "string" && i + 1 < flatList.length) {
			const value = flatList[i + 1];
			// If value is an array, recurse
			result[item] = Array.isArray(value)
				? reconstituteRecursive(value)
				: value;
			i += 2;
		} else {
			i++;
		}
	}

	return result;
}

export function ChatInput({
	chatId,
	setAllInteractions,
}: {
	chatId: string;
	setAllInteractions: React.Dispatch<React.SetStateAction<Interaction[]>>;
}) {
	const [isStreaming, setIsStreaming] = useState(false);
	const [content, setContent] = useState("");
	const [contentDraft, setContentDraft] = useState("");
	const [userMsgIndex, setUserMsgIndex] = useState(0);
	const {
		isRecording,
		startRecording,
		stopRecording,
		mediaRecorder,
		recordingBlob,
	} = useAudioRecorder();
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
	//
	const navigate = useNavigate();
	let controller = useRef<AbortController>(new AbortController());

	const streamMutation = useMutation({
		mutationKey: ["stream", chatId],
		mutationFn: async (data: { chatId: string; content: string }) => {
			const abortController = controller?.current;

			if (!abortController) {
				controller.current = new AbortController();
			}

			let sessionId: string = "";
			if (chatId === "create") {
				const formData = new FormData();
				formData.append("noRedirect", "true");
				formData.append("_action", "addFrame");

				const response = await fetch("/chats.data", {
					body: formData,
					method: "POST",
					headers: {
						Accept: "application/json",
					},
				}).then((res) => res.json());

				const formatted = reconstituteRecursive(response) as {
					sessionId: string;
				};

				navigate("/chats/" + formatted.sessionId);

				sessionId = formatted.sessionId;
			}

			setContent("");
			setIsStreaming(true);

			controller.current.signal.addEventListener("abort", () => {
				setIsStreaming(false);

				// revalidate
				fetcher.submit({}, { method: "POST" });
			});

			return await streamInteract(
				sessionId || data.chatId,
				data.content,
				setAllInteractions,
				() => {
					fetcher.submit({}, { method: "POST" });
				},
				(_event) => {},
				controller.current.signal,
			).then((res) => {
				setIsStreaming(false);
				return res;
			});
		},
		onSettled: () => {},
		onSuccess: () => {
			// alert("submitted fully");
		},
	});

	const transcribe = async (blob: Blob) => {
		const formData = new FormData();
		formData.append(
			"file",
			new File([blob], "recording.wav", { type: blob.type }),
		);

		return fetch("/api/transcribe", {
			method: "POST",
			body: formData,
		});
	};

	useEffect(() => {
		if (!recordingBlob) return;

		transcribe(recordingBlob).then(async (res) => {
			console.log({ res });
			const result = (await res.json()) as
				| { success: false }
				| { success: true; transcript: string };

			if (result.success) {
				streamMutation.mutate({ chatId, content: result.transcript });
			}

			return result;
		});
	}, [recordingBlob]);

	return (
		<Paper
			withBorder
			gap="0"
			p="0"
			radius={"lg"}
			w="100%"
			maw="100%"
			size="lg"
			style={{ overflow: "hidden" }}
		>
			{!mediaRecorder ? (
				<Textarea
					key={chatId}
					flex={1}
					variant="transparent"
					placeholder="Your message here..."
					autosize
					autoFocus
					size="lg"
					radius={"lg"}
					disabled={streamMutation.status === "pending"}
					className={classes.input}
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
					// rightSectionWidth={"auto"}
					// rightSection={

					// }
				/>
			) : (
				<LiveAudioVisualizer
					mediaRecorder={mediaRecorder}
					width={1000}
					height={40}
				/>
			)}
			<Group justify="end" px="sm" pb="sm">
				<ActionIcon
					variant={isRecording ? "filled" : "default"}
					color={isRecording ? "red" : "gray"}
					radius="lg"
					size="lg"
					onClick={() => {
						isRecording ? stopRecording() : startRecording();
					}}
				>
					{isRecording ? <AiOutlinePause /> : <HiOutlineMicrophone />}
				</ActionIcon>
				<ActionIcon
					variant="default"
					color="gray"
					radius="lg"
					size="lg"
					onClick={
						isStreaming
							? () => controller.current.abort()
							: () => streamMutation.mutate({ chatId, content })
					}
				>
					{isStreaming ? <AiOutlineStop /> : <AiOutlineArrowUp />}
				</ActionIcon>
			</Group>
			{/* <Show largerThan="sm" styles={{ display: "none" }}> */}
		</Paper>
	);
}

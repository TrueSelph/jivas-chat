import { useParams } from "react-router";

export function useChatId() {
	const params = useParams();
	return params.chatId;
}

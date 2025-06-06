import { redirect, type ActionFunctionArgs } from "react-router";
import { sessionStorage } from "~/auth.server";
import { Jivas } from "~/utils/jivas.server";

export async function action({ request }: ActionFunctionArgs) {
	const session = await sessionStorage.getSession(
		request.headers.get("cookie"),
	);
	const user = session.get("user");

	if (!user) throw redirect("/login");

	const jivas = new Jivas(user);

	const formData = await request.formData();
	const file = formData.get("file") as File;

	const result = await jivas.transcribe({ file });

	console.log({ result });

	return result;
}

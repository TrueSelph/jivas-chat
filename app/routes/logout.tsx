import { redirect } from "react-router";
import type { Route } from "../+types/root";
import { sessionStorage } from "~/auth.server";

export async function loader({ request }: Route.LoaderArgs) {
	const session = await sessionStorage.getSession(
		request.headers.get("cookie"),
	);

	return redirect("/login", {
		headers: { "Set-Cookie": await sessionStorage.destroySession(session) },
	});
}

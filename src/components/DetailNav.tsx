import {
	Link,
	useCanGoBack,
	useNavigate,
	useRouter,
} from "@tanstack/react-router";
import { ArrowLeftIcon, ChevronLeftIcon, ChevronRightIcon } from "lucide-react";
import { Button } from "#/components/ui/button";
import type { Sibling } from "#/hooks/useSiblingNavigation";

/**
 * Goes back in browser history, falling back to the search page when there is
 * nothing to go back to (deep link opened in a fresh tab).
 */
export function BackButton() {
	const router = useRouter();
	const canGoBack = useCanGoBack();
	const navigate = useNavigate();

	return (
		<Button
			variant="ghost"
			size="sm"
			className="-ml-2 text-muted-foreground hover:text-foreground"
			onClick={() => {
				if (canGoBack) {
					router.history.back();
				} else {
					navigate({ to: "/", search: {} });
				}
			}}
		>
			<ArrowLeftIcon className="h-4 w-4" />
			Back
		</Button>
	);
}

interface SiblingNavProps {
	to: "/name/$id" | "/species/$id";
	prev: Sibling | null;
	next: Sibling | null;
	/** What the buttons browse through, e.g. "name" or "species". */
	itemLabel: string;
}

/** Previous/next buttons that wrap around at both ends of the list. */
export function SiblingNav({ to, prev, next, itemLabel }: SiblingNavProps) {
	if (!prev && !next) return null;

	return (
		<nav
			aria-label={`Previous and next ${itemLabel}`}
			className="flex items-center gap-1"
		>
			{prev && (
				<Button
					variant="outline"
					size="icon-sm"
					aria-label={`Previous ${itemLabel}: ${prev.label}`}
					title={prev.label}
					render={<Link to={to} params={{ id: prev.id }} />}
				>
					<ChevronLeftIcon className="h-4 w-4" />
				</Button>
			)}
			{next && (
				<Button
					variant="outline"
					size="icon-sm"
					aria-label={`Next ${itemLabel}: ${next.label}`}
					title={next.label}
					render={<Link to={to} params={{ id: next.id }} />}
				>
					<ChevronRightIcon className="h-4 w-4" />
				</Button>
			)}
		</nav>
	);
}

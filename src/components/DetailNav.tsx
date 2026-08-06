import {
	Link,
	useCanGoBack,
	useNavigate,
	useRouter,
} from "@tanstack/react-router";
import { ArrowLeftIcon, ChevronLeftIcon, ChevronRightIcon } from "lucide-react";
import { Button, buttonVariants } from "#/components/ui/button";
import type { Sibling } from "#/hooks/useSiblingNavigation";

const siblingLinkClass = buttonVariants({
	variant: "outline",
	size: "icon-sm",
});

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
			{/* Real links styled as buttons: these navigate to a URL, so they must
			    keep link semantics (and middle-click / open-in-new-tab). */}
			{prev && (
				<Link
					to={to}
					params={{ id: prev.id }}
					aria-label={`Previous ${itemLabel}: ${prev.label}`}
					title={prev.label}
					className={siblingLinkClass}
				>
					<ChevronLeftIcon className="h-4 w-4" />
				</Link>
			)}
			{next && (
				<Link
					to={to}
					params={{ id: next.id }}
					aria-label={`Next ${itemLabel}: ${next.label}`}
					title={next.label}
					className={siblingLinkClass}
				>
					<ChevronRightIcon className="h-4 w-4" />
				</Link>
			)}
		</nav>
	);
}

import { CheckIcon, CopyIcon, ShareIcon } from "lucide-react";
import { useEffect, useState } from "react";
import { Button } from "#/components/ui/button";

export function ShareActions() {
	const [copied, setCopied] = useState(false);
	/**
	 * Resolved after mount, not during render. `navigator.share` does not exist
	 * on the server, so reading it inline made the prerendered markup differ from
	 * the browser's first render and React threw away the whole hydrated tree
	 * (error #418) on every detail page.
	 */
	const [canShare, setCanShare] = useState(false);
	useEffect(() => {
		setCanShare(typeof navigator !== "undefined" && "share" in navigator);
	}, []);

	const copyLink = async () => {
		await navigator.clipboard.writeText(window.location.href);
		setCopied(true);
		setTimeout(() => setCopied(false), 2000);
	};

	const share = () => {
		navigator.share({
			url: window.location.href,
		});
	};

	return (
		<div className="flex gap-1">
			<Button variant="ghost" size="icon" onClick={copyLink} title="Copy link">
				{copied ? (
					<CheckIcon className="h-4 w-4 text-green-500" />
				) : (
					<CopyIcon className="h-4 w-4" />
				)}
			</Button>
			{canShare && (
				<Button variant="ghost" size="icon" onClick={share} title="Share">
					<ShareIcon className="h-4 w-4" />
				</Button>
			)}
		</div>
	);
}

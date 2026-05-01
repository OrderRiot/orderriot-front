import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";

export default function NotFound() {
  return (
    <div className="container-edge py-32 text-center">
      <div className="font-mono text-xs uppercase tracking-[0.2em] text-muted-foreground">
        Error · 404
      </div>
      <h1 className="font-display text-display-lg mt-4 leading-none">
        Lost the <span className="italic-display">thread.</span>
      </h1>
      <p className="text-muted-foreground mt-6 max-w-md mx-auto">
        The page you're after isn't here. It was either moved, deleted, or
        never existed in the first place.
      </p>
      <Button asChild className="mt-8">
        <Link to="/">Back to home</Link>
      </Button>
    </div>
  );
}

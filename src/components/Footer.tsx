import { Github, ExternalLink } from "lucide-react";

export function Footer() {
  return (
    <footer className="mt-auto border-t bg-background/80 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto px-4 py-6">
        <div className="flex flex-col items-center justify-center gap-4 text-center">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <span>Built with</span>
            <span className="text-ping-pong">❤️</span>
            <span>for the table tennis community</span>
          </div>
          
          <div className="flex items-center gap-2">
            <a
              href="https://github.com/thraizz/tttracker"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-4 py-2 rounded-md bg-primary text-primary-foreground hover:bg-primary/90 transition-colors text-sm font-medium"
            >
              <Github className="h-4 w-4" />
              <span>Star on GitHub</span>
              <ExternalLink className="h-3 w-3" />
            </a>
          </div>
          
          <div className="text-xs text-muted-foreground">
            <p>
              Open source table tennis tournament & MMR tracker •{" "}
              <a
                href="https://github.com/thraizz/tttracker"
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary hover:underline"
              >
                Contribute on GitHub
              </a>
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
}
import { useState, useRef, useEffect, useCallback } from "react";

interface TerminalLine {
  id: number;
  type: "input" | "output" | "error";
  content: string;
}

/**
 * TerminalApp - A simple terminal emulator for VybeOS
 */
export function TerminalApp() {
  const [lines, setLines] = useState<TerminalLine[]>([
    { id: 0, type: "output", content: "Welcome to VybeOS Terminal v1.0.0" },
    { id: 1, type: "output", content: 'Type "help" for available commands.' },
    { id: 2, type: "output", content: "" },
  ]);
  const [currentInput, setCurrentInput] = useState("");
  const [history, setHistory] = useState<string[]>([]);
  const [historyIndex, setHistoryIndex] = useState(-1);
  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const nextId = useRef(3);

  // Auto-scroll to bottom
  useEffect(() => {
    if (containerRef.current) {
      containerRef.current.scrollTop = containerRef.current.scrollHeight;
    }
  }, [lines]);

  // Focus input on click
  const handleContainerClick = useCallback(() => {
    inputRef.current?.focus();
  }, []);

  // Process command
  const processCommand = useCallback((cmd: string) => {
    const trimmed = cmd.trim().toLowerCase();
    const parts = trimmed.split(" ");
    const command = parts[0];
    const args = parts.slice(1);

    switch (command) {
      case "help":
        return [
          "Available commands:",
          "  help          - Show this help message",
          "  clear         - Clear the terminal",
          "  echo <text>   - Print text to terminal",
          "  date          - Show current date and time",
          "  whoami        - Show current user",
          "  pwd           - Print working directory",
          "  ls            - List files (simulated)",
          "  neofetch      - System information",
          "  vybe          - Vybe ecosystem info",
          "  about         - About VybeOS",
          "  exit          - Close terminal (use window controls)",
        ];

      case "clear":
        setLines([]);
        return [];

      case "echo":
        return [args.join(" ") || ""];

      case "date":
        return [new Date().toString()];

      case "whoami":
        return ["vybe-user"];

      case "pwd":
        return ["/home/vybe-user"];

      case "ls":
        return [
          "Documents/  Downloads/  Music/  Pictures/  Videos/",
          ".config/    .local/     Desktop/",
        ];

      case "neofetch":
        return [
          "",
          "  ✨ VybeOS",
          "  ─────────────────────",
          "  OS: VybeOS 1.0.0",
          "  Host: THE VYBER Browser",
          "  Kernel: Vybe Core 0.1.0",
          "  Shell: vybe-shell",
          "  Theme: Cosmic Purple",
          "  Icons: Vybe Icons",
          "  Terminal: VybeOS Terminal",
          "  CPU: AI-Powered",
          "  Memory: Unlimited Cloud",
          "",
        ];

      case "vybe":
        return [
          "",
          "  🌟 Vybe Ecosystem",
          "  ─────────────────────",
          "  • THE VYBER - AI Browser",
          "  • Vyberology - Numerology",
          "  • Lumen Orca - AI Analysis",
          "  • Vybe Player - Music",
          "  • HwinNwin - Coaching",
          "  • Lumynalysis - Insights",
          "",
          "  Visit: thevybe.global",
          "",
        ];

      case "about":
        return [
          "",
          "  VybeOS - The Conscious Operating System",
          "  ─────────────────────────────────────────",
          "  Built with frequency-aligned design principles",
          "  Powered by sacred numbers: 0616, 0626, 224, 369",
          "",
          "  \"Technology with Soul\"",
          "",
        ];

      case "exit":
        return ["Use the window close button to exit."];

      case "":
        return [];

      default:
        return [`vybe-shell: command not found: ${command}`];
    }
  }, []);

  // Handle submit
  const handleSubmit = useCallback(
    (e: React.FormEvent) => {
      e.preventDefault();

      if (!currentInput.trim()) {
        setLines((prev) => [
          ...prev,
          { id: nextId.current++, type: "input", content: "$ " },
        ]);
        return;
      }

      // Add to history
      setHistory((prev) => [...prev, currentInput]);
      setHistoryIndex(-1);

      // Add input line
      setLines((prev) => [
        ...prev,
        { id: nextId.current++, type: "input", content: `$ ${currentInput}` },
      ]);

      // Process command and add output
      const output = processCommand(currentInput);
      output.forEach((line) => {
        setLines((prev) => [
          ...prev,
          {
            id: nextId.current++,
            type: line.startsWith("vybe-shell:") ? "error" : "output",
            content: line,
          },
        ]);
      });

      setCurrentInput("");
    },
    [currentInput, processCommand]
  );

  // Handle key navigation
  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === "ArrowUp") {
        e.preventDefault();
        if (history.length > 0) {
          const newIndex =
            historyIndex === -1
              ? history.length - 1
              : Math.max(0, historyIndex - 1);
          setHistoryIndex(newIndex);
          setCurrentInput(history[newIndex]);
        }
      } else if (e.key === "ArrowDown") {
        e.preventDefault();
        if (historyIndex !== -1) {
          const newIndex = historyIndex + 1;
          if (newIndex >= history.length) {
            setHistoryIndex(-1);
            setCurrentInput("");
          } else {
            setHistoryIndex(newIndex);
            setCurrentInput(history[newIndex]);
          }
        }
      } else if (e.key === "c" && e.ctrlKey) {
        e.preventDefault();
        setLines((prev) => [
          ...prev,
          { id: nextId.current++, type: "input", content: `$ ${currentInput}^C` },
        ]);
        setCurrentInput("");
      } else if (e.key === "l" && e.ctrlKey) {
        e.preventDefault();
        setLines([]);
      }
    },
    [history, historyIndex, currentInput]
  );

  return (
    <div
      ref={containerRef}
      className="h-full overflow-y-auto bg-gray-950 p-4 font-mono text-sm text-green-400"
      onClick={handleContainerClick}
    >
      {/* Lines */}
      {lines.map((line) => (
        <div
          key={line.id}
          className={`whitespace-pre-wrap ${
            line.type === "error" ? "text-red-400" : ""
          }`}
        >
          {line.content}
        </div>
      ))}

      {/* Input line */}
      <form onSubmit={handleSubmit} className="flex items-center">
        <span className="text-cyan-400">$</span>
        <input
          ref={inputRef}
          type="text"
          value={currentInput}
          onChange={(e) => setCurrentInput(e.target.value)}
          onKeyDown={handleKeyDown}
          className="flex-1 bg-transparent pl-2 text-green-400 outline-none caret-green-400"
          autoFocus
          spellCheck={false}
          autoComplete="off"
          autoCapitalize="off"
        />
      </form>
    </div>
  );
}

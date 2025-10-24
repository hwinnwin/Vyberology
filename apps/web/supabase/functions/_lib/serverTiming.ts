export class ServerTimer {
  private spans: string[] = [];

  start(name: string) {
    return { name, startedAt: performance.now() };
  }

  end(handle: { name: string; startedAt: number }) {
    const duration = Math.max(0, performance.now() - handle.startedAt);
    this.spans.push(`${handle.name};dur=${duration.toFixed(1)}`);
  }

  header(): string | undefined {
    return this.spans.length > 0 ? this.spans.join(", ") : undefined;
  }

  apply(headers: Headers) {
    const value = this.header();
    if (!value) return;
    const existing = headers.get("Server-Timing");
    headers.set("Server-Timing", existing ? `${existing}, ${value}` : value);
  }
}

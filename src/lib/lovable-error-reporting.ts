export function reportLovableError(error: unknown, ctx?: Record<string, string>) {
  console.error("[Lovable Error]", ctx, error);
}

// The slice of the Cloudflare Workers runtime API that worker.ts uses. The
// full @cloudflare/workers-types package clashes with @types/node, which
// the rest of the API is checked against.

declare module 'cloudflare:workers' {
  export abstract class DurableObject<Env = unknown> {
    protected ctx: DurableObjectState;
    protected env: Env;
    constructor(ctx: DurableObjectState, env: Env);
    fetch?(request: Request): Response | Promise<Response>;
  }
}

interface SqlStorage {
  exec<T = Record<string, unknown>>(query: string, ...bindings: unknown[]): Iterable<T> & { toArray(): T[] };
}

interface DurableObjectState {
  storage: { sql: SqlStorage };
}

interface DurableObjectStub {
  fetch(request: Request): Promise<Response>;
}

interface DurableObjectNamespace<_T = unknown> {
  idFromName(name: string): unknown;
  get(id: unknown): DurableObjectStub;
}

interface Fetcher {
  fetch(request: Request): Promise<Response>;
}

interface ExportedHandler<Env> {
  fetch(request: Request, env: Env): Response | Promise<Response>;
}

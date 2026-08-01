import { vi } from 'vitest';

type Validator = (input: unknown) => unknown;

const serverFnBuilder = vi.hoisted(() => {
  const builder: any = {
    middleware: () => builder,
    validator: (validate: Validator) => ({
      handler: (fn: any) => (opts: any) => fn({ data: validate(opts?.data ?? opts) }),
    }),
    inputValidator: (validate: Validator) => ({
      handler: (fn: any) => (opts: any) => fn({ data: validate(opts?.data ?? opts) }),
    }),
    handler: (fn: any) => (opts: any) => fn({ data: opts?.data ?? opts }),
  };
  return builder;
});

vi.mock('@tanstack/react-start', async (importOriginal) => {
  const original = await importOriginal<typeof import('@tanstack/react-start')>();
  return {
    ...original,
    createServerFn: vi.fn(() => serverFnBuilder),
  };
});

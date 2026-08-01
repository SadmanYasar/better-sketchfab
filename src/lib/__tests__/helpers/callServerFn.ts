type AnyServerFn = unknown;

export async function callServerFn<Data, Result>(fn: AnyServerFn, data: Data): Promise<Result> {
  return (fn as (input: Data) => Promise<Result>)(data);
}

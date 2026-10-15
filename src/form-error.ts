import { Option, Schema } from "effect";

const readStringError = Schema.decodeUnknownOption(Schema.String);
const readIssueError = Schema.decodeUnknownOption(
  Schema.Struct({ message: Schema.String }),
);

/** First readable TanStack string error or Standard Schema issue. */
export function fieldError(meta: {
  errors: readonly unknown[];
}): string | undefined {
  for (const error of meta.errors) {
    const message = Option.getOrUndefined(
      Option.orElse(
        Option.map(readIssueError(error), (issue) => issue.message),
        () => readStringError(error),
      ),
    );
    if (message !== undefined && message.length > 0) return message;
  }
  return undefined;
}

/** Effect's maintained Standard Schema adapter, including nested issue paths. */
export const effectValidator = Schema.toStandardSchemaV1;

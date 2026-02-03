/**
 * Utility types for TypeScript.
 */

/**
 * Expands object types for better IntelliSense display.
 */
export type Prettify<T> = {
  [K in keyof T]: T[K];
} & {};

/**
 * Creates a branded type for nominal typing.
 * Prevents accidental mixing of structurally identical types.
 */
export type Brand<T, TBrand extends string> = T & { readonly __brand: TBrand };

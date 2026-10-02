import type { IntrospectionQuery } from 'graphql';

import introspection from './generated/schema.introspection.json';

/**
 * The API schema as introspection JSON, written by codegen from the running
 * API. A separate entry point (not exported from the main index) so only
 * tests that validate runtime-built variables load it - it isn't bundled
 * into the app.
 */
export const schemaIntrospection =
  introspection as unknown as IntrospectionQuery;

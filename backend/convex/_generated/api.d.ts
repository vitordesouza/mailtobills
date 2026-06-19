/* eslint-disable */
/**
 * Generated `api` utility.
 *
 * THIS CODE IS AUTOMATICALLY GENERATED.
 *
 * To regenerate, run `npx convex dev`.
 * @module
 */

import type * as auth from "../auth.js";
import type * as crons from "../crons.js";
import type * as email_index from "../email/index.js";
import type * as email_resendAdapter from "../email/resendAdapter.js";
import type * as email_templates from "../email/templates.js";
import type * as email_types from "../email/types.js";
import type * as expenseDocuments from "../expenseDocuments.js";
import type * as exports from "../exports.js";
import type * as http from "../http.js";
import type * as lib_accountantExport from "../lib/accountantExport.js";
import type * as lib_accountantExportArchive from "../lib/accountantExportArchive.js";
import type * as lib_accountantExportDelivery from "../lib/accountantExportDelivery.js";
import type * as lib_collectedExpenseDocumentWriter from "../lib/collectedExpenseDocumentWriter.js";
import type * as lib_ingestNormalization from "../lib/ingestNormalization.js";
import type * as lib_requirePro from "../lib/requirePro.js";
import type * as subscriptions from "../subscriptions.js";
import type * as users from "../users.js";

import type {
  ApiFromModules,
  FilterApi,
  FunctionReference,
} from "convex/server";

declare const fullApi: ApiFromModules<{
  auth: typeof auth;
  crons: typeof crons;
  "email/index": typeof email_index;
  "email/resendAdapter": typeof email_resendAdapter;
  "email/templates": typeof email_templates;
  "email/types": typeof email_types;
  expenseDocuments: typeof expenseDocuments;
  exports: typeof exports;
  http: typeof http;
  "lib/accountantExport": typeof lib_accountantExport;
  "lib/accountantExportArchive": typeof lib_accountantExportArchive;
  "lib/accountantExportDelivery": typeof lib_accountantExportDelivery;
  "lib/collectedExpenseDocumentWriter": typeof lib_collectedExpenseDocumentWriter;
  "lib/ingestNormalization": typeof lib_ingestNormalization;
  "lib/requirePro": typeof lib_requirePro;
  subscriptions: typeof subscriptions;
  users: typeof users;
}>;

/**
 * A utility for referencing Convex functions in your app's public API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = api.myModule.myFunction;
 * ```
 */
export declare const api: FilterApi<
  typeof fullApi,
  FunctionReference<any, "public">
>;

/**
 * A utility for referencing Convex functions in your app's internal API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = internal.myModule.myFunction;
 * ```
 */
export declare const internal: FilterApi<
  typeof fullApi,
  FunctionReference<any, "internal">
>;

export declare const components: {};

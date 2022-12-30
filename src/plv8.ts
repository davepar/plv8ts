// Disable two eslint rules that cause problems with the dummy functions below.
/* eslint-disable @typescript-eslint/no-explicit-any,@typescript-eslint/no-unused-vars */

// Constants for plv8.elog()
export const DEBUG5 = 'DEBUG5';
export const DEBUG4 = 'DEBUG4';
export const DEBUG3 = 'DEBUG3';
export const DEBUG2 = 'DEBUG2';
export const DEBUG1 = 'DEBUG1';
export const LOG = 'LOG';
export const INFO = 'INFO';
export const NOTICE = 'NOTICE';
export const WARNING = 'WARNING';
export const ERROR = 'ERROR';

// Types supported by plv8
export type oid = number;
export type bool = boolean;
export type int3 = number;
export type int4 = number;
export type int8 = number;
export type float4 = number;
export type float8 = number;
export type numeric = number;
export type date = Date;
export type timestamp = number;
export type timestamptz = number;
export type bytea = Buffer;
export type json = any;
export type jsonb = any;
export type anyelement = any;
export type anyarray = any[];

// plv8 array types
export type plv8_int2array = int2[];
export type plv8_int4array = int4[];
export type plv8_float4array = float4[];
export type plv8_float8array = float8[];

// Some other common Postgres types
export type int2 = number;
export type smallint = int2;
export type integer = int4;
export type real = float4;
export type text = string;
export type varchar = string;
export type uuid = string;

// Use "int8" instead of "bigint". JS already defines bigint.
// Use "float8" instead of "double precision". JS doesn't allow two word types.

// Special return type to indicate the function is a trigger
export type trigger<T> = T | void;

// Special values for trigger functions.
export let TG_NAME: string;
export let TG_WHEN: string;
export let TG_LEVEL: string;
export let TG_OP: string;
export let TG_RELID: number;
export let TG_TABLE_NAME: string;
export let TG_TABLE_SCHEMA: string;
export let TG_ARGV: string[];

// Used by plv8.prepare()
export type PreparedPlan<RetType> = {
  execute: (args?: any[]) => RetType[];
  // TODO: add cursor()
  free: () => void;
};

// Faked functions that do nothing
export const plv8 = {
  find_function: <T>(fn_name: string): T => {
    return null as unknown as T;
  },
  execute: <RetType>(sql: string, args?: any[]): RetType[] => {
    return [];
  },
  prepare: <RetType>(sql: string, args?: string[]): PreparedPlan<RetType> => {
    return {
      execute: (args?: any[]): RetType[] => {
        return [] as RetType[];
      },
      free: (): void => {},
    };
  },
  elog: (
    level: string,
    msg: string,
    ...more_msg: (string | string[])[]
  ): void => {
    // do nothing
  },
  // TODO: add subtransaction() and get_window_object()
};

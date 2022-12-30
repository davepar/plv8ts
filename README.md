# PLV8 Typescript

This project converts Typescript functions into
[PostgreSQL](https://www.postgresql.org/) database
[PLV8](https://plv8.github.io/) functions.

## Description

Write PLV8 functions (including trigger functions) in Typescript and enjoy
editor support, type checking, linting, and prettier. Following the steps below
will set up the compiler and a post processing script to emit SQL that can be
executed with `\i` from the psql command line.

## Limitations

* No support for including external packages.

## Quick start

To quickly try it out, copy the contents of the [example directory](example) to
a fresh directory. Then:

    npm install
    npm run build

The SQL files will be in the `sql` subdirectory. To add drop statements before
each `create function` statement, use `npm run build -- -d`

If you create your own package from scratch, you'll need at least the first 2
compiler options from the [example Typescript config](example/tsconfig.json)
(`module` and `moduleResolution`), plus `"declaration": true` (which is in
tsconfig-google.json).

## Writing functions

Add Typescript functions to the `src` directory, one function per file. Use the
type names from the 'plv8ts' package to define parameters and return types. Be
sure to export the function with `export function`. This trivial example:

    export function add2(val: int8): smallint {
      return val + 2;
    }

will produce this result:

    create or replace function add2(val int8)
    returns smallint AS $$
      return val + 2;
    $$ language plv8;

To define functions in a schema (other than the default "public") create a
subdirectory in `src`. [This example](example/src/private/sample_send_email.ts)
will be defined in the `private` schema.

## Calling PLV8 functions

To call functions defined by PLV8 add:

    import {plv8} from 'plv8ts';

and use the functions that it defines. That will enable the Typescript compiler
to do type checking. Some of those functions are generics that allow adding a
type that will improve the type checking. For example, this code calls
`execute` with an object type:

    const value_rows = plv8.execute<{value: string}>(
      "select value from private.keys where key = 'EMAIL_TEMPLATE_PROMOTE_ATTENDEE'");
    // Use value_rows[0].value

More examples in the [function sample](example/src/sample_function.ts).

## Trigger functions

To write a trigger function, return `trigger<MyTableRow>` where MyTableRow
defines the type of the row for the trigger. You can also add a NEW parameter
for insert and update triggers, and OLD for update and delete triggers.

    export function sample_trigger(
      NEW: MyTableRow,
      OLD: MyTableRow
    ): trigger<MyTableRow> { ... }

See [sample trigger](example/src/sample_trigger.ts) for more details.

## Function options

To add `security definer`, `immutable`, or `stable` to the function definition,
add a comment in the function that starts with `plv8:`. For example:

    // plv8: security definer, immutable

## Lint

The example inclues
[Google Typescript Style](https://www.npmjs.com/package/gts),
which provides a linter, a prettier auto-formatter, and strict code checking by
default. This is useful for catching errors before using a function in your
Postgres database.

## Testing

The [example Jasmine test](example/src/spec/sample_function.spec.ts) shows how
to write a local test for a PLV8 function. Any data returned from
`plv8.execute()` and other PLV8 functions will need to be faked. Run tests
with:

    npm test

## Tech details

The example [Typescript config](example/tsconfig.json) is currently using a
target of `es2015` and a moduleResolution of `node`. These were found through
experimentation to produce the best output, i.e. the Javascript output is still
readable. `es2015` also seems to be the Javascript version supported by the
current version of PLV8 (as of December 2022). The PLV8 documentation doesn't
directly mention which ECMAScript version it supports.

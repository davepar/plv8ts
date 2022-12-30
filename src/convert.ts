#!/usr/bin/env node

import * as fs from 'fs';
import * as path from 'path';
import yargs from 'yargs';

//* Get parameters and return type from type definition file.
function getTypes(filePath: string): {
  funcName: string;
  params: string;
  returnType: string;
} {
  if (!fs.existsSync(filePath + '.d.ts')) {
    throw `Could not find type file for "${filePath}".`;
  }
  const typeContents = fs
    .readFileSync(filePath + '.d.ts', {encoding: 'utf-8'})
    .split('\n');
  const functionLine = typeContents.filter(line =>
    line.includes('declare function')
  )[0];
  if (!functionLine) {
    throw 'Could not find declare function. Did you export the function?';
  }

  const matches = functionLine.match(/function (\w+)\((.*)\): (\w+)/);
  if (matches === null) {
    throw 'Could not parse the type info for function:' + functionLine;
  }
  const funcName = matches[1];
  let params = matches[2].replace(/:/g, '');
  let returnType = matches[3];

  if (returnType === 'trigger') {
    params = '';
    returnType = 'trigger';
  }

  return {funcName, params, returnType};
}

function convertOptions(lines: string[]): string {
  const options = [
    'immutable',
    'stable',
    'volatile',
    'security definer',
    'security invoker',
  ];
  if (!lines || lines.length === 0) {
    return '';
  }
  const foundOptions = options.filter(option => lines[0].includes(option));
  return ' ' + foundOptions.join(' ');
}

function getFileContents(filePath: string): {
  fileContents: string[];
  options: string;
} {
  let fileContents = fs
    .readFileSync(filePath + '.js', {encoding: 'utf-8'})
    .split('\n');
  const optionsLine = fileContents.filter(line => line.includes('plv8:'));
  const options = convertOptions(optionsLine);
  // Grab just the function body
  const funcLineNum = fileContents.findIndex(line =>
    line.includes('export function')
  );
  if (funcLineNum < 0) {
    throw `${filePath}.js does not have an "export function" statement.`;
  }
  fileContents = fileContents.slice(
    funcLineNum + 1,
    fileContents.lastIndexOf('}')
  );
  return {fileContents, options};
}

function convertFile(
  jsDir: string,
  sqlDir: string,
  schemaDir: string,
  filename: string,
  addDrop: boolean
): void {
  // Remove .js extension
  filename = filename.slice(0, -3);
  console.log(`Converting ${filename}`);

  const filePath = path.join(jsDir, schemaDir, filename);
  const {funcName, params, returnType} = getTypes(filePath);
  const {fileContents, options} = getFileContents(filePath);

  // Add plpgsql create function wrapper
  const schemaName = schemaDir ? schemaDir + '.' : '';
  fileContents.unshift(`returns ${returnType} AS $$`);
  fileContents.unshift(
    `create or replace function ${schemaName}${funcName}(${params})`
  );
  if (addDrop) {
    fileContents.unshift(
      `drop function if exists ${schemaName}${funcName}(${params});`
    );
  }
  fileContents.push(`$$ language plv8${options};`);

  const sqlPath = path.join(sqlDir, schemaDir);
  if (!fs.existsSync(sqlPath)) {
    fs.mkdirSync(sqlPath, {recursive: true});
  }
  fs.writeFileSync(
    path.join(sqlPath, filename) + '.sql',
    fileContents.join('\n') + '\n',
    {
      encoding: 'utf-8',
    }
  );
}

const handler = (jsDir: string, sqlDir: string, addDrop: boolean): void => {
  try {
    if (!fs.existsSync(jsDir)) {
      throw `Javascript directory "${jsDir}" not found.`;
    }
    const jsStat = fs.statSync(jsDir);
    if (!jsStat || !jsStat.isDirectory()) {
      throw `Javascript directory "${jsDir}" not found.`;
    }
    // Look for source files in the javascript directory and one directory level lower
    const rootFiles = fs.readdirSync(jsDir);
    let fileCount = 0;
    for (const rootFile of rootFiles) {
      if (rootFile === 'spec') {
        continue;
      }
      const jsPath = path.join(jsDir, rootFile);
      const stat = fs.statSync(jsPath);
      if (stat && stat.isDirectory()) {
        const schemaFiles = fs.readdirSync(jsPath);
        for (const schemaFile of schemaFiles) {
          if (schemaFile.endsWith('.js')) {
            convertFile(jsDir, sqlDir, rootFile, schemaFile, addDrop);
            fileCount++;
          }
        }
      } else if (rootFile.endsWith('.js')) {
        convertFile(jsDir, sqlDir, '', rootFile, addDrop);
        fileCount++;
      }
    }
    if (fileCount === 0) {
      throw `No Javascript files found in directory "${jsDir}".`;
    }
  } catch (err) {
    console.error(err);
  }
};

yargs
  .usage(
    '$0 [jsdir [sqldir]] [-d]',
    'Converts Javascript functions to SQL create function statements.',
    yargs =>
      yargs
        .positional('jsdir', {
          desc: 'Directory containing javascript code',
          type: 'string',
          default: 'build',
        })
        .positional('sqldir', {
          desc: 'Directory for result SQL statements',
          type: 'string',
          default: 'sql',
        })
        .option('d', {
          desc: 'Add drop statements',
          type: 'boolean',
          alias: 'drop',
          default: false,
        })
        .alias('h', 'help'),
    argv => handler(argv.jsdir, argv.sqldir, argv.d)
  )
  .help().argv;

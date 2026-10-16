#!/usr/bin/env node
// Build a sorted list of files that this release may own in Bluehost's public root.
import { readdir, readFile, lstat } from 'node:fs/promises';
import path from 'node:path';

const root = path.resolve(process.argv[2] ?? 'website/dist');
const protectedTop = new Set(['dev', 'wordpress', 'cgi-bin', 'wp-admin', 'wp-content', 'wp-includes']);
const files = [];

async function visit(relative = '') {
  const entries = await readdir(path.join(root, relative), { withFileTypes: true });
  for (const entry of entries) {
    const next = relative ? `${relative}/${entry.name}` : entry.name;
    const top = next.split('/')[0];
    if (entry.name.startsWith('.') || protectedTop.has(top) || top.startsWith('wp-')) {
      throw new Error(`Build contains a protected path: ${next}`);
    }
    if (!/^[A-Za-z0-9_./-]+$/.test(next) || next.split('/').includes('..')) {
      throw new Error(`Unsafe build path: ${next}`);
    }
    const stat = await lstat(path.join(root, next));
    if (stat.isSymbolicLink()) throw new Error(`Symlink in build: ${next}`);
    if (stat.isDirectory()) await visit(next);
    else if (stat.isFile()) files.push(next);
    else throw new Error(`Unsupported build entry: ${next}`);
  }
}

await visit();
if (!files.includes('index.html')) throw new Error('Build has no index.html');
const home = await readFile(path.join(root, 'index.html'), 'utf8');
if (/noindex/i.test(home)) throw new Error('Home page is marked noindex');
if (!/https:\/\/adhesaplate\.com\//.test(home)) throw new Error('Home page lacks production URL');
files.sort();
process.stdout.write(`${files.join('\n')}\n`);

import fs from 'node:fs/promises';
import path from 'node:path';

const __dirname = path.dirname(process.argv[1]);

import dotenv from 'dotenv';
dotenv.config({ path: path.join(__dirname, '.env'), override: false });

process.env.public_key = await fs.readFile(path.join(__dirname, 'public.test.key'))
	.then(buffer => buffer.toString())
	.then(key => key.replace(/\n/g, '\\n'));

process.env.private_key = await fs.readFile(path.join(__dirname, 'private.test.key'))
	.then(buffer => buffer.toString())
	.then(key => key.replace(/\n/g, '\\n'));

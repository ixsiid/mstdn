import path from 'node:path';
const script_directory = path.dirname(process.argv[1]);

import dotenv from 'dotenv';
dotenv.config({ path: path.join(script_directory, '.env'), override: true });

// Dynamo DB localのエンドポイントが
// ローカル実行時は http://localhost:8000
// GitHub Actionsでは http://dynamodb:8000
// と、異なるので、単純に上書きしてはならない。

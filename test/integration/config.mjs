import dotenv from 'dotenv';
dotenv.config({ path: './test/integration/.env', override: false });

// Dynamo DB localのエンドポイントが
// ローカル実行時は http://localhost:8000
// GitHub Actionsでは http://dynamodb:8000
// と、異なるので、単純に上書きしてはならない。

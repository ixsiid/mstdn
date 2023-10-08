const { region, instance } = process.env;


export const table_statuses = instance + '-statuses';
export const table_subscriptions = instance + '-subscriptions';

/* ------------------------------------------------------------- */
// DynamoDBオブジェクトが毎回作成されないようにキャッシュする
import { DynamoDB } from '@aws-sdk/client-dynamodb';

const option = { region };
if (process.env.dynamodb_endpoint) option.endpoint = process.env.dynamodb_endpoint;

/** @type {DynamoDB} */
export const dynamodb = new DynamoDB(option);

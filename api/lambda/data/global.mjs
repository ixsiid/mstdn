import { DynamoDB } from '@aws-sdk/client-dynamodb';

const option = { region: process.env.region };
if (process.env.dynamodb_endpoint) option.endpoint = process.env.dynamodb_endpoint;

/** @type {DynamoDB} */
export const dynamodb = new DynamoDB(option);

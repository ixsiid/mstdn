#!/bin/bash

# ローカル実行用スクリプト

# set env
source ./.env

export AWS_LAMBDA_FUNCTION_NAME=${INSTANCE_NAME}-lambda
export AWS_API_GATEWAY_NAME=${INSTANCE_NAME}-gateway
export AWS_LAMBDA_EXECUTE_POLICY_NAME=${INSTANCE_NAME}-lambda-policy
export AWS_LAMBDA_EXECUTE_ROLE_NAME=${INSTANCE_NAME}-lambda-role
export AWS_DEPLOY_POLICY_NAME=${INSTANCE_NAME}-deploy-policy
export AWS_DEPLOY_ROLE_NAME=${INSTANCE_NAME}-deploy-role
export AWS_DYNAMODB_TABLE_NAME=${INSTANCE_NAME}-statuses

# prepare create role
cp ./iam/lambda_execute_policy.json ./lambda_execute_policy.json
sed -i "s@%REGION%@${AWS_REGION}@g"             ./lambda_execute_policy.json
sed -i "s@%ACCOUNT_ID%@${AWS_ACCOUNT_ID}@g"     ./lambda_execute_policy.json
sed -i "s@%TABLE%@${AWS_DYNAMODB_TABLE_NAME}@g" ./lambda_execute_policy.json

cp ./iam/lambda_execute_role.json ./lambda_execute_role.json

# create exection lambda roles
aws iam create-policy \
  --policy-name ${AWS_LAMBDA_EXECUTE_POLICY_NAME} \
  --policy-document file://lambda_execute_policy.json \
  > create-policy.json

aws iam create-role \
  --role-name ${AWS_LAMBDA_EXECUTE_ROLE_NAME} \
  --assume-role-policy-document file://lambda_execute_role.json \
  > create-role.json

aws iam attach-role-policy \
  --role-name ${AWS_LAMBDA_EXECUTE_ROLE_NAME} \
  --policy-arn "arn:aws:iam::${AWS_ACCOUNT_ID}:policy/${AWS_LAMBDA_EXECUTE_POLICY_NAME}" \
  > attach-role-policy.json


# Dynamo DBの作成
aws dynamodb create-table \
  --table-name ${AWS_DYNAMODB_TABLE_NAME} \
  --cli-input-json file://dynamodb/schema.json \
  --billing-mode PROVISIONED \
  --provisioned-throughput ReadCapacityUnits=2,WriteCapacityUnits=2 \
  > create-table.json

sleep 60s

aws dynamodb put-item \
  --table-name ${AWS_DYNAMODB_TABLE_NAME} \
  --item file://dynamodb/first-item.json \
  > put-first-item.json

# API Gatewayの作成
aws apigatewayv2 import-api \
  --body file://api_gateway/gateway_skelton.json \
  > import-api.json

export AWS_GATEWAY_API_ID=`jq -r .ApiId import-api.json`

aws apigatewayv2 create-stage \
  --api-id ${AWS_GATEWAY_API_ID} \
  --auto-deploy \
  --stage-name api \
  > create-stage.json

# API MappingはやめてCloudFrontへのオリジンとビヘイビアの追加にする
# CloudFrontビヘイビアのパスパターンとAPI Gatewayのステージ名は一致させる必要がある
aws apigatewayv2 create-api-mapping \
  --api-id ${AWS_GATEWAY_API_ID} \
  --api-mapping-key api \
  --domain-name "${DOMAIN}" \
  --stage api \
  > create-api-mapping.json

# Lambda Functionの作成
aws lambda create-function \
  --function-name ${AWS_LAMBDA_FUNCTION_NAME} \
  --role "arn:aws:iam::${AWS_ACCOUNT_ID}:role/${AWS_LAMBDA_EXECUTE_ROLE_NAME}" \
  --zip-file fileb://initialize/lambda_skelton.zip \
  --runtime "nodejs18.x" \
  --handler "index.handler" \
  --description "${INSTANCE_NAME}-api-processor" \
  --timeout 10 \
  --environment "Variables={username=${USERNAME},display_name=${DISPLAY_NAME},email=${EMAIL},access_token=${INSTANCE_ACCESS_TOKEN},domain=${DOMAIN},region=${AWS_REGION},dynamodb_table_name=${AWS_DYNAMODB_TABLE_NAME}}" \
  > create-function.json

aws lambda add-permission \
 --statement-id `uuidgen` \
 --action lambda:InvokeFunction \
 --function-name "arn:aws:lambda:${AWS_REGION}:${AWS_ACCOUNT_ID}:function:${AWS_LAMBDA_FUNCTION_NAME}" \
 --principal apigateway.amazonaws.com \
 --source-arn "arn:aws:execute-api:${AWS_REGION}:${AWS_ACCOUNT_ID}:${AWS_GATEWAY_API_ID}/*/*" \
 > add-permission.json


# これは最後
# preparation for deploy
cp ./iam/deploy_policy.json ./deploy_policy.json
sed -i "s@%REGION%@${AWS_REGION}@g"                 ./deploy_policy.json
sed -i "s@%ACCOUNT_ID%@${AWS_ACCOUNT_ID}@g"         ./deploy_policy.json
sed -i "s@%GATEWAY_API_ID%@${AWS_GATEWAY_API_ID}@g" ./deploy_policy.json
sed -i "s@%FUNCTION%@${AWS_LAMBDA_FUNCTION_NAME}@g" ./deploy_policy.json

cp ./iam/deploy_role.json ./deploy_role.json
sed -i "s@%ACCOUNT_ID%@${AWS_ACCOUNT_ID}@g" ./deploy_role.json
sed -i "s@%REPOSITORY%@${REPOSITORY}@g"     ./deploy_role.json

## deploy lambda and gateway
aws iam create-policy \
  --policy-name ${AWS_DEPLOY_POLICY_NAME} \
  --policy-document file://deploy_policy.json \
  > create-policy-deploy.json

aws iam create-role \
  --role-name ${AWS_DEPLOY_ROLE_NAME} \
  --assume-role-policy-document file://deploy_role.json \
  > create-role-deploy.json

aws iam attach-role-policy \
  --role-name ${AWS_DEPLOY_ROLE_NAME} \
  --policy-arn "arn:aws:iam::${AWS_ACCOUNT_ID}:policy/${AWS_DEPLOY_POLICY_NAME}" \
  > attach-role-policy-deploy.json

# mstdn
AWSのIaaSを用いたサーバーレスで実現するマストドン互換インスタンスです。
次のサービスを用います
- API Gateway (v2, HTTP API)
- Lambda
- Dynamo DB
- Cognito
- S3
- CloudFront

また、CloudWatch, ACM, Route53, IAMなどの利用も想定しています。

現在は、マストドンと同じREST APIを提供することで実現しています。
単一のユーザーアカウントで動かすことを前提としており、また、多くのメソッドが未実装です。


# セットアップ
## 前準備
- セットアップ用Roleの作成
  ```
	{
	"Version": "2012-10-17",
	"Statement": [
		{
			"Effect": "Allow",
			"Action": [
				"iam:CreateRole",
				"iam:CreatePolicy",
				"iam:AttachRolePolicy",
				"iam:PassRole"
			],
			"Resource": [
				"arn:aws:iam::${AWS_ACCOUNT_ID}:role/*",
				"arn:aws:iam::${AWS_ACCOUNT_ID}:policy/*"
			]
		},
		{
			"Effect": "Allow",
			"Action": [
				"apigateway:PUT",
				"apigateway:POST"
			],
			"Resource": [
				"*"
			]
		},
		{
			"Effect": "Allow",
			"Action": [
				"lambda:CreateFunction",
				"lambda:AddPermission"
			],
			"Resource": [
				"*"
			]
		},
		{
			"Effect": "Allow",
			"Action": [
				"dynamodb:CreateTable",
				"dynamodb:PutItem"
			],
			"Resource": [
				"*"
			]
		}
	]
	}
  ```
- カスタムドメイン名の作成
  
- GitHub PATの設定
- GitHub secretsの設定
  * AWS settings
    - AWS_INITIALIZE_ROLE_ARN=
    - AWS_REGION=
    - AWS_ACCOUNT_ID=
    - INSTANCE_NAME=

  * instance settings
    - DOMAIN=
    - USERNAME=
    - DISPLAY_NAME=
    - EMAIL=
    - INSTANCE_ACCESS_TOKEN=
  
  * add GitHub secret
    - GITHUB_PERSONAL_TOKEN

## 無事にセットアップできたら次の項目は削除してよい
* AWS
  - セットアップ用Role / Policy
* GitHub secrets
  - AWS_INITIALIZE_ROLE_ARN
  - GITHUB_PERSONAL_TOKEN
  - USERNAME
  - DISPLAY_NAME
  - EMAIL
  - INSTANCE_ACCESS_TOKEN

## 無事にセットアップできたら新たに作られている secrets
- AWS_GATEWAY_API_ID

## 最終的なsecretsの状態
- AWS_ACCOUNT_ID
- AWS_GATEWAY_API_ID
- AWS_REGION
- AWS_ROLE_ARN
- DOMAIN
- INSTANCE_NAME


- AWS_AUTH_GATEWAY_API_ID
- AWS_COGNITO_CLIENT_ID
- AWS_COGNITO_USER_POOL_ID

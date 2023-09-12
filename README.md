# mstdn
Solo instance for mastodon by AWS lambda, DynamoDB and API Gateway

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

  # instance settings
  - DOMAIN=
  - USERNAME=
  - DISPLAY_NAME=
  - EMAIL=
  - INSTANCE_ACCESS_TOKEN=

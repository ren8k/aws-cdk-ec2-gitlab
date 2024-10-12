<role>AWS Specialist Solution Architect</role>
<task>AWS リソースを IaC 化するため，TypeScript で AWS CDK を実装する</task>
<instruction>

aws_architecture タグ内に示す AWS アーキテクチャを AWS CDK を利用して構築する必要があります．

<aws_architecture>
AWS 上でサーバーレスで Gitlab をホストするためのアーキテクチャを構築する．具体的には，Private Subnet に配置された ECS クラスター上で Gitlab を動作させ，ALB を介してアクセスできるようにする．なお，ECS のデータプレーンとして Fargate を利用する．また，EFS を利用して Gitlab のデータを永続化する．
</aws_architecture>

aws_resource タグ内に示すリソースを利用して，aws_architecture タグ内の内容を実現するための AWS CDK スタックを TypeScript で実装してください．

<aws_resource>

VPC, Subnet, Security Group, ALB, EFS, ECS を利用する．

## VPC

- Public Subnet 2 つ
- **「パブリック IPv4 アドレスを自動割り当て」を有効化すること**
- Private Subnet 2 つ
- Internet Gateway
- NAT Gateway
- Route Table
- Private Subnet から NAT Gateway へのルートを追加
- Public Subnet から Internet Gateway へのルートを追加

## Security Group 3 つ

- ALB 用: インバウンド 80 番ポート（0.0.0.0）を許可
- ECS 用: インバウンド 80 番ポート（ALB のセキュリティグループ）を許可
- EFS 用: インバウンド 2049 番ポート（ECS のセキュリティグループ）を許可

## Target Group

- ECS クラスターへのターゲットグループ
- IP アドレスベースのターゲットグループ
- IP アドレスタイプ: IPv4
- **Ipv4 アドレスは削除（指定しない．Fargate で起動しているタスクが自動で登録されるため．）**
- ポートは 80
- ヘルスチェック
  - ポート: 80
  - ヘルスチェックパス: `/users/sign_in`

## ALB

- スキームはインターネット向け
- IP アドレスタイプは IPv4
- 2 つの Public Subnet にネットワークマッピング
- セキュリティグループ: 上記で作成した ALB 用のセキュリティグループ
- リスナー - ポート: 80 - ターゲットグループ: 上記で作成したターゲットグループ

## EFS

- ファイルシステムのタイプ: リージョン
- スループットモード: 拡張 (デフォルト)
- パフォーマンスモード: 汎用 (デフォルト)
- インフォルダーポリシー: `efs:access-point`
- VPC: 上記で作成した VPC
- マウントターゲット: 上記作成した 2 つの Private Subnet にマウント
- セキュリティグループ: 上記で作成した EFS 用のセキュリティグループ
- ファイルシステムポリシー: デフォルトの設定

## ECS

### クラスター

- インフラストラクチャ: Fargate
- CloudWatch Container Insights: 有効化

### タスク定義

- 以下のタスク定義をベースに作成すること．但し，以下の点を留意すること．
  - `external_url` には，ALB の DNS 名を指定する.
  - `GITLAB_ROOT_PASSWORD` と `GITLAB_ROOT_EMAIL` は適宜変更できるようにする．

```json
{
  "taskDefinitionArn": "arn:aws:ecs:ap-northeast-1:XXXXXXXXXXXX:task-definition/pj-ihi-gitlab-task-definition:N",
  "containerDefinitions": [
    {
      "name": "gitlab",
      "image": "gitlab/gitlab-ce:latest",
      "cpu": 0,
      "portMappings": [
        {
          "name": "ecs-port",
          "containerPort": 80,
          "hostPort": 80,
          "protocol": "tcp",
          "appProtocol": "http"
        }
      ],
      "essential": true,
      "environment": [
        {
          "name": "GITLAB_ROOT_PASSWORD",
          "value": "XXXXXXXXXXXX"
        },
        {
          "name": "GITLAB_OMNIBUS_CONFIG",
          "value": "external_url 'http://XXXXXXXXXXXX.ap-northeast-1.elb.amazonaws.com'"
        },
        {
          "name": "GITLAB_ROOT_EMAIL",
          "value": "XXXXXXXXXXXX@gmail.com"
        }
      ],
      "environmentFiles": [],
      "mountPoints": [
        {
          "sourceVolume": "config",
          "containerPath": "/etc/gitlab",
          "readOnly": false
        },
        {
          "sourceVolume": "logs",
          "containerPath": "/var/log/gitlab",
          "readOnly": false
        },
        {
          "sourceVolume": "data",
          "containerPath": "/var/opt/gitlab",
          "readOnly": false
        }
      ],
      "volumesFrom": [],
      "ulimits": [],
      "logConfiguration": {
        "logDriver": "awslogs",
        "options": {
          "awslogs-group": "/ecs/pj-ihi-gitlab-task-definition",
          "mode": "non-blocking",
          "awslogs-create-group": "true",
          "max-buffer-size": "25m",
          "awslogs-region": "ap-northeast-1",
          "awslogs-stream-prefix": "ecs"
        },
        "secretOptions": []
      },
      "systemControls": []
    }
  ],
  "family": "pj-ihi-gitlab-task-definition-v1009",
  "taskRoleArn": "arn:aws:iam::XXXXXXXXXXXX:role/ecsTaskRole",
  "executionRoleArn": "arn:aws:iam::XXXXXXXXXXXX:role/ecsTaskExecutionRole",
  "networkMode": "awsvpc",
  "revision": 8,
  "volumes": [
    {
      "name": "config",
      "efsVolumeConfiguration": {
        "fileSystemId": "fs-081385191350fbfdf",
        "rootDirectory": "/srv/gitlab/config"
      }
    },
    {
      "name": "logs",
      "efsVolumeConfiguration": {
        "fileSystemId": "fs-081385191350fbfdf",
        "rootDirectory": "/srv/gitlab/logs"
      }
    },
    {
      "name": "data",
      "efsVolumeConfiguration": {
        "fileSystemId": "fs-081385191350fbfdf",
        "rootDirectory": "/srv/gitlab/data"
      }
    }
  ],
  "status": "ACTIVE",
  "requiresAttributes": [
    {
      "name": "com.amazonaws.ecs.capability.logging-driver.awslogs"
    },
    {
      "name": "ecs.capability.execution-role-awslogs"
    },
    {
      "name": "ecs.capability.efsAuth"
    },
    {
      "name": "com.amazonaws.ecs.capability.docker-remote-api.1.19"
    },
    {
      "name": "ecs.capability.efs"
    },
    {
      "name": "com.amazonaws.ecs.capability.docker-remote-api.1.28"
    },
    {
      "name": "com.amazonaws.ecs.capability.task-iam-role"
    },
    {
      "name": "com.amazonaws.ecs.capability.docker-remote-api.1.25"
    },
    {
      "name": "com.amazonaws.ecs.capability.docker-remote-api.1.18"
    },
    {
      "name": "ecs.capability.task-eni"
    },
    {
      "name": "com.amazonaws.ecs.capability.docker-remote-api.1.29"
    }
  ],
  "placementConstraints": [],
  "compatibilities": ["EC2", "FARGATE"],
  "requiresCompatibilities": ["FARGATE"],
  "cpu": "2048",
  "memory": "6144",
  "runtimePlatform": {
    "cpuArchitecture": "X86_64",
    "operatingSystemFamily": "LINUX"
  },
  "registeredAt": "2024-10-10T12:09:51.052Z",
  "registeredBy": "arn:aws:iam::XXXXXXXXXXXX:user/YYYYYYY",
  "tags": []
}
```

### ロール

- `ecsTaskExecutionRole` は以下のポリシー (`AmazonECSTaskExecutionRolePolicy`) が付与されたロール

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": [
        "ecr:GetAuthorizationToken",
        "ecr:BatchCheckLayerAvailability",
        "ecr:GetDownloadUrlForLayer",
        "ecr:BatchGetImage",
        "logs:CreateLogStream",
        "logs:PutLogEvents"
      ],
      "Resource": "*"
    }
  ]
}
```

- `ecsTaskRole` は以下のポリシーが付与されたロール

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Sid": "VisualEditor0",
      "Effect": "Allow",
      "Action": [
        "ssmmessages:CreateDataChannel",
        "ssmmessages:OpenDataChannel",
        "ssmmessages:OpenControlChannel",
        "ssmmessages:CreateControlChannel"
      ],
      "Resource": "*"
    }
  ]
}
```

### サービス

- クラスター: 上記で作成した ECS クラスター
- コンピューティング設定:起動タイプ
- 機動タイプ: Fargate
- プラットフォームバージョン: LATEST
- ロードバランサー: 上記で作成した ALB
- ターゲットグループ: 上記で作成したターゲットグループ
- ヘルスチェックの猶予期間: 360 秒

</aws_resource>

必ず guidelines タグに示すガイドラインに従うこと．

<guidelines>

- 日本語で回答すること．
- リソースの依存関係を考慮して，リソースを作成する順番を決定
- リソースの作成順序を考慮して，CDK スタックを実装
- ハードコーディングは避け，パラメータ化
- 自身で実装した CDK のコードを確認し，バグが無いかを再確認

</guidelines>

必ず rules タグ内に示す出力形式で回答すること．

<rules>
以下の出力形式を厳守しなさい．
<thinking>
guidelines タグに記載された内容をステップバイステップで検討
</thinking>
<output>
CDK スタックの TypeScript の実装
</output>
<final_output>
aws_resources タグや guidelines タグ内の条件に従っているかを確認する．例えば，ハードコーディングしている場合は修正すること．その上で，最終的なCDK スタックの TypeScript の実装を示す．
</final_output>
</rules>
</instruction>

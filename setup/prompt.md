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

※※※※※※※※※※※※※※※※※※※※※※※※※※※※※※※※※※※※※※※※※※※

## EFS

- ファイルシステム
  - パフォーマンスモード: 汎用
  - スループットモード: バースト
  - バーストスループット: 1MB/s
  - インフォルダーポリシー: `efs:access-point`
- マウントターゲット
  - 2 つの Private Subnet にマウント

## ECS

### クラスター

- インフラストラクチャ: Fargate

※なんか Json 見たほうが正確かつ LLM が理解しやすいか？

### タスク定義

- コンテナイメージ: `gitlab/gitlab-ce:latest`
- ポート: 80
- 環境変数
  - `GITLAB_OMNIBUS_CONFIG`: `external_url 'http://localhost'`
  - `GITLAB_ROOT_PASSWORD`: `password`
- メモリ: 2GB
- CPU: 1 vCPU

### サービス

- タスク数: 1

</aws_resource>

以下のガイドラインに従って，CDK スタックを実装してください．

<guidelines>

- 日本語で回答すること．
- リソースの依存関係を考慮して，リソースを作成する順番を決定
- リソースの作成順序を考慮して，CDK スタックを実装
- ハードコーディングは避け，パラメータ化
- 自身で実装した CDK のコードを確認し，バグが無いかを再確認

</guidelines>

必ず rules タグ内に示す出力形式で回答してください．

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

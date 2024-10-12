- ECS でサーバーレス化したい場合、Fargate の利用が有効。
- ECS とは、ユーザーの指定した実行環境（サーバーレスインスタンス or セルフホストインスタンス）でコンテナを管理してくれるサービス
- Fargate とは、コンテナの実行環境（サーバーレスインスタンス）をマネージド管理してくれるサービス

## Reference

- https://qiita.com/K5K/items/0d8dbdb39fbb0375e2bd
- https://qiita.com/tatsuya11bbs/items/a7898275535a766718bf
- https://qiita.com/minorun365/items/84bef6f06e450a310a6a
- https://zenn.dev/tech4anyone/articles/62f360ccea30ca
- https://dev.classmethod.jp/articles/202310-ecs-efs-01/

- https://github.com/rhydvik/aws-cdk-ecs-fargate-load-balancer/blob/main/lib/app-infra-stack.ts

## ToDo

- パスワードは SecretsManager に保存する

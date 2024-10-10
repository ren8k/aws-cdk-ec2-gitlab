<role>AWS Specialist Solution Architect</role>
<task>AWS リソースを IaC 化するため，TypeScript で AWS CDK を実装する</task>
<instruction>
以下の AWS リソースを利用して，AWS 上でサーバーレスで Gitlab をホストするための CDK スタックを実装してください。
<aws_resource>

- VPC
- Public Subnet 2 つ
  -
- Private Subnet 2 つ
- Internet Gateway
- NAT Gateway
- Route Table
- Security Group 3 つ
  - ECS, ALB, EFS 用
-

</aws_resource>
</instruction>
<guidelines>

- リソースの依存関係を考慮して，リソースを作成する順番を決定
- リソースの作成順序を考慮して，CDK スタックを実装
- ハードコーディングは避け，パラメータ化
- 自身で実装した CDK のコードを確認し，バグが無いかを確認

</guidelines>
<rules>
以下の出力形式で回答しなさい．
<thinking>
guidelinesタグに記載された内容をステップバイステップで検討
</thinking>
<output>
最終的な CDK スタックのTypeScriptの実装
</output>
</rules>

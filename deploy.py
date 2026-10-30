"""
Deploy SerpAID to Amazon Bedrock AgentCore Runtime.

Run this with AWS credentials configured. It packages api.py and launches a
serverless runtime, then prints the agent ARN you can call for a live demo.
"""

from bedrock_agentcore_starter_toolkit import Runtime

runtime = Runtime()
runtime.configure(
    entrypoint="api.py",
    auto_create_execution_role=True,
    auto_create_ecr=True,
    requirements_file="requirements.txt",
    region="us-east-1",
    agent_name="serpaid",
)
launched = runtime.launch()
print("SerpAID is live on AgentCore.")
print("Agent ARN:", launched.agent_arn)

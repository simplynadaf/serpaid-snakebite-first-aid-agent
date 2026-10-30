"""
SerpAID AgentCore entrypoint.

Deploying the graph to Amazon Bedrock AgentCore Runtime gives serverless hosting
and OpenTelemetry traces in CloudWatch, and lets us publish a live demo endpoint.
Run deploy.py to launch it. This file is the handler AgentCore invokes.
"""

from __future__ import annotations

try:
    from bedrock_agentcore.runtime import BedrockAgentCoreApp
except Exception:  # keep the repo importable without the extra installed
    BedrockAgentCoreApp = None

from serpaid.graph import build_graph

_graph = build_graph()


def run_prompt(prompt: str) -> str:
    result = _graph(prompt)
    return str(getattr(result, "output", None) or result)


if BedrockAgentCoreApp is not None:
    app = BedrockAgentCoreApp()

    @app.entrypoint
    def handler(payload):
        return run_prompt(payload.get("prompt", ""))

    if __name__ == "__main__":
        app.run()
else:
    if __name__ == "__main__":
        import sys

        print(run_prompt(" ".join(sys.argv[1:]) or "A snake bit my cousin, reply in English, country IN"))

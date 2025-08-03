# Script para iniciar o MCP Server em modo agente usando o modelo Claude 4 Sonnet

# Configurações
$env:GITHUB_PAT = "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"
$MCP_IMAGE = "ghcr.io/github/github-mcp-server:latest"
$MCP_CONTAINER = "github-mcp-agent"
$MCP_PORT = 8080

# Modelo Claude 4 Sonnet (pode ser variável de ambiente ou argumento do MCP Server)
$env:MCP_AGENT_MODEL = "claude-4-sonnet"

# Para evitar conflitos, pare e remova o container antigo se existir
docker stop $MCP_CONTAINER 2>$null
docker rm $MCP_CONTAINER 2>$null

# Inicia o MCP Server em modo "agent" com o modelo Claude 4 Sonnet
docker run --name $MCP_CONTAINER -d -p $MCP_PORT:8080 `
  -e GITHUB_PAT=$env:GITHUB_PAT `
  -e MCP_MODE=agent `
  -e MCP_AGENT_MODEL=$env:MCP_AGENT_MODEL `
  $MCP_IMAGE

# Confirma se o container iniciou corretamente
docker ps | Select-String $MCP_CONTAINER

# Mensagem final
Write-Host "MCP Server iniciado em modo agente com modelo Claude 4 Sonnet na porta $MCP_PORT."
Write-Host "Acesse: http://localhost:$MCP_PORT"
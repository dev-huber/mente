# 📱 Projeto: Quem Mente Menos?

## 🧠 Visão Geral

“Quem Mente Menos?” é um aplicativo mobile com IA que permite detectar sinais de mentira, dissimulação ou hesitação em tempo real, com base em **análise de voz e texto** dos usuários. Ele combina **Azure AI Services**, **Claude 4 Sonnet**, e **GitHub Copilot** para gerar insights inteligentes e gerar um score de veracidade.

O app funciona como um jogo social: os usuários respondem perguntas desafiadoras e recebem feedback automático sobre a "veracidade" de suas respostas, com base em entonação, hesitação, ambiguidade e coerência semântica.

## 🎯 Objetivos do Projeto

- Gravar e transcrever respostas de usuários (voz ou texto)
- Analisar emoções, hesitação e ambiguidade com Azure Speech/Text
- Detectar incoerências com Groundedness Detection (Content Safety)
- Gerar score final de veracidade + feedback humano
- Exibir resultado e ranking em tempo real
- Preparar o app para publicação no Google Play Store
- Criar dashboard administrativo com logs e relatórios

## 🏗️ Stack Tecnológico

| Componente     | Tecnologia                                 |
|----------------|---------------------------------------------|
| App Mobile     | Flutter + Dart                              |
| Backend API    | Azure Functions (Node.js ou Python)         |
| Armazenamento  | Azure Blob Storage + Application Insights   |
| IA/Processamento| Azure AI Services + OpenAI GPT + Claude 4   |
| Frontend Admin | Next.js + Tailwind + Chart.js + Supabase    |
| CI/CD          | GitHub Actions + Secrets Azure              |

## ⚙️ Serviços Azure Utilizados

- Azure Speech to Text (análise de hesitação e prosódia)
- Azure Text Analytics (sentimento, opinion mining)
- Azure Content Safety (Groundedness Detection)
- Azure Cognitive Search (Semantic Ranking)
- AzDetectSuite (padrões comportamentais)
- Azure Blob Storage + Application Insights

## 📦 Ciclo de Desenvolvimento

- Divisão modular (A-H)
- Desenvolvimento orientado a prompts Claude 4 + Copilot
- Documentação contínua em markdown
- Histórico de progresso mantido em `progress_log.md`
- Publicação planejada para Play Store (v1)

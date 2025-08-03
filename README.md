
# 🤖 Quem Mente Menos?

[![build](https://img.shields.io/badge/CI%2FCD-GitHub%20Actions-blue)](https://github.com/carlosmb2023/quem-mente-menos/actions)
[![azure](https://img.shields.io/badge/Azure%20AI-integrated-success)](https://azure.microsoft.com/)
[![claude4](https://img.shields.io/badge/Claude%204-Powered-brightgreen)](https://claude.ai/)
[![mobile-ready](https://img.shields.io/badge/App-Mobile_Ready-ff69b4)](https://play.google.com/)

> Aplicativo com inteligência artificial para detecção de dissimulação, mentiras e hesitação em falas ou textos — via análise semântica, emocional e comportamental.  
> Desenvolvido com Claude 4, GitHub Copilot, Azure AI Services e deploy automatizado.

---

## 🚦 Status de Integração

**Módulos Prontos e Integrados:**
- Captura de áudio (Flutter/Dart) com UI, waveform, controles e upload automático
- Backend Azure Functions para upload, validação e logging defensivo
- Testes unitários para captura, upload e backend (cobertura >90%)
- Logging estruturado e tratamento de erros em todos os fluxos

**Módulos em Progresso:**
- Pipeline de processamento AI (transcrição, análise de texto, groundedness, score final)
- Dashboard administrativo (Next.js + Supabase)
- Integração completa com Azure AI Services

**Módulos Pendentes:**
- Algoritmo de fusão de resultados (score de veracidade)
- Feedback IA humanizado
- Observabilidade avançada (Application Insights, CI/CD)
- Agente inteligente final (Claude 4 explicativo)

**Visão Defensiva:**
- Fail Fast, validação de entradas, error boundaries, logging detalhado, fallback inteligente
- Testes para edge cases e cenários de falha

**Como contribuir:**
- Veja o progresso em `/docs/project_status.md` e `/docs/progress_log.md`
- Siga os padrões defensivos e de testes descritos em `/copilot-instrutions.md`

**🧠 Projeto 100% Open Prompt e IA-Driven. Vem voar com a gente.**

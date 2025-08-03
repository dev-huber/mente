Você é um SENIOR SOFTWARE ARCHITECT com 15 anos de experiência, especializado 
em desenvolvimento defensivo e antecipação de falhas. Sua missão é criar código 
ZERO-BUG, robusto e maintível.
</role>

<defensive_mindset>
SEMPRE aplique os princípios:
- Fail Fast: Detecte erros imediatamente
- Assume Nothing: Valide todas as entradas
- Defense in Depth: Múltiplas camadas de validação
- Graceful Degradation: Fallbacks inteligentes
</defensive_mindset>

<code_standards>
- Use TypeScript com strict mode sempre
- Implemente error boundaries em React
- Adicione logging estruturado para debugging
- Crie testes unitários para edge cases
- Documente assumptions e constraints
</code_standards>
Engenharia de Prompt Classe Mundial
Técnicas XML Estruturadas
Claude 4 Sonnet foi treinado para responder excepcionalmente bem a tags XML:

text
<task>
Criar um sistema de autenticação JWT completo
</task>

<requirements>
- Validação rigorosa de inputs
- Error handling abrangente  
- Rate limiting
- Refresh token rotation
- Logging de segurança
</requirements>

<error_anticipation>
Considere e previna:
- Token malformados
- Ataques de timing
- Race conditions
- Memory leaks
- Database connection failures
</error_anticipation>

<output_format>
Retorne código TypeScript com:
- Comentários explicativos
- Unit tests inclusos
- Error scenarios documentados
</output_format>
Prompts de Antecipação de Problemas
Use a técnica "Pre-mortem" desenvolvida especificamente para Claude 4:

text
<pre_mortem>
Antes de gerar o código, analise:
1. Quais são os 5 pontos de falha mais prováveis?
2. Como cada falha se manifestaria?
3. Qual seria o impacto no usuário?
4. Como prevenir cada cenário?
5. Que testes são necessários para cada edge case?
</pre_mortem>

<implementation>
Agora implemente a solução considerando todos os pontos acima.
</implementation>
Estratégias Defensivas Avançadas
Failure Modeling Sistemático
Instrua Claude 4 Sonnet para modelar falhas usando a metodologia FMEA:

text
<failure_modeling>
Para cada componente, identifique:
- Component: [nome do módulo/função]
- Failure: [como pode falhar]
- Cause: [o que causa a falha]
- Effect: [impacto se não tratado]
- Probability: [comum/raro/muito raro]
- Mitigation: [como prevenir/tratar]
</failure_modeling>
Robust Coding Patterns
Ensine Claude 4 Sonnet os 6 princípios de código robusto:

text
<robust_principles>
1. Don't trust any code you didn't write
   - Valide retornos de APIs
   - Check boolean returns
   - Verifique output parameters

2. Don't trust consumers of your code
   - Valide todos os inputs
   - Use defensive assertions
   - Implemente rate limiting

3. Don't trust the environment
   - Handle network failures
   - Prepare for resource contention
   - Consider permission changes

4. Offer graceful degradations
   - Implement fallback mechanisms
   - Cache critical data locally
   - Provide alternative workflows

5. Hide your internal data structures
   - Use proper encapsulation
   - Validate state consistency
   - Protect shared resources

6. Assume the improbable
   - Handle edge cases
   - Log unusual events
   - Plan for scale issues
</robust_principles>
Técnicas de Debugging e Code Review
Automated Code Analysis
Configure Claude 4 Sonnet como seu revisor automático:

text
<code_review_prompt>
Analise este código como um SENIOR CODE REVIEWER:

<analysis_framework>
1. Security Vulnerabilities
   - SQL injection risks
   - XSS possibilities
   - Authentication bypasses
   - Authorization flaws

2. Performance Issues
   - Memory leaks
   - N+1 queries
   - Inefficient algorithms
   - Resource contention

3. Maintainability Concerns
   - Code complexity
   - Unclear naming
   - Missing documentation
   - Tight coupling

4. Error Handling
   - Missing try-catch blocks
   - Poor error messages
   - Silent failures
   - Resource cleanup
</analysis_framework>

<output>
Para cada issue encontrada, forneça:
- Severity: [Critical/High/Medium/Low]
- Description: [detalhes do problema]
- Fix: [solução específica com código]
- Test: [como testar a correção]
</output>
</code_review_prompt>
Interactive Debugging Workflow
Use Claude 4 Sonnet para debugging step-by-step:

text
<debugging_session>
<symptom>
[Descreva o comportamento inesperado]
</symptom>

<context>
[Código relacionado, stack traces, logs]
</context>

<analysis_request>
1. Identifique possíveis causas raiz
2. Sugira estratégias de debugging
3. Crie hipóteses testáveis
4. Proponha experimentos para validar cada hipótese
5. Ordene as investigações por probabilidade
</analysis_request>
</debugging_session>
Agent Mode: Poder Agêntico Máximo
Workflow Agêntico Otimizado
Configure o Agent Mode para desenvolvimento autônomo:

text
<agent_instructions>
<goal>
Implementar feature completa com zero bugs em produção
</goal>

<approach>
1. PLAN: Crie arquitetura detalhada
2. IMPLEMENT: Desenvolva com defensive programming
3. TEST: Crie testes abrangentes (unit, integration, e2e)
4. REVIEW: Auto-analise segurança e performance  
5. REFACTOR: Otimize baseado em análise
6. DOCUMENT: Crie documentação técnica
</approach>

<constraints>
- Nunca commite código sem testes passando
- Sempre valide inputs e outputs
- Implemente logging para debugging
- Use error boundaries apropriados
- Considera casos edge desde o início
</constraints>

<quality_gates>
- Code coverage mínimo: 90%
- Complexity score máximo: 7
- Security scan: sem vulnerabilidades
- Performance: sem bottlenecks identificados
</quality_gates>
</agent_instructions>
Custom Instructions para Agent Mode
Otimize o comportamento agêntico com instruções específicas:

text
# Agent Mode Custom Instructions

## Development Philosophy
- Write code that fails fast and fails loudly
- Implement defense in depth at every layer
- Assume all external inputs are malicious
- Design for failure, plan for recovery

## Code Generation Rules
- Always include comprehensive error handling
- Add debug logging at critical points
- Implement input validation for all functions
- Create fallback mechanisms for external dependencies
- Write self-documenting code with clear intentions

## Testing Requirements
- Generate unit tests for happy path AND edge cases
- Include performance tests for critical functions
- Create integration tests for external dependencies
- Add security tests for input validation
- Mock external services to test failure scenarios

## Review Checklist
Before finishing any task, verify:
- [ ] All inputs are validated
- [ ] Error handling is comprehensive
- [ ] Performance implications are considered
- [ ] Security vulnerabilities are addressed
- [ ] Code is self-documenting
- [ ] Tests cover edge cases
- [ ] Logging is adequate for debugging
Técnicas Avançadas de Prompt Engineering
System Prompt Secrets
Baseado no vazamento do system prompt do Claude 4:

1. Identity Anchoring

text
<identity>
Você é um EXPERT SOFTWARE ENGINEER especializado em desenvolvimento defensivo,
trabalhando em [data_atual] com conhecimento atualizado até março 2025.
</identity>
2. Binary Style Rules

text
<style_rules>
- NUNCA gere código sem error handling
- SEMPRE valide inputs antes de processar
- JAMAIS ignore potential null/undefined values
- OBRIGATÓRIO incluir logging para debugging
</style_rules>
3. Edge-Case Conditionals

text
<edge_cases>
SE input é null/undefined ENTÃO lance ArgumentException
SE network request falha ENTÃO use cached data
SE validation falha ENTÃO retorne error details
SE resource indisponível ENTÃO degrade gracefully
</edge_cases>
4. Post-Tool Reflection

text
<reflection>
Após gerar código, SEMPRE:
1. Analise possíveis pontos de falha
2. Verifique se error handling é adequado
3. Confirme se testes cobrem edge cases
4. Valide se performance é aceitável
</reflection>
Parallel Tool Execution
Maximize eficiência com execução paralela:

text
<parallel_optimization>
Para máxima eficiência, sempre que precisar executar múltiplas 
operações independentes, invoque todas as ferramentas 
simultaneamente ao invés de sequencialmente.

Exemplo: Ao criar uma API, gere simultaneamente:
- Código da controller
- Testes unitários  
- Documentação da API
- Schema de validação
- Error handlers
</parallel_optimization>
Padrões de Implementação Defensiva
Error Handling Patterns
typescript
// Padrão Guard Clause
function processUserData(userData: unknown): ProcessedData {
  // Early validation with specific errors
  if (!userData) {
    throw new ValidationError('User data is required', { code: 'MISSING_DATA' });
  }
  
  if (typeof userData !== 'object') {
    throw new ValidationError('User data must be object', { code: 'INVALID_TYPE' });
  }
  
  // Continue processing only after validation
  return doProcessing(userData as UserData);
}

// Padrão Result Type
type Result<T, E> = { success: true; data: T } | { success: false; error: E };

async function safeApiCall<T>(url: string): Promise<Result<T, ApiError>> {
  try {
    const response = await fetch(url);
    if (!response.ok) {
      return { success: false, error: new ApiError(response.status) };
    }
    const data = await response.json();
    return { success: true, data };
  } catch (error) {
    return { success: false, error: new NetworkError(error.message) };
  }
}
Graceful Degradation Patterns
typescript
// Circuit Breaker Pattern
class ServiceWithFallback {
  private circuitBreaker = new CircuitBreaker();
  
  async getData(): Promise<Data> {
    if (this.circuitBreaker.isOpen()) {
      return this.getCachedData(); // Fallback
    }
    
    try {
      const data = await this.externalService.fetch();
      this.circuitBreaker.recordSuccess();
      this.updateCache(data);
      return data;
    } catch (error) {
      this.circuitBreaker.recordFailure();
      this.logError('Service degraded, using cache', error);
      return this.getCachedData();
    }
  }
}
Prompts de Casos de Uso Específicos
Para Desenvolvimento de APIs
text
<api_development>
Crie uma API REST completa que seja PRODUCTION-READY:

<requirements>
- Validação rigorosa de inputs com Joi/Zod
- Rate limiting por endpoint
- Error handling padronizado
- Logging estruturado para observability
- Health checks e metrics
- Security headers apropriados
- Graceful shutdown handling
</requirements>

<error_scenarios>
Antecipe e trate:
- Malformed JSON requests
- Database connection failures  
- Third-party service timeouts
- Memory pressure situations
- High concurrent load
- Invalid authentication tokens
</error_scenarios>
</api_development>
Para Desenvolvimento Frontend
text
<frontend_development>
Desenvolva componente React que seja BULLETPROOF:

<defensive_measures>
- Error boundaries para child components
- Loading states para async operations
- Empty states para data ausente  
- Input validation em tempo real
- Accessibility completo (WCAG 2.1)
- Performance optimization (memo, lazy loading)
</defensive_measures>

<edge_cases>
Considere:
- Network connectivity issues
- Slow device performance
- Screen reader users
- Mobile viewport constraints
- Browser compatibility issues
</edge_cases>
</frontend_development>
Monitoramento e Observabilidade
Logging Inteligente
typescript
// Structured Logging Pattern
interface LogContext {
  userId?: string;
  requestId: string;
  operation: string;
  metadata?: Record<string, unknown>;
}

class DefensiveLogger {
  static info(message: string, context: LogContext) {
    console.log(JSON.stringify({
      level: 'info',
      timestamp: new Date().toISOString(),
      message,
      ...context
    }));
  }
  
  static error(message: string, error: Error, context: LogContext) {
    console.error(JSON.stringify({
      level: 'error',
      timestamp: new Date().toISOString(),
      message,
      error: {
        name: error.name,
        message: error.message,
        stack: error.stack
      },
      ...context
    }));
  }
}
Checklist Final: O Dev Perfeito
Use este checklist em cada prompt para Claude 4 Sonnet:

text
<quality_checklist>
□ Instruções específicas e explícitas
□ Contexto sobre motivação/importância
□ XML tags para estruturação
□ Error scenarios antecipados
□ Edge cases considerados
□ Defensive programming aplicado
□ Tests unitários inclusos
□ Logging para debugging
□ Performance considerada
□ Security vulnerabilities checadas
□ Graceful degradation implementada
□ Documentation clara
</quality_checklist>

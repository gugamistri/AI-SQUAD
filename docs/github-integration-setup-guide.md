# Guia de Setup e Teste - Integração GitHub Projects & Kanban

## Pré-requisitos

### 1. GitHub Setup

- [ ] Conta GitHub com acesso a repositório
- [ ] GitHub CLI instalado (`gh --version`)
- [ ] Autenticação GitHub configurada (`gh auth status`)
- [ ] Permissões de admin no repositório
- [ ] GitHub Projects V2 habilitado na organização/conta

### 2. Verificar Instalação AI-SQUAD

```bash
# Verificar se arquivos foram criados
ls -la .ai-squad-core/agents/github-pm.md
ls -la .ai-squad-core/tasks/sync-github-projects.md
ls -la .ai-squad-core/templates/github-project-tmpl.yaml
```

## Passo 1: Configurar GitHub Integration

### 1.1 Obter Token GitHub

```bash
# Criar token com permissões necessárias
gh auth token
# Ou criar via web: Settings > Developer settings > Personal access tokens
```

**Permissões necessárias**:

- `repo` (acesso completo ao repositório)
- `project` (acesso aos GitHub Projects)
- `write:org` (se usando projetos de organização)

### 1.2 Criar GitHub Project V2

```bash
# Via GitHub CLI
gh project create --title "AI-SQUAD Test Project" --body "Projeto de teste para integração AI-SQUAD"

# Ou via web interface: github.com/owner/repo/projects
```

### 1.3 Configurar core-config.yaml

```yaml
github:
  enabled: true
  apiToken: "ghp_seu_token_aqui"
  repository: "seu-usuario/seu-repositorio"
  projectId: "PVT_projeto_id_aqui" # Obter do URL do projeto
  organization: "sua-org" # Se aplicável
  kanbanColumns:
    noStatus: "No Status"
    humanReview: "Human Review"
    todo: "Todo"
    inProgress: "In Progress"
    done: "Done"
  syncOptions:
    autoCreateIssues: true
    autoUpdateStatus: true
    bidirectionalSync: true
    syncInterval: 300
```

## Passo 2: Teste Básico - GitHub PM Agent

### 2.1 Testar Conectividade

```
@github-pm *help
@github-pm *validate-config
@github-pm *status
```

**Resultado esperado**:

```
✅ GitHub API connectivity: OK
✅ Repository access: OK
✅ Project access: OK
✅ Integration status: ENABLED
```

### 2.2 Setup do Projeto GitHub

```
@github-pm *setup-github
```

Este comando deve:

- Configurar colunas do projeto
- Criar labels necessários
- Configurar templates de issue

## Passo 3: Teste de Criação de Issues

### 3.1 Criar Story de Teste

```
@sm *draft
```

Quando solicitado, criar uma story simples:

- **Título**: "Teste de Integração GitHub"
- **Descrição**: "Story de teste para validar integração GitHub Projects"
- **Acceptance Criteria**:
  - Issue deve ser criada no GitHub
  - Issue deve aparecer no projeto Kanban

### 3.2 Verificar Criação Automática de Issue

Se `autoCreateIssues: true`, a issue deve ser criada automaticamente.

Caso contrário, criar manualmente:

```
@github-pm *create-issue
```

### 3.3 Validações

- [ ] Issue criada no repositório GitHub
- [ ] Issue adicionada ao projeto Kanban
- [ ] Issue na coluna "Todo"
- [ ] Labels corretos aplicados (`ai-squad`, `user-story`)
- [ ] Story file atualizado com GitHub metadata

## Passo 4: Teste de Sincronização Kanban

### 4.1 Mover Issue no GitHub

- Acesse o projeto no GitHub web
- Mova a issue para coluna "In Progress"

### 4.2 Executar Sync

```
@github-pm *sync-github
```

### 4.3 Verificar Sincronização Local

- Verificar se workflow plan foi atualizado
- Status local deve refletir mudança do GitHub

### 4.4 Teste Reverso - Local para GitHub

```
@github-pm *update-kanban
```

Mover story local para "Human Review" e verificar se GitHub é atualizado.

## Passo 5: Teste de Git Operations

### 5.1 Simular Development

```
@dev
# Implementar a story de teste
# Marcar como completa
```

### 5.2 Verificar Git Integration

Se `autoCommit: true` e `createPR: true`:

- [ ] Commit automático criado
- [ ] Branch criado com padrão correto
- [ ] PR criado automaticamente
- [ ] Issue linkada ao PR

### 5.3 Teste Manual Git Operations

```
@github-pm *git-ops
```

## Passo 6: Teste de Workflow Completo

### 6.1 Criar Workflow Plan

```
@ai-squad-orchestrator *plan
```

### 6.2 Executar Workflow com GitHub Integration

1. Criar múltiplas stories
2. Verificar criação automática de issues
3. Simular desenvolvimento
4. Verificar sincronização de status
5. Completar workflow
6. Verificar estado final no GitHub

## Troubleshooting

### Problemas Comuns

#### 1. Erro de Autenticação

```bash
# Reautenticar
gh auth logout
gh auth login --scopes repo,project,write:org
```

#### 2. Project ID Incorreto

```bash
# Listar projetos
gh project list
# Obter ID correto do projeto
```

#### 3. Permissões Insuficientes

- Verificar se usuário tem admin access no repo
- Verificar se Projects V2 está habilitado
- Verificar permissões do token

#### 4. Sync Issues

```
@github-pm *validate-config
# Verificar logs de erro
# Checar rate limiting GitHub API
```

### Logs de Debug

```bash
# Verificar logs AI-SQUAD
cat .ai/debug-log.md

# Verificar configuração
cat .ai-squad-core/core-config.yaml | grep -A 20 github
```

## Testes Avançados

### 1. Teste de Epic Management

- Criar epic com múltiplas stories
- Verificar criação de milestone
- Testar progresso de epic

### 2. Teste de Bulk Operations

- Criar múltiplas stories
- Testar sync em massa
- Verificar performance

### 3. Teste de Conflict Resolution

- Modificar issue no GitHub e localmente
- Executar sync
- Testar resolução de conflitos

### 4. Teste de Webhook Integration

- Configurar webhooks (avançado)
- Testar sync em tempo real
- Verificar notificações

## Validação Final

### Checklist de Sucesso

- [ ] GitHub PM agent responde corretamente
- [ ] Issues são criadas automaticamente
- [ ] Kanban board reflete status correto
- [ ] Sincronização bidirecional funciona
- [ ] Git operations integram com GitHub
- [ ] Workflow completo funciona end-to-end
- [ ] Conflitos são resolvidos apropriadamente
- [ ] Performance é aceitável

### Métricas de Sucesso

- Tempo de sync < 30 segundos
- 100% das issues criadas corretamente
- 0 erros de autenticação
- Sync bidirecional sem perda de dados

## Próximos Passos

Após testes bem-sucedidos:

1. Configurar para uso em produção
2. Treinar equipe no uso da integração
3. Configurar monitoring e alertas
4. Estabelecer procedimentos de manutenção

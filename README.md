# EstéticaIA - Clínica de Estética com Assistente Virtual Híbrida 🌟

🌐 **Acesse o projeto rodando ao vivo:** [https://4-site-clinica.vercel.app/](https://4-site-clinica.vercel.app/)

Este projeto é uma plataforma *premium* para clínicas de estética, combinando um design altamente polido e responsivo com a **Luna**, uma assistente virtual de Inteligência Artificial desenhada sob uma arquitetura de máquina de estados estrita. O objetivo é converter leads com empatia, enquanto blinda a clínica contra alucinações de IA durante a triagem médica e o agendamento.

## 🚀 Arquitetura "Jaula Híbrida" (Hybrid State Machine)

O grande diferencial deste projeto não é apenas integrar um LLM genérico, mas controlar rigorosamente **como** e **quando** a IA atua:

1. **Fase de Encantamento (Dinâmica):** O usuário conversa naturalmente. A IA usa empatia para quebrar objeções de preços, explicar procedimentos (ex: Preenchimento Labial, Peeling) e agir como uma consultora comercial.
2. **Fase de Triagem (Estática e Controlada):** Assim que a intenção de agendamento é detectada, o cérebro gerativo da IA é desligado. O sistema entra num *loop* robótico de triagem clínica (avaliando riscos como gravidez, Roacutan, infecções).
3. **Fase de Cadastro (LGPD):** O sistema coleta Nome e WhatsApp assegurando proteção sob a LGPD, usando *prompts* estáticos.
4. **Handoff Inteligente:** O histórico completo da conversa, a análise clínica e os dados da pessoa são codificados e enviados perfeitamente formatados para o WhatsApp de uma secretária humana para fechar o agendamento.

## 💻 Stack de Tecnologias

- **Frontend:** Vanilla HTML5, CSS3 e TypeScript (garantindo tipagem segura e carregamento instantâneo no celular).
- **API Serverless:** Código estruturado em Node.js com TypeScript, rodando diretamente nas Edge Functions da Vercel (sem necessidade de um servidor backend tradicional rodando 24h).
- **Integração IA:** Groq API (LLaMA-3 70B Versatile) para classificação de intenções e respostas dinâmicas em milissegundos.
- **Deploy/Infraestrutura:** Vercel (Serverless Functions via `/api`), projetado para tolerância a falhas e arquitetura 100% *stateless*.

## 🛠️ Como Rodar Localmente

1. **Clone o repositório:**
   ```bash
   git clone https://github.com/brunoferreirasalustiano/4-site-clinica.git
   cd 4-site-clinica
   ```

2. **Instale as dependências:**
   ```bash
   npm install
   ```

3. **Configure as Variáveis de Ambiente:**
   Crie um arquivo `.env` na raiz do projeto e insira sua chave da API da Groq:
   ```env
   GROQ_API_KEY=sua_chave_api_aqui
   ```

4. **Inicie o Servidor:**
   ```bash
   npm run dev
   ```
   > O frontend estará disponível em `http://localhost:3000`

## 🧠 Características Técnicas de Destaque

* **Gestão de Contexto no Cliente:** Para sobreviver ao ambiente *Serverless* da Vercel (que "desliga" a memória a cada requisição), todo o estado do chat (histórico, riscos, etapa atual) transita via `localStorage` e viaja no `body` da requisição HTTP. 
* **Tolerância EROFS (Read-Only):** O sistema de salvamento detecta automaticamente se está em ambiente de produção (Vercel) e redireciona os salvamentos do `agendamentos.json` para a pasta temporária `/tmp`, anulando erros de disco protegido.
* **Indicadores de UX:** A interface inclui um "Digitando..." animado e suporte nativo à renderização de *Markdown* para destacar preços e alertas médicos retornados pela IA.

---
*Projeto iniciado em 28 de março de 2026. Constantemente refatorado para portfólio.*

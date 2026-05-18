export type LunaIntent =
  | 'agendar'
  | 'cancelar'
  | 'remarcar'
  | 'duvida_preco'
  | 'duvida_procedimento'
  | 'duvida_combo'
  | 'duvida_geral'
  | 'duvida_seguranca'
  | 'duvida_contraindicacao'
  | 'duvida_pos_procedimento'
  | 'objecao_preco'
  | 'comparacao'
  | 'localizacao'
  | 'horario_funcionamento'
  | 'formas_pagamento'
  | 'atendimento_humano'
  | 'sinal_alerta'
  | 'reclamacao'
  | 'saudacao'
  | 'desconhecido';

export interface AIIntentResult {
  intent: LunaIntent;
  servico: string;
  data: string;
  mensagemOriginal: string;
}

export type LunaRisco = 'baixo' | 'medio' | 'alto';

export type LunaEtapa =
  | 'inicio'
  | 'orientacao'
  | 'anamnese'
  | 'cadastro'
  | 'agendamento'
  | 'encaminhar_humano'
  | 'bloqueado_risco';

export interface LunaContexto {
  sessionId: string;
  etapa: LunaEtapa;
  risco: LunaRisco;
  servicoAtual: string;
  objetivo: string;
  sinaisAlerta: string[];
  respostasAnamnese: Record<string, string>;
  pendenciasAnamnese: string[];
  clienteNome?: string;
  clienteTelefone?: string;
  pendenciasCadastro?: string[];
  mensagens: Array<{
    origem: 'cliente' | 'luna';
    texto: string;
  }>;
}

export interface Funcionario {
  id: string;
  nome: string;
  especialidade: string;
  email: string;
  status: 'Ativo' | 'Ferias' | 'Inativo';
}

export interface Cliente {
  id: string;
  nome: string;
  telefone: string;
  email?: string;
}

export interface Servico {
  id: string;
  nome: string;
  descricao: string;
  duracaoMinutos: number;
  preco: number;
}

import { gerarResposta } from './respostaService';
import type { LunaIntent } from '../types/index';

type CasoTreino = {
    nivel: 'facil' | 'medio' | 'dificil' | 'clinico';
    pergunta: string;
    intent: LunaIntent;
    servico: string;
};

const casos: CasoTreino[] = [
    { nivel: 'facil', pergunta: 'Oi, tudo bem?', intent: 'saudacao', servico: '' },
    { nivel: 'facil', pergunta: 'Quanto custa limpeza de pele?', intent: 'duvida_preco', servico: 'Limpeza de Pele' },
    { nivel: 'facil', pergunta: 'Quais procedimentos vocês fazem?', intent: 'duvida_geral', servico: '' },
    { nivel: 'facil', pergunta: 'Aceita cartão?', intent: 'formas_pagamento', servico: '' },
    { nivel: 'facil', pergunta: 'Quero marcar peeling amanhã', intent: 'agendar', servico: 'Peeling Quimico' },

    { nivel: 'medio', pergunta: 'Meu rosto está cheio de pontinhos pretos, o que resolve?', intent: 'duvida_procedimento', servico: 'Limpeza de Pele' },
    { nivel: 'medio', pergunta: 'Peeling deixa o rosto muito vermelho?', intent: 'duvida_pos_procedimento', servico: 'Peeling Quimico' },
    { nivel: 'medio', pergunta: 'Tenho medo de preencher a boca e ficar artificial', intent: 'duvida_procedimento', servico: 'Preenchimento Labial' },
    { nivel: 'medio', pergunta: 'Tem pacote para limpeza e peeling?', intent: 'duvida_combo', servico: 'Limpeza de Pele, Peeling Quimico' },
    { nivel: 'medio', pergunta: 'Onde fica a clínica?', intent: 'localizacao', servico: '' },

    { nivel: 'dificil', pergunta: 'Quero dar um talento no rosto sem gastar muito', intent: 'objecao_preco', servico: 'Limpeza de Pele' },
    { nivel: 'dificil', pergunta: 'Grávida pode passar ácido no rosto?', intent: 'duvida_contraindicacao', servico: 'Peeling Quimico' },
    { nivel: 'dificil', pergunta: 'Queria boca bonita, mas sem aquela boca exagerada', intent: 'duvida_procedimento', servico: 'Preenchimento Labial' },
    { nivel: 'dificil', pergunta: 'Qual é melhor para pele manchada, limpeza ou peeling?', intent: 'comparacao', servico: 'Limpeza de Pele, Peeling Quimico' },
    { nivel: 'dificil', pergunta: 'Deu ruim no meu procedimento, quero falar com alguém', intent: 'reclamacao', servico: '' },

    { nivel: 'clinico', pergunta: 'Tenho melasma, peeling resolve?', intent: 'duvida_procedimento', servico: 'Peeling Quimico' },
    { nivel: 'clinico', pergunta: 'Usei Roacutan mês passado, posso fazer peeling?', intent: 'duvida_contraindicacao', servico: 'Peeling Quimico' },
    { nivel: 'clinico', pergunta: 'Estou com herpes ativa, posso preencher a boca?', intent: 'duvida_contraindicacao', servico: 'Preenchimento Labial' },
    { nivel: 'clinico', pergunta: 'Depois do preenchimento meu lábio ficou com muita dor e roxo escuro', intent: 'sinal_alerta', servico: 'Preenchimento Labial' },
    { nivel: 'clinico', pergunta: 'Tenho uma pinta crescendo e sangrando, vocês removem?', intent: 'sinal_alerta', servico: '' },
    { nivel: 'clinico', pergunta: 'Minha acne está inflamada e dolorida, faço limpeza?', intent: 'duvida_seguranca', servico: 'Limpeza de Pele' },
    { nivel: 'clinico', pergunta: 'Posso tomar sol depois do peeling?', intent: 'duvida_pos_procedimento', servico: 'Peeling Quimico' }
];

function executarTreino() {
    console.log('Treino offline da Luna');
    console.log('======================');

    casos.forEach((caso, index) => {
        const resposta = gerarResposta(caso.intent, caso.servico);

        console.log(`\n${index + 1}. [${caso.nivel.toUpperCase()}] ${caso.pergunta}`);
        console.log(`Intent esperada: ${caso.intent}`);
        console.log(`Serviço: ${caso.servico || 'nenhum'}`);
        console.log(`Resposta: ${resposta}`);
    });

    console.log(`\nTotal de casos: ${casos.length}`);
}

executarTreino();

import type { AIIntentResult, LunaContexto, LunaIntent, LunaRisco } from '../types/index';

type ServicoInfo = {
    preco: number;
    descricao: string;
    indicadoPara: string;
    duracao: string;
    recuperacao: string;
    cuidados: string;
    observacaoClinica: string;
};

const SERVICOS: Record<string, ServicoInfo> = {
    'Limpeza de Pele': {
        preco: 150,
        descricao: 'higienizacao profunda, emoliencia, extracao cuidadosa de comedoes e finalizacao calmante',
        indicadoPara: 'cravos, poros obstruidos, oleosidade, textura irregular leve e pele opaca',
        duracao: '60 a 90 minutos',
        recuperacao: 'pode deixar leve vermelhidao ou sensibilidade no mesmo dia',
        cuidados: 'evitar sol forte, acidos, esfoliantes e maquiagem pesada por 24 horas',
        observacaoClinica: 'acne inflamada, lesoes doloridas ou suspeita de infeccao precisam de avaliacao antes'
    },
    'Peeling Quimico': {
        preco: 300,
        descricao: 'uso controlado de ativos esfoliantes para estimular renovacao cutanea',
        indicadoPara: 'manchas superficiais, textura irregular, poros aparentes, viço e marcas leves de acne',
        duracao: '30 a 45 minutos',
        recuperacao: 'pode causar ardor leve, vermelhidao e descamacao nos dias seguintes',
        cuidados: 'usar protetor solar, evitar sol direto e pausar acidos conforme orientacao',
        observacaoClinica: 'melasma, fototipo alto, pele sensibilizada ou isotretinoina exigem avaliacao individual'
    },
    'Preenchimento Labial': {
        preco: 800,
        descricao: 'aplicacao de acido hialuronico para contorno, hidratacao e volume labial',
        indicadoPara: 'labios finos, perda de contorno, assimetria leve e volume com naturalidade',
        duracao: '40 a 60 minutos',
        recuperacao: 'pode causar inchaco, sensibilidade e pequenos roxos nos primeiros dias',
        cuidados: 'evitar calor intenso, massagem local e atividade fisica pesada por 24 horas',
        observacaoClinica: 'deve ser feito por profissional habilitado e com produto regularizado'
    }
};

const PERGUNTAS_ANAMNESE = [
    'Voce esta gravida ou amamentando?',
    'Tem alergias importantes, herpes ativa ou alguma infeccao/ferida na pele agora?',
    'Usou isotretinoina/Roacutan, acidos fortes ou fez procedimento recente?',
    'Sua pele esta sensivel, queimada de sol, com acne inflamada ou dor?',
    'Qual periodo voce prefere para atendimento: manha ou tarde?'
];

function servicosIdentificados(servico: string): string[] {
    return Object.keys(SERVICOS).filter(nome => servico.includes(nome));
}

function formatarMoeda(valor: number): string {
    return `R$ ${valor.toFixed(2).replace('.', ',')}`;
}

function nomeServico(servico: string): string {
    const nomes = servicosIdentificados(servico);
    if (nomes.length === 0) return servico || 'o procedimento';
    if (nomes.length === 1) return nomes[0];
    return nomes.join(', ');
}

function calcularRisco(analise: AIIntentResult, contexto?: LunaContexto): LunaRisco {
    if (analise.intent === 'sinal_alerta' || contexto?.sinaisAlerta.length) return 'alto';
    if (['duvida_contraindicacao', 'reclamacao', 'duvida_seguranca'].includes(analise.intent)) return 'medio';
    return contexto?.risco || 'baixo';
}

function resumoContexto(contexto?: LunaContexto): string {
    if (!contexto?.servicoAtual) return '';
    return `\n\nPelo que conversamos ate agora, estou considerando: ${contexto.servicoAtual}.`;
}

function perguntaAnamnese(contexto?: LunaContexto): string {
    const pendencias = contexto?.pendenciasAnamnese?.length ? contexto.pendenciasAnamnese : PERGUNTAS_ANAMNESE;
    return pendencias.slice(0, 3).map((pergunta, index) => `${index + 1}. ${pergunta}`).join('\n');
}

export function gerarResposta(
    intentOrAnalise: LunaIntent | string | AIIntentResult,
    servicoParam = '',
    contexto?: LunaContexto
): string {
    const analise: AIIntentResult = typeof intentOrAnalise === 'object'
        ? intentOrAnalise
        : { intent: intentOrAnalise as LunaIntent, servico: servicoParam, data: 'nao informada', mensagemOriginal: '' };

    const intent = analise.intent;
    const servico = analise.servico || contexto?.servicoAtual || '';
    const nomes = servicosIdentificados(servico);
    const alvo = nomeServico(servico);
    const valorTotal = nomes.reduce((total, nome) => total + SERVICOS[nome].preco, 0);
    const info = nomes.length === 1 ? SERVICOS[nomes[0]] : null;
    const risco = calcularRisco(analise, contexto);

    if (risco === 'alto') {
        return 'Pelo que voce descreveu, isso precisa de avaliacao profissional antes de qualquer procedimento estetico. Dor forte, roxo escuro progressivo, pus, febre, bolhas, falta de ar, ferida que nao cicatriza, pinta mudando ou reacao apos preenchimento nao devem ser resolvidos por chat. Vou priorizar atendimento humano; se houver falta de ar, necrose, dor intensa ou piora rapida, procure atendimento medico imediatamente.';
    }

    if (contexto?.etapa === 'cadastro') {
        const pendencias = contexto.pendenciasCadastro || [];
        const proxima = pendencias[0] || 'Por favor, informe seu nome completo.';
        if (pendencias.length === 1 && proxima.includes('telefone')) {
            return `Perfeito, recebi seu nome! Agora só falta mais uma informação para concluirmos:\n\n👉 **${proxima}**`;
        }
        return `Ótimo! Sua triagem clínica foi concluída com sucesso e você está apta(o) para o procedimento de ${alvo}.\n\nPara fazer o seu **agendamento real**, preciso registrar sua ficha. *Fique tranquila, seus dados estão totalmente seguros e protegidos em conformidade com a LGPD (Lei Geral de Proteção de Dados).* 🔒\n\n👉 **${proxima}**`;
    }

    if (contexto?.etapa === 'agendamento') {
        return `🎉 **AGENDAMENTO REGISTRADO COM SUCESSO!** 🎉\n\nExcelente, ${contexto.clienteNome || 'cliente'}! O seu agendamento para **${alvo}** foi confirmado e salvo em nosso sistema de agendamentos reais!\n\n📋 **Ficha do Agendamento:**\n👤 **Nome:** ${contexto.clienteNome}\n📱 **WhatsApp:** ${contexto.clienteTelefone}\n📅 **Período:** ${contexto.respostasAnamnese['periodo'] || 'A combinar'}\n💵 **Investimento:** ${formatarMoeda(valorTotal)} (parcelamento disponível em até 2x sem juros no Cartão)\n\nNossa equipe já recebeu sua ficha e entrará em contato em breve para definir o horário exato da sua consulta. Se quiser falar direto com nossa recepção agora, clique no botão verde abaixo!`;
    }

    if (intent === 'agendar') {
        return `Perfeito. Antes de encaminhar o agendamento de ${alvo}, vou fazer uma triagem rapida para seguranca:\n${perguntaAnamnese(contexto)}\n\nPode responder em uma mensagem so.`;
    }

    const respostas: Partial<Record<LunaIntent, string>> = {
        saudacao: 'Ola! Sou a Luna. Eu consigo te orientar como uma triagem estetica: entendo sua queixa, explico indicacoes, vejo riscos basicos e so depois sugiro o melhor caminho. Me diga: o foco e cravos/oleosidade, manchas/textura ou labios?',

        duvida_geral: 'Atendo por objetivo: cravos e oleosidade costumam apontar para Limpeza de Pele; manchas, textura e viço podem apontar para Peeling Quimico; contorno, hidratacao e volume dos labios apontam para Preenchimento Labial. Se houver dor, ferida, infeccao, pinta mudando ou reacao recente, eu priorizo avaliacao profissional.',

        duvida_procedimento: info
            ? `${alvo}: ${info.descricao}. Indicado para ${info.indicadoPara}. Dura em media ${info.duracao}. Recuperacao: ${info.recuperacao}. Observacao: ${info.observacaoClinica}.${resumoContexto(contexto)}`
            : `Me descreva a queixa principal: cravos/oleosidade, manchas/textura, acne, sensibilidade ou labios. Com isso eu consigo orientar melhor sem fingir diagnostico.`,

        duvida_preco: nomes.length > 0
            ? `${nomes.length > 1 ? 'Esses procedimentos juntos ficam' : `O investimento para ${alvo} fica`} em ${formatarMoeda(valorTotal)}. Antes de fechar, eu faco uma triagem para confirmar contraindicacoes e evitar indicar algo que nao seja seguro.`
            : 'Valores: Limpeza de Pele R$ 150,00, Peeling Quimico R$ 300,00 e Preenchimento Labial R$ 800,00. Se voce me contar sua queixa, eu digo qual faz mais sentido primeiro.',

        duvida_combo: 'O Combo Glow combina Limpeza de Pele + Peeling Quimico: de R$ 450,00 por R$ 380,00. Ele e mais interessante para poros obstruidos, pele opaca e textura irregular leve. Se houver acne inflamada, pele sensibilizada, melasma ativo ou uso recente de acidos/isotretinoina, precisa avaliacao antes.',

        duvida_seguranca: 'Seguranca depende de triagem. Eu verifico gestacao, amamentacao, alergias, herpes, infeccao ativa, medicamentos, isotretinoina, pele sensibilizada e historico de reacoes. Sem isso, a indicacao fica incompleta.',

        duvida_contraindicacao: 'Esse ponto pede cuidado. Gestacao, amamentacao, herpes ativa, infeccao, ferida, queimadura solar, uso recente de isotretinoina/Roacutan, acidos fortes, queloide, imunossupressao ou alergias importantes podem mudar ou impedir a conduta. O ideal e avaliacao profissional antes de agendar.',

        duvida_pos_procedimento: info
            ? `Depois de ${alvo}: ${info.cuidados}. E esperado que ${info.recuperacao}. Sinais fora do esperado: dor forte, piora progressiva, secrecao, bolhas, febre, mudanca de cor importante ou falta de ar.`
            : 'Depois de procedimentos esteticos, em geral: protetor solar, evitar sol direto, nao cutucar, pausar acidos conforme orientacao e avisar a clinica se houver piora, dor forte, bolhas, pus ou febre.',

        objecao_preco: `Entendo. O mais barato nem sempre e o mais seguro: em estetica entram avaliacao, tecnica, produto, biosseguranca e acompanhamento. Para comecar com menor investimento, Limpeza de Pele sai por ${formatarMoeda(SERVICOS['Limpeza de Pele'].preco)} e costuma ser boa porta de entrada para cravos/oleosidade.`,

        comparacao: 'Comparando: Limpeza de Pele e melhor para cravos, poros e oleosidade; Peeling Quimico e mais voltado para manchas superficiais, textura e renovacao; Preenchimento Labial trata contorno, hidratacao e volume. Melasma, acne inflamada, rosacea ou lesoes suspeitas pedem avaliacao individual.',

        formas_pagamento: 'Aceitamos PIX e cartao. Dependendo do procedimento, verificamos parcelamento. A liberacao do procedimento ainda depende da triagem de seguranca.',

        localizacao: 'Estamos atendendo na clinica. Para endereco, disponibilidade e orientacao final, posso encaminhar para WhatsApp com o resumo da sua triagem.',

        horario_funcionamento: 'Temos horarios pela manha e a tarde, conforme agenda. Me diga o periodo desejado e responda a triagem de seguranca antes de confirmar.',

        atendimento_humano: 'Claro. Vou encaminhar para a equipe. Se for dor, reacao, infeccao, alergia, herpes ativa, preenchimento recente ou lesao suspeita, avise isso logo no inicio.',

        reclamacao: 'Sinto muito por isso. Me diga qual procedimento foi feito, quando foi, quais sintomas apareceram e se esta piorando. Se houver dor forte, febre, secrecao, bolhas, necrose, falta de ar ou inchaco progressivo, procure atendimento medico imediatamente.',

        remarcar: 'Claro, me envie o horario atual e duas opcoes melhores. Se houve alguma reacao ou mudanca de saude desde o agendamento, me avise antes.',

        cancelar: 'Tudo bem. Me envie o nome usado no agendamento e o horario marcado para cancelarmos com seguranca.',

        desconhecido: 'Quero te orientar com precisao. Me diga se sua duvida e sobre: indicacao para sua pele, preco, seguranca, contraindicacoes, cuidados depois ou agendamento.'
    };

    return respostas[intent as LunaIntent] || respostas.desconhecido!;
}

export function perguntasAnamnesePadrao(): string[] {
    return [...PERGUNTAS_ANAMNESE];
}

import axios from 'axios';
import * as Types from '../types/index.js';
import { carregarEnv } from './env.js';

carregarEnv();

const GROQ_API_KEY = process.env.GROQ_API_KEY || 'COLOQUE_SUA_CHAVE_GROQ_AQUI';
const API_URL = 'https://api.groq.com/openai/v1/chat/completions';

const SYSTEM_PROMPT = `Voce e a Luna, assistente comercial e consultora de triagem estetica de uma clinica.
Sua linguagem deve demonstrar conhecimento em dermatologia estetica, mas voce NAO diagnostica doencas, NAO prescreve medicamentos e NAO substitui dermatologista.
Sua tarefa neste endpoint e classificar a mensagem do cliente em JSON. Responda APENAS JSON valido.

FORMATO OBRIGATORIO:
{
  "intent": "agendar" | "cancelar" | "remarcar" | "duvida_preco" | "duvida_combo" | "duvida_procedimento" | "duvida_geral" | "duvida_seguranca" | "duvida_contraindicacao" | "duvida_pos_procedimento" | "objecao_preco" | "comparacao" | "localizacao" | "horario_funcionamento" | "formas_pagamento" | "atendimento_humano" | "sinal_alerta" | "reclamacao" | "saudacao" | "desconhecido",
  "servico": "string|null",
  "data": "string|null"
}

SERVICOS OFICIAIS:
1. "Limpeza de Pele"
   Indicado para: cravos, comedoes, poros obstruidos, oleosidade, textura irregular leve, pele opaca.
   Linguagem comum: "pontinhos pretos", "pele carregada", "rosto grosseiro", "limpar poros", "tirar impurezas".

2. "Peeling Quimico"
   Indicado para: manchas superficiais, textura irregular, viço, marcas leves de acne, poros aparentes, renovacao cutanea.
   Linguagem comum: "passar acido", "descamar", "trocar de pele", "clarear manchas", "mancha de sol", "melasma".

3. "Preenchimento Labial"
   Indicado para: contorno labial, hidratacao, assimetria leve, volume, labios finos.
   Linguagem comum: "boca desenhada", "labio sumiu", "boca sem exagero", "sem boca de pato".

REGRAS CLINICAS DE TRIAGEM:
- Se houver ferida aberta, pus, febre, dor forte, alergia intensa, falta de ar, necrose, bolhas, queimadura, infeccao, herpes ativa, pinta mudando, sangramento espontaneo, lesao que nao cicatriza, ou complicacao apos preenchimento, use intent "sinal_alerta".
- Se o cliente relata insatisfacao, atraso, complicacao ou "deu ruim" apos procedimento, use "reclamacao", exceto se houver sinal de alerta forte; nesse caso use "sinal_alerta".
- Gravidez, amamentacao, isotretinoina/Roacutan, alergia, diabetes, imunossupressao, queloide, pele machucada, uso intenso de acidos ou queimadura solar: "duvida_contraindicacao".
- Perguntas sobre risco, seguranca, produto, profissional habilitado, medo de dar errado: "duvida_seguranca".
- Perguntas sobre sol, academia, maquiagem, descamacao, inchaco, roxos, dor leve, recuperacao: "duvida_pos_procedimento".
- Perguntas comparando objetivos ou procedimentos: "comparacao".

REGRAS COMERCIAIS:
- saudacao: oi, ola, bom dia, inicio sem pedido claro.
- duvida_geral: pergunta servicos, procedimentos ou pede orientacao ampla.
- duvida_preco: pergunta valor, preco, tabela, investimento.
- objecao_preco: achou caro, pede mais barato, sem dinheiro, quer economizar.
- duvida_combo: pacote, combo, promocao, desconto.
- agendar: quer marcar, reservar, fechar, consultar vaga, informa dia/horario.
- atendimento_humano: pede pessoa, atendente, profissional, WhatsApp.
- localizacao, horario_funcionamento, formas_pagamento conforme assunto.

REGRAS DE SERVICO:
- Use exatamente os nomes oficiais.
- Se houver mais de um, separe por virgula.
- Se disser "todos", "os tres" ou "pacote completo", retorne os tres.
- Se quer agendar sem citar servico, use "Procedimentos Escolhidos".
- Se nao houver servico, use null.

REGRAS DE DATA:
- Preserve datas e periodos: "amanha", "sabado", "hoje a tarde", "dia 20", "manha".
- Se quer agendar sem data, use "A combinar".
- Se nao houver data, use null.

EXEMPLOS:
"Minha pinta esta crescendo e sangrou" -> {"intent":"sinal_alerta","servico":null,"data":null}
"Depois do preenchimento meu labio ficou roxo e com muita dor" -> {"intent":"sinal_alerta","servico":"Preenchimento Labial","data":null}
"Tenho herpes ativa, posso preencher?" -> {"intent":"duvida_contraindicacao","servico":"Preenchimento Labial","data":null}
"Usei Roacutan recentemente, posso fazer peeling?" -> {"intent":"duvida_contraindicacao","servico":"Peeling Quimico","data":null}
"Melasma melhora com peeling?" -> {"intent":"duvida_procedimento","servico":"Peeling Quimico","data":null}
"Qual e melhor para cravos e oleosidade?" -> {"intent":"comparacao","servico":"Limpeza de Pele","data":null}
"Quero uma boca natural, sem exagero" -> {"intent":"duvida_procedimento","servico":"Preenchimento Labial","data":null}
"Quanto custa limpeza de pele?" -> {"intent":"duvida_preco","servico":"Limpeza de Pele","data":null}
"Quero limpeza e peeling sabado de manha" -> {"intent":"agendar","servico":"Limpeza de Pele, Peeling Quimico","data":"sabado de manha"}`;

function normalizarIntent(intent: string): Types.LunaIntent {
    const intents: Types.LunaIntent[] = [
        'agendar',
        'cancelar',
        'remarcar',
        'duvida_preco',
        'duvida_procedimento',
        'duvida_combo',
        'duvida_geral',
        'duvida_seguranca',
        'duvida_contraindicacao',
        'duvida_pos_procedimento',
        'objecao_preco',
        'comparacao',
        'localizacao',
        'horario_funcionamento',
        'formas_pagamento',
        'atendimento_humano',
        'sinal_alerta',
        'reclamacao',
        'saudacao',
        'desconhecido'
    ];

    return intents.includes(intent as Types.LunaIntent) ? intent as Types.LunaIntent : 'desconhecido';
}

function normalizarTexto(mensagem: string): string {
    return mensagem
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .toLowerCase()
        .trim();
}

function analisarMensagemLocal(mensagem: string): Types.AIIntentResult {
    const texto = normalizarTexto(mensagem);
    const contem = (termos: string[]) => termos.some(termo => texto.includes(normalizarTexto(termo)));

    let intent: Types.LunaIntent = 'desconhecido';
    let servico = '';
    let data = 'não informada';

    if (contem(['limpeza', 'comedao', 'comedoes', 'cravo', 'cravos', 'espinha', 'espinhas', 'oleosa', 'oleosidade', 'poros', 'pontos pretos', 'pontinhos pretos'])) {
        servico = 'Limpeza de Pele';
    }

    if (contem(['peeling', 'mancha', 'manchas', 'melasma', 'acido', 'acne', 'cicatriz de acne', 'marca de acne', 'descamar', 'textura', 'renovar pele'])) {
        servico = servico ? `${servico}, Peeling Quimico` : 'Peeling Quimico';
    }

    if (contem(['labio', 'labios', 'boca', 'preenchimento', 'acido hialuronico', 'volume labial', 'contorno labial'])) {
        servico = servico ? `${servico}, Preenchimento Labial` : 'Preenchimento Labial';
    }

    if (contem(['amanha', 'hoje', 'sabado', 'domingo', 'segunda', 'terca', 'quarta', 'quinta', 'sexta', 'manha', 'tarde', 'noite', 'dia '])) {
        data = mensagem;
    }

    if (contem(['falta de ar', 'necrose', 'pele preta', 'muita dor', 'dor forte', 'pus', 'secrecao', 'febre', 'bolha', 'bolhas', 'queimadura', 'ferida aberta', 'nao cicatriza', 'não cicatriza', 'pinta mudou', 'pinta crescendo', 'sangrou', 'sangramento', 'infeccao', 'infecção', 'roxo escuro', 'livedo', 'visao embaçada'])) {
        intent = 'sinal_alerta';
    } else if (/^(oi|ola|olá|bom dia|boa tarde|boa noite|e ai|eai|opa|tudo bem)[!. ]*$/.test(texto)) {
        intent = 'saudacao';
    } else if (/^(duvida|dúvida|tenho duvida|tenho dúvida)$/.test(texto)) {
        intent = 'duvida_geral';
    } else if (contem(['deu ruim', 'problema', 'reclamacao', 'reclamação', 'insatisfeito', 'nao gostei', 'não gostei'])) {
        intent = 'reclamacao';
    } else if (contem(['gravida', 'grávida', 'gestante', 'amamentando', 'alergia', 'diabetes', 'isotretinoina', 'roacutan', 'queloide', 'herpes', 'imunossuprimido', 'pele machucada', 'queimado de sol', 'queimada de sol'])) {
        intent = 'duvida_contraindicacao';
    } else if (contem(['preco', 'preço', 'valor', 'quanto', 'custa', 'investimento', 'tabela'])) {
        intent = 'duvida_preco';
    } else if (contem(['caro', 'barato', 'desconto', 'mais em conta', 'sem gastar muito', 'economizar'])) {
        intent = 'objecao_preco';
    } else if (contem(['combo', 'pacote', 'promocao', 'promoção'])) {
        intent = 'duvida_combo';
    } else if (contem(['agenda', 'agendar', 'marcar', 'horario', 'horário', 'vaga', 'fechar', 'quero fazer'])) {
        intent = 'agendar';
        if (!servico) servico = 'Procedimentos Escolhidos';
        if (data === 'não informada') data = 'A combinar';
    } else if (contem(['cartao', 'cartão', 'pix', 'parcel', 'pagamento'])) {
        intent = 'formas_pagamento';
    } else if (contem(['endereco', 'endereço', 'onde fica', 'localizacao', 'localização'])) {
        intent = 'localizacao';
    } else if (contem(['abre', 'atende', 'funciona', 'sabado', 'horario de funcionamento'])) {
        intent = 'horario_funcionamento';
    } else if (contem(['servicos', 'serviços', 'procedimentos', 'o que voces fazem', 'o que vocês fazem'])) {
        intent = 'duvida_geral';
    } else if (contem(['seguro', 'risco', 'medo', 'perigoso', 'produto', 'profissional habilitado'])) {
        intent = 'duvida_seguranca';
    } else if (contem(['depois', 'pos', 'pós', 'sol', 'academia', 'maquiagem', 'recuperacao', 'recuperação', 'inchaco', 'inchaço', 'roxo', 'roxinho', 'descamacao'])) {
        intent = 'duvida_pos_procedimento';
    } else if (contem(['qual melhor', 'qual e melhor', 'diferença', 'diferenca', 'comparar', 'ou'])) {
        intent = 'comparacao';
    } else if (contem(['atendente', 'humano', 'pessoa', 'whatsapp', 'profissional'])) {
        intent = 'atendimento_humano';
    } else if (/^(nao|não|sim|nenhuma|nada|manha|tarde|noite|prefiro manha|prefiro tarde)[!. ]*$/.test(texto)) {
        intent = 'agendar';
        if (!servico) servico = 'Procedimentos Escolhidos';
        if (data === 'não informada') data = 'A combinar';
    } else if (servico) {
        intent = 'duvida_procedimento';
    }

    return { intent, servico, data, mensagemOriginal: mensagem };
}

export async function analisarMensagemCliente(mensagem: string): Promise<Types.AIIntentResult> {
    const analiseLocal = analisarMensagemLocal(mensagem);

    try {
        const response = await axios.post(API_URL, {
            model: 'llama-3.3-70b-versatile',
            messages: [
                { role: 'system', content: SYSTEM_PROMPT },
                { role: 'user', content: mensagem }
            ],
            response_format: { type: 'json_object' }
        }, {
            headers: {
                Authorization: `Bearer ${GROQ_API_KEY}`,
                'Content-Type': 'application/json'
            }
        });

        const parsed = response.data.choices[0].message.content;
        const data = typeof parsed === 'string' ? JSON.parse(parsed) : parsed;

        const resultado: Types.AIIntentResult = {
            intent: normalizarIntent(data.intent || 'desconhecido'),
            servico: data.servico && data.servico !== 'null' ? data.servico : '',
            data: data.data && data.data !== 'null' ? data.data : 'não informada',
            mensagemOriginal: mensagem
        };

        if (resultado.intent === 'desconhecido' && analiseLocal.intent !== 'desconhecido') {
            return analiseLocal;
        }

        return resultado;
    } catch (error: any) {
        console.error('Erro no Groq:', error.response?.data || error.message);
        return analiseLocal;
    }
}

const SYSTEM_PROMPT_RESPOSTA = `Voce e a Luna, a assistente inteligente e consultora de triagem estetica da nossa clinica.
Sua missao e responder a pergunta do cliente de forma humanizada, empatica, altamente profissional e alinhada com as regras de negocio e medicas da clinica.

DADOS OFICIAIS DA CLINICA:
1. "Limpeza de Pele": R$ 150,00 | Duracao: 60-90 min. Higienizacao profunda, emoliencia, extracao de cravos e finalizacao calmante. Indicado para cravos, poros obstruidos e oleosidade. Evitar sol, acidos fortes e maquiagem por 24h.
2. "Peeling Quimico": R$ 300,00 | Duracao: 30-45 min. Ativos esfoliantes para renovacao da pele. Indicado para manchas de sol, melasma, marcas de acne e textura. Pode descamar, arder leve e ficar vermelho nos dias seguintes. Usar protetor solar, evitar sol e pausar acidos de uso domiciliar.
3. "Preenchimento Labial": R$ 800,00 | Duracao: 40-60 min. Aplicacao de acido hialuronico para volume, contorno e hidratacao. Pode causar inchaco leve, sensibilidade e pequenos roxos nos primeiros dias. Evitar calor, massagem local e esforco fisico pesado por 24h.
4. "Combo Glow": Limpeza de Pele + Peeling Quimico de R$ 450,00 por R$ 380,00. Excelente para poros e renovacao, mas contraindicado para melasma ativo, acne inflamada ou pele sensibilizada sem avaliacao.

FORMAS DE PAGAMENTO:
- Aceitamos PIX e Cartao de Credito.
- Parcelamos dependendo do procedimento (consulte condicoes no fechamento).

DIRETRIZES DE COMUNICACAO E SEGURANCA CLINICA:
- NUNCA diagnostique doencas de pele ou prescreva medicamentos.
- Se o cliente perguntar sobre contraindicacoes (como gravidez, amamentacao, Roacutan/isotretinoina, herpes ativa, queloide), explique que requer cuidado absoluto ou impede a conduta inmediata, orientando a avaliacao presencial.
- Seja clara e especifica. Se o cliente perguntar sobre formas de pagamento E combo (como no caso 'parcela no pix?'), responda a ambas as perguntas de forma direta!
- Se o cliente perguntar sobre queloide no preenchimento labial, explique que o preenchimento na mucosa labial raramente desenvolve queloides, mas como ha agulhadas perto da pele, requer avaliacao criteriosa do profissional.
- Se o cliente tiver melasma ou fototipo alto (pele negra) no peeling, explique que peeling em melasma ativo ou pele negra exige extrema cautela com acidos suaves (como acido latico ou mandelico) para evitar efeito rebote, e que uma avaliacao individual e obrigatoria.
- Se o cliente estiver usando Roacutan/isotretinoina ou acidos fortes (como tretinoina), explique que nao deve fazer peeling nem limpeza profunda ate suspender o uso sob orientacao profissional.
- Mantenha respostas concisas (maximo 3 a 4 paragrafos), sem enrolacao, acolhedora e conduzindo delicadamente para a triagem de agendamento ou encaminhamento humano.`;

export async function gerarRespostaDinamica(
    mensagem: string,
    analise: Types.AIIntentResult,
    contexto?: Types.LunaContexto
): Promise<string> {
    try {
        const historico = contexto?.mensagens 
            ? contexto.mensagens.slice(-5).map(m => `${m.origem === 'cliente' ? 'Cliente' : 'Luna'}: ${m.texto}`).join('\n')
            : '';

        const userContext = `Mensagem atual do cliente: "${mensagem}"\nIntent Classificada: "${analise.intent}"\nServico Identificado: "${analise.servico || 'Nenhum'}"\nData Extraida: "${analise.data || 'Nenhuma'}"\n\nHistorico da conversa:\n${historico}`;

        const response = await axios.post(API_URL, {
            model: 'llama-3.3-70b-versatile',
            messages: [
                { role: 'system', content: SYSTEM_PROMPT_RESPOSTA },
                { role: 'user', content: userContext }
            ]
        }, {
            headers: {
                Authorization: `Bearer ${GROQ_API_KEY}`,
                'Content-Type': 'application/json'
            }
        });

        const respostaTexto = response.data.choices[0].message.content;
        return respostaTexto.trim();
    } catch (error: any) {
        console.error('Erro ao gerar resposta dinamica no Groq, caindo no fallback:', error.message);
        throw error; // Let the server handle fallback
    }
}


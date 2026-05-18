import express from 'express';
import cors from 'cors';
import * as aiService from './aiService';
import * as respostaService from './respostaService';
import type { AIIntentResult, LunaContexto, LunaEtapa, LunaRisco } from '../types/index';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const app = express();
const __dirname = dirname(fileURLToPath(import.meta.url));
const sitePath = join(__dirname, '..', 'projetos');
const projectPath = join(__dirname, '..');
const sessoes = new Map<string, LunaContexto>();

app.use(cors());
app.use(express.json());
app.use('/assets', express.static(projectPath));
app.use(express.static(sitePath));

function criarContexto(sessionId: string): LunaContexto {
    return {
        sessionId,
        etapa: 'inicio',
        risco: 'baixo',
        servicoAtual: '',
        objetivo: '',
        sinaisAlerta: [],
        respostasAnamnese: {},
        pendenciasAnamnese: respostaService.perguntasAnamnesePadrao(),
        mensagens: []
    };
}

function normalizar(texto: string): string {
    return texto.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
}

function detectarRisco(analise: AIIntentResult, mensagem: string, contexto: LunaContexto): LunaRisco {
    const texto = normalizar(mensagem);
    const sinais = [
        'dor forte',
        'muita dor',
        'pus',
        'secrecao',
        'febre',
        'falta de ar',
        'necrose',
        'pele preta',
        'bolha',
        'ferida aberta',
        'nao cicatriza',
        'pinta crescendo',
        'pinta mudou',
        'sangrando',
        'roxo escuro'
    ];

    const encontrados = sinais.filter(sinal => texto.includes(sinal));
    encontrados.forEach(sinal => {
        if (!contexto.sinaisAlerta.includes(sinal)) contexto.sinaisAlerta.push(sinal);
    });

    if (analise.intent === 'sinal_alerta' || encontrados.length > 0) return 'alto';
    if (['duvida_contraindicacao', 'duvida_seguranca', 'reclamacao'].includes(analise.intent)) return 'medio';
    return contexto.risco;
}

function detectarObjetivo(mensagem: string): string {
    const texto = normalizar(mensagem);
    if (texto.includes('mancha') || texto.includes('melasma')) return 'manchas e uniformizacao do tom';
    if (texto.includes('cravo') || texto.includes('oleosidade') || texto.includes('poro')) return 'cravos, poros e oleosidade';
    if (texto.includes('labio') || texto.includes('boca')) return 'contorno, hidratacao ou volume labial';
    if (texto.includes('acne')) return 'acne ou marcas de acne';
    return '';
}

function atualizarAnamnese(contexto: LunaContexto, mensagem: string) {
    const texto = normalizar(mensagem);
    const negou = ['nao', 'não', 'nenhuma', 'nada', 'nunca'].some(termo => texto.includes(normalizar(termo)));
    const regras = [
        { chave: 'gestacao_amamentacao', pergunta: 'Voce esta gravida ou amamentando?', termos: ['gravida', 'amamentando', 'gestante'] },
        { chave: 'alergias_infeccoes', pergunta: 'Tem alergias importantes, herpes ativa ou alguma infeccao/ferida na pele agora?', termos: ['alergia', 'herpes', 'infeccao', 'ferida'] },
        { chave: 'medicamentos_procedimentos', pergunta: 'Usou isotretinoina/Roacutan, acidos fortes ou fez procedimento recente?', termos: ['roacutan', 'isotretinoina', 'acido', 'procedimento recente'] },
        { chave: 'pele_sensivel', pergunta: 'Sua pele esta sensivel, queimada de sol, com acne inflamada ou dor?', termos: ['sensivel', 'queimada', 'sol', 'acne inflamada', 'dor'] },
        { chave: 'periodo', pergunta: 'Qual periodo voce prefere para atendimento: manha ou tarde?', termos: ['manha', 'tarde', 'noite'] }
    ];

    regras.forEach(regra => {
        if (regra.termos.some(termo => texto.includes(termo))) {
            contexto.respostasAnamnese[regra.chave] = negou ? `Negado: ${mensagem}` : mensagem;
            contexto.pendenciasAnamnese = contexto.pendenciasAnamnese.filter(item => item !== regra.pergunta);
        }
    });

    if (['nao', 'não', 'nenhuma', 'nada'].some(termo => texto.includes(termo))) {
        const primeira = contexto.pendenciasAnamnese[0];
        if (primeira) {
            contexto.respostasAnamnese[`resposta_${Object.keys(contexto.respostasAnamnese).length + 1}`] = mensagem;
            contexto.pendenciasAnamnese = contexto.pendenciasAnamnese.slice(1);
        }
    }
}

function pareceRespostaDeAnamnese(contexto: LunaContexto, mensagem: string): boolean {
    if (contexto.etapa !== 'anamnese') return false;
    const texto = normalizar(mensagem);
    return [
        'nao',
        'não',
        'sim',
        'gravida',
        'amamentando',
        'alergia',
        'herpes',
        'roacutan',
        'isotretinoina',
        'acido',
        'sensivel',
        'irritada',
        'manha',
        'tarde',
        'noite'
    ].some(termo => texto.includes(normalizar(termo)));
}

function definirEtapa(analise: AIIntentResult, contexto: LunaContexto): LunaEtapa {
    if (contexto.risco === 'alto') return 'bloqueado_risco';
    if (analise.intent === 'atendimento_humano' || analise.intent === 'reclamacao') return 'encaminhar_humano';
    if (contexto.etapa === 'anamnese' && contexto.pendenciasAnamnese.length === 0) return 'agendamento';
    if (analise.intent === 'agendar') return 'anamnese';
    if (analise.intent === 'saudacao') return 'inicio';
    return 'orientacao';
}

function atualizarContexto(contexto: LunaContexto, analise: AIIntentResult) {
    if (pareceRespostaDeAnamnese(contexto, analise.mensagemOriginal) && analise.intent !== 'sinal_alerta') {
        analise.intent = 'agendar';
    }

    contexto.mensagens.push({ origem: 'cliente', texto: analise.mensagemOriginal });
    contexto.mensagens = contexto.mensagens.slice(-10);

    if (analise.servico && analise.servico !== 'Procedimentos Escolhidos') {
        contexto.servicoAtual = analise.servico;
    }

    const objetivo = detectarObjetivo(analise.mensagemOriginal);
    if (objetivo) contexto.objetivo = objetivo;

    atualizarAnamnese(contexto, analise.mensagemOriginal);
    contexto.risco = detectarRisco(analise, analise.mensagemOriginal, contexto);
    contexto.etapa = definirEtapa(analise, contexto);
}

app.post(['/chat', '/api/chat'], async (req: any, res: any) => {
    try {
        const { mensagem, sessionId = 'default' } = req.body;

        if (!mensagem) {
            return res.status(400).json({ erro: 'Mensagem vazia' });
        }

        const contexto = sessoes.get(sessionId) || criarContexto(sessionId);
        console.log(`Cliente (${sessionId}) disse: "${mensagem}"`);

        const analiseIA = await aiService.analisarMensagemCliente(mensagem);
        atualizarContexto(contexto, analiseIA);

        let textoResposta = '';
        
        // Se for sinal de alerta crítico, NÃO usa o LLM dinâmico para garantir 100% de precisão e segurança no redirecionamento.
        if (analiseIA.intent === 'sinal_alerta' || contexto.risco === 'alto') {
            textoResposta = respostaService.gerarResposta(analiseIA, analiseIA.servico, contexto);
        } else {
            try {
                // Tenta gerar a resposta contextualizada dinamicamente com o LLaMA
                textoResposta = await aiService.gerarRespostaDinamica(mensagem, analiseIA, contexto);
            } catch (error) {
                // Em caso de falha de conexão com a Groq, cai no fallback de respostas estáticas estritamente controladas
                console.log('Caindo no fallback estático devido a falha na geração dinâmica');
                textoResposta = respostaService.gerarResposta(analiseIA, analiseIA.servico, contexto);
            }
        }

        contexto.mensagens.push({ origem: 'luna', texto: textoResposta });
        contexto.mensagens = contexto.mensagens.slice(-10);
        sessoes.set(sessionId, contexto);

        return res.json({
            resposta: textoResposta,
            detalhes: analiseIA,
            contexto
        });

    } catch (error) {
        console.error('Erro no Servidor:', error);
        res.status(500).json({ resposta: 'Ops, tive um problema tecnico aqui. Pode repetir?' });
    }
});

const PORT = Number(process.env.PORT) || 3000;
if (!process.env.VERCEL) {
    app.listen(PORT, () => {
        console.log(`EsteticaIA rodando em http://localhost:${PORT}`);
    });
}

export default app;

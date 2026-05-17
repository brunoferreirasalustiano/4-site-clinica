import { analisarMensagemCliente } from './services/aiService';
import { gerarResposta } from './services/respostaService';

async function testeDeEstresse() {
    console.log("=========================================");
    console.log("🧨 TESTE DE ESTRESSE: IA vs CLIENTE REAL");
    console.log("=========================================");

    // Mude a frase abaixo para testar a inteligência:
    const pergunta = "Tô querendo dar um talento no rosto pra tirar uns cravos, qual o valor?";
    
    console.log(`\n💬 CLIENTE DISSE: "${pergunta}"`);

    try {
        const analise = await analisarMensagemCliente(pergunta);
        
        console.log("\n🧠 PENSAMENTO DA IA:");
        console.table({
            Intencao: analise.intent,
            Servico_Identificado: analise.servico,
            Data_Extraida: analise.data || "Nenhuma"
        });

        const respostaFinal = gerarResposta(analise.intent, analise.servico || '');
        console.log(`\n🤖 RESPOSTA DO BOT: "${respostaFinal}"`);

    } catch (erro) {
        console.error("❌ Falha crítica no teste:", erro);
    }
}

testeDeEstresse();
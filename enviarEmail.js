const fs = require('fs');

const API_URL = 'http://10.10.10.61:1000/api/enviar-email';
const DESTINATARIO = 'chamados@bugbusters.com.br';
//const DESTINATARIO = 'diegosalles@live.com';
const ARQUIVO_OCORRENCIAS = 'novas_ocorrencias.json';

// Função para ler o arquivo de ocorrências
const lerOcorrencias = () => {
    if (!fs.existsSync(ARQUIVO_OCORRENCIAS)) {
        console.log("✅ Nenhuma nova ocorrência detectada. Nenhum e-mail será enviado.");
        return null;
    }
    return JSON.parse(fs.readFileSync(ARQUIVO_OCORRENCIAS, "utf8"));
};

// Função para criar o resumo do chamado
const criarResumoChamado = (maquina, ocorrencias) => {
    return `Foi identificado um problema na estação ${maquina}.\nO sistema identificou um ou mais problemas a seguir:\n\n` +
           ocorrencias.map(ocorrencia => `   - ${ocorrencia}`).join('\n') +
           `\n\nSolicitada a verificação dessas anomalias.`;
};

// Função para enviar e-mails usando Fetch (sem verificar resposta)
const enviarEmails = async () => {
    const ocorrencias = lerOcorrencias();
    if (!ocorrencias) return;

    const todasOcorrencias = []; // Armazena todas as ocorrências

    await Promise.all(
        Object.entries(ocorrencias).map(async ([maquina, listaOcorrencias]) => {
            const emailData = {
                to: DESTINATARIO,
                requerente: "SISTEMA DE MONITORAMENTO",
                titulo: `PROBLEMA COM ${maquina}`,
                tipo: "Incidente",
                categoria: "Hardware",
                chamado: criarResumoChamado(maquina, listaOcorrencias),
            };

            todasOcorrencias.push(emailData); // Adiciona ao JSON consolidado

            try {
                await fetch(API_URL, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(emailData),
                });
            } catch (error) {
                console.error(`❌ Erro ao conectar com a API para ${maquina}:`, error.message);
            }
        })
    );

    // **Exibe todas as ocorrências no JSON e finaliza o programa**
    console.log("\n📊 Todas as ocorrências registradas:");
    console.log(JSON.stringify(todasOcorrencias, null, 2));
    process.exit(0); // Finaliza o programa
};

module.exports = { EnviarEmail: enviarEmails };
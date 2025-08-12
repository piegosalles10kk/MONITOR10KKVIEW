const axios = require('axios');
const fs = require('fs');
const { EnviarEmail } = require('./enviarEmail');

const BASE_URL = 'http://localhost:2500';
const TOTAL_CICLOS = 1;
const UMA_HORA = 60 * 60 * 1000;

let maquinasComOcorrencias = {};

const excecoesAnomalias = fs.existsSync("ignorar_maquinas.json")
  ? JSON.parse(fs.readFileSync("ignorar_maquinas.json", "utf8"))
  : {};

const obterAliasesMaquinas = async () => {
  try {
    const response = await axios.get(`${BASE_URL}/dados/maquinas`);
    console.log("✅ Obtidos machineAliases:", response.data.machineAliases);
    return response.data.machineAliases;
  } catch (error) {
    await new Promise(resolve => setTimeout(resolve, 2000));
    return obterAliasesMaquinas();
  }
};

const obterDadosMaquina = async (machine_alias) => {
  let tentativas = 0;
  const MAX_TENTATIVAS = 5;

  while (tentativas < MAX_TENTATIVAS) {
    try {
      const response = await axios.get(`${BASE_URL}/${machine_alias}`);
      if (!response.data || response.data.length === 0)
        throw new Error(`Dados vazios para ${machine_alias}`);

      console.log(`✅ Dados obtidos para máquina: ${machine_alias} (${response.data.length} registros disponíveis)`);
      console.log(`✅ Primeiro timestamp: ${response.data[0]?.timestamp_coleta}`);
      return response.data.length > 360 ? response.data.slice(0, 360) : response.data;
    } catch (error) {
      tentativas++;
      console.error(`Erro ao buscar dados para ${machine_alias} (Tentativa ${tentativas}/${MAX_TENTATIVAS}):`, error.message);
      await new Promise(resolve => setTimeout(resolve, 2000));
    }
  }

  console.warn(`⚠️ Pulando máquina ${machine_alias} após ${MAX_TENTATIVAS} tentativas.`);
  return [];
};

const calcularMediaExcedente = (machineData, machine_alias) => {
  const valoresCriticos = {
    cpuTemp: [],
    cpuUso: [],
    ramUso: [],
    discoPrincipalUso: [],
    gpuUso: [],
    gpuTemp: [],
    offlineDesde: null
  };

  const agora = new Date();
  const TEMPO_OFFLINE = machine_alias === "AGILENT" ? 3 * UMA_HORA : UMA_HORA;
  const dadoMaisRecente = machineData[0];

  if (dadoMaisRecente) {
    const [dia, mes, ano, hora, minuto, segundo] = dadoMaisRecente.timestamp_coleta.split(/[\s/:]/);
    const timestamp = new Date(`${ano}-${mes}-${dia}T${hora}:${minuto}:${segundo}`);

    if (agora - timestamp > TEMPO_OFFLINE) {
      valoresCriticos.offlineDesde = dadoMaisRecente.timestamp_coleta;
    }

    const cpu = dadoMaisRecente.monitoramento.cpu;
    const ram = dadoMaisRecente.monitoramento.memoria_ram;
    const disco = dadoMaisRecente.monitoramento.disco_principal;
    const gpu = dadoMaisRecente.monitoramento.gpu;

    if (cpu.temperatura_package_celsius > 70) valoresCriticos.cpuTemp.push(cpu.temperatura_package_celsius);
    if (cpu.percentual_uso > 80) valoresCriticos.cpuUso.push(cpu.percentual_uso);
    if (ram.percentual_uso > 80) valoresCriticos.ramUso.push(ram.percentual_uso);
    if (disco.percentual_uso > 90) valoresCriticos.discoPrincipalUso.push(disco.percentual_uso);
    if (gpu.uso_percentual > 80) valoresCriticos.gpuUso.push(gpu.uso_percentual);
    if (gpu.temperatura_core_celsius > 80) valoresCriticos.gpuTemp.push(gpu.temperatura_core_celsius);
  }

  const calcularMedia = (valores) =>
    valores.length > 0 ? (valores.reduce((a, b) => a + b, 0) / valores.length).toFixed(2) : null;

  const logCritico = [];
  if (calcularMedia(valoresCriticos.cpuTemp)) logCritico.push({ "CPU Temp": `${calcularMedia(valoresCriticos.cpuTemp)}°C` });
  if (calcularMedia(valoresCriticos.cpuUso)) logCritico.push({ "CPU Uso": `${calcularMedia(valoresCriticos.cpuUso)}%` });
  if (calcularMedia(valoresCriticos.ramUso)) logCritico.push({ "RAM Uso": `${calcularMedia(valoresCriticos.ramUso)}%` });
  if (calcularMedia(valoresCriticos.discoPrincipalUso)) logCritico.push({ "Disco Principal Uso": `${calcularMedia(valoresCriticos.discoPrincipalUso)}%` });
  if (calcularMedia(valoresCriticos.gpuUso)) logCritico.push({ "GPU Uso": `${calcularMedia(valoresCriticos.gpuUso)}%` });
  if (calcularMedia(valoresCriticos.gpuTemp)) logCritico.push({ "GPU Temp": `${calcularMedia(valoresCriticos.gpuTemp)}°C` });
  if (valoresCriticos.offlineDesde) logCritico.push({ "Offline desde": valoresCriticos.offlineDesde });

  if (logCritico.length) {
    maquinasComOcorrencias[machine_alias] = logCritico.map(obj => Object.entries(obj)[0].join(": "));

    const pastaRelatorios = "relatórios";
    const historicoPath = `${pastaRelatorios}/historico-de-chamados.json`;

    if (!fs.existsSync(pastaRelatorios)) {
      fs.mkdirSync(pastaRelatorios);
    }

    let historico = [];
    if (fs.existsSync(historicoPath)) {
      historico = JSON.parse(fs.readFileSync(historicoPath, "utf8"));
    }

    const ocorrenciaAgrupada = logCritico.reduce((acc, obj) => Object.assign(acc, obj), {});
    const timestampAtual = new Date().toISOString();

    const novoChamado = {
      maquina: machine_alias,
      ocorrencia: ocorrenciaAgrupada,
      horario: timestampAtual
    };

    historico.push(novoChamado);
    fs.writeFileSync(historicoPath, JSON.stringify(historico, null, 2));
    console.log(`📝 Histórico atualizado em ${historicoPath}`);
  }
};

const verificarDiferencas = (novoJson) => {
  const arquivoAnterior = "ocorrencias.json";
  const arquivoNovo = "novas_ocorrencias.json";

  let jsonAnterior = {};
  if (fs.existsSync(arquivoAnterior)) {
    jsonAnterior = JSON.parse(fs.readFileSync(arquivoAnterior, "utf8"));
  }

  const diferencas = {};

  for (const maquina in novoJson) {
    const ocorrenciasAtuais = novoJson[maquina];

    const novasOcorrencias = ocorrenciasAtuais.filter(ocorrencia => {
      const tipo = ocorrencia.split(":")[0].trim();

      const ignorarLista = excecoesAnomalias[maquina.toUpperCase()];
      const ignorada = Array.isArray(ignorarLista)
        ? ignorarLista.includes(tipo)
        : ignorarLista === tipo;

      const jaReportada = jsonAnterior[maquina]?.some(anterior => anterior.split(":")[0].trim() === tipo);

      return !ignorada && !jaReportada;
    });

    if (novasOcorrencias.length) {
      diferencas[maquina] = novasOcorrencias;
    }
  }

  if (Object.keys(diferencas).length > 0) {
    fs.writeFileSync(arquivoNovo, JSON.stringify(diferencas, null, 2));
    console.log("✅ Novas ocorrências salvas em novas_ocorrencias.json");
    EnviarEmail(JSON.stringify(diferencas, null, 2));
  } else {
    console.log("✅ Nenhuma nova ocorrência detectada.");
  }
};

const monitorMachines = async () => {
  const machineAliases = await obterAliasesMaquinas();
  const machineNames = machineAliases.map(machine => machine.name);

  for (let ciclo = 1; ciclo <= TOTAL_CICLOS; ciclo++) {
    console.log(`\n🔄 Ciclo ${ciclo}/${TOTAL_CICLOS} iniciado...`);
    for (const alias of machineNames) {
      const machineData = await obterDadosMaquina(alias);
      if (machineData.length === 0) continue;
      calcularMediaExcedente(machineData, alias);
    }
  }

  verificarDiferencas(maquinasComOcorrencias);
  fs.writeFileSync("ocorrencias.json", JSON.stringify(maquinasComOcorrencias, null, 2));
  console.log("📄 JSON consolidado salvo em ocorrencias.json");
};

monitorMachines().then(() => {
  module.exports = { maquinasComOcorrencias };
});
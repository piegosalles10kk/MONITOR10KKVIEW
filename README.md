# 10KK VIEW API

## 📌 **Pré-requisitos**
Antes de iniciar, certifique-se de que tem o seguinte instalado:
- **Node 20.19 ou superior** ([Baixar aqui](https://nodejs.org/en/download))
- **npm** (já incluído no Node)

## ⚙️ **Instalação**
### **Instalação do pacote de bibliotecas**
Abra o terminal e execute:

```sh
npm install
```
## 🚀 **Configurando o aplicativo**
- Em **\controllers\dadosController.js** certifique-se de que **basePath** esteja apontado para o diretório de pastas criadas para o [agente](https://github.com/piegosalles10kk/10KKVIEW-AGENTE) 

## 🚀 **Rodando o aplicativo**
- Após instalar as depenências, execute o seguinte comando:

```sh
npm start
```

## 🗺 Rotas da aplicação
- Atualmente a aplicação possui apenas duas rotas, sendo elas:

### 1️⃣ Rota de pesquisa pelo **machine_alias**

```sh
http://localhost:2500/:machine_alias
```

Exemplo:
```sh
http://localhost:2500/TI
```
Retorno:

```json
[
  {
    "hostname": "SERVERTI",
    "machine_alias": "TI",
    "timestamp_coleta": "09/06/2025 15:01:50",
    "monitoramento": {
      "cpu": {
        "percentual_uso": 16,
        "nucleos_fisicos": 4,
        "nucleos_logicos": 8,
        "nome": "Intel Xeon E5-1630 v4",
        "temperatura_package_celsius": 45,
        "temperaturas_cores_celsius": {
          "cpu_core_1": 39,
          "cpu_core_2": 42,
          "cpu_core_3": 40,
          "cpu_core_4": 42
        },
        "uso_total_percent": 10.35,
        "energia_watts": {
          "cpu_package": 12.23,
          "cpu_cores": 0,
          "cpu_dram": 7.29
        },
        "clocks_mhz": {
          "cpu_core_1": 1197.23,
          "cpu_core_2": 3691.45,
          "bus_speed": 99.77,
          "cpu_core_3": 3691.45,
          "cpu_core_4": 3691.45
        }
      },
      "memoria_ram": {
        "total_gb": 63.89,
        "usado_gb": 20.68,
        "percentual_uso": 32.4
      },
      "disco_principal": {
        "total_gb": 222.98,
        "usado_gb": 76.66,
        "livre_gb": 146.32,
        "percentual_uso": 34.4,
        "nome": "CT240BX500SSD1",
        "temperatura_celsius": 32
      },
      "discos_adicionais": [
        {
          "nome": "ST6000NM0115         00FC651      LENOVO",
          "tipo": "HDD",
          "temperatura_celsius": 36,
          "uso_espaco_percent": 56.55
        }
      ],
      "gpu": {
        "nome": "NVIDIA GeForce 210",
        "tipo": "GpuNvidia",
        "temperatura_core_celsius": 59,
        "uso_percentual": 1,
        "memoria_gpu": {
          "usada_mb": 300.8,
          "livre_mb": 211.2,
          "total_mb": 512
        },
        "clocks_mhz": {
          "gpu_core": 135,
          "gpu_memory": 135,
          "gpu_shader": 270
        }
      },
      "rede": {
        "bytes_enviados_mb": 681134.72,
        "bytes_recebidos_mb": 682450.09,
        "velocidade_atual_mbps": 54.96
      },
      "placa_mae": {
        "nome": "Lenovo 102F"
      },
      "uptime_horas": 98.9
    }
  }
  ]
```
### 2️⃣ Rota de pesquisa por todos os **machine_alias** dentro dos registros

```sh
http://localhost:2500/dados/maquinas
```
Retorno:
```json
{
  "machineAliases": [
    "TI-2",
    "W-A",
    "W-C",
    "W-B",
    "W-E",
    "NOTEBOOK",
    "TI",
    "AGILENT",
    "NOTEBOOKTI",
    "W-F"
  ]
}
```

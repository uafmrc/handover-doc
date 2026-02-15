## Perché Ollama?

✅ **Gratuito e locale** - Nessun costo API  
✅ **Privacy** - Il codice rimane sul tuo computer  
✅ **Veloce** - Nessuna latenza di rete  
✅ **Offline** - Funziona senza connessione internet

## 📦 Installazione Ollama

### Windows
```powershell
# Scarica da https://ollama.ai/download/windows
# Oppure usa winget
winget install Ollama.Ollama
```

### macOS
```bash
# Scarica da https://ollama.ai/download/mac
# Oppure usa brew
brew install ollama
```

### Linux
```bash
curl -fsSL https://ollama.ai/install.sh | sh
```

## 🤖 Modelli Consigliati per Analisi Codice

### 1. **Qwen 2.5 Coder 7B** (CONSIGLIATO) ⭐
```bash
ollama pull qwen2.5-coder:7b
```
- **Dimensione**: ~4.7 GB
- **RAM richiesta**: 8 GB
- **Migliore per**: Analisi codice, spiegazioni tecniche
- **Velocità**: Ottima su hardware consumer
- **Qualità**: Eccellente per code analysis

### 2. **DeepSeek Coder V2 16B**
```bash
ollama pull deepseek-coder-v2:16b
```
- **Dimensione**: ~9 GB
- **RAM richiesta**: 16 GB
- **Migliore per**: Analisi approfondita, progetti complessi
- **Velocità**: Buona su hardware potente
- **Qualità**: Ottima, molto dettagliato

### 3. **CodeLlama 13B**
```bash
ollama pull codellama:13b
```
- **Dimensione**: ~7.4 GB
- **RAM richiesta**: 12 GB
- **Migliore per**: Bilanciamento qualità/velocità
- **Velocità**: Buona
- **Qualità**: Molto buona

### 4. **Qwen 2.5 Coder 14B** (Alta qualità)
```bash
ollama pull qwen2.5-coder:14b
```
- **Dimensione**: ~8.5 GB
- **RAM richiesta**: 16 GB
- **Migliore per**: Massima qualità su hardware potente
- **Velocità**: Media
- **Qualità**: Eccellente

### 5. **Qwen 2.5 Coder 1.5B** (Leggero)
```bash
ollama pull qwen2.5-coder:1.5b
```
- **Dimensione**: ~934 MB
- **RAM richiesta**: 4 GB
- **Migliore per**: Computer con poche risorse
- **Velocità**: Molto veloce
- **Qualità**: Buona per analisi base

## 🚀 Avvio Ollama

```bash
# Avvia il server Ollama
ollama serve
```

Ollama si avvia in background e ascolta su `http://localhost:11434`

## ⚙️ Configurazione nel Progetto

### Config.json con Ollama (Default)
```json
{
  "projectPath": "./your-project",
  "outputDir": "./handover-docs",
  "llmProvider": "ollama",
  "llmBaseUrl": "http://localhost:11434",
  "llmModel": "qwen2.5-coder:7b",
  "projectName": "My Project"
}
```

### Config.json con Claude (Alternativa)
```json
{
  "projectPath": "./your-project",
  "outputDir": "./handover-docs",
  "llmProvider": "anthropic",
  "llmKey": "sk-ant-...",
  "llmModel": "claude-3-5-sonnet-20241022",
  "projectName": "My Project"
}
```

## 🔧 Test Setup

### 1. Verifica installazione Ollama
```bash
ollama --version
```

### 2. Lista modelli installati
```bash
ollama list
```

### 3. Testa un modello
```bash
ollama run qwen2.5-coder:7b "Spiega cosa fa questa funzione: function add(a, b) { return a + b; }"
```

### 4. Verifica API
```bash
curl http://localhost:11434/api/tags
```

## 📊 Tabella Comparativa Modelli

| Modello | Dimensione | RAM | Qualità | Velocità | Uso Consigliato |
|---------|-----------|-----|---------|----------|------------------|
| qwen2.5-coder:1.5b | 934 MB | 4 GB | ⭐⭐⭐ | ⭐⭐⭐⭐⭐ | PC entry-level |
| qwen2.5-coder:7b | 4.7 GB | 8 GB | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐ | **RACCOMANDATO** |
| codellama:13b | 7.4 GB | 12 GB | ⭐⭐⭐⭐ | ⭐⭐⭐ | Buon bilanciamento |
| qwen2.5-coder:14b | 8.5 GB | 16 GB | ⭐⭐⭐⭐⭐ | ⭐⭐⭐ | Massima qualità |
| deepseek-coder-v2:16b | 9 GB | 16 GB | ⭐⭐⭐⭐⭐ | ⭐⭐⭐ | Progetti enterprise |

## 💻 Requisiti Hardware

### Minimi (modello 1.5B)
- CPU: Qualsiasi processore moderno
- RAM: 4 GB
- Storage: 2 GB

### Raccomandati (modello 7B)
- CPU: 4+ core
- RAM: 8 GB
- Storage: 10 GB

### Ottimali (modello 14B+)
- CPU: 8+ core o GPU
- RAM: 16+ GB
- Storage: 20 GB
- GPU (opzionale): NVIDIA con CUDA

## 🎯 Quick Start

```bash
# 1. Installa Ollama
curl -fsSL https://ollama.ai/install.sh | sh

# 2. Scarica il modello raccomandato
ollama pull qwen2.5-coder:7b

# 3. Avvia Ollama
ollama serve

# 4. In un'altra finestra, esegui il tool
cd handover-doc-generator
npm install
npm run build
npm run dev generate
```

## 🔍 Troubleshooting

### "Connection refused" o "Ollama non raggiungibile"
```bash
# Verifica che Ollama sia in esecuzione
ollama serve

# Oppure riavvia
killall ollama
ollama serve
```

### Modello troppo lento
- Usa un modello più piccolo (1.5B o 7B)
- Chiudi altre applicazioni
- Considera GPU acceleration

### Out of Memory
- Usa un modello più piccolo
- Aumenta RAM disponibile
- Riduci il numero di file analizzati

### Qualità analisi bassa
- Usa un modello più grande (14B o 16B)
- Verifica che il modello sia code-specialized
- Prova modelli diversi

## 🆚 Ollama vs Claude API

| Aspetto | Ollama | Claude API |
|---------|--------|------------|
| Costo | Gratuito | ~$0.10-0.50 per progetto |
| Privacy | Locale | Inviato ad Anthropic |
| Velocità | Dipende da hardware | Veloce (cloud) |
| Qualità | Molto buona | Eccellente |
| Offline | ✅ Sì | ❌ No |
| Setup | Installazione locale | Solo API key |

## 🔗 Link Utili

- **Ollama**: https://ollama.ai
- **Modelli**: https://ollama.ai/library
- **GitHub**: https://github.com/ollama/ollama
- **Discord**: https://discord.gg/ollama

## 💡 Best Practices

1. **Primo utilizzo**: Inizia con `qwen2.5-coder:7b`
2. **Progetti grandi**: Usa modelli 14B+ se hai l'hardware
3. **Hardware limitato**: Usa modelli 1.5B o 3B
4. **Massima qualità**: Combina Ollama locale + Claude API per file critici
5. **Produzione**: Testa diversi modelli e scegli il migliore per il tuo caso

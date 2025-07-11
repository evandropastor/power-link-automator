# 🔗 Power Link Automator

Crie links inteligentes para seus PDFs em 2 modos:

## 🚀 Comece Rapidamente

### Modo Básico (Sem API Key)
1. **Instale**:
   ```bash
   npm install && npm run dev
   ```
2. **Use**:
   - Arraste seu PDF para a área indicada
   - Edite título/autor/palavras-chave manualmente
   - Clique em "Gerar Link" para obter seu URL personalizado

### Modo Avançado (Com IA)
1. **Obtenha sua chave gratuita**:
   - Acesse [Google AI Studio](https://aistudio.google.com/) ➡️ Crie uma API Key
2. **Configure**:
   - Crie um arquivo `.env.local` com:
     ```env
     GEMINI_API_KEY=sua_chave_aqui
     ```
3. **Ative recursos IA**:
   - Geração automática de metadados
   - Otimização inteligente de links
   - Sugestões contextualizadas

## 📸 Visualização
![Fluxo de uso básico](https://via.placeholder.com/800x400.png?text=Upload+PDF+→+Edite+Metadados+→+Gere+Link)

## ❓ Precisa de ajuda?
- Problemas com instalação? Execute `node --version` para verificar Node.js (v18+)
- Link não funciona? Verifique se os metadados estão preenchidos
- Quer usar IA? [Siga este guia passo a passo para obter a chave](docs/api_guide.md)

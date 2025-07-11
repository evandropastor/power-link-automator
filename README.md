# Power Link Automator

Uma aplicação web simples e poderosa para adicionar links de URL clicáveis a qualquer arquivo PDF. Envie seu documento, desenhe seções interativas em qualquer página, atribua URLs e exporte um novo PDF pronto para ser compartilhado.

![Power Link Automator Screenshot](https://i.imgur.com/kSgR4qA.png)

## O Quê, Porquê e Como

### O Que é?
O Power Link Automator é uma ferramenta que roda 100% no seu navegador e permite que você transforme áreas de um PDF em links clicáveis. É ideal para criar portfólios interativos, catálogos de produtos com links para compra, trabalhos acadêmicos com referências externas, e muito mais.

### Por que usar?
*   **Totalmente Privado:** Seus arquivos são processados localmente no seu computador. Nenhum documento é enviado ou armazenado em servidores externos.
*   **Sem Instalação Complexa:** A configuração atual pode ser executada sem a necessidade de instalar pacotes via `npm`.
*   **Fácil de Usar:** A interface é intuitiva e projetada para ser usada por qualquer pessoa, sem necessidade de conhecimento técnico.
*   **Flexível:** Use o controle de zoom para precisão, mova e redimensione as áreas de link como quiser.

### Como Usar o Aplicativo
1.  **Envie seu PDF:** Arraste e solte um arquivo PDF na área designada ou clique para selecioná-lo.
2.  **Crie uma Área de Link:** Navegue até a página desejada. Clique e arraste o mouse sobre a área que você quer transformar em um link.
3.  **Adicione a URL:** Uma caixa de diálogo aparecerá. Digite a URL completa (começando com `https://`) e clique em "Salvar".
4.  **Ajuste se Necessário:**
    *   **Mover:** Clique no meio da área criada e arraste-a para a posição correta.
    *   **Redimensionar:** Clique e arraste um dos pontos brancos nos cantos ou bordas da área.
    *   **Editar URL:** Dê um duplo-clique na área ou clique no ícone de lápis para alterar a URL.
5.  **Exporte:** Quando terminar de adicionar todos os links, clique no botão **"Exportar PDF com Links"** no topo da página. Um novo arquivo PDF, com os links incorporados, será baixado para o seu computador.

---

## Como Rodar o Projeto Localmente

Existem duas maneiras de trabalhar com este projeto. A configuração atual é a do **Método 1**.

### Método 1: Rodando Diretamente no Navegador (Sem Compilação)
**Esta é a configuração atual do projeto.** Por razões de segurança do navegador, você não pode simplesmente abrir o arquivo `index.html` a partir do seu sistema de arquivos. Você precisa servi-lo a partir de um servidor web local simples.

#### Opção A: VS Code + Extensão "Live Server" (Recomendado)
1.  Instale o editor de código [Visual Studio Code](https://code.visualstudio.com/).
2.  Dentro do VS Code, vá para a aba de Extensões e instale **"Live Server"**.
3.  Abra a pasta do projeto no VS Code.
4.  Clique com o botão direito no arquivo `index.html` e selecione **"Open with Live Server"**.
5.  Seu navegador abrirá automaticamente com o aplicativo funcionando.

#### Opção B: Linha de Comando (Se você tiver Python ou Node.js)
Abra seu terminal na pasta raiz do projeto e execute um dos seguintes comandos:
*   **Python 3:** `python -m http.server`
*   **Node.js:** `npx serve`
Em seguida, abra seu navegador e acesse o endereço fornecido (geralmente `http://localhost:8000` ou `http://localhost:3000`).

---

### Método 2: Usando um Ambiente de Desenvolvimento Profissional (com NPM)
**Atenção:** Para usar este método, o projeto precisa ser convertido para uma estrutura que use um `package.json` e um compilador como o Vite. **A configuração atual não suporta estes comandos.** Se você desejar converter o projeto para esta estrutura, por favor, solicite a alteração.

1.  **Instalar Dependências:** Uma vez que o projeto esteja configurado corretamente, você precisará baixar todas as bibliotecas do projeto.
    ```bash
    npm install
    ```
2.  **Rodar o Servidor de Desenvolvimento:** Este comando iniciará um servidor de desenvolvimento local com recursos avançados como "hot reload", que atualiza a página automaticamente quando você salva um arquivo.
    ```bash
    npm run dev
    ```

---

## Como Instalar em Hospedagens (Deploy)

O método de deploy depende de como o projeto está configurado.

### Deploy do Método 1 (Sem Compilação)
O processo é simplesmente enviar os arquivos existentes para um servidor.

*   **Netlify / Vercel:**
    1. Crie uma conta gratuita.
    2. No painel, encontre a opção de "drag and drop" e arraste a pasta inteira do seu projeto para lá.
    3. O site será publicado em segundos.

*   **GitHub Pages:**
    1. Envie todos os arquivos para um repositório no GitHub.
    2. Nas configurações do repositório, vá em "Pages".
    3. Configure para fazer o deploy a partir da branch `main` na pasta `root`.

*   **Hospedagem Comum (Hostinger, etc.):**
    1. Abra o "Gerenciador de Arquivos" da sua hospedagem.
    2. Crie uma pasta (ex: `editor-pdf`) dentro da sua pasta principal (`public_html`).
    3. Envie todos os arquivos e pastas do projeto para a pasta que você criou.

### Deploy do Método 2 (com Compilação NPM)
1.  **Compile o Projeto:** Antes de enviar, você precisa gerar a versão de produção do aplicativo. Rode o seguinte comando no seu terminal:
    ```bash
    npm run build
    ```
2.  **Envie a Pasta `dist`:** Este comando criará uma pasta chamada `dist`. É **apenas o conteúdo desta pasta `dist`** que você deve enviar para sua hospedagem (Netlify, Vercel, Hostinger, etc.). Nas configurações do seu serviço de hospedagem, configure o "diretório de publicação" para ser `dist`.
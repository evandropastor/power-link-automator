# Power Link Automator

Uma ferramenta web simples e poderosa para adicionar links de URL clicáveis a qualquer arquivo PDF, diretamente no seu navegador.

---

## Índice

- [O que é?](#o-que-é)
- [Por que usar?](#por-que-usar)
- [Como usar? (Guia do Usuário)](#como-usar-guia-do-usuário)
- [Instalação e Uso Local (Para Desenvolvedores)](#instalação-e-uso-local-para-desenvolvedores)
- [Como colocar online (Deploy)](#como-colocar-online-deploy)
- [Tecnologias Utilizadas](#tecnologias-utilizadas)

---

## O que é?

O **Power Link Automator** é uma aplicação de página única (SPA) que permite a qualquer pessoa transformar um PDF estático em um documento interativo. Você pode enviar um PDF, desenhar visualmente áreas em qualquer página, associar uma URL a cada área e exportar um novo PDF com essas áreas clicáveis.

Tudo isso acontece de forma segura e privada, pois **nenhum arquivo é enviado para um servidor externo**.

## Por que usar?

-   ✅ **Privacidade Total:** Seus documentos são processados localmente no seu navegador e nunca saem do seu computador.
-   🚀 **Extremamente Rápido:** Sem tempo de espera para upload ou download de servidores.
-   🖱️ **Interface Intuitiva:** Uma experiência de "desenhar para lincar" fácil de usar, com controles de zoom, redimensionamento e edição.
-   📄 **Aumenta a Interatividade:** Perfeito para adicionar links em portfólios, catálogos, e-books, trabalhos acadêmicos ou qualquer PDF que precise de referências externas.
-   💰 **Totalmente Gratuito:** Sem custos, sem assinaturas.

## Como usar? (Guia do Usuário)

1.  **Envie seu PDF:** Arraste e solte seu arquivo na área indicada ou clique para selecioná-lo do seu computador.
2.  **Navegue e Dê Zoom:** Role a página para ver todas as folhas do seu documento. Use os botões `+` e `-` no topo para ajustar o zoom e trabalhar com mais precisão.
3.  **Crie um Link:** Clique em qualquer lugar da página e arraste o mouse para desenhar um retângulo azul.
4.  **Adicione a URL:** Assim que você soltar o mouse, uma caixa de diálogo aparecerá. Insira a URL completa (começando com `http://` ou `https://`) e clique em "Salvar".
5.  **Mova e Redimensione:** Clique em uma área de link já criada para selecioná-la.
    -   Para **mover**, clique no meio da área e arraste.
    -   Para **redimensionar**, clique e arraste um dos pontos brancos nas bordas.
6.  **Edite ou Exclua:** Passe o mouse sobre uma área de link para ver os ícones de ação.
    -   Clique no **ícone de lápis** (ou dê um duplo-clique na área) para editar a URL.
    -   Clique no **ícone de lixeira** para remover a área.
7.  **Exporte o Resultado:** Quando terminar, clique no botão **"Exportar PDF com Links"** no topo da página. Um novo arquivo PDF, com todos os seus links funcionais, será baixado.

---

## Instalação e Uso Local (Para Desenvolvedores)

Este projeto é um aplicativo estático (HTML, CSS, JS/TS) e não requer um processo de build complexo para ser executado. A maneira mais fácil de rodá-lo localmente é usando um servidor web simples.

**Pré-requisitos:**
-   [Git](https://git-scm.com/) para clonar o repositório.
-   Um servidor web local. Se você tem Python ou Node.js instalados, você já tem o que precisa.

**Passos:**

1.  **Clone o repositório:**
    ```bash
    git clone <URL_DO_REPOSITORIO>
    cd <NOME_DO_REPOSITORIO>
    ```

2.  **Inicie um servidor local:**
    Escolha uma das opções abaixo, dependendo do que você tem instalado.

    -   **Usando Python 3:**
        ```bash
        python -m http.server
        ```

    -   **Usando Node.js (com `npx`):**
        ```bash
        npx serve
        ```

3.  **Acesse o App:**
    Abra seu navegador e vá para `http://localhost:8000` (para Python) ou o endereço fornecido pelo `serve` (geralmente `http://localhost:3000`).

---

## Como colocar online (Deploy)

Como este é um site estático, você pode hospedá-lo de graça ou a um custo muito baixo em diversas plataformas. Abaixo estão algumas das melhores opções.

### Opção 1: Netlify / Vercel / Cloudflare Pages (Recomendado)

Estas plataformas são modernas, rápidas e oferecem planos gratuitos generosos. O processo é muito similar entre elas.

**Método A: Arrastar e Soltar (O mais rápido)**

1.  Crie uma conta gratuita em um dos serviços ([Netlify](https://www.netlify.com/), [Vercel](https://vercel.com/), [Cloudflare Pages](https://pages.cloudflare.com/)).
2.  No painel, encontre a opção para criar um novo site via "drag and drop" ou "deploy manually".
3.  Arraste a pasta inteira do seu projeto e solte na área indicada.
4.  Pronto! A plataforma fará o upload e fornecerá uma URL pública para seu aplicativo.

**Método B: Integrado com Git (Para atualizações automáticas)**

1.  Envie seu projeto para um repositório no GitHub, GitLab ou Bitbucket.
2.  Na plataforma de hospedagem, escolha "Importar/Adicionar projeto" a partir do Git.
3.  Conecte sua conta do Git e selecione o repositório do projeto.
4.  **Configuração de Build:** Como este projeto não precisa de um passo de compilação, você pode deixar as configurações de build vazias ou nos valores padrão.
    -   **Comando de Build:** (pode deixar em branco)
    -   **Diretório de Publicação:** `/` (a raiz do projeto)
5.  Clique em "Deploy". A partir de agora, toda vez que você enviar uma atualização (`git push`), a plataforma publicará a nova versão automaticamente.

### Opção 2: GitHub Pages

Perfeito se o seu código já está no GitHub.

1.  Vá para o seu repositório no GitHub.
2.  Clique na aba **"Settings"** (Configurações).
3.  No menu lateral esquerdo, clique em **"Pages"**.
4.  Na seção "Build and deployment", em "Source", selecione **"Deploy from a branch"**.
5.  Em "Branch", selecione a branch `main` e a pasta `/ (root)`.
6.  Clique em **"Save"**.
7.  Aguarde alguns minutos. O GitHub irá publicar seu site e o link aparecerá nesta mesma página (`https://SEU-USUARIO.github.io/NOME-DO-REPOSITORIO/`).

### Opção 3: Hospedagem Tradicional (Hostinger, etc.)

Sim, **é totalmente possível subir este app para a Hostinger** ou qualquer outra hospedagem tradicional que ofereça um gerenciador de arquivos ou acesso FTP.

O processo é manual:

1.  Acesse o painel de controle da sua hospedagem (ex: hPanel na Hostinger).
2.  Abra o **"Gerenciador de Arquivos"** (File Manager).
3.  Navegue até a pasta raiz do seu domínio, que geralmente é chamada de `public_html`.
4.  Faça o upload de **todos os arquivos e pastas** do projeto para dentro da `public_html`, mantendo a mesma estrutura de pastas (`components`, `services`).
5.  Após o upload, seu site estará acessível através do seu domínio.

---

## Tecnologias Utilizadas

-   **Frontend:** [React](https://reactjs.org/) (com Hooks) e [TypeScript](https://www.typescriptlang.org/)
-   **Estilização:** [Tailwind CSS](https://tailwindcss.com/) (carregado via CDN)
-   **Manipulação de PDF:**
    -   **Renderização:** [pdf.js](https://mozilla.github.io/pdf.js/)
    -   **Modificação:** [pdf-lib](https://pdf-lib.js.org/)
-   **Arquitetura:** 100% Client-Side (sem backend)
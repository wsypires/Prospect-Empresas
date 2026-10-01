import { ProjectFile, ProjectStats } from '../types/project';

export const SAMPLE_PROJECT_FILES: ProjectFile[] = [
  {
    id: 'package.json',
    name: 'package.json',
    path: 'package.json',
    content: `{
  "name": "meu-projeto-web",
  "version": "1.0.0",
  "description": "Projeto web modular com visualizador interativo e dashboard",
  "main": "src/app.js",
  "scripts": {
    "start": "node src/app.js",
    "build": "vite build",
    "test": "vitest"
  },
  "dependencies": {
    "express": "^4.21.0",
    "lucide": "^0.450.0"
  },
  "devDependencies": {
    "typescript": "^5.6.0",
    "vite": "^5.4.0"
  },
  "author": "Desenvolvedor",
  "license": "MIT"
}`,
    size: 420,
    isBinary: false,
    type: 'json',
    lastModified: new Date(),
    isEdited: false,
  },
  {
    id: 'README.md',
    name: 'README.md',
    path: 'README.md',
    content: `# Meu Projeto Web

Bem-vindo ao workspace do projeto!

## 📦 Como enviar seus arquivos compactados

Você pode carregar seus arquivos de duas formas:
1. **Upload Direto no Navegador**: Arraste seu arquivo \`.zip\` ou pasta sobre esta janela. O sistema descompacta instantaneamente na memória sem expor seus dados.
2. **Envio via Chat**: Envie os trechos ou cole o conteúdo dos arquivos diretamente para continuarmos o desenvolvimento.

## 🛠️ Recursos deste Workspace
- **Árvore de Arquivos Interativa**: Navegação rápida e busca em tempo real.
- **Editor de Código com Abas**: Edição e salvamento local com numeração de linhas.
- **Pré-visualização ao Vivo**: Sandbox iframe para projetos HTML/CSS/JS.
- **Exportação ZIP**: Baixe o projeto modificado a qualquer momento com 1 clique.
- **Estatísticas do Projeto**: Análise de dependências, tipos de arquivo e tamanho.
`,
    size: 960,
    isBinary: false,
    type: 'md',
    lastModified: new Date(),
    isEdited: false,
  },
  {
    id: 'index.html',
    name: 'index.html',
    path: 'index.html',
    content: `<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Aplicação Demo - Workspace</title>
  <link rel="stylesheet" href="styles.css">
  <style>
    :root {
      --bg: #0f172a;
      --card: #1e293b;
      --text: #f8fafc;
      --accent: #6366f1;
      --muted: #94a3b8;
    }
    body {
      margin: 0;
      font-family: system-ui, -apple-system, sans-serif;
      background: var(--bg);
      color: var(--text);
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      min-height: 100vh;
      padding: 24px;
    }
    .container {
      background: var(--card);
      border: 1px solid #334155;
      border-radius: 12px;
      padding: 32px;
      max-width: 520px;
      width: 100%;
      text-align: center;
      box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.5);
    }
    h1 {
      margin-top: 0;
      font-size: 1.5rem;
      letter-spacing: -0.025em;
    }
    p {
      color: var(--muted);
      line-height: 1.6;
      font-size: 0.95rem;
    }
    .badge {
      display: inline-block;
      font-size: 0.8rem;
      color: #818cf8;
      background: rgba(99, 102, 241, 0.15);
      padding: 4px 12px;
      border-radius: 9999px;
      margin-bottom: 16px;
      font-weight: 500;
    }
    .counter-box {
      margin: 24px 0;
      padding: 20px;
      background: #090d16;
      border-radius: 8px;
      border: 1px solid #1e293b;
    }
    .counter-value {
      font-size: 2.5rem;
      font-weight: 700;
      font-family: monospace;
      color: #38bdf8;
    }
    .btn-group {
      display: flex;
      gap: 12px;
      justify-content: center;
    }
    button {
      background: var(--accent);
      color: white;
      border: none;
      padding: 10px 20px;
      border-radius: 8px;
      font-weight: 600;
      cursor: pointer;
      transition: opacity 0.2s;
    }
    button:hover {
      opacity: 0.9;
    }
    button.secondary {
      background: #334155;
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="badge">Projeto Ativo</div>
    <h1>Workspace Inicial Conectado</h1>
    <p>Esta é a pré-visualização em tempo real do arquivo index.html. Envie seu arquivo .zip para carregar seu projeto customizado.</p>
    
    <div class="counter-box">
      <div id="counter" class="counter-value">0</div>
      <p style="margin: 6px 0 0 0; font-size: 0.8rem;">Cliques registrados</p>
    </div>

    <div class="btn-group">
      <button onclick="increment()">Incrementar</button>
      <button class="secondary" onclick="reset()">Zerar</button>
    </div>
  </div>

  <script>
    let count = 0;
    const counterEl = document.getElementById('counter');
    function increment() {
      count++;
      counterEl.textContent = count;
    }
    function reset() {
      count = 0;
      counterEl.textContent = count;
    }
  </script>
</body>
</html>`,
    size: 2400,
    isBinary: false,
    type: 'html',
    lastModified: new Date(),
    isEdited: false,
  },
  {
    id: 'src/app.js',
    name: 'app.js',
    path: 'src/app.js',
    content: `// Arquivo principal da aplicação
console.log("Iniciando workspace do projeto...");

export function calculateSummary(items) {
  return items.reduce((acc, curr) => acc + curr.value, 0);
}

export function formatDate(date) {
  return new Intl.DateTimeFormat('pt-BR', {
    dateStyle: 'medium',
    timeStyle: 'short'
  }).format(date);
}
`,
    size: 320,
    isBinary: false,
    type: 'js',
    lastModified: new Date(),
    isEdited: false,
  },
  {
    id: 'src/config.json',
    name: 'config.json',
    path: 'src/config.json',
    content: `{
  "environment": "development",
  "port": 3000,
  "locale": "pt-BR",
  "theme": "dark",
  "features": {
    "liveReload": true,
    "zipExtraction": true,
    "codeHighlighting": true
  }
}`,
    size: 210,
    isBinary: false,
    type: 'json',
    lastModified: new Date(),
    isEdited: false,
  }
];

export const SAMPLE_PROJECT_STATS: ProjectStats = {
  totalFiles: SAMPLE_PROJECT_FILES.length,
  totalFolders: 1,
  totalSize: SAMPLE_PROJECT_FILES.reduce((acc, f) => acc + f.size, 0),
  compressedSize: 1850,
  languages: {
    json: 2,
    md: 1,
    html: 1,
    js: 1,
  },
  detectedType: 'HTML / CSS / JavaScript',
  projectName: 'meu-projeto-web',
  version: '1.0.0',
  description: 'Projeto web modular com visualizador interativo e dashboard',
};

import JSZip from 'jszip';
import { ProjectFile, FileTreeNode, ProjectStats } from '../types/project';

const BINARY_EXTENSIONS = new Set([
  'png', 'jpg', 'jpeg', 'gif', 'webp', 'ico', 'svg', 'bmp',
  'pdf', 'zip', 'gz', 'tar', 'woff', 'woff2', 'ttf', 'eot',
  'mp3', 'wav', 'ogg', 'mp4', 'webm', 'exe', 'bin', 'dll'
]);

export function getFileExtension(filename: string): string {
  const parts = filename.split('.');
  return parts.length > 1 ? parts[parts.length - 1].toLowerCase() : '';
}

export function formatBytes(bytes: number, decimals = 1): string {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(dm))} ${sizes[i]}`;
}

export async function parseZipFile(file: File): Promise<{ files: ProjectFile[]; stats: ProjectStats }> {
  const zip = new JSZip();
  const loadedZip = await zip.loadAsync(file);

  const files: ProjectFile[] = [];
  const languages: { [ext: string]: number } = {};
  let totalSize = 0;
  let detectedType = 'Web / Geral';
  let projectName = file.name.replace(/\.[^/.]+$/, '');
  let projectVersion = '1.0.0';
  let projectDescription = '';

  const entries: JSZip.JSZipObject[] = [];
  loadedZip.forEach((_relativePath, zipEntry) => {
    if (!zipEntry.dir && !zipEntry.name.startsWith('__MACOSX') && !zipEntry.name.includes('/.DS_Store')) {
      entries.push(zipEntry);
    }
  });

  for (const entry of entries) {
    const cleanPath = entry.name.replace(/^\.\//, '');
    const ext = getFileExtension(cleanPath) || 'txt';
    const isBinary = BINARY_EXTENSIONS.has(ext);

    let content = '';
    let size = 0;

    if (isBinary) {
      const base64 = await entry.async('base64');
      const mime = getMimeType(ext);
      content = `data:${mime};base64,${base64}`;
      size = Math.round((base64.length * 3) / 4);
    } else {
      content = await entry.async('string');
      size = new Blob([content]).size;
    }

    totalSize += size;
    languages[ext] = (languages[ext] || 0) + 1;

    // Check package.json for project meta
    if (cleanPath.endsWith('package.json') && !isBinary) {
      try {
        const pkg = JSON.parse(content);
        if (pkg.name) projectName = pkg.name;
        if (pkg.version) projectVersion = pkg.version;
        if (pkg.description) projectDescription = pkg.description;

        if (pkg.dependencies?.react || pkg.devDependencies?.react) {
          detectedType = 'React / Node.js';
        } else if (pkg.dependencies?.vue || pkg.devDependencies?.vue) {
          detectedType = 'Vue.js';
        } else if (pkg.dependencies?.next) {
          detectedType = 'Next.js';
        } else {
          detectedType = 'Node.js';
        }
      } catch {
        // ignore parse error
      }
    } else if (cleanPath.endsWith('requirements.txt') || cleanPath.endsWith('pyproject.toml')) {
      detectedType = 'Python';
    } else if (cleanPath.endsWith('Cargo.toml')) {
      detectedType = 'Rust';
    } else if (cleanPath.endsWith('go.mod')) {
      detectedType = 'Go';
    } else if (cleanPath.endsWith('index.html') && detectedType === 'Web / Geral') {
      detectedType = 'HTML / CSS / JavaScript';
    }

    files.push({
      id: cleanPath,
      name: cleanPath.split('/').pop() || cleanPath,
      path: cleanPath,
      content,
      size,
      isBinary,
      type: ext,
      lastModified: entry.date,
      isEdited: false,
    });
  }

  // Count folders
  const folderSet = new Set<string>();
  files.forEach(f => {
    const parts = f.path.split('/');
    parts.pop();
    let current = '';
    for (const p of parts) {
      current = current ? `${current}/${p}` : p;
      folderSet.add(current);
    }
  });

  const stats: ProjectStats = {
    totalFiles: files.length,
    totalFolders: folderSet.size,
    totalSize,
    compressedSize: file.size,
    languages,
    detectedType,
    projectName,
    version: projectVersion,
    description: projectDescription,
  };

  return { files, stats };
}

export function buildFileTree(files: ProjectFile[]): FileTreeNode[] {
  const root: FileTreeNode = { name: 'root', path: '', isDirectory: true, children: [] };

  for (const file of files) {
    const parts = file.path.split('/');
    let currentNode = root;

    for (let i = 0; i < parts.length; i++) {
      const part = parts[i];
      const isFile = i === parts.length - 1;
      const currentPath = parts.slice(0, i + 1).join('/');

      if (!currentNode.children) {
        currentNode.children = [];
      }

      let nextNode = currentNode.children.find(child => child.name === part);

      if (!nextNode) {
        nextNode = {
          name: part,
          path: currentPath,
          isDirectory: !isFile,
          file: isFile ? file : undefined,
          size: isFile ? file.size : 0,
          children: isFile ? undefined : [],
        };
        currentNode.children.push(nextNode);
      }

      currentNode = nextNode;
    }
  }

  function sortNodes(node: FileTreeNode) {
    if (node.children) {
      node.children.sort((a, b) => {
        if (a.isDirectory && !b.isDirectory) return -1;
        if (!a.isDirectory && b.isDirectory) return 1;
        return a.name.localeCompare(b.name);
      });
      node.children.forEach(sortNodes);
    }
  }

  sortNodes(root);
  return root.children || [];
}

export async function exportFilesToZip(files: ProjectFile[], zipName = 'projeto.zip'): Promise<void> {
  const zip = new JSZip();

  for (const file of files) {
    if (file.isBinary) {
      const base64Data = file.content.split(',')[1];
      if (base64Data) {
        zip.file(file.path, base64Data, { base64: true });
      }
    } else {
      zip.file(file.path, file.content);
    }
  }

  const blob = await zip.generateAsync({ type: 'blob' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = zipName;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

export function getMimeType(ext: string): string {
  const map: { [k: string]: string } = {
    png: 'image/png',
    jpg: 'image/jpeg',
    jpeg: 'image/jpeg',
    gif: 'image/gif',
    svg: 'image/svg+xml',
    webp: 'image/webp',
    ico: 'image/x-icon',
    html: 'text/html',
    css: 'text/css',
    js: 'text/javascript',
    ts: 'text/typescript',
    json: 'application/json',
    md: 'text/markdown',
    txt: 'text/plain',
  };
  return map[ext] || 'application/octet-stream';
}

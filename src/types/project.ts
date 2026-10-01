export interface ProjectFile {
  id: string;
  name: string;
  path: string; // full path e.g. "src/components/Button.tsx"
  content: string; // text content or base64 data url for binary/images
  size: number;
  isBinary: boolean;
  type: string; // file extension e.g. "ts", "json", "png"
  lastModified?: Date;
  isEdited?: boolean;
}

export interface FileTreeNode {
  name: string;
  path: string;
  isDirectory: boolean;
  size?: number;
  children?: FileTreeNode[];
  file?: ProjectFile;
}

export interface ProjectStats {
  totalFiles: number;
  totalFolders: number;
  totalSize: number;
  compressedSize?: number;
  languages: { [ext: string]: number };
  detectedType: string; // 'Node.js / React', 'HTML / CSS / JS', 'Python', 'General'
  projectName: string;
  version?: string;
  description?: string;
}

export interface EditorTab {
  id: string;
  path: string;
  title: string;
  isDirty?: boolean;
}

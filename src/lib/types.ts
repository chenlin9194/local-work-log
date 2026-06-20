export interface Note {
  id: string;
  title: string;
  content: string;
  project: string | null;
  module: string | null;
  type: string;
  priority: string;
  status: string;
  owner: string | null;
  dueDate: string | null;
  source: string;
  tags: string | null;
  createdAt: string | Date;
  updatedAt?: string | Date;
}

export interface AiAgent {
  id: string;
  name: string;       // 内部标识
  label: string;      // 显示名称
  description: string; // 备注（如：运行在 WSL 里）
  command: string;    // CLI 命令模板，{prompt_file} 被替换
  isDefault: boolean;
  enabled: boolean;
  createdAt?: string | Date;
  updatedAt?: string | Date;
}

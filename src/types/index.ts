export interface ProjectConfig {
  name: string;
  template: string;
  packageManager: 'npm' | 'yarn' | 'pnpm';
  typescript: boolean;
  tailwind: boolean;
  eslint: boolean;
  path: string;
}

export interface Integration {
  name: string;
  description: string;
  providers: Provider[];
}

export interface Provider {
  name: string;
  description: string;
  configOptions: ConfigOption[];
}

export interface ConfigOption {
  type: 'input' | 'confirm' | 'list' | 'checkbox';
  name: string;
  message: string;
  choices?: string[];
  default?: any;
}

export interface VibeConfig {
  project: {
    name: string;
    version: string;
    template: string;
  };
  integrations: Record<string, IntegrationConfig>;
  settings: {
    packageManager: string;
    typescript: boolean;
    tailwind: boolean;
    eslint: boolean;
  };
}

export interface IntegrationConfig {
  provider: string;
  version: string;
  config: Record<string, any>;
}

export interface HealthResult {
  name: string;
  status: 'pass' | 'warn' | 'fail';
  message: string;
  suggestions?: string[];
} 
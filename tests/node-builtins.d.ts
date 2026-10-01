declare module "node:fs" {
  type DirectoryEntry = {
    name: string;
    isDirectory(): boolean;
  };

  export function readdirSync(path: string, options: { withFileTypes: true }): DirectoryEntry[];
  export function readFileSync(path: string, encoding: "utf8"): string;
}

declare module "node:path" {
  export function join(...paths: string[]): string;
  export function relative(from: string, to: string): string;
}

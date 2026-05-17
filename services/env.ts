import { existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';

export function carregarEnv(caminho = '.env') {
    const envPath = resolve(process.cwd(), caminho);
    if (!existsSync(envPath)) return;

    const linhas = readFileSync(envPath, 'utf8').split(/\r?\n/);

    linhas.forEach(linha => {
        const limpa = linha.trim();
        if (!limpa || limpa.startsWith('#')) return;

        const separador = limpa.indexOf('=');
        if (separador === -1) return;

        const chave = limpa.slice(0, separador).trim();
        const valor = limpa.slice(separador + 1).trim().replace(/^["']|["']$/g, '');

        if (chave && process.env[chave] === undefined) {
            process.env[chave] = valor;
        }
    });
}

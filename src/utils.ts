import { promises as fs } from 'fs';

export async function deleteFile(filePath: string) {
  try {
    await fs.unlink(filePath);
  } catch (err) {
    console.error(`Erro ao deletar o arquivo ${filePath}:`, err);
  }
}
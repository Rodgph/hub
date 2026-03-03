import { supabase } from '@/config/supabase';

export interface UploadOptions {
  bucket?: string;
  onProgress?: (percent: number) => void;
}

export const storageService = {
  /**
   * Faz upload de um arquivo para o storage.
   * @param path O path completo gerado pelo buildR2Path
   * @param file O objeto File do navegador
   * @param options Opções de upload (bucket, progresso)
   */
  async uploadFile(path: string, file: File, options?: UploadOptions) {
    const bucket = options?.bucket || 'media';

    const { data, error } = await supabase.storage
      .from(bucket)
      .upload(path, file, {
        cacheControl: '3600',
        upsert: true,
      });

    if (error) {
      throw new Error(`Erro no upload: ${error.message}`);
    }

    // Retorna a URL pública do arquivo
    const { data: { publicUrl } } = supabase.storage
      .from(bucket)
      .getPublicUrl(path);

    return publicUrl;
  },

  /**
   * Remove um arquivo do storage.
   */
  async deleteFile(path: string, bucket: string = 'media') {
    const { error } = await supabase.storage
      .from(bucket)
      .remove([path]);

    if (error) {
      throw new Error(`Erro ao deletar: ${error.message}`);
    }
  },

  /**
   * Valida o arquivo antes do upload baseado no tipo e tamanho.
   */
  validateFile(file: File, maxSizeMB: number, allowedTypes: string[]) {
    const sizeMB = file.size / (1024 * 1024);
    
    if (sizeMB > maxSizeMB) {
      throw new Error(`Arquivo muito grande. Máximo permitido: ${maxSizeMB}MB`);
    }

    if (!allowedTypes.some(type => file.type.includes(type))) {
      throw new Error(`Tipo de arquivo não suportado. Permitidos: ${allowedTypes.join(', ')}`);
    }

    return true;
  }
};

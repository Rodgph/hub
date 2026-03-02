use tauri::AppHandle;
use std::time::Duration;
use tokio::time::sleep;

pub async fn start(_app: AppHandle) {
    loop {
        println!("[Cold Storage] Verificando mensagens elegíveis para migração...");
        
        // 1. SELECT mensagens com mais de 30 dias, não editadas recentemente, não pinadas, não favoritadas
        // (Lógica via RPC do Supabase ou Query direta)
        
        // 2. Agrupar por conversa e mês
        
        // 3. Comprimir com zstd e upload para R2
        
        // 4. UPDATE DB: cold_ref = path, content = NULL
        
        println!("[Cold Storage] Job finalizado. Próxima execução em 24h.");
        
        // Roda uma vez a cada 24 horas
        sleep(Duration::from_secs(24 * 60 * 60)).await;
    }
}

use sysinfo::{System, Disks};
use serde::Serialize;

#[derive(Serialize)]
pub struct HardwareStats {
    pub cpu_usage: f32,
    pub ram_used: u64,
    pub ram_total: u64,
    pub ram_usage_percent: f32,
    pub disks: Vec<DiskStats>,
}

#[derive(Serialize)]
pub struct DiskStats {
    pub name: String,
    pub mount_point: String,
    pub total_space: u64,
    pub available_space: u64,
    pub usage_percent: f32,
}

#[tauri::command]
pub async fn get_hardware_stats() -> HardwareStats {
    let mut sys = System::new_all();
    
    // Refresh inicial
    sys.refresh_cpu_usage();
    sys.refresh_memory();

    // Esperar um pouco para a CPU capturar o diferencial de uso
    tokio::time::sleep(std::time::Duration::from_millis(200)).await;
    sys.refresh_cpu_usage();

    let cpu_usage = sys.global_cpu_info().cpu_usage();
    let ram_used = sys.used_memory();
    let ram_total = sys.total_memory();
    let ram_usage_percent = (ram_used as f32 / ram_total as f32) * 100.0;

    // Discos na v0.30+ são gerenciados pela struct Disks
    let mut disk_list = Vec::new();
    let disks = Disks::new_with_refreshed_list();
    
    for disk in &disks {
        let total = disk.total_space();
        let available = disk.available_space();
        let used = total - available;
        let usage_percent = if total > 0 { (used as f32 / total as f32) * 100.0 } else { 0.0 };
        
        disk_list.push(DiskStats {
            name: disk.name().to_string_lossy().to_string(),
            mount_point: disk.mount_point().to_string_lossy().to_string(),
            total_space: total,
            available_space: available,
            usage_percent,
        });
    }

    HardwareStats {
        cpu_usage,
        ram_used,
        ram_total,
        ram_usage_percent,
        disks: disk_list,
    }
}

use tauri::Manager;

mod jobs;
pub mod commands;

use commands::webview::{create_browser_webview, update_webview_bounds, destroy_webview};
use commands::hardware::get_hardware_stats;

#[tauri::command]
async fn show_main_window(app: tauri::AppHandle) {
    if let Some(main_window) = app.get_webview_window("main") {
        let _ = main_window.set_skip_taskbar(false);
        let _ = main_window.unminimize();
        let _ = main_window.show();
        let _ = main_window.set_focus();
    }
}

#[tauri::command]
async fn close_auth_window(app: tauri::AppHandle) {
    if let Some(auth_window) = app.get_webview_window("auth") {
        auth_window.close().unwrap();
    }
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_window_state::Builder::default().build())
        .plugin(tauri_plugin_global_shortcut::Builder::new().build())
        .plugin(tauri_plugin_deep_link::init())
        .setup(|app| {
            // Iniciar background jobs
            let app_handle = app.handle().clone();
            tokio::spawn(async move {
                jobs::cold_storage::start(app_handle).await;
            });

            // Garante que a janela principal esteja TOTALMENTE oculta no boot
            if let Some(main_window) = app.get_webview_window("main") {
                let _ = main_window.hide();
                let _ = main_window.set_skip_taskbar(true);
            }
            
            // Garante que a janela de auth esteja visível e focada
            if let Some(auth_window) = app.get_webview_window("auth") {
                let _ = auth_window.show();
                let _ = auth_window.set_focus();
            }
            Ok(())
        })
        .invoke_handler(tauri::generate_handler![
            show_main_window,
            close_auth_window,
            get_hardware_stats,
            create_browser_webview,
            update_webview_bounds,
            destroy_webview
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}

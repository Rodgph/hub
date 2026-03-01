#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

use tauri::{AppHandle, Emitter, Manager, WebviewUrl, WebviewWindowBuilder};
use tauri_plugin_global_shortcut::{Code, GlobalShortcutExt, Modifiers, Shortcut};
use window_vibrancy::{apply_acrylic, apply_mica};

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
        let _ = auth_window.close();
    }
}

#[tauri::command]
async fn logout_transition(app: tauri::AppHandle) {
    // 1. Esconde a janela principal
    if let Some(main_window) = app.get_webview_window("main") {
        let _ = main_window.hide();
        let _ = main_window.set_skip_taskbar(true);
    }

    // 2. Cria a janela de auth novamente
    let _ = create_auth_window(&app);
}

fn main() {
    tauri::Builder::default()
        .plugin(tauri_plugin_window_state::Builder::new().build())
        .plugin(tauri_plugin_global_shortcut::Builder::new().with_handler(move |app, _shortcut, event| {
            if event.state == tauri_plugin_global_shortcut::ShortcutState::Pressed {
                let handle = app.app_handle();
                toggle_search(&handle);
            }
        }).build())
        .plugin(tauri_plugin_deep_link::init())
        .setup(|app| {
            // Garante que a janela principal esteja TOTALMENTE oculta no boot
            if let Some(main_window) = app.get_webview_window("main") {
                let _ = main_window.hide();
                let _ = main_window.set_skip_taskbar(true);
                
                #[cfg(target_os = "windows")]
                {
                    if apply_mica(&main_window, Some(true)).is_err() {
                        let _ = apply_acrylic(&main_window, Some((0, 0, 0, 120)));
                    }
                }
            }
            
            // Cria a janela de auth inicial
            create_auth_window(app.handle())?;

            create_search_window(app.handle())?;

            let shortcut = Shortcut::new(Some(Modifiers::CONTROL | Modifiers::ALT), Code::Space);
            let _ = app.global_shortcut().register(shortcut);

            Ok(())
        })
        .invoke_handler(tauri::generate_handler![
            show_main_window,
            close_auth_window,
            logout_transition
        ])
        .run(tauri::generate_context!())
        .expect("erro ao iniciar o app");
}

fn create_auth_window(app: &AppHandle) -> Result<(), Box<dyn std::error::Error>> {
    let _win = WebviewWindowBuilder::new(
        app,
        "auth",
        WebviewUrl::App("index.html".into()),
    )
    .title("Login - SocialOS")
    .inner_size(400.0, 600.0)
    .resizable(false)
    .decorations(false)
    .transparent(true)
    .shadow(true)
    .center()
    .visible(true)
    .build()?;

    Ok(())
}

fn create_search_window(app: &AppHandle) -> Result<(), Box<dyn std::error::Error>> {
    let main_win = app
        .get_webview_window("main")
        .ok_or("janela main nao encontrada")?;

    let monitor = main_win
        .current_monitor()?
        .ok_or("monitor nao encontrado")?;

    let screen_size = monitor.size();
    let screen_pos = monitor.position();

    let win_w: i32 = 680;
    let win_h: i32 = 500;

    let x = screen_pos.x + (screen_size.width as i32 - win_w) / 2;
    let y = screen_pos.y + 20;

    let search_win = WebviewWindowBuilder::new(
        app,
        "search",
        WebviewUrl::App("index.html".into()),
    )
    .title("")
    .inner_size(win_w as f64, win_h as f64)
    .position(x as f64, y as f64)
    .resizable(false)
    .decorations(false)
    .transparent(true)
    .always_on_top(true)
    .skip_taskbar(true)
    .shadow(true)
    .visible(false)
    .build()?;

    #[cfg(target_os = "windows")]
    {
        if apply_mica(&search_win, Some(true)).is_err() {
            let _ = apply_acrylic(&search_win, Some((0, 0, 0, 200)));
        }
    }

    let win_clone = search_win.clone();
    search_win.on_window_event(move |event| {
        if let tauri::WindowEvent::Focused(false) = event {
            let _ = win_clone.hide();
        }
    });

    Ok(())
}

fn toggle_search(app: &AppHandle) {
    let Some(win) = app.get_webview_window("search") else {
        return;
    };

    if win.is_visible().unwrap_or(false) {
        let _ = win.hide();
    } else {
        let _ = win.unminimize();
        let _ = win.show();
        let _ = win.set_focus();
        let _ = win.set_focus(); // intencional: fix bug Windows
        let _ = win.emit("search:focused", ());
    }
}
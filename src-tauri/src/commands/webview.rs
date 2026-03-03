use tauri::{AppHandle, Manager, WebviewUrl, WebviewWindowBuilder, PhysicalPosition, PhysicalSize, Url};
use std::collections::HashMap;
use std::sync::Mutex;
use lazy_static::lazy_static;

lazy_static! {
    static ref MODULE_WEBVIEWS: Mutex<HashMap<String, String>> = Mutex::new(HashMap::new());
}

fn label_for(node_id: &str) -> String {
    format!("webview_{}", node_id)
}

#[tauri::command]
pub async fn create_browser_webview(
    app: AppHandle,
    node_id: String,
    url: String,
    x: f64,
    y: f64,
    width: f64,
    height: f64,
) -> Result<(), String> {
    let label = label_for(&node_id);
    let parsed_url = Url::parse(&url).map_err(|e| format!("URL Parse Error: {}", e))?;

    println!("[Rust] Command Received: create_webview | node: {} | x: {}, y: {}, w: {}, h: {}", node_id, x, y, width, height);

    // 1. Verificar se a janela já existe
    if let Some(window) = app.get_webview_window(&label) {
        println!("[Rust] Window exists, updating: {}", label);
        let _ = window.navigate(parsed_url);
        let _ = window.set_position(tauri::Position::Physical(PhysicalPosition::new(x as i32, y as i32)));
        let _ = window.set_size(tauri::Size::Physical(PhysicalSize::new(width as u32, height as u32)));
        let _ = window.show();
        return Ok(());
    }

    // 2. Pegar escala para converter coordenadas iniciais (o builder do Tauri costuma preferir logical)
    let scale = app.get_webview_window("main")
        .and_then(|w| w.scale_factor().ok())
        .unwrap_or(1.0);
    
    println!("[Rust] Detected Scale: {}", scale);

    // 3. Criar a WebviewWindow
    // Usamos coordenadas lógicas no builder para evitar que ele jogue a janela longe demais no início
    let w = WebviewWindowBuilder::new(&app, &label, WebviewUrl::External(parsed_url))
        .decorations(false)
        .skip_taskbar(true)
        .position(x / scale, y / scale)
        .inner_size(width / scale, height / scale)
        .visible(true) // Forçar visibilidade desde o início
        .build()
        .map_err(|e| format!("Falha ao criar janela de webview: {}", e))?;

    println!("[Rust] Window created successfully: {}", label);

    // 4. Forçar posição física exata após criação (garante pixel-perfect)
    let _ = w.set_position(tauri::Position::Physical(PhysicalPosition::new(x as i32, y as i32)));
    let _ = w.set_size(tauri::Size::Physical(PhysicalSize::new(width as u32, height as u32)));

    // 5. Configurar "Owned Window" no Windows (Efeito Grudado)
    #[cfg(windows)]
    {
        use windows_sys::Win32::UI::WindowsAndMessaging::{SetWindowLongPtrW, GWL_HWNDPARENT, SetWindowPos, SWP_NOMOVE, SWP_NOSIZE, SWP_NOACTIVATE};
        if let Some(main) = app.get_webview_window("main") {
            if let (Ok(main_hwnd), Ok(child_hwnd)) = (main.hwnd(), w.hwnd()) {
                println!("[Rust] Setting Windows Owner... Main: {:?}, Child: {:?}", main_hwnd.0, child_hwnd.0);
                unsafe {
                    SetWindowLongPtrW(child_hwnd.0 as _, GWL_HWNDPARENT, main_hwnd.0 as _);
                    SetWindowPos(child_hwnd.0 as _, 0, 0, 0, 0, 0, SWP_NOMOVE | SWP_NOSIZE | SWP_NOACTIVATE);
                }
            }
        }
    }

    // 6. Registrar e monitorar destruição
    {
        let mut map = MODULE_WEBVIEWS.lock().map_err(|_| "Mutex lock failed")?;
        map.insert(node_id.clone(), label);
    }

    let node_clone = node_id.clone();
    w.on_window_event(move |event| {
        if let tauri::WindowEvent::Destroyed = event {
            println!("[Rust] Window Destroyed: {}", node_clone);
            if let Ok(mut map) = MODULE_WEBVIEWS.lock() {
                map.remove(&node_clone);
            }
        }
    });

    Ok(())
}

#[tauri::command]
pub async fn update_webview_bounds(
    app: AppHandle,
    node_id: String,
    x: f64,
    y: f64,
    width: f64,
    height: f64,
) -> Result<(), String> {
    let label = label_for(&node_id);
    if let Some(window) = app.get_webview_window(&label) {
        let _ = window.set_position(tauri::Position::Physical(PhysicalPosition::new(x as i32, y as i32)));
        let _ = window.set_size(tauri::Size::Physical(PhysicalSize::new(width as u32, height as u32)));
    }
    Ok(())
}

#[tauri::command]
pub async fn destroy_webview(app: AppHandle, node_id: String) -> Result<(), String> {
    let label = label_for(&node_id);
    if let Some(window) = app.get_webview_window(&label) {
        println!("[Rust] Destroying Window: {}", label);
        let _ = window.close();
    }
    let mut map = MODULE_WEBVIEWS.lock().map_err(|_| "Mutex lock failed")?;
    map.remove(&node_id);
    Ok(())
}

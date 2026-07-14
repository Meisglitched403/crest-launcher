use std::net::{TcpStream, ToSocketAddrs};
use std::process::{Command, Child, Stdio};
use std::sync::Mutex;
use std::time::Duration;
use tauri::Manager;

struct PythonServer(Mutex<Option<Child>>);

fn find_python() -> Option<String> {
    for name in &["python3", "python"] {
        if let Ok(out) = Command::new(name).arg("--version").output() {
            if out.status.success() {
                return Some(name.to_string());
            }
        }
    }
    None
}

fn start_python_server() -> Result<Child, String> {
    let python = find_python().ok_or("Python not found. Install Python 3.9+.")?;

    // Try to find backend dir relative to various working directories
    let candidates = [
        std::env::current_dir().ok().map(|d| d.join("backend")),
        std::env::current_dir().ok().and_then(|d| d.parent().map(|p| p.join("backend"))),
        std::env::current_exe()
            .ok()
            .and_then(|p| p.parent().map(|d| d.join("backend"))),
        Some(std::path::PathBuf::from("backend")),
    ];
    let backend_dir = candidates
        .into_iter()
        .flatten()
        .find(|d| d.exists())
        .ok_or_else(|| {
            format!(
                "Backend dir not found. CWD: {:?}",
                std::env::current_dir().unwrap_or_default()
            )
        })?;

    let child = Command::new(&python)
        .arg("-c")
        .arg("import sys; sys.path.insert(0, '.'); from crest.server import serve; serve()")
        .current_dir(&backend_dir)
        .stdout(Stdio::null())
        .stderr(Stdio::null())
        .spawn()
        .map_err(|e| format!("Failed to start Python server: {e}"))?;

    log::info!("Python server started (PID {})", child.id());

    // ponytail: simple TCP retry — poll port 8765 until it accepts a connection
    let addr = ("127.0.0.1", 8765)
        .to_socket_addrs()
        .map_err(|e| format!("Bad addr: {e}"))?
        .next()
        .ok_or("No addr")?;

    for attempt in 1..=15 {
        std::thread::sleep(Duration::from_millis(200));
        if TcpStream::connect_timeout(&addr, Duration::from_millis(100)).is_ok() {
            log::info!("Python server ready after ~{}ms", attempt * 200);
            return Ok(child);
        }
    }

    Err("Python server did not become reachable on port 8765 within 3s".into())
}

#[tauri::command]
fn get_python_port() -> u16 {
    8765
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    let builder = tauri::Builder::default()
        .plugin(tauri_plugin_http::init())
        .setup(|app| {
            let child = start_python_server()?;
            app.manage(PythonServer(Mutex::new(Some(child))));
            Ok(())
        })
        .invoke_handler(tauri::generate_handler![get_python_port]);

    builder
        .build(tauri::generate_context!())
        .expect("error while building tauri application")
        .run(|_app_handle, event| {
            if let tauri::RunEvent::Exit = event {
                if let Some(state) = _app_handle.try_state::<PythonServer>() {
                    if let Ok(mut guard) = state.0.lock() {
                        if let Some(ref mut child) = *guard {
                            let _ = child.kill();
                        }
                    }
                }
            }
        });
}

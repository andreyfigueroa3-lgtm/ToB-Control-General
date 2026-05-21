// ============================================================
// ToB Operations Center — auth.js
// Manejo de sesión y protección de rutas
// ============================================================

document.addEventListener('DOMContentLoaded', async () => {
  const db = window._supabaseClient;
  if (!db) {
    console.error('Supabase no está inicializado.');
    return;
  }

  const isLoginPage = window.location.pathname.endsWith('login.html');

  try {
    // Comprobar la sesión actual
    const { data: { session }, error } = await db.auth.getSession();

    if (error || !session) {
      // Si NO hay sesión y NO estamos en login.html, redirigimos
      if (!isLoginPage) {
        window.location.replace('login.html');
      }
    } else {
      // Si HAY sesión y estamos en login.html, redirigimos al dashboard
      if (isLoginPage) {
        window.location.replace('index.html');
      } else {
        // Inyectar botón de Perfil en el KPI Bar si existe y no estamos en login
        injectProfileButton();
      }
    }

    // Escuchar cambios de sesión (ej. si expira la sesión o hace logout en otra pestaña)
    db.auth.onAuthStateChange((event, session) => {
      if (event === 'SIGNED_OUT') {
        window.location.replace('login.html');
      } else if (event === 'SIGNED_IN' && isLoginPage) {
        window.location.replace('index.html');
      }
    });

  } catch (err) {
    console.error('Error verificando sesión:', err);
    if (!isLoginPage) window.location.replace('login.html');
  }
});

// Función global para cerrar sesión
window.logout = async () => {
  const db = window._supabaseClient;
  if (db) {
    // Cambiar texto de botón para feedback
    const btn = document.getElementById('btn-logout');
    if (btn) btn.innerHTML = '<span class="loading-spinner" style="width:14px;height:14px;border-width:2px;border-color:currentColor;border-right-color:transparent;border-radius:50%;display:inline-block;animation:spin 1s linear infinite;"></span> Saliendo...';
    
    // Limpiar credenciales
    localStorage.removeItem('tob_user_email');
    localStorage.removeItem('tob_user_password');

    await db.auth.signOut();
  }
};

// Inyectar botón de perfil dinámicamente en el header
function injectProfileButton() {
  const logoWrap = document.querySelector('.kpi-bar__logo');
  if (!logoWrap || document.getElementById('btn-profile-wrapper')) return;

  // Wrapper para posicionamiento relativo
  const wrapper = document.createElement('div');
  wrapper.id = 'btn-profile-wrapper';
  wrapper.style.cssText = 'position: relative; margin-left: 16px;';

  const profileBtn = document.createElement('button');
  profileBtn.id = 'btn-profile';
  profileBtn.className = 'btn-profile';
  profileBtn.innerHTML = 'Perfil <span aria-hidden="true">👤</span>';
  profileBtn.title = 'Ver mi perfil';
  
  profileBtn.style.cssText = `
    background: rgba(255, 255, 255, 0.05);
    border: 1px solid rgba(255, 255, 255, 0.1);
    color: var(--text-secondary);
    padding: 6px 12px;
    border-radius: 6px;
    font-size: 13px;
    font-weight: 500;
    cursor: pointer;
    display: inline-flex;
    align-items: center;
    gap: 6px;
    transition: all 0.2s ease;
    font-family: 'Inter', sans-serif;
  `;
  
  profileBtn.onmouseenter = () => {
    profileBtn.style.background = 'rgba(255, 255, 255, 0.1)';
    profileBtn.style.borderColor = 'rgba(255, 255, 255, 0.2)';
    profileBtn.style.color = '#fff';
  };
  profileBtn.onmouseleave = () => {
    profileBtn.style.background = 'rgba(255, 255, 255, 0.05)';
    profileBtn.style.borderColor = 'rgba(255, 255, 255, 0.1)';
    profileBtn.style.color = 'var(--text-secondary)';
  };

  // Popup de perfil
  const profilePopup = document.createElement('div');
  profilePopup.id = 'profile-popup';
  profilePopup.style.cssText = `
    display: none;
    position: absolute;
    top: calc(100% + 10px);
    left: 0;
    width: 260px;
    background: var(--bg-surface);
    border: 1px solid var(--border-color);
    border-radius: 8px;
    padding: 16px;
    box-shadow: 0 4px 12px rgba(0,0,0,0.5);
    z-index: 1000;
    flex-direction: column;
    gap: 12px;
    font-family: 'Inter', sans-serif;
  `;

  const email = localStorage.getItem('tob_user_email') || 'coordinador@tob.com';
  const password = localStorage.getItem('tob_user_password') || '********';

  profilePopup.innerHTML = `
    <div style="font-size: 14px; font-weight: 600; color: #fff; margin-bottom: 4px;">Mis Credenciales</div>
    <div style="display: flex; flex-direction: column; gap: 4px;">
      <label style="font-size: 11px; color: var(--text-secondary); text-transform: uppercase; letter-spacing: 0.5px;">Correo</label>
      <div style="font-size: 13px; color: #fff; background: rgba(0,0,0,0.2); padding: 8px; border-radius: 4px; border: 1px solid rgba(255,255,255,0.05); word-break: break-all;">${email}</div>
    </div>
    <div style="display: flex; flex-direction: column; gap: 4px;">
      <label style="font-size: 11px; color: var(--text-secondary); text-transform: uppercase; letter-spacing: 0.5px;">Contraseña</label>
      <div style="display: flex; align-items: center; background: rgba(0,0,0,0.2); border-radius: 4px; border: 1px solid rgba(255,255,255,0.05);">
        <input type="password" id="profile-password-input" value="${password}" readonly style="flex: 1; background: transparent; border: none; color: #fff; padding: 8px; font-size: 13px; font-family: 'Inter', sans-serif; outline: none; width: 100%;">
        <button id="btn-toggle-password" style="background: none; border: none; color: var(--text-secondary); padding: 0 10px; cursor: pointer; display: flex; align-items: center; justify-content: center; height: 100%;">
          <span aria-hidden="true" style="font-size: 14px;">👁️</span>
        </button>
      </div>
    </div>
    <button id="btn-logout" style="margin-top: 8px; background: rgba(255, 69, 58, 0.1); border: 1px solid rgba(255, 69, 58, 0.2); color: #ff453a; padding: 8px; border-radius: 6px; font-size: 13px; font-weight: 500; cursor: pointer; display: flex; align-items: center; justify-content: center; gap: 6px; transition: all 0.2s ease;">
      Cerrar Sesión <span aria-hidden="true">🚪</span>
    </button>
  `;

  wrapper.appendChild(profileBtn);
  wrapper.appendChild(profilePopup);
  logoWrap.appendChild(wrapper);

  // Toggle Popup
  profileBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    profilePopup.style.display = profilePopup.style.display === 'none' || profilePopup.style.display === '' ? 'flex' : 'none';
  });

  // Toggle Password
  const toggleBtn = profilePopup.querySelector('#btn-toggle-password');
  const passwordInput = profilePopup.querySelector('#profile-password-input');
  toggleBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    if (passwordInput.type === 'password') {
      passwordInput.type = 'text';
      toggleBtn.innerHTML = '<span aria-hidden="true" style="font-size: 14px;">🙈</span>';
    } else {
      passwordInput.type = 'password';
      toggleBtn.innerHTML = '<span aria-hidden="true" style="font-size: 14px;">👁️</span>';
    }
  });

  // Logout
  const logoutBtn = profilePopup.querySelector('#btn-logout');
  logoutBtn.onmouseenter = () => {
    logoutBtn.style.background = 'rgba(255, 69, 58, 0.2)';
    logoutBtn.style.borderColor = 'rgba(255, 69, 58, 0.4)';
  };
  logoutBtn.onmouseleave = () => {
    logoutBtn.style.background = 'rgba(255, 69, 58, 0.1)';
    logoutBtn.style.borderColor = 'rgba(255, 69, 58, 0.2)';
  };
  logoutBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    window.logout();
  });

  // Cerrar si se clickea afuera
  document.addEventListener('click', (e) => {
    if (!wrapper.contains(e.target)) {
      profilePopup.style.display = 'none';
    }
  });
}

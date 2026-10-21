<%@ Page Language="C#" AutoEventWireup="true" CodeBehind="Default.aspx.cs" Inherits="Ceduver.Default" %>

<!DOCTYPE html>
<html xmlns="http://www.w3.org/1999/xhtml">
<head>
    <meta charset="utf-8" />
    <title>Cédula de Verificación | Acceso al Sistema</title>
    <meta name="description" content="Sistema de Cédula de Verificación y Seguimiento de Obra - H. Ayuntamiento de Chilón" />
    <meta name="viewport" content="width=device-width, initial-scale=1, shrink-to-fit=no" />
    <link rel="stylesheet" href="assets/css/fonts.css" />
    <link href="assets/css/pages/users/login-1.css" rel="stylesheet" type="text/css" />
    <link href="assets/plugins/global/plugins.bundle.css" rel="stylesheet" type="text/css" />
    <link href="assets/css/style.bundle.css" rel="stylesheet" type="text/css" />
    <link rel="shortcut icon" href="assets/media/logo_chilon.png" />
    <style>
        /* ══════════════════════════════════════════════════
           PALETA H. AYUNTAMIENTO DE CHILÓN
           ══════════════════════════════════════════════════ */
        :root {
            --chilon-rojo: #D2232A;
            --chilon-rojo-oscuro: #A11B1B;
            --chilon-verde: #00A651;
            --chilon-verde-oscuro: #086B36;
            --chilon-cafe: #6E4A2E;
            --chilon-dorado: #F2A900;
            --chilon-texto: #1A1A1A;
        }

        /* ── Fondo animado con gradiente (rojo institucional + acento verde) ── */
        .login-aside {
            background: linear-gradient(150deg, var(--chilon-rojo-oscuro) 0%, var(--chilon-rojo) 55%, #8a2a1f 100%) !important;
            position: relative;
            overflow: hidden;
        }

        /* Franja dorada/roja superior, inspirada en el logo */
        .login-aside::before {
            content: '';
            position: absolute;
            top: 0; left: 0; right: 0;
            height: 6px;
            background: linear-gradient(90deg, var(--chilon-dorado) 0%, var(--chilon-dorado) 50%, var(--chilon-rojo-oscuro) 50%, var(--chilon-rojo-oscuro) 100%);
            z-index: 3;
        }

        /* Círculos decorativos animados, en tono verde hoja */
        .login-aside::after {
            content: '';
            position: absolute;
            width: 320px; height: 320px;
            border-radius: 50%;
            background: rgba(0,166,81,0.14);
            bottom: -90px; right: -80px;
            animation: float 7s ease-in-out infinite reverse;
        }
        .circulo-deco {
            position: absolute;
            border-radius: 50%;
            animation: float 10s ease-in-out infinite;
        }
        .circulo-deco.c1 { width:220px; height:220px; top:22%; left:58%; background: rgba(242,169,0,0.10); animation-delay:-3s; }
        .circulo-deco.c2 { width:150px; height:150px; top:65%; left:12%; background: rgba(0,166,81,0.10); animation-delay:-1s; }

        @keyframes float {
            0%,100% { transform: translateY(0px) rotate(0deg); }
            50%      { transform: translateY(-20px) rotate(5deg); }
        }

        /* ── Panel del logo ── */
        .escudo-container {
            background: #fff;
            border-radius: 18px;
            width: 100%;
            max-width: 260px;
            padding: 18px 20px;
            display: flex; align-items: center; justify-content: center;
            margin: 0 auto 22px;
            box-shadow: 0 10px 30px rgba(0,0,0,0.28);
        }
        .escudo-container img { width: 100%; height: auto; }

        /* ── Nombre del municipio ── */
        .sistema-titulo {
            color: #fff;
            font-size: 1.6rem;
            font-weight: 700;
            text-align: center;
            text-shadow: 0 2px 8px rgba(0,0,0,0.3);
            line-height: 1.3;
        }
        .sistema-subtitulo {
            color: rgba(255,255,255,0.85);
            font-size: 0.88rem;
            text-align: center;
            margin-top: 8px;
            letter-spacing: 0.3px;
        }

        /* Separador con icono */
        .separador-h {
            display: flex; align-items: center; gap: 10px;
            color: rgba(255,255,255,0.6);
            margin: 24px 0;
            font-size: 0.75rem;
            text-transform: uppercase;
            letter-spacing: 2px;
        }
        .separador-h::before, .separador-h::after {
            content: ''; flex: 1;
            height: 1px; background: rgba(255,255,255,0.25);
        }

        /* Nombre del sistema (única línea, sustituye la lista anterior) */
        .sistema-nombre {
            background: rgba(255,255,255,0.12);
            border-radius: 12px;
            padding: 16px 20px;
            backdrop-filter: blur(5px);
            border: 1px solid rgba(255,255,255,0.2);
            display: flex; align-items: center; gap: 12px;
        }
        .sistema-nombre i {
            color: var(--chilon-dorado);
            font-size: 1.4rem;
            flex-shrink: 0;
        }
        .sistema-nombre span {
            color: #fff;
            font-size: 0.98rem;
            font-weight: 600;
            line-height: 1.35;
        }

        /* ── Formulario derecho ── */
        .login-form-card {
            background: #fff;
            border-radius: 20px;
            padding: 40px 40px;
            box-shadow: 0 20px 60px rgba(0,0,0,0.12);
            width: 100%; max-width: 420px;
            border-top: 4px solid var(--chilon-dorado);
        }

        .login-form-card .icon-header {
            width: 70px; height: 70px;
            background: linear-gradient(135deg, var(--chilon-rojo), var(--chilon-rojo-oscuro));
            border-radius: 16px;
            display: flex; align-items: center; justify-content: center;
            margin: 0 auto 20px;
            box-shadow: 0 8px 20px rgba(210,35,42,0.35);
        }
        .login-form-card .icon-header i {
            font-size: 28px; color: #fff;
        }

        .login-form-card h3 {
            color: var(--chilon-rojo-oscuro);
            font-weight: 700;
            font-size: 1.5rem;
            text-align: center;
        }
        .login-form-card .subtitulo-form {
            color: #80808F;
            font-size: 0.85rem;
            text-align: center;
            margin-bottom: 28px;
        }

        /* Inputs con icono */
        .input-icon-group {
            position: relative; margin-bottom: 18px;
        }
        .input-icon-group .input-icon {
            position: absolute;
            left: 16px; top: 50%; transform: translateY(-50%);
            color: #B5B5C3; font-size: 16px;
            pointer-events: none;
        }
        .input-icon-group input {
            padding-left: 46px !important;
            border: 2px solid #E5EAEE;
            border-radius: 10px;
            height: 50px;
            font-size: 0.95rem;
            transition: all 0.3s;
            background: #FAFAFA;
        }
        .input-icon-group input:focus {
            border-color: var(--chilon-rojo);
            background: #fff;
            box-shadow: 0 0 0 3px rgba(210,35,42,0.12);
            outline: none;
        }
        .input-icon-group input::placeholder { color: #B5B5C3; }

        /* Toggle password */
        .toggle-pwd {
            position: absolute;
            right: 14px; top: 50%; transform: translateY(-50%);
            cursor: pointer; color: #B5B5C3;
            font-size: 16px; z-index: 10;
            transition: color 0.2s;
        }
        .toggle-pwd:hover { color: var(--chilon-rojo); }

        /* Botón login */
        .btn-login {
            background: linear-gradient(135deg, var(--chilon-rojo), var(--chilon-rojo-oscuro));
            border: none;
            border-radius: 10px;
            height: 50px;
            font-size: 1rem;
            font-weight: 600;
            letter-spacing: 0.5px;
            width: 100%;
            color: #fff;
            cursor: pointer;
            transition: all 0.3s;
            box-shadow: 0 6px 20px rgba(210,35,42,0.35);
        }
        .btn-login:hover {
            transform: translateY(-2px);
            box-shadow: 0 10px 28px rgba(161,27,27,0.45);
            background: linear-gradient(135deg, var(--chilon-rojo-oscuro), var(--chilon-rojo));
        }
        .btn-login:active { transform: translateY(0); }
        .btn-login .spinner-border { display: none; }
        .btn-login.loading .spinner-border { display: inline-block; }
        .btn-login.loading .btn-text { display: none; }

        /* Footer del formulario */
        .login-footer {
            text-align: center;
            margin-top: 24px;
            color: #B5B5C3;
            font-size: 0.78rem;
        }
        .login-footer strong { color: var(--chilon-rojo-oscuro); }

        /* Línea de advertencia */
        .aviso-acceso {
            background: #FFF8E1;
            border: 1px solid var(--chilon-dorado);
            border-radius: 8px;
            padding: 10px 14px;
            font-size: 0.78rem;
            color: var(--chilon-cafe);
            display: flex; align-items: flex-start; gap: 8px;
            margin-bottom: 20px;
        }
        .aviso-acceso i { color: var(--chilon-dorado); margin-top: 1px; flex-shrink: 0; }

        /* Pie de página izquierdo */
        .aside-footer {
            position: relative; z-index: 2;
            display: flex; justify-content: space-between; align-items: center;
        }
        .aside-footer span { color: rgba(255,255,255,0.65); font-size: 0.78rem; }

        /* Responsive */
        @media (max-width: 992px) {
            .login-aside { padding: 30px 20px !important; min-height: 250px; }
            .sistema-titulo { font-size: 1.2rem; }
            .escudo-container { max-width: 200px; padding: 14px 16px; }
            .login-form-card { padding: 30px 24px; }
        }
    </style>
</head>
<body id="kt_body" class="header-fixed page-loading">
<div class="d-flex flex-column flex-root" style="min-height:100vh;">
    <div class="login login-1 login-signin-on d-flex flex-column flex-lg-row flex-row-fluid bg-white" id="kt_login">

        <!-- ═══════════════════ LADO IZQUIERDO ═══════════════════ -->
        <div class="login-aside d-flex flex-row-auto p-10 p-lg-12" style="min-width:420px;">
            <div class="circulo-deco c1"></div>
            <div class="circulo-deco c2"></div>

            <div class="d-flex flex-row-fluid flex-column justify-content-between" style="position:relative; z-index:2;">

                <!-- Logo -->
                <div class="text-center">
                    <div class="escudo-container">
                        <img src="assets/media/logo_chilon.png" alt="Logo H. Ayuntamiento de Chilón" />
                    </div>
                    <div class="sistema-titulo">
                        H. Ayuntamiento<br/>Chilón
                    </div>
                    <div class="sistema-subtitulo">Chiapas, México · Gestión Municipal 2024-2027</div>
                </div>

                <!-- Separador -->
                <div class="separador-h">Sistema</div>

                <!-- Nombre del sistema -->
                <div class="sistema-nombre">
                    <i class="fas fa-clipboard-check"></i>
                    <span>Cédula de Verificación y Seguimiento de Obra</span>
                </div>

                <!-- Footer -->
                <div class="aside-footer mt-4">
                    <span><i class="fas fa-lock mr-1"></i> Acceso restringido</span>
                    <span>© 2026 CELVER</span>
                </div>

            </div>
        </div>
        <!-- ═══════════════════ FIN LADO IZQUIERDO ═══════════════════ -->

        <!-- ═══════════════════ LADO DERECHO ═══════════════════ -->
        <div class="flex-row-fluid d-flex flex-column align-items-center justify-content-center p-7"
             style="background: linear-gradient(160deg, #FFF9F2 0%, #FDF1E4 55%, #F6F3E8 100%);">

            <div class="login-form-card">

                <!-- Icono header -->
                <div class="icon-header">
                    <i class="fas fa-user-shield"></i>
                </div>

                <h3>Iniciar Sesión</h3>
                <p class="subtitulo-form">Ingrese sus credenciales para acceder al sistema</p>

                <!-- Aviso -->
                <div class="aviso-acceso">
                    <i class="fas fa-exclamation-triangle"></i>
                    <span>Este sistema es de uso exclusivo para personal autorizado del H. Ayuntamiento.</span>
                </div>

                <!-- Formulario -->
                <form action="javascript:void(0);" onsubmit="LoginModule.login()">

                    <!-- Usuario -->
                    <div class="input-icon-group">
                        <i class="fas fa-user input-icon"></i>
                        <input type="text" class="form-control"
                               id="txtUsuario" name="user"
                               placeholder="Nombre de usuario"
                               autocomplete="off" />
                    </div>

                    <!-- Contraseña -->
                    <div class="input-icon-group">
                        <i class="fas fa-lock input-icon"></i>
                        <input type="password" class="form-control"
                               id="txtPassword" name="password"
                               placeholder="Contraseña"
                               autocomplete="off" />
                        <span class="toggle-pwd" onclick="LoginModule.togglePassword()" title="Mostrar/Ocultar">
                            <i class="fas fa-eye" id="iconTogglePwd"></i>
                        </span>
                    </div>

                    <!-- Botón -->
                    <button type="submit" class="btn-login" id="btnLogin">
                        <span class="spinner-border spinner-border-sm mr-2"
                              role="status" aria-hidden="true"></span>
                        <span class="btn-text">
                            <i class="fas fa-sign-in-alt mr-2"></i> Ingresar al Sistema
                        </span>
                    </button>

                </form>

                <!-- Footer del card -->
                <div class="login-footer">
                    <strong>Dirección de Obras Públicas</strong><br/>
                    Sistema de Cédula de Verificación y Seguimiento · v2.0
                </div>

            </div>

        </div>
        <!-- ═══════════════════ FIN LADO DERECHO ═══════════════════ -->

    </div>
</div>

<script>var KTAppSettings = { "breakpoints": { "sm": 576, "md": 768, "lg": 992, "xl": 1200, "xxl": 1200 }, "colors": { "theme": { "base": { "white": "#ffffff", "primary": "#D2232A", "secondary": "#E5EAEE", "success": "#00A651", "info": "#6993FF", "warning": "#F2A900", "danger": "#F64E60", "light": "#F3F6F9", "dark": "#212121" }, "light": { "white": "#ffffff", "primary": "#FCE4E4", "secondary": "#ECF0F3", "success": "#D7F4E4", "info": "#E1E9FF", "warning": "#FFF4DE", "danger": "#FFE2E5", "light": "#F3F6F9", "dark": "#D6D6E0" }, "inverse": { "white": "#ffffff", "primary": "#ffffff", "secondary": "#212121", "success": "#ffffff", "info": "#ffffff", "warning": "#ffffff", "danger": "#ffffff", "light": "#464E5F", "dark": "#ffffff" } }, "gray": { "gray-100": "#F3F6F9", "gray-200": "#ECF0F3", "gray-300": "#E5EAEE", "gray-400": "#D6D6E0", "gray-500": "#B5B5C3", "gray-600": "#80808F", "gray-700": "#464E5F", "gray-800": "#1B283F", "gray-900": "#212121" } }, "font-family": "Poppins" };</script>
<script src="assets/vendor/general/jquery/dist/jquery.js" type="text/javascript"></script>
<script src="assets/plugins/global/plugins.bundle.js"></script>
<script src="assets/js/scripts.bundle.js"></script>
<script src="assets/js/Login.js"></script>
</body>
</html>

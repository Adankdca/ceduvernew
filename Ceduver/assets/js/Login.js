/**
 * Login Module — VS2026 Metronic 7
 * Sistema Cédula de Verificación y Seguimiento de Obra
 */
const LoginModule = (function () {

    const API = 'api/Login/';

    // ── Toggle mostrar/ocultar contraseña ────────────────────────────
    var togglePassword = function () {
        var input = document.getElementById('txtPassword');
        var icon = document.getElementById('iconTogglePwd');
        if (input.type === 'password') {
            input.type = 'text';
            icon.className = 'fas fa-eye-slash';
        } else {
            input.type = 'password';
            icon.className = 'fas fa-eye';
        }
    };

    // ── Validar campos vacíos ─────────────────────────────────────────
    var validar = function (user, pass) {
        if (!user) {
            marcarError('txtUsuario', 'Ingrese su nombre de usuario.');
            return false;
        }
        limpiarError('txtUsuario');
        if (!pass) {
            marcarError('txtPassword', 'Ingrese su contraseña.');
            return false;
        }
        limpiarError('txtPassword');
        return true;
    };

    var marcarError = function (id, msg) {
        var $input = $('#' + id);
        $input.css('border-color', '#F64E60');
        $input.focus();
        // Shake animation
        $input.addClass('animate__animated animate__shakeX');
        setTimeout(function () {
            $input.removeClass('animate__animated animate__shakeX');
        }, 600);
    };

    var limpiarError = function (id) {
        $('#' + id).css('border-color', '#E5EAEE');
    };

    // ── Login principal ───────────────────────────────────────────────
    var login = function () {
        var user = $('#txtUsuario').val().trim();
        var pass = $('#txtPassword').val().trim();

        if (!validar(user, pass)) return;

        // Mostrar loading en botón
        var $btn = $('#btnLogin');
        $btn.addClass('loading').prop('disabled', true);

        $.ajax({
            type: 'GET',
            url: API + 'getuser',
            data: { user: user, pass: pass },
            success: function (response) {
                $btn.removeClass('loading').prop('disabled', false);

                if (!response.success) {
                    // Error de credenciales
                    $('#txtUsuario, #txtPassword').css('border-color', '#F64E60');
                    Swal.fire({
                        icon: 'error',
                        title: 'Acceso denegado',
                        text: response.message || 'Usuario o contraseña incorrectos.',
                        confirmButtonColor: '#1565C0',
                        confirmButtonText: 'Intentar de nuevo'
                    }).then(function () {
                        $('#txtPassword').val('').focus();
                        limpiarError('txtUsuario');
                        limpiarError('txtPassword');
                    });
                    return;
                }

                // Usuario bloqueado
                if (response.data && response.data.Bloqueo) {
                    Swal.fire({
                        icon: 'warning',
                        title: 'Cuenta bloqueada',
                        text: 'Su cuenta está bloqueada. Contacte al administrador del sistema.',
                        confirmButtonColor: '#1565C0'
                    });
                    return;
                }

                // Guardar datos en sessionStorage
                var datos = response.data;
                sessionStorage.setItem('idusuario', datos.Idusuario || '');
                sessionStorage.setItem('name', datos.Usuario || '');
                sessionStorage.setItem('nombreCompleto', datos.Nombre || '');
                sessionStorage.setItem('cargo', datos.Cargo_Puesto || '');
                sessionStorage.setItem('sistema', datos.Sistema || '');

                // Bienvenida y redirección
                Swal.fire({
                    icon: 'success',
                    title: '¡Bienvenido!',
                    html: '<strong>' + (datos.Nombre || datos.Usuario) + '</strong>' +
                        '<br><small class="text-muted">' + (datos.Cargo_Puesto || '') + '</small>',
                    timer: 2500,
                    timerProgressBar: true,
                    showConfirmButton: false,
                    allowOutsideClick: false
                }).then(function () {
                    window.location.href = 'Principal.aspx';
                });
            },
            error: function (xhr) {
                $btn.removeClass('loading').prop('disabled', false);
                var msg = 'Error de conexión con el servidor.';
                try {
                    var err = JSON.parse(xhr.responseText);
                    msg = err.Message || msg;
                } catch (e) { }
                Swal.fire({
                    icon: 'error',
                    title: 'Error del servidor',
                    text: msg,
                    confirmButtonColor: '#1565C0'
                });
            }
        });
    };

    // ── Init ──────────────────────────────────────────────────────────
    var init = function () {
        // Enter en usuario pasa al password
        $('#txtUsuario').on('keypress', function (e) {
            if (e.which === 13) $('#txtPassword').focus();
        });

        // Enter en password hace login
        $('#txtPassword').on('keypress', function (e) {
            if (e.which === 13) login();
        });

        // Limpiar error al escribir
        $('#txtUsuario, #txtPassword').on('input', function () {
            $(this).css('border-color', '#E5EAEE');
        });

        // Focus en usuario al cargar
        setTimeout(function () {
            $('#txtUsuario').focus();
        }, 300);
    };

    // Inicializar cuando el DOM esté listo
    $(document).ready(function () { init(); });

    return {
        login: login,
        togglePassword: togglePassword
    };

})();

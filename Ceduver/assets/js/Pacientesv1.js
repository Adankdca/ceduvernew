const Utils = {
    // Formatear fecha
    formatDate(date, options = {}) {
        const defaultOptions = {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        };
        return new Date(date).toLocaleDateString('es-MX', { ...defaultOptions, ...options });
    },

    // Formatear hora
    formatTime(date) {
        return new Date(date).toLocaleTimeString('es-MX', {
            hour: '2-digit',
            minute: '2-digit'
        });
    }
};
// ============== Reloj en Tiempo Real ==============
const Clock = {
    dateElement: null,
    timeElement: null,

    init() {
        this.dateElement = document.querySelector('.header-date span');
        this.timeElement = document.querySelector('.header-time span');
        if (this.dateElement || this.timeElement) {
            this.update();
            setInterval(() => this.update(), 1000);
        }
    },

    update() {
        const now = new Date();

        if (this.dateElement) {
            this.dateElement.textContent = Utils.formatDate(now);
        }

        if (this.timeElement) {
            this.timeElement.textContent = Utils.formatTime(now);
        }
    }
};
// ============== Inicialización ==============
document.addEventListener('DOMContentLoaded', function () {
    // Inicializar todos los módulos
    Clock.init();
    let usuario = sessionStorage.getItem("name");
    if (usuario) {
        document.getElementById("lblUsuario").textContent = usuario;
    } else {
        document.getElementById("lblUsuario").textContent = "INVITADO";
    }

    console.log('MedGuard Sistema de Seguimiento Clínico - Iniciado');
    
});
function agregarpaciente() {

}
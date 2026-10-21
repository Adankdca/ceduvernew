/**
 * =====================================================
 * MEDGUARD - SISTEMA DE CLASIFICACION DE PACIENTES
 * Para uso con ASP.NET y Metronic 7.0
 * =====================================================
 */

// ============== CONFIGURACION API ==============
const API_CONFIG = {
    baseUrl: 'api/Pacientes/',
    timeout: 60000 // 30 segundos
};
// ============== SERVICIO API (FETCH MEJORADO) ==============
const ApiService = {
    /**
     * Metodo generico para peticiones POST
     * @param {string} endpoint 
     * @param {Object} datos 
     * @returns {Promise}
     */
    async post(endpoint, datos) {
        try {
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), API_CONFIG.timeout);

            const response = await fetch(API_CONFIG.baseUrl + endpoint, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json; charset=utf-8'
                },
                body: JSON.stringify(datos),
                signal: controller.signal
            });

            clearTimeout(timeoutId);

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                throw new Error(errorData.Message || `Error ${response.status}: ${response.statusText}`);
            }

            return await response.json();
        } catch (error) {
            if (error.name === 'AbortError') {
                throw new Error('La solicitud ha excedido el tiempo de espera');
            }
            console.error('Error en API POST:', error);
            throw error;
        }
    },

    /**
     * Metodo generico para peticiones GET
     * @param {string} endpoint 
     * @param {Object} params - Parametros de query string
     * @returns {Promise}
     */
    async get(endpoint, params = {}) {
        try {
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), API_CONFIG.timeout);

            const queryString = new URLSearchParams(params).toString();
            const url = queryString
                ? `${API_CONFIG.baseUrl}${endpoint}?${queryString}`
                : `${API_CONFIG.baseUrl}${endpoint}`;

            const response = await fetch(url, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json; charset=utf-8'
                },
                signal: controller.signal
            });

            clearTimeout(timeoutId);

            if (!response.ok) {
                throw new Error(`Error ${response.status}: ${response.statusText}`);
            }

            return await response.json();
        } catch (error) {
            if (error.name === 'AbortError') {
                throw new Error('La solicitud ha excedido el tiempo de espera');
            }
            console.error('Error en API GET:', error);
            throw error;
        }
    }
};

// ============== ALTERNATIVA CON JQUERY AJAX ==============
const ApiServiceJQuery = {
    /**
     * Guardar paciente usando jQuery AJAX
     * @param {Object} datos 
     * @returns {Promise}
     */
    guardarPaciente(datos) {
        return new Promise((resolve, reject) => {
            $.ajax({
                url: API_CONFIG.baseUrl + 'guardarPaciente',
                type: 'POST',
                contentType: 'application/json; charset=utf-8',
                data: JSON.stringify(datos),
                dataType: 'json',
                timeout: API_CONFIG.timeout,
                success: function (response) {
                    resolve(response);
                },
                error: function (xhr, status, error) {
                    let mensaje = 'Error al guardar el paciente';
                    if (xhr.responseJSON && xhr.responseJSON.Message) {
                        mensaje = xhr.responseJSON.Message;
                    } else if (status === 'timeout') {
                        mensaje = 'La solicitud ha excedido el tiempo de espera';
                    }
                    reject(new Error(mensaje));
                }
            });
        });
    },

    /**
     * Actualizar paciente usando jQuery AJAX
     * @param {Object} datos 
     * @returns {Promise}
     */
    actualizarPaciente(datos) {
        return new Promise((resolve, reject) => {
            $.ajax({
                url: API_CONFIG.baseUrl + 'actualizarPaciente',
                type: 'POST',
                contentType: 'application/json; charset=utf-8',
                data: JSON.stringify(datos),
                dataType: 'json',
                timeout: API_CONFIG.timeout,
                success: function (response) {
                    resolve(response);
                },
                error: function (xhr, status, error) {
                    let mensaje = 'Error al actualizar el paciente';
                    if (xhr.responseJSON && xhr.responseJSON.Message) {
                        mensaje = xhr.responseJSON.Message;
                    }
                    reject(new Error(mensaje));
                }
            });
        });
    },

    /**
     * Obtener lista de pacientes
     * @returns {Promise}
     */
  async  getPacientes() {
        return new Promise((resolve, reject) => {
            $.ajax({
                url: API_CONFIG.baseUrl + 'getPacientes',
                type: 'GET',
                contentType: 'application/json; charset=utf-8',
                dataType: 'json',
                timeout: API_CONFIG.timeout,
                success: function (response) {
                    resolve(response);
                },
                error: function (xhr, status, error) {
                    //reject(new Error('Error al obtener la lista de pacientes'));
                    if (status === 'timeout') {
                        reject(new Error('La solicitud tardó demasiado (timeout)'));
                    } else {
                        reject(new Error('Error al obtener la lista de pacientes'));
                    }
                }
            });
        });
    },

    /**
     * Eliminar paciente
     * @param {number} idpaciente 
     * @returns {Promise}
     */
    eliminarPaciente(idpaciente) {
        return new Promise((resolve, reject) => {
            $.ajax({
                url: API_CONFIG.baseUrl + 'eliminarPaciente/' + idpaciente,
                type: 'POST',
                contentType: 'application/json; charset=utf-8',
                dataType: 'json',
                timeout: API_CONFIG.timeout,
                success: function (response) {
                    resolve(response);
                },
                error: function (xhr, status, error) {
                    reject(new Error('Error al eliminar el paciente'));
                }
            });
        });
    }
};
// ============== UTILIDADES ==============
const Utils = {
    formatDate(date, options = {}) {
        const defaultOptions = {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        };
        return new Date(date).toLocaleDateString('es-MX', { ...defaultOptions, ...options });
    },

    formatTime(date) {
        return new Date(date).toLocaleTimeString('es-MX', {
            hour: '2-digit',
            minute: '2-digit'
        });
    },

    parseFloat_safe(val) {
        const num = parseFloat(val);
        return isNaN(num) ? null : num;
    },

    parseInt_safe(val) {
        const num = parseInt(val, 10);
        return isNaN(num) ? null : num;
    }
};

// ============== RELOJ EN TIEMPO REAL ==============
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

// ============== MOTOR DE CLASIFICACION ==============
/**
 * Clasificador de pacientes basado en 33 criterios clinicos
 * Retorna: { clasificacion: 'CRITICO'|'GRAVE'|'ESTABLE', motivos: [] }
 */
const Clasificador = {
    
    /**
     * Evalua todos los criterios y retorna la clasificacion
     * @param {Object} datos - Objeto con todos los valores del formulario
     * @returns {Object} - { clasificacion, motivos, clase }
     */
    evaluar(datos) {
        const motivosCritico = [];
        const motivosGrave = [];

        // ===== CRITERIOS CRITICOS =====
        
        //// 1. Frecuencia Respiratoria >= 30
        //if (datos.fr !== null && datos.fr >= 30) {
        //    motivosCritico.push('FR >= 30 rpm (' + datos.fr + ')');
        //}
        
        //// 2. Presion Arterial Sistolica <= 90
        //if (datos.pas !== null && datos.pas <= 90) {
        //    motivosCritico.push('PAS <= 90 mmHg (' + datos.pas + ')');
        //}
        
        //// 3. Saturacion de Oxigeno < 90
        //if (datos.spo2 !== null && datos.spo2 < 90) {
        //    motivosCritico.push('SpO2 < 90% (' + datos.spo2 + ')');
        //}
        // 1. Frecuencia Respiratoria >= 30
        if (datos.frecuenciarespiratoria !== null && datos.frecuenciarespiratoria >= 30) {
            motivosCritico.push('FR >= 30 rpm (' + datos.frecuenciarespiratoria + ')');
        }

        // 2. Presion Arterial Sistolica <= 90
        if (datos.presionarterial !== null && datos.presionarterial <= 90) {
            motivosCritico.push('PAS <= 90 mmHg (' + datos.presionarterial + ')');
        }

        // 3. Saturacion de Oxigeno < 90
        if (datos.saturacionoxigeno !== null && datos.saturacionoxigeno < 90) {
            motivosCritico.push('SpO2 < 90% (' + datos.saturacionoxigeno + ')');
        }
        // 5. Glasgow <= 8
        if (datos.glasgow !== null && datos.glasgow <= 8) {
            motivosCritico.push('Glasgow <= 8 (' + datos.glasgow + ')');
        }
        
        // 6. Sedacion = SI
        if (datos.sedacion === 'SI') {
            motivosCritico.push('Sedacion activa');
        }
        
        // 7. Estatus Epileptico = SI
        if (datos.estatusEpileptico === 'SI') {
            motivosCritico.push('Estatus epileptico');
        }
        
        // 12. O2 Suplementario = SI
        if (datos.o2Suplementario === 'SI') {
            motivosCritico.push('Uso de O2 suplementario');
        }
        
        // 14. Ventilacion Mecanica Invasiva = SI
        if (datos.vm === 'SI') {
            motivosCritico.push('Ventilacion mecanica invasiva');
        }
        
        // 15. Uso de Vasopresores = SI
        if (datos.vasopresores === 'SI') {
            motivosCritico.push('Uso de vasopresores');
        }
        
        // 16. Choque (cualquier tipo excepto Ninguno)
        if (datos.choque && datos.choque !== '' && datos.choque !== 'NINGUNO') {
            motivosCritico.push('Choque ' + datos.choque.toLowerCase());
        }
        
        // 17. Deterioro Renal Agudo = SI
        if (datos.deterioroRenal === 'SI') {
            motivosCritico.push('Deterioro renal agudo');
        }
        
        // 18. Urgencia Dialitica = SI
        if (datos.urgenciaDialitica === 'SI') {
            motivosCritico.push('Urgencia dialitica');
        }
        
        // 25. PAFI < 200
        if (datos.pafi !== null && datos.pafi < 200) {
            motivosCritico.push('PAFI < 200 (' + datos.pafi + ')');
        }
        
        // 26. Acidosis pH < 7.25
        if (datos.ph !== null && datos.ph < 7.25) {
            motivosCritico.push('pH < 7.25 (' + datos.ph + ')');
        }

        // 28. Bilirrubina > 2
        if (datos.bilirrubina !== null && datos.bilirrubina > 2) {
            motivosCritico.push('Bilirrubina > 2 (' + datos.bilirrubina + ')');
        }

        // 33. Lactato >= 4
        if (datos.lactato !== null && datos.lactato >= 4) {
            motivosCritico.push('Lactato >= 4 (' + datos.lactato + ')');
        }

        // ===== CRITERIOS GRAVES (solo si no es critico) =====

        //// 1. FR entre 21 y 29
        //if (datos.fr !== null && datos.fr >= 21 && datos.fr <= 29) {
        //    motivosGrave.push('FR 21-29 rpm (' + datos.fr + ')');
        //}

        //// 2. PAS entre 90 y 100
        //if (datos.pas !== null && datos.pas > 90 && datos.pas <= 100) {
        //    motivosGrave.push('PAS 90-100 mmHg (' + datos.pas + ')');
        //}

        //// 3. SpO2 entre 90 y 93
        //if (datos.spo2 !== null && datos.spo2 >= 90 && datos.spo2 <= 93) {
        //    motivosGrave.push('SpO2 90-93% (' + datos.spo2 + ')');
        //}
        // 1. FR entre 21 y 29
        if (datos.frecuenciarespiratoria !== null && datos.frecuenciarespiratoria >= 21 && datos.frecuenciarespiratoria <= 29) {
            motivosGrave.push('FR 21-29 rpm (' + datos.frecuenciarespiratoria + ')');
        }

        // 2. PAS entre 90 y 100
        if (datos.presionarterial !== null && datos.presionarterial > 90 && datos.presionarterial <= 100) {
            motivosGrave.push('PAS 90-100 mmHg (' + datos.presionarterial + ')');
        }

        // 3. SpO2 entre 90 y 93
        if (datos.saturacionoxigeno !== null && datos.saturacionoxigeno >= 90 && datos.saturacionoxigeno <= 93) {
            motivosGrave.push('SpO2 90-93% (' + datos.saturacionoxigeno + ')');
        }
        
        // 4. Temperatura < 38 (hipotermia - solo si no es critico por >38)
        if (datos.temperatura !== null && datos.temperatura > 38) {
            motivosGrave.push('Hipotermia < 38C (' + datos.temperatura + ')');
        }
        
        // 5. Glasgow entre 9 y 13
        if (datos.glasgow !== null && datos.glasgow >= 9 && datos.glasgow <= 13) {
            motivosGrave.push('Glasgow 9-13 (' + datos.glasgow + ')');
        }

        // 8. Deficit Neurologico Agudo = SI
        if (datos.deficitNeuro === 'SI') {
            motivosGrave.push('Deficit neurologico agudo');
        }

        // 9. Crisis Epileptica (24 Hr) = SI
        if (datos.crisisEpileptica === 'SI') {
            motivosGrave.push('Crisis epileptica en ultimas 24 hrs');
        }

        // 10. Deterioro Agudo de la Conciencia = SI
        if (datos.deterioroConciencia === 'SI') {
            motivosGrave.push('Deterioro agudo de conciencia');
        }

        // 11. Dificultad Respiratoria = SI
        if (datos.dificultadResp === 'SI') {
            motivosGrave.push('Dificultad respiratoria');
        }

        // 13. Ventilacion No Invasiva o Alto Flujo = SI
        if (datos.vni === 'SI') {
            motivosGrave.push('VNI o alto flujo');
        }

        // 19. Arritmia con Inestabilidad = SI
        if (datos.arritmia === 'SI') {
            motivosGrave.push('Arritmia con inestabilidad');
        }

        // 20. Sindrome Coronario Agudo Inestable = SI
        if (datos.sca === 'SI') {
            motivosGrave.push('SCA inestable');
        }

        // 21. Insuficiencia Cardiaca Aguda = SI
        if (datos.icAguda === 'SI') {
            motivosGrave.push('Insuficiencia cardiaca aguda');
        }

        // 22. Sangrado de Tubo Digestivo Activo = SI
        if (datos.stda === 'SI') {
            motivosGrave.push('STDA activo');
        }

        // 23. Falla Hepatica Aguda = SI
        if (datos.fallaHepatica === 'SI') {
            motivosGrave.push('Falla hepatica aguda');
        }

        // 24. Encefalopatia Hepatica III-IV = SI
        if (datos.encefalopatia === 'SI') {
            motivosGrave.push('Encefalopatia hepatica III-IV');
        }

        // 25. PAFI entre 200 y 250
        if (datos.pafi !== null && datos.pafi >= 200 && datos.pafi <= 250) {
            motivosGrave.push('PAFI 200-250 (' + datos.pafi + ')');
        }
        
        // 26. pH entre 7.25 y 7.3
        if (datos.ph !== null && datos.ph >= 7.25 && datos.ph <= 7.3) {
            motivosGrave.push('pH 7.25-7.3 (' + datos.ph + ')');
        }
        
        // 29. Potasio < 2.5 o > 6
        if (datos.potasio !== null && (datos.potasio < 2.5 || datos.potasio > 6)) {
            motivosGrave.push('K+ fuera de rango (' + datos.potasio + ')');
        }
        
        // 30. Sodio entre 120 y 160 (fuera de rango normal)
        if (datos.sodio !== null && datos.sodio >= 120 && datos.sodio <= 160) {
            motivosGrave.push('Na+ alterado (' + datos.sodio + ')');
        }

        // 31. Hemoglobina No Cardiopata < 7
        if (datos.hbNoCardio !== null && datos.hbNoCardio < 7) {
            motivosGrave.push('Hb No Cardiopata < 7 (' + datos.hbNoCardio + ')');
        }

        // 32. Hemoglobina Cardiopata < 9
        if (datos.hbCardio !== null && datos.hbCardio < 9) {
            motivosGrave.push('Hb Cardiopata < 9 (' + datos.hbCardio + ')');
        }

        // 33. Lactato entre 2 y 3.9
        if (datos.lactato !== null && datos.lactato >= 2 && datos.lactato < 4) {
            motivosGrave.push('Lactato 2-3.9 (' + datos.lactato + ')');
        }

        // ===== DETERMINAR CLASIFICACION FINAL =====
        let clasificacion = 'ESTABLE';
        let motivos = [];
        let clase = 'success';

        if (motivosCritico.length > 0) {
            clasificacion = 'CRITICO';
            motivos = motivosCritico;
            clase = 'danger';
        } else if (motivosGrave.length > 0) {
            clasificacion = 'GRAVE';
            motivos = motivosGrave;
            clase = 'warning';
        }

        return {
            clasificacion: clasificacion,
            motivos: motivos,
            clase: clase,
            totalCriticos: motivosCritico.length,
            totalGraves: motivosGrave.length
        };
    },

    /**
     * Retorna el color CSS de Metronic para la clasificacion
     */
    getClase(clasificacion) {
        switch (clasificacion) {
            case 'CRITICO': return 'danger';
            case 'GRAVE': return 'warning';
            case 'ESTABLE': return 'success';
            default: return 'secondary';
        }
    }
};

// ============== FORMULARIO DE PACIENTE ==============
const FormularioPaciente = {
    modal: null,
    form: null,
    alertClasificacion: null,
    txtClasificacion: null,
    txtMotivo: null,
    modoEdicion: false,
    idPacienteActual: null,
    /**
     * Inicializa el formulario y bindea eventos
     */
    init() {
        this.modal = $('#modalPaciente');
        this.form = $('#FormPaciente');
        this.alertClasificacion = $('#alertClasificacion');
        this.txtClasificacion = $('#txtClasificacion');
        this.txtMotivo = $('#txtMotivo');

        this.bindEvents();
        console.log('FormularioPaciente inicializado');
    },

    /**
     * Bindea todos los eventos del formulario
     */
    bindEvents() {
        const self = this;

        // Evento: Al cambiar cualquier campo de criterio numerico
        $('.criterio-input').on('input change', function() {
            self.evaluarClasificacion();
        });

        // Evento: Al cambiar cualquier select de criterio
        $('.criterio-select').on('change', function() {
            self.evaluarClasificacion();
        });

        // Evento: Al abrir el modal
        this.modal.on('show.bs.modal', function() {
            if (!self.modoEdicion) {
                self.limpiarFormulario();
            }
        });

        // Evento: Al cerrar el modal
        this.modal.on('hidden.bs.modal', function () {
            self.limpiarFormulario();
            self.modoEdicion = false;
            self.idPacienteActual = null;
        });

        // Evento: Guardar paciente
        $('#btnGuardarPaciente').on('click', function() {
            self.guardarPaciente();
        });
    },

    /**
     * Limpia todos los campos del formulario
     */
    limpiarFormulario() {
        // Limpiar inputs manualmente (refuerzo)
        this.form.find('input').val('');
        this.form.find('textarea').val('');

        // 🔥 IMPORTANTE PARA METRONIC / SELECT2
        this.form.find('select').val('').trigger('change');

        // Limpiar checkboxes
        this.form.find('input[type="checkbox"]').prop('checked', false);

        // Limpiar selects
        this.form.find('select').val('');

        // Resetear alerta de clasificacion
        this.alertClasificacion
            .removeClass('alert-light-danger alert-light-warning alert-light-success')
            .addClass('alert-light-secondary');
        this.txtClasificacion.text('SIN CLASIFICAR');
        this.txtMotivo.text('Complete los campos para obtener la clasificacion automatica');

        // Poner fecha de hoy por defecto
        const hoy = new Date().toISOString().split('T')[0];
        $('#txtFechaIngreso').val(hoy);

        // Resetear modo edicion
        this.modoEdicion = false;
        this.idPacienteActual = null;

        console.log('Formulario limpiado CORRECTAMENTE');
    },

    /**
     * Obtiene todos los valores del formulario
     * @returns {Object} - Objeto con todos los valores
     */
    obtenerDatos() {
        //const parseFloat_safe = (val) => {
        //    const num = parseFloat(val);
        //    return isNaN(num) ? null : num;
        //};

        return {
            // ID (solo en modo edicion)
            idpaciente: this.idPacienteActual,

            // Datos del paciente
            //nombre: $('#txtNombre').val(),
            //expediente: $('#txtExpediente').val(),
            //cama: $('#txtCama').val(),
            //diagnostico: $('#txtDiagnostico').val(),
            //fechaIngreso: $('#txtFechaIngreso').val(),
            //edad : $('#txtEdad').val(),
            //sexo : $('#selSexo').val(),
            nombre: $('#txtNombre').val() || null,
            expediente: $('#txtExpediente').val() || null,
            cama: $('#txtCama').val() || null,
            diagnostico: $('#txtDiagnostico').val() || null,
            fechaingreso: $('#txtFechaIngreso').val() || null,
            edad: Utils.parseInt_safe($('#txtEdad').val()),
            sexo: $('#selSexo').val() || null,
            diasestancia: Utils.parseInt_safe($('#txtDiasEstancia').val()),
            //problemasactivos: $('#txtProblemasActivos').val() || null,
            //idresponsable: Utils.parseInt_safe($('#selResponsable').val()),
            //responsable: $('#selResponsable option:selected').text() || null,

            // Signos vitales (numericos)
            //fr: parseFloat_safe($('#txtFR').val()),//1. Frecuencia Respiratoria (int)
            //pas: parseFloat_safe($('#txtPAS').val()),//2. Presión Arterial Sistolica (PAS) (int)
            //spo2: parseFloat_safe($('#txtSpO2').val()),//3. Saturación de Oxigeno (SpO2) (int)
            //temperatura: parseFloat_safe($('#txtTemperatura').val()),// 4. Temperatura (int)
            //glasgow: parseFloat_safe($('#txtGlasgow').val()),//5. Glasgow (int)
            //pafi: parseFloat_safe($('#txtPAFI').val()),//25 PAFI (PaO2/FiO2) (int)
            //ph: parseFloat_safe($('#txtPH').val()),//26. Acidosis (pH) (int)
            //lactato: parseFloat_safe($('#txtLactato').val()),//33. Lactato (int)
            frecuenciarespiratoria: Utils.parseFloat_safe($('#txtFR').val()),//1. Frecuencia Respiratoria (decimal)
            presionarterial: Utils.parseFloat_safe($('#txtPAS').val()),//2. Presión Arterial Sistolica (PAS) (decimal)
            saturacionoxigeno: Utils.parseFloat_safe($('#txtSpO2').val()),//3. Saturación de Oxigeno (SpO2) (decimal)
            temperatura: Utils.parseFloat_safe($('#txtTemperatura').val()),// 4. Temperatura (decimal)
            glasgow: Utils.parseInt_safe($('#txtGlasgow').val()),//5. Glasgow (int)
            pafi: Utils.parseFloat_safe($('#txtPAFI').val()),//25 PAFI (PaO2/FiO2) (decimal)
            ph: Utils.parseFloat_safe($('#txtPH').val()),//26. Acidosis (pH) (decimal)
            lactato: Utils.parseFloat_safe($('#txtLactato').val()),//33. Lactato (decimal)

            // Laboratorios
            //plaquetas: parseFloat_safe($('#txtPlaquetas').val()),//27. Plaquetas (int)
            //bilirrubina: parseFloat_safe($('#txtBilirrubina').val()),//28. Bilirrubina (int)
            //potasio: parseFloat_safe($('#txtPotasio').val()),//29. Potasio (K+) (int)
            //sodio: parseFloat_safe($('#txtSodio').val()),//30. Sodio (Na+) (int)
            //hbNoCardio: parseFloat_safe($('#txtHbNoCardio').val()),//31. Hemoglobina (No Cardiopata) (int)
            //hbCardio: parseFloat_safe($('#txtHbCardio').val()),//32. Hemoglobina (Cardiopata) (int)
            plaquetas: Utils.parseFloat_safe($('#txtPlaquetas').val()),//27. Plaquetas (int)
            bilirrubina: Utils.parseFloat_safe($('#txtBilirrubina').val()),//28. Bilirrubina (decimal)
            potasio: Utils.parseFloat_safe($('#txtPotasio').val()),//29. Potasio (K+) (decimal)
            sodio: Utils.parseFloat_safe($('#txtSodio').val()),//30. Sodio (Na+) (decimal)
            hbNoCardio: Utils.parseFloat_safe($('#txtHbNoCardio').val()),//31. Hemoglobina (No Cardiopata) (decimal)
            hbCardio: Utils.parseFloat_safe($('#txtHbCardio').val()),//32. Hemoglobina (Cardiopata) (decimal)

            // Estado Neurologico (SI/NO)
            //sedacion: $('#selSedacion').val(),//6. Sedación(nchar(10))
            //estatusEpileptico: $('#selEstatusEpileptico').val(),//7. Estatus Epiléptico(nchar(10))
            //deficitNeuro: $('#selDeficitNeuro').val(),//8. Deficit Neurologico Agudo(nchar(10))
            //crisisEpileptica: $('#selCrisisEpileptica').val(),//9. Crisis Epileptica (24 Hr)(nchar(10))
            //deterioroConciencia: $('#selDeterioroConciencia').val(),//10. Deterioro Agudo de la Conciencia(nchar(10))
            sedacion: $('#selSedacion').val() || null,//6. Sedación(nchar(10))
            estatusEpileptico: $('#selEstatusEpileptico').val() || null,//7. Estatus Epiléptico(nchar(10))
            deficitNeuro: $('#selDeficitNeuro').val() || null,//8. Deficit Neurologico Agudo(nchar(10))
            crisisEpileptica: $('#selCrisisEpileptica').val() || null,//9. Crisis Epileptica (24 Hr)(nchar(10))
            deterioroConciencia: $('#selDeterioroConciencia').val() || null,//10. Deterioro Agudo de la Conciencia(nchar(10))

            // Estado Respiratorio
            //dificultadResp: $('#selDificultadResp').val(),//11. Dificultad Respiratoria (nchar(10))
            //o2Suplementario: $('#selO2Suplementario').val(),//12. Uso de O2 Suplementario (nchar(10))
            //vni: $('#selVNI').val(),//13. Ventilacion No Invasiva o Alto Flujo (nchar(10))
            //vm: $('#selVM').val(),//14. Ventilacion Mecanica Invasiva (nchar(10))
            dificultadResp: $('#selDificultadResp').val() || null,//11. Dificultad Respiratoria (nchar(10))
            o2Suplementario: $('#selO2Suplementario').val() || null,//12. Uso de O2 Suplementario (nchar(10))
            vni: $('#selVNI').val() || null,//13. Ventilacion No Invasiva o Alto Flujo (nchar(10))
            vm: $('#selVM').val() || null,//14. Ventilacion Mecanica Invasiva (nchar(10))


            // Estado Hemodinamico
            //vasopresores: $('#selVasopresores').val(),//15. Uso de Vasopresores (nchar(10))
            //choque: $('#selChoque').val(),//16. Tipo de Choque (nchar(10))
            //arritmia: $('#selArritmia').val(),//19. Arritmia con Inestabilidad (nchar(10))
            //sca: $('#selSCA').val(),//20. Sindrome Coronario Agudo Inestable (nchar(10))
            //icAguda: $('#selICAguda').val(),//21. Insuficiencia Cardiaca Aguda (nchar(10))
            vasopresores: $('#selVasopresores').val() || null,//15. Uso de Vasopresores (nchar(10))
            choque: $('#selChoque').val() || null,//16. Tipo de Choque (nchar(10))
            arritmia: $('#selArritmia').val() || null,//19. Arritmia con Inestabilidad (nchar(10))
            sca: $('#selSCA').val() || null,//20. Sindrome Coronario Agudo Inestable (nchar(10))
            icAguda: $('#selICAguda').val() || null,//21. Insuficiencia Cardiaca Aguda (nchar(10))

            // Estado Renal/Hepatico
            //deterioroRenal: $('#selDeterioroRenal').val(),//17. Deterioro Renal Agudo (nchar(10))
            //urgenciaDialitica: $('#selUrgenciaDialitica').val(),//18. Urgencia Dialitica (nchar(10))
            //stda: $('#selSTDA').val(),//22. Sangrado de Tubo Digestivo Activo (nchar(10))
            //fallaHepatica: $('#selFallaHepatica').val(),//23. Falla Hepatica Aguda (nchar(10))
            //encefalopatia: $('#selEncefalopatia').val()//24. Encefalopatia Hepatica III-IV (nchar(10))
            deterioroRenal: $('#selDeterioroRenal').val() || null,//17. Deterioro Renal Agudo (nchar(10))
            urgenciaDialitica: $('#selUrgenciaDialitica').val() || null,//18. Urgencia Dialitica (nchar(10))
            stda: $('#selSTDA').val() || null,//22. Sangrado de Tubo Digestivo Activo (nchar(10))
            fallaHepatica: $('#selFallaHepatica').val() || null,//23. Falla Hepatica Aguda (nchar(10))
            encefalopatia: $('#selEncefalopatia').val() || null//24. Encefalopatia Hepatica III-IV (nchar(10))
        };
    },

    /**
     * Carga los datos de un paciente en el formulario para edicion
     * @param {Object} paciente - Objeto con los datos del paciente
     */
    cargarDatosParaEdicion(paciente) {
        this.modoEdicion = true;
        this.idPacienteActual = paciente.idpaciente;

        // Datos generales
        $('#txtNombre').val(paciente.nombre || '');
        $('#txtExpediente').val(paciente.expediente || '');
        $('#txtCama').val(paciente.cama || '');
        $('#txtDiagnostico').val(paciente.diagnostico || '');
        $('#txtEdad').val(paciente.edad || '');
        $('#selSexo').val(paciente.sexo || '').trigger('change');
        $('#txtDiasEstancia').val(paciente.diasestancia || '');
        /*$('#txtProblemasActivos').val(paciente.problemasactivos || '');*/

        // Fecha de ingreso
        if (paciente.fechaingreso) {
            const fecha = new Date(paciente.fechaingreso).toISOString().split('T')[0];
            $('#txtFechaIngreso').val(fecha);
        }

        // Responsable
        //if (paciente.idresponsable) {
        //    $('#selResponsable').val(paciente.idresponsable).trigger('change');
        //}

        // Signos vitales
        $('#txtFR').val(paciente.frecuenciarespiratoria || '');
        $('#txtPAS').val(paciente.presionarterial || '');
        $('#txtSpO2').val(paciente.saturacionoxigeno || '');
        $('#txtTemperatura').val(paciente.temperatura || '');
        $('#txtGlasgow').val(paciente.glasgow || '');
        $('#txtPAFI').val(paciente.pafi || '');
        $('#txtPH').val(paciente.ph || '');
        $('#txtLactato').val(paciente.lactato || '');

        // Laboratorios
        $('#txtPlaquetas').val(paciente.plaquetas || '');
        $('#txtBilirrubina').val(paciente.bilirrubina || '');
        $('#txtPotasio').val(paciente.potasio || '');
        $('#txtSodio').val(paciente.sodio || '');
        $('#txtHbNoCardio').val(paciente.hbNoCardio || '');
        $('#txtHbCardio').val(paciente.hbCardio || '');

        // Estados clinicos (selects)
        $('#selSedacion').val(paciente.sedacion || '').trigger('change');
        $('#selEstatusEpileptico').val(paciente.estatusEpileptico || '').trigger('change');
        $('#selDeficitNeuro').val(paciente.deficitNeuro || '').trigger('change');
        $('#selCrisisEpileptica').val(paciente.crisisEpileptica || '').trigger('change');
        $('#selDeterioroConciencia').val(paciente.deterioroConciencia || '').trigger('change');
        $('#selDificultadResp').val(paciente.dificultadResp || '').trigger('change');
        $('#selO2Suplementario').val(paciente.o2Suplementario || '').trigger('change');
        $('#selVNI').val(paciente.vni || '').trigger('change');
        $('#selVM').val(paciente.vm || '').trigger('change');
        $('#selVasopresores').val(paciente.vasopresores || '').trigger('change');
        $('#selChoque').val(paciente.choque || '').trigger('change');
        $('#selDeterioroRenal').val(paciente.deterioroRenal || '').trigger('change');
        $('#selUrgenciaDialitica').val(paciente.urgenciaDialitica || '').trigger('change');
        $('#selArritmia').val(paciente.arritmia || '').trigger('change');
        $('#selSCA').val(paciente.sca || '').trigger('change');
        $('#selICAguda').val(paciente.icAguda || '').trigger('change');
        $('#selSTDA').val(paciente.stda || '').trigger('change');
        $('#selFallaHepatica').val(paciente.fallaHepatica || '').trigger('change');
        $('#selEncefalopatia').val(paciente.encefalopatia || '').trigger('change');

        // Evaluar clasificacion
        this.evaluarClasificacion();
    },

    /**
     * Evalua la clasificacion en tiempo real
     */
    evaluarClasificacion() {
        const datos = this.obtenerDatos();
        const resultado = Clasificador.evaluar(datos);

        // Actualizar alerta visual
        this.alertClasificacion
            .removeClass('alert-light-secondary alert-light-danger alert-light-warning alert-light-success')
            .addClass('alert-light-' + resultado.clase);

        // Actualizar texto
        this.txtClasificacion.text(resultado.clasificacion);

        // Mostrar motivos
        if (resultado.motivos.length > 0) {
            this.txtMotivo.html(resultado.motivos.join(' | '));
        } else {
            this.txtMotivo.text('No se detectan criterios de gravedad');
        }

        // Cambiar icono segun clasificacion
        const icono = this.alertClasificacion.find('.alert-icon i');
        switch (resultado.clasificacion) {
            case 'CRITICO':
                icono.attr('class', 'flaticon-danger');
                break;
            case 'GRAVE':
                icono.attr('class', 'flaticon-warning-sign');
                break;
            case 'ESTABLE':
                icono.attr('class', 'flaticon2-check-mark');
                break;
            default:
                icono.attr('class', 'flaticon-questions-circular-button');
        }

        console.log('Clasificacion:', resultado.clasificacion, '| Motivos:', resultado.motivos.length);
    },

    /**
     * Valida el formulario antes de guardar
     * @returns {boolean}
     */
    validarFormulario() {
        const nombre = $('#txtNombre').val().trim();
        const expediente = $('#txtExpediente').val().trim();
        const cama = $('#txtCama').val().trim();
        const diagnostico = $('#txtDiagnostico').val().trim();
        const edad = $('#txtEdad').val().trim();
        const sexo = $('#selSexo').val().trim();

        if (!nombre) {
            Swal.fire('Campo requerido', 'El nombre del paciente es obligatorio', 'warning').then(() =>
            {
             setTimeout(() => {
                    $('#txtNombre').focus();
                    $('#txtNombre')[0].scrollIntoView({ behavior: 'smooth', block: 'center' });
                }, 300);
            });
            return false;
        }
        if (!expediente) {
            Swal.fire('Campo requerido', 'El numero de expediente es obligatorio', 'warning').then(() => {
                setTimeout(() => {
                    $('#txtExpediente').focus();
                    $('#txtExpediente')[0].scrollIntoView({ behavior: 'smooth', block: 'center' });
                }, 300);
            });
            return false;
        }
        else if (!validarExpediente(expediente))
            {
                Swal.fire('#txtExpediente', 'Formato: RFC (4 letras + 6 números) - 2 dígitos', 'warning').then(() => {
                    setTimeout(() => {
                        $('#txtExpediente').focus();
                        $('#txtExpediente')[0].scrollIntoView({ behavior: 'smooth', block: 'center' });
                    }, 300);
                });
                return false;
            }
            else
            {
                const rfc = expediente.split('-')[0];

                if (!validarRFCFecha(rfc))
                {
                    Swal.fire('#txtExpediente', 'Fecha inválida en el RFC', 'warning').then(() => {
                        setTimeout(() => {
                            $('#txtExpediente').focus();
                            $('#txtExpediente')[0].scrollIntoView({ behavior: 'smooth', block: 'center' });
                        }, 300);
                    });
                    return false;
                }
            }

        if (!cama) {
            Swal.fire('Campo requerido', 'El numero de cama es obligatorio', 'warning').then(() => {
                setTimeout(() => {
                    $('#txtCama').focus();
                    $('#txtCama')[0].scrollIntoView({ behavior: 'smooth', block: 'center' });
                }, 300);
            })
                return false;
        }
        if (!diagnostico) {
            Swal.fire('Campo requerido', 'El diagnostico es obligatorio', 'warning').then(() => {
                setTimeout(() => {
                    $('#txtDiagnostico').focus();
                    $('#txtDiagnostico')[0].scrollIntoView({ behavior: 'smooth', block: 'center' });
                }, 300);
            });
            return false;
        }
        if (!edad) {
            Swal.fire('Campo requerido', 'La edad del paciente es obligatorio', 'warning').then(() => {
                setTimeout(() => {
                    $('#txtEdad').focus();
                    $('#txtEdad')[0].scrollIntoView({ behavior: 'smooth', block: 'center' });
                }, 300);
            })
            return false;
        }
        if (!sexo) {
            Swal.fire('Campo requerido', 'El sexo del paciente es obligatorio', 'warning').then(() => {
                setTimeout(() => {
                    $('#selSexo').focus();
                    $('#selSexo')[0].scrollIntoView({ behavior: 'smooth', block: 'center' });
                }, 300);
            })
            return false;
        }
        return true;
    },

    /**
     * Prepara los datos para enviar al servidor
     * @returns {Object}
     */
    prepararDatosParaGuardar() {
        const datos = this.obtenerDatos();
        const resultado = Clasificador.evaluar(datos);
        
        return {
            ...datos,
            clasificacion: resultado.clasificacion,
            motivosClasificacion: resultado.motivos.join('; ')
        };
    },

    /**
     * Guarda el paciente (llama al metodo del servidor)
     */
    async guardarPaciente() {
        if (!this.validarFormulario()) {
            return;
        }

        //const datos = this.prepararDatosParaGuardar();
        
        const datos = this.obtenerDatos();

        console.log('Datos a guardar:', datos);

        // Mostrar loader de Metronic
        KTApp.blockPage({
            overlayColor: '#000000',
            state: 'primary',
            message: this.modoEdicion ? 'Actualizando paciente...' : 'Guardando paciente...'
        });

        try {
            let resultado;

            if (this.modoEdicion) {
                // UPDATE - Actualizar paciente existente
                resultado = await ApiServiceJQuery.actualizarPaciente(datos);
            } else {
                // INSERT - Guardar nuevo paciente
                resultado = await ApiServiceJQuery.guardarPaciente(datos);
            }

            // Ocultar loader
            KTApp.unblockPage();

            if (resultado > 0) {
                Swal.fire({
                    position: 'top-end',
                    icon: 'success',
                    title: this.modoEdicion ? 'Paciente actualizado correctamente' : 'Paciente guardado correctamente',
                    showConfirmButton: false,
                    timer: 2000,
                    toast: true
                });

                // Cerrar modal
                this.modal.modal('hide');

                // Recargar la tabla de pacientes
                if (typeof cargarTablaPacientes === 'function') {
                    cargarTablaPacientes();
                } else {
                    // Si no hay funcion de recarga, recargar la pagina
                    setTimeout(() => {
                        location.reload();
                    }, 1500);
                }
            }

        } catch (error) {
            // Ocultar loader
            KTApp.unblockPage();

            Swal.fire({
                icon: 'error',
                title: 'Error',
                text: error.message || 'No se pudo guardar el paciente',
                confirmButtonText: 'Aceptar'
            });

            console.error('Error al guardar paciente:', error);
        }

        

        // Por ahora solo mostramos los datos (temporal)
        //Swal.fire({
        //    title: 'Datos del Paciente',
        //    html: '<pre style="text-align:left; font-size:12px;">' + JSON.stringify(datos, null, 2) + '</pre>',
        //    icon: 'info',
        //    confirmButtonText: 'Entendido'
        //});
    }
};
// ============== TABLA DE PACIENTES ==============
const TablaPacientes = {
    dataTable: null,

    /**
     * Inicializa la tabla de pacientes
     */
    init() {
        this.cargarDatos();
    },

    /**
     * Carga los datos de pacientes en la tabla
     */
     cargarDatos() {
        try {
            const pacientes = await ApiServiceJQuery.getPacientes();
            this.renderizarTabla(pacientes);
        } catch (error) {
            console.error('Error al cargar pacientes:', error);
            Swal.fire({
                icon: 'error',
                title: 'Error',
                text: 'No se pudieron cargar los pacientes',
                confirmButtonText: 'Aceptar'
            });
        }
    },

    /**
     * Renderiza la tabla con DataTables
     * @param {Array} pacientes 
     */
    renderizarTabla(pacientes) {
        const self = this;

        // Destruir DataTable existente si hay uno
        if (this.dataTable) {
            this.dataTable.destroy();
        }

        // Limpiar tbody
        $('#tblPacientes tbody').empty();

        // Agregar filas
        pacientes.forEach(paciente => {
            const resultado = Clasificador.evaluar(paciente);
            const fechaFormateada = paciente.fechaingreso
                ? new Date(paciente.fechaingreso).toLocaleDateString('es-MX')
                : '';

            const fila = `
                <tr data-id="${paciente.idpaciente}">
                    <td>${paciente.expediente || ''}</td>
                    <td>${paciente.nombre || ''}</td>
                    <td>${paciente.cama || ''}</td>
                    <td>${paciente.diagnostico || ''}</td>
                    <td>${paciente.edad || ''}</td>
                    <td>${paciente.diasestancia || ''}</td>
                    <td>${fechaFormateada}</td>
                    <td>
                        <span class="label label-lg label-light-${resultado.clase} label-inline">
                            ${resultado.clasificacion}
                        </span>
                    </td>
                    <td class="text-center">
                        <button type="button" class="btn btn-sm btn-icon btn-light-primary btn-editar" 
                                data-id="${paciente.idpaciente}" title="Editar">
                            <i class="flaticon-edit"></i>
                        </button>
                        <button type="button" class="btn btn-sm btn-icon btn-light-danger btn-eliminar" 
                                data-id="${paciente.idpaciente}" title="Eliminar">
                            <i class="flaticon-delete"></i>
                        </button>
                    </td>
                </tr>
            `;
            $('#tblPacientes tbody').append(fila);
        });

        // Inicializar DataTables
        this.dataTable = $('#tblPacientes').DataTable({
            responsive: true,
            language: {
                url: '//cdn.datatables.net/plug-ins/1.13.7/i18n/es-MX.json'
            },
            order: [[4, 'desc']], // Ordenar por fecha de ingreso
            columnDefs: [
                { orderable: false, targets: [6] } // Columna de acciones no ordenable
            ]
        });

        // Bindear eventos de botones
        this.bindEventosBotones();
    },

    /**
     * Bindea los eventos de los botones de editar y eliminar
     */
    bindEventosBotones() {
        const self = this;

        // Boton editar
        $('#tblPacientes').off('click', '.btn-editar').on('click', '.btn-editar', async function () {
            const idpaciente = $(this).data('id');
            await self.editarPaciente(idpaciente);
        });

        // Boton eliminar
        $('#tblPacientes').off('click', '.btn-eliminar').on('click', '.btn-eliminar', function () {
            const idpaciente = $(this).data('id');
            self.confirmarEliminar(idpaciente);
        });
    },

    /**
     * Carga los datos del paciente para edicion
     * @param {number} idpaciente 
     */
    async editarPaciente(idpaciente) {
        try {
            KTApp.blockPage({
                overlayColor: '#000000',
                state: 'primary',
                message: 'Cargando datos del paciente...'
            });

            // Obtener datos del paciente
            const response = await fetch(API_CONFIG.baseUrl + 'getPaciente/' + idpaciente);
            const paciente = await response.json();

            KTApp.unblockPage();

            if (paciente) {
                // Cargar datos en el formulario
                FormularioPaciente.cargarDatosParaEdicion(paciente);

                // Abrir modal
                $('#modalPaciente').modal('show');
            }

        } catch (error) {
            KTApp.unblockPage();
            Swal.fire({
                icon: 'error',
                title: 'Error',
                text: 'No se pudieron cargar los datos del paciente',
                confirmButtonText: 'Aceptar'
            });
            console.error('Error al cargar paciente:', error);
        }
    },

    /**
     * Muestra confirmacion antes de eliminar
     * @param {number} idpaciente 
     */
    confirmarEliminar(idpaciente) {
        const self = this;

        Swal.fire({
            title: 'Confirmar eliminacion',
            text: 'Esta accion no se puede deshacer. ¿Desea continuar?',
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#d33',
            cancelButtonColor: '#3085d6',
            confirmButtonText: 'Si, eliminar',
            cancelButtonText: 'Cancelar'
        }).then(async (result) => {
            if (result.isConfirmed) {
                await self.eliminarPaciente(idpaciente);
            }
        });
    },

    /**
     * Elimina el paciente
     * @param {number} idpaciente 
     */
    async eliminarPaciente(idpaciente) {
        try {
            KTApp.blockPage({
                overlayColor: '#000000',
                state: 'danger',
                message: 'Eliminando paciente...'
            });

            const resultado = await ApiServiceJQuery.eliminarPaciente(idpaciente);

            KTApp.unblockPage();

            if (resultado > 0) {
                Swal.fire({
                    position: 'top-end',
                    icon: 'success',
                    title: 'Paciente eliminado correctamente',
                    showConfirmButton: false,
                    timer: 2000,
                    toast: true
                });

                // Recargar tabla
                this.cargarDatos();
            }

        } catch (error) {
            KTApp.unblockPage();
            Swal.fire({
                icon: 'error',
                title: 'Error',
                text: error.message || 'No se pudo eliminar el paciente',
                confirmButtonText: 'Aceptar'
            });
            console.error('Error al eliminar paciente:', error);
        }
    }
};

// ============== INICIALIZACION ==============
document.addEventListener('DOMContentLoaded', function() {
    // Inicializar modulos
    Clock.init();
    FormularioPaciente.init();
    TablaPacientes.init();

    // Mostrar usuario
    let usuario = sessionStorage.getItem("name");
    if (usuario) {
        document.getElementById("lblUsuario").textContent = usuario;
    } else {
        document.getElementById("lblUsuario").textContent = "INVITADO";
    }

    console.log('MedGuard Sistema de Seguimiento Clinico - Iniciado');
});

/**
 * Funcion global para abrir el modal de agregar paciente
 * Se llama desde el boton "AGREGAR PACIENTE"
 */
function agregarpaciente() {
    FormularioPaciente.modoEdicion = false;
    FormularioPaciente.idPacienteActual = null;
    $('#modalPaciente').modal('show');
}

/**
 * Funcion global para recargar la tabla de pacientes
 */
function cargarTablaPacientes() {
    TablaPacientes.cargarDatos();
}

/*validaciones*/
$('#txtExpediente').on('input', function () {
    let valor = $(this).val().toUpperCase().replace(/[^A-Z0-9]/g, '');

    if (valor.length > 12) {
        valor = valor.substring(0, 12);
    }

    if (valor.length > 10) {
        valor = valor.substring(0, 10) + '-' + valor.substring(10);
    }

    $(this).val(valor);
});
const validarExpediente = (valor) => {
    const regex = /^[A-Z]{4}\d{6}-\d{2}$/;
    return regex.test(valor);
};
const validarRFCFecha = (rfc) => {
    const fecha = rfc.substring(4, 10); // YYMMDD

    const mes = parseInt(fecha.substring(2, 4));
    const dia = parseInt(fecha.substring(4, 6));

    return (mes >= 1 && mes <= 12) && (dia >= 1 && dia <= 31);
};


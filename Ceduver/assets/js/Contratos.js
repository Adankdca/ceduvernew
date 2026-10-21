/**
 * Módulo Contratos — VS2026 Metronic 7
 */
const ContratosModule = (function () {

    const API = 'api/Contratos/';
    function formatearFechaISO(fecha) {
        if (!fecha) return null;
        var partes = fecha.split('/');
        if (partes.length !== 3) return null;
        return partes[2] + '-' + partes[1] + '-' + partes[0];
    }
    function formatearFechaInput(fecha) {
        if (!fecha) return '';
        // Quitar la parte de tiempo si viene como "2026-08-28T00:00:00"
        var solo = fecha.toString().substring(0, 10);
        var partes = solo.split('-');
        if (partes.length !== 3) return '';
        return partes[2] + '/' + partes[1] + '/' + partes[0];
    }
    var formatMoney = function (valor) {
        return '$' + parseFloat(valor || 0).toLocaleString('es-MX', {
            minimumFractionDigits: 2, maximumFractionDigits: 2
        });
    };

    var parseFecha = function (fechaStr) {
        if (!fechaStr || fechaStr === '01/01/2000') return '';
        return fechaStr;
    };

    // ══════════════════════════════════════════════════════════════════
    // CATÁLOGOS
    // ══════════════════════════════════════════════════════════════════

    var cargarCatalogos = function () {
        // Contratistas
        $.get(API + 'getContratistas', function (res) {
            var opts = '<option value="0">(SELECCIONE)</option>';
            res.forEach(function (i) {
                opts += '<option value="' + i.id + '">' + i.nombre + '</option>';
            });
            $('#cboContratistaContrato').html(opts);
            $('#filterContratista').html('<option value="">(TODOS)</option>' +
                res.map(function (i) {
                    return '<option value="' + i.id + '">' + i.nombre + '</option>';
                }).join(''));
            $('#filterContratista').selectpicker('refresh');
        });
        // Tipo Orden
        $.get(API + 'getTipoOrden', function (res) {
            var opts = '<option value="0">(SELECCIONE)</option>';
            res.forEach(function (i) {
                opts += '<option value="' + i.id + '">' + i.nombre + '</option>';
            });
            $('#cboTipoOrdenContrato').html(opts);
            $('#filterTipoOrden').html('<option value="">(TODOS)</option>' +
                res.map(function (i) {
                    return '<option value="' + i.id + '">' + i.nombre + '</option>';
                }).join(''));
            $('#filterTipoOrden').selectpicker('refresh');
        });
        // Tipo Contrato
        $.get(API + 'getTipoContrato', function (res) {
            var opts = '<option value="0">(SELECCIONE)</option>';
            res.forEach(function (i) {
                opts += '<option value="' + i.id + '">' + i.nombre + '</option>';
            });
            $('#cboTipoContrato').html(opts);
        });
        // Concepto Contratado
        $.get(API + 'getConceptoContratado', function (res) {
            var opts = '<option value="0">(SELECCIONE)</option>';
            res.forEach(function (i) {
                opts += '<option value="' + i.id + '">' + i.nombre + '</option>';
            });
            $('#cboConceptoContratado').html(opts);
        });
    };

    // ══════════════════════════════════════════════════════════════════
    // GRID
    // ══════════════════════════════════════════════════════════════════

    var buscar = function () {
        var filtros = {
            contrato: $('#filterContrato').val() || '',
            idContratista: $('#filterContratista').val() || '',
            idTipoOrden: $('#filterTipoOrden').val() || ''
        };

        var $tbody = $('#tbodyContratos');
        $tbody.html('<tr><td colspan="9" class="text-center py-5">' +
            '<i class="fas fa-spinner fa-spin fa-2x text-primary"></i>' +
            '<div class="mt-2 text-muted">Cargando contratos...</div></td></tr>');

        $.get(API + 'getContratos', filtros)
            .done(function (data) {
                renderizar(data);
            })
            .fail(function () {
                $tbody.html('<tr><td colspan="9" class="text-center text-danger py-5">' +
                    '<i class="fas fa-exclamation-circle fa-2x mb-2 d-block"></i>' +
                    'Error al conectar con el servidor.</td></tr>');
            });
    };

    var renderizar = function (data) {
        // Destruir instancia previa si existe
        if ($.fn.DataTable.isDataTable('#tblContratos')) {
            $('#tblContratos').DataTable().destroy();
        }

        var $tbody = $('#tbodyContratos').empty();
        $('#totalContratosBadge').text(data.length + ' contratos');
        $('#lblTotalContratos').text(data.length);

        // Calcular y mostrar total general
        var totalMonto = data.reduce(function (acc, c) {
            return acc + parseFloat(c.montoContratado || 0);
        }, 0);
        $('#totalMontoContratos').text(formatMoney(totalMonto));

        if (!data.length) {
            $tbody.html('<tr><td colspan="9" class="text-center text-muted py-5">' +
                '<i class="fas fa-inbox fa-2x mb-2 d-block"></i>' +
                'No se encontraron contratos.</td></tr>');
            return;
        }

        data.forEach(function (c, idx) {
            var avance = parseFloat(c.avanceFinanciero || 0);
            var colorAvance = avance >= 100 ? 'success' :
                avance >= 50 ? 'warning' : 'danger';

            $tbody.append(
                '<tr>' +
                '<td class="text-muted small">' + (idx + 1) + '</td>' +
                '<td class="font-weight-bold text-primary">' + (c.numContrato || '') + '</td>' +
                '<td style="font-size:0.82rem;" title="' + (c.descripcion || '') + '">' +
                (c.descripcion || '') + '</td>' +
                '<td class="small">' + (c.contratista || '') + '</td>' +
                '<td class="small">' + (c.fechaInicio || '') + '</td>' +
                '<td class="small">' + (c.fechaTermino || '') + '</td>' +
                '<td class="text-right font-weight-bold">' +
                formatMoney(c.montoContratado) + '</td>' +
                '<td class="text-right">' +
                '<span class="badge badge-' + colorAvance + '">' +
                avance.toFixed(1) + '%</span>' +
                '</td>' +
                '<td class="text-center">' +
                '<button type="button" class="btn btn-sm btn-icon btn-light-warning mr-1" ' +
                'onclick="ContratosModule.modificarContrato(' + c.idContrato + ')" ' +
                'title="Modificar">' +
                '<i class="fas fa-edit"></i>' +
                '</button>' +
                '<button type="button" class="btn btn-sm btn-icon btn-light-danger" ' +
                'onclick="ContratosModule.eliminarContrato(' + c.idContrato + ')" ' +
                'title="Eliminar">' +
                '<i class="fas fa-trash"></i>' +
                '</button>' +
                '</td>' +
                '</tr>'
            );
        });
        
        // Inicializar DataTable
        $('#tblContratos').DataTable({
            responsive: true,
            pageLength: 10,
            lengthMenu: [[10, 25, 50, 100, -1], [10, 25, 50, 100, 'Todos']],
            language: {
                url: '//cdn.datatables.net/plug-ins/1.13.7/i18n/es-MX.json'
            },
            order: [[0, 'asc']],
            columnDefs: [
                { orderable: false, targets: [8] },  // columna Acciones no ordenable
                { className: 'text-right', targets: [6, 7] }
            ],
            dom: '<"row mb-2"<"col-sm-6"l><"col-sm-6"f>>rt<"row mt-2"<"col-sm-6"i><"col-sm-5"p>>',
            drawCallback: function () {
                // Recalcular totales visibles en la página actual
                var api = this.api();
                var pagina = api.rows({ page: 'current' }).data();
                var totMonto = 0;
                pagina.each(function (row) {
                    // row es el objeto original - usamos los datos del DOM
                });
            }
        });
    };

    var limpiarFiltros = function () {
        $('#filterContrato').val('');
        $('#filterContratista, #filterTipoOrden').val('').selectpicker('refresh');
        $('#tbodyContratos').html(
            '<tr><td colspan="9" class="text-center text-muted py-5">' +
            '<i class="fas fa-search fa-2x mb-2 d-block"></i>' +
            'Use los filtros y presione BUSCAR</td></tr>');
        $('#totalContratosBadge').text('0 contratos');
        $('#lblTotalContratos').text('0');
    };

    // ══════════════════════════════════════════════════════════════════
    // FORMULARIO
    // ══════════════════════════════════════════════════════════════════

    var limpiarFormContrato = function () {
        $('#txtNumContrato, #txtFechaFirma, #txtDescripcionContrato').val('');
        $('#txtFechaInicioContrato, #txtFechaTerminoContrato').val('');
        $('#txtMontoContratado, #txtMontoAnticipo').val('0.00');
        $('#txtAvanceFinanciero').val('0');
        $('#cboContratistaContrato, #cboTipoOrdenContrato,' +
            '#cboTipoContrato, #cboConceptoContratado').val('0');
        $('#fileContratoAdjunto').val('');
        $('#hddRutaArchivoContrato').val('');
        $('#panelArchivoExistenteContrato').hide();
        $('#lblArchivoActualContrato').text('');
    };

    var abrirNuevo = function () {
        $('#hddAccionContrato').val('add');
        $('#hddIdContrato').val('');
        $('#lblTituloModalContrato').text('Nuevo Contrato');
        limpiarFormContrato();
        $('#modalContrato').modal('show');
    };

    var modificarContrato = function (idContrato) {
        $('#hddAccionContrato').val('edit');
        $('#hddIdContrato').val(idContrato);
        $('#lblTituloModalContrato').text('Modificar Contrato');
        limpiarFormContrato();

        $.get(API + 'getContratoById/' + idContrato, function (c) {
            $('#txtNumContrato').val(c.numContrato || '');
            $('#txtFechaFirma').val(parseFecha(c.fechaFirma));
            $('#txtDescripcionContrato').val(c.descripcion || '');
            $('#txtFechaInicioContrato').val(parseFecha(c.fechaInicio));
            $('#txtFechaTerminoContrato').val(parseFecha(c.fechaTermino));
            $('#txtMontoContratado').val(parseFloat(c.montoContratado || 0).toFixed(2));
            $('#txtMontoAnticipo').val(parseFloat(c.montoAnticipo || 0).toFixed(2));
            $('#txtAvanceFinanciero').val(parseFloat(c.avanceFinanciero || 0).toFixed(1));
            $('#cboContratistaContrato').val(c.idContratista || '0');
            $('#cboTipoOrdenContrato').val(c.idTipoOrden || '0');
            $('#cboTipoContrato').val(c.idTipoContrato || '0');
            $('#cboConceptoContratado').val(c.idConceptoContratado || '0');

            if (c.rutaArchivo) {
                $('#hddRutaArchivoContrato').val(c.rutaArchivo);
                $('#lblArchivoActualContrato').text(c.rutaArchivo.split('/').pop());
                $('#panelArchivoExistenteContrato').show();
            }

            $('#modalContrato').modal('show');
        });
    };

    var guardarContrato = function () {
        // Validaciones
        if (!$('#txtNumContrato').val().trim()) {
            Swal.fire('Validación', 'Ingrese el Número de Contrato.', 'warning'); return;
        }
        if (!$('#txtFechaInicioContrato').val()) {
            Swal.fire('Validación', 'Ingrese la Fecha de Inicio.', 'warning'); return;
        }
        if (!$('#txtFechaTerminoContrato').val()) {
            Swal.fire('Validación', 'Ingrese la Fecha de Término.', 'warning'); return;
        }
        if (!$('#txtMontoContratado').val() ||
            parseFloat($('#txtMontoContratado').val()) <= 0) {
            Swal.fire('Validación', 'Ingrese el Monto Contratado.', 'warning'); return;
        }

        var formData = new FormData();
        formData.append('IdContrato', $('#hddIdContrato').val());
        formData.append('Accion', $('#hddAccionContrato').val());
        formData.append('NumContrato', $('#txtNumContrato').val().toUpperCase());
        formData.append('FechaFirma', $('#txtFechaFirma').val() || '');
        formData.append('Descripcion', $('#txtDescripcionContrato').val().toUpperCase());
        formData.append('FechaInicio', $('#txtFechaInicioContrato').val());
        formData.append('FechaTermino', $('#txtFechaTerminoContrato').val());
        formData.append('MontoContratado', $('#txtMontoContratado').val());
        formData.append('MontoAnticipo', $('#txtMontoAnticipo').val() || '0');
        formData.append('AvanceFinanciero', $('#txtAvanceFinanciero').val() || '0');
        formData.append('IdContratista', $('#cboContratistaContrato').val());
        formData.append('IdTipoOrden', $('#cboTipoOrdenContrato').val());
        formData.append('IdTipoContrato', $('#cboTipoContrato').val());
        formData.append('IdConceptoContratado', $('#cboConceptoContratado').val());
        formData.append('RutaArchivoActual', $('#hddRutaArchivoContrato').val());

        var file = $('#fileContratoAdjunto')[0].files[0];
        if (file) formData.append('Archivo', file);

        $.ajax({
            url: API + 'guardarContrato',
            type: 'POST',
            data: formData,
            processData: false,
            contentType: false,
            success: function () {
                $('#modalContrato').modal('hide');
                Swal.fire({
                    title: '¡Éxito!',
                    text: $('#hddAccionContrato').val() === 'add'
                        ? 'Contrato agregado correctamente.'
                        : 'Contrato actualizado correctamente.',
                    icon: 'success', timer: 1500, showConfirmButton: false
                }).then(function () { buscar(); });
            },
            error: function (xhr) {
                Swal.fire('Error', xhr.responseText, 'error');
            }
        });
    };

    var eliminarContrato = function (idContrato) {
        Swal.fire({
            title: '¿Eliminar contrato?',
            text: 'Se verificará que no tenga estimaciones asociadas.',
            icon: 'warning', showCancelButton: true,
            confirmButtonText: 'Sí, eliminar',
            cancelButtonText: 'Cancelar',
            confirmButtonColor: '#F64E60'
        }).then(function (result) {
            if (result.value) {
                $.ajax({
                    url: API + 'eliminarContrato/' + idContrato,
                    type: 'DELETE',
                    success: function () {
                        Swal.fire({
                            title: 'Eliminado',
                            text: 'Contrato eliminado correctamente.',
                            icon: 'success', timer: 1500, showConfirmButton: false
                        }).then(function () { buscar(); });
                    },
                    error: function (xhr) {
                        Swal.fire('Error', xhr.responseText, 'error');
                    }
                });
            }
        });
    };

    var descargarArchivo = function () {
        var ruta = $('#hddRutaArchivoContrato').val();
        if (!ruta) return;
        window.location.href = API + 'descargarArchivo?ruta=' + encodeURIComponent(ruta);
    };

    // ══════════════════════════════════════════════════════════════════
    // INIT
    // ══════════════════════════════════════════════════════════════════

    var init = function () {
        $('#filterContratista, #filterTipoOrden').selectpicker();
        cargarCatalogos();
        // Inicializar datepicker en campos de fecha
        $('.fecha').datepicker({
            format: 'dd/mm/yyyy',
            language: 'es',
            autoclose: true,
            todayHighlight: true,
            forceParse: false,
            keyboardNavigation: false
        });
        $('#btnBuscarContratos').on('click', function () { buscar(); });
        $('#btnLimpiarContratos').on('click', function () { limpiarFiltros(); });
        $('#btnNuevoContrato').on('click', function () { abrirNuevo(); });
        $('#btnGuardarContrato').on('click', function () { guardarContrato(); });
        $('#btnDescargarArchivoContrato').on('click', function () { descargarArchivo(); });

        $('#filterContrato').on('keypress', function (e) {
            if (e.which === 13) buscar();
        });

        // Auto-buscar al cargar
        buscar();
    };

    return {
        init: init,
        buscar: buscar,
        modificarContrato: modificarContrato,
        eliminarContrato: eliminarContrato
    };

})();
//======================================================================
// ============== UTILIDADES ===========================================
//======================================================================
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
//======================================================================
// ============== RELOJ EN TIEMPO REAL =================================
//======================================================================
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
$(document).ready(function () {
    ContratosModule.init();
    Clock.init();
});
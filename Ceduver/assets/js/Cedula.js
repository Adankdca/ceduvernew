"use strict";

var CedulaModule = function () {
    //var datatable;
    var datatableSeguimiento;
    var baseUrl = 'api/Cedula/';
    // Prefijo de la aplicación web (ej: "/Ceduver" en IIS, "" en raíz)
    // Se calcula una vez a partir de la URL actual para que funcione
    // en localhost Y en el servidor sin tocar el código.
    var _appPath = (function () {
        // window.location.pathname para "http://server/Ceduver/Cedula.aspx"
        // es "/Ceduver/Cedula.aspx". Quitamos el último segmento (el .aspx)
        // y nos queda "/Ceduver".
        var p = window.location.pathname;
        var idx = p.lastIndexOf('/');
        return idx > 0 ? p.substring(0, idx) : '';
    })();
    // Convierte "~/Uploads/..." o "Uploads/..." a una URL absoluta de la app
    function rutaAUrl(ruta) {
        var r = (ruta || '').trim();
        if (!r) return '';
        r = r.replace(/^~\//, '');   // quitar ~/
        r = r.replace(/^\//, '');    // quitar / inicial si quedó
        return _appPath + '/' + r;
    }
    var currentIdAcciones = 0;
    var currentIdObra = 0;
    var currentContrato = '';
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
    var initSelectPickers = function () {
        $('.selectpicker').selectpicker();
    };

    var initDatepickers = function () {
        $('.fecha').datepicker({
            format: 'dd/mm/yyyy',
            language: 'es',
            autoclose: true,
            todayHighlight: true
        });
    };

    var initFileInputs = function () {
        // Preview de imagenes al seleccionar archivo
        $('input[type="file"]').on('change', function () {
            var input = this;
            var imgId = $(this).attr('id').replace('file', 'img');
            if (input.files && input.files[0]) {
                var reader = new FileReader();
                reader.onload = function (e) {
                    $('#' + imgId).attr('src', e.target.result).show();
                };
                reader.readAsDataURL(input.files[0]);
            }
        });
    };

    var cargarCatalogos = function () {
        // Cargar años
        $.get(baseUrl + 'GetAnios', function (data) {
            var html = '<option value="">-- Todos --</option>';
            $.each(data, function (i, item) {
                html += '<option value="' + item.anio + '">' + item.anio + '</option>';
            });
            $('#cboAnio').html(html).selectpicker('refresh');
        });

        // Cargar rubros
        $.get(baseUrl + 'GetRubros', function (data) {
            var html = '<option value="">-- Todos --</option>';
            $.each(data, function (i, item) {
                html += '<option value="' + item.idRubro + '">' + item.nombre + '</option>';
            });
            $('#cboRubro').html(html).selectpicker('refresh');
        });

        // Cargar localidades
        $.get(baseUrl + 'GetLocalidades', function (data) {
            var html = '<option value="">-- Todas --</option>';
            $.each(data, function (i, item) {
                html += '<option value="' + item.clave + '">' + item.nombre + '</option>';
            });
            $('#cboLocalidad').html(html).selectpicker('refresh');
        });

        // Cargar contratistas
        $.get(baseUrl + 'GetContratistas', function (data) {
            var html = '<option value="">-- Todos --</option>';
            $.each(data, function (i, item) {
                html += '<option value="' + item.idContratista + '">' + item.nombre + '</option>';
            });
            $('#cboContratista').html(html).selectpicker('refresh');
        });
    };

    var initEventos = function () {
        // Buscar cedulas
        //$('#btnBuscar').on('click', buscarCedulas);
        $('#btnBuscar').on('click', function () {
            TablaCedulas.buscar();
        });
        // Limpiar busqueda
        $('#btnLimpiar').on('click', function () {
            $('#txtcontratobuscar, #txtobrabuscar').val('');
            TablaCedulas.buscar();
        });

        // Guardar datos inicio
        $('#btnGuardarDatosInicio').on('click', guardarDatosInicio);

        // Guardar seguimiento
        $('#btnGuardarSeguimiento').on('click', guardarSeguimiento);

        // Guardar datos finales
        $('#btnGuardarDatosFinal').on('click', guardarDatosFinales);

        // Guardar ficha FISM
        $('#btnGuardarFichaFism').on('click', guardarFichaFism);

        // Guardar finiquito
        $('#btnGuardarFiniquito').on('click', guardarFiniquito);

        // Guardar archivo finiquito
        $('#btnGuardarArchivoFiniquito').on('click', guardarArchivoFiniquito);

        
    };
    
    const TablaCedulas = {
        dataTable: null,
        init() {
            this.buscar();
        },
        buscar() {
            var params = {
                contrato: $('#txtcontratobuscar').val() || '',
                obra: $('#txtobrabuscar').val() || ''
            };

            $.ajax({
                url: baseUrl + 'BuscarCedulas',
                type: 'GET',
                data: params,
                success: (data) => {
                    this.renderizarTabla(data);
                },
                error: function (xhr) {
                    Swal.fire('Error', 'Error al buscar cedulas: ' + xhr.responseText, 'error');
                }
            });
        },
        renderizarTabla(data) {
            // 🔥 1. Destruir DataTable si ya existe
            if (this.dataTable) {
                this.dataTable.destroy();
            }

            // 🔥 2. Limpiar tabla
            $('#tblCedulas tbody').empty();

            // 🔥 3. Pintar filas
            data.forEach(row => {

                const fila = `
                <tr>
                    <td>${row.numContrato}</td>
                    <td>${row.nombreObra}</td>
                    <td>$${parseFloat(row.montoContratado || 0)
                        .toLocaleString('es-MX', { minimumFractionDigits: 2 })}
                    </td>
                    <td>${row.localidad}</td>
                    <td>
                        ${this.getAcciones(row)}
                    </td>
                    <td>
                        ${row.archivoFiniquito
                    ? `<button type="button" class="btn btn-sm btn-success btn-descargar" 
                           data-archivo="${row.archivoFiniquito}"
                           title="Descargar archivo finiquito">
                           <i class="fas fa-download"></i>
                       </button>`
                    : `<span class="text-muted small"><i class="fas fa-times-circle text-muted"></i> Sin archivo</span>`
}
                    </td>
                </tr>
            `;

                $('#tblCedulas tbody').append(fila);
            });

            // 🔥 4. Inicializar DataTable
            this.dataTable = $('#tblCedulas').DataTable({
                responsive: true,
                language: {
                    url: '//cdn.datatables.net/plug-ins/1.13.7/i18n/es-MX.json'
                },
                order: [],
                columnDefs: [
                    { orderable: false, targets: [4, 5] }
                ]
            });

            // 🔥 5. Eventos
            this.bindEventos();
        },

        getAcciones(row) {
            return `
                <button type="button" class="btn btn-sm btn-light-primary btn-fotos" data-id="${row.idAcciones}" title="Fotos Georeferencia">
                    <i class="fas fa-camera"></i>
                </button>

                <button type="button" class="btn btn-sm btn-light-success btn-inicio" data-id="${row.idAcciones}" title="Datos Inicio">
                    <i class="fas fa-file-alt"></i>
                </button>

                <button type="button" class="btn btn-sm btn-light-info btn-imprimir-inicio" data-id="${row.idAcciones}" title="Imprimir Inicio">
                    <i class="fas fa-print"></i>
                </button>

                <button type="button" class="btn btn-sm btn-light-info btn-seguimiento" data-id="${row.idAcciones}" title="Seguimiento">
                    <i class="fas fa-eye"></i>
                </button>

                <button type="button" class="btn btn-sm btn-light-warning btn-final" data-id="${row.idAcciones}" title="Datos Finales">
                    <i class="fas fa-check-circle"></i>
                </button>

                <button type="button" class="btn btn-sm btn-light-warning btn-imprimir-final" data-id="${row.idAcciones}" title="Imprimir Final">
                    <i class="fas fa-print"></i>
                </button>

                <button type="button" class="btn btn-sm btn-light-dark btn-fism" data-id="${row.idAcciones}" title="Ficha FISM">
                    <i class="fas fa-file"></i>
                </button>

                <button type="button" class="btn btn-sm btn-light-dark btn-imprimir-fism" data-id="${row.idAcciones}" title="Imprimir FISM">
                    <i class="fas fa-file-pdf"></i>
                </button>

                <button type="button" class="btn btn-sm btn-light-danger btn-finiquito" data-id="${row.idAcciones}" title="Finiquito">
                    <i class="fas fa-dollar-sign"></i>
                </button>

                <button type="button" class="btn btn-sm btn-light-danger btn-excel" data-id="${row.idAcciones}" title="Excel Finiquito">
                    <i class="fas fa-file-excel"></i>
                </button>

                <button type="button" class="btn btn-sm btn-light-primary btn-archivo" data-id="${row.idAcciones}" title="Archivo Finiquito">
                    <i class="fas fa-folder-open"></i>
                </button>
            `;
        },

        bindEventos() {

            const tabla = $('#tblCedulas');

            tabla.off('click', '.btn-fotos').on('click', '.btn-fotos', function (e) {
                e.preventDefault();
                CedulaModule.abrirFotosGeoreferencia($(this).data('id'));
            });

            tabla.off('click', '.btn-inicio').on('click', '.btn-inicio', function (e) {
                e.preventDefault();
                CedulaModule.abrirDatosInicio($(this).data('id'));
            });

            tabla.off('click', '.btn-imprimir-inicio').on('click', '.btn-imprimir-inicio', function (e) {
                e.preventDefault();
                CedulaModule.imprimirInicio($(this).data('id'));
            });

            tabla.off('click', '.btn-seguimiento').on('click', '.btn-seguimiento', function (e) {
                e.preventDefault();
                CedulaModule.abrirSeguimiento($(this).data('id'));
            });

            tabla.off('click', '.btn-final').on('click', '.btn-final', function (e) {
                e.preventDefault();
                CedulaModule.abrirDatosFinales($(this).data('id'));
            });

            tabla.off('click', '.btn-imprimir-final').on('click', '.btn-imprimir-final', function (e) {
                e.preventDefault();
                CedulaModule.imprimirFinal($(this).data('id'));
            });

            tabla.off('click', '.btn-fism').on('click', '.btn-fism', function (e) {
                e.preventDefault();
                CedulaModule.abrirFichaFism($(this).data('id'));
            });

            tabla.off('click', '.btn-imprimir-fism').on('click', '.btn-imprimir-fism', function (e) {
                e.preventDefault();
                CedulaModule.imprimirFichaFism($(this).data('id'));
            });

            tabla.off('click', '.btn-finiquito').on('click', '.btn-finiquito', function (e) {
                e.preventDefault();
                CedulaModule.abrirFiniquito($(this).data('id'));
            });

            tabla.off('click', '.btn-excel').on('click', '.btn-excel', function (e) {
                e.preventDefault();
                CedulaModule.exportarExcelFiniquito($(this).data('id'));
            });

            tabla.off('click', '.btn-archivo').on('click', '.btn-archivo', function (e) {
                e.preventDefault();
                CedulaModule.abrirArchivoFiniquito($(this).data('id'));
            });

            tabla.off('click', '.btn-descargar').on('click', '.btn-descargar', function (e) {
                e.preventDefault();
                CedulaModule.descargarFiniquito($(this).data('archivo'));
            });
        }
    };
    //======================================================================
    // ======================== FOTOS GEOREFERENCIA ========================
    //======================================================================
    var abrirFotosGeoreferencia = function (idAcciones) {
        currentIdAcciones = idAcciones;
        $.get(baseUrl + 'GetDatosEncabezado/' + idAcciones, function (data) {
            $('#lblObraGeo').text(data.nombreObra);
            $('#lblRubroGeo').text(data.rubro);
            $('#lblContratoGeo').text(data.numContrato);
            $('#lblLocalidadGeo').text(data.localidad);
            $('#lblMontoGeo').text('$' + parseFloat(data.montoContratado || 0).toLocaleString('es-MX', { minimumFractionDigits: 2 }));
            $('#lblFuenteGeo').text(data.fuenteFinanciamiento);
            $('#lblPeriodoInicioGeo').text(data.periodoInicio);
            $('#lblPeriodoFinGeo').text(data.periodoFin);
            currentIdObra = data.idObraProyecto;          // 🔥 NUEVO
            currentContrato = data.numContrato;   // 🔥 NUEVO
            console.log(data);
        });
        cargarFotos(idAcciones);
        $('#modalFotosGeoreferencia').modal('show');
    };
    // ======================== CARGAR FOTOS ========================
    var cargarFotos = function (idAcciones) {

        $('#containerFotosGeo').html(
            '<div class="col-12 text-center py-3"><i class="fas fa-spinner fa-spin text-primary"></i> Cargando fotos...</div>'
        );

        $.get(baseUrl + 'GetFotosGeoreferencia/' + idAcciones, function (data) {

            let html = '';

            if (data && data.length > 0) {

                $.each(data, function (i, foto) {

                    // Badge de coordenadas
                    var coordHtml = '';
                    if (foto.latitud || foto.longitud) {
                        coordHtml = `
                            <div class="mt-1 px-1">
                                <span class="badge badge-pill badge-light-warning text-dark" style="font-size:10px;">
                                    <i class="fas fa-map-marker-alt text-warning mr-1"></i>
                                    ${foto.latitud || '—'}, ${foto.longitud || '—'}
                                </span>
                            </div>`;
                    } else {
                        coordHtml = `
                            <div class="mt-1 px-1">
                                <span class="badge badge-pill badge-light text-muted" style="font-size:10px;">
                                    <i class="fas fa-map-marker-alt mr-1"></i> Sin coordenadas
                                </span>
                            </div>`;
                    }

                    html += `
                    <div class="col-md-3 col-sm-6 mb-4">
                        <div class="card border shadow-sm h-100">
                            <div class="card-header py-1 px-2 bg-light d-flex justify-content-between align-items-center">
                                <small class="text-muted font-weight-bold">#${i + 1}</small>
                                <small class="text-muted">${foto.fechaAlta}</small>
                            </div>
                            <div class="card-body p-2 text-center">
                                <img src="${foto.ruta}"
                                     class="rounded img-fluid mb-1"
                                     style="max-height:130px; width:100%; object-fit:cover; cursor:pointer;"
                                     onclick="window.open('${foto.ruta}','_blank')"
                                     title="Clic para ver en tamaño completo">
                                ${coordHtml}
                            </div>
                            <div class="card-footer p-1 text-center bg-white">
                                <button type="button" class="btn btn-xs btn-light-primary mr-1"
                                    onclick="CedulaModule.descargarFoto('${foto.ruta}',event)" title="Descargar">
                                    <i class="fas fa-download fa-sm"></i>
                                </button>
                                <button type="button" class="btn btn-xs btn-light-danger"
                                    onclick="CedulaModule.eliminarFoto(${foto.idFoto})" title="Eliminar">
                                    <i class="fas fa-trash fa-sm"></i>
                                </button>
                            </div>
                        </div>
                    </div>`;
                });

            } else {
                html = `<div class="col-12 text-center py-4 text-muted">
                            <i class="fas fa-images fa-2x mb-2 d-block"></i>
                            No hay fotos registradas aún
                        </div>`;
            }

            $('#containerFotosGeo').html(html);
        });
    };

    // ======================== SUBIR FOTO ========================
    var subirFoto = function () {

        var fileInput = $('#fileFotoGeo')[0];

        if (fileInput.files.length === 0) {
            Swal.fire('Aviso', 'Selecciona una imagen antes de subir', 'warning');
            return;
        }

        var latitud  = $('#txtLatFotoGeo').val().trim();
        var longitud = $('#txtLonFotoGeo').val().trim();

        var formData = new FormData();
        formData.append("file", fileInput.files[0]);
        formData.append("idAcciones", currentIdAcciones);
        formData.append("idObra", currentIdObra);
        formData.append("contrato", currentContrato);
        formData.append("latitud", latitud);
        formData.append("longitud", longitud);

        var $btn = $('#btnAgregarFotoGeo');
        $btn.prop('disabled', true).html('<i class="fas fa-spinner fa-spin mr-1"></i> Subiendo...');

        $.ajax({
            url: baseUrl + 'SubirFotoGeoreferencia',
            type: 'POST',
            data: formData,
            contentType: false,
            processData: false,
            success: function () {
                Swal.fire({ icon: 'success', title: 'Foto subida', text: 'La foto se guardó correctamente', timer: 1500, showConfirmButton: false });
                cargarFotos(currentIdAcciones);
                // Limpiar campos
                $('#fileFotoGeo').val('');
                $('.custom-file-label[for="fileFotoGeo"]').text('Elegir imagen...');
                $('#txtLatFotoGeo').val('');
                $('#txtLonFotoGeo').val('');
                $('#imgPreviewFotoGeo').attr('src', '').hide();
                $('#previewFotoGeo').hide();
                $('#placeholderPreviewGeo').show();
            },
            error: function () {
                Swal.fire('Error', 'No se pudo subir la foto', 'error');
            },
            complete: function () {
                $btn.prop('disabled', false).html('<i class="fas fa-upload mr-1"></i> Subir Foto');
            }
        });
    };

    // ======================== CAPTURAR GPS ========================
    var initCapturarGPS = function () {
        $('#btnCapturarGPSGeo').off('click').on('click', function () {
            var $btn = $(this);
            var $status = $('#statusGPSGeo');

            if (!navigator.geolocation) {
                Swal.fire('No disponible', 'Tu navegador no soporta geolocalización', 'warning');
                return;
            }

            $btn.prop('disabled', true).html('<i class="fas fa-spinner fa-spin mr-1"></i> Obteniendo...');
            $status.text('Solicitando ubicación...').show();

            navigator.geolocation.getCurrentPosition(
                function (pos) {
                    var lat = pos.coords.latitude.toFixed(6);
                    var lon = pos.coords.longitude.toFixed(6);
                    $('#txtLatFotoGeo').val(lat);
                    $('#txtLonFotoGeo').val(lon);
                    $status.html('<i class="fas fa-check-circle text-success mr-1"></i> Ubicación capturada').show();
                    $btn.prop('disabled', false).html('<i class="fas fa-crosshairs mr-1"></i> Obtener GPS');
                },
                function (err) {
                    var msg = 'No se pudo obtener la ubicación';
                    if (err.code === 1) msg = 'Permiso denegado por el usuario';
                    else if (err.code === 2) msg = 'Ubicación no disponible';
                    else if (err.code === 3) msg = 'Tiempo de espera agotado';
                    $status.html('<i class="fas fa-exclamation-circle text-danger mr-1"></i> ' + msg).show();
                    $btn.prop('disabled', false).html('<i class="fas fa-crosshairs mr-1"></i> Obtener GPS');
                },
                { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
            );
        });
    };
    
    var eliminarFoto = function (idFoto) {

        Swal.fire({
            title: '¿Eliminar?',
            text: 'Esta acción no se puede deshacer',
            icon: 'warning',
            showCancelButton: true
        }).then((result) => {
            

            if (result.value) {

                $.ajax({
                    url: baseUrl + 'EliminarFotoGeoreferencia',
                    type: 'POST',
                    data: JSON.stringify({ idFoto: idFoto }),
                    contentType: 'application/json',
                    success: function () {
                        Swal.fire('Eliminado', 'Foto eliminada correctamente', 'success');
                        cargarFotos(currentIdAcciones);
                    },
                    error: function (err) {
                        console.log(err);
                        Swal.fire('Error', 'No se pudo eliminar', 'error');
                    }
                });
            }

        });
    };
    // ======================== DESCARGAR FOTO ========================
    var descargarFoto = function (ruta, event) {
        if (event) event.preventDefault(); // 🔥 CLAVE
        const link = document.createElement('a');
        link.href = baseUrl + 'DescargarFoto?ruta=' + encodeURIComponent(ruta);
        link.download = ''; // fuerza descarga
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);

    };

    // ======================== EVENTOS ========================
    var initEventosFotos = function () {

        // Botón agregar foto
        $('#btnAgregarFotoGeo').off('click').on('click', function () {
            subirFoto();
        });

        // Preview de imagen al seleccionar archivo
        $('#fileFotoGeo').off('change').on('change', function () {
            var file = this.files[0];
            if (file) {
                var reader = new FileReader();
                reader.onload = function (e) {
                    $('#imgPreviewFotoGeo').attr('src', e.target.result).show();
                    $('#previewFotoGeo').show();
                    $('#placeholderPreviewGeo').hide();
                };
                reader.readAsDataURL(file);
                // Actualizar etiqueta custom-file
                $('.custom-file-label[for="fileFotoGeo"]').text(file.name);
                // Limpiar status GPS al cambiar foto
                $('#statusGPSGeo').hide();
            }
        });

        // Botón GPS
        initCapturarGPS();
    };


    //======================================================================
    // ======================== DATOS INICIO ===============================
    //======================================================================
    // Precarga los montos de Sección B desde las fuentes de financiamiento registradas
    var precargarMontosFuentes = function (idAcciones) {
        $.get(baseUrl + 'GetMontosFuentes/' + idAcciones, function (f) {
            if (!f) return;
            var fmt = function(v) { return parseFloat(v || 0).toFixed(2); };
            $('#txtAportacionFismdfInicio').val(fmt(f.fismdf));
            $('#txtOtraFuenteFederalInicio').val(fmt(f.otraFederal));
            $('#txtFuenteEstatalInicio').val(fmt(f.estatal));
            $('#txtFuenteMunicipalInicio').val(fmt(f.municipal));
            $('#txtOtrosInicio').val(fmt(f.otros));
            // Calcular costo total
            var total = (f.fismdf||0) + (f.otraFederal||0) + (f.estatal||0) + (f.municipal||0) + (f.otros||0);
            $('#txtCostoTotalInicio').val(total.toFixed(2));
        });
    };

    var abrirDatosInicio = function (idAcciones) {
        limpiarFormularioInicio();
        $('#hddIdAccionInicio').val(idAcciones);

        // Cargar encabezado
        $.get(baseUrl + 'GetDatosEncabezado/' + idAcciones, function (data) {
            $('#lblObraInicio').text(data.nombreObra);
            $('#lblRubroInicio').text(data.rubro);
            $('#lblContratoInicio').text(data.numContrato);
            $('#lblLocalidadInicio').text(data.localidad);
            $('#lblMontoInicio').text('$' + parseFloat(data.montoContratado || 0).toLocaleString('es-MX', { minimumFractionDigits: 2 }));
            $('#lblFuenteInicio').text(data.fuenteFinanciamiento);
            $('#lblPeriodoInicioI').text(data.periodoInicio);
            $('#lblPeriodoFinI').text(data.periodoFin);
            $('#lblClaveLocalidadInicio').text(data.claveLocalidad);
            $('#lblMetaCantidadInicio').text(data.metaCantidad);
            $('#lblMetaUnidadInicio').text(data.metaUnidad);
            $('#lblDescripcionAccionInicio').text(data.descripcionAccion);
            $('#hddIdObraInicio').val(data.idObraProyecto);
            $('#hddIdRubroInicio').val(data.idRubro);
            $('#hddRubroInicio').val(data.rubro);
            $('#hddIdSubrubroInicio').val(data.idPrograma);
            $('#hddSubrubroInicio').val(data.programa);
        });

        // Cargar datos existentes si los hay
        $.get(baseUrl + 'GetDatosInicio/' + idAcciones, function (data) {
            if (data && data.idSeguimiento) {
                // Datos existentes — precargar montos solo si todos están en 0
                var todosEnCero = !data.aportacionFismdf && !data.otraFuenteFederal &&
                                  !data.fuenteEstatal && !data.fuenteMunicipal && !data.costoTotal;
                $('#hddIdSeguimientoInicio').val(data.idSeguimiento);
                $('#hddAccionMovInicio').val('M');
                $('#txtNoAgebInicio').val(data.noAgeb);
                $('#txtFechaVerificacionInicio').val(data.fechaVerificacion);
                $('#chkAmpliaInicio').prop('checked', data.amplia);
                $('#chkConstruccionInicio').prop('checked', data.construccion);
                $('#chkEquipamientoInicio').prop('checked', data.equipamiento);
                $('#chkMantenimientoInicio').prop('checked', data.mantenimiento);
                $('#chkRehabilitacionInicio').prop('checked', data.rehabilitacion);
                $('#chkDirectaInicio').prop('checked', data.directa);
                $('#chkComplementariaInicio').prop('checked', data.complementaria);
                $('#cboZonaAtencionInicio').val(data.zonaAtencion ? 'S' : 'N');
                $('#cboRezagoSocialInicio').val(data.rezagoSocial);
                $('#cboAcreditacionPobrezaInicio').val(data.acreditacionPobreza ? 'S' : 'N');
                $('#txtAportacionFismdfInicio').val(data.aportacionFismdf);
                $('#txtOtraFuenteFederalInicio').val(data.otraFuenteFederal);
                $('#txtFuenteEstatalInicio').val(data.fuenteEstatal);
                $('#txtFuenteMunicipalInicio').val(data.fuenteMunicipal);
                $('#txtOtrosInicio').val(data.otros);
                $('#txtCostoTotalInicio').val(data.costoTotal);
                $('#txtLatitudInicio').val(data.latitud);
                $('#txtLongitudInicio').val(data.longitud);
                $('#txtDireccionInicio').val(data.direccion);
                $('#txtReferenciaInicio').val(data.referencia);

                $('#chkZonaPrioritariaInicio').prop('checked', data.zonaAtencion);
                $('#chkRezagoAltoInicio').prop('checked', data.rezagoSocial);
                $('#chkPobrezaExtremaInicio').prop('checked', data.acreditacionPobreza);
                //$('#cboCoincidePlaneacionInicio').val(data.coincidePlaneacion != null ? data.coincidePlaneacion.toString() : "false");
                $('#cboCoincidePlaneacionInicio').val((data.coincidePlaneacion + "").toLowerCase());
                $('#txtDescripcionNoCoincideInicio').val(data.descripcionNoCoincide);
                //$('#cboCoincidePlaneacionRubroInicio').val(data.coincidePlaneacionRubro != null ? data.coincidePlaneacionRubro.toString() : "false");
                $('#cboCoincidePlaneacionRubroInicio').val((data.coincidePlaneacionRubro + "").toLowerCase());
                //$('#txtDescripcionNoCoincideRubroInicio').val(data.descripcionNoCoincideRubro);
                $('#txtDescripcionNoCoincideRubroInicio').val(data.descripcionNoCoincideRubro || '');

                // Mostrar fotos existentes
                //if (data.croquis) $('#imgCroquisInicio').attr('src', data.croquis).show();
                //if (data.foto1) $('#imgFoto1Inicio').attr('src', data.foto1).show();
                //if (data.foto2) $('#imgFoto2Inicio').attr('src', data.foto2).show();
                //if (data.foto3) $('#imgFoto3Inicio').attr('src', data.foto3).show();
                //if (data.foto4) $('#imgFoto4Inicio').attr('src', data.foto4).show();
                // Supervisor y descripción visita
                $('#txtSupervisorInicio').val(data.supervisor || '');
                $('#txtDescripcionVisitaInicio').val(data.descripcionVisita || '');

                // Mostrar fotos existentes con botones descargar/eliminar + coords
                var fotosInicio = {
                    'croquis': { ruta: data.croquis, lat: data.latitudCroquis, lon: data.longuitudCroquis },
                    '1': { ruta: data.foto1, lat: data.latitudFoto1, lon: data.longuitudFoto1 },
                    '2': { ruta: data.foto2, lat: data.latitudFoto2, lon: data.longuitudFoto2 },
                    '3': { ruta: data.foto3, lat: data.latitudFoto3, lon: data.longuitudFoto3 },
                    '4': { ruta: data.foto4, lat: data.latitudFoto4, lon: data.longuitudFoto4 }
                };
                $.each(fotosInicio, function (key, info) {
                    var sufijo = key === 'croquis' ? 'Croquis' : 'Foto' + key;
                    if (info.ruta) {
                        $('#img' + sufijo + 'Inicio').attr('src', info.ruta).show();
                        $('#placeholder' + sufijo + 'Inicio').hide();
                        $('#acciones' + sufijo + 'Inicio').show();
                        $('#hddRuta' + sufijo + 'Inicio').val(info.ruta);
                    }
                    $('#txtLat' + sufijo + 'Inicio').val(info.lat || '');
                    $('#txtLon' + sufijo + 'Inicio').val(info.lon || '');
                });
                // Si todos los montos son 0, intentar precargar desde fuentes
                if (todosEnCero) {
                    precargarMontosFuentes(idAcciones);
                }
                // Cargar partidas de la sección Reporte Fotográfico
                cargarPartidas(data.idSeguimiento);
            } else {
                $('#hddAccionMovInicio').val('A');
                // Registro nuevo: precargar montos desde fuentes de financiamiento
                precargarMontosFuentes(idAcciones);
                limpiarPartidas();
            }
        });

        $('#modalDatosInicio').modal('show');
    };

    var limpiarFormularioInicio = function () {
        $('#txtNoAgebInicio, #txtFechaVerificacionInicio, #txtDescripcionNoCoincideInicio').val('');
        $('#txtDescripcionNoCoincideRubroInicio, #txtLatitudInicio, #txtLongitudInicio').val('');
        $('#txtDireccionInicio, #txtReferenciaInicio').val('');
        $('#txtSupervisorInicio, #txtDescripcionVisitaInicio').val('');
        $('#txtAportacionFismdfInicio, #txtOtraFuenteFederalInicio, #txtFuenteEstatalInicio').val('0.00');
        $('#txtFuenteMunicipalInicio, #txtOtrosInicio, #txtCostoTotalInicio').val('0.00');
        $('#chkAmpliaInicio, #chkConstruccionInicio, #chkEquipamientoInicio,\
          #chkMantenimientoInicio, #chkRehabilitacionInicio').prop('checked', false);
        $('#chkDirectaInicio, #chkComplementariaInicio, #chkZonaPrioritariaInicio,\
          #chkRezagoAltoInicio, #chkPobrezaExtremaInicio').prop('checked', false);
        $('#cboCoincidePlaneacionInicio').val('true');
        $('#cboCoincidePlaneacionRubroInicio').val('true');

        // Limpiar fotos, placeholders y coordenadas por slot
        var sufijos = ['Croquis', 'Foto1', 'Foto2', 'Foto3', 'Foto4'];
        $.each(sufijos, function (i, s) {
            $('#img' + s + 'Inicio').hide().attr('src', '');
            $('#placeholder' + s + 'Inicio').show();
            $('#acciones' + s + 'Inicio').hide();
            $('#file' + s + 'Inicio').val('');
            $('#hddRuta' + s + 'Inicio').val('');
            $('#txtLat' + s + 'Inicio').val('');
            $('#txtLon' + s + 'Inicio').val('');
        });

        $('#hddAccionMovInicio').val('A');
    };
    var descargarFotoInicio = function (numero) {
        var sufijo = numero === 'croquis' ? 'Croquis' : 'Foto' + numero;
        var ruta = $('#hddRuta' + sufijo + 'Inicio').val();
        if (!ruta) { Swal.fire('Aviso', 'No hay foto guardada.', 'info'); return; }
        var link = document.createElement('a');
        link.href = baseUrl + 'DescargarFoto?ruta=' + encodeURIComponent(ruta);
        link.download = '';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    var eliminarFotoInicio = function (numero) {
        var idSeguimiento = $('#hddIdSeguimientoInicio').val();
        if (!idSeguimiento) {
            Swal.fire('Aviso', 'Guarda el registro primero antes de eliminar fotos.', 'info');
            return;
        }
        var esCroquis = (numero === 'croquis');
        var sufijo = esCroquis ? 'Croquis' : 'Foto' + numero;
        var colImg = esCroquis ? 'imgcroquis' : 'imgfoto' + numero;
        var colRuta = esCroquis ? 'croquis' : 'foto' + numero;

        Swal.fire({
            title: '¿Eliminar ' + (esCroquis ? 'croquis' : 'foto ' + numero) + '?',
            text: 'Esta acción no se puede deshacer.',
            icon: 'warning',
            showCancelButton: true,
            confirmButtonText: 'Sí, eliminar',
            cancelButtonText: 'Cancelar',
            confirmButtonColor: '#F64E60'
        }).then(function (result) {
            if (result.value) {
                $.ajax({
                    url: baseUrl + 'EliminarFotoInicio',
                    type: 'POST',
                    contentType: 'application/json',
                    data: JSON.stringify({
                        idSeguimiento: idSeguimiento,
                        colImg: colImg,
                        colRuta: colRuta
                    }),
                    success: function () {
                        $('#img' + sufijo + 'Inicio').hide().attr('src', '');
                        $('#placeholder' + sufijo + 'Inicio').show();
                        $('#acciones' + sufijo + 'Inicio').hide();
                        $('#hddRuta' + sufijo + 'Inicio').val('');
                        $('#file' + sufijo + 'Inicio').val('');
                        Swal.fire('Listo', 'Eliminado correctamente.', 'success');
                    },
                    error: function (xhr) {
                        Swal.fire('Error', xhr.responseText, 'error');
                    }
                });
            }
        });
    };
    var guardarDatosInicio = function () {
        var formData = new FormData();
        formData.append('IdAcciones', $('#hddIdAccionInicio').val());
        formData.append('IdObraProyecto', $('#hddIdObraInicio').val());
        formData.append('AccionMov', $('#hddAccionMovInicio').val());
        formData.append('NoAgeb', $('#txtNoAgebInicio').val());
        formData.append('FechaVerificacion', $('#txtFechaVerificacionInicio').val());
        formData.append('Amplia', $('#chkAmpliaInicio').is(':checked'));
        formData.append('Construccion', $('#chkConstruccionInicio').is(':checked'));
        formData.append('Equipamiento', $('#chkEquipamientoInicio').is(':checked'));
        formData.append('Mantenimiento', $('#chkMantenimientoInicio').is(':checked'));
        formData.append('Rehabilitacion', $('#chkRehabilitacionInicio').is(':checked'));
        formData.append('Directa', $('#chkDirectaInicio').is(':checked'));
        formData.append('Complementaria', $('#chkComplementariaInicio').is(':checked'));
        formData.append('AportacionFismdf', $('#txtAportacionFismdfInicio').val());
        formData.append('OtraFuenteFederal', $('#txtOtraFuenteFederalInicio').val());
        formData.append('FuenteEstatal', $('#txtFuenteEstatalInicio').val());
        formData.append('FuenteMunicipal', $('#txtFuenteMunicipalInicio').val());
        formData.append('Otros', $('#txtOtrosInicio').val());
        formData.append('CostoTotal', $('#txtCostoTotalInicio').val());
        formData.append('Latitud', $('#txtLatitudInicio').val());
        formData.append('Longitud', $('#txtLongitudInicio').val());
        formData.append('Direccion', $('#txtDireccionInicio').val());
        formData.append('Referencia', $('#txtReferenciaInicio').val());
        formData.append('Localidad', $('#lblLocalidadInicio').text());
        formData.append('ClaveLocalidad', $('#lblClaveLocalidadInicio').text());
        formData.append('MetaUnidad', $('#lblMetaUnidadInicio').text());
        formData.append('MetaCantidad', $('#lblMetaCantidadInicio').text());
        formData.append('DescripcionObra', $('#lblDescripcionAccionInicio').text());
        formData.append('PeriodoInicio', $('#lblPeriodoInicioI').text());
        formData.append('PeriodoFin', $('#lblPeriodoFinI').text());
        formData.append('IdRubro', $('#hddIdRubroInicio').val());
        formData.append('Rubro', $('#hddRubroInicio').val());
        formData.append('IdSubrubro', $('#hddIdSubrubroInicio').val());
        formData.append('Subrubro', $('#hddSubrubroInicio').val());

        formData.append('ZonaAtencion', $('#chkZonaPrioritariaInicio').is(':checked'));
        formData.append('RezagoSocial', $('#chkRezagoAltoInicio').is(':checked'));
        formData.append('AcreditacionPobreza', $('#chkPobrezaExtremaInicio').is(':checked'));
        formData.append('CoincidePlaneacion', $('#cboCoincidePlaneacionInicio').val());
        formData.append('DescripcionNoCoincide', $('#txtDescripcionNoCoincideInicio').val());
        formData.append('CoincidePlaneacionRubro', $('#cboCoincidePlaneacionRubroInicio').val());
        formData.append('DescripcionNoCoincideRubro', $('#txtDescripcionNoCoincideRubroInicio').val());
        formData.append('Supervisor', $('#txtSupervisorInicio').val());
        formData.append('DescripcionVisita', $('#txtDescripcionVisitaInicio').val());

        // Coordenadas por slot de foto
        formData.append('LatCroquis', $('#txtLatCroquisInicio').val());
        formData.append('LonCroquis', $('#txtLonCroquisInicio').val());
        formData.append('LatFoto1', $('#txtLatFoto1Inicio').val());
        formData.append('LonFoto1', $('#txtLonFoto1Inicio').val());
        formData.append('LatFoto2', $('#txtLatFoto2Inicio').val());
        formData.append('LonFoto2', $('#txtLonFoto2Inicio').val());
        formData.append('LatFoto3', $('#txtLatFoto3Inicio').val());
        formData.append('LonFoto3', $('#txtLonFoto3Inicio').val());
        formData.append('LatFoto4', $('#txtLatFoto4Inicio').val());
        formData.append('LonFoto4', $('#txtLonFoto4Inicio').val());

        // Archivos
        var fileCroquis = $('#fileCroquisInicio')[0].files[0];
        var fileFoto1 = $('#fileFoto1Inicio')[0].files[0];
        var fileFoto2 = $('#fileFoto2Inicio')[0].files[0];
        var fileFoto3 = $('#fileFoto3Inicio')[0].files[0];
        var fileFoto4 = $('#fileFoto4Inicio')[0].files[0];

        if (fileCroquis) formData.append('Croquis', fileCroquis);
        if (fileFoto1) formData.append('Foto1', fileFoto1);
        if (fileFoto2) formData.append('Foto2', fileFoto2);
        if (fileFoto3) formData.append('Foto3', fileFoto3);
        if (fileFoto4) formData.append('Foto4', fileFoto4);

        var doGuardar = function() {
            $.ajax({
            url: baseUrl + 'GuardarDatosInicio',
            type: 'POST',
            data: formData,
            processData: false,
            contentType: false,
            cache: false,
            async: true,
            success: function (response) {
                console.log("Respuesta:", response);

                if (response && response.success) {
                    // Guardar partidas usando el idSeguimiento que devuelve el servidor
                    var idSeg = response.idSeguimiento || $('#hddIdSeguimientoInicio').val();
                    guardarPartidas(idSeg, function () {
                        Swal.fire('Éxito', 'Datos guardados correctamente', 'success');
                        $('#modalDatosInicio').modal('hide');
                    });
                } else {
                    Swal.fire('Error', 'No se pudo guardar correctamente', 'error');
                }
            },
            error: function (xhr) {
                console.error(xhr);
                Swal.fire('Error', xhr.responseText || 'Error en el servidor', 'error');
            }
        });
        }; // fin doGuardar

        if (!$('#txtFechaVerificacionInicio').val()) {
            Swal.fire({
                title: 'Fecha vacía',
                text: 'No has capturado la fecha de verificación. ¿Deseas guardar de todas formas?',
                icon: 'question',
                showCancelButton: true,
                confirmButtonText: 'Sí, guardar',
                cancelButtonText: 'Cancelar'
            }).then(function(result) {
                if (result.isConfirmed) doGuardar();
            });
        } else {
            doGuardar();
        }
    };
    //======================================================================
    // ======================== SEGUIMIENTO ================================
    //======================================================================
    // Funcion interna para cambiar entre vista grid y vista formulario
    var mostrarVistaGrid = function () {
        $('#vistaSeguimientoGrid').show();
        $('#vistaSeguimientoForm').hide();
        $('#footerGridSeg').show();
        $('#footerFormSeg').hide();
        $('#tituloModalSeg').text('Seguimiento de Avances de Obra');
        $('#iconTituloSeg').attr('class', 'fas fa-eye text-white mr-2');
    };

    var mostrarVistaForm = function (esNuevo) {
        $('#vistaSeguimientoGrid').hide();
        $('#vistaSeguimientoForm').show();
        $('#footerGridSeg').hide();
        $('#footerFormSeg').show();
        var titulo = esNuevo ? 'Agregar Seguimiento' : 'Modificar Seguimiento';
        $('#tituloModalSeg').text(titulo);
        $('#iconTituloSeg').attr('class', 'fas fa-clipboard-list text-white mr-2');
        // Regresar scroll al inicio del modal-body
        $('.modal-body').scrollTop(0);
    };
    // ---------------------------------------------------------------------------
    // abrirSeguimiento: abre el modal unico en vista GRID
    // ---------------------------------------------------------------------------
    var abrirSeguimiento = function (idAcciones) {
        $('#hddIdAccionSeg').val(idAcciones);

        // Mostrar vista grid primero
        mostrarVistaGrid();

        // Cargar encabezado (nombre obra y localidad para el grid)
        $.get(baseUrl + 'GetDatosEncabezado/' + idAcciones, function (data) {
            if (data) {
                $('#hddNombreObraSeg').val(data.nombreObra || '');
                $('#hddLocalidadSeg').val(data.localidad || '');
            }
            // Cargar grid DENTRO del callback para evitar race condition
            cargarGridSeguimientos(idAcciones);
        });

        $('#modalSeguimiento').modal('show');
    };

    // ---------------------------------------------------------------------------
    // cargarGridSeguimientos: llena la tabla del grid
    // ---------------------------------------------------------------------------
    var cargarGridSeguimientos = function (idAcciones) {
        $.get(baseUrl + 'GetSeguimientos/' + idAcciones, function (data) {
            var nombreObra = $('#hddNombreObraSeg').val();
            var localidad = $('#hddLocalidadSeg').val();
            var html = '';

            if (data && data.length > 0) {
                $.each(data, function (i, item) {
                    html += '<tr>';
                    html += '<td class="text-center">' + (i + 1) + '</td>';
                    html += '<td>' + nombreObra + '</td>';
                    html += '<td class="text-center">' + (item.fechaVisita || '') + '</td>';
                    html += '<td>' + localidad + '</td>';
                    html += '<td class="text-center">' + parseFloat(item.avanceFisico || 0).toFixed(2) + '%</td>';
                    html += '<td class="text-center">' + parseFloat(item.avanceFinanciero || 0).toFixed(2) + '%</td>';
                    html += '<td class="text-center">';
                    html += '<a href="javascript:;" class="btn btn-sm btn-icon btn-light-primary mr-1" '
                        + 'title="Modificar" '
                        + 'onclick="CedulaModule.modificarSeguimiento(' + idAcciones + ',' + item.idSeguimiento + ')">'
                        + '<i class="flaticon-edit"></i></a>';
                    html += '<a href="javascript:;" class="btn btn-sm btn-icon btn-light-danger mr-1" '
                        + 'title="Eliminar" '
                        + 'onclick="CedulaModule.eliminarSeguimiento(' + item.idSeguimiento + ')">'
                        + '<i class="flaticon-delete"></i></a>';
                    html += '<a href="javascript:;" class="btn btn-sm btn-icon btn-light-info" '
                        + 'title="Imprimir" '
                        + 'onclick="CedulaModule.imprimirSeguimiento(' + item.idSeguimiento + ')">'
                        + '<i class="fas fa-print"></i></a>';
                    html += '</td>';
                    html += '</tr>';
                });
            } else {
                html = '<tr><td colspan="7" class="text-center text-muted py-4">'
                    + '<i class="fas fa-info-circle mr-2"></i>No hay seguimientos registrados. '
                    + 'Presione <strong>Agregar Seguimiento</strong> para crear el primero.'
                    + '</td></tr>';
            }

            $('#tbodySeguimientos').html(html);
        }).fail(function (xhr) {
            Swal.fire('Error', 'No se pudo cargar el listado: ' + xhr.responseText, 'error');
        });
    };

    // ---------------------------------------------------------------------------
    // abrirFormularioSeguimiento: cambia a vista FORMULARIO dentro del mismo modal
    //   idSeguimiento = 0  --> Agregar
    //   idSeguimiento > 0  --> Modificar
    // ---------------------------------------------------------------------------
    var abrirFormularioSeguimiento = function (idAcciones, idSeguimiento) {
        limpiarFormularioSeguimiento();

        $('#hddIdAccionFormSeg').val(idAcciones);
        $('#hddIdSeguimiento').val(idSeguimiento || 0);

        var esNuevo = (!idSeguimiento || idSeguimiento <= 0);

        // Cargar encabezado
        $.get(baseUrl + 'GetDatosEncabezado/' + idAcciones, function (data) {
            if (data) {
                $('#lblObraFormSeg').text(data.nombreObra || '');
                $('#lblRubroFormSeg').text(data.rubro || '');
                $('#lblContratoFormSeg').text(data.numContrato || '');
                $('#lblLocalidadFormSeg').text(data.localidad || '');
                $('#lblMontoFormSeg').text('$' + parseFloat(data.montoContratado || 0).toLocaleString('es-MX', { minimumFractionDigits: 2 }));
                $('#lblFuenteFormSeg').text(data.fuenteFinanciamiento || '');
                $('#lblPeriodoInicioFormSeg').text(data.periodoInicio || '');
                $('#lblPeriodoFinFormSeg').text(data.periodoFin || '');
                $('#lblClaveLocalidadFormSeg').text(data.claveLocalidad || '');
                $('#lblMetaCantidadFormSeg').text(data.metaCantidad || '');
                $('#lblMetaUnidadFormSeg').text(data.metaUnidad || '');
                $('#lblDescripcionAccionFormSeg').text(data.descripcionAccion || '');
                // Variables globales
                $('#hddIdObraFormSeg').val(data.idObraProyecto || 0);
                $('#hddIdRubroSeg').val(data.idRubro || 0);
                $('#hddRubroSeg').val(data.rubro || '');
                $('#hddIdSubrubroSeg').val(data.idPrograma || 0);
                $('#hddSubrubroSeg').val(data.programa || '');
            }
        });

        if (esNuevo) {
            // MODO AGREGAR: pre-cargar Seccion 1 del ultimo registro; cargar partidas sin fotos
            $('#hddAccionMovSeg').val('A');
            cargarPartidasFotosSeg(idAcciones, 0);
            $.get(baseUrl + 'GetUltimoSeguimiento/' + idAcciones, function (ultimo) {
                if (ultimo) {
                    $('#txtNoAgebSeg').val(ultimo.noAgeb || '');
                    $('#txtFechaVerificacionSeg').val(ultimo.fechaVerificacion || '');
                    $('#chkAmpliaSeg').prop('checked', ultimo.amplia === true);
                    $('#chkConstruccionSeg').prop('checked', ultimo.construccion === true);
                    $('#chkEquipamientoSeg').prop('checked', ultimo.equipamiento === true);
                    $('#chkMantenimientoSeg').prop('checked', ultimo.mantenimiento === true);
                    $('#chkRehabilitacionSeg').prop('checked', ultimo.rehabilitacion === true);
                    $('#chkDirectaSeg').prop('checked', ultimo.directa === true);
                    $('#chkComplementariaSeg').prop('checked', ultimo.complementaria === true);
                    $('#txtAportacionFismdfSeg').val(parseFloat(ultimo.aportacionFismdf || 0).toFixed(2));
                    $('#txtOtraFuenteFederalSeg').val(parseFloat(ultimo.otraFuenteFederal || 0).toFixed(2));
                    $('#txtFuenteEstatalSeg').val(parseFloat(ultimo.fuenteEstatal || 0).toFixed(2));
                    $('#txtFuenteMunicipalSeg').val(parseFloat(ultimo.fuenteMunicipal || 0).toFixed(2));
                    $('#txtOtrosSeg').val(parseFloat(ultimo.otros || 0).toFixed(2));
                    $('#txtCostoTotalSeg').val(parseFloat(ultimo.costoTotal || 0).toFixed(2));
                }
            });
        } else {
            // MODO MODIFICAR: cargar todos los datos del registro
            $('#hddAccionMovSeg').val('M');
            $.get(baseUrl + 'GetSeguimientoById/' + idSeguimiento, function (data) {
                if (data) {
                    // Seccion 1
                    $('#txtNoAgebSeg').val(data.noAgeb || '');
                    $('#txtFechaVerificacionSeg').val(data.fechaVerificacion || '');
                    $('#chkAmpliaSeg').prop('checked', data.amplia === true);
                    $('#chkConstruccionSeg').prop('checked', data.construccion === true);
                    $('#chkEquipamientoSeg').prop('checked', data.equipamiento === true);
                    $('#chkMantenimientoSeg').prop('checked', data.mantenimiento === true);
                    $('#chkRehabilitacionSeg').prop('checked', data.rehabilitacion === true);
                    $('#chkDirectaSeg').prop('checked', data.directa === true);
                    $('#chkComplementariaSeg').prop('checked', data.complementaria === true);
                    $('#txtAportacionFismdfSeg').val(parseFloat(data.aportacionFismdf || 0).toFixed(2));
                    $('#txtOtraFuenteFederalSeg').val(parseFloat(data.otraFuenteFederal || 0).toFixed(2));
                    $('#txtFuenteEstatalSeg').val(parseFloat(data.fuenteEstatal || 0).toFixed(2));
                    $('#txtFuenteMunicipalSeg').val(parseFloat(data.fuenteMunicipal || 0).toFixed(2));
                    $('#txtOtrosSeg').val(parseFloat(data.otros || 0).toFixed(2));
                    $('#txtCostoTotalSeg').val(parseFloat(data.costoTotal || 0).toFixed(2));
                    // Seccion 2
                    $('#txtFechaVisitaSeg').val(data.fechaVisita || '');
                    $('#txtAvanceFisicoSeg').val(parseFloat(data.avanceFisico || 0).toFixed(2));
                    $('#txtAvanceFinancieroSeg').val(parseFloat(data.avanceFinanciero || 0).toFixed(2));
                    $('#cboCatalogoConceptosSeg').val(data.catalogoConcepto ? 'S' : 'N');
                    $('#txtCambiosCatalogoSeg').val(data.cambiosCatalogoConceptos || '');
                    $('#txtCambiosAvanceFisicoSeg').val(data.cambiosAvanceFisico || '');
                    // Seccion 3 — cargar partidas con sus fotos para este seguimiento
                    cargarPartidasFotosSeg(idAcciones, idSeguimiento);
                }
            }).fail(function (xhr) {
                Swal.fire('Error', 'No se pudo cargar el seguimiento: ' + xhr.responseText, 'error');
            });
        }

        // Cambiar a vista formulario (dentro del mismo modal)
        mostrarVistaForm(esNuevo);
    };

    // ---------------------------------------------------------------------------
    // modificarSeguimiento
    // ---------------------------------------------------------------------------
    var modificarSeguimiento = function (idAcciones, idSeguimiento) {
        abrirFormularioSeguimiento(idAcciones, idSeguimiento);
    };

    // ---------------------------------------------------------------------------
    // limpiarFormularioSeguimiento
    // ---------------------------------------------------------------------------
    var limpiarFormularioSeguimiento = function () {
        // Seccion 1
        $('#txtNoAgebSeg, #txtFechaVerificacionSeg').val('');
        $('#chkAmpliaSeg, #chkConstruccionSeg, #chkEquipamientoSeg, #chkMantenimientoSeg, #chkRehabilitacionSeg').prop('checked', false);
        $('#chkDirectaSeg, #chkComplementariaSeg').prop('checked', false);
        $('#txtAportacionFismdfSeg, #txtOtraFuenteFederalSeg, #txtFuenteEstatalSeg').val('0.00');
        $('#txtFuenteMunicipalSeg, #txtOtrosSeg, #txtCostoTotalSeg').val('0.00');
        // Seccion 2
        $('#txtFechaVisitaSeg').val('');
        $('#txtAvanceFisicoSeg, #txtAvanceFinancieroSeg').val('0.00');
        $('#cboCatalogoConceptosSeg').val('N');
        $('#txtCambiosCatalogoSeg, #txtCambiosAvanceFisicoSeg').val('');
        // Seccion 3 — Reporte Fotográfico por Partidas
        limpiarPartidasFotosSeg();
        // Hiddens
        $('#hddIdSeguimiento').val(0);
        $('#hddAccionMovSeg').val('A');
        $('#hddIdRubroSeg, #hddRubroSeg, #hddIdSubrubroSeg, #hddSubrubroSeg').val('');
    };

    // ---------------------------------------------------------------------------
    // guardarSeguimiento
    // ---------------------------------------------------------------------------
    var descargarFotoSeg = function (numero) {
        var ruta = $('#hddRutaFoto' + numero + 'Seg').val();
        if (!ruta) { Swal.fire('Aviso', 'No hay foto guardada en esta posición.', 'info'); return; }
        var link = document.createElement('a');
        link.href = baseUrl + 'DescargarFoto?ruta=' + encodeURIComponent(ruta);
        link.download = '';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    var eliminarFotoSeg = function (numero) {
        var idSeguimiento = $('#hddIdSeguimiento').val();
        if (!idSeguimiento || idSeguimiento === '0') {
            Swal.fire('Aviso', 'Guarda el registro primero antes de eliminar fotos.', 'info');
            return;
        }
        Swal.fire({
            title: '¿Eliminar foto ' + numero + '?',
            text: 'Esta acción no se puede deshacer.',
            icon: 'warning',
            showCancelButton: true,
            confirmButtonText: 'Sí, eliminar',
            cancelButtonText: 'Cancelar',
            confirmButtonColor: '#F64E60'
        }).then(function (result) {
            if (result.value) {
                $.ajax({
                    url: baseUrl + 'EliminarFotoSeguimiento',
                    type: 'POST',
                    contentType: 'application/json',
                    data: JSON.stringify({
                        idSeguimiento: idSeguimiento,
                        numeroFoto: numero
                    }),
                    success: function () {
                        $('#imgFoto' + numero + 'Seg').hide().attr('src', '');
                        $('#placeholderFoto' + numero + 'Seg').show();
                        $('#accionesFoto' + numero + 'Seg').hide();
                        $('#hddRutaFoto' + numero + 'Seg').val('');
                        $('#fileFoto' + numero + 'Seg').val('');
                        Swal.fire('Listo', 'Foto eliminada correctamente.', 'success');
                    },
                    error: function (xhr) {
                        Swal.fire('Error', xhr.responseText, 'error');
                    }
                });
            }
        });
    };
    var guardarSeguimiento = function () {
        var fechaVal = $('#txtFechaVisitaSeg').val();
        if (!fechaVal) {
            Swal.fire('Validación', 'La Fecha de Visita es obligatoria', 'warning');
            return;
        }

        // Evitar doble clic
        var $btn = $('#btnGuardarSeguimiento');
        if ($btn.prop('disabled')) return;
        $btn.prop('disabled', true).html('<i class="fas fa-spinner fa-spin"></i> Guardando...');

        var formData = new FormData();
        // Control
        formData.append('IdAcciones', $('#hddIdAccionFormSeg').val());
        formData.append('IdObraProyecto', $('#hddIdObraFormSeg').val());
        formData.append('IdSeguimiento', $('#hddIdSeguimiento').val());
        formData.append('AccionMov', $('#hddAccionMovSeg').val());
        // Seccion 1
        formData.append('NoAgeb', $('#txtNoAgebSeg').val());
        formData.append('FechaVerificacion', formatearFechaISO($('#txtFechaVerificacionSeg').val()));
        formData.append('Amplia', $('#chkAmpliaSeg').is(':checked'));
        formData.append('Construccion', $('#chkConstruccionSeg').is(':checked'));
        formData.append('Equipamiento', $('#chkEquipamientoSeg').is(':checked'));
        formData.append('Mantenimiento', $('#chkMantenimientoSeg').is(':checked'));
        formData.append('Rehabilitacion', $('#chkRehabilitacionSeg').is(':checked'));
        formData.append('Directa', $('#chkDirectaSeg').is(':checked'));
        formData.append('Complementaria', $('#chkComplementariaSeg').is(':checked'));
        formData.append('AportacionFismdf', $('#txtAportacionFismdfSeg').val());
        formData.append('OtraFuenteFederal', $('#txtOtraFuenteFederalSeg').val());
        formData.append('FuenteEstatal', $('#txtFuenteEstatalSeg').val());
        formData.append('FuenteMunicipal', $('#txtFuenteMunicipalSeg').val());
        formData.append('Otros', $('#txtOtrosSeg').val());
        formData.append('CostoTotal', $('#txtCostoTotalSeg').val());
        // Variables globales
        formData.append('Localidad', $('#lblLocalidadFormSeg').text());
        formData.append('ClaveLocalidad', $('#lblClaveLocalidadFormSeg').text());
        formData.append('MetaUnidad', $('#lblMetaUnidadFormSeg').text());
        formData.append('MetaCantidad', $('#lblMetaCantidadFormSeg').text());
        formData.append('PeriodoInicio', formatearFechaISO($('#lblPeriodoInicioFormSeg').text()));
        formData.append('PeriodoFin', formatearFechaISO($('#lblPeriodoFinFormSeg').text()));
        formData.append('IdRubro', $('#hddIdRubroSeg').val());
        formData.append('Rubro', $('#hddRubroSeg').val());
        formData.append('IdSubrubro', $('#hddIdSubrubroSeg').val());
        formData.append('Subrubro', $('#hddSubrubroSeg').val());
        // Seccion 2
        formData.append('FechaVisita', formatearFechaISO($('#txtFechaVisitaSeg').val()));
        formData.append('AvanceFisico', $('#txtAvanceFisicoSeg').val());
        formData.append('AvanceFinanciero', $('#txtAvanceFinancieroSeg').val());
        formData.append('CatalogoConcepto', $('#cboCatalogoConceptosSeg').val() === 'S');
        formData.append('CambiosCatalogoConceptos', $('#txtCambiosCatalogoSeg').val());
        formData.append('CambiosAvanceFisico', $('#txtCambiosAvanceFisicoSeg').val());
        // Seccion 3 - las fotos ahora van por partidas (guardarFotosPartidas)
        // Se envian vacias para compatibilidad con el modelo del backend
        formData.append('DescripcionFoto1', '');
        formData.append('DescripcionFoto2', '');
        formData.append('DescripcionFoto3', '');
        formData.append('DescripcionFoto4', '');
        formData.append('DescripcionFoto5', '');
        formData.append('DescripcionFoto6', '');

        $.ajax({
            url: baseUrl + 'GuardarSeguimiento',
            type: 'POST',
            data: formData,
            processData: false,
            contentType: false,
            success: function (response) {
                if (response && response.success) {
                    var idSegGuardado = response.idSeguimiento || $('#hddIdSeguimiento').val();
                    $('#hddIdSeguimiento').val(idSegGuardado);
                    guardarFotosPartidas(idSegGuardado, function () {
                        $btn.prop('disabled', false).html('<i class="flaticon-disk"></i> Guardar Seguimiento');
                        Swal.fire({
                            title: '¡Éxito!',
                            text: 'Seguimiento guardado correctamente',
                            icon: 'success',
                            timer: 1800,
                            showConfirmButton: false
                        }).then(function () {
                            var idAccion = $('#hddIdAccionFormSeg').val();
                            $('#hddIdAccionSeg').val(idAccion);
                            cargarGridSeguimientos(idAccion);
                            mostrarVistaGrid();
                        });
                    });
                } else {
                    $btn.prop('disabled', false).html('<i class="flaticon-disk"></i> Guardar Seguimiento');
                    Swal.fire('Error', 'No se pudo guardar correctamente', 'error');
                }
            },
            error: function (xhr) {
                $btn.prop('disabled', false).html('<i class="flaticon-disk"></i> Guardar Seguimiento');
                Swal.fire('Error', 'Error al guardar: ' + xhr.responseText, 'error');
            }
        });
    };

    // ---------------------------------------------------------------------------
    // eliminarSeguimiento
    // ---------------------------------------------------------------------------
    var eliminarSeguimiento = function (idSeguimiento) {
        Swal.fire({
            title: '¿Confirmar eliminación?',
            text: 'Esta acción no se puede deshacer',
            icon: 'warning',
            showCancelButton: true,
            confirmButtonText: 'Sí, eliminar',
            cancelButtonText: 'Cancelar',
            confirmButtonColor: '#F64E60'
        }).then(function (result) {
            if (result.value) {
                $.ajax({
                    url: baseUrl + 'EliminarSeguimiento/' + idSeguimiento,
                    type: 'POST',
                    success: function () {
                        Swal.fire({
                            title: 'Eliminado',
                            text: 'Registro eliminado correctamente',
                            icon: 'success',
                            timer: 1500,
                            showConfirmButton: false
                        });
                        var idAccion = $('#hddIdAccionSeg').val();
                        cargarGridSeguimientos(idAccion);
                    },
                    error: function (xhr) {
                        Swal.fire('Error', 'No se pudo eliminar: ' + xhr.responseText, 'error');
                    }
                });
            }
        });
    };

    // ---------------------------------------------------------------------------
    // imprimirSeguimiento
    // ---------------------------------------------------------------------------
    var imprimirSeguimiento = function (idSeguimiento)
    {
        var url = baseUrl + 'ReporteSeguimiento/' + idSeguimiento;
        window.open(url, '_blank');
    };

    // ---------------------------------------------------------------------------
    // Eventos del modal unico de seguimiento
    // Se agregan en initEventos()
    // ---------------------------------------------------------------------------
    var initEventosSeguimiento = function () {

        // Boton Agregar Seguimiento (desde el grid)
        $('#btnAgregarSeguimiento').off('click').on('click', function () {
            var idAccion = $('#hddIdAccionSeg').val();
            abrirFormularioSeguimiento(idAccion, 0);
        });

        // Boton Cancelar / Regresar al listado (desde el formulario)
        $('#btnCancelarFormSeg').off('click').on('click', function () {
            mostrarVistaGrid();
        });

        // Boton Cerrar (X) del modal - solo cierra si esta en vista grid
        // Si esta en formulario, regresa al grid
        $('#btnCerrarXSeg').off('click').on('click', function () {
            if ($('#vistaSeguimientoForm').is(':visible')) {
                mostrarVistaGrid();
            } else {
                $('#modalSeguimiento').modal('hide');
            }
        });

        // Boton Cerrar del footer del grid
        $('#btnCerrarGridSeg').off('click').on('click', function () {
            $('#modalSeguimiento').modal('hide');
        });

        // Guardar seguimiento
        $('#btnGuardarSeguimiento').off('click').on('click', guardarSeguimiento);
    };
    //======================================================================
    // ======================== DATOS FINALES ==============================
    //======================================================================
    var abrirDatosFinales = function (idAcciones) {
        limpiarFormularioFinal();
        $('#hddIdAccionFinal').val(idAcciones);

        // Parámetros para cargarPartidasFotosFinal, se asignan al resolver GetDatosFinales
        // y se usan en el evento shown.bs.modal para garantizar que el DOM esté listo.
        var _pendienteCargarPartidas = null; // { idAcciones, idSeg }

        // ── 1. Cargar encabezado ─────────────────────────────────────────────
        $.get(baseUrl + 'GetDatosEncabezado/' + idAcciones, function (enc) {
            $('#lblObraFinal').text(enc.nombreObra);
            $('#lblRubroFinal').text(enc.rubro);
            $('#lblContratoFinal').text(enc.numContrato);
            $('#lblLocalidadFinal').text(enc.localidad);
            $('#lblMontoFinal').text('$' + parseFloat(enc.montoContratado || 0).toLocaleString('es-MX', { minimumFractionDigits: 2 }));
            $('#lblFuenteFinal').text(enc.fuenteFinanciamiento);
            $('#lblPeriodoInicioFinal').text(enc.periodoInicio);
            $('#lblPeriodoFinFinal').text(enc.periodoFin);
            $('#lblClaveLocalidadFinal').text(enc.claveLocalidad);
            $('#lblMetaCantidadFinal').text(enc.metaCantidad);
            $('#lblMetaUnidadFinal').text(enc.metaUnidad);
            $('#lblDescripcionAccionFinal').text(enc.descripcionAccion);
            $('#hddIdObraFinal').val(enc.idObraProyecto);
            $('#hddIdRubroFinal').val(enc.idRubro);
            $('#hddRubroFinal').val(enc.rubro);
            $('#hddIdSubrubroFinal').val(enc.idPrograma);
            $('#hddSubrubroFinal').val(enc.programa);

            // ── 2. Buscar si ya existe registro tipo F ────────────────────────
            $.get(baseUrl + 'GetDatosFinales/' + idAcciones, function (df) {

                if (df) {
                    // ══ MODO MODIFICAR: ya existe seguimiento final ══
                    $('#hddAccionMovFinal').val('M');
                    $('#hddIdSeguimientoFinal').val(df.idSeguimiento);

                    // Badge modo modificar
                    $('#badgeModoFinal')
                        .removeClass('badge-success').addClass('badge-warning')
                        .html('<i class="fas fa-edit mr-1"></i> Modificando registro final existente');

                    // — Sección A (heredados del último seguimiento) —
                    $('#txtNoAgebFinal').val(df.noAgeb);
                    $('#chkAmpliaFinal').prop('checked', df.amplia);
                    $('#chkConstruccionFinal').prop('checked', df.construccion);
                    $('#chkEquipamientoFinal').prop('checked', df.equipamiento);
                    $('#chkMantenimientoFinal').prop('checked', df.mantenimiento);
                    $('#chkRehabilitacionFinal').prop('checked', df.rehabilitacion);
                    $('#txtAportacionFismdfFinal').val(df.aportacionFismdf);
                    $('#txtOtraFuenteFederalFinal').val(df.otraFuenteFederal);
                    $('#txtFuenteEstatalFinal').val(df.fuenteEstatal);
                    $('#txtFuenteMunicipalFinal').val(df.fuenteMunicipal);
                    $('#txtOtrosFinal').val(df.otros);
                    $('#txtCostoTotalFinal').val(df.costoTotal);

                    // — Sección B (exclusivos del cierre final) —
                    $('#txtFechaVerificacionFinal').val(df.fechaVerificacion);
                    $('#cboObraConcluidaFinal').val(df.obraConcluida ? 'S' : 'N');
                    $('#cboCoincidePlaneacionFinal').val(df.coincidePlaneacion ? 'S' : 'N');
                    $('#txtDescripcionNoCoincideFinal').val(df.descripcionNoCoincide);
                    $('#txtPeriodoEjecucionInicioFinal').val(df.periodoEjecucionInicio);
                    $('#txtPeriodoEjecucionFinalFinal').val(df.periodoEjecucionFinal);
                    $('#cboCatalogoConceptosFinal').val(df.catalogoConcepto ? 'S' : 'N');
                    $('#txtCambiosCatalogoFinal').val(df.cambiosCatalogoConceptos);
                    $('#cboCoincideRubroFinal').val(df.coincidePlaneacionRubro ? 'S' : 'N');
                    $('#txtNoCoincideRubroFinal').val(df.descripcionNoCoincideRubro);
                    $('#txtDescripcionTrabajosFinal').val(df.descripcionTrabajosRealizados);

                    // — Sección C: marcar pendiente para cargar al abrir modal —
                    _pendienteCargarPartidas = { idAcciones: idAcciones, idSeg: df.idSeguimiento };

                    // Mostrar modal AQUÍ, después de asignar _pendienteCargarPartidas
                    $('#modalDatosFinales').one('shown.bs.modal', function () {
                        cargarPartidasFotosFinal(_pendienteCargarPartidas.idAcciones, _pendienteCargarPartidas.idSeg);
                        _pendienteCargarPartidas = null;
                    });
                    $('#modalDatosFinales').modal('show');

                } else {
                    // ══ MODO AGREGAR: primera vez, pre-cargar del último seguimiento tipo S ══
                    $('#hddAccionMovFinal').val('A');

                    $('#badgeModoFinal')
                        .removeClass('badge-warning').addClass('badge-success')
                        .html('<i class="fas fa-plus-circle mr-1"></i> Primer registro final — datos del último seguimiento pre-cargados');

                    $.get(baseUrl + 'GetUltimoSeguimientoF/' + idAcciones, function (seg) {
                        if (seg) {
                            // Solo Sección A se pre-carga del último seguimiento
                            $('#txtNoAgebFinal').val(seg.noAgeb);
                            $('#chkAmpliaFinal').prop('checked', seg.amplia);
                            $('#chkConstruccionFinal').prop('checked', seg.construccion);
                            $('#chkEquipamientoFinal').prop('checked', seg.equipamiento);
                            $('#chkMantenimientoFinal').prop('checked', seg.mantenimiento);
                            $('#chkRehabilitacionFinal').prop('checked', seg.rehabilitacion);
                            $('#txtAportacionFismdfFinal').val(parseFloat(seg.aportacionFismdf || 0).toFixed(2));
                            $('#txtOtraFuenteFederalFinal').val(parseFloat(seg.otraFuenteFederal || 0).toFixed(2));
                            $('#txtFuenteEstatalFinal').val(parseFloat(seg.fuenteEstatal || 0).toFixed(2));
                            $('#txtFuenteMunicipalFinal').val(parseFloat(seg.fuenteMunicipal || 0).toFixed(2));
                            $('#txtOtrosFinal').val(parseFloat(seg.otros || 0).toFixed(2));
                            $('#txtCostoTotalFinal').val(parseFloat(seg.costoTotal || 0).toFixed(2));
                        }
                    });
                    // Primera vez: abrir modal con idSeg=0 (solo muestra partidas sin fotos)
                    _pendienteCargarPartidas = { idAcciones: idAcciones, idSeg: 0 };

                    // Mostrar modal AQUÍ, después de asignar _pendienteCargarPartidas
                    $('#modalDatosFinales').one('shown.bs.modal', function () {
                        cargarPartidasFotosFinal(_pendienteCargarPartidas.idAcciones, _pendienteCargarPartidas.idSeg);
                        _pendienteCargarPartidas = null;
                    });
                    $('#modalDatosFinales').modal('show');
                }
            });
        });
    };

    var limpiarFormularioFinal = function () {
        // Sección A
        $('#txtNoAgebFinal').val('');
        $('#chkAmpliaFinal, #chkConstruccionFinal, #chkEquipamientoFinal,' +
            '#chkMantenimientoFinal, #chkRehabilitacionFinal').prop('checked', false);
        $('#txtAportacionFismdfFinal, #txtOtraFuenteFederalFinal, #txtFuenteEstatalFinal,' +
            '#txtFuenteMunicipalFinal, #txtOtrosFinal, #txtCostoTotalFinal').val('0.00');

        // Sección B
        $('#txtFechaVerificacionFinal, #txtPeriodoEjecucionInicioFinal,' +
            '#txtPeriodoEjecucionFinalFinal, #txtDescripcionNoCoincideFinal,' +
            '#txtCambiosCatalogoFinal, #txtNoCoincideRubroFinal,' +
            '#txtDescripcionTrabajosFinal').val('');
        $('#cboObraConcluidaFinal, #cboCoincidePlaneacionFinal, #cboCoincideRubroFinal').val('S');
        $('#cboCatalogoConceptosFinal').val('N');

        // Sección C: fotos
        for (var i = 1; i <= 6; i++) {
            $('#imgFoto' + i + 'Final').hide().attr('src', '');
            $('#placeholderFoto' + i + 'Final').show();
            $('#accionesFoto' + i + 'Final').hide();
            $('#fileFoto' + i + 'Final').val('');
            $('#hddRutaFoto' + i + 'Final').val('');
        }

        // Sección C: partidas con fotos finales
        limpiarPartidasFotosFinal();

        // Ocultos
        $('#hddAccionMovFinal').val('A');
        $('#hddIdSeguimientoFinal').val('');

        // Badge reset
        $('#badgeModoFinal')
            .removeClass('badge-warning').addClass('badge-success')
            .html('<i class="fas fa-plus-circle mr-1"></i> Primer registro final');
    };
    // Descargar foto final (reutiliza endpoint DescargarFoto)
    var descargarFotoFinal = function (numero) {
        var ruta = $('#hddRutaFoto' + numero + 'Final').val();
        if (!ruta) {
            Swal.fire('Aviso', 'No hay foto guardada en esta posición.', 'info');
            return;
        }
        var link = document.createElement('a');
        link.href = baseUrl + 'DescargarFoto?ruta=' + encodeURIComponent(ruta);
        link.download = '';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    // Eliminar foto final
    var eliminarFotoFinal = function (numero) {
        var idSeguimiento = $('#hddIdSeguimientoFinal').val();
        if (!idSeguimiento) {
            Swal.fire('Aviso', 'Guarda el registro primero antes de eliminar fotos.', 'info');
            return;
        }
        Swal.fire({
            title: '¿Eliminar foto ' + numero + '?',
            text: 'Esta acción no se puede deshacer.',
            icon: 'warning',
            showCancelButton: true,
            confirmButtonText: 'Sí, eliminar',
            cancelButtonText: 'Cancelar',
            confirmButtonColor: '#F64E60'
        }).then(function (result) {
            if (result.value) {
                $.ajax({
                    url: baseUrl + 'EliminarFotoFinal',
                    type: 'POST',
                    contentType: 'application/json',
                    data: JSON.stringify({ idSeguimiento: idSeguimiento, numeroFoto: numero }),
                    success: function () {
                        $('#imgFoto' + numero + 'Final').hide().attr('src', '');
                        $('#placeholderFoto' + numero + 'Final').show();
                        $('#accionesFoto' + numero + 'Final').hide();
                        $('#hddRutaFoto' + numero + 'Final').val('');
                        $('#fileFoto' + numero + 'Final').val('');
                        Swal.fire('Listo', 'Foto eliminada correctamente.', 'success');
                    },
                    error: function (xhr) {
                        Swal.fire('Error', 'No se pudo eliminar: ' + xhr.responseText, 'error');
                    }
                });
            }
        });
    };

    var guardarDatosFinales = function () {
        if (!$('#txtFechaVerificacionFinal').val()) {
            Swal.fire('Validación', 'La Fecha de Verificación es obligatoria', 'warning');
            return;
        }

        var formData = new FormData();
        formData.append('IdAcciones', $('#hddIdAccionFinal').val());
        formData.append('IdObraProyecto', $('#hddIdObraFinal').val());
        formData.append('AccionMov', $('#hddAccionMovFinal').val());
        // Sección A
        formData.append('NoAgeb', $('#txtNoAgebFinal').val());
        formData.append('Amplia', $('#chkAmpliaFinal').is(':checked'));
        formData.append('Construccion', $('#chkConstruccionFinal').is(':checked'));
        formData.append('Equipamiento', $('#chkEquipamientoFinal').is(':checked'));
        formData.append('Mantenimiento', $('#chkMantenimientoFinal').is(':checked'));
        formData.append('Rehabilitacion', $('#chkRehabilitacionFinal').is(':checked'));
        formData.append('AportacionFismdf', $('#txtAportacionFismdfFinal').val());
        formData.append('OtraFuenteFederal', $('#txtOtraFuenteFederalFinal').val());
        formData.append('FuenteEstatal', $('#txtFuenteEstatalFinal').val());
        formData.append('FuenteMunicipal', $('#txtFuenteMunicipalFinal').val());
        formData.append('Otros', $('#txtOtrosFinal').val());
        formData.append('CostoTotal', $('#txtCostoTotalFinal').val());
        // Sección B
        formData.append('FechaVerificacion', $('#txtFechaVerificacionFinal').val());
        formData.append('ObraConcluida', $('#cboObraConcluidaFinal').val() === 'S');
        formData.append('CoincidePlaneacion', $('#cboCoincidePlaneacionFinal').val() === 'S');
        formData.append('DescripcionNoCoincide', $('#txtDescripcionNoCoincideFinal').val());
        formData.append('PeriodoEjecucionInicio', $('#txtPeriodoEjecucionInicioFinal').val());
        formData.append('PeriodoEjecucionFinal', $('#txtPeriodoEjecucionFinalFinal').val());
        formData.append('CatalogoConcepto', $('#cboCatalogoConceptosFinal').val() === 'S');
        formData.append('CambiosCatalogoConceptos', $('#txtCambiosCatalogoFinal').val());
        formData.append('CoincidePlaneacionRubro', $('#cboCoincideRubroFinal').val() === 'S');
        formData.append('DescripcionNoCoincideRubro', $('#txtNoCoincideRubroFinal').val());
        formData.append('DescripcionTrabajosRealizados', $('#txtDescripcionTrabajosFinal').val());
        // Datos del encabezado
        formData.append('Localidad', $('#lblLocalidadFinal').text());
        formData.append('ClaveLocalidad', $('#lblClaveLocalidadFinal').text());
        formData.append('MetaUnidad', $('#lblMetaUnidadFinal').text());
        formData.append('MetaCantidad', $('#lblMetaCantidadFinal').text());
        formData.append('PeriodoInicioContrato', $('#lblPeriodoInicioFinal').text());
        formData.append('PeriodoFinContrato', $('#lblPeriodoFinFinal').text());
        formData.append('IdRubro', $('#hddIdRubroFinal').val());
        formData.append('Rubro', $('#hddRubroFinal').val());
        formData.append('IdSubrubro', $('#hddIdSubrubroFinal').val());
        formData.append('Subrubro', $('#hddSubrubroFinal').val());

        // Sección C: fotos de partidas se guardan por separado en guardarFotosPartidasFinal
        // (las fotos genéricas 1-6 quedaron sustituidas por partidas)

        $.ajax({
            url: baseUrl + 'GuardarDatosFinales',
            type: 'POST',
            data: formData,
            processData: false,
            contentType: false,
            success: function (response) {
                var finalizarGuardado = function (idSegFinal) {
                    // Guardar fotos de partidas (Sección C) y luego cerrar
                    guardarFotosPartidasFinal(idSegFinal, function () {
                        Swal.fire({
                            title: '¡Éxito!',
                            text: 'Datos finales guardados correctamente.',
                            icon: 'success',
                            timer: 1800,
                            showConfirmButton: false
                        }).then(function () {
                            $('#modalDatosFinales').modal('hide');
                        });
                    });
                };

                // Si fue alta, obtener el idseguimiento generado para fotos y eliminaciones
                if ($('#hddAccionMovFinal').val() === 'A') {
                    $.get(baseUrl + 'GetDatosFinales/' + $('#hddIdAccionFinal').val(), function (df) {
                        if (df && df.idSeguimiento) {
                            $('#hddIdSeguimientoFinal').val(df.idSeguimiento);
                            $('#hddAccionMovFinal').val('M');
                            finalizarGuardado(df.idSeguimiento);
                        } else {
                            finalizarGuardado(0);
                        }
                    }).fail(function () { finalizarGuardado(0); });
                } else {
                    finalizarGuardado(parseInt($('#hddIdSeguimientoFinal').val()) || 0);
                }
            },
            error: function (xhr) {
                Swal.fire('Error', 'Error al guardar: ' + xhr.responseText, 'error');
            }
        });
    };
    //======================================================================
    // ======================== FICHA FISM =================================
    //======================================================================
    var _idFichaTecnicaActual = 0; // guarda el id tras cargar datos existentes

    // ── Helper: recalcula totales y saldos de la tabla financiera ────────
    var recalcularFism = function () {
        var invProg   = parseFloat($('#txtInversionProgramadaFism').val())  || 0;
        var aportProg = parseFloat($('#txtAportacionProgramadaFism').val()) || 0;
        var otrosProg = parseFloat($('#txtotrosprogramada').val())          || 0;

        var invEjer   = parseFloat($('#txtInversionEjercidaFism').val())    || 0;
        var aportEjer = parseFloat($('#txtAportacionEjercidaFism').val())   || 0;
        var otrosEjer = parseFloat($('#txtotrosejercida').val())            || 0;

        var totProg = invProg + aportProg + otrosProg;
        var totEjer = invEjer + aportEjer + otrosEjer;

        $('#txttotalprogramada').val(totProg.toFixed(2));
        $('#txttotalejercida').val(totEjer.toFixed(2));

        // Saldo = Programado - Ejercido por fila
        var saldoF = invProg   - invEjer;
        var saldoA = aportProg - aportEjer;
        var saldoO = otrosProg - otrosEjer;
        var saldoT = totProg   - totEjer;

        $('#txtsaldofism').val(saldoF.toFixed(2));
        $('#txtaportacionfism').val(saldoA.toFixed(2));
        $('#txtotrossaldofism').val(saldoO.toFixed(2));
        $('#txttotalsaldo').val(saldoT.toFixed(2));
    };

    var abrirFichaFism = function (idAcciones) {
        limpiarFormularioFism();
        $('#hddIdAccionFism').val(idAcciones);
        _idFichaTecnicaActual = 0;

        // 1. Encabezado
        $.get(baseUrl + 'GetDatosEncabezadoFism/' + idAcciones, function (data) {
            $('#lblObraFism').text(data.nombreObra);
            $('#lblRubroFism').text(data.rubro);
            $('#lblSubclasificacionFism').text(data.subclasificacion || '');
            $('#lblModalidadFism').text(data.modalidad || '');
            $('#lblContratoFism').text(data.numContrato);
            $('#lblLocalidadFism').text(data.localidad);
            $('#lblMontoFism').text('$' + parseFloat(data.montoContratado || 0)
                .toLocaleString('es-MX', { minimumFractionDigits: 2 }));
            $('#lblFuenteFism').text(data.fuenteFinanciamiento);
            $('#lblPeriodoInicioFism').text(data.periodoInicio);
            $('#lblPeriodoFinFism').text(data.periodoFin);
            $('#lblClaveLocalidadFism').text(data.claveLocalidad);
            $('#lblProgramaFism').text(data.programa);
            $('#lblDescripcionObraFism').text(data.descripcionAccion);
            $('#hddIdObraFism').val(data.idObraProyecto);
            $('#hddIdProgramaFism').val(data.idPrograma);
        });

        // 2. Datos FISM existentes
        $.get(baseUrl + 'GetFichaFism/' + idAcciones, function (data) {
            if (data) {
                $('#hddAccionMovFism').val('M');
                _idFichaTecnicaActual = data.idFichaTecnica || 0;

                // Financiero
                $('#txtInversionProgramadaFism').val(parseFloat(data.inversionProgramadaFism  || 0).toFixed(2));
                $('#txtInversionEjercidaFism').val(parseFloat(data.inversionEjercidaFism      || 0).toFixed(2));
                $('#txtAportacionProgramadaFism').val(parseFloat(data.aportacionProgramadaFism|| 0).toFixed(2));
                $('#txtAportacionEjercidaFism').val(parseFloat(data.aportacionEjercidaFism    || 0).toFixed(2));
                $('#txtotrosprogramada').val(parseFloat(data.otrosprogramado                  || 0).toFixed(2));
                $('#txtotrosejercida').val(parseFloat(data.otrosejercida                      || 0).toFixed(2));
                // Los totales/saldo se recalculan tras asignar
                recalcularFism();

                // Dictamen, fechas
                $('#txtDictamenFism').val(data.dictamen);
                $('#txtFechaInicioProgramadaFism').val(data.programadoFechaInicial);
                $('#txtFechaFinalProgramadaFism').val(data.programadoFechaFinal);

                // Convenios
                $('#txtContratoImporteFism').val(parseFloat(data.convenioContratoImporte     || 0).toFixed(2));
                $('#txtContratoInicioFism').val(data.convenioContratoFechaInicio);
                $('#txtContratoFinFism').val(data.convenioContratoFechaFin);
                $('#txtDiferidoImporteFism').val(parseFloat(data.convenioDiferidoImporte     || 0).toFixed(2));
                $('#txtDiferidoInicioFism').val(data.convenioDiferidoFechaInicio);
                $('#txtDiferidoFinFism').val(data.convenioDiferidoFechaFin);
                $('#txtAmpliacionImporteFism').val(parseFloat(data.ampliacionPlazoImporte    || 0).toFixed(2));
                $('#txtAmpliacionInicioFism').val(data.ampliacionPlazoFechaInicio);
                $('#txtAmpliacionFinFism').val(data.ampliacionPlazoFechaFin);
                $('#txtObservacionesFism').val(data.observaciones);

                // Nuevos campos
                $('#txtoficioreg').val(data.oficioreg    || '');
                $('#txtnumobramun').val(data.numobramun  || '');
                $('#txtdescripcionobrafism').val(data.descripcionobrafism || '');
                $('#txtavancefisicofism').val(parseFloat(data.avancefisicofism    || 0).toFixed(0));
                $('#txtavancefinancierofism').val(parseFloat(data.avancefinancierofism || 0).toFixed(0));

                // Fotos georeferenciadas
                mostrarFotoGeoFism('inicio',     data.fotoinicio    || '', data.latitudinicio    || '', data.longitudinicio    || '');
                mostrarFotoGeoFism('intermedio', data.fotointermedio|| '', data.latitudintermedio|| '', data.longitudintermedio|| '');
                mostrarFotoGeoFism('final',      data.fotofinal     || '', data.latitudfinal     || '', data.longitudfinal     || '');
            } else {
                $('#hddAccionMovFism').val('A');
                _idFichaTecnicaActual = 0;
            }

            initDatepickersFism();
            $('#modalFichaFism').modal('show');
        });
    };

    // ── Muestra foto georeferenciada ──────────────────────────────────────
    var mostrarFotoGeoFism = function (etapa, ruta, lat, lon) {
        var cap = etapa.charAt(0).toUpperCase() + etapa.slice(1);
        var $img         = $('#imgFoto' + cap + 'Fism');
        var $acciones    = $('#accionesFoto' + cap + 'Fism');
        var $placeholder = $('#placeholderFoto' + cap + 'Fism');
        var $hdd         = $('#hddRutaFoto' + cap + 'Fism');

        if (etapa === 'final') {
            $acciones    = $('#accionesFotoFinalFismGeo');
        }

        if (ruta && ruta.trim() !== '') {
            $img.attr('src', baseUrl + 'DescargarFoto?ruta=' + encodeURIComponent(ruta)).show();
            $acciones.show();
            $placeholder.hide();
            $hdd.val(ruta);
        } else {
            $img.hide().attr('src', '');
            $acciones.hide();
            $placeholder.show();
            $hdd.val('');
        }

        // Coordenadas
        var etapaLow = etapa.toLowerCase();
        $('#txtlatitud'  + etapaLow).val(lat);
        $('#txtlongitud' + etapaLow).val(lon);
    };

    var initDatepickersFism = function () {
        var campos = [
            '#txtFechaInicioProgramadaFism', '#txtFechaFinalProgramadaFism',
            '#txtContratoInicioFism', '#txtContratoFinFism',
            '#txtDiferidoInicioFism', '#txtDiferidoFinFism',
            '#txtAmpliacionInicioFism', '#txtAmpliacionFinFism'
        ];
        $.each(campos, function (i, sel) {
            try { $(sel).datepicker('destroy'); } catch (e) { }
            $(sel).datepicker({
                format: 'dd/mm/yyyy',
                language: 'es',
                autoclose: true,
                todayHighlight: true
            });
        });
    };

    var limpiarFormularioFism = function () {
        // Financiero
        $('#txtInversionProgramadaFism, #txtInversionEjercidaFism').val('0.00');
        $('#txtAportacionProgramadaFism, #txtAportacionEjercidaFism').val('0.00');
        $('#txtotrosprogramada, #txtotrosejercida').val('0.00');
        $('#txttotalprogramada, #txttotalejercida').val('0.00');
        $('#txtsaldofism, #txtaportacionfism, #txtotrossaldofism, #txttotalsaldo').val('0.00');
        // Dictamen, descripción, avances
        $('#txtDictamenFism, #txtObservacionesFism, #txtdescripcionobrafism').val('');
        $('#txtavancefisicofism, #txtavancefinancierofism').val('0');
        // Oficios
        $('#txtoficioreg, #txtnumobramun').val('');
        // Fechas
        $('#txtFechaInicioProgramadaFism, #txtFechaFinalProgramadaFism').val('');
        $('#txtContratoImporteFism, #txtDiferidoImporteFism, #txtAmpliacionImporteFism').val('0.00');
        $('#txtContratoInicioFism, #txtContratoFinFism').val('');
        $('#txtDiferidoInicioFism, #txtDiferidoFinFism').val('');
        $('#txtAmpliacionInicioFism, #txtAmpliacionFinFism').val('');
        // Fotos georeferenciadas
        ['inicio', 'intermedio', 'final'].forEach(function (et) {
            mostrarFotoGeoFism(et, '', '', '');
            var cap = et.charAt(0).toUpperCase() + et.slice(1);
            $('#fileFoto' + cap + 'Fism').val('');
        });
        // Labels encabezado
        $('#lblObraFism, #lblRubroFism, #lblSubclasificacionFism, #lblModalidadFism').text('');
        $('#lblContratoFism, #lblLocalidadFism, #lblMontoFism, #lblFuenteFism').text('');
        $('#lblPeriodoInicioFism, #lblPeriodoFinFism, #lblClaveLocalidadFism').text('');
        $('#lblProgramaFism, #lblDescripcionObraFism').text('');
        $('#hddAccionMovFism').val('A');
        _idFichaTecnicaActual = 0;
    };

    var guardarFichaFism = function () {
        var formData = new FormData();

        // Encabezado
        formData.append('IdAcciones',    $('#hddIdAccionFism').val());
        formData.append('IdObraProyecto',  $('#hddIdObraFism').val());
        formData.append('AccionMov',     $('#hddAccionMovFism').val());
        formData.append('IdPrograma',    $('#hddIdProgramaFism').val());
        formData.append('Programa',      $('#lblProgramaFism').text());
        formData.append('Obra',          $('#lblObraFism').text());
        formData.append('Localidad',     $('#lblLocalidadFism').text());
        formData.append('ClaveLocalidad',  $('#lblClaveLocalidadFism').text());
        formData.append('DescripcionObra', $('#lblDescripcionObraFism').text());
        formData.append('Contrato',      $('#lblContratoFism').text());
        formData.append('PeriodoInicio', $('#lblPeriodoInicioFism').text());
        formData.append('PeriodoFin',    $('#lblPeriodoFinFism').text());

        // Financiero
        formData.append('InversionProgramadaFism',  $('#txtInversionProgramadaFism').val());
        formData.append('InversionEjercidaFism',    $('#txtInversionEjercidaFism').val());
        formData.append('AportacionProgramadaFism', $('#txtAportacionProgramadaFism').val());
        formData.append('AportacionEjercidaFism',   $('#txtAportacionEjercidaFism').val());
        formData.append('OtrosProgramado',          $('#txtotrosprogramada').val());
        formData.append('OtrosEjercida',            $('#txtotrosejercida').val());
        formData.append('TotalProgramado',          $('#txttotalprogramada').val());
        formData.append('TotalEjercida',            $('#txttotalejercida').val());
        formData.append('SaldoFism',                $('#txtsaldofism').val());
        formData.append('AportacionFism',           $('#txtaportacionfism').val());
        formData.append('OtrosSaldoFism',           $('#txtotrossaldofism').val());
        formData.append('TotalSaldo',               $('#txttotalsaldo').val());

        // Dictamen, fechas
        formData.append('Dictamen',                   $('#txtDictamenFism').val());
        formData.append('ProgramadoFechaInicial',     $('#txtFechaInicioProgramadaFism').val());
        formData.append('ProgramadoFechaFinal',       $('#txtFechaFinalProgramadaFism').val());
        formData.append('ConvenioContratoImporte',    $('#txtContratoImporteFism').val());
        formData.append('ConvenioContratoFechaInicio',  $('#txtContratoInicioFism').val());
        formData.append('ConvenioContratoFechaFin',   $('#txtContratoFinFism').val());
        formData.append('ConvenioDiferidoImporte',    $('#txtDiferidoImporteFism').val());
        formData.append('ConvenioDiferidoFechaInicio',  $('#txtDiferidoInicioFism').val());
        formData.append('ConvenioDiferidoFechaFin',   $('#txtDiferidoFinFism').val());
        formData.append('AmpliacionPlazoImporte',     $('#txtAmpliacionImporteFism').val());
        formData.append('AmpliacionPlazoFechaInicio', $('#txtAmpliacionInicioFism').val());
        formData.append('AmpliacionPlazoFechaFin',    $('#txtAmpliacionFinFism').val());
        formData.append('Observaciones',              $('#txtObservacionesFism').val());

        // Nuevos campos
        formData.append('Oficioreg',          $('#txtoficioreg').val());
        formData.append('Numobramun',         $('#txtnumobramun').val());
        formData.append('Descripcionobrafism',  $('#txtdescripcionobrafism').val());
        formData.append('Avancefisicofism',   $('#txtavancefisicofism').val());
        formData.append('Avancefinancierofism', $('#txtavancefinancierofism').val());

        // Coordenadas fotos
        formData.append('Latitudinicio',      $('#txtlatitudinicio').val());
        formData.append('Longitudinicio',     $('#txtlongitudinicio').val());
        formData.append('Latitudintermedio',  $('#txtlatitudintermedio').val());
        formData.append('Longitudintermedio', $('#txtlongitudintermedio').val());
        formData.append('Latitudfinal',       $('#txtlatitudfinal').val());
        formData.append('Longitudfinal',      $('#txtlongitudfinal').val());

        // Fotos (sólo si el usuario seleccionó archivo nuevo)
        var fI = $('#fileFotoInicioFism')[0].files[0];
        var fM = $('#fileFotoIntermedioFism')[0].files[0];
        var fF = $('#fileFotoFinalFism')[0].files[0];
        if (fI) formData.append('FotoInicio',    fI);
        if (fM) formData.append('FotoIntermedio', fM);
        if (fF) formData.append('FotoFinal',     fF);

        $.ajax({
            url: baseUrl + 'GuardarFichaFism',
            type: 'POST',
            data: formData,
            processData: false,
            contentType: false,
            success: function (response) {
                Swal.fire('Éxito', response.message || 'Ficha FISM guardada correctamente', 'success');
                $('#modalFichaFism').modal('hide');
            },
            error: function (xhr) {
                Swal.fire('Error', 'No se pudo guardar: ' + xhr.responseText, 'error');
            }
        });
    };

    // ── Eliminar foto georeferenciada FISM ────────────────────────────────
    var eliminarFotoGeoFism = function (etapa) {
        if (_idFichaTecnicaActual <= 0) {
            Swal.fire('Aviso', 'Guarda la ficha primero antes de eliminar fotos.', 'warning');
            return;
        }
        var mapCol = { inicio: 'imgfotoinicio', intermedio: 'imgfotointermedio', final: 'imgfotofinal' };
        var mapPath= { inicio: 'fotoinicio',    intermedio: 'fotointermedio',    final: 'fotofinal'    };

        Swal.fire({
            title: '¿Eliminar foto?', text: 'Esta acción no se puede deshacer.',
            icon: 'warning', showCancelButton: true,
            confirmButtonText: 'Sí, eliminar', cancelButtonText: 'Cancelar'
        }).then(function (result) {
            if (result.value) {
                $.ajax({
                    url: baseUrl + 'EliminarFotoFism',
                    type: 'POST', contentType: 'application/json',
                    data: JSON.stringify({
                        idFichaTecnica: _idFichaTecnicaActual,
                        columnaImg:  mapCol[etapa],
                        columnaPath: mapPath[etapa]
                    }),
                    success: function () {
                        Swal.fire('Eliminada', 'La foto fue eliminada.', 'success');
                        mostrarFotoGeoFism(etapa, '', '', '');
                    },
                    error: function (xhr) { Swal.fire('Error', xhr.responseText, 'error'); }
                });
            }
        });
    };

    // Alias para compatibilidad (los botones del modal llaman a eliminarFotoFism(numero) en algunos lugares)
    var eliminarFotoFism = eliminarFotoGeoFism;
    var descargarFotoFism = function (etapa) {
        var cap = etapa.charAt(0).toUpperCase() + etapa.slice(1);
        var ruta = $('#hddRutaFoto' + cap + 'Fism').val();
        if (!ruta) { Swal.fire('Aviso', 'No hay foto guardada.', 'info'); return; }
        var link = document.createElement('a');
        link.href = baseUrl + 'DescargarFoto?ruta=' + encodeURIComponent(ruta);
        link.download = '';
        document.body.appendChild(link); link.click(); document.body.removeChild(link);
    };

    //======================================================================
    // ======================== FINIQUITO ==================================
    //======================================================================
    var abrirFiniquito = function (idAcciones) {
        limpiarFormularioFiniquito();
        $('#hddIdAccionFiniquito').val(idAcciones);

        // Primero cargamos datos existentes del finiquito
        $.get(baseUrl + 'GetFiniquito/' + idAcciones, function (finiquito) {
            var tieneRegistro = finiquito !== null && finiquito !== undefined && finiquito.idFiniquito;

            // Cargar encabezado — siempre llena las etiquetas de solo lectura,
            // pero solo sobreescribe los inputs editables si NO existe registro guardado
            $.get(baseUrl + 'GetDatosEncabezadoFiniquito/' + idAcciones, function (enc) {
                $('#lblObraFiniquito').text(enc.nombreObra);
                $('#lblClaveMunicipalFiniquito').text('061');
                $('#lblMunicipioFiniquito').text(enc.localidad);
                $('#lblNumeroObraFiniquito').text(enc.numObra);
                $('#lblContratoFiniquito').text(enc.numContrato);
                $('#lblContratistaFiniquito').text(enc.contratista);
                $('#lblDescripcionObraFiniquito').text(enc.descripcionAccion);
                $('#lblPeriodoInicioFiniquito').text(enc.periodoInicio);
                $('#lblPeriodoFinFiniquito').text(enc.periodoFin);
                $('#lblFuenteFiniquito').text(enc.fuenteFinanciamiento);
                $('#lblMontoFuenteFiniquito').text('$' + parseFloat(enc.montoFuente || 0).toLocaleString('es-MX', { minimumFractionDigits: 2 }));
                $('#hddIdObraFiniquito').val(enc.idObraProyecto);

                if (!tieneRegistro) {
                    // Modo alta: pre-cargar inputs con datos del encabezado
                    $('#txtMontoFuenteFiniquito').val(enc.montoFuente);
                    $('#txtFechaProgramadaInicioFiniquito').val(enc.periodoInicio);
                    $('#txtDescripcionObraFiniquitoInput').val(enc.descripcionAccion);
                }
            });

            if (tieneRegistro) {
                // Modo modificación: cargar exactamente lo que se guardó
                $('#hddAccionMovFiniquito').val('M');
                $('#txtProgramaFiniquito').val(finiquito.programa);
                $('#txtSubprogramaFiniquito').val(finiquito.subprograma);
                $('#txtMontoFuenteFiniquito').val(finiquito.montoFuente);
                $('#txtPresupuestoDevengadoFiniquito').val(finiquito.devengado);
                $('#txtLatitudFiniquito').val(finiquito.latitud);
                $('#txtLongitudFiniquito').val(finiquito.longitud);
                $('#txtFechaProgramadaInicioFiniquito').val(finiquito.programadoInicio);
                $('#txtFechaRealFinFiniquito').val(finiquito.realTermino);
                $('#txtAvanceFinancieroFiniquito').val(finiquito.financiero);
                $('#txtDescripcionObraFiniquitoInput').val(finiquito.descripcionObra);
                $('#txtObservacionesFiniquito').val(finiquito.observaciones);
            } else {
                // Modo alta: pre-cargar coordenadas y fecha final de otros módulos
                $('#hddAccionMovFiniquito').val('A');
                $.get(baseUrl + 'GetDatosInicioParaFiniquito/' + idAcciones, function (inicio) {
                    if (inicio) {
                        $('#txtLatitudFiniquito').val(inicio.latitud);
                        $('#txtLongitudFiniquito').val(inicio.longitud);
                    }
                });
                $.get(baseUrl + 'GetDatosFinalParaFiniquito/' + idAcciones, function (final) {
                    if (final) {
                        $('#txtFechaRealFinFiniquito').val(final.periodoEjecucionFinal);
                    }
                });
            }
        });

        $('#modalFiniquito').modal('show');
    };

    var limpiarFormularioFiniquito = function () {
        $('#txtProgramaFiniquito, #txtSubprogramaFiniquito').val('');
        $('#txtMontoFuenteFiniquito, #txtPresupuestoDevengadoFiniquito, #txtAvanceFinancieroFiniquito').val('0.00');
        $('#txtLatitudFiniquito, #txtLongitudFiniquito').val('');
        $('#txtFechaProgramadaInicioFiniquito, #txtFechaRealFinFiniquito').val('');
        $('#txtDescripcionObraFiniquitoInput, #txtObservacionesFiniquito').val('');
        $('#hddAccionMovFiniquito').val('A');
    };

    var guardarFiniquito = function () {
        var data = {
            IdAcciones: $('#hddIdAccionFiniquito').val(),
            IdObraProyecto: $('#hddIdObraFiniquito').val(),
            AccionMov: $('#hddAccionMovFiniquito').val(),
            Municipio: $('#lblMunicipioFiniquito').text(),
            NumObra: $('#lblNumeroObraFiniquito').text(),
            Programa: $('#txtProgramaFiniquito').val(),
            Subprograma: $('#txtSubprogramaFiniquito').val(),
            FuenteFinanciamiento: $('#lblFuenteFiniquito').text(),
            MontoFuente: parseFloat($('#txtMontoFuenteFiniquito').val()) || 0,
            Devengado: parseFloat($('#txtPresupuestoDevengadoFiniquito').val()) || 0,
            Latitud: $('#txtLatitudFiniquito').val(),
            Longitud: $('#txtLongitudFiniquito').val(),
            ProgramadoInicio: $('#txtFechaProgramadaInicioFiniquito').val(),
            RealTermino: $('#txtFechaRealFinFiniquito').val(),
            Financiero: parseFloat($('#txtAvanceFinancieroFiniquito').val()) || 0,
            Contrato: $('#lblContratoFiniquito').text(),
            Contratista: $('#lblContratistaFiniquito').text(),
            DescripcionObra: $('#txtDescripcionObraFiniquitoInput').val(),
            Observaciones: $('#txtObservacionesFiniquito').val()
        };

        $.ajax({
            url: baseUrl + 'GuardarFiniquito',
            type: 'POST',
            contentType: 'application/json',
            data: JSON.stringify(data),
            success: function (response) {
                Swal.fire('Exito', 'Finiquito guardado correctamente', 'success');
                $('#modalFiniquito').modal('hide');
            },
            error: function (xhr) {
                Swal.fire('Error', 'Error al guardar: ' + xhr.responseText, 'error');
            }
        });
    };
    //======================================================================
    // ======================== ARCHIVO FINIQUITO ==========================
    //======================================================================
    var abrirArchivoFiniquito = function (idAcciones) {
        $('#hddIdAccionArchivoFini').val(idAcciones);
        $('#fileArchivoFiniquito').val('');
        $('#hddRutaArchivoFini').val('');
        $('#panelArchivoExistente').hide();
        $('#lblNombreArchivoFini').text('');
        $('#lblAccionArchivo').text('Seleccione el archivo:');

        // Verificar si ya existe archivo
        $.get(baseUrl + 'GetRutaArchivoFiniquito/' + idAcciones, function (data) {
            if (data && data.ruta) {
                $('#hddRutaArchivoFini').val(data.ruta);
                // Mostrar solo el nombre del archivo
                var nombreArchivo = data.ruta.split('/').pop();
                $('#lblNombreArchivoFini').text(nombreArchivo);
                $('#panelArchivoExistente').show();
                $('#lblAccionArchivo').text('Cambiar archivo:');
            }
        });

        $('#modalArchivoFiniquito').modal('show');
    };

    var guardarArchivoFiniquito = function () {
        var file = $('#fileArchivoFiniquito')[0].files[0];
        if (!file) {
            Swal.fire('Aviso', 'Seleccione un archivo primero.', 'warning');
            return;
        }

        var formData = new FormData();
        formData.append('IdAcciones', $('#hddIdAccionArchivoFini').val());
        formData.append('Archivo', file);

        $.ajax({
            url: baseUrl + 'SubirArchivoFiniquito',
            type: 'POST',
            data: formData,
            processData: false,
            contentType: false,
            success: function () {
                Swal.fire({
                    title: '¡Éxito!',
                    text: 'Archivo subido correctamente.',
                    icon: 'success',
                    timer: 1500,
                    showConfirmButton: false
                }).then(function () {
                    $('#modalArchivoFiniquito').modal('hide');
                    TablaCedulas.buscar();
                });
            },
            error: function (xhr) {
                Swal.fire('Error', 'Error al subir archivo: ' + xhr.responseText, 'error');
            }
        });
    };

    // Descargar archivo finiquito desde el grid
    var descargarFiniquito = function (ruta) {
        if (!ruta) return;
        window.location.href = baseUrl + 'DescargarArchivoFiniquito?ruta=' + encodeURIComponent(ruta);
    };

    // Descargar archivo desde el modal
    var descargarArchivoFiniquito = function () {
        var ruta = $('#hddRutaArchivoFini').val();
        if (!ruta) return;
        window.location.href = baseUrl + 'DescargarArchivoFiniquito?ruta=' + encodeURIComponent(ruta);
    };

    // Eliminar archivo finiquito
    var eliminarArchivoFiniquito = function () {
        var idAcciones = $('#hddIdAccionArchivoFini').val();
        Swal.fire({
            title: '¿Eliminar archivo?',
            text: 'Esta acción no se puede deshacer.',
            icon: 'warning',
            showCancelButton: true,
            confirmButtonText: 'Sí, eliminar',
            cancelButtonText: 'Cancelar',
            confirmButtonColor: '#F64E60'
        }).then(function (result) {
            if (result.value) {
                $.ajax({
                    url: baseUrl + 'EliminarArchivoFiniquito',
                    type: 'POST',
                    contentType: 'application/json',
                    data: JSON.stringify({ idAcciones: idAcciones }),
                    success: function () {
                        $('#panelArchivoExistente').hide();
                        $('#hddRutaArchivoFini').val('');
                        $('#lblNombreArchivoFini').text('');
                        $('#lblAccionArchivo').text('Seleccione el archivo:');
                        $('#fileArchivoFiniquito').val('');
                        TablaCedulas.buscar();
                        Swal.fire('Listo', 'Archivo eliminado correctamente.', 'success');
                    },
                    error: function (xhr) {
                        Swal.fire('Error', xhr.responseText, 'error');
                    }
                });
            }
        });
    };
    //======================================================================
    // ======================== IMPRESIONES ================================
    //======================================================================
    var imprimirInicio = function (idAcciones) {
        $.get(baseUrl + 'GetIdSeguimientoInicio/' + idAcciones, function (data) {
            if (data && data.idSeguimiento) {
                window.open(baseUrl + 'GenerarFichaInicio/' + idAcciones, '_blank');
            } else {
                Swal.fire('Aviso', 'Favor de complementar los datos de la cédula para imprimir.', 'warning');
            }
        });
    };
    //======================================================================
    // =======================BUSCADOR AUTOCOMPLETE=========================
    //======================================================================
    var crearAutocomplete = function (inputSelector, urlEndpoint, onSelect) {
        var $input = $(inputSelector);
        if ($input.length === 0) return;

        // Crear dropdown si no existe
        var dropdownId = inputSelector.replace('#', '') + '_dropdown';
        if ($('#' + dropdownId).length === 0) {
            $input.after('<ul id="' + dropdownId + '" style="'
                + 'display:none; position:absolute; z-index:9999; '
                + 'background:#fff; border:1px solid #ddd; border-radius:4px; '
                + 'max-height:220px; overflow-y:auto; width:' + $input.outerWidth() + 'px; '
                + 'box-shadow:0 4px 12px rgba(0,0,0,0.15); list-style:none; '
                + 'padding:0; margin:0;"></ul>');
        }
        var $dropdown = $('#' + dropdownId);

        // Actualizar ancho al redimensionar
        $(window).on('resize', function () {
            $dropdown.css('width', $input.outerWidth() + 'px');
        });

        var timer = null;

        $input.off('input.ac').on('input.ac', function () {
            var term = $(this).val();
            clearTimeout(timer);

            if (term.length < 1) {
                $dropdown.hide();
                return;
            }

            timer = setTimeout(function () {
                $.ajax({
                    url: urlEndpoint,
                    type: 'GET',
                    data: { term: term },
                    success: function (data) {
                        $dropdown.empty();

                        if (!data || data.length === 0) {
                            $dropdown.hide();
                            return;
                        }

                        $.each(data, function (i, item) {
                            var parts = item.split('|');
                            var label = parts[0];
                            var id = parts[1] || parts[0];

                            var $li = $('<li style="padding:8px 12px; cursor:pointer; '
                                + 'border-bottom:1px solid #f3f3f3; font-size:13px;">'
                                + label + '</li>');

                            $li.on('mouseenter', function () {
                                $(this).css('background', '#f0f4ff');
                            }).on('mouseleave', function () {
                                $(this).css('background', '#fff');
                            }).on('mousedown', function (e) {
                                e.preventDefault(); // evita que el blur cierre antes
                                onSelect(label, id, $input);
                                $dropdown.hide();
                            });

                            $dropdown.append($li);
                        });

                        $dropdown.show();
                    }
                });
            }, 300);
        });

        // Cerrar al perder foco
        $input.off('blur.ac').on('blur.ac', function () {
            setTimeout(function () { $dropdown.hide(); }, 200);
        });

        // Navegacion con teclado
        $input.off('keydown.ac').on('keydown.ac', function (e) {
            var $items = $dropdown.find('li');
            var $active = $dropdown.find('li.ac-active');

            if (e.key === 'ArrowDown') {
                e.preventDefault();
                if ($active.length === 0) {
                    $items.first().addClass('ac-active').css('background', '#f0f4ff');
                } else {
                    $active.removeClass('ac-active').css('background', '#fff');
                    var $next = $active.next();
                    if ($next.length) $next.addClass('ac-active').css('background', '#f0f4ff');
                }
            } else if (e.key === 'ArrowUp') {
                e.preventDefault();
                if ($active.length) {
                    $active.removeClass('ac-active').css('background', '#fff');
                    var $prev = $active.prev();
                    if ($prev.length) $prev.addClass('ac-active').css('background', '#f0f4ff');
                }
            } else if (e.key === 'Enter') {
                if ($active.length) {
                    e.preventDefault();
                    $active.trigger('mousedown');
                }
            } else if (e.key === 'Escape') {
                $dropdown.hide();
            }
        });
    };
    
    var initAutocomplete = function () {

        // ================= CONTRATO =================
        crearAutocomplete('#txtcontratobuscar', baseUrl + 'BuscarContrato',
            function (label, id, $input) {
                $input.val(label);
                $('#hddIdContrato').val(id);
            }
        );

        // ================= OBRA =================
        crearAutocomplete('#txtobrabuscar', baseUrl + 'BuscarObra',
            function (label, id, $input) {
                $input.val(label);
                $('#hddIdAccion').val(id);
            }
        );
    };

    var imprimirFinal = function (idAcciones) {
        $.get(baseUrl + 'GetIdSeguimientoFinal/' + idAcciones, function (data) {
            if (data && data.idSeguimiento) {
                var url = baseUrl + 'ReporteFinal/' + data.idSeguimiento;
                window.open(url, '_blank');
            } else {
                Swal.fire('Aviso', 'No existe registro final para imprimir.', 'warning');
            }
        });
    };


    var imprimirFichaFism = function (idAcciones) {
        var url = baseUrl + 'GenerarFichaFism/' + idAcciones;
        window.open(url, '_blank');
    };

    var exportarExcelFiniquito = function (idAcciones) {
        window.location.href = baseUrl + 'ExportarExcelFiniquito/' + idAcciones;
    };

    /**
     * Captura GPS para un slot de foto de Inicio.
     * @param {string} sufijo - 'Croquis', 'Foto1', 'Foto2', 'Foto3', 'Foto4'
     */
    var capturarGPSFotoInicio = function (sufijo) {
        if (!navigator.geolocation) {
            Swal.fire('Aviso', 'Tu navegador no soporta geolocalización.', 'warning');
            return;
        }
        Swal.fire({
            title: 'Obteniendo GPS...',
            text: 'Por favor espera.',
            allowOutsideClick: false,
            didOpen: function () { Swal.showLoading(); }
        });
        navigator.geolocation.getCurrentPosition(
            function (pos) {
                Swal.close();
                var lat = pos.coords.latitude.toFixed(6);
                var lon = pos.coords.longitude.toFixed(6);
                $('#txtLat' + sufijo + 'Inicio').val(lat);
                $('#txtLon' + sufijo + 'Inicio').val(lon);
                Swal.fire({ icon: 'success', title: 'Ubicación capturada', text: lat + ', ' + lon, timer: 2000, showConfirmButton: false });
            },
            function (err) {
                Swal.close();
                Swal.fire('Error GPS', 'No se pudo obtener la ubicación: ' + err.message, 'error');
            },
            { enableHighAccuracy: true, timeout: 15000 }
        );
    };

    //======================================================================
    // ========== PARTIDAS + FOTOS  SEGUIMIENTO ============================
    // Cada partida viene de TBLP_cedula_partidas (definida en inicio).
    // En seguimiento se agregan hasta 2 fotos por partida con lat/lon.
    // Las fotos se guardan en TBLP_cedula_partidas_fotos.
    //======================================================================
    var _partidasFotosSeg = [];
    // [{idPartida, orden, descripcion,
    //   foto1:{idFoto, ruta, desc, lat, lon, file},
    //   foto2:{idFoto, ruta, desc, lat, lon, file} }]

    var limpiarPartidasFotosSeg = function () {
        _partidasFotosSeg = [];
        $('#listaPartidasFotosSeg').empty();
        $('#sinPartidasFotosSeg').show();
    };

    var renderizarPartidasFotosSeg = function () {
        var $lista = $('#listaPartidasFotosSeg');
        $lista.empty();
        if (!_partidasFotosSeg || _partidasFotosSeg.length === 0) {
            $('#sinPartidasFotosSeg').show();
            return;
        }
        $('#sinPartidasFotosSeg').hide();

        $.each(_partidasFotosSeg, function (idx, p) {
            var num = idx + 1;
            var html = '<div class="card border mb-3 partida-foto-seg-item" data-idpartida="' + p.idPartida + '">'
                + '<div class="card-header py-2 px-3" style="background:#f3f6f9;">'
                + '<span class="font-weight-bold text-primary">'
                + '<i class="fas fa-layer-group mr-1"></i> Partida ' + num + '</span>'
                + '<span class="ml-2 text-dark">' + escapeHtmlSeg(p.descripcion) + '</span>'
                + '</div>'
                + '<div class="card-body p-3">'
                + '<div class="row">';

            // Foto 1 y Foto 2
            for (var nf = 1; nf <= 2; nf++) {
                var fKey = 'foto' + nf;
                var fData = p[fKey] || {};
                var tieneRuta = !!fData.ruta;
                // Convertir ruta ~/Uploads/... a /Uploads/... para el browser
                // La ruta guardada es "~/Uploads/Partidas/archivo.jpg"
                // El browser necesita "/Uploads/Partidas/archivo.jpg"
                var rutaWeb = rutaAUrl(fData.ruta);
                html += '<div class="col-md-6 mb-3">'
                    + '<div class="card border shadow-sm h-100">'
                    + '<div class="card-header py-2 px-3 bg-light d-flex justify-content-between align-items-center">'
                    + '<span class="font-weight-bold small">Foto ' + nf + '</span>'
                    + (tieneRuta
                        ? '<div>'
                        + '<button type="button" class="btn btn-xs btn-light-primary btn-descargar-foto-partida" data-idpartida="' + p.idPartida + '" data-nfoto="' + nf + '" data-ruta="' + escapeHtmlSeg(fData.ruta) + '" title="Descargar"><i class="fas fa-download fa-sm"></i></button>'
                        + '<button type="button" class="btn btn-xs btn-light-danger ml-1 btn-eliminar-foto-partida" data-idpartida="' + p.idPartida + '" data-nfoto="' + nf + '" title="Eliminar"><i class="fas fa-trash fa-sm"></i></button>'
                        + '</div>'
                        : '')
                    + '</div>'
                    + '<div class="card-body p-2 text-center bg-white">'
                    + '<img class="rounded img-foto-partida-seg" data-idpartida="' + p.idPartida + '" data-nfoto="' + nf + '" style="' + (tieneRuta ? '' : 'display:none;') + ' max-width:100%; max-height:160px; object-fit:cover;" src="' + rutaWeb + '">'
                    + '<div class="placeholder-foto-partida-seg text-muted py-3" data-idpartida="' + p.idPartida + '" data-nfoto="' + nf + '" style="' + (tieneRuta ? 'display:none;' : '') + '">'
                    + '<i class="fas fa-image fa-2x"></i><br><small>Sin foto</small></div>'
                    + '<input type="file" class="form-control form-control-sm mt-2 file-foto-partida-seg" accept="image/*" data-idpartida="' + p.idPartida + '" data-nfoto="' + nf + '">'
                    + '<input type="text" class="form-control form-control-sm mt-2 txt-obs-foto-partida-seg" placeholder="Descripción / observación" data-idpartida="' + p.idPartida + '" data-nfoto="' + nf + '" value="' + escapeHtmlSeg(fData.desc || '') + '">'
                    + '<div class="row mt-2">'
                    + '<div class="col-6"><input type="text" class="form-control form-control-sm txt-lat-foto-partida-seg" placeholder="Latitud" data-idpartida="' + p.idPartida + '" data-nfoto="' + nf + '" value="' + escapeHtmlSeg(fData.lat || '') + '"></div>'
                    + '<div class="col-6"><input type="text" class="form-control form-control-sm txt-lon-foto-partida-seg" placeholder="Longitud" data-idpartida="' + p.idPartida + '" data-nfoto="' + nf + '" value="' + escapeHtmlSeg(fData.lon || '') + '"></div>'
                    + '</div>'
                    + '</div>'  // card-body foto
                    + '</div>'  // card foto
                    + '</div>'; // col-md-6
            }

            html += '</div></div></div>'; // row / card-body partida / card partida
            $lista.append(html);
        });
    };

    var escapeHtmlSeg = function (text) {
        return $('<div>').text(text || '').html();
    };

    var initEventosPartidasFotosSeg = function () {
        // Preview al seleccionar archivo
        $('#listaPartidasFotosSeg').on('change', '.file-foto-partida-seg', function () {
            var $input = $(this);
            var idPartida = parseInt($input.data('idpartida'));
            var nFoto = parseInt($input.data('nfoto'));
            var file = this.files && this.files[0];
            if (!file) return;
            // Guardar referencia al file en _partidasFotosSeg
            var p = _partidasFotosSeg.find(function (x) { return x.idPartida === idPartida; });
            if (p) {
                var fKey = 'foto' + nFoto;
                p[fKey] = p[fKey] || {};
                p[fKey].file = file;
            }
            // Preview
            var reader = new FileReader();
            reader.onload = function (e) {
                var $cardBody = $input.closest('.card-body');
                $cardBody.find('.img-foto-partida-seg[data-idpartida="' + idPartida + '"][data-nfoto="' + nFoto + '"]').attr('src', e.target.result).show();
                $cardBody.find('.placeholder-foto-partida-seg[data-idpartida="' + idPartida + '"][data-nfoto="' + nFoto + '"]').hide();
            };
            reader.readAsDataURL(file);
        });

        // Descargar foto — usar ruta directa al archivo estático
        $('#listaPartidasFotosSeg').on('click', '.btn-descargar-foto-partida', function () {
            var ruta = $(this).data('ruta');
            if (!ruta) { Swal.fire('Aviso', 'No hay foto guardada.', 'info'); return; }
            var rutaWeb = rutaAUrl(ruta);
            var nombreArchivo = rutaWeb.split('/').pop() || 'foto.jpg';
            var link = document.createElement('a');
            link.href = rutaWeb;
            link.download = nombreArchivo;
            link.target = '_blank';
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
        });

        // Eliminar foto
        $('#listaPartidasFotosSeg').on('click', '.btn-eliminar-foto-partida', function () {
            var $btn = $(this);
            var idPartida = parseInt($btn.data('idpartida'));
            var nFoto = parseInt($btn.data('nfoto'));
            var idSeguimiento = parseInt($('#hddIdSeguimiento').val()) || 0;
            if (!idSeguimiento) { Swal.fire('Aviso', 'Guarda el seguimiento primero antes de eliminar fotos.', 'info'); return; }
            Swal.fire({
                title: '¿Eliminar foto ' + nFoto + '?',
                text: 'Esta acción no se puede deshacer.',
                icon: 'warning',
                showCancelButton: true,
                confirmButtonText: 'Sí, eliminar',
                cancelButtonText: 'Cancelar',
                confirmButtonColor: '#F64E60'
            }).then(function (res) {
                if (res.value) {
                    $.ajax({
                        url: baseUrl + 'EliminarFotoPartida',
                        type: 'POST',
                        contentType: 'application/json',
                        data: JSON.stringify({ idSeguimiento: idSeguimiento, idPartida: idPartida, numeroFoto: nFoto }),
                        success: function () {
                            var p = _partidasFotosSeg.find(function (x) { return x.idPartida === idPartida; });
                            if (p) {
                                var fKey = 'foto' + nFoto;
                                p[fKey] = { idFoto: 0, ruta: '', desc: '', lat: '', lon: '', file: null };
                            }
                            renderizarPartidasFotosSeg();
                            Swal.fire('Listo', 'Foto eliminada.', 'success');
                        },
                        error: function (xhr) { Swal.fire('Error', xhr.responseText, 'error'); }
                    });
                }
            });
        });
    };

    // Carga partidas de la acción y sus fotos ya guardadas para idSeguimiento
    var cargarPartidasFotosSeg = function (idAcciones, idSeguimiento) {
        limpiarPartidasFotosSeg();
        var url = baseUrl + 'GetPartidasConFotosSeg?idAcciones=' + idAcciones + '&idSeguimiento=' + (idSeguimiento || 0);
        console.log('[CEDUVER] cargarPartidasFotosSeg → URL:', url);
        $.ajax({
            url: url,
            type: 'GET',
            success: function (data) {
                console.log('[CEDUVER] GetPartidasConFotosSeg respuesta:', data);
                // Respuesta de diagnóstico (objeto con sinInicio=true)
                if (data && data.sinInicio) {
                    console.warn('[CEDUVER] GetPartidasConFotosSeg: sin inicio →', data.mensaje);
                    console.warn('[CEDUVER] Registros encontrados:', data.registros);
                    $('#sinPartidasFotosSeg').html(
                        '<i class="fas fa-exclamation-triangle fa-2x mb-2 d-block text-warning"></i>' +
                        '<small class="text-muted">No hay partidas registradas en el inicio de esta acción.</small>' +
                        '<br><small class="text-danger small" style="font-size:10px;">[Debug] ' + (data.mensaje || '') + '</small>'
                    ).show();
                    return;
                }
                if (data && data.length > 0) {
                    _partidasFotosSeg = data.map(function (p) {
                        return {
                            idPartida: p.idPartida,
                            orden: p.orden,
                            descripcion: p.descripcion,
                            foto1: {
                                idFoto: p.idFoto1 || 0,
                                ruta: p.rutaFoto1 || '',
                                desc: p.descFoto1 || '',
                                lat: p.latFoto1 || '',
                                lon: p.lonFoto1 || '',
                                file: null
                            },
                            foto2: {
                                idFoto: p.idFoto2 || 0,
                                ruta: p.rutaFoto2 || '',
                                desc: p.descFoto2 || '',
                                lat: p.latFoto2 || '',
                                lon: p.lonFoto2 || '',
                                file: null
                            }
                        };
                    });
                } else {
                    console.warn('[CEDUVER] GetPartidasConFotosSeg: sin partidas (lista vacía). Verifica que se hayan guardado partidas en el módulo de Inicio.');
                }
                renderizarPartidasFotosSeg();
            },
            error: function (xhr) {
                console.error('[CEDUVER] GetPartidasConFotosSeg error:', xhr.status, xhr.responseText);
                renderizarPartidasFotosSeg();
            }
        });
    };

    // Guarda las fotos nuevas de partidas para un seguimiento (llamado tras guardar seguimiento)
    var guardarFotosPartidas = function (idSeguimiento, callback) {
        // Recoger texto/coordenadas del DOM (pueden haber sido editados sin disparar 'change')
        $('#listaPartidasFotosSeg .partida-foto-seg-item').each(function () {
            var $item = $(this);
            var idPartida = parseInt($item.data('idpartida'));
            var p = _partidasFotosSeg.find(function (x) { return x.idPartida === idPartida; });
            if (!p) return;
            for (var nf = 1; nf <= 2; nf++) {
                var fKey = 'foto' + nf;
                p[fKey] = p[fKey] || {};
                p[fKey].desc = $item.find('.txt-obs-foto-partida-seg[data-nfoto="' + nf + '"]').val() || '';
                p[fKey].lat  = $item.find('.txt-lat-foto-partida-seg[data-nfoto="' + nf + '"]').val() || '';
                p[fKey].lon  = $item.find('.txt-lon-foto-partida-seg[data-nfoto="' + nf + '"]').val() || '';
            }
        });

        // Construir FormData con metadatos + archivos nuevos
        var fd = new FormData();
        fd.append('IdSeguimiento', idSeguimiento);
        var hayAlgo = false;
        $.each(_partidasFotosSeg, function (idx, p) {
            fd.append('Partidas[' + idx + '].IdPartida', p.idPartida);
            for (var nf = 1; nf <= 2; nf++) {
                var fKey = 'foto' + nf;
                var fData = p[fKey] || {};
                fd.append('Partidas[' + idx + '].Foto' + nf + 'Desc', fData.desc || '');
                fd.append('Partidas[' + idx + '].Foto' + nf + 'Lat',  fData.lat  || '');
                fd.append('Partidas[' + idx + '].Foto' + nf + 'Lon',  fData.lon  || '');
                if (fData.file) {
                    fd.append('Partidas[' + idx + '].ArchivoFoto' + nf, fData.file);
                    hayAlgo = true;
                } else if (fData.desc || fData.lat || fData.lon) {
                    hayAlgo = true;
                }
            }
        });

        // Siempre enviar si hay partidas cargadas (aunque no haya fotos/texto nuevos),
        // para garantizar que los metadatos queden registrados en BD.
        // El servidor hace upsert, por lo que reenviar datos existentes es seguro.
        if (!hayAlgo && _partidasFotosSeg.length === 0) {
            if (typeof callback === 'function') callback();
            return;
        }

        $.ajax({
            url: baseUrl + 'GuardarFotosPartidasSeg',
            type: 'POST',
            data: fd,
            processData: false,
            contentType: false,
            success: function () {
                if (typeof callback === 'function') callback();
            },
            error: function (xhr) {
                Swal.fire('Advertencia', 'El seguimiento se guardó pero ocurrió un error al subir las fotos: ' + xhr.responseText, 'warning');
                if (typeof callback === 'function') callback();
            }
        });
    };

    //======================================================================
    // ========== PARTIDAS FOTOS — DATOS FINALES (Sección C) ==============
    //======================================================================
    var _partidasFotosFinal = [];

    var limpiarPartidasFotosFinal = function () {
        _partidasFotosFinal = [];
        $('#listaPartidasFotosFinal').empty();
        $('#sinPartidasFotosFinal').html(
            '<i class="fas fa-layer-group fa-2x mb-2 d-block"></i><small>Cargando partidas...</small>'
        ).show();
    };

    var renderizarPartidasFotosFinal = function () {
        console.log('[CEDUVER-FINAL] renderizarPartidasFotosFinal llamado. _partidasFotosFinal.length:', _partidasFotosFinal ? _partidasFotosFinal.length : 'null');
        var $lista = $('#listaPartidasFotosFinal');
        console.log('[CEDUVER-FINAL] #listaPartidasFotosFinal existe en DOM:', $lista.length, '| visible:', $lista.is(':visible'), '| modal abierto:', $('#modalDatosFinales').hasClass('show'));
        $lista.empty();
        if (!_partidasFotosFinal || _partidasFotosFinal.length === 0) {
            $('#sinPartidasFotosFinal').html(
                '<i class="fas fa-layer-group fa-2x mb-2 d-block"></i>' +
                '<small>No hay partidas registradas en el inicio de esta acción.</small>'
            ).show();
            return;
        }
        $('#sinPartidasFotosFinal').hide();

        $.each(_partidasFotosFinal, function (idx, p) {
            var num = idx + 1;
            var html = '<div class="card border mb-3 partida-foto-final-item" data-idpartida="' + p.idPartida + '">'
                + '<div class="card-header py-2 px-3" style="background:#fff8e8;">'
                + '<span class="font-weight-bold text-warning">'
                + '<i class="fas fa-layer-group mr-1"></i> Partida ' + num + '</span>'
                + '<span class="ml-2 text-dark">' + escapeHtmlSeg(p.descripcion) + '</span>'
                + '</div>'
                + '<div class="card-body p-3">'
                + '<div class="row">';

            for (var nf = 1; nf <= 2; nf++) {
                var fKey = 'foto' + nf;
                var fData = p[fKey] || {};
                var tieneRuta = !!fData.ruta;
                var rutaWeb = rutaAUrl(fData.ruta);
                html += '<div class="col-md-6 mb-3">'
                    + '<div class="card border shadow-sm h-100">'
                    + '<div class="card-header py-2 px-3 bg-light d-flex justify-content-between align-items-center">'
                    + '<span class="font-weight-bold small">Foto ' + nf + '</span>'
                    + (tieneRuta
                        ? '<div>'
                        + '<button type="button" class="btn btn-xs btn-light-danger ml-1 btn-eliminar-foto-partida-final" data-idpartida="' + p.idPartida + '" data-nfoto="' + nf + '" title="Eliminar"><i class="fas fa-trash fa-sm"></i></button>'
                        + '</div>'
                        : '')
                    + '</div>'
                    + '<div class="card-body p-2 text-center bg-white">'
                    + '<img class="rounded img-foto-partida-final" data-idpartida="' + p.idPartida + '" data-nfoto="' + nf + '" style="' + (tieneRuta ? '' : 'display:none;') + ' max-width:100%; max-height:160px; object-fit:cover;" src="' + rutaWeb + '">'
                    + '<div class="placeholder-foto-partida-final text-muted py-3" data-idpartida="' + p.idPartida + '" data-nfoto="' + nf + '" style="' + (tieneRuta ? 'display:none;' : '') + '">'
                    + '<i class="fas fa-image fa-2x"></i><br><small>Sin foto</small></div>'
                    + '<input type="file" class="form-control form-control-sm mt-2 file-foto-partida-final" accept="image/*" data-idpartida="' + p.idPartida + '" data-nfoto="' + nf + '">'
                    + '<input type="text" class="form-control form-control-sm mt-2 txt-obs-foto-partida-final" placeholder="Descripci&oacute;n / observaci&oacute;n" data-idpartida="' + p.idPartida + '" data-nfoto="' + nf + '" value="' + escapeHtmlSeg(fData.desc || '') + '">'
                    + '<div class="row mt-2">'
                    + '<div class="col-6"><input type="text" class="form-control form-control-sm txt-lat-foto-partida-final" placeholder="Latitud" data-idpartida="' + p.idPartida + '" data-nfoto="' + nf + '" value="' + escapeHtmlSeg(fData.lat || '') + '"></div>'
                    + '<div class="col-6"><input type="text" class="form-control form-control-sm txt-lon-foto-partida-final" placeholder="Longitud" data-idpartida="' + p.idPartida + '" data-nfoto="' + nf + '" value="' + escapeHtmlSeg(fData.lon || '') + '"></div>'
                    + '</div>'
                    + '</div>'
                    + '</div>'
                    + '</div>';
            }
            html += '</div></div></div>';
            $lista.append(html);
        });
    };

    var cargarPartidasFotosFinal = function (idAcciones, idSegFinal) {
        limpiarPartidasFotosFinal();
        idSegFinal = parseInt(idSegFinal) || 0;
        var url = baseUrl + 'GetPartidasConFotosSeg?idAcciones=' + idAcciones + '&idSeguimiento=' + idSegFinal;
        console.log('[CEDUVER-FINAL] cargarPartidasFotosFinal → URL:', url);
        $.ajax({
            url: url,
            type: 'GET',
            success: function (data) {
                console.log('[CEDUVER-FINAL] GetPartidasConFotosSeg respuesta:', JSON.stringify(data));
                if (data && data.sinInicio) {
                    console.warn('[CEDUVER-FINAL] sinInicio:', data.mensaje, data.registros);
                    $('#sinPartidasFotosFinal').html(
                        '<i class="fas fa-exclamation-triangle fa-2x mb-2 d-block text-warning"></i>' +
                        '<small class="text-muted">No hay partidas registradas en el inicio de esta acci&oacute;n.</small>' +
                        '<br><small class="text-danger" style="font-size:10px;">[Debug] ' + (data.mensaje||'') + '</small>'
                    ).show();
                    return;
                }
                if (data && data.length > 0) {
                    console.log('[CEDUVER-FINAL] Partidas recibidas:', data.length);
                    _partidasFotosFinal = data.map(function (p) {
                        return {
                            idPartida: p.idPartida,
                            orden: p.orden,
                            descripcion: p.descripcion,
                            foto1: { idFoto: p.idFoto1||0, ruta: p.rutaFoto1||'', desc: p.descFoto1||'', lat: p.latFoto1||'', lon: p.lonFoto1||'', file: null },
                            foto2: { idFoto: p.idFoto2||0, ruta: p.rutaFoto2||'', desc: p.descFoto2||'', lat: p.latFoto2||'', lon: p.lonFoto2||'', file: null }
                        };
                    });
                } else {
                    console.warn('[CEDUVER-FINAL] Respuesta vacía o sin partidas. data:', data);
                }
                renderizarPartidasFotosFinal();
            },
            error: function (xhr) {
                console.error('[CEDUVER-FINAL] Error:', xhr.status, xhr.responseText);
                renderizarPartidasFotosFinal();
            }
        });
    };

    var initEventosPartidasFotosFinal = function () {
        // Preview al seleccionar archivo
        $('#listaPartidasFotosFinal').on('change', '.file-foto-partida-final', function () {
            var $input = $(this);
            var idPartida = parseInt($input.data('idpartida'));
            var nfoto = parseInt($input.data('nfoto'));
            var file = $input[0].files[0];
            if (!file) return;
            var p = _partidasFotosFinal.find(function (x) { return x.idPartida === idPartida; });
            if (!p) return;
            p['foto' + nfoto].file = file;
            var reader = new FileReader();
            reader.onload = function (e) {
                $input.closest('.card-body')
                    .find('.img-foto-partida-final[data-nfoto="' + nfoto + '"]').attr('src', e.target.result).show();
                $input.closest('.card-body')
                    .find('.placeholder-foto-partida-final[data-nfoto="' + nfoto + '"]').hide();
            };
            reader.readAsDataURL(file);
        });

        // Eliminar foto
        $('#listaPartidasFotosFinal').on('click', '.btn-eliminar-foto-partida-final', function () {
            var idPartida = parseInt($(this).data('idpartida'));
            var nfoto = parseInt($(this).data('nfoto'));
            var idSegFinal = parseInt($('#hddIdSeguimientoFinal').val()) || 0;
            if (!idSegFinal) { Swal.fire('Aviso', 'Guarda primero los datos finales para poder eliminar fotos.', 'info'); return; }
            var p = _partidasFotosFinal.find(function (x) { return x.idPartida === idPartida; });
            var idFoto = p ? (p['foto' + nfoto] || {}).idFoto : 0;
            if (!idFoto) return;
            Swal.fire({ title: '¿Eliminar foto?', icon: 'warning', showCancelButton: true, confirmButtonText: 'Sí, eliminar' }).then(function (r) {
                if (!r.isConfirmed) return;
                $.post(baseUrl + 'EliminarFotoPartidaSeg', { IdFoto: idFoto }, function () {
                    if (p) { p['foto' + nfoto] = { idFoto: 0, ruta: '', desc: '', lat: '', lon: '', file: null }; }
                    renderizarPartidasFotosFinal();
                }).fail(function (xhr) { Swal.fire('Error', xhr.responseText, 'error'); });
            });
        });
    };

    var guardarFotosPartidasFinal = function (idSeguimiento, callback) {
        // Leer valores actuales del DOM
        $('#listaPartidasFotosFinal .partida-foto-final-item').each(function () {
            var $item = $(this);
            var idPartida = parseInt($item.data('idpartida'));
            var p = _partidasFotosFinal.find(function (x) { return x.idPartida === idPartida; });
            if (!p) return;
            for (var nf = 1; nf <= 2; nf++) {
                var fKey = 'foto' + nf;
                p[fKey] = p[fKey] || {};
                p[fKey].desc = $item.find('.txt-obs-foto-partida-final[data-nfoto="' + nf + '"]').val() || '';
                p[fKey].lat  = $item.find('.txt-lat-foto-partida-final[data-nfoto="' + nf + '"]').val() || '';
                p[fKey].lon  = $item.find('.txt-lon-foto-partida-final[data-nfoto="' + nf + '"]').val() || '';
            }
        });

        var fd = new FormData();
        fd.append('IdSeguimiento', idSeguimiento);
        var hayAlgo = false;
        $.each(_partidasFotosFinal, function (idx, p) {
            fd.append('Partidas[' + idx + '].IdPartida', p.idPartida);
            for (var nf = 1; nf <= 2; nf++) {
                var fKey = 'foto' + nf;
                var fData = p[fKey] || {};
                fd.append('Partidas[' + idx + '].Foto' + nf + 'Desc', fData.desc || '');
                fd.append('Partidas[' + idx + '].Foto' + nf + 'Lat',  fData.lat  || '');
                fd.append('Partidas[' + idx + '].Foto' + nf + 'Lon',  fData.lon  || '');
                if (fData.file) {
                    fd.append('Partidas[' + idx + '].ArchivoFoto' + nf, fData.file);
                    hayAlgo = true;
                } else if (fData.desc || fData.lat || fData.lon) {
                    hayAlgo = true;
                }
            }
        });

        // Siempre enviar si hay partidas cargadas (aunque no haya fotos/texto nuevos),
        // para garantizar que los metadatos queden registrados en BD.
        // El servidor hace upsert, por lo que reenviar datos existentes es seguro.
        if (!hayAlgo && _partidasFotosFinal.length === 0) {
            if (typeof callback === 'function') callback();
            return;
        }

        $.ajax({
            url: baseUrl + 'GuardarFotosPartidasSeg',   // mismo endpoint, tabla por idseguimiento
            type: 'POST',
            data: fd,
            processData: false,
            contentType: false,
            success: function () { if (typeof callback === 'function') callback(); },
            error: function (xhr) {
                Swal.fire('Advertencia', 'Los datos finales se guardaron pero ocurri&oacute; un error al subir las fotos: ' + xhr.responseText, 'warning');
                if (typeof callback === 'function') callback();
            }
        });
    };

    //======================================================================
    // ==================== PARTIDAS INICIO ================================
    //======================================================================
    var _partidasInicio = [];   // [{id, descripcion}]
    var _partidasContador = 0;

    var renderizarPartidas = function () {
        var lista = $('#listaPartidasInicio');
        var sinMsg = $('#sinPartidasInicio');
        lista.empty();
        if (_partidasInicio.length === 0) {
            sinMsg.show();
            return;
        }
        sinMsg.hide();
        $.each(_partidasInicio, function (idx, p) {
            var num = idx + 1;
            var html = '<div class="card border mb-2 partida-item" data-id="' + p.id + '">' +
                '<div class="card-header py-2 px-3 d-flex justify-content-between align-items-center" style="background:#fdf0f0;">' +
                    '<span class="font-weight-bold text-danger"><i class="fas fa-layer-group mr-1"></i>Partida ' + num + '</span>' +
                    '<button type="button" class="btn btn-xs btn-light-danger btn-eliminar-partida" data-id="' + p.id + '" title="Eliminar partida">' +
                        '<i class="fas fa-trash fa-sm"></i>' +
                    '</button>' +
                '</div>' +
                '<div class="card-body py-2 px-3">' +
                    '<textarea class="form-control form-control-sm partida-desc" data-id="' + p.id + '" rows="2" ' +
                        'placeholder="Descripción de la partida (ej: 2,545.29 M2 DE DEMOLICIÓN DE PISO DE CONCRETO...)">' +
                        escapeHtml(p.descripcion) +
                    '</textarea>' +
                '</div>' +
            '</div>';
            lista.append(html);
        });
    };

    var escapeHtml = function(text) {
        return $('<div>').text(text || '').html();
    };

    var initEventosPartidas = function () {
        $('#btnAgregarPartidaInicio').on('click', function () {
            _partidasContador++;
            _partidasInicio.push({ id: _partidasContador, descripcion: '' });
            renderizarPartidas();
            // Focus en el nuevo textarea
            $('#listaPartidasInicio .partida-item:last textarea').focus();
        });

        // Delegación: eliminar partida
        $('#listaPartidasInicio').on('click', '.btn-eliminar-partida', function () {
            var id = parseInt($(this).data('id'));
            _partidasInicio = _partidasInicio.filter(function (p) { return p.id !== id; });
            renderizarPartidas();
        });

        // Delegación: sincronizar texto al escribir
        $('#listaPartidasInicio').on('input', '.partida-desc', function () {
            var id = parseInt($(this).data('id'));
            var p = _partidasInicio.find(function (x) { return x.id === id; });
            if (p) p.descripcion = $(this).val();
        });
    };

    var limpiarPartidas = function () {
        _partidasInicio = [];
        _partidasContador = 0;
        renderizarPartidas();
    };

    var cargarPartidas = function (idSeguimiento) {
        limpiarPartidas();
        if (!idSeguimiento) return;
        $.ajax({
            url: baseUrl + 'GetPartidasInicio/' + idSeguimiento,
            type: 'GET',
            success: function (data) {
                if (data && data.length) {
                    $.each(data, function (i, p) {
                        _partidasContador++;
                        _partidasInicio.push({ id: _partidasContador, descripcion: p.descripcion || '' });
                    });
                    renderizarPartidas();
                }
            },
            error: function () { /* tabla aún no existe, ignorar */ }
        });
    };

    var guardarPartidas = function (idSeguimiento, callback) {
        // Sincroniza textos actuales desde DOM antes de guardar
        $('#listaPartidasInicio .partida-desc').each(function () {
            var id = parseInt($(this).data('id'));
            var p = _partidasInicio.find(function (x) { return x.id === id; });
            if (p) p.descripcion = $(this).val();
        });

        var partidas = _partidasInicio.map(function (p, idx) {
            return { orden: idx + 1, descripcion: p.descripcion };
        });

        $.ajax({
            url: baseUrl + 'GuardarPartidasInicio',
            type: 'POST',
            contentType: 'application/json',
            data: JSON.stringify({ idSeguimiento: idSeguimiento, partidas: partidas }),
            success: function () { if (callback) callback(); },
            error: function () { if (callback) callback(); }
        });
    };

    //======================================================================
    // ======================== RETURN =====================================
    //======================================================================
    return {
        init: function () {
            //initDatatable();
            initSelectPickers();
            initDatepickers();
            initFileInputs();
            //cargarCatalogos();
            initEventos();
            initAutocomplete(); // 👈 🔥 ESTA LÍNEA ES CLAVE
            // 🔥 AGREGA ESTA LÍNEA
            initEventosFotos();
            // ✅ INICIALIZA EVENTOS SEGUIMIENTO
            initEventosSeguimiento();
            initEventosPartidasFotosSeg();
            initEventosPartidasFotosFinal();
            initEventosPartidas();
            TablaCedulas.init();

            // Auto-cálculo tabla financiera FISM (delegado para funcionar tras modal show)
            $(document).on('change blur', '#modalFichaFism .fism-calc', function () {
                recalcularFism();
            });
        },
        // Funciones publicas
        //******GEOREFERENCIA **********/
        abrirFotosGeoreferencia: abrirFotosGeoreferencia,
        eliminarFoto: eliminarFoto,
        descargarFoto: descargarFoto,

        abrirDatosInicio: abrirDatosInicio,
        abrirSeguimiento: abrirSeguimiento,
        modificarSeguimiento: modificarSeguimiento,
        eliminarSeguimiento: eliminarSeguimiento,
        descargarFotoInicio: descargarFotoInicio,
        eliminarFotoInicio: eliminarFotoInicio,
        capturarGPSFotoInicio: capturarGPSFotoInicio,
        descargarFotoSeg: descargarFotoSeg,
        eliminarFotoSeg: eliminarFotoSeg,

        abrirDatosFinales: abrirDatosFinales,
        descargarFotoFinal: descargarFotoFinal,
        eliminarFotoFinal: eliminarFotoFinal,

        abrirFichaFism: abrirFichaFism,
        guardarFichaFism: guardarFichaFism,
        descargarFotoFism: descargarFotoFism,
        eliminarFotoFism: eliminarFotoFism,
        eliminarFotoGeoFism: eliminarFotoGeoFism,

        abrirFiniquito: abrirFiniquito,
        abrirArchivoFiniquito: abrirArchivoFiniquito,
        descargarFiniquito: descargarFiniquito,

        descargarArchivoFiniquito: descargarArchivoFiniquito,
        eliminarArchivoFiniquito: eliminarArchivoFiniquito,

        imprimirInicio: imprimirInicio,
        imprimirFinal: imprimirFinal,
        imprimirSeguimiento: imprimirSeguimiento,
        imprimirFichaFism: imprimirFichaFism,
        exportarExcelFiniquito: exportarExcelFiniquito
    };
}();
//======================================================================
// ============== UTILIDADES ===========================================
//======================================================================
const CedulaUtils = {
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
var CedulaClock = {
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
            this.dateElement.textContent = CedulaUtils.formatDate(now);
        }
        if (this.timeElement) {
            this.timeElement.textContent = CedulaUtils.formatTime(now);
        }
    }
};
// Inicializar cuando el documento este listo
jQuery(document).ready(function () {
    CedulaModule.init();
    CedulaClock.init();
});
"use strict";

var CedulaModule = function () {
    //var datatable;
    var datatableSeguimiento;
    var baseUrl = 'api/Cedula/';
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

        $.get(baseUrl + 'GetFotosGeoreferencia/' + idAcciones, function (data) {

            let html = '';

            if (data && data.length > 0) {

                $.each(data, function (i, foto) {

                    html += `
                    <div class="col-md-3 mb-3 text-center">
                        <small>#${foto.idFoto}</small>
                        <img src="${foto.ruta}" 
                             class="img-fluid border mb-2" 
                             style="max-height:150px; cursor:pointer"
                             onclick="window.open('${foto.ruta}','_blank')">
                        <small>${foto.fechaAlta}</small>
                        <div>
                            <button type="button" class="btn btn-sm btn-success"
                                onclick="CedulaModule.descargarFoto('${foto.ruta}',event)">
                                <i class="fas fa-download"></i>
                            </button>

                            <button type="button" class="btn btn-sm btn-danger"
                                onclick="CedulaModule.eliminarFoto(${foto.idFoto})">
                                <i class="fas fa-trash"></i>
                            </button>
                        </div>

                    </div>
                    `;
                });

            } else {
                html = `<div class="col-12 text-center text-muted">No hay fotos</div>`;
            }

            $('#containerFotosGeo').html(html);
        });
    };

    // ======================== SUBIR FOTO ========================
    var subirFoto = function () {

        var fileInput = $('#fileFotoGeo')[0];

        if (fileInput.files.length === 0) {
            Swal.fire('Aviso', 'Selecciona una imagen', 'warning');
            return;
        }

        var formData = new FormData();
        formData.append("file", fileInput.files[0]);
        formData.append("idAcciones", currentIdAcciones);
        formData.append("idObra", currentIdObra);        // 🔥 IMPORTANTE
        formData.append("contrato", currentContrato);    // 🔥 IMPORTANTE

        $.ajax({
            url: baseUrl + 'SubirFotoGeoreferencia',
            type: 'POST',
            data: formData,
            contentType: false,
            processData: false,
            success: function () {

                Swal.fire('Éxito', 'Foto subida correctamente', 'success');

                cargarFotos(currentIdAcciones);

                $('#fileFotoGeo').val('');
            },
            error: function () {
                Swal.fire('Error', 'No se pudo subir la foto', 'error');
            }
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
    };


    //======================================================================
    // ======================== DATOS INICIO ===============================
    //======================================================================
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
                // Mostrar fotos existentes con botones descargar/eliminar
                var fotosInicio = {
                    'croquis': data.croquis,
                    '1': data.foto1,
                    '2': data.foto2,
                    '3': data.foto3,
                    '4': data.foto4
                };
                $.each(fotosInicio, function (key, ruta) {
                    if (ruta) {
                        var sufijo = key === 'croquis' ? 'Croquis' : 'Foto' + key;
                        $('#img' + sufijo + 'Inicio').attr('src', ruta).show();
                        $('#placeholder' + sufijo + 'Inicio').hide();
                        $('#acciones' + sufijo + 'Inicio').show();
                        $('#hddRuta' + sufijo + 'Inicio').val(ruta);
                    }
                });
            } else {
                $('#hddAccionMovInicio').val('A');
            }
        });

        $('#modalDatosInicio').modal('show');
    };

    var limpiarFormularioInicio = function () {
        $('#txtNoAgebInicio, #txtFechaVerificacionInicio, #txtDescripcionNoCoincideInicio').val('');
        $('#txtDescripcionNoCoincideRubroInicio, #txtLatitudInicio, #txtLongitudInicio').val('');
        $('#txtDireccionInicio, #txtReferenciaInicio').val('');
        $('#txtAportacionFismdfInicio, #txtOtraFuenteFederalInicio, #txtFuenteEstatalInicio').val('0.00');
        $('#txtFuenteMunicipalInicio, #txtOtrosInicio, #txtCostoTotalInicio').val('0.00');
        $('#chkAmpliaInicio, #chkConstruccionInicio, #chkEquipamientoInicio,\
          #chkMantenimientoInicio, #chkRehabilitacionInicio').prop('checked', false);
        $('#chkDirectaInicio, #chkComplementariaInicio, #chkZonaPrioritariaInicio,\
          #chkRezagoAltoInicio, #chkPobrezaExtremaInicio').prop('checked', false);
        $('#cboCoincidePlaneacionInicio').val('true');
        $('#cboCoincidePlaneacionRubroInicio').val('true');

        // Limpiar fotos y placeholders
        var sufijos = ['Croquis', 'Foto1', 'Foto2', 'Foto3', 'Foto4'];
        $.each(sufijos, function (i, s) {
            $('#img' + s + 'Inicio').hide().attr('src', '');
            $('#placeholder' + s + 'Inicio').show();
            $('#acciones' + s + 'Inicio').hide();
            $('#file' + s + 'Inicio').val('');
            $('#hddRuta' + s + 'Inicio').val('');
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

        if (!$('#txtFechaVerificacionInicio').val()) {
            Swal.fire('Validación', 'La fecha es obligatoria', 'warning');
            return;
        }
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
                    Swal.fire('Éxito', 'Datos guardados correctamente', 'success');
                    $('#modalDatosInicio').modal('hide');
                } else {
                    Swal.fire('Error', 'No se pudo guardar correctamente', 'error');
                }
            },
            error: function (xhr) {
                console.error(xhr);
                Swal.fire('Error', xhr.responseText || 'Error en el servidor', 'error');
            }
        });
        
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
            // MODO AGREGAR: pre-cargar Seccion 1 del ultimo registro (sin fotos)
            $('#hddAccionMovSeg').val('A');
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
                    // Seccion 3
                    $('#txtObsFoto1Seg').val(data.descripcionFoto1 || '');
                    $('#txtObsFoto2Seg').val(data.descripcionFoto2 || '');
                    $('#txtObsFoto3Seg').val(data.descripcionFoto3 || '');
                    $('#txtObsFoto4Seg').val(data.descripcionFoto4 || '');
                    $('#txtObsFoto5Seg').val(data.descripcionFoto5 || '');
                    $('#txtObsFoto6Seg').val(data.descripcionFoto6 || '');
                    for (var i = 1; i <= 6; i++) {
                        var rutaFotoSeg = data['foto' + i];
                        if (rutaFotoSeg) {
                            $('#hddRutaFoto' + i + 'Seg').val(rutaFotoSeg);
                            $('#imgFoto' + i + 'Seg').attr('src', rutaFotoSeg).show();
                            $('#placeholderFoto' + i + 'Seg').hide();
                            $('#accionesFoto' + i + 'Seg').show();
                        } else {
                            $('#imgFoto' + i + 'Seg').hide().attr('src', '');
                            $('#placeholderFoto' + i + 'Seg').show();
                            $('#accionesFoto' + i + 'Seg').hide();
                            $('#hddRutaFoto' + i + 'Seg').val('');
                        }
                    }
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
        // Seccion 3
        $('#txtObsFoto1Seg, #txtObsFoto2Seg, #txtObsFoto3Seg').val('');
        $('#txtObsFoto4Seg, #txtObsFoto5Seg, #txtObsFoto6Seg').val('');
        /*$('#imgFoto1Seg, #imgFoto2Seg, #imgFoto3Seg, #imgFoto4Seg, #imgFoto5Seg, #imgFoto6Seg').hide().attr('src', '');*/
        for (var i = 1; i <= 6; i++) {
            $('#imgFoto' + i + 'Seg').hide().attr('src', '');
            $('#placeholderFoto' + i + 'Seg').show();
            $('#accionesFoto' + i + 'Seg').hide();
            $('#fileFoto' + i + 'Seg').val('');
            $('#hddRutaFoto' + i + 'Seg').val('');
        }
        $('#fileFoto1Seg, #fileFoto2Seg, #fileFoto3Seg, #fileFoto4Seg, #fileFoto5Seg, #fileFoto6Seg').val('');
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
        if (!$('#txtFechaVisitaSeg').val()) {
            Swal.fire('Validación', 'La Fecha de Visita es obligatoria', 'warning');
            return;
        }

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
        // Seccion 3 - descripciones
        formData.append('DescripcionFoto1', $('#txtObsFoto1Seg').val());
        formData.append('DescripcionFoto2', $('#txtObsFoto2Seg').val());
        formData.append('DescripcionFoto3', $('#txtObsFoto3Seg').val());
        formData.append('DescripcionFoto4', $('#txtObsFoto4Seg').val());
        formData.append('DescripcionFoto5', $('#txtObsFoto5Seg').val());
        formData.append('DescripcionFoto6', $('#txtObsFoto6Seg').val());
        // Archivos
        for (var i = 1; i <= 6; i++) {
            var fileInput = $('#fileFoto' + i + 'Seg')[0];
            if (fileInput && fileInput.files && fileInput.files[0]) {
                formData.append('Foto' + i, fileInput.files[0]);
            }
        }

        $.ajax({
            url: baseUrl + 'GuardarSeguimiento',
            type: 'POST',
            data: formData,
            processData: false,
            contentType: false,
            success: function (response) {
                if (response && response.success) {
                    Swal.fire({
                        title: '¡Éxito!',
                        text: 'Seguimiento guardado correctamente',
                        icon: 'success',
                        timer: 1800,
                        showConfirmButton: false
                    }).then(function () {
                        // Regresar al grid actualizado (dentro del mismo modal)
                        var idAccion = $('#hddIdAccionFormSeg').val();
                        $('#hddIdAccionSeg').val(idAccion);
                        cargarGridSeguimientos(idAccion);
                        mostrarVistaGrid();
                    });
                } else {
                    Swal.fire('Error', 'No se pudo guardar correctamente', 'error');
                }
            },
            error: function (xhr) {
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
                    type: 'DELETE',
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
        var url = 'Reportes/CRNET.aspx?reporte=Reporteseguimiento'
            + '&p0=' + idSeguimiento
            + '&p1=' + idSeguimiento
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

                    // — Sección C: fotos con botones descargar/eliminar —
                    for (var i = 1; i <= 6; i++) {
                        var rutaFoto = df['foto' + i];
                        if (rutaFoto) {
                            $('#hddRutaFoto' + i + 'Final').val(rutaFoto);
                            $('#imgFoto' + i + 'Final').attr('src', rutaFoto).show();
                            $('#placeholderFoto' + i + 'Final').hide();
                            $('#accionesFoto' + i + 'Final').show();
                        }
                    }

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
                }
            });

            $('#modalDatosFinales').modal('show');
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

        // Sección C: fotos nuevas
        for (var i = 1; i <= 6; i++) {
            var fileInput = $('#fileFoto' + i + 'Final')[0];
            if (fileInput && fileInput.files && fileInput.files[0]) {
                formData.append('Foto' + i, fileInput.files[0]);
            }
        }

        $.ajax({
            url: baseUrl + 'GuardarDatosFinales',
            type: 'POST',
            data: formData,
            processData: false,
            contentType: false,
            success: function (response) {
                // Si fue alta, obtener el idseguimiento para permitir eliminar fotos en misma sesión
                if ($('#hddAccionMovFinal').val() === 'A') {
                    $.get(baseUrl + 'GetDatosFinales/' + $('#hddIdAccionFinal').val(), function (df) {
                        if (df) {
                            $('#hddIdSeguimientoFinal').val(df.idSeguimiento);
                            $('#hddAccionMovFinal').val('M');
                        }
                    });
                }
                Swal.fire({
                    title: '¡Éxito!',
                    text: 'Datos finales guardados correctamente.',
                    icon: 'success',
                    timer: 1800,
                    showConfirmButton: false
                }).then(function () {
                    $('#modalDatosFinales').modal('hide');
                });
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

    var abrirFichaFism = function (idAcciones) {
        limpiarFormularioFism();
        $('#hddIdAccionFism').val(idAcciones);
        _idFichaTecnicaActual = 0;

        // 1. Encabezado (datos generales del encabezado)
        $.get(baseUrl + 'GetDatosEncabezadoFism/' + idAcciones, function (data) {
            $('#lblObraFism').text(data.nombreObra);
            $('#lblRubroFism').text(data.rubro);
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

        // 2. Datos FISM existentes (modificar / nuevo)
        $.get(baseUrl + 'GetFichaFism/' + idAcciones, function (data) {
            if (data) {
                // ── MODO MODIFICAR ──
                $('#hddAccionMovFism').val('M');
                _idFichaTecnicaActual = data.idFichaTecnica || 0;

                $('#txtInversionProgramadaFism').val(parseFloat(data.inversionProgramadaFism || 0).toFixed(2));
                $('#txtInversionEjercidaFism').val(parseFloat(data.inversionEjercidaFism || 0).toFixed(2));
                $('#txtAportacionProgramadaFism').val(parseFloat(data.aportacionProgramadaFism || 0).toFixed(2));
                $('#txtAportacionEjercidaFism').val(parseFloat(data.aportacionEjercidaFism || 0).toFixed(2));
                $('#txtDictamenFism').val(data.dictamen);

                // ✅ Fechas: Controller ya regresa dd/MM/yyyy → asignar DIRECTO (sin formatearFechaInput)
                $('#txtFechaInicioProgramadaFism').val(data.programadoFechaInicial);
                $('#txtFechaFinalProgramadaFism').val(data.programadoFechaFinal);
                $('#txtContratoImporteFism').val(parseFloat(data.convenioContratoImporte || 0).toFixed(2));
                $('#txtContratoInicioFism').val(data.convenioContratoFechaInicio);
                $('#txtContratoFinFism').val(data.convenioContratoFechaFin);
                $('#txtDiferidoImporteFism').val(parseFloat(data.convenioDiferidoImporte || 0).toFixed(2));
                $('#txtDiferidoInicioFism').val(data.convenioDiferidoFechaInicio);
                $('#txtDiferidoFinFism').val(data.convenioDiferidoFechaFin);
                $('#txtAmpliacionImporteFism').val(parseFloat(data.ampliacionPlazoImporte || 0).toFixed(2));
                $('#txtAmpliacionInicioFism').val(data.ampliacionPlazoFechaInicio);
                $('#txtAmpliacionFinFism').val(data.ampliacionPlazoFechaFin);
                $('#txtObservacionesFism').val(data.observaciones);

                // ✅ Llamar con las rutas que devuelve el Controller
                renderFotosFism(data.foto1 || '', data.foto2 || '');
            } else {
                // ── MODO AGREGAR ──
                $('#hddAccionMovFism').val('A');
                _idFichaTecnicaActual = 0;
            }

            // ✅ Inicializar datepicker DENTRO del callback (evita race condition)
            //    igual que el módulo Seguimiento ya corregido
            initDatepickersFism();

            $('#modalFichaFism').modal('show');
        });
    };

    // ── Mostrar fotos al cargar datos (mismo patrón que Datos de Inicio) ──
    var renderFotosFism = function (ruta1, ruta2) {
        mostrarFotoFism(1, ruta1);
        mostrarFotoFism(2, ruta2);
    };

    var mostrarFotoFism = function (numero, ruta) {
        var $img = $('#imgFoto' + numero + 'Fism');
        var $acciones = $('#accionesFoto' + numero + 'Fism');
        var $placeholder = $('#placeholderFoto' + numero + 'Fism');
        var $hdd = $('#hddRutaFoto' + numero + 'Fism');

        if (ruta && ruta.trim() !== '') {
            // ✅ Usar endpoint del Controller para servir la imagen
            //    evita problemas con rutas relativas en subdirectorio virtual
            $img.attr('src', baseUrl + 'DescargarFoto?ruta=' + encodeURIComponent(ruta))
                .show();
            $acciones.show();
            $placeholder.hide();
            $hdd.val(ruta);
        } else {
            $img.hide().attr('src', '');
            $acciones.hide();
            $placeholder.show();
            $hdd.val('');
        }
    };


    var initDatepickersFism = function () {
        var campos = [
            '#txtFechaInicioProgramadaFism', '#txtFechaFinalProgramadaFism',
            '#txtContratoInicioFism', '#txtContratoFinFism',
            '#txtDiferidoInicioFism', '#txtDiferidoFinFism',
            '#txtAmpliacionInicioFism', '#txtAmpliacionFinFism'
        ];
        // Destruir instancias previas si las hubiera
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
        $('#txtInversionProgramadaFism, #txtInversionEjercidaFism').val('0.00');
        $('#txtAportacionProgramadaFism, #txtAportacionEjercidaFism').val('0.00');
        $('#txtDictamenFism, #txtObservacionesFism').val('');
        $('#txtFechaInicioProgramadaFism, #txtFechaFinalProgramadaFism').val('');
        $('#txtContratoImporteFism, #txtDiferidoImporteFism, #txtAmpliacionImporteFism').val('0.00');
        $('#txtContratoInicioFism, #txtContratoFinFism').val('');
        $('#txtDiferidoInicioFism, #txtDiferidoFinFism').val('');
        $('#txtAmpliacionInicioFism, #txtAmpliacionFinFism').val('');
        // Limpiar fotos — mismo patrón que Datos de Inicio
        [1, 2].forEach(function (n) {
            $('#imgFoto' + n + 'Fism').hide().attr('src', '');
            $('#accionesFoto' + n + 'Fism').hide();
            $('#placeholderFoto' + n + 'Fism').show();
            $('#fileFoto' + n + 'Fism').val('');
            $('#hddRutaFoto' + n + 'Fism').val('');
        });
        // Limpiar labels encabezado
        $('#lblObraFism, #lblRubroFism, #lblContratoFism, #lblLocalidadFism').text('');
        $('#lblMontoFism, #lblFuenteFism, #lblPeriodoInicioFism, #lblPeriodoFinFism').text('');
        $('#lblClaveLocalidadFism, #lblProgramaFism, #lblDescripcionObraFism').text('');
        $('#hddAccionMovFism').val('A');
        _idFichaTecnicaActual = 0;
    };

    var guardarFichaFism = function () {
        var formData = new FormData();

        // ── Encabezado / hidden ──
        formData.append('IdAcciones', $('#hddIdAccionFism').val());
        formData.append('IdObraProyecto', $('#hddIdObraFism').val());
        formData.append('AccionMov', $('#hddAccionMovFism').val());
        formData.append('IdPrograma', $('#hddIdProgramaFism').val());
        formData.append('Programa', $('#lblProgramaFism').text());
        formData.append('Obra', $('#lblObraFism').text());
        formData.append('Localidad', $('#lblLocalidadFism').text());
        formData.append('ClaveLocalidad', $('#lblClaveLocalidadFism').text());
        formData.append('DescripcionObra', $('#lblDescripcionObraFism').text());
        formData.append('Contrato', $('#lblContratoFism').text());
        formData.append('PeriodoInicio', $('#lblPeriodoInicioFism').text());
        formData.append('PeriodoFin', $('#lblPeriodoFinFism').text());

        // ── Campos numéricos ──
        formData.append('InversionProgramadaFism', $('#txtInversionProgramadaFism').val());
        formData.append('InversionEjercidaFism', $('#txtInversionEjercidaFism').val());
        formData.append('AportacionProgramadaFism', $('#txtAportacionProgramadaFism').val());
        formData.append('AportacionEjercidaFism', $('#txtAportacionEjercidaFism').val());
        formData.append('Dictamen', $('#txtDictamenFism').val());

        // ── Campos fecha (ya en dd/MM/yyyy del datepicker, ParseFecha del Controller los procesa) ──
        formData.append('ProgramadoFechaInicial', $('#txtFechaInicioProgramadaFism').val());
        formData.append('ProgramadoFechaFinal', $('#txtFechaFinalProgramadaFism').val());
        formData.append('ConvenioContratoImporte', $('#txtContratoImporteFism').val());
        formData.append('ConvenioContratoFechaInicio', $('#txtContratoInicioFism').val());
        formData.append('ConvenioContratoFechaFin', $('#txtContratoFinFism').val());
        formData.append('ConvenioDiferidoImporte', $('#txtDiferidoImporteFism').val());
        formData.append('ConvenioDiferidoFechaInicio', $('#txtDiferidoInicioFism').val());
        formData.append('ConvenioDiferidoFechaFin', $('#txtDiferidoFinFism').val());
        formData.append('AmpliacionPlazoImporte', $('#txtAmpliacionImporteFism').val());
        formData.append('AmpliacionPlazoFechaInicio', $('#txtAmpliacionInicioFism').val());
        formData.append('AmpliacionPlazoFechaFin', $('#txtAmpliacionFinFism').val());
        formData.append('Observaciones', $('#txtObservacionesFism').val());

        // ── Fotos (solo si el usuario seleccionó archivo nuevo) ──
        var f1 = $('#fileFoto1Fism')[0].files[0];
        var f2 = $('#fileFoto2Fism')[0].files[0];
        if (f1) formData.append('Foto1', f1);
        if (f2) formData.append('Foto2', f2);

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

    // ── Eliminar foto FISM individual ─────────────────────────────────────────────
    // Se llama desde los botones generados en renderUnidadFotoFism
    var eliminarFotoFism = function (numero) {
        if (_idFichaTecnicaActual <= 0) {
            Swal.fire('Aviso', 'Guarda la ficha primero antes de eliminar fotos.', 'warning');
            return;
        }
        var columnaImg = 'imgfoto' + numero;
        var columnaPath = 'foto' + numero;

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
                        columnaImg: columnaImg, columnaPath: columnaPath
                    }),
                    success: function () {
                        Swal.fire('Eliminada', 'La foto fue eliminada.', 'success');
                        mostrarFotoFism(numero, '');
                    },
                    error: function (xhr) { Swal.fire('Error', xhr.responseText, 'error'); }
                });
            }
        });
    };

    // ── Descargar foto FISM (reutiliza el endpoint genérico DescargarFoto) ────────
    var descargarFotoFism = function (numero) {
        var ruta = $('#hddRutaFoto' + numero + 'Fism').val();
        if (!ruta) { Swal.fire('Aviso', 'No hay foto guardada.', 'info'); return; }
        var link = document.createElement('a');
        link.href = baseUrl + 'DescargarFoto?ruta=' + encodeURIComponent(ruta);
        link.download = '';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    //======================================================================
    // ======================== FINIQUITO ==================================
    //======================================================================
    var abrirFiniquito = function (idAcciones) {
        limpiarFormularioFiniquito();
        $('#hddIdAccionFiniquito').val(idAcciones);

        // Cargar encabezado
        $.get(baseUrl + 'GetDatosEncabezadoFiniquito/' + idAcciones, function (data) {
            $('#lblObraFiniquito').text(data.nombreObra);
            $('#lblClaveMunicipalFiniquito').text('061');
            $('#lblMunicipioFiniquito').text(data.localidad);
            $('#lblNumeroObraFiniquito').text(data.numObra);
            $('#lblContratoFiniquito').text(data.numContrato);
            $('#lblContratistaFiniquito').text(data.contratista);
            $('#lblDescripcionObraFiniquito').text(data.descripcionAccion);
            $('#lblPeriodoInicioFiniquito').text(data.periodoInicio);
            $('#lblPeriodoFinFiniquito').text(data.periodoFin);
            $('#lblFuenteFiniquito').text(data.fuenteFinanciamiento);
            $('#lblMontoFuenteFiniquito').text('$' + parseFloat(data.montoFuente || 0).toLocaleString('es-MX', { minimumFractionDigits: 2 }));
            $('#hddIdObraFiniquito').val(data.idObraProyecto);
            $('#txtMontoFuenteFiniquito').val(data.montoFuente);
            $('#txtFechaProgramadaInicioFiniquito').val(data.periodoInicio);
            $('#txtDescripcionObraFiniquitoInput').val(data.descripcionAccion);
        });

        // Cargar datos existentes
        $.get(baseUrl + 'GetFiniquito/' + idAcciones, function (data) {
            if (data) {
                $('#hddAccionMovFiniquito').val('M');
                $('#txtProgramaFiniquito').val(data.programa);
                $('#txtSubprogramaFiniquito').val(data.subprograma);
                $('#txtMontoFuenteFiniquito').val(data.montoFuente);
                $('#txtPresupuestoDevengadoFiniquito').val(data.devengado);
                $('#txtLatitudFiniquito').val(data.latitud);
                $('#txtLongitudFiniquito').val(data.longitud);
                $('#txtFechaProgramadaInicioFiniquito').val(data.programadoInicio);
                $('#txtFechaRealFinFiniquito').val(data.realTermino);
                $('#txtAvanceFinancieroFiniquito').val(data.financiero);
                $('#txtDescripcionObraFiniquitoInput').val(data.descripcionObra);
                $('#txtObservacionesFiniquito').val(data.observaciones);
            } else {
                $('#hddAccionMovFiniquito').val('A');
                // Cargar datos de inicio y final si existen
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
                var url = 'Reportes/CRNET.aspx?reporte=Reporteinicio'
                    + '&p0=' + idAcciones
                    + '&p1=' + data.idSeguimiento
                    + '&p2=' + idAcciones
                    + '&p3=' + data.idSeguimiento;
                window.open(url, '_blank');
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
                var url = 'Reportes/CRNET.aspx?reporte=Reportefinal'
                    + '&p0=' + idAcciones
                    + '&p1=' + data.idSeguimiento
                    + '&p2=' + idAcciones
                    + '&p3=' + data.idSeguimiento;
                window.open(url, '_blank');
            } else {
                Swal.fire('Aviso', 'No existe registro final para imprimir.', 'warning');
            }
        });
    };


    var imprimirFichaFism = function (idAcciones) {
        var url = 'Reportes/CRNET.aspx?reporte=Fichatecnicafism'
            + '&p0=' + idAcciones;
        window.open(url, '_blank');
    };

    var exportarExcelFiniquito = function (idAcciones) {
        window.location.href = baseUrl + 'ExportarExcelFiniquito/' + idAcciones;
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
            TablaCedulas.init();
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
        descargarFotoSeg: descargarFotoSeg,
        eliminarFotoSeg: eliminarFotoSeg,

        abrirDatosFinales: abrirDatosFinales,
        descargarFotoFinal: descargarFotoFinal,
        eliminarFotoFinal: eliminarFotoFinal,

        abrirFichaFism: abrirFichaFism,
        descargarFotoFism: descargarFotoFism,
        eliminarFotoFism: eliminarFotoFism,

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
// Inicializar cuando el documento este listo
jQuery(document).ready(function () {
    CedulaModule.init();
    Clock.init();
});
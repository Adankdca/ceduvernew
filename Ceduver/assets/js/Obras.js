/**
 * Módulo Obras — VS2026 Metronic 7
 */

const ObrasModule = (function () {

    const API = 'api/Obras/';
    var dataTable = null;
    // ══════════════════════════════════════════════════════
    // UTILIDADES
    // ══════════════════════════════════════════════════════

    var fmt = function (valor) {
        return '$' + parseFloat(valor || 0).toLocaleString('es-MX', {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2
        });
    };
    // ══════════════════════════════════════════════════════
    // AUTOCOMPLETE PROPIO (sin jQuery UI)
    // Igual al módulo Seguimiento — no requiere dependencias extra
    // ══════════════════════════════════════════════════════

    /**
     * Crea un autocomplete ligero sobre un <input>.
     * @param {string} inputId   — id del input (sin #)
     * @param {string} endpoint  — URL del API que recibe ?term=xxx y devuelve string[]
     * @param {number} minChars  — mínimo de caracteres para disparar
     */
    var crearAutocomplete = function (inputId, endpoint, minChars) {
        minChars = minChars || 2;
        var $input = $('#' + inputId);

        // 🔴 CLAVE: SI NO EXISTE → NO HAGAS NADA
        if (!$input.length) return;

        // Crear dropdown flotante
        var $lista = $('<ul>', {
            id: 'ac-' + inputId,
            css: {
                position: 'absolute',
                zIndex: 9999,
                background: '#fff',
                border: '1px solid #e4e6ef',
                borderTop: 'none',
                borderRadius: '0 0 6px 6px',
                margin: 0,
                padding: 0,
                listStyle: 'none',
                maxHeight: '220px',
                overflowY: 'auto',
                boxShadow: '0 4px 12px rgba(0,0,0,.12)',
                display: 'none',
                minWidth: $input.outerWidth() + 'px'
            }
        }).appendTo('body');

        var posicionar = function () {
            var off = $input.offset();
            $lista.css({
                top: off.top + $input.outerHeight(),
                left: off.left,
                width: $input.outerWidth()
            });
        };

        var cerrar = function () { $lista.hide().empty(); };

        var abrir = function (items) {
            $lista.empty();
            if (!items.length) { cerrar(); return; }
            items.forEach(function (val) {
                $('<li>', {
                    text: val,
                    css: { padding: '7px 12px', cursor: 'pointer', fontSize: '.88rem' }
                })
                    .on('mouseenter', function () { $(this).css('background', '#f3f6f9'); })
                    .on('mouseleave', function () { $(this).css('background', '#fff'); })
                    .on('mousedown', function (e) {
                        e.preventDefault();
                        $input.val(val);
                        cerrar();
                    })
                    .appendTo($lista);
            });
            posicionar();
            $lista.show();
        };

        var timer = null;
        $input.on('input', function () {
            clearTimeout(timer);
            var term = $(this).val().trim();
            if (term.length < minChars) { cerrar(); return; }
            timer = setTimeout(function () {
                $.get(endpoint, { term: term })
                    .done(function (res) { abrir(res); })
                    .fail(function () { cerrar(); });
            }, 280);
        });

        $input.on('blur', function () { setTimeout(cerrar, 200); });
        $input.on('focus', function () { posicionar(); });
        $(window).on('resize scroll', posicionar);
    };
    // ══════════════════════════════════════════════════════
    // CATÁLOGOS
    // ══════════════════════════════════════════════════════

    var cargarRubros = function () {
        return  $.get(API + 'getRubros')
            .done(function (res) {
                var $sel = $('#filterRubro');
                $sel.empty();
                // ✅ CLAVE: primera opción con value="" es SELECCIONABLE → permite volver a "TODOS"
                $sel.append('<option value="">(TODOS LOS RUBROS)</option>');
                res.forEach(function (item) {
                    $sel.append('<option value="' + item.Id + '">' + item.Nombre + '</option>');
                });
                $sel.selectpicker('refresh');
            })
            .fail(function () { console.error('Error cargando rubros'); });
    };

   var cargarAnios = function () {
       return   $.get(API + 'getAnios')
            .done(function (res) {
                var $sel = $('#filterAnio');
                $sel.empty();
                // ✅ CLAVE: primera opción con value="" es SELECCIONABLE → permite volver a "TODOS"
                $sel.append('<option value="">(TODOS LOS AÑOS)</option>');
                res.forEach(function (item) {
                    $sel.append('<option value="' + item.Id + '">' + item.Nombre + '</option>');
                });
                $sel.selectpicker('refresh');
            })
            .fail(function () { console.error('Error cargando años'); });
    };

    // ══════════════════════════════════════════════════════
    // BÚSQUEDA / GRID
    // ══════════════════════════════════════════════════════

    var buscar = function () {
        var filtros = {
            rubro: $('#filterRubro').val() || '',
            anio: $('#filterAnio').val() || '',
            nombre: $('#filterNombre').val() || '',
            contrato: $('#filterContrato').val() || '',
            numObra: $('#filterNumObra').val() || ''
        };
        // Destruir DataTable antes de cargar nuevos datos
        if (dataTable) { dataTable.destroy(); dataTable = null; }

        var $tbody = $('#tbodyObras');
        $tbody.html(
            '<tr><td colspan="12" class="text-center py-5">' +
            '<i class="fas fa-spinner fa-spin fa-2x text-primary"></i>' +
            '<div class="mt-2 text-muted">Cargando obras...</div></td></tr>'
        );
        $('#rowTotales').hide();

        $.get(API + 'getObras', filtros)
            .done(function (data) { renderizar(data); })
            .fail(function (xhr) {
                $tbody.html(
                    '<tr><td colspan="12" class="text-center text-danger py-5">' +
                    '<i class="fas fa-exclamation-circle fa-2x mb-2 d-block"></i>' +
                    'Error al conectar con el servidor: ' +
                    (xhr.responseText || xhr.statusText) + '</td></tr>'
                );
            });
    };

    var renderizar = function (data) {
        var $tbody = $('#tbodyObras');
        $tbody.empty();

        $('#totalObrasBadge').text(data.length + ' obras');
        $('#lblTotalObras').text(data.length);

        if (!data.length) {
            $tbody.html(
                '<tr><td colspan="12" class="text-center text-muted py-5">' +
                '<i class="fas fa-inbox fa-2x mb-2 d-block"></i>' +
                'No se encontraron obras con los filtros aplicados.</td></tr>'
            );
            $('#rowTotales').hide();
            return;
        }

        var totMun = 0, totEst = 0, totFed = 0, totGen = 0;

        data.forEach(function (o, idx) {
            totMun += parseFloat(o.municipal || 0);
            totEst += parseFloat(o.estatal || 0);
            totFed += parseFloat(o.federal || 0);
            totGen += parseFloat(o.total || 0);

            // Badge de acciones
            var accBadge = o.numAcciones > 0
                ? '<span class="badge badge-light-success">' + o.numAcciones + '</span>'
                : '<span class="badge badge-light-secondary">0</span>';

            // Nombre con tooltip si es largo
            var nombre = (o.nombre || '');
            var nombreCorto = nombre.length > 80
                ? nombre.substring(0, 80) + '…'
                : nombre;

            $tbody.append(
                '<tr>' +
                '<td class="text-muted small">' + (idx + 1) + '</td>' +
                '<td><span class="font-weight-bold">' + (o.anio || '') + '</span></td>' +
                '<td><span class="badge badge-light-primary text-wrap" style="font-size:11px;">' +
                (o.subrubro || '') + '</span></td>' +
                '<td style="font-size:.82rem;max-width:280px;" title="' + nombre + '">' +
                nombreCorto + '</td>' +
                '<td class="text-primary font-weight-bold">' + (o.noObra || '') + '</td>' +
                '<td style="font-size:.82rem;">' + (o.localidad || '') + '</td>' +
                '<td><span class="badge badge-light-info">' + (o.finanto || '') + '</span></td>' +
                '<td class="text-right">' + fmt(o.municipal) + '</td>' +
                '<td class="text-right">' + fmt(o.estatal) + '</td>' +
                '<td class="text-right">' + fmt(o.federal) + '</td>' +
                '<td class="text-right font-weight-bold text-danger">' + fmt(o.total) + '</td>' +
                '<td class="text-center" style="white-space:nowrap;">' +
                // Localidades
                '<button type="button" class="btn btn-sm btn-icon btn-light-info mr-1" ' +
                'onclick="ObrasModule.verLocalidades(' + o.idobra + ')" title="Localidades">' +
                '<i class="fas fa-map-marker-alt"></i>' +
                '</button>' +
                // Acciones — muestra conteo como badge encima del ícono
                '<button type="button" class="btn btn-sm btn-icon btn-light-success mr-1 position-relative" ' +
                'onclick="ObrasModule.verAcciones(' + o.idobra + ')" title="Acciones (' + o.numAcciones + ')">' +
                '<i class="fas fa-tasks"></i>' +
                (o.numAcciones > 0
                    ? '<span class="badge badge-danger badge-pill position-absolute" ' +
                    'style="top:-6px;right:-6px;font-size:9px;padding:2px 5px;">' +
                    o.numAcciones + '</span>'
                    : '') +
                '</button>' +
                // Modificar
                '<button type="button" class="btn btn-sm btn-icon btn-light-warning mr-1" ' +
                'onclick="ObrasModule.modificarObra(' + o.idobra + ')" title="Modificar">' +
                '<i class="fas fa-edit"></i>' +
                '</button>' +
                // Eliminar
                '<button type="button" class="btn btn-sm btn-icon btn-light-danger" ' +
                'onclick="ObrasModule.eliminarObra(' + o.idobra + ')" title="Eliminar">' +
                '<i class="fas fa-trash"></i>' +
                '</button>' +
                '</td>' +
                '</tr>'
            );
        });

        // Fila de totales
        $('#totalMunicipal').text(fmt(totMun));
        $('#totalEstatal').text(fmt(totEst));
        $('#totalFederal').text(fmt(totFed));
        $('#totalGeneral').text(fmt(totGen));
        $('#rowTotales').show();

        // Inicializar DataTable después de renderizar filas
        dataTable = $('#tblObras').DataTable({
            responsive: true,
            language: {
                url: '//cdn.datatables.net/plug-ins/1.13.7/i18n/es-MX.json'
            },
            order: [],
            columnDefs: [
                { orderable: false, targets: [0, 11] }, // No. y Acciones no ordenables
                { width: '270px', targets: [3] }   // ✅ columna Nombre de la Obra
            ],
            pageLength: 5,
            lengthMenu: [[5,10, 25, 50, 100, -1], [5,10, 25, 50, 100, 'Todos']],
            autoWidth: false   // ✅ necesario para que los width manuales funcionen
        });

    };

    var limpiarFiltros = function () {
        $('#filterNombre, #filterContrato, #filterNumObra').val('');
        // ✅ val('') selecciona la primera <option value=""> = "(TODOS LOS RUBROS/AÑOS)"
        $('#filterRubro, #filterAnio').val('').selectpicker('refresh');
        // Destruir DataTable si existe
        if (dataTable) { dataTable.destroy(); dataTable = null; }

        $('#tbodyObras').html(
            '<tr><td colspan="12" class="text-center text-muted py-5">' +
            '<i class="fas fa-search fa-2x mb-2 d-block"></i>' +
            'Use los filtros y presione BUSCAR</td></tr>'
        );
        $('#totalObrasBadge').text('0 obras');
        $('#lblTotalObras').text('0');
        $('#rowTotales').hide();
    };


    // ══════════════════════════════════════════════════════
    // ACCIONES DEL GRID
    // ══════════════════════════════════════════════════════

    var idObra = 0;

    var agregarObra = function () {

        idObra = 0; // ✅ MODO AGREGAR

        // LIMPIAR CAMPOS
        //$('#txtNoObra').val('');
        //$('#txtNombreObra').val('');
        //$('#txtAntecedentes').val('');
        //$('#txtObservaciones').val('');
        //$('#txtAcciones').val('0');
        //$('#chkFranja').prop('checked', false);

        // LIMPIAR COMBOS
        //$('#cmbRubroModal').empty();
        //$('#cmbSubrubroModal').empty();
        //$('#cmbPrograma').empty();
        //$('#cmbArea').empty();
        //$('#cmbMarginacion').empty();
        //$('#cmbTipoObra').empty();
        limpiarFormularioObra();

        // CARGAR CATÁLOGOS
        cargarCombosModal();

        // ABRIR MODAL
        $('#modalObra').modal('show');
    };

    var modificarObra = function (id) {

        idObra = id;
        limpiarFormularioObra();

        // ✅ Primero traemos los datos, luego cargamos cada combo
        //    y asignamos el valor DENTRO de su propio callback.
        //    Nunca hacemos .val() antes de que existan los <option>.

        $.get(API + 'getObraById/' + id, function (res) {

            // Campos de texto — no dependen de combos
            $('#txtNoObra').val(res.noObra);
            $('#txtNombreObra').val(res.nombre);
            $('#txtAntecedentes').val(res.antecedentes);
            $('#txtObservaciones').val(res.observaciones);
            $('#txtAcciones').val(res.acciones);
            $('#chkFranja').prop('checked', res.franja);

            // Combos independientes: cada uno carga y asigna en su propio callback
            $.get(API + 'getProgramas', function (list) {
                var $c = $('#cmbPrograma');
                $c.empty().append('<option value="">(SELECCIONE)</option>');
                list.forEach(function (x) { $c.append('<option value="' + x.Id + '">' + x.Nombre + '</option>'); });
                $c.val(res.idPrograma);       // ✅ DENTRO del callback
            });

            $.get(API + 'getMarginacion', function (list) {
                var $c = $('#cmbMarginacion');
                $c.empty().append('<option value="">(SELECCIONE)</option>');
                list.forEach(function (x) { $c.append('<option value="' + x.Id + '">' + x.Nombre + '</option>'); });
                $c.val(res.idMarginacion);    // ✅ DENTRO del callback
            });

            $.get(API + 'getTipoObra', function (list) {
                var $c = $('#cmbTipoObra');
                $c.empty().append('<option value="">(SELECCIONE)</option>');
                list.forEach(function (x) { $c.append('<option value="' + x.Id + '">' + x.Nombre + '</option>'); });
                $c.val(res.idTipoObra);       // ✅ DENTRO del callback
            });

            // Rubro → al terminar carga Subrubro y Área (dependientes del rubro)
            $.get(API + 'getRubros', function (rubros) {
                var $r = $('#cmbRubroModal');
                $r.empty().append('<option value="">(SELECCIONE)</option>');
                rubros.forEach(function (x) { $r.append('<option value="' + x.Id + '">' + x.Nombre + '</option>'); });
                $r.val(res.idRubro);          // ✅ DENTRO del callback

                // Subrubro — depende del rubro
                $.get(API + 'getSubrubros/' + res.idRubro, function (subs) {
                    var $s = $('#cmbSubrubroModal');
                    $s.empty().append('<option value="">(SELECCIONE)</option>');
                    subs.forEach(function (x) { $s.append('<option value="' + x.Id + '">' + x.Nombre + '</option>'); });
                    $s.val(res.idSubrubro);   // ✅ DENTRO del callback
                });

                // Área — también depende del rubro
                $.get(API + 'getAreasByRubro/' + res.idRubro, function (areas) {
                    var $a = $('#cmbArea');
                    $a.empty().append('<option value="">(SELECCIONE)</option>');
                    areas.forEach(function (x) { $a.append('<option value="' + x.Id + '">' + x.Nombre + '</option>'); });
                    $a.val(res.idArea);       // ✅ DENTRO del callback
                });
            });

            $('#modalObra').modal('show');
        });
    };

    var eliminarObra = function (idobra) {
        Swal.fire({
            title: '¿Eliminar obra?',
            html: '<div class="text-left">' +
                '<p>Esta acción <strong>no se puede deshacer</strong>.</p>' +
                '<p class="text-muted small mb-0">Se eliminará la obra y todas sus acciones.<br>' +
                'Se generará un registro en el historial.</p>' +
                '</div>',
            icon: 'warning',
            showCancelButton: true,
            confirmButtonText: '<i class="fas fa-trash mr-1"></i> Sí, eliminar',
            cancelButtonText: 'Cancelar',
            confirmButtonColor: '#F64E60',
            cancelButtonColor: '#6c757d'
        }).then(function (result) {
            if (result.value) {
                $.ajax({
                    url: API + 'eliminarObra/' + idobra,
                    type: 'DELETE',
                    success: function () {
                        Swal.fire({
                            title: 'Eliminada',
                            text: 'La obra fue eliminada y se registró en el historial.',
                            icon: 'success',
                            timer: 2000,
                            showConfirmButton: false
                        });
                        buscar();
                    },
                    error: function (xhr) {
                        var msg = xhr.responseText
                            ? xhr.responseText.replace(/^"|"$/g, '')
                            : 'Error al eliminar la obra.';
                        Swal.fire({
                            title: 'No se puede eliminar',
                            text: msg,
                            icon: 'error'
                        });
                    }
                });
            }
        });
    };
    // funciones de las localidades
    var verLocalidades = function (idobra) {
        // Limpiar estado anterior
        $('#hddIdObraLocalidades').val(idobra);
        $('#hddAccionLocalidad').val('add');
        $('#hddIdLocalidadDetalle').val('');
        $('#panelFormLocalidad').hide();
        $('#cboLocalidad').val('');
        $('#lblTituloFormLocalidad').text('Agregar Localidad');

        // Cargar nombre de la obra en el encabezado
        $.get(API + 'getNombreObra/' + idobra, function (data) {
            $('#lblObraLocalidades').text(data || '');
        });

        // Cargar localidades del catálogo
        cargarCatalogoLocalidades();

        // Cargar localidades ya registradas
        cargarTablaLocalidades(idobra);

        $('#modalLocalidades').modal('show');
    };

    var cargarCatalogoLocalidades = function () {
        $.get(API + 'getLocalidades')
            .done(function (res) {
                var $cbo = $('#cboLocalidad');
                $cbo.empty().append('<option value="">(SELECCIONE)</option>');
                res.forEach(function (item) {
                    $cbo.append('<option value="' + item.id + '">' + item.nombre + '</option>');
                });
            });
    };

    var cargarTablaLocalidades = function (idobra) {
        var $tbody = $('#tbodyLocalidades');
        $tbody.html('<tr><td colspan="3" class="text-center py-3">' +
            '<i class="fas fa-spinner fa-spin text-primary"></i> Cargando...</td></tr>');

        $.get(API + 'getLocalidadesObra/' + idobra)
            .done(function (data) {
                $tbody.empty();
                $('#badgeTotalLocalidades').text(data.length);

                if (!data.length) {
                    $tbody.html('<tr><td colspan="3" class="text-center text-muted py-4">' +
                        'Sin localidades registradas</td></tr>');
                    return;
                }

                data.forEach(function (loc, idx) {
                    $tbody.append(
                        '<tr>' +
                        '<td class="text-muted small">' + (idx + 1) + '</td>' +
                        '<td class="font-weight-bold">' + loc.nombre + '</td>' +
                        '<td class="text-center">' +
                        '<button type="button" class="btn btn-sm btn-icon btn-light-warning mr-1" ' +
                        'onclick="ObrasModule.editarLocalidad(' + loc.id + ',' + loc.idLocalidad + ')" ' +
                        'title="Modificar">' +
                        '<i class="fas fa-edit"></i>' +
                        '</button>' +
                        '<button type="button" class="btn btn-sm btn-icon btn-light-danger" ' +
                        'onclick="ObrasModule.eliminarLocalidad(' + loc.id + ')" ' +
                        'title="Eliminar">' +
                        '<i class="fas fa-trash"></i>' +
                        '</button>' +
                        '</td>' +
                        '</tr>'
                    );
                });
            });
    };

    var editarLocalidad = function (idLocalidadDetalle, idLocalidad) {
        $('#hddAccionLocalidad').val('edit');
        $('#hddIdLocalidadDetalle').val(idLocalidadDetalle);
        $('#cboLocalidad').val(idLocalidad);
        $('#lblTituloFormLocalidad').text('Modificar Localidad');
        $('#panelFormLocalidad').show();
    };

    var eliminarLocalidad = function (idLocalidadDetalle) {
        Swal.fire({
            title: '¿Eliminar localidad?',
            text: 'Esta acción no se puede deshacer.',
            icon: 'warning',
            showCancelButton: true,
            confirmButtonText: 'Sí, eliminar',
            cancelButtonText: 'Cancelar',
            confirmButtonColor: '#F64E60'
        }).then(function (result) {
            if (result.value) {
                $.ajax({
                    url: API + 'eliminarLocalidad/' + idLocalidadDetalle,
                    type: 'DELETE',
                    success: function () {
                        cargarTablaLocalidades($('#hddIdObraLocalidades').val());
                        Swal.fire({
                            title: 'Eliminada',
                            text: 'Localidad eliminada correctamente.',
                            icon: 'success',
                            timer: 1500,
                            showConfirmButton: false
                        });
                    },
                    error: function (xhr) {
                        Swal.fire('Error', xhr.responseText, 'error');
                    }
                });
            }
        });
    };

    var guardarLocalidad = function () {
        var idLocalidad = $('#cboLocalidad').val();
        if (!idLocalidad) {
            Swal.fire('Aviso', 'Seleccione una localidad.', 'warning');
            return;
        }

        var idobra = $('#hddIdObraLocalidades').val();
        var accion = $('#hddAccionLocalidad').val();
        var idDetalle = $('#hddIdLocalidadDetalle').val();

        var payload = {
            idobra: idobra,
            idLocalidad: idLocalidad,
            idLocalidadDetalle: idDetalle,
            accion: accion,
            cveMunicipio: '061'
        };

        $.ajax({
            url: API + 'guardarLocalidad',
            type: 'POST',
            contentType: 'application/json',
            data: JSON.stringify(payload),
            success: function () {
                $('#panelFormLocalidad').hide();
                $('#hddAccionLocalidad').val('add');
                $('#hddIdLocalidadDetalle').val('');
                $('#cboLocalidad').val('');
                $('#lblTituloFormLocalidad').text('Agregar Localidad');
                cargarTablaLocalidades(idobra);
                Swal.fire({
                    title: '¡Éxito!',
                    text: accion === 'add'
                        ? 'Localidad agregada correctamente.'
                        : 'Localidad actualizada correctamente.',
                    icon: 'success',
                    timer: 1500,
                    showConfirmButton: false
                });
            },
            error: function (xhr) {
                Swal.fire('Error', xhr.responseText, 'error');
            }
        });
    };

    // ══════════════════════════════════════════════════════════════════
    // ACCIONES
    // ══════════════════════════════════════════════════════════════════

    var verAcciones = function (idobra) {
        $('#hddIdObraAcciones').val(idobra);
        mostrarPanelAcciones('grid');

        // Nombre de la obra
        $.get(API + 'getNombreObra/' + idobra, function (data) {
            $('#lblObraAcciones').text(data || '');
        });

        cargarCatalogosAccion(idobra);
        cargarTablaAcciones(idobra, '');
        $('#modalAcciones').modal('show');
    };

    var mostrarPanelAcciones = function (panel) {
        $('#panelGridAcciones, #panelFormAccion, #panelOrigenes, #panelContrato').hide();
        if (panel === 'grid') $('#panelGridAcciones').show();
        if (panel === 'form') $('#panelFormAccion').show();
        if (panel === 'origenes') $('#panelOrigenes').show();
        if (panel === 'contrato') $('#panelContrato').show();
    };

    var cargarCatalogosAccion = function (idobra) {
        // Años de la obra
        //$.get(API + 'getAniosAccion/' + idobra, function (res) {
        //    var $cbo = $('#cboFiltroAnioAccion, #cboAnioAccion');
        //    $('#cboFiltroAnioAccion').find('option:not(:first)').remove();
        //    $('#cboAnioAccion').empty().append('<option value="">(SELECCIONE)</option>');
        //    res.forEach(function (item) {
        //        $('#cboFiltroAnioAccion').append('<option value="' + item.anio + '">' + item.anio + '</option>');
        //        $('#cboAnioAccion').append('<option value="' + item.anio + '">' + item.anio + '</option>');
        //    });
        //});
        // Años del filtro del grid (los que ya tiene la obra)
        $.get(API + 'getAniosAccion/' + idobra, function (res) {
            $('#cboFiltroAnioAccion').find('option:not(:first)').remove();
            res.forEach(function (item) {
                $('#cboFiltroAnioAccion').append(
                    '<option value="' + item.anio + '">' + item.anio + '</option>');
            });
        });
        // También cargar todos los años del catálogo para nueva acción
        //$.get(API + 'getAnios', function (res) {
        //    $('#cboAnioAccion').empty().append('<option value="">(SELECCIONE)</option>');
        //    res.forEach(function (item) {
        //        $('#cboAnioAccion').append('<option value="' + item.Id + '">' + item.Nombre + '</option>');
        //    });
        //});
        $.get(API + 'getAnios', function (res) {
            $('#cboAnioAccion').empty().append('<option value="">(SELECCIONE)</option>');
            res.forEach(function (item) {
                $('#cboAnioAccion').append(
                    '<option value="' + item.Id + '">' + item.Nombre + '</option>');
            });
        });
        // Tipo Ejecución
        $.get(API + 'getTipoEjecucion', function (res) {
            $('#cboTipoEjecucionAccion').empty().append('<option value="">(SELECCIONE)</option>');
            res.forEach(function (i) {
                $('#cboTipoEjecucionAccion').append('<option value="' + i.id + '">' + i.nombre + '</option>');
            });
        });
        // Tipo Acción
        $.get(API + 'getTipoAccion', function (res) {
            $('#cboTipoAccion').empty().append('<option value="">(SELECCIONE)</option>');
            res.forEach(function (i) {
                $('#cboTipoAccion').append('<option value="' + i.id + '">' + i.nombre + '</option>');
            });
        });
        // Localidades
        $.get(API + 'getLocalidades', function (res) {
            $('#cboLocalidadAccion').empty().append('<option value="">(SELECCIONE)</option>');
            res.forEach(function (i) {
                $('#cboLocalidadAccion').append('<option value="' + i.id + '">' + i.nombre + '</option>');
            });
        });
        // Subrubro específico de la obra
        $.get(API + 'getSubrubroEspecifico/' + idobra, function (res) {
            $('#cboSubrubroEspecifico').empty().append('<option value="0">(SELECCIONE SUB-ESPECÍFICO)</option>');
            res.forEach(function (i) {
                $('#cboSubrubroEspecifico').append('<option value="' + i.id + '">' + i.nombre + '</option>');
            });
        });
    };

    var cargarTablaAcciones = function (idobra, anio) {
        $('#tbodyAcciones').html('<tr><td colspan="7" class="text-center py-3">' +
            '<i class="fas fa-spinner fa-spin text-primary"></i> Cargando...</td></tr>');

        $.get(API + 'getAcciones', { idobra: idobra, anio: anio })
            .done(function (data) {
                var $tbody = $('#tbodyAcciones').empty();
                $('#badgeTotalAcciones').text(data.length);

                if (!data.length) {
                    $tbody.html('<tr><td colspan="7" class="text-center text-muted py-4">' +
                        'Sin acciones registradas</td></tr>');
                    return;
                }

                data.forEach(function (a) {
                    var contratoHtml = a.contrato
                        ? '<span class="badge badge-light-success">' + a.contrato + '</span>'
                        : '<span class="text-muted small">Sin contrato</span>';

                    $tbody.append(
                        '<tr>' +
                        '<td><span class="badge badge-primary">' + (a.anio || '') + '</span></td>' +
                        '<td class="small">' + (a.tipoEjecucion || '') + '</td>' +
                        '<td style="font-size:0.82rem; max-width:220px;" title="' + (a.accion || '') + '">' +
                        (a.accion || '').substring(0, 60) + ((a.accion || '').length > 60 ? '...' : '') +
                        '</td>' +
                        '<td class="small">' + (a.tipoAccion || '') + '</td>' +
                        '<td class="small">' + (a.localidad || '') + '</td>' +
                        '<td>' + contratoHtml + '</td>' +
                        '<td class="text-center">' +
                        '<button type="button" class="btn btn-xs btn-icon btn-light-success mr-1" ' +
                        'onclick="ObrasModule.abrirOrigenes(' + a.idAccion + ')" title="Inversión">' +
                        '<i class="fas fa-dollar-sign"></i>' +
                        '</button>' +
                        '<button type="button" class="btn btn-xs btn-icon btn-light-warning mr-1" ' +
                        'onclick="ObrasModule.abrirContrato(' + a.idAccion + ',\'' + (a.accion || '').replace(/'/g, '') + '\')" title="Asignar Contrato">' +
                        '<i class="fas fa-file-contract"></i>' +
                        '</button>' +
                        (a.contrato
                            ? '<button type="button" class="btn btn-xs btn-icon btn-light-secondary mr-1" ' +
                            'onclick="ObrasModule.quitarContrato(' + a.idAccion + ')" title="Quitar Contrato">' +
                            '<i class="fas fa-unlink"></i></button>'
                            : '') +
                        '<button type="button" class="btn btn-xs btn-icon btn-light-primary mr-1" ' +
                        'onclick="ObrasModule.editarAccion(' + a.idAccion + ')" title="Modificar">' +
                        '<i class="fas fa-edit"></i>' +
                        '</button>' +
                        '<button type="button" class="btn btn-xs btn-icon btn-light-danger" ' +
                        'onclick="ObrasModule.eliminarAccion(' + a.idAccion + ')" title="Eliminar">' +
                        '<i class="fas fa-trash"></i>' +
                        '</button>' +
                        '</td>' +
                        '</tr>'
                    );
                });
            });
    };

    var limpiarFormAccion = function () {
        $('#cboAnioAccion, #cboTipoEjecucionAccion, #cboTipoAccion, #cboLocalidadAccion').val('');
        $('#cboSubrubroEspecifico').val('0');
        $('#txtAccion, #txtDescripcionObraAccion, #txtDescripcionLocalidadAccion').val('');
        $('#txtFinalidadAccion, #txtFuncionAccion, #txtSubfuncionAccion').val('');
        $('#txtProgramaAccion, #txtSubprogramaAccion, #txtProyectoAccion').val('');
        $('#txtBeneficiariosAccion').val('0');
        $('#txtTipoBeneficiarioAccion').val('');
        $('#chkDictamenFuente, #chkAutorizado, #chkLiberada').prop('checked', false);
    };

    var editarAccion = function (idAccion) {
        $('#hddAccionMovAccion').val('edit');
        $('#hddIdAccionActual').val(idAccion);
        $('#lblTituloFormAccion').text('Modificar Acción');
        limpiarFormAccion();

        $.get(API + 'getAccionById/' + idAccion, function (a) {
            $('#cboAnioAccion').val(a.anio);
            $('#cboTipoEjecucionAccion').val(a.idTipoEjecucion);
            $('#cboTipoAccion').val(a.idTipoAccion);
            $('#cboLocalidadAccion').val(a.idLocalidad);
            $('#cboSubrubroEspecifico').val(a.idSubrubroEspecifico || '0');
            $('#txtAccion').val(a.accion);
            $('#txtBeneficiariosAccion').val(a.beneficiarios || 0);
            $('#txtTipoBeneficiarioAccion').val(a.tipoBeneficiario || '');
            $('#chkDictamenFuente').prop('checked', a.dictamenFuente);
            $('#chkAutorizado').prop('checked', a.autorizado);
            $('#chkLiberada').prop('checked', a.liberada);
            $('#txtDescripcionObraAccion').val(a.descripcionObra || '');
            $('#txtDescripcionLocalidadAccion').val(a.descripcionLocalidad || '');
            $('#txtFinalidadAccion').val(a.finalidad || '');
            $('#txtFuncionAccion').val(a.funcion || '');
            $('#txtSubfuncionAccion').val(a.subfuncion || '');
            $('#txtProgramaAccion').val(a.programa || '');
            $('#txtSubprogramaAccion').val(a.subprograma || '');
            $('#txtProyectoAccion').val(a.proyecto || '');
            mostrarPanelAcciones('form');
        });
    };

    var guardarAccion = function () {
        if (!$('#cboAnioAccion').val()) {
            Swal.fire('Validación', 'Seleccione el Año.', 'warning'); return;
        }
        if (!$('#cboTipoEjecucionAccion').val()) {
            Swal.fire('Validación', 'Seleccione el Tipo de Ejecución.', 'warning'); return;
        }
        if (!$('#txtAccion').val().trim()) {
            Swal.fire('Validación', 'Escriba la Acción.', 'warning'); return;
        }

        var payload = {
            idobra: $('#hddIdObraAcciones').val(),
            idAccion: $('#hddIdAccionActual').val(),
            accion: $('#hddAccionMovAccion').val(),
            anio: $('#cboAnioAccion').val(),
            idTipoEjecucion: $('#cboTipoEjecucionAccion').val(),
            accionTexto: $('#txtAccion').val().toUpperCase(),
            idTipoAccion: $('#cboTipoAccion').val() || '0',
            idSubrubroEspecifico: $('#cboSubrubroEspecifico').val() || '0',
            idLocalidad: $('#cboLocalidadAccion').val() || '0',
            beneficiarios: $('#txtBeneficiariosAccion').val() || '0',
            tipoBeneficiario: $('#txtTipoBeneficiarioAccion').val(),
            dictamenFuente: $('#chkDictamenFuente').is(':checked'),
            autorizado: $('#chkAutorizado').is(':checked'),
            liberada: $('#chkLiberada').is(':checked'),
            descripcionObra: $('#txtDescripcionObraAccion').val(),
            descripcionLocalidad: $('#txtDescripcionLocalidadAccion').val(),
            finalidad: $('#txtFinalidadAccion').val(),
            funcion: $('#txtFuncionAccion').val(),
            subfuncion: $('#txtSubfuncionAccion').val(),
            programa: $('#txtProgramaAccion').val(),
            subprograma: $('#txtSubprogramaAccion').val(),
            proyecto: $('#txtProyectoAccion').val(),
            cveMunicipio: '061'
        };

        $.ajax({
            url: API + 'guardarAccion',
            type: 'POST',
            contentType: 'application/json',
            data: JSON.stringify(payload),
            //success: function () {
            //    mostrarPanelAcciones('grid');
            //    limpiarFormAccion();
            //    cargarTablaAcciones($('#hddIdObraAcciones').val(), $('#cboFiltroAnioAccion').val());
            //    Swal.fire({
            //        title: '¡Éxito!',
            //        text: payload.accion === 'add' ? 'Acción agregada.' : 'Acción actualizada.',
            //        icon: 'success', timer: 1500, showConfirmButton: false
            //    });
            //},
            success: function () {
                limpiarFormAccion();

                // Actualizar años del filtro si es nueva acción
                if (payload.accion === 'add') {
                    $.get(API + 'getAniosAccion/' + $('#hddIdObraAcciones').val(), function (res) {
                        $('#cboFiltroAnioAccion').find('option:not(:first)').remove();
                        res.forEach(function (item) {
                            $('#cboFiltroAnioAccion').append(
                                '<option value="' + item.anio + '">' + item.anio + '</option>');
                        });
                        $('#cboFiltroAnioAccion').val(payload.anio);
                    });
                }
                // Cargar tabla y DESPUÉS mostrar panel y Swal
                $.get(API + 'getAcciones', {
                    idobra: $('#hddIdObraAcciones').val(),
                    anio: payload.accion === 'add' ? payload.anio : $('#cboFiltroAnioAccion').val()
                }).done(function (data) {
                    mostrarPanelAcciones('grid');

                    var $tbody = $('#tbodyAcciones').empty();
                    $('#badgeTotalAcciones').text(data.length);

                    if (!data.length) {
                        $tbody.html('<tr><td colspan="7" class="text-center text-muted py-4">' +
                            'Sin acciones registradas</td></tr>');
                    } else {
                        data.forEach(function (a) {
                            var contratoHtml = a.contrato
                                ? '<span class="badge badge-light-success">' + a.contrato + '</span>'
                                : '<span class="text-muted small">Sin contrato</span>';
                            $tbody.append(
                                '<tr>' +
                                '<td><span class="badge badge-primary">' + (a.anio || '') + '</span></td>' +
                                '<td class="small">' + (a.tipoEjecucion || '') + '</td>' +
                                '<td style="font-size:0.82rem; max-width:220px;" title="' + (a.accion || '') + '">' +
                                (a.accion || '').substring(0, 60) +
                                ((a.accion || '').length > 60 ? '...' : '') + '</td>' +
                                '<td class="small">' + (a.tipoAccion || '') + '</td>' +
                                '<td class="small">' + (a.localidad || '') + '</td>' +
                                '<td>' + contratoHtml + '</td>' +
                                '<td class="text-center">' +
                                '<button type="button" class="btn btn-xs btn-icon btn-light-success mr-1" ' +
                                'onclick="ObrasModule.abrirOrigenes(' + a.idAccion + ')" title="Inversión">' +
                                '<i class="fas fa-dollar-sign"></i></button>' +
                                '<button type="button" class="btn btn-xs btn-icon btn-light-warning mr-1" ' +
                                'onclick="ObrasModule.abrirContrato(' + a.idAccion + ',\'' +
                                (a.accion || '').replace(/'/g, '') + '\')" title="Asignar Contrato">' +
                                '<i class="fas fa-file-contract"></i></button>' +
                                (a.contrato
                                    ? '<button type="button" class="btn btn-xs btn-icon btn-light-secondary mr-1" ' +
                                    'onclick="ObrasModule.quitarContrato(' + a.idAccion + ')" title="Quitar Contrato">' +
                                    '<i class="fas fa-unlink"></i></button>'
                                    : '') +
                                '<button type="button" class="btn btn-xs btn-icon btn-light-primary mr-1" ' +
                                'onclick="ObrasModule.editarAccion(' + a.idAccion + ')" title="Modificar">' +
                                '<i class="fas fa-edit"></i></button>' +
                                '<button type="button" class="btn btn-xs btn-icon btn-light-danger" ' +
                                'onclick="ObrasModule.eliminarAccion(' + a.idAccion + ')" title="Eliminar">' +
                                '<i class="fas fa-trash"></i></button>' +
                                '</td></tr>'
                            );
                        });
                    }
                    Swal.fire({
                        title: '¡Éxito!',
                        text: payload.accion === 'add' ? 'Acción agregada.' : 'Acción actualizada.',
                        icon: 'success', timer: 1500, showConfirmButton: false
                    });
                });
            },
            error: function (xhr) { Swal.fire('Error', xhr.responseText, 'error'); }
        });
    };

    var eliminarAccion = function (idAccion) {
        Swal.fire({
            title: '¿Eliminar acción?',
            text: 'Verifique que no tenga inversión registrada.',
            icon: 'warning', showCancelButton: true,
            confirmButtonText: 'Sí, eliminar',
            cancelButtonText: 'Cancelar',
            confirmButtonColor: '#F64E60'
        }).then(function (result) {
            if (result.value) {
                $.ajax({
                    url: API + 'eliminarAccion/' + idAccion,
                    type: 'DELETE',
                    success: function () {
                        cargarTablaAcciones($('#hddIdObraAcciones').val(), $('#cboFiltroAnioAccion').val());
                        Swal.fire({ title: 'Eliminada', icon: 'success', timer: 1500, showConfirmButton: false });
                    },
                    error: function (xhr) { Swal.fire('Error', xhr.responseText, 'error'); }
                });
            }
        });
    };

    // ── Origen de Inversión ──────────────────────────────────────────

    var abrirOrigenes = function (idAccion) {
        $('#hddIdAccionActual').val(idAccion);
        $('#panelFormOrigen, #panelCOCI').hide();

        $.get(API + 'getAccionById/' + idAccion, function (a) {
            $('#lblAccionOrigen').text(a.accion || '');
            $('#lblAnioOrigen').text(a.anio || '');
        });

        // Cargar catálogos de origen
        $.get(API + 'getOrigenFuente', function (res) {
            $('#cboOrigenFuente').empty().append('<option value="">(SELECCIONE)</option>');
            res.forEach(function (i) {
                $('#cboOrigenFuente').append('<option value="' + i.id + '">' + i.nombre + '</option>');
            });
        });
        $.get(API + 'getFuenteFinanciamiento', function (res) {
            $('#cboFuenteFinanciamiento').empty().append('<option value="">(SELECCIONE)</option>');
            res.forEach(function (i) {
                $('#cboFuenteFinanciamiento').append('<option value="' + i.id + '">' + i.nombre + '</option>');
            });
        });

        cargarTablaOrigenes(idAccion);
        mostrarPanelAcciones('origenes');
    };

    var cargarTablaOrigenes = function (idAccion) {
        $('#tbodyOrigenes').html('<tr><td colspan="5" class="text-center py-3">' +
            '<i class="fas fa-spinner fa-spin text-success"></i></td></tr>');

        $.get(API + 'getOrigenes/' + idAccion)
            .done(function (data) {
                var $tbody = $('#tbodyOrigenes').empty();
                $('#badgeTotalOrigenes').text(data.length);

                if (!data.length) {
                    $tbody.html('<tr><td colspan="5" class="text-center text-muted py-3">' +
                        'Sin registros de inversión</td></tr>');
                    return;
                }

                data.forEach(function (o) {
                    $tbody.append(
                        '<tr>' +
                        '<td><span class="badge badge-light-success">' + (o.origen || '') + '</span></td>' +
                        '<td>' + (o.fuente || '') + '</td>' +
                        '<td class="text-right font-weight-bold">$' +
                        parseFloat(o.inversion || 0).toLocaleString('es-MX', { minimumFractionDigits: 2 }) +
                        '</td>' +
                        '<td>' + (o.fechaVencimiento || '') + '</td>' +
                        '<td class="text-center">' +
                        '<button type="button" class="btn btn-xs btn-icon btn-light-danger mr-1" ' +
                        'onclick="ObrasModule.abrirCOCI(' + o.idFuente + ',\'CO\',\'' + (o.fuente || '') + '\')" title="Costo Obra (CO)">' +
                        '<span class="font-weight-bold text-danger" style="font-size:10px;">CO</span>' +
                        '</button>' +
                        '<button type="button" class="btn btn-xs btn-icon btn-light-warning mr-1" ' +
                        'onclick="ObrasModule.abrirCOCI(' + o.idFuente + ',\'CI\',\'' + (o.fuente || '') + '\')" title="Costo Indirecto (CI)">' +
                        '<span class="font-weight-bold text-warning" style="font-size:10px;">CI</span>' +
                        '</button>' +
                        '<button type="button" class="btn btn-xs btn-icon btn-light-primary mr-1" ' +
                        'onclick="ObrasModule.editarOrigen(' + o.idFuente + ')" title="Modificar">' +
                        '<i class="fas fa-edit"></i>' +
                        '</button>' +
                        '<button type="button" class="btn btn-xs btn-icon btn-light-danger" ' +
                        'onclick="ObrasModule.eliminarOrigen(' + o.idFuente + ')" title="Eliminar">' +
                        '<i class="fas fa-trash"></i>' +
                        '</button>' +
                        '</td>' +
                        '</tr>'
                    );
                });
            });
    };

    var editarOrigen = function (idFuente) {
        $('#hddIdOrigenActual').val(idFuente);
        $('#hddAccionMovOrigen').val('edit');
        $('#lblTituloFormOrigen').text('Modificar Origen');

        $.get(API + 'getOrigenById/' + idFuente, function (o) {
            $('#cboOrigenFuente').val(o.idOrigen);
            $('#cboFuenteFinanciamiento').val(o.idFuente);
            $('#txtInversionOrigen').val(parseFloat(o.inversion || 0).toFixed(2));
            $('#txtFechaVencimientoOrigen').val(o.fechaVencimiento || '');
            $('#panelFormOrigen').show();
        });
    };

    var guardarOrigen = function () {
        if (!$('#cboOrigenFuente').val()) {
            Swal.fire('Validación', 'Seleccione el Origen.', 'warning'); return;
        }
        if (!$('#cboFuenteFinanciamiento').val()) {
            Swal.fire('Validación', 'Seleccione la Fuente de Financiamiento.', 'warning'); return;
        }
        if (!$('#txtInversionOrigen').val() || parseFloat($('#txtInversionOrigen').val()) <= 0) {
            Swal.fire('Validación', 'Ingrese un monto de inversión válido.', 'warning'); return;
        }
        if (!$('#txtFechaVencimientoOrigen').val()) {
            Swal.fire('Validación', 'Ingrese la fecha de vencimiento.', 'warning'); return;
        }

        var payload = {
            idAccion: $('#hddIdAccionActual').val(),
            idFuente: $('#hddIdOrigenActual').val(),
            accion: $('#hddAccionMovOrigen').val(),
            idOrigen: $('#cboOrigenFuente').val(),
            idFuenteFinanciamiento: $('#cboFuenteFinanciamiento').val(),
            inversion: $('#txtInversionOrigen').val(),
            fechaVencimiento: $('#txtFechaVencimientoOrigen').val()
        };

        $.ajax({
            url: API + 'guardarOrigen',
            type: 'POST',
            contentType: 'application/json',
            data: JSON.stringify(payload),
            success: function () {
                $('#panelFormOrigen').hide();
                $('#hddAccionMovOrigen').val('add');
                $('#hddIdOrigenActual').val('');
                $('#cboOrigenFuente, #cboFuenteFinanciamiento').val('');
                $('#txtInversionOrigen').val('0');
                $('#txtFechaVencimientoOrigen').val('');
                cargarTablaOrigenes($('#hddIdAccionActual').val());
                Swal.fire({ title: '¡Éxito!', icon: 'success', timer: 1500, showConfirmButton: false });
            },
            error: function (xhr) { Swal.fire('Error', xhr.responseText, 'error'); }
        });
    };

    var eliminarOrigen = function (idFuente) {
        Swal.fire({
            title: '¿Eliminar inversión?',
            text: 'Verifique que no tenga COCI registrado.',
            icon: 'warning', showCancelButton: true,
            confirmButtonText: 'Sí, eliminar', cancelButtonText: 'Cancelar',
            confirmButtonColor: '#F64E60'
        }).then(function (result) {
            if (result.value) {
                $.ajax({
                    url: API + 'eliminarOrigen/' + idFuente,
                    type: 'DELETE',
                    success: function () {
                        cargarTablaOrigenes($('#hddIdAccionActual').val());
                        Swal.fire({ title: 'Eliminado', icon: 'success', timer: 1500, showConfirmButton: false });
                    },
                    error: function (xhr) { Swal.fire('Error', xhr.responseText, 'error'); }
                });
            }
        });
    };

    // ── COCI ────────────────────────────────────────────────────────

    var abrirCOCI = function (idFuente, status, nombreFuente) {
        $('#hddIdFuenteActual').val(idFuente);
        $('#hddStatusCOCI').val(status);
        $('#lblTituloCOCI').text(status === 'CO' ? 'Costo Obra (CO)' : 'Costo Indirecto (CI)');
        $('#lblFuenteCOCI').text(nombreFuente || '');
        $('#panelFormCOCI').hide();
        cargarTablaCOCI(idFuente, status);
        $('#panelCOCI').show();
    };

    var cargarTablaCOCI = function (idFuente, status) {
        $('#tbodyCOCI').html('<tr><td colspan="3" class="text-center py-3">' +
            '<i class="fas fa-spinner fa-spin text-danger"></i></td></tr>');

        $.get(API + 'getCOCI', { idFuente: idFuente, status: status })
            .done(function (data) {
                var $tbody = $('#tbodyCOCI').empty();
                $('#badgeTotalCOCI').text(data.length);

                if (!data.length) {
                    $tbody.html('<tr><td colspan="3" class="text-center text-muted py-3">Sin registros</td></tr>');
                    return;
                }

                var totalInversion = 0;
                data.forEach(function (c) {
                    totalInversion += parseFloat(c.inversion || 0);
                    $tbody.append(
                        '<tr>' +
                        '<td class="font-weight-bold">' + (c.cvePresupuestal || '') + '</td>' +
                        '<td class="text-right">$' +
                        parseFloat(c.inversion || 0).toLocaleString('es-MX', { minimumFractionDigits: 2 }) +
                        '</td>' +
                        '<td class="text-center">' +
                        '<button type="button" class="btn btn-xs btn-icon btn-light-primary mr-1" ' +
                        'onclick="ObrasModule.editarCOCI(' + c.idCoci + ')" title="Modificar">' +
                        '<i class="fas fa-edit"></i>' +
                        '</button>' +
                        '<button type="button" class="btn btn-xs btn-icon btn-light-danger" ' +
                        'onclick="ObrasModule.eliminarCOCI(' + c.idCoci + ')" title="Eliminar">' +
                        '<i class="fas fa-trash"></i>' +
                        '</button>' +
                        '</td>' +
                        '</tr>'
                    );
                });
                // Fila total
                $tbody.append(
                    '<tr class="font-weight-bold bg-light-danger">' +
                    '<td class="text-right">TOTAL:</td>' +
                    '<td class="text-right text-danger">$' +
                    totalInversion.toLocaleString('es-MX', { minimumFractionDigits: 2 }) +
                    '</td><td></td></tr>'
                );
            });
    };

    var editarCOCI = function (idCoci) {
        $('#hddIdCOCIActual').val(idCoci);
        $('#hddAccionMovCOCI').val('edit');

        $.get(API + 'getCOCIById/' + idCoci, function (c) {
            $('#txtCvePresupuestal').val(c.cvePresupuestal || '');
            $('#txtInversionCOCI').val(parseFloat(c.inversion || 0).toFixed(2));
            $('#panelFormCOCI').show();
        });
    };

    var guardarCOCI = function () {
        if (!$('#txtCvePresupuestal').val().trim()) {
            Swal.fire('Validación', 'Escriba el Folio MIDS / Clave Presupuestal.', 'warning'); return;
        }
        if (!$('#txtInversionCOCI').val() || parseFloat($('#txtInversionCOCI').val()) <= 0) {
            Swal.fire('Validación', 'Ingrese un monto válido.', 'warning'); return;
        }

        var payload = {
            idFuente: $('#hddIdFuenteActual').val(),
            idCoci: $('#hddIdCOCIActual').val(),
            accion: $('#hddAccionMovCOCI').val(),
            status: $('#hddStatusCOCI').val(),
            cvePresupuestal: $('#txtCvePresupuestal').val().toUpperCase(),
            inversion: $('#txtInversionCOCI').val()
        };

        $.ajax({
            url: API + 'guardarCOCI',
            type: 'POST',
            contentType: 'application/json',
            data: JSON.stringify(payload),
            success: function () {
                $('#panelFormCOCI').hide();
                $('#hddAccionMovCOCI').val('add');
                $('#hddIdCOCIActual').val('');
                $('#txtCvePresupuestal').val('');
                $('#txtInversionCOCI').val('0');
                cargarTablaCOCI($('#hddIdFuenteActual').val(), $('#hddStatusCOCI').val());
                Swal.fire({ title: '¡Éxito!', icon: 'success', timer: 1500, showConfirmButton: false });
            },
            error: function (xhr) { Swal.fire('Error', xhr.responseText, 'error'); }
        });
    };

    var eliminarCOCI = function (idCoci) {
        Swal.fire({
            title: '¿Eliminar COCI?', text: 'Esta acción no se puede deshacer.',
            icon: 'warning', showCancelButton: true,
            confirmButtonText: 'Sí, eliminar', cancelButtonText: 'Cancelar',
            confirmButtonColor: '#F64E60'
        }).then(function (result) {
            if (result.value) {
                $.ajax({
                    url: API + 'eliminarCOCI/' + idCoci,
                    type: 'DELETE',
                    success: function () {
                        cargarTablaCOCI($('#hddIdFuenteActual').val(), $('#hddStatusCOCI').val());
                        Swal.fire({ title: 'Eliminado', icon: 'success', timer: 1500, showConfirmButton: false });
                    },
                    error: function (xhr) { Swal.fire('Error', xhr.responseText, 'error'); }
                });
            }
        });
    };

    // ── Contrato ─────────────────────────────────────────────────────

    var abrirContrato = function (idAccion, nombreAccion) {
        $('#hddIdAccionActual').val(idAccion);
        $('#lblAccionContrato').text(nombreAccion);
        $('#txtBuscarContrato, #txtContratoSeleccionado').val('');
        $('#hddIdContratoBuscar').val('');
        $('#listaContratos').empty();
        mostrarPanelAcciones('contrato');
    };

    var quitarContrato = function (idAccion) {
        Swal.fire({
            title: '¿Quitar contrato?',
            text: 'Se desvinculará el contrato de esta acción.',
            icon: 'warning', showCancelButton: true,
            confirmButtonText: 'Sí, quitar', cancelButtonText: 'Cancelar'
        }).then(function (result) {
            if (result.value) {
                $.ajax({
                    url: API + 'quitarContrato/' + idAccion,
                    type: 'POST',
                    success: function () {
                        cargarTablaAcciones($('#hddIdObraAcciones').val(), $('#cboFiltroAnioAccion').val());
                        Swal.fire({ title: 'Listo', icon: 'success', timer: 1500, showConfirmButton: false });
                    },
                    error: function (xhr) { Swal.fire('Error', xhr.responseText, 'error'); }
                });
            }
        });
    };

    // ══════════════════════════════════════════════════════
    // OBRAS / PROYECTOS
    // ══════════════════════════════════════════════════════

    var limpiarFormularioObra = function () {

        $('#txtNoObra').val('');
        $('#txtNombreObra').val('');
        $('#txtAntecedentes').val('');
        $('#txtObservaciones').val('');
        $('#txtAcciones').val('0');

        $('#chkFranja').prop('checked', false);

        $('#cmbRubroModal').val('');
        $('#cmbSubrubroModal').empty();

        $('#cmbPrograma').val('');
        $('#cmbArea').val('');
        $('#cmbMarginacion').val('');
        $('#cmbTipoObra').val('');

    };
    //funcion guardar
    var guardarObra = function () {

        if (!$('#txtNoObra').val()) return Swal.fire('Error', 'Número de obra requerido', 'warning');
        if (!$('#txtNombreObra').val()) return Swal.fire('Error', 'Nombre requerido', 'warning');
        if (!$('#cmbRubroModal').val()) return Swal.fire('Error', 'Seleccione rubro', 'warning');
        if (!$('#cmbSubrubroModal').val()) return Swal.fire('Error', 'Seleccione subrubro', 'warning');

        var data = {
            idobra: idObra,
            noObra: $('#txtNoObra').val(),
            nombre: $('#txtNombreObra').val(),
            idRubro: $('#cmbRubroModal').val(),
            idSubrubro: $('#cmbSubrubroModal').val(),
            idPrograma: $('#cmbPrograma').val(),
            idArea: $('#cmbArea').val(),
            idNivelMarginacion: $('#cmbMarginacion').val(),
            idAprima: $('#cmbTipoObra').val(),
            acciones: $('#txtAcciones').val(),
            franja: $('#chkFranja').is(':checked'),
            antecedentes: $('#txtAntecedentes').val(),
            observaciones: $('#txtObservaciones').val()
        };

        var url = 'guardarObra';

        $.ajax({
            url: API + url,
            type: 'POST',
            data: JSON.stringify(data),
            contentType: 'application/json',
            success: function () {
                $('#modalObra').modal('hide');
                Swal.fire('OK', 'Guardado correctamente', 'success');
                // 🔹 LIMPIAR FILTROS
                //$('#cmbRubro').val('');
                //$('#cmbAnio').val('');
                //$('#txtContrato').val('');
                //$('#txtNombre').val('');
                //$('#txtNoObraBuscar').val('');
                $('#filterRubro').val('').selectpicker('refresh');
                $('#filterAnio').val('').selectpicker('refresh');
                $('#filterContrato').val('');
                $('#filterNombre').val('');
                $('#filterNumObra').val('');
                buscar();
            },
            error: function (xhr) {
                Swal.fire('Error', xhr.responseText, 'error');
            }
        });
    };
    var cargarCombosModal = function () {

        $.get(API + 'getRubros', function (res) {
            var $cmb = $('#cmbRubroModal');
            $cmb.empty().append('<option value="">(SELECCIONE)</option>');
            res.forEach(x => $cmb.append(`<option value="${x.Id}">${x.Nombre}</option>`));
        });

        $.get(API + 'getProgramas', function (res) {
            var $cmb = $('#cmbPrograma');
            $cmb.empty().append('<option value="">(SELECCIONE)</option>');
            res.forEach(x => $cmb.append(`<option value="${x.Id}">${x.Nombre}</option>`));
        });

        $.get(API + 'getAreas', function (res) {
            var $cmb = $('#cmbArea');
            $cmb.empty().append('<option value="">(SELECCIONE)</option>');
            res.forEach(x => $cmb.append(`<option value="${x.Id}">${x.Nombre}</option>`));
        });

        $.get(API + 'getMarginacion', function (res) {
            var $cmb = $('#cmbMarginacion');
            $cmb.empty().append('<option value="">(SELECCIONE)</option>');
            res.forEach(x => $cmb.append(`<option value="${x.Id}">${x.Nombre}</option>`));
        });

        $.get(API + 'getTipoObra', function (res) {
            var $cmb = $('#cmbTipoObra');
            $cmb.empty().append('<option value="">(SELECCIONE)</option>');
            res.forEach(x => $cmb.append(`<option value="${x.Id}">${x.Nombre}</option>`));
        });
    };

    // ══════════════════════════════════════════════════════
    // INIT
    // ══════════════════════════════════════════════════════

    var init = function () {
        // 1. Inicializar selectpickers antes de cargar datos
        $('#filterRubro, #filterAnio').selectpicker({
            liveSearch: true,
            size: 8
            /*noneSelectedText: '(TODOS)'*/
        });
        
        // 2. Cargar catálogos — flag para no buscar mientras cargan
        //window._catalogosCargando = 2; // contador: 2 catálogos pendientes
        //cargarRubros();
        //cargarAnios();
        // Esperar a que terminen ambos catálogos
        $.when(
            cargarRubros(),
            cargarAnios()
        ).done(function () {

            // 🔹 Disparar el botón Buscar automáticamente
            $('#btnBuscarObras').trigger('click');

        });

        // 3. ✅ Autocomplete PROPIO para Contrato y Núm.Obra (sin jQuery UI)
        crearAutocomplete('filterContrato', API + 'getContratosAutocomplete', 2);
        crearAutocomplete('filterNumObra', API + 'getNumObrasAutocomplete', 1);
        crearAutocomplete('filterNombre', API + 'getNombresAutocomplete', 3); // ✅ nuevo
        // 4. Eventos de botones
        $('#btnBuscarObras').on('click', buscar);
        $('#btnLimpiarObras').on('click', limpiarFiltros);
        $('#btnNuevaObra').on('click', agregarObra);
        

        // 5. Buscar con Enter en los inputs de texto
        $('#filterNombre, #filterContrato, #filterNumObra').on('keypress', function (e) {
            if (e.which === 13) buscar();
        });

        // 6. Buscar automáticamente al cambiar rubro o año
        $('#filterRubro, #filterAnio').on('changed.bs.select', function () {
            if (window._catalogosCargando > 0) return; // catálogos aún cargando
            buscar();
        });
        // 7. Cargar subrubros al seleccionar un rubro en el modal
        $('#cmbRubroModal').on('change', function () {
            var id = $(this).val();
            var $sub = $('#cmbSubrubroModal');
            // 🔹 SI NO HAY RUBRO → LIMPIAR SUBRUBRO
            if (!id) {
                $sub.empty().append('<option value="">(SELECCIONE)</option>');
                $('#cmbArea').empty().append('<option value="">(SELECCIONE)</option>');
                return;
            }
            // 🔹 SI HAY RUBRO → CARGAR
            $.get(API + 'getSubrubros/' + id, function (res) {
                $sub.empty().append('<option value="">(SELECCIONE)</option>');
                res.forEach(function (x) {
                    $sub.append('<option value="' + x.Id + '">' + x.Nombre + '</option>');
                });

            });
            // 🔹 AREA (DEPENDIENTE DE RUBRO)
            $.get(API + 'getAreasByRubro/' + id, function (res) {
                var $area = $('#cmbArea');
                $area.empty().append('<option value="">(SELECCIONE)</option>');
                res.forEach(x => $area.append(`<option value="${x.Id}">${x.Nombre}</option>`));
            });

        });

        // Localidades
        $('#btnNuevaLocalidad').on('click', function () {
            $('#hddAccionLocalidad').val('add');
            $('#hddIdLocalidadDetalle').val('');
            $('#cboLocalidad').val('');
            $('#lblTituloFormLocalidad').text('Agregar Localidad');
            $('#panelFormLocalidad').show();
        });

        $('#btnGuardarLocalidad').on('click', function () {
            ObrasModule.guardarLocalidad();
        });

        $('#btnCancelarLocalidad').on('click', function () {
            $('#panelFormLocalidad').hide();
            $('#hddAccionLocalidad').val('add');
            $('#hddIdLocalidadDetalle').val('');
            $('#cboLocalidad').val('');
        });

        // ── Eventos Acciones ──
        $('#cboFiltroAnioAccion').on('change', function () {
            cargarTablaAcciones($('#hddIdObraAcciones').val(), $(this).val());
        });
        $('#btnNuevaAccion').on('click', function () {
            $('#hddAccionMovAccion').val('add');
            $('#hddIdAccionActual').val('');
            $('#lblTituloFormAccion').text('Nueva Acción');
            limpiarFormAccion();
            mostrarPanelAcciones('form');
        });
        $('#btnCancelarAccion').on('click', function () {
            mostrarPanelAcciones('grid');
            limpiarFormAccion();
        });
        $('#btnGuardarAccion').on('click', function () { guardarAccion(); });

        // ── Eventos Origen ──
        $('#btnRegresarOrigenes').on('click', function () { mostrarPanelAcciones('grid'); });
        $('#btnNuevoOrigen').on('click', function () {
            $('#hddAccionMovOrigen').val('add');
            $('#hddIdOrigenActual').val('');
            $('#lblTituloFormOrigen').text('Agregar Origen');
            $('#cboOrigenFuente, #cboFuenteFinanciamiento').val('');
            $('#txtInversionOrigen').val('0');
            $('#txtFechaVencimientoOrigen').val('');
            $('#panelFormOrigen').show();
        });
        $('#btnGuardarOrigen').on('click', function () { guardarOrigen(); });
        $('#btnCancelarOrigen').on('click', function () { $('#panelFormOrigen').hide(); });

        // ── Eventos COCI ──
        $('#btnRegresarCOCI').on('click', function () { $('#panelCOCI').hide(); });
        $('#btnNuevoCOCI').on('click', function () {
            $('#hddAccionMovCOCI').val('add');
            $('#hddIdCOCIActual').val('');
            $('#txtCvePresupuestal').val('');
            $('#txtInversionCOCI').val('0');
            $('#panelFormCOCI').show();
        });
        $('#btnGuardarCOCI').on('click', function () { guardarCOCI(); });
        $('#btnCancelarCOCI').on('click', function () { $('#panelFormCOCI').hide(); });

        // ── Eventos Contrato ──
        $('#btnRegresarContrato').on('click', function () { mostrarPanelAcciones('grid'); });
        $('#btnBuscarContrato').on('click', function () {
            var term = $('#txtBuscarContrato').val();
            if (!term) return;
            $.get(API + 'getContratosDisponibles', { term: term }, function (data) {
                var $lista = $('#listaContratos').empty();
                if (!data.length) {
                    $lista.append('<div class="list-group-item text-muted small">Sin resultados</div>');
                    return;
                }
                data.forEach(function (c) {
                    $lista.append(
                        '<button type="button" class="list-group-item list-group-item-action small" ' +
                        'onclick="$(\'#txtContratoSeleccionado\').val(\'' + c.numContrato + '\');' +
                        '$(\'#hddIdContratoBuscar\').val(\'' + c.idContrato + '\');' +
                        '$(\'#listaContratos\').empty();">' +
                        c.numContrato + ' — ' + (c.descripcion || '') +
                        '</button>'
                    );
                });
            });
        });
        $('#txtBuscarContrato').on('keypress', function (e) {
            if (e.which === 13) $('#btnBuscarContrato').click();
        });
        $('#btnAsignarContrato').on('click', function () {
            var idContrato = $('#hddIdContratoBuscar').val();
            if (!idContrato) {
                Swal.fire('Aviso', 'Seleccione un contrato de la lista.', 'warning'); return;
            }
            $.ajax({
                url: API + 'asignarContrato',
                type: 'POST',
                contentType: 'application/json',
                data: JSON.stringify({
                    idAccion: $('#hddIdAccionActual').val(),
                    idContrato: idContrato
                }),
                success: function () {
                    mostrarPanelAcciones('grid');
                    cargarTablaAcciones($('#hddIdObraAcciones').val(), $('#cboFiltroAnioAccion').val());
                    Swal.fire({ title: '¡Contrato asignado!', icon: 'success', timer: 1500, showConfirmButton: false });
                },
                error: function (xhr) { Swal.fire('Error', xhr.responseText, 'error'); }
            });
        });

    };

    // ══════════════════════════════════════════════════════
    // API PÚBLICA
    // ══════════════════════════════════════════════════════

    return {
        init: init,
        buscar: buscar,
        agregarObra: agregarObra,
        modificarObra: modificarObra,
        eliminarObra: eliminarObra,
        verAcciones: verAcciones,
        guardarObra: guardarObra,   // 👈 AGREGAR ESTA LÍNEA
        //LOCALIDADES
        verLocalidades: verLocalidades,
        editarLocalidad: editarLocalidad,
        eliminarLocalidad: eliminarLocalidad,
        guardarLocalidad: guardarLocalidad,

        verAcciones: verAcciones,
        editarAccion: editarAccion,
        eliminarAccion: eliminarAccion,
        abrirOrigenes: abrirOrigenes,
        editarOrigen: editarOrigen,
        eliminarOrigen: eliminarOrigen,
        abrirCOCI: abrirCOCI,
        editarCOCI: editarCOCI,
        eliminarCOCI: eliminarCOCI,
        abrirContrato: abrirContrato,
        quitarContrato: quitarContrato,
        guardarAccion: guardarAccion,
        guardarOrigen: guardarOrigen,
        guardarCOCI: guardarCOCI
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
// Inicializar al cargar la página
$(document).ready(function () {
    ObrasModule.init();
    Clock.init();
});
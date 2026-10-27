<%@ Page Title="" Language="C#" MasterPageFile="~/Site1.Master" AutoEventWireup="true" CodeBehind="CedulaVerificacionSeguimiento.aspx.cs" Inherits="Ceduver.CedulaVerificacionSeguimiento" %>
<asp:Content ID="Content1" ContentPlaceHolderID="head" runat="server">
<style>
    .modal-dialog-custom { max-width: 95%; }
    .table-header-info td { padding: 5px 10px; font-size: 12px; }
    .table-header-info td:first-child { font-weight: bold; background-color: #f3f6f9; }
    .foto-preview { max-width: 150px; max-height: 150px; border: 1px solid #ddd; margin: 5px; }
    .icon-btn { cursor: pointer; margin: 0 2px; }
    .icon-btn:hover { opacity: 0.7; }
    .required-field::after { content: " *"; color: red; }
    .btn-folder i { color: #FFA800 !important; }   /* carpeta */
    .btn-money i { color: #1BC5BD !important; }    /* dinero */
    .btn-print i { color: #181C32 !important; }    /* impresora */
    .btn-check i { color: #28a745 !important; }    /* check */
</style>
<style type="text/css">
        .ui-autocomplete {
            max-height: 300px;
            overflow-y: auto;
            overflow-x: hidden;
            font-size:25px;
        }
        * html .ui-autocomplete {
            height: 300px;
        }
     .style1 {
            font-size: 11px;
            text-align: left;
            font-weight: Bold;
            width: 218px;
            padding-left: 3px;
        }
     .btn-icon {
            width: 34px;
            height: 34px;
            margin: 2px;
            border-radius: 6px;
        }
</style>
<style>
    /* Foto preview cuando ya existe */
    .fism-foto-preview img {
        transition: transform .2s;
    }
    .fism-foto-preview img:hover {
        transform: scale(1.03);
        box-shadow: 0 4px 12px rgba(0,0,0,.2);
    }
    /* Etiqueta custom-file en español */
    .custom-file-input:lang(es) ~ .custom-file-label::after { content: "Examinar"; }
    /* Actualizar etiqueta al seleccionar archivo */
</style>
</asp:Content>
<asp:Content ID="Content2" ContentPlaceHolderID="ContentPlaceHolder1" runat="server">
    <div class="content d-flex flex-column flex-column-fluid" id="kt_content" style="padding: 4px 0;">
        <div class="container-fluid">
            <!-- TITULO -->
            <div class="card card-custom gutter-b">
                <div class="card-header" style="background:linear-gradient(135deg, var(--mg-primary-dark) 0%, var(--mg-primary) 100%);">
                    <div class="card-title">
                        <h3 class="card-label" style="color:white;">Cedula de Verificacion y Seguimiento de Obra</h3>
                    </div>
                </div>
            </div>
            <!-- FILTROS DE BUSQUEDA -->
            <div class="card card-custom gutter-b">
                <div class="card-body">
                    <div class="row ">
                        <div class="col-md-3">
                            <div class="form-group">
                                <label>Contrato:</label>
                                <input type="text" class="form-control" id="txtcontratobuscar" name="txtcontratobuscar" placeholder="Número de Contrato" >
                            </div>
                        </div>
                        <div class="col-md-6">
                            <div class="form-group">
                                <label>Obra / Acción:</label>
                                <input type="text" class="form-control" id="txtobrabuscar" name="txtobrabuscar" placeholder="Nombre de la Obra" >
                            </div>
                        </div>
                        <div class="col-md-3 text-right pt-8">
                            <button type="button" class="btn btn-primary" id="btnBuscar">
                                <i class="flaticon-search"></i> Buscar
                            </button>
                            <button type="button" class="btn btn-secondary" id="btnLimpiar">
                                <i class="flaticon-refresh"></i> Limpiar
                            </button>
                        </div>
                    </div>
                </div>
            </div>
            <div class="card card-custom">
             <div class="card-header" style="background:linear-gradient(135deg, var(--mg-primary-dark) 0%, var(--mg-primary) 100%);">
                  <div class="card-title d-flex justify-content-between align-items-center">
                    <h3 class="card-label mb-0" style="color:white;">LISTADO DE OBRAS
 	                  <span class="font-size-sm font-weight-normal mt-1 d-block" style="color:white;">Cédula de verificación y seguimiento FAIS</span>
                    </h3>
                </div>
             </div>
             <div class="card-body" style="background-color: #dddddd3b;">
              <div class="tab-content">
               <div class="tab-pane fade show active" id="kt_tab_pane_4_1" role="tabpanel" aria-labelledby="kt_tab_pane_4_1">
                    <table class="table table-head-custom table-vertical-center table-head-bg table-borderless" id="tblCedulas">
                        <thead>
                            <tr class="text-uppercase">
                                <th>No. Contrato</th>
                                <th>Nombre Obra</th>
                                <th>Monto Contratado</th>
                                <th>Localidad</th>
                                <th style="width: 280px;">Acciones</th>
                                <th>Finiquito</th>
                            </tr>
                        </thead>
                        <tbody id="tbodyCedula">
                            <!-- Contenido dinamico generado por JavaScript -->
                        </tbody>
                    </table>
               </div>
              </div>
             </div>
            </div>
        </div>
    </div>

    <!-- ======================= MODAL FOTOS GEOREFERENCIA ======================= -->
    <div class="modal fade" id="modalFotosGeoreferencia" tabindex="-1" role="dialog">
        <div class="modal-dialog modal-dialog-custom modal-lg" role="document">
            <div class="modal-content">
                <div class="modal-header bg-primary">
                    <h5 class="modal-title text-white">Fotos de Georeferencia</h5>
                    <button type="button" class="close text-white" data-dismiss="modal">&times;</button>
                </div>
                <div class="modal-body">
                    <!-- Encabezado -->
                    <div class="card shadow-sm mb-4 border-0">

                        <!-- BODY -->
                        <div class="card-body" style="background-color: #f1f1f1;">
                            <!-- Obra -->
                            <div class="mb-3">
                                <small class="text-muted">Obra</small>
                                <div id="lblObraGeo" class="font-weight-bold text-dark text-break"></div>
                            </div>

                            <div class="row">
                                <!-- Rubro -->
                                <div class="col-md-6 col-12 mb-3">
                                    <small class="text-muted">Rubro</small>
                                    <div id="lblRubroGeo" class="font-weight-bold"></div>
                                </div>

                                <!-- Contrato -->
                                <div class="col-md-6 col-12 mb-3">
                                    <small class="text-muted">Num. Contrato</small>
                                    <div id="lblContratoGeo" class="font-weight-bold"></div>
                                </div>

                                <!-- Localidad -->
                                <div class="col-md-6 col-12 mb-3">
                                    <small class="text-muted">Localidad</small>
                                    <div id="lblLocalidadGeo" class="font-weight-bold"></div>
                                </div>

                                <!-- Monto -->
                                <div class="col-md-6 col-12 mb-3">
                                    <small class="text-muted">Monto Contratado</small>
                                    <div id="lblMontoGeo" class="font-weight-bold text-success"></div>
                                </div>

                                <!-- Fuente -->
                                <div class="col-md-6 col-12 mb-3">
                                    <small class="text-muted">Fuente Financiamiento</small>
                                    <div id="lblFuenteGeo" class="font-weight-bold"></div>
                                </div>

                                <!-- Periodo -->
                                <div class="col-md-6 col-12 mb-3">
                                    <small class="text-muted">Periodo</small>
                                    <div class="font-weight-bold">
                                        <span id="lblPeriodoInicioGeo"></span> -
                                        <span id="lblPeriodoFinGeo"></span>
                                    </div>
                                </div>

                            </div>
                        </div>
                    </div>
                    
                    <!-- Panel de subida de foto con georeferencia opcional -->
                    <div class="card border shadow-sm mb-4" style="border-left: 4px solid #3699FF !important;">
                        <div class="card-header py-2 px-3" style="background:#eef6ff;">
                            <span class="font-weight-bold text-primary">
                                <i class="fas fa-camera mr-1"></i> Agregar nueva foto
                            </span>
                        </div>
                        <div class="card-body">
                            <!-- Fila 1: Archivo -->
                            <div class="row align-items-end">
                                <div class="col-md-8 mb-3">
                                    <label class="font-weight-bold mb-1">
                                        <i class="fas fa-image text-primary mr-1"></i> Seleccionar foto
                                    </label>
                                    <div class="custom-file">
                                        <input type="file" class="custom-file-input" id="fileFotoGeo" accept="image/*">
                                        <label class="custom-file-label" for="fileFotoGeo">Elegir imagen...</label>
                                    </div>
                                </div>
                                <div class="col-md-4 mb-3 text-center">
                                    <div id="previewFotoGeo" style="display:none;">
                                        <img id="imgPreviewFotoGeo" class="rounded border"
                                             style="max-height:80px; max-width:100%; object-fit:cover;">
                                    </div>
                                    <div id="placeholderPreviewGeo" class="text-muted py-2">
                                        <i class="fas fa-image fa-2x text-light-dark"></i>
                                        <div><small>Vista previa</small></div>
                                    </div>
                                </div>
                            </div>
                            <!-- Fila 2: Georeferencia opcional -->
                            <div class="row align-items-end">
                                <div class="col-12 mb-1">
                                    <span class="font-weight-bold text-muted small">
                                        <i class="fas fa-map-marker-alt text-warning mr-1"></i>
                                        Georeferencia <span class="text-muted font-weight-normal">(opcional — puedes escribirla o capturarla con GPS)</span>
                                    </span>
                                </div>
                                <div class="col-md-4 mb-2">
                                    <label class="small mb-1">Latitud</label>
                                    <input type="text" class="form-control form-control-sm" id="txtLatFotoGeo"
                                           placeholder="Ej. 16.748231">
                                </div>
                                <div class="col-md-4 mb-2">
                                    <label class="small mb-1">Longitud</label>
                                    <input type="text" class="form-control form-control-sm" id="txtLonFotoGeo"
                                           placeholder="Ej. -93.115420">
                                </div>
                                <div class="col-md-4 mb-2">
                                    <label class="small mb-1 d-block">&nbsp;</label>
                                    <button type="button" class="btn btn-warning btn-sm btn-block" id="btnCapturarGPSGeo">
                                        <i class="fas fa-crosshairs mr-1"></i> Obtener GPS
                                    </button>
                                    <div id="statusGPSGeo" class="text-muted small mt-1" style="display:none;"></div>
                                </div>
                            </div>
                            <!-- Fila 3: Botón subir -->
                            <div class="row mt-2">
                                <div class="col-12 text-right">
                                    <button type="button" class="btn btn-primary" id="btnAgregarFotoGeo">
                                        <i class="fas fa-upload mr-1"></i> Subir Foto
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>

                    <!-- Fotos registradas -->
                    <div class="font-weight-bold text-muted small mb-2">
                        <i class="fas fa-images mr-1"></i> Fotos registradas
                    </div>
                    <div class="row" id="containerFotosGeo">
                        <!-- Las fotos se cargan dinamicamente -->
                    </div>
                </div>
                <div class="modal-footer">
                    <button type="button" class="btn btn-secondary" data-dismiss="modal">Cerrar</button>
                </div>
            </div>
        </div>
    </div>

    <!-- ======================= MODAL DATOS INICIO ======================= -->
    <div class="modal fade" id="modalDatosInicio" tabindex="-1" role="dialog">
        <div class="modal-dialog modal-dialog-custom modal-xl" role="document">
            <div class="modal-content">
                <div class="modal-header bg-success">
                    <h5 class="modal-title text-white">Datos de Inicio de la Obra</h5>
                    <button type="button" class="close text-white" data-dismiss="modal">&times;</button>
                </div>
                <div class="modal-body">
                    <!-- Encabezado -->
                    <!-- Encabezado Responsivo -->
                    <div class="card card-custom mb-3 shadow-sm">
                        <div class="card-body p-3">
                            <div class="row">
                                <div class="col-12 mb-2">
                                    <span class="text-muted small font-weight-bold text-uppercase">Obra / Acción</span>
                                    <div id="lblObraInicio" class="font-weight-bold text-dark" style="font-size:13px;"></div>
                                </div>
                            </div>
                            <div class="row">
                                <div class="col-md-4 col-sm-6 mb-2">
                                    <span class="text-muted small">Rubro:</span>
                                    <div id="lblRubroInicio" class="font-weight-bold text-dark small"></div>
                                </div>
                                <div class="col-md-4 col-sm-6 mb-2">
                                    <span class="text-muted small">Núm. Contrato:</span>
                                    <div id="lblContratoInicio" class="font-weight-bold text-dark small"></div>
                                </div>
                                <div class="col-md-4 col-sm-6 mb-2">
                                    <span class="text-muted small">Monto Contratado:</span>
                                    <div id="lblMontoInicio" class="font-weight-bold text-success small"></div>
                                </div>
                                <div class="col-md-4 col-sm-6 mb-2">
                                    <span class="text-muted small">Localidad:</span>
                                    <div id="lblLocalidadInicio" class="font-weight-bold text-dark small"></div>
                                </div>
                                <div class="col-md-4 col-sm-6 mb-2">
                                    <span class="text-muted small">Fuente Financiamiento:</span>
                                    <div id="lblFuenteInicio" class="font-weight-bold text-dark small"></div>
                                </div>
                                <div class="col-md-4 col-sm-6 mb-2">
                                    <span class="text-muted small">Periodo:</span>
                                    <div class="font-weight-bold text-dark small">
                                        <span id="lblPeriodoInicioI"></span> - <span id="lblPeriodoFinI"></span>
                                    </div>
                                </div>
                                <div class="col-md-4 col-sm-6 mb-2">
                                    <span class="text-muted small">Clave Localidad:</span>
                                    <div id="lblClaveLocalidadInicio" class="font-weight-bold text-dark small"></div>
                                </div>
                                <div class="col-md-4 col-sm-6 mb-2">
                                    <span class="text-muted small">Cantidad / Meta:</span>
                                    <div class="font-weight-bold text-dark small">
                                        <span id="lblMetaCantidadInicio"></span> <span id="lblMetaUnidadInicio"></span>
                                    </div>
                                </div>
                                <div class="col-12 mb-1">
                                    <span class="text-muted small">Descripción Acción:</span>
                                    <div id="lblDescripcionAccionInicio" class="font-weight-bold text-dark small"></div>
                                </div>
                            </div>
                        </div>
                    </div>

                    <!-- SECCIÓN A — Identificación y Modalidad -->
                    <div class="card card-custom gutter-b shadow-sm" style="border-left:4px solid #1BC5BD !important;">
                        <div class="card-header" style="background:#e8faf9; min-height:45px; padding:10px 20px;">
                            <div class="card-title mb-0">
                                <i class="fas fa-id-card text-success mr-2"></i>
                                <span class="font-weight-bold text-success">SECCIÓN A — Identificación y Modalidad</span>
                            </div>
                        </div>
                        <div class="card-body">
                            <%-- Fila 1: AGEB | Fecha | Supervisor | Modalidad --%>
                            <div class="row">
                                <div class="col-md-3">
                                    <div class="form-group">
                                        <label class="font-weight-bold">No. AGEB:</label>
                                        <input type="text" class="form-control" id="txtNoAgebInicio" placeholder="Clave AGEB">
                                    </div>
                                </div>
                                <div class="col-md-3">
                                    <div class="form-group">
                                        <label class="font-weight-bold required-field">Fecha Verificación:</label>
                                        <input type="text" class="form-control fecha" id="txtFechaVerificacionInicio" placeholder="dd/mm/aaaa">
                                    </div>
                                </div>
                                <div class="col-md-3">
                                    <div class="form-group">
                                        <label class="font-weight-bold"><i class="fas fa-user-hard-hat text-muted mr-1"></i>Supervisor de Obras:</label>
                                        <input type="text" class="form-control" id="txtSupervisorInicio" placeholder="Nombre del supervisor" maxlength="200">
                                    </div>
                                </div>
                                <div class="col-md-3">
                                    <div class="form-group">
                                        <label class="font-weight-bold">Modalidad del Proyecto:</label>
                                        <div class="checkbox-inline mt-1">
                                            <label class="checkbox checkbox-outline checkbox-success">
                                                <input type="checkbox" id="chkAmpliaInicio"><span></span> Ampliación
                                            </label>
                                            <label class="checkbox checkbox-outline checkbox-success ml-3">
                                                <input type="checkbox" id="chkConstruccionInicio"><span></span> Construcción
                                            </label>
                                            <label class="checkbox checkbox-outline checkbox-success ml-3">
                                                <input type="checkbox" id="chkEquipamientoInicio"><span></span> Equipamiento
                                            </label>
                                            <label class="checkbox checkbox-outline checkbox-success ml-3">
                                                <input type="checkbox" id="chkMantenimientoInicio"><span></span> Mantenimiento
                                            </label>
                                            <label class="checkbox checkbox-outline checkbox-success ml-3">
                                                <input type="checkbox" id="chkRehabilitacionInicio"><span></span> Rehabilitación
                                            </label>
                                        </div>
                                    </div>
                                </div>
                            </div>
                            <%-- Fila: Descripción de la Visita --%>
                            <div class="row">
                                <div class="col-md-12">
                                    <div class="form-group">
                                        <label class="font-weight-bold"><i class="fas fa-file-alt text-success mr-1"></i>Descripción de la Visita:</label>
                                        <textarea class="form-control" id="txtDescripcionVisitaInicio" rows="3"
                                                  placeholder="SE REALIZA LA VISITA A LA LOCALIDAD EN COMPAÑÍA DE..."></textarea>
                                    </div>
                                </div>
                            </div>
                            <%-- Fila 2: Incidencia | Coincide Planeacion | Describa no coincide --%>
                            <div class="row">
                                <div class="col-md-3">
                                    <div class="form-group">
                                        <label class="font-weight-bold">Incidencia Proyecto:</label>
                                        <div class="mt-1">
                                            <label class="checkbox checkbox-outline checkbox-success">
                                                <input type="checkbox" id="chkDirectaInicio"><span></span> Directa
                                            </label><br>
                                            <label class="checkbox checkbox-outline checkbox-success mt-1">
                                                <input type="checkbox" id="chkComplementariaInicio"><span></span> Complementaria
                                            </label>
                                        </div>
                                    </div>
                                </div>
                                <div class="col-md-3">
                                    <div class="form-group">
                                        <label class="font-weight-bold">Coincide con la Planeación:</label>
                                        <select class="form-control" id="cboCoincidePlaneacionInicio">
                                            <option value="true">Sí</option>
                                            <option value="false">No</option>
                                        </select>
                                    </div>
                                </div>
                                <div class="col-md-6">
                                    <div class="form-group">
                                        <label class="font-weight-bold">Describa por qué no coincide con la planeación:</label>
                                        <textarea class="form-control" id="txtDescripcionNoCoincideInicio" rows="3"
                                                  placeholder="Describa por qué no coincide con la planeación..."></textarea>
                                    </div>
                                </div>
                            </div>
                            <%-- Fila 3: Zona Focalizacion (horizontal, ancho completo) --%>
                            <div class="row">
                                <div class="col-md-12">
                                    <div class="form-group">
                                        <label class="font-weight-bold">Zona de Focalización:</label>
                                        <div class="d-flex flex-wrap mt-1">
                                            <label class="checkbox checkbox-outline checkbox-success mr-5">
                                                <input type="checkbox" id="chkZonaPrioritariaInicio"><span></span> Zona de Atención Prioritaria
                                            </label>
                                            <label class="checkbox checkbox-outline checkbox-success mr-5">
                                                <input type="checkbox" id="chkRezagoAltoInicio"><span></span> Localidad con alto rezago social
                                            </label>
                                            <label class="checkbox checkbox-outline checkbox-success">
                                                <input type="checkbox" id="chkPobrezaExtremaInicio"><span></span> Pobreza extrema
                                            </label>
                                        </div>
                                    </div>
                                </div>
                            </div>
                            <%-- Fila 4: Coincide Rubro | Describa no coincide rubro --%>
                            <div class="row">
                                <div class="col-md-4">
                                    <div class="form-group">
                                        <label class="font-weight-bold">Coincide con Planeación (Rubro):</label>
                                        <select class="form-control" id="cboCoincidePlaneacionRubroInicio">
                                            <option value="true">Sí</option>
                                            <option value="false">No</option>
                                        </select>
                                    </div>
                                </div>
                                <div class="col-md-8">
                                    <div class="form-group">
                                        <label class="font-weight-bold">Describa por qué no coincide (Rubro):</label>
                                        <textarea class="form-control" id="txtDescripcionNoCoincideRubroInicio" rows="2"
                                                  placeholder="Describa por qué no coincide con el rubro..."></textarea>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    <!-- SECCIÓN B — Montos de Inversión -->
                    <div class="card card-custom gutter-b shadow-sm" style="border-left:4px solid var(--mg-primary) !important;">
                        <div class="card-header" style="background:rgba(210,35,42,0.08); min-height:45px; padding:10px 20px;">
                            <div class="card-title mb-0">
                                <i class="fas fa-dollar-sign text-primary mr-2"></i>
                                <span class="font-weight-bold text-primary">SECCIÓN B — Montos de Inversión</span>
                            </div>
                        </div>
                        <div class="card-body">
                            <div class="row">
                                <div class="col-md-2">
                                    <div class="form-group">
                                        <label class="text-muted small">Aportación FISMDF:</label>
                                        <input type="text" class="form-control form-control-sm text-right" id="txtAportacionFismdfInicio" value="0.00">
                                    </div>
                                </div>
                                <div class="col-md-2">
                                    <div class="form-group">
                                        <label class="text-muted small">Otra Fuente Federal:</label>
                                        <input type="text" class="form-control form-control-sm text-right" id="txtOtraFuenteFederalInicio" value="0.00">
                                    </div>
                                </div>
                                <div class="col-md-2">
                                    <div class="form-group">
                                        <label class="text-muted small">Fuente Estatal:</label>
                                        <input type="text" class="form-control form-control-sm text-right" id="txtFuenteEstatalInicio" value="0.00">
                                    </div>
                                </div>
                                <div class="col-md-2">
                                    <div class="form-group">
                                        <label class="text-muted small">Fuente Municipal:</label>
                                        <input type="text" class="form-control form-control-sm text-right" id="txtFuenteMunicipalInicio" value="0.00">
                                    </div>
                                </div>
                                <div class="col-md-2">
                                    <div class="form-group">
                                        <label class="text-muted small">Otros:</label>
                                        <input type="text" class="form-control form-control-sm text-right" id="txtOtrosInicio" value="0.00">
                                    </div>
                                </div>
                                <div class="col-md-2">
                                    <div class="form-group">
                                        <label class="text-muted small font-weight-bold text-dark">Costo Total:</label>
                                        <input type="text" class="form-control form-control-sm text-right font-weight-bold" id="txtCostoTotalInicio" value="0.00">
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    <!-- SECCIÓN C — Georreferenciación -->
                    <div class="card card-custom gutter-b shadow-sm" style="border-left:4px solid #FFA800 !important;">
                        <div class="card-header" style="background:#fff8e8; min-height:45px; padding:10px 20px;">
                            <div class="card-title mb-0">
                                <i class="fas fa-map-marker-alt text-warning mr-2"></i>
                                <span class="font-weight-bold text-warning">SECCIÓN C — Georreferenciación</span>
                            </div>
                        </div>
                        <div class="card-body">
                            <div class="row">
                                <div class="col-md-3">
                                    <div class="form-group">
                                        <label class="font-weight-bold">Latitud:</label>
                                        <input type="text" class="form-control" id="txtLatitudInicio" placeholder="Ej. 16.123456">
                                    </div>
                                </div>
                                <div class="col-md-3">
                                    <div class="form-group">
                                        <label class="font-weight-bold">Longitud:</label>
                                        <input type="text" class="form-control" id="txtLongitudInicio" placeholder="Ej. -93.123456">
                                    </div>
                                </div>
                                <div class="col-md-6">
                                    <div class="form-group">
                                        <label class="font-weight-bold">Dirección Específica:</label>
                                        <input type="text" class="form-control" id="txtDireccionInicio" placeholder="Calle, número, colonia...">
                                    </div>
                                </div>
                            </div>
                            <div class="row">
                                <div class="col-md-12">
                                    <div class="form-group">
                                        <label class="font-weight-bold">Descripción de la Ubicación:</label>
                                        <textarea class="form-control" id="txtReferenciaInicio" rows="2"
                                                  placeholder="Municipio, Localidad, Tipo de vialidad, Nombre de vialidad, Referencias adicionales..."></textarea>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    <!-- ═══ SECCIÓN D — Croquis y Fotos ═══ -->
                    <div class="card card-custom gutter-b shadow-sm mt-3" style="border-left:4px solid #F64E60 !important;">
                        <div class="card-header" style="background:#fff0f2; min-height:45px; padding:10px 20px;">
                            <div class="card-title mb-0">
                                <i class="fas fa-camera text-danger mr-2"></i>
                                <span class="font-weight-bold text-danger">SECCIÓN D — Croquis y Fotografías</span>
                                <small class="text-muted ml-2 font-weight-normal">(georeferencia opcional en cada foto)</small>
                            </div>
                        </div>
                        <div class="card-body">
                            <div class="row">

                                <%-- CROQUIS --%>
                                <div class="col-md-4 mb-3">
                                    <div class="card border shadow-sm h-100">
                                        <div class="card-header py-2 px-3 bg-light d-flex justify-content-between align-items-center">
                                            <span class="font-weight-bold small"><i class="fas fa-map text-secondary mr-1"></i> Croquis</span>
                                            <div id="accionesCroquisInicio" style="display:none;">
                                                <button type="button" class="btn btn-xs btn-light-primary" onclick="CedulaModule.descargarFotoInicio('croquis')" title="Descargar"><i class="fas fa-download fa-sm"></i></button>
                                                <button type="button" class="btn btn-xs btn-light-danger ml-1" onclick="CedulaModule.eliminarFotoInicio('croquis')" title="Eliminar"><i class="fas fa-trash fa-sm"></i></button>
                                            </div>
                                        </div>
                                        <div class="card-body p-2 text-center bg-white">
                                            <img id="imgCroquisInicio" class="rounded" style="display:none; max-width:100%; max-height:140px; object-fit:cover; cursor:pointer;" onclick="window.open(this.src,'_blank')">
                                            <div id="placeholderCroquisInicio" class="text-muted py-3"><i class="fas fa-map fa-2x"></i><br><small>Sin croquis</small></div>
                                            <input type="file" class="form-control form-control-sm mt-2" id="fileCroquisInicio" accept="image/*">
                                            <%-- Georeferencia --%>
                                            <div class="mt-2 border-top pt-2 text-left">
                                                <div class="d-flex align-items-center mb-1">
                                                    <span class="text-muted mr-1" style="font-size:11px; min-width:28px;">Lat:</span>
                                                    <input type="text" class="form-control form-control-sm" id="txtLatCroquisInicio" placeholder="0.000000" style="font-size:11px;">
                                                </div>
                                                <div class="d-flex align-items-center">
                                                    <span class="text-muted mr-1" style="font-size:11px; min-width:28px;">Lon:</span>
                                                    <input type="text" class="form-control form-control-sm mr-1" id="txtLonCroquisInicio" placeholder="0.000000" style="font-size:11px;">
                                                    <button type="button" class="btn btn-xs btn-warning flex-shrink-0" onclick="CedulaModule.capturarGPSFotoInicio('Croquis')" title="Capturar GPS"><i class="fas fa-crosshairs"></i></button>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <%-- FOTO 1 --%>
                                <div class="col-md-2 mb-3">
                                    <div class="card border shadow-sm h-100">
                                        <div class="card-header py-2 px-3 bg-light d-flex justify-content-between align-items-center">
                                            <span class="font-weight-bold small">Foto 1</span>
                                            <div id="accionesFoto1Inicio" style="display:none;">
                                                <button type="button" class="btn btn-xs btn-light-primary" onclick="CedulaModule.descargarFotoInicio(1)" title="Descargar"><i class="fas fa-download fa-sm"></i></button>
                                                <button type="button" class="btn btn-xs btn-light-danger ml-1" onclick="CedulaModule.eliminarFotoInicio(1)" title="Eliminar"><i class="fas fa-trash fa-sm"></i></button>
                                            </div>
                                        </div>
                                        <div class="card-body p-2 text-center bg-white">
                                            <img id="imgFoto1Inicio" class="rounded" style="display:none; max-width:100%; max-height:140px; object-fit:cover; cursor:pointer;" onclick="window.open(this.src,'_blank')">
                                            <div id="placeholderFoto1Inicio" class="text-muted py-3"><i class="fas fa-image fa-2x"></i><br><small>Sin foto</small></div>
                                            <input type="file" class="form-control form-control-sm mt-2" id="fileFoto1Inicio" accept="image/*">
                                            <div class="mt-2 border-top pt-2 text-left">
                                                <div class="d-flex align-items-center mb-1">
                                                    <span class="text-muted mr-1" style="font-size:11px; min-width:28px;">Lat:</span>
                                                    <input type="text" class="form-control form-control-sm" id="txtLatFoto1Inicio" placeholder="0.000000" style="font-size:11px;">
                                                </div>
                                                <div class="d-flex align-items-center">
                                                    <span class="text-muted mr-1" style="font-size:11px; min-width:28px;">Lon:</span>
                                                    <input type="text" class="form-control form-control-sm mr-1" id="txtLonFoto1Inicio" placeholder="0.000000" style="font-size:11px;">
                                                    <button type="button" class="btn btn-xs btn-warning flex-shrink-0" onclick="CedulaModule.capturarGPSFotoInicio('Foto1')" title="Capturar GPS"><i class="fas fa-crosshairs"></i></button>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <%-- FOTO 2 --%>
                                <div class="col-md-2 mb-3">
                                    <div class="card border shadow-sm h-100">
                                        <div class="card-header py-2 px-3 bg-light d-flex justify-content-between align-items-center">
                                            <span class="font-weight-bold small">Foto 2</span>
                                            <div id="accionesFoto2Inicio" style="display:none;">
                                                <button type="button" class="btn btn-xs btn-light-primary" onclick="CedulaModule.descargarFotoInicio(2)" title="Descargar"><i class="fas fa-download fa-sm"></i></button>
                                                <button type="button" class="btn btn-xs btn-light-danger ml-1" onclick="CedulaModule.eliminarFotoInicio(2)" title="Eliminar"><i class="fas fa-trash fa-sm"></i></button>
                                            </div>
                                        </div>
                                        <div class="card-body p-2 text-center bg-white">
                                            <img id="imgFoto2Inicio" class="rounded" style="display:none; max-width:100%; max-height:140px; object-fit:cover; cursor:pointer;" onclick="window.open(this.src,'_blank')">
                                            <div id="placeholderFoto2Inicio" class="text-muted py-3"><i class="fas fa-image fa-2x"></i><br><small>Sin foto</small></div>
                                            <input type="file" class="form-control form-control-sm mt-2" id="fileFoto2Inicio" accept="image/*">
                                            <div class="mt-2 border-top pt-2 text-left">
                                                <div class="d-flex align-items-center mb-1">
                                                    <span class="text-muted mr-1" style="font-size:11px; min-width:28px;">Lat:</span>
                                                    <input type="text" class="form-control form-control-sm" id="txtLatFoto2Inicio" placeholder="0.000000" style="font-size:11px;">
                                                </div>
                                                <div class="d-flex align-items-center">
                                                    <span class="text-muted mr-1" style="font-size:11px; min-width:28px;">Lon:</span>
                                                    <input type="text" class="form-control form-control-sm mr-1" id="txtLonFoto2Inicio" placeholder="0.000000" style="font-size:11px;">
                                                    <button type="button" class="btn btn-xs btn-warning flex-shrink-0" onclick="CedulaModule.capturarGPSFotoInicio('Foto2')" title="Capturar GPS"><i class="fas fa-crosshairs"></i></button>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <%-- FOTO 3 --%>
                                <div class="col-md-2 mb-3">
                                    <div class="card border shadow-sm h-100">
                                        <div class="card-header py-2 px-3 bg-light d-flex justify-content-between align-items-center">
                                            <span class="font-weight-bold small">Foto 3</span>
                                            <div id="accionesFoto3Inicio" style="display:none;">
                                                <button type="button" class="btn btn-xs btn-light-primary" onclick="CedulaModule.descargarFotoInicio(3)" title="Descargar"><i class="fas fa-download fa-sm"></i></button>
                                                <button type="button" class="btn btn-xs btn-light-danger ml-1" onclick="CedulaModule.eliminarFotoInicio(3)" title="Eliminar"><i class="fas fa-trash fa-sm"></i></button>
                                            </div>
                                        </div>
                                        <div class="card-body p-2 text-center bg-white">
                                            <img id="imgFoto3Inicio" class="rounded" style="display:none; max-width:100%; max-height:140px; object-fit:cover; cursor:pointer;" onclick="window.open(this.src,'_blank')">
                                            <div id="placeholderFoto3Inicio" class="text-muted py-3"><i class="fas fa-image fa-2x"></i><br><small>Sin foto</small></div>
                                            <input type="file" class="form-control form-control-sm mt-2" id="fileFoto3Inicio" accept="image/*">
                                            <div class="mt-2 border-top pt-2 text-left">
                                                <div class="d-flex align-items-center mb-1">
                                                    <span class="text-muted mr-1" style="font-size:11px; min-width:28px;">Lat:</span>
                                                    <input type="text" class="form-control form-control-sm" id="txtLatFoto3Inicio" placeholder="0.000000" style="font-size:11px;">
                                                </div>
                                                <div class="d-flex align-items-center">
                                                    <span class="text-muted mr-1" style="font-size:11px; min-width:28px;">Lon:</span>
                                                    <input type="text" class="form-control form-control-sm mr-1" id="txtLonFoto3Inicio" placeholder="0.000000" style="font-size:11px;">
                                                    <button type="button" class="btn btn-xs btn-warning flex-shrink-0" onclick="CedulaModule.capturarGPSFotoInicio('Foto3')" title="Capturar GPS"><i class="fas fa-crosshairs"></i></button>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <%-- FOTO 4 --%>
                                <div class="col-md-2 mb-3">
                                    <div class="card border shadow-sm h-100">
                                        <div class="card-header py-2 px-3 bg-light d-flex justify-content-between align-items-center">
                                            <span class="font-weight-bold small">Foto 4</span>
                                            <div id="accionesFoto4Inicio" style="display:none;">
                                                <button type="button" class="btn btn-xs btn-light-primary" onclick="CedulaModule.descargarFotoInicio(4)" title="Descargar"><i class="fas fa-download fa-sm"></i></button>
                                                <button type="button" class="btn btn-xs btn-light-danger ml-1" onclick="CedulaModule.eliminarFotoInicio(4)" title="Eliminar"><i class="fas fa-trash fa-sm"></i></button>
                                            </div>
                                        </div>
                                        <div class="card-body p-2 text-center bg-white">
                                            <img id="imgFoto4Inicio" class="rounded" style="display:none; max-width:100%; max-height:140px; object-fit:cover; cursor:pointer;" onclick="window.open(this.src,'_blank')">
                                            <div id="placeholderFoto4Inicio" class="text-muted py-3"><i class="fas fa-image fa-2x"></i><br><small>Sin foto</small></div>
                                            <input type="file" class="form-control form-control-sm mt-2" id="fileFoto4Inicio" accept="image/*">
                                            <div class="mt-2 border-top pt-2 text-left">
                                                <div class="d-flex align-items-center mb-1">
                                                    <span class="text-muted mr-1" style="font-size:11px; min-width:28px;">Lat:</span>
                                                    <input type="text" class="form-control form-control-sm" id="txtLatFoto4Inicio" placeholder="0.000000" style="font-size:11px;">
                                                </div>
                                                <div class="d-flex align-items-center">
                                                    <span class="text-muted mr-1" style="font-size:11px; min-width:28px;">Lon:</span>
                                                    <input type="text" class="form-control form-control-sm mr-1" id="txtLonFoto4Inicio" placeholder="0.000000" style="font-size:11px;">
                                                    <button type="button" class="btn btn-xs btn-warning flex-shrink-0" onclick="CedulaModule.capturarGPSFotoInicio('Foto4')" title="Capturar GPS"><i class="fas fa-crosshairs"></i></button>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                            </div>
                        </div>
                    </div>

                    <!-- ═══ SECCIÓN E — Reporte Fotográfico (Partidas) ═══ -->
                    <div class="card card-custom gutter-b shadow-sm mt-3" style="border-left:4px solid #c0392b !important;">
                        <div class="card-header" style="background:#fff0f2; min-height:45px; padding:10px 20px;">
                            <div class="card-title mb-0 w-100 d-flex justify-content-between align-items-center">
                                <div>
                                    <i class="fas fa-images text-danger mr-2"></i>
                                    <span class="font-weight-bold text-danger">REPORTE FOTOGRÁFICO</span>
                                    <small class="text-muted ml-2 font-weight-normal">(registre las partidas; las fotos se agregan en seguimiento)</small>
                                </div>
                                <button type="button" class="btn btn-sm btn-danger" id="btnAgregarPartidaInicio">
                                    <i class="flaticon-plus"></i> Agregar Partida
                                </button>
                            </div>
                        </div>
                        <div class="card-body pb-2" id="contenedorPartidasInicio">
                            <div id="listaPartidasInicio">
                                <%-- Las partidas se renderizan dinámicamente por JS --%>
                            </div>
                            <div id="sinPartidasInicio" class="text-center text-muted py-4">
                                <i class="fas fa-layer-group fa-2x mb-2 d-block"></i>
                                <small>No hay partidas registradas. Haga clic en <b>Agregar Partida</b> para comenzar.</small>
                            </div>
                        </div>
                    </div>

                </div>
                <div class="modal-footer">
                    <input type="hidden" id="hddIdAccionInicio">
                    <input type="hidden" id="hddIdObraInicio">
                    <input type="hidden" id="hddAccionMovInicio" value="A">
                    <input type="hidden" id="hddIdRubroInicio">
                    <input type="hidden" id="hddRubroInicio">
                    <input type="hidden" id="hddIdSubrubroInicio">
                    <input type="hidden" id="hddSubrubroInicio">
                    <input type="hidden" id="hddRutaCroquisInicio">
                    <input type="hidden" id="hddRutaFoto1Inicio">
                    <input type="hidden" id="hddRutaFoto2Inicio">
                    <input type="hidden" id="hddRutaFoto3Inicio">
                    <input type="hidden" id="hddRutaFoto4Inicio">
                    <input type="hidden" id="hddIdSeguimientoInicio">
                    <button type="button" class="btn btn-success" id="btnGuardarDatosInicio">
                        <i class="flaticon-disk"></i> Guardar
                    </button>
                    <button type="button" class="btn btn-secondary" data-dismiss="modal">Cerrar</button>
                </div>
            </div>
        </div>
    </div>

    <!-- ======================= MODAL UNICO SEGUIMIENTO ======================= -->
    <div class="modal fade" id="modalSeguimiento" tabindex="-1" role="dialog" 
         data-backdrop="static" data-keyboard="false">
        <div class="modal-dialog modal-xl" role="document" style="max-width:95%;">
            <div class="modal-content">

                <!-- HEADER - cambia segun la vista activa -->
                <div class="modal-header bg-info">
                    <h5 class="modal-title text-white">
                        <i id="iconTituloSeg" class="fas fa-eye text-white mr-2"></i>
                        <span id="tituloModalSeg">Seguimiento de Avances de Obra</span>
                    </h5>
                    <button type="button" class="close text-white" id="btnCerrarXSeg">&times;</button>
                </div>

                <div class="modal-body" style="max-height:75vh; overflow-y:auto;">

                    <!-- ================================================ -->
                    <!-- VISTA 1: GRID DE SEGUIMIENTOS                    -->
                    <!-- ================================================ -->
                    <div id="vistaSeguimientoGrid">
                        <div class="d-flex justify-content-between align-items-center mb-4">
                            <h6 class="mb-0 font-weight-bold text-dark">
                                <i class="fas fa-list-ol text-info mr-1"></i>
                                Registros de Seguimiento
                            </h6>
                            <button type="button" class="btn btn-success btn-sm" id="btnAgregarSeguimiento">
                                <i class="flaticon-plus"></i> Agregar Seguimiento
                            </button>
                        </div>
                        <div class="table-responsive">
                            <table class="table table-bordered table-hover table-head-bg" id="tblSeguimientos">
                                <thead>
                                    <tr class="text-uppercase bg-dark text-white">
                                        <th class="text-center" style="width:50px;">No.</th>
                                        <th>Nombre de la Obra / Acción</th>
                                        <th class="text-center">Fecha Visita</th>
                                        <th class="text-center">Localidad</th>
                                        <th class="text-center">Avance Físico %</th>
                                        <th class="text-center">Avance Financiero %</th>
                                        <th class="text-center" style="width:150px;">Acciones</th>
                                    </tr>
                                </thead>
                                <tbody id="tbodySeguimientos">
                                </tbody>
                            </table>
                        </div>
                    </div>

                    <!-- ================================================ -->
                    <!-- VISTA 2: FORMULARIO DE CAPTURA                   -->
                    <!-- ================================================ -->
                    <div id="vistaSeguimientoForm" style="display:none;">

                        <!-- ENCABEZADO DE LA OBRA -->
                        <%--<table class="table table-bordered table-header-info mb-4">
                            <tr>
                                <td style="width:160px; font-weight:bold; background:#f3f6f9;">Obra:</td>
                                <td id="lblObraFormSeg" colspan="3"></td>
                            </tr>
                            <tr>
                                <td style="font-weight:bold; background:#f3f6f9;">Rubro:</td>
                                <td id="lblRubroFormSeg"></td>
                                <td style="font-weight:bold; background:#f3f6f9; width:140px;">Num. Contrato:</td>
                                <td id="lblContratoFormSeg"></td>
                            </tr>
                            <tr>
                                <td style="font-weight:bold; background:#f3f6f9;">Localidad:</td>
                                <td id="lblLocalidadFormSeg"></td>
                                <td style="font-weight:bold; background:#f3f6f9;">Monto Contratado:</td>
                                <td id="lblMontoFormSeg"></td>
                            </tr>
                            <tr>
                                <td style="font-weight:bold; background:#f3f6f9;">Fuente Financiamiento:</td>
                                <td id="lblFuenteFormSeg"></td>
                                <td style="font-weight:bold; background:#f3f6f9;">Periodo:</td>
                                <td><span id="lblPeriodoInicioFormSeg"></span> - <span id="lblPeriodoFinFormSeg"></span></td>
                            </tr>
                            <tr>
                                <td style="font-weight:bold; background:#f3f6f9;">Clave Localidad:</td>
                                <td id="lblClaveLocalidadFormSeg"></td>
                                <td style="font-weight:bold; background:#f3f6f9;">Meta:</td>
                                <td><span id="lblMetaCantidadFormSeg"></span> <span id="lblMetaUnidadFormSeg"></span></td>
                            </tr>
                            <tr>
                                <td style="font-weight:bold; background:#f3f6f9;">Descripción Acción:</td>
                                <td id="lblDescripcionAccionFormSeg" colspan="3"></td>
                            </tr>
                        </table>--%>
                        <!-- ENCABEZADO DE LA OBRA — Responsivo -->
                        <div class="card card-custom mb-3 shadow-sm">
                            <div class="card-body p-3">
                                <div class="row">
                                    <div class="col-12 mb-2">
                                        <span class="text-muted small font-weight-bold text-uppercase">Obra / Acción</span>
                                        <div id="lblObraFormSeg" class="font-weight-bold text-dark" style="font-size:13px;"></div>
                                    </div>
                                </div>
                                <div class="row">
                                    <div class="col-md-4 col-sm-6 mb-2">
                                        <span class="text-muted small">Rubro:</span>
                                        <div id="lblRubroFormSeg" class="font-weight-bold text-dark small"></div>
                                    </div>
                                    <div class="col-md-4 col-sm-6 mb-2">
                                        <span class="text-muted small">Núm. Contrato:</span>
                                        <div id="lblContratoFormSeg" class="font-weight-bold text-dark small"></div>
                                    </div>
                                    <div class="col-md-4 col-sm-6 mb-2">
                                        <span class="text-muted small">Monto Contratado:</span>
                                        <div id="lblMontoFormSeg" class="font-weight-bold text-success small"></div>
                                    </div>
                                    <div class="col-md-4 col-sm-6 mb-2">
                                        <span class="text-muted small">Localidad:</span>
                                        <div id="lblLocalidadFormSeg" class="font-weight-bold text-dark small"></div>
                                    </div>
                                    <div class="col-md-4 col-sm-6 mb-2">
                                        <span class="text-muted small">Fuente Financiamiento:</span>
                                        <div id="lblFuenteFormSeg" class="font-weight-bold text-dark small"></div>
                                    </div>
                                    <div class="col-md-4 col-sm-6 mb-2">
                                        <span class="text-muted small">Periodo:</span>
                                        <div class="font-weight-bold text-dark small">
                                            <span id="lblPeriodoInicioFormSeg"></span> - <span id="lblPeriodoFinFormSeg"></span>
                                        </div>
                                    </div>
                                    <div class="col-md-4 col-sm-6 mb-2">
                                        <span class="text-muted small">Clave Localidad:</span>
                                        <div id="lblClaveLocalidadFormSeg" class="font-weight-bold text-dark small"></div>
                                    </div>
                                    <div class="col-md-4 col-sm-6 mb-2">
                                        <span class="text-muted small">Meta:</span>
                                        <div class="font-weight-bold text-dark small">
                                            <span id="lblMetaCantidadFormSeg"></span> <span id="lblMetaUnidadFormSeg"></span>
                                        </div>
                                    </div>
                                    <div class="col-12 mb-1">
                                        <span class="text-muted small">Descripción Acción:</span>
                                        <div id="lblDescripcionAccionFormSeg" class="font-weight-bold text-dark small"></div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <!-- SECCION 1: Datos Recurrentes -->
                        <div class="card card-custom gutter-b" style="border-left:4px solid var(--mg-primary) !important;">
                            <div class="card-header" style="background-color:rgba(210,35,42,0.08); min-height:45px;">
                                <div class="card-title mb-0">
                                    <i class="fas fa-database text-primary mr-2"></i>
                                    <span class="font-weight-bold text-primary">SECCIÓN 1 — Datos Recurrentes</span>
                                    <small class="text-muted ml-2">(datos que generalmente no cambian entre seguimientos)</small>
                                </div>
                            </div>
                            <div class="card-body">
                                <div class="row">
                                    <div class="col-md-3">
                                        <div class="form-group">
                                            <label class="font-weight-bold">No. AGEB:</label>
                                            <input type="text" class="form-control" id="txtNoAgebSeg" placeholder="Clave AGEB">
                                        </div>
                                    </div>
                                    <div class="col-md-3">
                                        <div class="form-group">
                                            <label class="font-weight-bold">Fecha de Verificación:</label>
                                            <input type="text" class="form-control fecha" id="txtFechaVerificacionSeg" placeholder="dd/mm/aaaa">
                                        </div>
                                    </div>
                                    <div class="col-md-6">
                                        <div class="form-group">
                                            <label class="font-weight-bold">Modalidad Proyecto:</label>
                                            <div class="checkbox-inline mt-1">
                                                <label class="checkbox checkbox-outline checkbox-primary">
                                                    <input type="checkbox" id="chkAmpliaSeg"><span></span> Ampliación
                                                </label>
                                                <label class="checkbox checkbox-outline checkbox-primary ml-3">
                                                    <input type="checkbox" id="chkConstruccionSeg"><span></span> Construcción
                                                </label>
                                                <label class="checkbox checkbox-outline checkbox-primary ml-3">
                                                    <input type="checkbox" id="chkEquipamientoSeg"><span></span> Equipamiento
                                                </label>
                                                <label class="checkbox checkbox-outline checkbox-primary ml-3">
                                                    <input type="checkbox" id="chkMantenimientoSeg"><span></span> Mantenimiento
                                                </label>
                                                <label class="checkbox checkbox-outline checkbox-primary ml-3">
                                                    <input type="checkbox" id="chkRehabilitacionSeg"><span></span> Rehabilitación
                                                </label>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                                <div class="row">
                                    <div class="col-md-3">
                                        <div class="form-group">
                                            <label class="font-weight-bold">Incidencia Proyecto:</label>
                                            <div class="mt-1">
                                                <label class="checkbox checkbox-outline checkbox-success">
                                                    <input type="checkbox" id="chkDirectaSeg"><span></span> Directa
                                                </label>
                                                <label class="checkbox checkbox-outline checkbox-success mt-1">
                                                    <input type="checkbox" id="chkComplementariaSeg"><span></span> Complementaria
                                                </label>
                                            </div>
                                        </div>
                                    </div>
                                    <div class="col-md-9">
                                        <label class="font-weight-bold">Montos de Inversión:</label>
                                        <div class="row">
                                            <div class="col-md-4">
                                                <div class="form-group">
                                                    <label class="text-muted small">Aportación FISMDF:</label>
                                                    <input type="text" class="form-control form-control-sm text-right" id="txtAportacionFismdfSeg" value="0.00">
                                                </div>
                                            </div>
                                            <div class="col-md-4">
                                                <div class="form-group">
                                                    <label class="text-muted small">Otra Fuente Federal:</label>
                                                    <input type="text" class="form-control form-control-sm text-right" id="txtOtraFuenteFederalSeg" value="0.00">
                                                </div>
                                            </div>
                                            <div class="col-md-4">
                                                <div class="form-group">
                                                    <label class="text-muted small">Fuente Estatal:</label>
                                                    <input type="text" class="form-control form-control-sm text-right" id="txtFuenteEstatalSeg" value="0.00">
                                                </div>
                                            </div>
                                            <div class="col-md-4">
                                                <div class="form-group">
                                                    <label class="text-muted small">Fuente Municipal:</label>
                                                    <input type="text" class="form-control form-control-sm text-right" id="txtFuenteMunicipalSeg" value="0.00">
                                                </div>
                                            </div>
                                            <div class="col-md-4">
                                                <div class="form-group">
                                                    <label class="text-muted small">Otros:</label>
                                                    <input type="text" class="form-control form-control-sm text-right" id="txtOtrosSeg" value="0.00">
                                                </div>
                                            </div>
                                            <div class="col-md-4">
                                                <div class="form-group">
                                                    <label class="text-muted small font-weight-bold text-dark">Costo Total:</label>
                                                    <input type="text" class="form-control form-control-sm text-right font-weight-bold" id="txtCostoTotalSeg" value="0.00">
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <!-- SECCION 2: Datos Variables -->
                        <div class="card card-custom gutter-b" style="border-left:4px solid #F64E60 !important;">
                            <div class="card-header" style="background-color:#fff0f2; min-height:45px;">
                                <div class="card-title mb-0">
                                    <i class="fas fa-pencil-alt text-danger mr-2"></i>
                                    <span class="font-weight-bold text-danger">SECCIÓN 2 — Datos Variables</span>
                                    <small class="text-muted ml-2">(se capturan en cada visita de seguimiento)</small>
                                </div>
                            </div>
                            <div class="card-body">
                                <div class="row">
                                    <div class="col-md-3">
                                        <div class="form-group">
                                            <label class="font-weight-bold required-field">Fecha de Visita:</label>
                                            <input type="text" class="form-control fecha" id="txtFechaVisitaSeg" placeholder="dd/mm/aaaa">
                                        </div>
                                    </div>
                                    <div class="col-md-3">
                                        <div class="form-group">
                                            <label class="font-weight-bold required-field">Avance Físico %:</label>
                                            <div class="input-group">
                                                <input type="text" class="form-control text-right" id="txtAvanceFisicoSeg" value="0.00">
                                                <div class="input-group-append"><span class="input-group-text">%</span></div>
                                            </div>
                                        </div>
                                    </div>
                                    <div class="col-md-3">
                                        <div class="form-group">
                                            <label class="font-weight-bold required-field">Avance Financiero %:</label>
                                            <div class="input-group">
                                                <input type="text" class="form-control text-right" id="txtAvanceFinancieroSeg" value="0.00">
                                                <div class="input-group-append"><span class="input-group-text">%</span></div>
                                            </div>
                                        </div>
                                    </div>
                                    <div class="col-md-3">
                                        <div class="form-group">
                                            <label class="font-weight-bold">Insumo y/o Catálogo de Conceptos:</label>
                                            <select class="form-control" id="cboCatalogoConceptosSeg">
                                                <option value="N">No</option>
                                                <option value="S">Sí</option>
                                            </select>
                                        </div>
                                    </div>
                                </div>
                                <div class="row">
                                    <div class="col-md-6">
                                        <div class="form-group">
                                            <label class="font-weight-bold">Describir cambios relevantes en el cambio de insumo o catálogo de conceptos utilizados:</label>
                                            <textarea class="form-control" id="txtCambiosCatalogoSeg" rows="3" placeholder="Describa los cambios en el catálogo de conceptos..."></textarea>
                                        </div>
                                    </div>
                                    <div class="col-md-6">
                                        <div class="form-group">
                                            <label class="font-weight-bold">Describir cambios en el avance físico planeado con el real:</label>
                                            <textarea class="form-control" id="txtCambiosAvanceFisicoSeg" rows="3" placeholder="Describa las diferencias entre el avance planeado y el real..."></textarea>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <!-- SECCION 3: Album de Fotos -->
                        <%--<div class="card card-custom gutter-b" style="border-left:4px solid #FFA800 !important;">
                            <div class="card-header" style="background-color:#fff8e8; min-height:45px;">
                                <div class="card-title mb-0">
                                    <i class="fas fa-camera text-warning mr-2"></i>
                                    <span class="font-weight-bold text-warning">SECCIÓN 3 — Álbum de Fotos</span>
                                    <small class="text-muted ml-2">(fotos nuevas para este seguimiento)</small>
                                </div>
                            </div>
                            <div class="card-body">
                                <div class="row">
                                    <div class="col-md-4">
                                        <div class="form-group">
                                            <label class="font-weight-bold">Foto 1:</label>
                                            <input type="file" class="form-control" id="fileFoto1Seg" accept="image/*">
                                            <img id="imgFoto1Seg" class="foto-preview mt-2 rounded border" style="display:none; max-width:100%; max-height:150px;">
                                            <textarea class="form-control mt-2" id="txtObsFoto1Seg" rows="2" placeholder="Descripción / Observación foto 1"></textarea>
                                        </div>
                                    </div>
                                    <div class="col-md-4">
                                        <div class="form-group">
                                            <label class="font-weight-bold">Foto 2:</label>
                                            <input type="file" class="form-control" id="fileFoto2Seg" accept="image/*">
                                            <img id="imgFoto2Seg" class="foto-preview mt-2 rounded border" style="display:none; max-width:100%; max-height:150px;">
                                            <textarea class="form-control mt-2" id="txtObsFoto2Seg" rows="2" placeholder="Descripción / Observación foto 2"></textarea>
                                        </div>
                                    </div>
                                    <div class="col-md-4">
                                        <div class="form-group">
                                            <label class="font-weight-bold">Foto 3:</label>
                                            <input type="file" class="form-control" id="fileFoto3Seg" accept="image/*">
                                            <img id="imgFoto3Seg" class="foto-preview mt-2 rounded border" style="display:none; max-width:100%; max-height:150px;">
                                            <textarea class="form-control mt-2" id="txtObsFoto3Seg" rows="2" placeholder="Descripción / Observación foto 3"></textarea>
                                        </div>
                                    </div>
                                </div>
                                <div class="row">
                                    <div class="col-md-4">
                                        <div class="form-group">
                                            <label class="font-weight-bold">Foto 4:</label>
                                            <input type="file" class="form-control" id="fileFoto4Seg" accept="image/*">
                                            <img id="imgFoto4Seg" class="foto-preview mt-2 rounded border" style="display:none; max-width:100%; max-height:150px;">
                                            <textarea class="form-control mt-2" id="txtObsFoto4Seg" rows="2" placeholder="Descripción / Observación foto 4"></textarea>
                                        </div>
                                    </div>
                                    <div class="col-md-4">
                                        <div class="form-group">
                                            <label class="font-weight-bold">Foto 5:</label>
                                            <input type="file" class="form-control" id="fileFoto5Seg" accept="image/*">
                                            <img id="imgFoto5Seg" class="foto-preview mt-2 rounded border" style="display:none; max-width:100%; max-height:150px;">
                                            <textarea class="form-control mt-2" id="txtObsFoto5Seg" rows="2" placeholder="Descripción / Observación foto 5"></textarea>
                                        </div>
                                    </div>
                                    <div class="col-md-4">
                                        <div class="form-group">
                                            <label class="font-weight-bold">Foto 6:</label>
                                            <input type="file" class="form-control" id="fileFoto6Seg" accept="image/*">
                                            <img id="imgFoto6Seg" class="foto-preview mt-2 rounded border" style="display:none; max-width:100%; max-height:150px;">
                                            <textarea class="form-control mt-2" id="txtObsFoto6Seg" rows="2" placeholder="Descripción / Observación foto 6"></textarea>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>--%>
                        <%-- ═══════════════════════════════════════════════════════════════════
                             SECCION 3: Album de Fotos (DESACTIVADO - reservado para uso futuro)
                             Se reemplazó por Reporte Fotográfico por Partidas (ver abajo).
                             Para reactivar: descomentar este bloque y comentar la sección de partidas.
                        <div class="card card-custom gutter-b" style="border-left:4px solid #FFA800">
                            ... fotos fijas 1-6 ...
                        </div>
                        ══════════════════════════════════════════════════════════════════════ --%>

                        <!-- ═══ SECCIÓN 3 — REPORTE FOTOGRÁFICO POR PARTIDAS ═══ -->
                        <div class="card card-custom gutter-b shadow-sm mt-3" style="border-left:4px solid #c0392b !important;">
                            <div class="card-header" style="background:#fff0f2; min-height:45px; padding:10px 20px;">
                                <div class="card-title mb-0">
                                    <i class="fas fa-images text-danger mr-2"></i>
                                    <span class="font-weight-bold text-danger">SECCIÓN 3 — REPORTE FOTOGRÁFICO</span>
                                    <small class="text-muted ml-2 font-weight-normal">(2 fotos por partida con coordenadas)</small>
                                </div>
                            </div>
                            <div class="card-body pb-2" id="contenedorPartidasFotosSeg">
                                <!-- JS renderiza aquí las partidas con sus 2 slots de foto -->
                                <div id="sinPartidasFotosSeg" class="text-center text-muted py-4">
                                    <i class="fas fa-layer-group fa-2x mb-2 d-block"></i>
                                    <small>No hay partidas registradas en el inicio de esta acción.</small>
                                </div>
                                <div id="listaPartidasFotosSeg"></div>
                            </div>
                        </div>

                    </div><%-- /vistaSeguimientoForm --%>

                </div><%-- /modal-body --%>

                <!-- FOOTER - cambia segun la vista activa -->
                <div class="modal-footer">
                    <!-- Campos ocultos globales -->
                    <input type="hidden" id="hddIdAccionSeg">
                    <input type="hidden" id="hddNombreObraSeg">
                    <input type="hidden" id="hddLocalidadSeg">
                    <input type="hidden" id="hddIdAccionFormSeg">
                    <input type="hidden" id="hddIdObraFormSeg">
                    <input type="hidden" id="hddIdSeguimiento">
                    <input type="hidden" id="hddRutaFoto1Seg">
                    <input type="hidden" id="hddRutaFoto2Seg">
                    <input type="hidden" id="hddRutaFoto3Seg">
                    <input type="hidden" id="hddRutaFoto4Seg">
                    <input type="hidden" id="hddRutaFoto5Seg">
                    <input type="hidden" id="hddRutaFoto6Seg">
                    <input type="hidden" id="hddAccionMovSeg" value="A">
                    <input type="hidden" id="hddIdRubroSeg">
                    <input type="hidden" id="hddRubroSeg">
                    <input type="hidden" id="hddIdSubrubroSeg">
                    <input type="hidden" id="hddSubrubroSeg">

                    <!-- Botones Vista Grid -->
                    <div id="footerGridSeg">
                        <button type="button" class="btn btn-secondary" id="btnCerrarGridSeg">
                            <i class="fas fa-times"></i> Cerrar
                        </button>
                    </div>

                    <!-- Botones Vista Formulario -->
                    <div id="footerFormSeg" style="display:none;">
                        <button type="button" class="btn btn-info mr-2" id="btnGuardarSeguimiento">
                            <i class="flaticon-disk"></i> Guardar Seguimiento
                        </button>
                        <button type="button" class="btn btn-secondary" id="btnCancelarFormSeg">
                            <i class="fas fa-arrow-left"></i> Regresar al listado
                        </button>
                    </div>
                </div>

            </div>
        </div>
    </div>

    <!-- ======================= MODAL DATOS FINALES ======================= -->
        <div class="modal fade" id="modalDatosFinales" tabindex="-1" role="dialog"
         data-backdrop="static" data-keyboard="false">
        <div class="modal-dialog modal-xl" role="document" style="max-width:95%;">
            <div class="modal-content">

                <div class="modal-header" style="background: linear-gradient(135deg,#F64E60 0%,#ee2d41 100%);">
                    <h5 class="modal-title text-white">
                        <i class="fas fa-flag-checkered mr-2"></i> Datos Finales de la Obra
                    </h5>
                    <button type="button" class="close text-white" data-dismiss="modal">&times;</button>
                </div>

                <div class="modal-body" style="max-height:78vh; overflow-y:auto; background:#f5f5f5;">

                    <!-- ENCABEZADO DE LA OBRA -->
                    <table class="table table-bordered table-header-info mb-0">
                        <tr>
                            <td style="width:160px; font-weight:bold; background:#f3f6f9;">Obra:</td>
                            <td id="lblObraFinal" colspan="3"></td>
                        </tr>
                        <tr>
                            <td style="font-weight:bold; background:#f3f6f9;">Rubro:</td>
                            <td id="lblRubroFinal"></td>
                            <td style="font-weight:bold; background:#f3f6f9; width:140px;">Num. Contrato:</td>
                            <td id="lblContratoFinal"></td>
                        </tr>
                        <tr>
                            <td style="font-weight:bold; background:#f3f6f9;">Localidad:</td>
                            <td id="lblLocalidadFinal"></td>
                            <td style="font-weight:bold; background:#f3f6f9;">Monto Contratado:</td>
                            <td id="lblMontoFinal" class="text-success font-weight-bold"></td>
                        </tr>
                        <tr>
                            <td style="font-weight:bold; background:#f3f6f9;">Fuente Financiamiento:</td>
                            <td id="lblFuenteFinal"></td>
                            <td style="font-weight:bold; background:#f3f6f9;">Periodo:</td>
                            <td><span id="lblPeriodoInicioFinal"></span> - <span id="lblPeriodoFinFinal"></span></td>
                        </tr>
                        <tr>
                            <td style="font-weight:bold; background:#f3f6f9;">Clave Localidad:</td>
                            <td id="lblClaveLocalidadFinal"></td>
                            <td style="font-weight:bold; background:#f3f6f9;">Meta:</td>
                            <td><span id="lblMetaCantidadFinal"></span> <span id="lblMetaUnidadFinal"></span></td>
                        </tr>
                        <tr>
                            <td style="font-weight:bold; background:#f3f6f9;">Descripción Acción:</td>
                            <td id="lblDescripcionAccionFinal" colspan="3"></td>
                        </tr>
                    </table>

                    <!-- Badge de modo (Agregar / Modificar) -->
                    <div class="my-3 px-1">
                        <span id="badgeModoFinal" class="badge badge-success px-4 py-2" style="font-size:13px;">
                            <i class="fas fa-plus-circle mr-1"></i> Primer registro final
                        </span>
                    </div>

                    <!-- ═══════════════════════════════════════════════════════════ -->
                    <!-- SECCIÓN A — Datos heredados del último seguimiento         -->
                    <!-- ═══════════════════════════════════════════════════════════ -->
                    <div class="card card-custom gutter-b" style="border-left:4px solid var(--mg-primary) !important;">
                        <div class="card-header" style="background:rgba(210,35,42,0.08); min-height:45px; padding:10px 20px;">
                            <div class="card-title mb-0">
                                <i class="fas fa-history text-primary mr-2"></i>
                                <span class="font-weight-bold text-primary">SECCIÓN A — Datos del Último Seguimiento</span>
                                <small class="text-muted ml-2">(heredados automáticamente, se pueden modificar)</small>
                            </div>
                        </div>
                        <div class="card-body">
                            <div class="row">
                                <div class="col-md-3">
                                    <div class="form-group">
                                        <label class="font-weight-bold">No. AGEB:</label>
                                        <input type="text" class="form-control" id="txtNoAgebFinal" placeholder="Clave AGEB">
                                    </div>
                                </div>
                                <div class="col-md-9">
                                    <div class="form-group">
                                        <label class="font-weight-bold">Modalidad del Proyecto:</label>
                                        <div class="checkbox-inline mt-1">
                                            <label class="checkbox checkbox-outline checkbox-primary">
                                                <input type="checkbox" id="chkAmpliaFinal"><span></span> Ampliación
                                            </label>
                                            <label class="checkbox checkbox-outline checkbox-primary ml-3">
                                                <input type="checkbox" id="chkConstruccionFinal"><span></span> Construcción
                                            </label>
                                            <label class="checkbox checkbox-outline checkbox-primary ml-3">
                                                <input type="checkbox" id="chkEquipamientoFinal"><span></span> Equipamiento
                                            </label>
                                            <label class="checkbox checkbox-outline checkbox-primary ml-3">
                                                <input type="checkbox" id="chkMantenimientoFinal"><span></span> Mantenimiento
                                            </label>
                                            <label class="checkbox checkbox-outline checkbox-primary ml-3">
                                                <input type="checkbox" id="chkRehabilitacionFinal"><span></span> Rehabilitación
                                            </label>
                                        </div>
                                    </div>
                                </div>
                            </div>
                            <label class="font-weight-bold">Montos de Inversión:</label>
                            <div class="row">
                                <div class="col-md-2">
                                    <div class="form-group">
                                        <label class="text-muted small">Aportación FISMDF:</label>
                                        <input type="text" class="form-control form-control-sm text-right" id="txtAportacionFismdfFinal" value="0.00">
                                    </div>
                                </div>
                                <div class="col-md-2">
                                    <div class="form-group">
                                        <label class="text-muted small">Otra Fuente Federal:</label>
                                        <input type="text" class="form-control form-control-sm text-right" id="txtOtraFuenteFederalFinal" value="0.00">
                                    </div>
                                </div>
                                <div class="col-md-2">
                                    <div class="form-group">
                                        <label class="text-muted small">Fuente Estatal:</label>
                                        <input type="text" class="form-control form-control-sm text-right" id="txtFuenteEstatalFinal" value="0.00">
                                    </div>
                                </div>
                                <div class="col-md-2">
                                    <div class="form-group">
                                        <label class="text-muted small">Fuente Municipal:</label>
                                        <input type="text" class="form-control form-control-sm text-right" id="txtFuenteMunicipalFinal" value="0.00">
                                    </div>
                                </div>
                                <div class="col-md-2">
                                    <div class="form-group">
                                        <label class="text-muted small">Otros:</label>
                                        <input type="text" class="form-control form-control-sm text-right" id="txtOtrosFinal" value="0.00">
                                    </div>
                                </div>
                                <div class="col-md-2">
                                    <div class="form-group">
                                        <label class="text-muted small font-weight-bold text-dark">Costo Total:</label>
                                        <input type="text" class="form-control form-control-sm text-right font-weight-bold" id="txtCostoTotalFinal" value="0.00">
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    <!-- ═══════════════════════════════════════════════════════════ -->
                    <!-- SECCIÓN B — Datos exclusivos del cierre final              -->
                    <!-- ═══════════════════════════════════════════════════════════ -->
                    <div class="card card-custom gutter-b" style="border-left:4px solid #F64E60 !important;">
                        <div class="card-header" style="background:#fff0f2; min-height:45px; padding:10px 20px;">
                            <div class="card-title mb-0">
                                <i class="fas fa-flag-checkered text-danger mr-2"></i>
                                <span class="font-weight-bold text-danger">SECCIÓN B — Datos Exclusivos del Cierre Final</span>
                                <small class="text-muted ml-2">(captura obligatoria para el seguimiento final)</small>
                            </div>
                        </div>
                        <div class="card-body">
                            <div class="row">
                                <div class="col-md-3">
                                    <div class="form-group">
                                        <label class="font-weight-bold required-field">Fecha Verificación:</label>
                                        <input type="text" class="form-control fecha" id="txtFechaVerificacionFinal" placeholder="dd/mm/aaaa">
                                    </div>
                                </div>
                                <div class="col-md-3">
                                    <div class="form-group">
                                        <label class="font-weight-bold required-field">Obra Concluida:</label>
                                        <select class="form-control" id="cboObraConcluidaFinal">
                                            <option value="S">Sí</option>
                                            <option value="N">No</option>
                                        </select>
                                    </div>
                                </div>
                                <div class="col-md-3">
                                    <div class="form-group">
                                        <label class="font-weight-bold">Coincide con Planeación:</label>
                                        <select class="form-control" id="cboCoincidePlaneacionFinal">
                                            <option value="S">Sí</option>
                                            <option value="N">No</option>
                                        </select>
                                    </div>
                                </div>
                                <div class="col-md-3">
                                    <div class="form-group">
                                        <label class="font-weight-bold">Catálogo de Conceptos:</label>
                                        <select class="form-control" id="cboCatalogoConceptosFinal">
                                            <option value="N">No</option>
                                            <option value="S">Sí</option>
                                        </select>
                                    </div>
                                </div>
                            </div>
                            <div class="row">
                                <div class="col-md-3">
                                    <div class="form-group">
                                        <label class="font-weight-bold">Periodo Ejecución Inicio:</label>
                                        <input type="text" class="form-control fecha" id="txtPeriodoEjecucionInicioFinal" placeholder="dd/mm/aaaa">
                                    </div>
                                </div>
                                <div class="col-md-3">
                                    <div class="form-group">
                                        <label class="font-weight-bold">Periodo Ejecución Final:</label>
                                        <input type="text" class="form-control fecha" id="txtPeriodoEjecucionFinalFinal" placeholder="dd/mm/aaaa">
                                    </div>
                                </div>
                                <div class="col-md-3">
                                    <div class="form-group">
                                        <label class="font-weight-bold">Coincide con Rubro:</label>
                                        <select class="form-control" id="cboCoincideRubroFinal">
                                            <option value="S">Sí</option>
                                            <option value="N">No</option>
                                        </select>
                                    </div>
                                </div>
                            </div>
                            <div class="row">
                                <div class="col-md-6">
                                    <div class="form-group">
                                        <label class="font-weight-bold">Descripción (si no coincide planeación):</label>
                                        <textarea class="form-control" id="txtDescripcionNoCoincideFinal" rows="2"
                                                  placeholder="Describa por qué no coincide con la planeación..."></textarea>
                                    </div>
                                </div>
                                <div class="col-md-6">
                                    <div class="form-group">
                                        <label class="font-weight-bold">Descripción (si no coincide rubro):</label>
                                        <textarea class="form-control" id="txtNoCoincideRubroFinal" rows="2"
                                                  placeholder="Describa por qué no coincide con el rubro..."></textarea>
                                    </div>
                                </div>
                            </div>
                            <div class="row">
                                <div class="col-md-6">
                                    <div class="form-group">
                                        <label class="font-weight-bold">Cambios en Catálogo de Conceptos:</label>
                                        <textarea class="form-control" id="txtCambiosCatalogoFinal" rows="2"
                                                  placeholder="Describa los cambios en el catálogo de conceptos..."></textarea>
                                    </div>
                                </div>
                                <div class="col-md-6">
                                    <div class="form-group">
                                        <label class="font-weight-bold">Descripción de Trabajos Realizados:</label>
                                        <textarea class="form-control" id="txtDescripcionTrabajosFinal" rows="2"
                                                  placeholder="Describa los trabajos realizados..."></textarea>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    <%-- ═══════════════════════════════════════════════════════════ --%>
                    <%-- SECCIÓN C — Álbum genérico (comentado, reemplazado por partidas) --%>
                    <%-- ═══════════════════════════════════════════════════════════ --%>
                    <%--
                    <div class="card card-custom gutter-b" style="border-left:4px solid #FFA800 !important;">
                        ... álbum de 6 fotos genéricas (desactivado) ...
                    </div>
                    --%>

                    <!-- ═══════════════════════════════════════════════════════════ -->
                    <!-- SECCIÓN C — Reporte Fotográfico por Partidas (Cierre)     -->
                    <!-- ═══════════════════════════════════════════════════════════ -->
                    <div class="card card-custom gutter-b" style="border-left:4px solid #FFA800 !important;">
                        <div class="card-header" style="background:#fff8e8; min-height:45px; padding:10px 20px;">
                            <div class="card-title mb-0">
                                <i class="fas fa-camera text-warning mr-2"></i>
                                <span class="font-weight-bold text-warning">SECCIÓN C — Reporte Fotográfico por Partidas</span>
                                <small class="text-muted ml-2">(2 fotos por partida al cierre de obra)</small>
                            </div>
                        </div>
                        <div class="card-body p-3">
                            <div id="sinPartidasFotosFinal" class="text-center text-muted py-4">
                                <i class="fas fa-layer-group fa-2x mb-2 d-block"></i>
                                <small>Cargando partidas...</small>
                            </div>
                            <div id="listaPartidasFotosFinal"></div>
                        </div>
                    </div>

                </div><%-- /modal-body --%>

                <div class="modal-footer">
                    <input type="hidden" id="hddIdAccionFinal">
                    <input type="hidden" id="hddIdObraFinal">
                    <input type="hidden" id="hddAccionMovFinal" value="A">
                    <input type="hidden" id="hddIdRubroFinal">
                    <input type="hidden" id="hddRubroFinal">
                    <input type="hidden" id="hddIdSubrubroFinal">
                    <input type="hidden" id="hddSubrubroFinal">
                    <input type="hidden" id="hddRutaFoto1Final">
                    <input type="hidden" id="hddRutaFoto2Final">
                    <input type="hidden" id="hddRutaFoto3Final">
                    <input type="hidden" id="hddRutaFoto4Final">
                    <input type="hidden" id="hddRutaFoto5Final">
                    <input type="hidden" id="hddRutaFoto6Final">
                    <input type="hidden" id="hddIdSeguimientoFinal">
                    <button type="button" class="btn btn-danger" id="btnGuardarDatosFinal">
                        <i class="flaticon-disk mr-1"></i> Guardar Datos Finales
                    </button>
                    <button type="button" class="btn btn-secondary" data-dismiss="modal">
                        <i class="fas fa-times mr-1"></i> Cerrar
                    </button>
                </div>

            </div>
        </div>
    </div>

    <!-- ======================= MODAL FICHA FISM ======================= -->
    <div class="modal fade" id="modalFichaFism" tabindex="-1" role="dialog" aria-labelledby="titleFichaFism">
        <div class="modal-dialog modal-dialog-custom modal-xl" role="document">
            <div class="modal-content">

                <!-- HEADER -->
                <div class="modal-header" style="background: linear-gradient(135deg,#1a237e,#283593); padding:12px 20px;">
                    <div class="d-flex align-items-center">
                        <i class="fas fa-file-invoice-dollar text-warning mr-2" style="font-size:1.3rem;"></i>
                        <h5 class="modal-title text-white mb-0" id="titleFichaFism">
                            FICHA TÉCNICA DE OBRA &nbsp;<span class="badge badge-warning text-dark" style="font-size:.75rem;">F.I.S.M.</span>
                        </h5>
                    </div>
                    <button type="button" class="close text-white" data-dismiss="modal" aria-label="Cerrar">&times;</button>
                </div>
                <div class="modal-body" style="background:#f8f9fa;">

                    <!-- ── ENCABEZADO DATOS GENERALES ────────────────────────── -->
                    <div class="card shadow-sm mb-4 border-0">
                        <div class="card-header py-2" style="background:#1a237e;">
                            <span class="text-white font-weight-bold">
                                <i class="fas fa-info-circle mr-1"></i> Datos Generales
                            </span>
                        </div>
                        <div class="card-body pb-2" style="background:#eef1ff;">
                            <div class="mb-2">
                                <small class="text-muted text-uppercase" style="font-size:.7rem; letter-spacing:.05em;">Obra</small>
                                <div id="lblObraFism" class="font-weight-bold text-dark text-break" style="font-size:.95rem;"></div>
                            </div>
                            <div class="row">
                                <div class="col-md-4 col-12 mb-2">
                                    <small class="text-muted text-uppercase" style="font-size:.7rem;">Rubro</small>
                                    <div id="lblRubroFism" class="font-weight-bold"></div>
                                </div>
                                <div class="col-md-4 col-12 mb-2">
                                    <small class="text-muted text-uppercase" style="font-size:.7rem;">Subclasificación</small>
                                    <div id="lblSubclasificacionFism" class="font-weight-bold"></div>
                                </div>
                                <div class="col-md-4 col-12 mb-2">
                                    <small class="text-muted text-uppercase" style="font-size:.7rem;">Modalidad</small>
                                    <div id="lblModalidadFism" class="font-weight-bold"></div>
                                </div>
                                <div class="col-md-4 col-12 mb-2">
                                    <small class="text-muted text-uppercase" style="font-size:.7rem;">Núm. Contrato</small>
                                    <div id="lblContratoFism" class="font-weight-bold"></div>
                                </div>
                                <div class="col-md-4 col-12 mb-2">
                                    <small class="text-muted text-uppercase" style="font-size:.7rem;">Monto Contratado</small>
                                    <div id="lblMontoFism" class="font-weight-bold text-success"></div>
                                </div>
                                <div class="col-md-4 col-12 mb-2">
                                    <small class="text-muted text-uppercase" style="font-size:.7rem;">Localidad</small>
                                    <div id="lblLocalidadFism" class="font-weight-bold"></div>
                                </div>
                                <div class="col-md-4 col-12 mb-2">
                                    <small class="text-muted text-uppercase" style="font-size:.7rem;">Clave Localidad</small>
                                    <div id="lblClaveLocalidadFism" class="font-weight-bold"></div>
                                </div>
                                <div class="col-md-4 col-12 mb-2">
                                    <small class="text-muted text-uppercase" style="font-size:.7rem;">Fuente Financiamiento</small>
                                    <div id="lblFuenteFism" class="font-weight-bold"></div>
                                </div>
                                <div class="col-md-4 col-12 mb-2">
                                    <small class="text-muted text-uppercase" style="font-size:.7rem;">Periodo de Ejecución</small>
                                    <div class="font-weight-bold">
                                        <span id="lblPeriodoInicioFism"></span>
                                        &nbsp;—&nbsp;
                                        <span id="lblPeriodoFinFism"></span>
                                    </div>
                                </div>
                                <div class="col-md-4 col-12 mb-2">
                                    <small class="text-muted text-uppercase" style="font-size:.7rem;">Programa</small>
                                    <div id="lblProgramaFism" class="font-weight-bold"></div>
                                </div>
                                <div class="col-md-12 mb-2">
                                    <small class="text-muted text-uppercase" style="font-size:.7rem;">Descripción de la Obra (encabezado)</small>
                                    <div id="lblDescripcionObraFism" class="font-weight-bold text-break"></div>
                                </div>
                            </div>
                        </div>
                    </div>

                    <!-- ── OFICIOS ────────────────────────────────────────────── -->
                    <div class="card shadow-sm mb-4 border-0">
                        <div class="card-header py-2" style="background:#37474f;">
                            <span class="text-white font-weight-bold">
                                <i class="fas fa-stamp mr-1"></i> Oficios
                            </span>
                        </div>
                        <div class="card-body">
                            <div class="row">
                                <div class="col-md-6">
                                    <div class="form-group">
                                        <label class="font-weight-bold">N° Oficio de Reg. y Control emitido por el Municipio</label>
                                        <input type="text" class="form-control" id="txtoficioreg"
                                               placeholder="Ej. MCC/DP/FAISMUN-168/2024">
                                    </div>
                                </div>
                                <div class="col-md-6">
                                    <div class="form-group">
                                        <label class="font-weight-bold">Número de Obra emitido por el Municipio</label>
                                        <input type="text" class="form-control" id="txtnumobramun"
                                               placeholder="Ej. 031-213-168">
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    <!-- ── SITUACIÓN FINANCIERA ──────────────────────────────── -->
                    <div class="card shadow-sm mb-4 border-0">
                        <div class="card-header py-2" style="background:#b71c1c;">
                            <span class="text-white font-weight-bold">
                                <i class="fas fa-chart-bar mr-1"></i> Situación Financiera
                            </span>
                        </div>
                        <div class="card-body p-0">
                            <div class="table-responsive">
                                <table class="table table-bordered table-sm mb-0" style="min-width:700px;">
                                    <thead>
                                        <tr style="background:#1a237e; color:#fff;">
                                            <th style="width:22%;">Concepto</th>
                                            <th class="text-center" style="width:26%;">Inversión Programada $</th>
                                            <th class="text-center" style="width:26%;">Inversión Ejercida $</th>
                                            <th class="text-center" style="width:26%;">Saldo $</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        <tr>
                                            <td class="align-middle font-weight-bold text-danger">F.I.S.M.</td>
                                            <td><input type="text" class="form-control form-control-sm text-right fism-calc" id="txtInversionProgramadaFism" value="0.00"></td>
                                            <td><input type="text" class="form-control form-control-sm text-right fism-calc" id="txtInversionEjercidaFism" value="0.00"></td>
                                            <td><input type="text" class="form-control form-control-sm text-right bg-light" id="txtsaldofism" value="0.00" readonly></td>
                                        </tr>
                                        <tr>
                                            <td class="align-middle font-weight-bold text-danger">Aportación Beneficiarios</td>
                                            <td><input type="text" class="form-control form-control-sm text-right fism-calc" id="txtAportacionProgramadaFism" value="0.00"></td>
                                            <td><input type="text" class="form-control form-control-sm text-right fism-calc" id="txtAportacionEjercidaFism" value="0.00"></td>
                                            <td><input type="text" class="form-control form-control-sm text-right bg-light" id="txtaportacionfism" value="0.00" readonly></td>
                                        </tr>
                                        <tr>
                                            <td class="align-middle font-weight-bold text-danger">Otros</td>
                                            <td><input type="text" class="form-control form-control-sm text-right fism-calc" id="txtotrosprogramada" value="0.00"></td>
                                            <td><input type="text" class="form-control form-control-sm text-right fism-calc" id="txtotrosejercida" value="0.00"></td>
                                            <td><input type="text" class="form-control form-control-sm text-right bg-light" id="txtotrossaldofism" value="0.00" readonly></td>
                                        </tr>
                                        <tr style="background:#fff3e0;">
                                            <td class="align-middle font-weight-bold">Total</td>
                                            <td><input type="text" class="form-control form-control-sm text-right font-weight-bold bg-light" id="txttotalprogramada" value="0.00" readonly></td>
                                            <td><input type="text" class="form-control form-control-sm text-right font-weight-bold bg-light" id="txttotalejercida" value="0.00" readonly></td>
                                            <td><input type="text" class="form-control form-control-sm text-right font-weight-bold bg-light" id="txttotalsaldo" value="0.00" readonly></td>
                                        </tr>
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>

                    <!-- ── DESCRIPCIÓN Y AVANCES ─────────────────────────────── -->
                    <div class="card shadow-sm mb-4 border-0">
                        <div class="card-header py-2" style="background:#e65100;">
                            <span class="text-white font-weight-bold">
                                <i class="fas fa-align-left mr-1"></i> Descripción de la Obra y Avances
                            </span>
                        </div>
                        <div class="card-body">
                            <div class="form-group">
                                <label class="font-weight-bold">Descripción de la Obra</label>
                                <textarea class="form-control" id="txtdescripcionobrafism" rows="4"
                                          placeholder="Descripción detallada de la obra..."></textarea>
                            </div>
                            <div class="row mt-2">
                                <div class="col-md-4">
                                    <div class="form-group">
                                        <label class="font-weight-bold">Núm. Dictamen</label>
                                        <input type="text" class="form-control" id="txtDictamenFism" placeholder="Número de dictamen">
                                    </div>
                                </div>
                                <div class="col-md-4">
                                    <div class="form-group">
                                        <label class="font-weight-bold text-danger">Fecha Prog. Inicio</label>
                                        <div class="input-group date">
                                            <input type="text" class="form-control fecha" id="txtFechaInicioProgramadaFism"
                                                   placeholder="dd/mm/aaaa" autocomplete="off" readonly>
                                            <div class="input-group-append">
                                                <span class="input-group-text"><i class="far fa-calendar-alt"></i></span>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                                <div class="col-md-4">
                                    <div class="form-group">
                                        <label class="font-weight-bold text-danger">Fecha Prog. Final</label>
                                        <div class="input-group date">
                                            <input type="text" class="form-control fecha" id="txtFechaFinalProgramadaFism"
                                                   placeholder="dd/mm/aaaa" autocomplete="off" readonly>
                                            <div class="input-group-append">
                                                <span class="input-group-text"><i class="far fa-calendar-alt"></i></span>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                            <!-- Avances -->
                            <div class="row mt-1">
                                <div class="col-md-3">
                                    <div class="form-group">
                                        <label class="font-weight-bold">Avance Físico <small class="text-muted">%</small></label>
                                        <input type="text" class="form-control text-right" id="txtavancefisicofism"
                                               value="0" placeholder="0">
                                    </div>
                                </div>
                                <div class="col-md-3">
                                    <div class="form-group">
                                        <label class="font-weight-bold">Avance Financiero <small class="text-muted">%</small></label>
                                        <input type="text" class="form-control text-right" id="txtavancefinancierofism"
                                               value="0" placeholder="0">
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    <!-- ── CONVENIOS MODIFICATORIOS ──────────────────────────── -->
                    <div class="card shadow-sm mb-4 border-0">
                        <div class="card-header py-2" style="background:#4a148c;">
                            <span class="text-white font-weight-bold">
                                <i class="fas fa-file-signature mr-1"></i> Convenios Modificatorios
                            </span>
                        </div>
                        <div class="card-body">
                            <div class="table-responsive">
                                <table class="table table-bordered table-sm" style="min-width:600px;">
                                    <thead class="thead-light">
                                        <tr>
                                            <th style="width:14%;">Tipo</th>
                                            <th style="width:22%;">Importe <small class="text-muted">$</small></th>
                                            <th style="width:22%;">Fecha Inicio</th>
                                            <th style="width:22%;">Fecha Término</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        <tr>
                                            <td class="align-middle font-weight-bold text-primary">Contrato</td>
                                            <td><input type="text" class="form-control form-control-sm text-right" id="txtContratoImporteFism" value="0.00"></td>
                                            <td>
                                                <div class="input-group input-group-sm date">
                                                    <input type="text" class="form-control form-control-sm fecha" id="txtContratoInicioFism" placeholder="dd/mm/aaaa" autocomplete="off" readonly>
                                                    <div class="input-group-append"><span class="input-group-text"><i class="far fa-calendar-alt"></i></span></div>
                                                </div>
                                            </td>
                                            <td>
                                                <div class="input-group input-group-sm date">
                                                    <input type="text" class="form-control form-control-sm fecha" id="txtContratoFinFism" placeholder="dd/mm/aaaa" autocomplete="off" readonly>
                                                    <div class="input-group-append"><span class="input-group-text"><i class="far fa-calendar-alt"></i></span></div>
                                                </div>
                                            </td>
                                        </tr>
                                        <tr>
                                            <td class="align-middle font-weight-bold text-warning">Diferido</td>
                                            <td><input type="text" class="form-control form-control-sm text-right" id="txtDiferidoImporteFism" value="0.00"></td>
                                            <td>
                                                <div class="input-group input-group-sm date">
                                                    <input type="text" class="form-control form-control-sm fecha" id="txtDiferidoInicioFism" placeholder="dd/mm/aaaa" autocomplete="off" readonly>
                                                    <div class="input-group-append"><span class="input-group-text"><i class="far fa-calendar-alt"></i></span></div>
                                                </div>
                                            </td>
                                            <td>
                                                <div class="input-group input-group-sm date">
                                                    <input type="text" class="form-control form-control-sm fecha" id="txtDiferidoFinFism" placeholder="dd/mm/aaaa" autocomplete="off" readonly>
                                                    <div class="input-group-append"><span class="input-group-text"><i class="far fa-calendar-alt"></i></span></div>
                                                </div>
                                            </td>
                                        </tr>
                                        <tr>
                                            <td class="align-middle font-weight-bold text-danger">Ampl. Plazo</td>
                                            <td><input type="text" class="form-control form-control-sm text-right" id="txtAmpliacionImporteFism" value="0.00"></td>
                                            <td>
                                                <div class="input-group input-group-sm date">
                                                    <input type="text" class="form-control form-control-sm fecha" id="txtAmpliacionInicioFism" placeholder="dd/mm/aaaa" autocomplete="off" readonly>
                                                    <div class="input-group-append"><span class="input-group-text"><i class="far fa-calendar-alt"></i></span></div>
                                                </div>
                                            </td>
                                            <td>
                                                <div class="input-group input-group-sm date">
                                                    <input type="text" class="form-control form-control-sm fecha" id="txtAmpliacionFinFism" placeholder="dd/mm/aaaa" autocomplete="off" readonly>
                                                    <div class="input-group-append"><span class="input-group-text"><i class="far fa-calendar-alt"></i></span></div>
                                                </div>
                                            </td>
                                        </tr>
                                    </tbody>
                                </table>
                            </div>
                            <div class="form-group mt-3">
                                <label class="font-weight-bold">Observaciones</label>
                                <textarea class="form-control" id="txtObservacionesFism" rows="3"
                                          placeholder="Observaciones generales..."></textarea>
                            </div>
                        </div>
                    </div>

                    <!-- ── EVIDENCIA FOTOGRÁFICA CON GEOREFERENCIA ─────────── -->
                    <div class="card shadow-sm mb-3 border-0">
                        <div class="card-header py-2" style="background:#00695c;">
                            <span class="text-white font-weight-bold">
                                <i class="fas fa-camera mr-1"></i> Evidencia Fotográfica Georeferenciada
                            </span>
                        </div>
                        <div class="card-body">
                            <p class="text-muted small mb-3">
                                <i class="fas fa-info-circle mr-1"></i>
                                Registre una foto con georeferencia para cada etapa: Inicio, Intermedio y Final.
                            </p>
                            <div class="row">

                                <!-- ── FOTO INICIO ── -->
                                <div class="col-md-4 mb-4">
                                    <div class="card border-success h-100">
                                        <div class="card-header py-2" style="background:#2e7d32;">
                                            <span class="text-white font-weight-bold small">
                                                <i class="fas fa-flag mr-1"></i> INICIO
                                            </span>
                                        </div>
                                        <div class="card-body">
                                            <div id="accionesFotoInicioFism" style="display:none;" class="mb-2">
                                                <button type="button" class="btn btn-sm btn-outline-danger"
                                                        onclick="CedulaModule.eliminarFotoGeoFism('inicio')">
                                                    <i class="fas fa-trash-alt"></i> Eliminar
                                                </button>
                                            </div>
                                            <img id="imgFotoInicioFism" class="img-fluid rounded shadow-sm mb-2 w-100"
                                                 style="display:none; max-height:150px; object-fit:cover; cursor:pointer;"
                                                 onclick="window.open(this.src,'_blank')" title="Ver foto completa">
                                            <div id="placeholderFotoInicioFism" class="text-center text-muted py-3 small">
                                                <i class="fas fa-image fa-2x d-block mb-1"></i> Sin foto
                                            </div>
                                            <input type="file" class="form-control form-control-sm mt-1 file-foto-geo-fism"
                                                   id="fileFotoInicioFism" data-etapa="inicio" accept="image/*">
                                            <input type="hidden" id="hddRutaFotoInicioFism">
                                            <div class="row mt-2">
                                                <div class="col-6">
                                                    <label class="small mb-0 font-weight-bold">Latitud</label>
                                                    <input type="text" class="form-control form-control-sm"
                                                           id="txtlatitudinicio" placeholder="16.9952...">
                                                </div>
                                                <div class="col-6">
                                                    <label class="small mb-0 font-weight-bold">Longitud</label>
                                                    <input type="text" class="form-control form-control-sm"
                                                           id="txtlongitudinicio" placeholder="-92.1068...">
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <!-- ── FOTO INTERMEDIO ── -->
                                <div class="col-md-4 mb-4">
                                    <div class="card border-warning h-100">
                                        <div class="card-header py-2" style="background:#f57f17;">
                                            <span class="text-white font-weight-bold small">
                                                <i class="fas fa-tools mr-1"></i> INTERMEDIO
                                            </span>
                                        </div>
                                        <div class="card-body">
                                            <div id="accionesFotoIntermedioFism" style="display:none;" class="mb-2">
                                                <button type="button" class="btn btn-sm btn-outline-danger"
                                                        onclick="CedulaModule.eliminarFotoGeoFism('intermedio')">
                                                    <i class="fas fa-trash-alt"></i> Eliminar
                                                </button>
                                            </div>
                                            <img id="imgFotoIntermedioFism" class="img-fluid rounded shadow-sm mb-2 w-100"
                                                 style="display:none; max-height:150px; object-fit:cover; cursor:pointer;"
                                                 onclick="window.open(this.src,'_blank')" title="Ver foto completa">
                                            <div id="placeholderFotoIntermedioFism" class="text-center text-muted py-3 small">
                                                <i class="fas fa-image fa-2x d-block mb-1"></i> Sin foto
                                            </div>
                                            <input type="file" class="form-control form-control-sm mt-1 file-foto-geo-fism"
                                                   id="fileFotoIntermedioFism" data-etapa="intermedio" accept="image/*">
                                            <input type="hidden" id="hddRutaFotoIntermedioFism">
                                            <div class="row mt-2">
                                                <div class="col-6">
                                                    <label class="small mb-0 font-weight-bold">Latitud</label>
                                                    <input type="text" class="form-control form-control-sm"
                                                           id="txtlatitudintermedio" placeholder="16.9952...">
                                                </div>
                                                <div class="col-6">
                                                    <label class="small mb-0 font-weight-bold">Longitud</label>
                                                    <input type="text" class="form-control form-control-sm"
                                                           id="txtlongitudintermedio" placeholder="-92.1068...">
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <!-- ── FOTO FINAL ── -->
                                <div class="col-md-4 mb-4">
                                    <div class="card border-danger h-100">
                                        <div class="card-header py-2" style="background:#b71c1c;">
                                            <span class="text-white font-weight-bold small">
                                                <i class="fas fa-check-circle mr-1"></i> FINAL
                                            </span>
                                        </div>
                                        <div class="card-body">
                                            <div id="accionesFotoFinalFismGeo" style="display:none;" class="mb-2">
                                                <button type="button" class="btn btn-sm btn-outline-danger"
                                                        onclick="CedulaModule.eliminarFotoGeoFism('final')">
                                                    <i class="fas fa-trash-alt"></i> Eliminar
                                                </button>
                                            </div>
                                            <img id="imgFotoFinalFism" class="img-fluid rounded shadow-sm mb-2 w-100"
                                                 style="display:none; max-height:150px; object-fit:cover; cursor:pointer;"
                                                 onclick="window.open(this.src,'_blank')" title="Ver foto completa">
                                            <div id="placeholderFotoFinalFism" class="text-center text-muted py-3 small">
                                                <i class="fas fa-image fa-2x d-block mb-1"></i> Sin foto
                                            </div>
                                            <input type="file" class="form-control form-control-sm mt-1 file-foto-geo-fism"
                                                   id="fileFotoFinalFism" data-etapa="final" accept="image/*">
                                            <input type="hidden" id="hddRutaFotoFinalFism">
                                            <div class="row mt-2">
                                                <div class="col-6">
                                                    <label class="small mb-0 font-weight-bold">Latitud</label>
                                                    <input type="text" class="form-control form-control-sm"
                                                           id="txtlatitudfinal" placeholder="16.9973...">
                                                </div>
                                                <div class="col-6">
                                                    <label class="small mb-0 font-weight-bold">Longitud</label>
                                                    <input type="text" class="form-control form-control-sm"
                                                           id="txtlongitudfinal" placeholder="-92.1029...">
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                            </div><!-- /row fotos -->
                        </div>
                    </div>

                </div><!-- /modal-body -->

                <!-- FOOTER -->
                <div class="modal-footer" style="background:#f1f1f1; border-top:2px solid #dee2e6;">
                    <input type="hidden" id="hddIdAccionFism">
                    <input type="hidden" id="hddIdObraFism">
                    <input type="hidden" id="hddAccionMovFism" value="A">
                    <input type="hidden" id="hddIdProgramaFism">

                    <button type="button" class="btn btn-secondary" data-dismiss="modal">
                        <i class="fas fa-times mr-1"></i> Cerrar
                    </button>
                    <button type="button" class="btn btn-primary" id="btnGuardarFichaFism">
                        <i class="fas fa-save mr-1"></i> Guardar Ficha FISM
                    </button>
                </div>

            </div><!-- /modal-content -->
        </div><!-- /modal-dialog -->
    </div>
    

    <!-- ======================= MODAL FINIQUITO ======================= -->
    <div class="modal fade" id="modalFiniquito" tabindex="-1" role="dialog">
        <div class="modal-dialog modal-dialog-custom modal-xl" role="document">
            <div class="modal-content">
                <div class="modal-header bg-danger">
                    <h5 class="modal-title text-white">Datos de Finiquito</h5>
                    <button type="button" class="close text-white" data-dismiss="modal">&times;</button>
                </div>
                <div class="modal-body">
                    <!-- Encabezado -->
                    <table class="table table-bordered table-header-info mb-4">
                        <tr>
                            <td>Obra:</td>
                            <td id="lblObraFiniquito" colspan="3"></td>
                        </tr>
                        <tr>
                            <td>Clave Municipal:</td>
                            <td id="lblClaveMunicipalFiniquito"></td>
                            <td>Municipio:</td>
                            <td id="lblMunicipioFiniquito"></td>
                        </tr>
                        <tr>
                            <td>Numero Obra:</td>
                            <td id="lblNumeroObraFiniquito"></td>
                            <td>Contrato:</td>
                            <td id="lblContratoFiniquito"></td>
                        </tr>
                        <tr>
                            <td>Contratista:</td>
                            <td id="lblContratistaFiniquito" colspan="3"></td>
                        </tr>
                        <tr>
                            <td>Descripcion Obra:</td>
                            <td id="lblDescripcionObraFiniquito" colspan="3"></td>
                        </tr>
                        <tr>
                            <td>Periodo Contrato:</td>
                            <td><span id="lblPeriodoInicioFiniquito"></span> - <span id="lblPeriodoFinFiniquito"></span></td>
                            <td>Fuente Financiamiento:</td>
                            <td id="lblFuenteFiniquito"></td>
                        </tr>
                        <tr>
                            <td>Monto Fuente:</td>
                            <td id="lblMontoFuenteFiniquito" colspan="3"></td>
                        </tr>
                    </table>

                    <!-- Formulario -->
                    <div class="row">
                        <div class="col-md-6">
                            <div class="form-group">
                                <label>Programa:</label>
                                <input type="text" class="form-control" id="txtProgramaFiniquito">
                            </div>
                        </div>
                        <div class="col-md-6">
                            <div class="form-group">
                                <label>Subprograma:</label>
                                <input type="text" class="form-control" id="txtSubprogramaFiniquito">
                            </div>
                        </div>
                    </div>
                    <div class="row">
                        <div class="col-md-3">
                            <div class="form-group">
                                <label>Monto Fuente:</label>
                                <input type="text" class="form-control text-right" id="txtMontoFuenteFiniquito" value="0.00">
                            </div>
                        </div>
                        <div class="col-md-3">
                            <div class="form-group">
                                <label>Presupuesto Devengado:</label>
                                <input type="text" class="form-control text-right" id="txtPresupuestoDevengadoFiniquito" value="0.00">
                            </div>
                        </div>
                        <div class="col-md-3">
                            <div class="form-group">
                                <label>Latitud:</label>
                                <input type="text" class="form-control" id="txtLatitudFiniquito">
                            </div>
                        </div>
                        <div class="col-md-3">
                            <div class="form-group">
                                <label>Longitud:</label>
                                <input type="text" class="form-control" id="txtLongitudFiniquito">
                            </div>
                        </div>
                    </div>
                    <div class="row">
                        <div class="col-md-3">
                            <div class="form-group">
                                <label>Fecha Programada Inicio:</label>
                                <input type="text" class="form-control datepicker" id="txtFechaProgramadaInicioFiniquito">
                            </div>
                        </div>
                        <div class="col-md-3">
                            <div class="form-group">
                                <label>Fecha Real Termino:</label>
                                <input type="text" class="form-control datepicker" id="txtFechaRealFinFiniquito">
                            </div>
                        </div>
                        <div class="col-md-3">
                            <div class="form-group">
                                <label>Avance Financiero %:</label>
                                <input type="text" class="form-control text-right" id="txtAvanceFinancieroFiniquito" value="0.00">
                            </div>
                        </div>
                    </div>
                    <div class="row">
                        <div class="col-md-12">
                            <div class="form-group">
                                <label>Descripcion de la Obra:</label>
                                <textarea class="form-control" id="txtDescripcionObraFiniquitoInput" rows="3"></textarea>
                            </div>
                        </div>
                    </div>
                    <div class="row">
                        <div class="col-md-12">
                            <div class="form-group">
                                <label>Observaciones:</label>
                                <textarea class="form-control" id="txtObservacionesFiniquito" rows="3"></textarea>
                            </div>
                        </div>
                    </div>
                </div>
                <div class="modal-footer">
                    <input type="hidden" id="hddIdAccionFiniquito">
                    <input type="hidden" id="hddIdObraFiniquito">
                    <input type="hidden" id="hddAccionMovFiniquito" value="A">
                    <button type="button" class="btn btn-danger" id="btnGuardarFiniquito">
                        <i class="flaticon-disk"></i> Guardar
                    </button>
                    <button type="button" class="btn btn-secondary" data-dismiss="modal">Cerrar</button>
                </div>
            </div>
        </div>
    </div>

    <!-- ======================= MODAL ARCHIVO FINIQUITO ======================= -->
    <div class="modal fade" id="modalArchivoFiniquito" tabindex="-1" role="dialog"
         data-backdrop="static" data-keyboard="false">
        <div class="modal-dialog" role="document">
            <div class="modal-content">
                <div class="modal-header" style="background:linear-gradient(135deg,#6c757d 0%,#495057 100%);">
                    <h5 class="modal-title text-white">
                        <i class="fas fa-file-alt mr-2"></i> Archivo de Finiquito
                    </h5>
                    <button type="button" class="close text-white" data-dismiss="modal">&times;</button>
                </div>
                <div class="modal-body">

                    <%-- Archivo existente --%>
                    <div id="panelArchivoExistente" style="display:none;" class="mb-4">
                        <div class="alert alert-success d-flex justify-content-between align-items-center">
                            <span>
                                <i class="fas fa-file-check mr-2"></i>
                                <strong>Archivo actual:</strong>
                                <span id="lblNombreArchivoFini" class="ml-1"></span>
                            </span>
                            <div>
                                <button type="button" class="btn btn-sm btn-light-primary mr-1"
                                        onclick="CedulaModule.descargarArchivoFiniquito()">
                                    <i class="fas fa-download"></i> Descargar
                                </button>
                                <button type="button" class="btn btn-sm btn-light-danger"
                                        onclick="CedulaModule.eliminarArchivoFiniquito()">
                                    <i class="fas fa-trash"></i> Eliminar
                                </button>
                            </div>
                        </div>
                    </div>

                    <%-- Subir nuevo archivo --%>
                    <div class="form-group">
                        <label class="font-weight-bold">
                            <span id="lblAccionArchivo">Seleccione el archivo:</span>
                        </label>
                        <input type="file" class="form-control" id="fileArchivoFiniquito"
                               accept=".pdf,.doc,.docx,.xls,.xlsx,.jpg,.png">
                        <small class="text-muted">Formatos permitidos: PDF, Word, Excel, imágenes</small>
                    </div>

                </div>
                <div class="modal-footer">
                    <input type="hidden" id="hddIdAccionArchivoFini">
                    <input type="hidden" id="hddRutaArchivoFini">
                    <button type="button" class="btn btn-primary" id="btnGuardarArchivoFiniquito">
                        <i class="flaticon-upload mr-1"></i> Subir
                    </button>
                    <button type="button" class="btn btn-secondary" data-dismiss="modal">
                        <i class="fas fa-times mr-1"></i> Cerrar
                    </button>
                </div>
            </div>
        </div>
    </div>
    <%-- Cedula.js ya se carga desde Site1.Master (no duplicar) --%>
    <script>
        // Actualizar label del custom-file cuando se selecciona imagen
        document.addEventListener('change', function (e) {
            if (e.target && e.target.classList.contains('custom-file-input')) {
                var label = e.target.nextElementSibling;
                if (label) label.textContent = e.target.files.length > 0
                    ? e.target.files[0].name
                    : 'Seleccionar imagen...';
            }
        });

        // Delegación de eventos para botones generados dinámicamente (descarga/elimina foto FISM)
        $(document).off('click', '.btn-fism-descargar').on('click', '.btn-fism-descargar', function (e) {
            CedulaModule.descargarFotoFism($(this).data('ruta'), e);
        });
        $(document).off('click', '.btn-fism-eliminar').on('click', '.btn-fism-eliminar', function () {
            CedulaModule.eliminarFotoFism($(this).data('colimg'), $(this).data('colpath'));
        });
    </script>
</asp:Content>

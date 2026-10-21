<%@ Page Title="" Language="C#" MasterPageFile="~/Site1.Master" AutoEventWireup="true" CodeBehind="Contratos.aspx.cs" Inherits="Ceduver.Contratos" %>
<asp:Content ID="Content1" ContentPlaceHolderID="head" runat="server">
</asp:Content>
<asp:Content ID="Content2" ContentPlaceHolderID="ContentPlaceHolder1" runat="server">
<!-- Subheader -->
<div class="subheader py-2 py-lg-4 subheader-solid" id="kt_subheader">
    <div class="container-fluid d-flex align-items-center 
                justify-content-between flex-wrap flex-sm-nowrap">
        <div class="d-flex align-items-center flex-wrap mr-1">
            <h5 class="text-dark font-weight-bold my-2 mr-5">
                <i class="fas fa-file-contract text-primary mr-2"></i> Contratos
            </h5>
            <span class="badge badge-primary px-3 py-2 ml-2"
                  id="totalContratosBadge">0 contratos</span>
        </div>
        <button type="button" id="btnNuevoContrato"
                class="btn btn-primary font-weight-bolder">
            <i class="fas fa-plus mr-1"></i> NUEVO CONTRATO
        </button>
    </div>
</div>

<div class="d-flex flex-column-fluid">
    <div class="container-fluid">

        <!-- FILTROS -->
        <div class="card card-custom gutter-b shadow-sm">
            <div class="card-body py-4">
                <div class="row align-items-end">
                    <div class="col-md-4 form-group mb-0">
                        <label class="font-weight-bold">Número de Contrato:</label>
                        <input type="text" id="filterContrato" class="form-control"
                               placeholder="Buscar por número de contrato...">
                    </div>
                    <div class="col-md-3 form-group mb-0">
                        <label class="font-weight-bold">Contratista:</label>
                        <select id="filterContratista" class="form-control selectpicker"
                                data-live-search="true" title="(TODOS)"></select>
                    </div>
                    <div class="col-md-2 form-group mb-0">
                        <label class="font-weight-bold">Tipo Orden:</label>
                        <select id="filterTipoOrden" class="form-control selectpicker"
                                title="(TODOS)"></select>
                    </div>
                    <div class="col-md-3 d-flex justify-content-end">
                        <button type="button" id="btnLimpiarContratos" style="color:var(--mg-dark-75);"
                                class="btn btn-light-secondary font-weight-bold mr-2">
                            <i class="fas fa-times mr-1"></i> Limpiar
                        </button>
                        <button type="button" id="btnBuscarContratos"
                                class="btn btn-primary font-weight-bold px-6">
                            <i class="flaticon-search mr-1"></i> BUSCAR
                        </button>
                    </div>
                </div>
            </div>
        </div>

        <!-- TABLA -->
        <div class="card card-custom shadow-sm">
            <div class="card-header" style="min-height:50px;background:linear-gradient(135deg, var(--mg-primary-dark) 0%, var(--mg-primary) 100%);">
                <div class="card-title">
                    <i class="fas fa-list text-primary mr-2"></i>
                    <span class="font-weight-bold" style="color:white;">Listado de Contratos</span>
                </div>
                <div class="card-toolbar">
                    <span class="text-muted small mr-3">Total:
                        <strong id="lblTotalContratos" class="text-primary" style="color:white;">0</strong>
                    </span>
                </div>
            </div>
            <div class="card-body py-3">
                <div class="table-responsive">
                    <table class="table table-head-custom table-vertical-center table-hover"
                           id="tblContratos">
                        <thead class="thead-light">
                            <tr>
                                <th style="width:50px;">No.</th>
                                <th style="width:180px;">Núm. Contrato</th>
                                <th>Descripción</th>
                                <th style="width:120px;">Contratista</th>
                                <th style="width:100px;">Fecha Inicio</th>
                                <th style="width:100px;">Fecha Término</th>
                                <th class="text-right" style="width:130px;">Monto Contratado</th>
                                <th class="text-right" style="width:80px;">Av. Fin. %</th>
                                <th class="text-center" style="width:100px;">Acciones</th>
                            </tr>
                        </thead>
                        <tbody id="tbodyContratos">
                            <tr>
                                <td colspan="9" class="text-center text-muted py-5">
                                    <i class="fas fa-search fa-2x mb-2 d-block"></i>
                                    Use los filtros y presione BUSCAR
                                </td>
                            </tr>
                        </tbody>
                        <tfoot>
                            <tr class="font-weight-bold bg-light-primary" id="rowTotalesContratos">
                                <td colspan="6" class="text-right">TOTAL GENERAL:</td>
                                <td class="text-right text-danger" id="totalMontoContratos"></td>
                                <td></td>
                                <td></td>
                            </tr>
                        </tfoot>
                    </table>
                </div>
            </div>
        </div>

    </div>
</div>

<!-- ======================= MODAL CONTRATO ======================= -->
<div class="modal fade" id="modalContrato" tabindex="-1" role="dialog"
     data-backdrop="static" data-keyboard="false">
    <div class="modal-dialog modal-xl" role="document" style="max-width:90%;">
        <div class="modal-content">
            <div class="modal-header"
                 style="background:linear-gradient(135deg,var(--mg-dorado) 0%,var(--mg-dorado-dark) 100%);">
                <h5 class="modal-title text-white">
                    <i class="fas fa-file-contract mr-2"></i>
                    <span id="lblTituloModalContrato">Nuevo Contrato</span>
                </h5>
                <button type="button" class="close text-white"
                        data-dismiss="modal">&times;</button>
            </div>
            <div class="modal-body" style="background:#f5f5f5; max-height:78vh; overflow-y:auto;">

                <!-- SECCIÓN A — Datos Generales -->
                <div class="card card-custom gutter-b shadow-sm"
                     style="border-left:4px solid var(--mg-dorado) !important;">
                    <div class="card-header" style="background:rgba(242,169,0,0.1); min-height:45px; padding:10px 20px;">
                        <div class="card-title mb-0">
                            <i class="fas fa-info-circle text-warning mr-2"></i>
                            <span class="font-weight-bold text-warning">Datos Generales</span>
                        </div>
                    </div>
                    <div class="card-body">
                        <div class="row">
                            <div class="col-md-4">
                                <div class="form-group">
                                    <label class="font-weight-bold required-field">
                                        Número de Contrato:</label>
                                    <input type="text" class="form-control"
                                           id="txtNumContrato"
                                           placeholder="Ej. PM/DOPM/FISMDF-OT/001-2022">
                                </div>
                            </div>
                            <div class="col-md-4">
                                <div class="form-group">
                                    <label class="font-weight-bold">Fecha de Firma:</label>
                                    <input type="text" class="form-control fecha"
                                           id="txtFechaFirma" placeholder="dd/mm/aaaa">
                                </div>
                            </div>
                            <div class="col-md-4">
                                <div class="form-group">
                                    <label class="font-weight-bold required-field">
                                        Contratista:</label>
                                    <select class="form-control" id="cboContratistaContrato">
                                        <option value="0">(SELECCIONE)</option>
                                    </select>
                                </div>
                            </div>
                        </div>
                        <div class="row">
                            <div class="col-md-3">
                                <div class="form-group">
                                    <label class="font-weight-bold">Tipo de Orden:</label>
                                    <select class="form-control" id="cboTipoOrdenContrato">
                                        <option value="0">(SELECCIONE)</option>
                                    </select>
                                </div>
                            </div>
                            <div class="col-md-3">
                                <div class="form-group">
                                    <label class="font-weight-bold">Tipo de Contrato:</label>
                                    <select class="form-control" id="cboTipoContrato">
                                        <option value="0">(SELECCIONE)</option>
                                    </select>
                                </div>
                            </div>
                            <div class="col-md-3">
                                <div class="form-group">
                                    <label class="font-weight-bold">Concepto Contratado:</label>
                                    <select class="form-control" id="cboConceptoContratado">
                                        <option value="0">(SELECCIONE)</option>
                                    </select>
                                </div>
                            </div>
                            <div class="col-md-3">
                                <div class="form-group">
                                    <label class="font-weight-bold">Avance Financiero %:</label>
                                    <input type="number" class="form-control text-right"
                                           id="txtAvanceFinanciero" value="0" min="0" max="100">
                                </div>
                            </div>
                        </div>
                        <div class="row">
                            <div class="col-md-12">
                                <div class="form-group">
                                    <label class="font-weight-bold">Descripción:</label>
                                    <textarea class="form-control" id="txtDescripcionContrato"
                                              rows="2" placeholder="Descripción del contrato..."></textarea>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <!-- SECCIÓN B — Montos y Fechas -->
                <div class="card card-custom gutter-b shadow-sm"
                     style="border-left:4px solid var(--mg-primary) !important;">
                    <div class="card-header" style="background:rgba(210,35,42,0.08); min-height:45px; padding:10px 20px;">
                        <div class="card-title mb-0">
                            <i class="fas fa-dollar-sign text-primary mr-2"></i>
                            <span class="font-weight-bold text-primary">Montos y Fechas</span>
                        </div>
                    </div>
                    <div class="card-body">
                        <div class="row">
                            <div class="col-md-3">
                                <div class="form-group">
                                    <label class="font-weight-bold required-field">
                                        Fecha Inicio:</label>
                                    <input type="text" class="form-control fecha"
                                           id="txtFechaInicioContrato" placeholder="dd/mm/aaaa">
                                </div>
                            </div>
                            <div class="col-md-3">
                                <div class="form-group">
                                    <label class="font-weight-bold required-field">
                                        Fecha Término:</label>
                                    <input type="text" class="form-control fecha"
                                           id="txtFechaTerminoContrato" placeholder="dd/mm/aaaa">
                                </div>
                            </div>
                            <div class="col-md-3">
                                <div class="form-group">
                                    <label class="font-weight-bold required-field">
                                        Monto Contratado:</label>
                                    <input type="text" class="form-control text-right"
                                           id="txtMontoContratado" value="0.00">
                                </div>
                            </div>
                            <div class="col-md-3">
                                <div class="form-group">
                                    <label class="font-weight-bold">Monto Anticipo:</label>
                                    <input type="text" class="form-control text-right"
                                           id="txtMontoAnticipo" value="0.00">
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <!-- SECCIÓN C — Archivo -->
                <div class="card card-custom shadow-sm"
                     style="border-left:4px solid #1BC5BD !important;">
                    <div class="card-header" style="background:#e8faf9; min-height:45px; padding:10px 20px;">
                        <div class="card-title mb-0">
                            <i class="fas fa-paperclip text-success mr-2"></i>
                            <span class="font-weight-bold text-success">Archivo Adjunto</span>
                        </div>
                    </div>
                    <div class="card-body">
                        <div class="row align-items-center">
                            <div class="col-md-6">
                                <div class="form-group mb-0">
                                    <label class="font-weight-bold">Seleccionar archivo:</label>
                                    <input type="file" class="form-control"
                                           id="fileContratoAdjunto"
                                           accept=".pdf,.doc,.docx,.jpg,.jpeg,.png,.xls,.xlsx">
                                    <small class="text-muted">
                                        Formatos: PDF, Word, Excel, imágenes
                                    </small>
                                </div>
                            </div>
                            <div class="col-md-6" id="panelArchivoExistenteContrato"
                                 style="display:none;">
                                <label class="font-weight-bold">Archivo actual:</label>
                                <div class="d-flex align-items-center">
                                    <span class="badge badge-light-success px-3 py-2 mr-2"
                                          id="lblArchivoActualContrato"></span>
                                    <button type="button"
                                            class="btn btn-sm btn-light-primary mr-1"
                                            id="btnDescargarArchivoContrato">
                                        <i class="fas fa-download"></i> Descargar
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

            </div>
            <div class="modal-footer">
                <input type="hidden" id="hddIdContrato">
                <input type="hidden" id="hddAccionContrato" value="add">
                <input type="hidden" id="hddRutaArchivoContrato">
                <button type="button" class="btn btn-warning font-weight-bold"
                        id="btnGuardarContrato">
                    <i class="flaticon-disk mr-1"></i> Guardar
                </button>
                <button type="button" class="btn btn-secondary" data-dismiss="modal">
                    <i class="fas fa-times mr-1"></i> Cancelar
                </button>
            </div>
        </div>
    </div>
</div>
<script src="assets/js/Contratos.js"></script>
</asp:Content>







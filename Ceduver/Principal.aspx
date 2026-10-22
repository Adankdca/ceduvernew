<%@ Page Title="" Language="C#" MasterPageFile="~/Site1.Master" AutoEventWireup="true" CodeBehind="Principal.aspx.cs" Inherits="Ceduver.Principal" %>
<asp:Content ID="Content1" ContentPlaceHolderID="head" runat="server">
</asp:Content>
<asp:Content ID="Content2" ContentPlaceHolderID="ContentPlaceHolder1" runat="server">
<!-- Subheader -->
<div class="subheader py-2 py-lg-4 subheader-solid" id="kt_subheader">
    <div class="container-fluid d-flex align-items-center justify-content-between flex-wrap flex-sm-nowrap">
        <div class="d-flex align-items-center flex-wrap mr-1">
            <h5 class="text-dark font-weight-bold my-2 mr-5">
                <i class="fas fa-hard-hat text-primary mr-2"></i> Seguimiento de Obras
            </h5>
            <span class="badge badge-danger px-3 py-2 ml-2" id="totalObrasBadge">0 obras</span>
        </div>
        <button type="button" id="btnNuevaObra" class="btn btn-primary font-weight-bolder">
            <i class="fas fa-plus mr-1"></i> NUEVA OBRA
        </button>
    </div>
</div>

<div class="d-flex flex-column-fluid">
    <div class="container-fluid">

        <!-- FILTROS -->
        <div class="card card-custom gutter-b shadow-sm">
            <div class="card-header" style="min-height:50px;background:linear-gradient(135deg, var(--mg-primary-dark) 0%, var(--mg-primary) 100%);">
                <div class="card-title">
                    <i class="fas fa-filter text-primary mr-2"></i>
                    <span class="font-weight-bold" style="color: white;">Filtros de Búsqueda</span>
                </div>
            </div>
            <div class="card-body py-4">
                <div class="row">
                    <div class="col-md-3 form-group mb-3">
                        <label class="font-weight-bold">Rubro:</label>
                        <select id="filterRubro" class="form-control selectpicker"
                                data-live-search="true" data-size="8">
                        </select>
                    </div>
                    <div class="col-md-2 form-group mb-3">
                        <label class="font-weight-bold">Año:</label>
                        <select id="filterAnio" class="form-control selectpicker"
                                data-live-search="true">
                        </select>
                    </div>
                    <div class="col-md-3 form-group mb-3">
                        <label class="font-weight-bold">Nombre de la Obra:</label>
                        <input type="text" id="filterNombre" class="form-control"
                               placeholder="Buscar por nombre...">
                    </div>
                    <div class="col-md-2 form-group mb-3">
                        <label class="font-weight-bold">No. Contrato:</label>
                        <input type="text" id="filterContrato" class="form-control"
                               placeholder="Núm. contrato...">
                    </div>
                    <div class="col-md-2 form-group mb-3">
                        <label class="font-weight-bold">No. Obra:</label>
                        <input type="text" id="filterNumObra" class="form-control"
                               placeholder="Núm. obra...">
                    </div>
                </div>
                <div class="row">
                    <div class="col-12 d-flex justify-content-end">
                        <button type="button" id="btnLimpiarObras"
                                class="btn btn-light-secondary font-weight-bold mr-2" style="color: var(--mg-dark-75);">
                            <i class="fas fa-times mr-1" style="color: var(--mg-dark-75);"></i> Limpiar
                        </button>
                        <button type="button" id="btnBuscarObras"
                                class="btn btn-primary font-weight-bold px-8">
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
                    <span class="font-weight-bold" style="color: white;">Listado de Obras</span>
                </div>
                <div class="card-toolbar">
                    <span class="text-muted small mr-3">Total:
                        <strong id="lblTotalObras" class="text-primary">0</strong> obras
                    </span>
                </div>
            </div>
            <div class="card-body py-3">
                <div class="table-responsive">
                    <table class="table table-head-custom table-vertical-center table-hover"
                           id="tblObras">
                        <thead class="thead-light" style="background-color:var(--mg-brand-bg) !important">
                            <tr>
                                <th style="width:50px;color:#828385 !important;">No.</th>
                                <th style="width:60px;color:#828385 !important;">Año</th>
                                <th style="width:130px;color:#828385 !important;">Subrubro</th>
                                <th style="color:#828385 !important;min-width:270px;">Nombre de la Obra</th>
                                <th style="width:100px;color:#828385 !important;">No. Obra</th>
                                <th style="width:160px;color:#828385 !important;">Localidad</th>
                                <th style="width:100px;color:#828385 !important;">Financ.</th>
                                <th class="text-right" style="width:110px;color:#828385 !important;">Municipal</th>
                                <th class="text-right" style="width:110px;color:#828385 !important;">Estatal</th>
                                <th class="text-right" style="width:110px;color:#828385 !important;">Federal</th>
                                <th class="text-right" style="width:120px;color:#828385 !important;">Total</th>
                                <th class="text-center" style="width:150px;color:#828385 !important;">Acciones</th>
                            </tr>
                        </thead>
                        <tbody id="tbodyObras">
                            <tr>
                                <td colspan="12" class="text-center text-muted py-5">
                                    <i class="fas fa-search fa-2x mb-2 d-block"></i>
                                    Use los filtros y presione BUSCAR
                                </td>
                            </tr>
                        </tbody>
                        <!-- Fila de totales -->
                        <tfoot>
                            <tr class="font-weight-bold bg-light-primary" id="rowTotales"
                                style="display:none;">
                                <td colspan="7" class="text-right font-weight-bold">TOTALES:</td>
                                <td class="text-right text-primary" id="totalMunicipal"></td>
                                <td class="text-right text-primary" id="totalEstatal"></td>
                                <td class="text-right text-primary" id="totalFederal"></td>
                                <td class="text-right text-danger font-weight-bolder" id="totalGeneral"></td>
                                <td></td>
                            </tr>
                        </tfoot>
                    </table>
                </div>
            </div>
        </div>

    </div>
</div>

<div class="modal fade" id="modalObra" tabindex="-1" role="dialog">
    <div class="modal-dialog modal-xl" role="document">
        <div class="modal-content">

```
        <!-- HEADER -->
        <div class="modal-header bg-primary text-white">
            <h5 class="modal-title">
                <i class="fas fa-building mr-2"></i> Obra / Proyecto
            </h5>
            <button type="button" class="close text-white" data-dismiss="modal">
                <span>&times;</span>
            </button>
        </div>

        <!-- BODY -->
        <div class="modal-body">

            <!-- ══ PANEL: Importar desde Sistema de Seguimiento ══════════ -->
            <div id="panelImportSeguimiento" class="mb-4">

                <!-- Encabezado colapsable -->
                <div class="d-flex align-items-center mb-2">
                    <span class="font-weight-bold text-primary mr-2">
                        <i class="fas fa-cloud-download-alt mr-1"></i> Importar desde el Sistema de Seguimiento
                    </span>
                    <small class="text-muted">(opcional — deja vacío para captura manual)</small>
                </div>

                <!-- Barra de búsqueda -->
                <div class="row">
                    <div class="col-md-5">
                        <input type="text" id="txtBuscarSeg" class="form-control form-control-sm"
                               placeholder="Núm. obra o nombre..." />
                    </div>
                    <div class="col-md-2">
                        <input type="number" id="txtAnioBuscarSeg" class="form-control form-control-sm"
                               placeholder="Año" min="2000" max="2100" />
                    </div>
                    <div class="col-md-2">
                        <button type="button" class="btn btn-sm btn-outline-primary w-100"
                                onclick="ObrasModule.buscarObrasSeguimiento()">
                            <i class="fas fa-search mr-1"></i> Buscar
                        </button>
                    </div>
                </div>

                <!-- Grid de resultados -->
                <div id="divResultadosSeg" class="mt-2" style="display:none;">
                    <div class="table-responsive" style="max-height:220px; overflow-y:auto;">
                        <table class="table table-sm table-hover table-bordered mb-0" id="tblResultadosSeg">
                            <thead class="thead-light">
                                <tr>
                                    <th>Núm. obra</th>
                                    <th>Nombre</th>
                                    <th>Subrubro</th>
                                    <th>Año</th>
                                    <th class="text-center">Acc.</th>
                                    <th class="text-center">Acción</th>
                                </tr>
                            </thead>
                            <tbody id="tbodyResultadosSeg"></tbody>
                        </table>
                    </div>
                </div>

                <!-- Alerta amarilla: datos importados -->
                <div id="alertaImportacion" class="alert alert-warning mt-2 mb-0 py-2 px-3" style="display:none;">
                    <div id="alertaImportacionTexto"></div>
                    <div class="mt-1">
                        <a href="#" class="text-warning font-weight-bold mr-3"
                           onclick="ObrasModule.elegirOtraObra(); return false;">
                            <i class="fas fa-search mr-1"></i> Elegir otra obra
                        </a>
                        <a href="#" class="text-secondary"
                           onclick="ObrasModule.quitarVinculo(); return false;">
                            <i class="fas fa-unlink mr-1"></i> Quitar vínculo (capturar a mano)
                        </a>
                    </div>
                </div>

                <hr class="mt-3 mb-2" />
            </div>
            <!-- ══ FIN PANEL IMPORTAR ══════════════════════════════════════ -->

            <div class="row">

                <!-- Número -->
                <div class="col-md-3">
                    <label>Núm. Obra</label>
                    <input type="text" id="txtNoObra" class="form-control">
                </div>

                <!-- Acciones -->
                <div class="col-md-3">
                    <label>Acciones</label>
                    <input type="number" id="txtAcciones" class="form-control" value="0">
                </div>

                <!-- Franja -->
                <div class="col-md-3 d-flex align-items-center">
                    <label class="checkbox mt-6">
                        <input type="checkbox" id="chkFranja">
                        <span></span> Franja fronteriza
                    </label>
                </div>

            </div>

            <div class="row mt-3">

                <div class="col-md-6">
                    <label>Rubro</label>
                    <select id="cmbRubroModal" class="form-control"></select>
                </div>

                <div class="col-md-6">
                    <label>Subrubro</label>
                    <select id="cmbSubrubroModal" class="form-control"></select>
                </div>

            </div>

            <div class="row mt-3">

                <div class="col-md-4">
                    <label>Programa</label>
                    <select id="cmbPrograma" class="form-control"></select>
                </div>

                <div class="col-md-4">
                    <label>Área</label>
                    <select id="cmbArea" class="form-control"></select>
                </div>

                <div class="col-md-4">
                    <label>Marginación</label>
                    <select id="cmbMarginacion" class="form-control"></select>
                </div>

            </div>

            <div class="row mt-3">

                <div class="col-md-6">
                    <label>Tipo de Obra</label>
                    <select id="cmbTipoObra" class="form-control"></select>
                </div>

            </div>

            <div class="row mt-3">

                <div class="col-md-12">
                    <label>Nombre de la Obra</label>
                    <input type="text" id="txtNombreObra" class="form-control">
                </div>

            </div>

            <div class="row mt-3">

                <div class="col-md-6">
                    <label>Antecedentes</label>
                    <textarea id="txtAntecedentes" class="form-control" rows="3"></textarea>
                </div>

                <div class="col-md-6">
                    <label>Observaciones</label>
                    <textarea id="txtObservaciones" class="form-control" rows="3"></textarea>
                </div>

            </div>

        </div>

        <!-- FOOTER -->
        <div class="modal-footer">
            <!-- Campo oculto que guarda el vínculo con obra del sistema de seguimiento -->
            <input type="hidden" id="hdnIdObraSeguimiento" value="0" />
            <button type="button" class="btn btn-light" data-dismiss="modal">Cancelar</button>
            <button type="button" class="btn btn-primary" onclick="ObrasModule.guardarObra()">
                <i class="fas fa-save mr-1"></i> Guardar
            </button>
        </div>

    </div>
</div>
```

</div>

<!-- ======================= MODAL LOCALIDADES ======================= -->
<div class="modal fade" id="modalLocalidades" tabindex="-1" role="dialog"
     data-backdrop="static" data-keyboard="false">
    <div class="modal-dialog modal-lg" role="document">
        <div class="modal-content">
            <div class="modal-header" style="background:linear-gradient(135deg,var(--mg-verde) 0%,var(--mg-verde-dark) 100%);">
                <h5 class="modal-title text-white">
                    <i class="fas fa-map-marker-alt mr-2"></i>
                    Localidades de la Obra
                </h5>
                <button type="button" class="close text-white" data-dismiss="modal">&times;</button>
            </div>
            <div class="modal-body" style="background:#f5f5f5;">

                <!-- Encabezado obra -->
                <div class="alert alert-light-primary mb-3 py-2 px-3">
                    <i class="fas fa-hard-hat text-primary mr-2"></i>
                    <strong id="lblObraLocalidades"></strong>
                </div>

                <!-- Formulario agregar/modificar -->
                <div class="card card-custom gutter-b shadow-sm"
                     id="panelFormLocalidad" style="display:none;">
                    <div class="card-header" style="background:rgba(0,166,81,0.08); min-height:45px; padding:10px 20px;">
                        <div class="card-title mb-0">
                            <i class="fas fa-plus-circle text-primary mr-2"></i>
                            <span class="font-weight-bold text-primary"
                                  id="lblTituloFormLocalidad">Agregar Localidad</span>
                        </div>
                    </div>
                    <div class="card-body">
                        <div class="row align-items-end">
                            <div class="col-md-8">
                                <div class="form-group mb-0">
                                    <label class="font-weight-bold">Localidad:</label>
                                    <select class="form-control" id="cboLocalidad">
                                        <option value="">(SELECCIONE)</option>
                                    </select>
                                </div>
                            </div>
                            <div class="col-md-4 d-flex">
                                <button type="button" class="btn btn-primary mr-2"
                                        id="btnGuardarLocalidad">
                                    <i class="flaticon-disk mr-1"></i> Guardar
                                </button>
                                <button type="button" class="btn btn-light"
                                        id="btnCancelarLocalidad">
                                    <i class="fas fa-times mr-1"></i> Cancelar
                                </button>
                            </div>
                        </div>
                    </div>
                </div>

                <!-- Tabla de localidades -->
                <div class="card card-custom shadow-sm">
                    <div class="card-header" style="min-height:45px;">
                        <div class="card-title mb-0">
                            <i class="fas fa-list text-primary mr-2"></i>
                            <span class="font-weight-bold">Localidades registradas</span>
                            <span class="badge badge-primary ml-2"
                                  id="badgeTotalLocalidades">0</span>
                        </div>
                        <div class="card-toolbar">
                            <button type="button" class="btn btn-success btn-sm"
                                    id="btnNuevaLocalidad">
                                <i class="fas fa-plus mr-1"></i> Agregar
                            </button>
                        </div>
                    </div>
                    <div class="card-body py-3">
                        <div class="table-responsive">
                            <table class="table table-hover table-head-custom
                                          table-vertical-center">
                                <thead class="thead-light">
                                    <tr>
                                        <th>#</th>
                                        <th>Localidad</th>
                                        <th style="width:100px;" class="text-center">
                                            Acciones</th>
                                    </tr>
                                </thead>
                                <tbody id="tbodyLocalidades">
                                    <tr>
                                        <td colspan="3" class="text-center text-muted py-4">
                                            Sin localidades registradas
                                        </td>
                                    </tr>
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>

            </div>
            <div class="modal-footer">
                <input type="hidden" id="hddIdObraLocalidades">
                <input type="hidden" id="hddIdLocalidadDetalle">
                <input type="hidden" id="hddAccionLocalidad" value="add">
                <button type="button" class="btn btn-secondary" data-dismiss="modal">
                    <i class="fas fa-times mr-1"></i> Cerrar
                </button>
            </div>
        </div>
    </div>
</div>



<!-- ======================= MODAL ACCIONES ======================= -->
<div class="modal fade" id="modalAcciones" tabindex="-1" role="dialog"
     data-backdrop="static" data-keyboard="false">
    <div class="modal-dialog modal-xl" role="document" style="max-width:98%;">
        <div class="modal-content">
            <div class="modal-header" style="background:linear-gradient(135deg,var(--mg-cafe) 0%,var(--mg-cafe-dark) 100%);">
                <h5 class="modal-title text-white">
                    <i class="fas fa-tasks mr-2"></i> Acciones de la Obra
                </h5>
                <button type="button" class="close text-white" data-dismiss="modal">&times;</button>
            </div>
            <div class="modal-body" style="background:#f5f5f5; max-height:80vh; overflow-y:auto;">

                <!-- Encabezado obra -->
                <div class="alert alert-light-primary mb-3 py-2 px-3">
                    <i class="fas fa-hard-hat text-primary mr-2"></i>
                    <strong id="lblObraAcciones"></strong>
                </div>

                <!-- ═══ PANEL 1: Grid de acciones ═══ -->
                <div id="panelGridAcciones">
                    <div class="card card-custom shadow-sm mb-3">
                        <div class="card-header" style="min-height:50px;">
                            <div class="card-title mb-0">
                                <i class="fas fa-list text-primary mr-2"></i>
                                <span class="font-weight-bold">Listado de Acciones</span>
                                <span class="badge badge-primary ml-2" id="badgeTotalAcciones">0</span>
                            </div>
                            <div class="card-toolbar">
                                <button type="button" class="btn btn-success btn-sm"
                                        id="btnNuevaAccion">
                                    <i class="fas fa-plus mr-1"></i> Nueva Acción
                                </button>
                            </div>
                        </div>
                        <div class="card-body py-2">
                            <div class="table-responsive">
                                <table class="table table-hover table-head-custom table-vertical-center"
                                       id="tblAcciones">
                                    <thead class="thead-light">
                                        <tr>
                                            <th>Año</th>
                                            <th>Tipo Ejec.</th>
                                            <th>Acción</th>
                                            <th>Tipo Acción</th>
                                            <th>Localidad</th>
                                            <th>Contrato</th>
                                            <th class="text-center" style="width:180px;">Opciones</th>
                                        </tr>
                                    </thead>
                                    <tbody id="tbodyAcciones"></tbody>
                                </table>
                            </div>
                        </div>
                    </div>
                </div>

                <!-- ═══ PANEL 2: Formulario Acción ═══ -->
                <div id="panelFormAccion" style="display:none;">
                    <div class="card card-custom shadow-sm mb-3"
                         style="border-left:4px solid var(--mg-cafe) !important;">
                        <div class="card-header" style="background:rgba(110,74,46,0.08); min-height:45px; padding:10px 20px;">
                            <div class="card-title mb-0">
                                <i class="fas fa-edit text-primary mr-2"></i>
                                <span class="font-weight-bold text-primary"
                                      id="lblTituloFormAccion">Nueva Acción</span>
                            </div>
                            <div class="card-toolbar">
                                <button type="button" class="btn btn-sm btn-light"
                                        id="btnCancelarAccion">
                                    <i class="fas fa-arrow-left mr-1"></i> Regresar
                                </button>
                            </div>
                        </div>
                        <div class="card-body">
                            <div class="row">
                                <div class="col-md-2">
                                    <div class="form-group">
                                        <label class="font-weight-bold required-field">Año:</label>
                                        <select class="form-control" id="cboAnioAccion"></select>
                                    </div>
                                </div>
                                <div class="col-md-3">
                                    <div class="form-group">
                                        <label class="font-weight-bold required-field">Tipo de Ejecución:</label>
                                        <select class="form-control" id="cboTipoEjecucionAccion"></select>
                                    </div>
                                </div>
                                <div class="col-md-3">
                                    <div class="form-group">
                                        <label class="font-weight-bold">Tipo de Acción:</label>
                                        <select class="form-control" id="cboTipoAccion"></select>
                                    </div>
                                </div>
                                <div class="col-md-2">
                                    <div class="form-group">
                                        <label class="font-weight-bold">Subrubro Específico:</label>
                                        <select class="form-control" id="cboSubrubroEspecifico"></select>
                                    </div>
                                </div>
                                <div class="col-md-2">
                                    <div class="form-group">
                                        <label class="font-weight-bold">Localidad:</label>
                                        <select class="form-control" id="cboLocalidadAccion"></select>
                                    </div>
                                </div>
                            </div>
                            <div class="row">
                                <div class="col-md-12">
                                    <div class="form-group">
                                        <label class="font-weight-bold required-field">Acción:</label>
                                        <input type="text" class="form-control" id="txtAccion"
                                               placeholder="Descripción de la acción...">
                                    </div>
                                </div>
                            </div>
                            <div class="row">
                                <div class="col-md-2">
                                    <div class="form-group">
                                        <label class="font-weight-bold">Beneficiarios:</label>
                                        <input type="number" class="form-control" id="txtBeneficiariosAccion"
                                               value="0">
                                    </div>
                                </div>
                                <div class="col-md-4">
                                    <div class="form-group">
                                        <label class="font-weight-bold">Tipo Beneficiario:</label>
                                        <input type="text" class="form-control" id="txtTipoBeneficiarioAccion">
                                    </div>
                                </div>
                                <div class="col-md-6">
                                    <div class="form-group mt-7">
                                        <label class="checkbox checkbox-outline checkbox-primary mr-4">
                                            <input type="checkbox" id="chkDictamenFuente">
                                            <span></span> Dictamen con Fuente
                                        </label>
                                        <label class="checkbox checkbox-outline checkbox-primary mr-4">
                                            <input type="checkbox" id="chkAutorizado">
                                            <span></span> Autorizado sin Recurso
                                        </label>
                                        <label class="checkbox checkbox-outline checkbox-primary">
                                            <input type="checkbox" id="chkLiberada">
                                            <span></span> Liberada
                                        </label>
                                    </div>
                                </div>
                            </div>
                            <div class="row">
                                <div class="col-md-12">
                                    <div class="form-group">
                                        <label class="font-weight-bold">Descripción de la Obra:</label>
                                        <textarea class="form-control" id="txtDescripcionObraAccion"
                                                  rows="2" placeholder="Descripción detallada..."></textarea>
                                    </div>
                                </div>
                            </div>
                            <!-- Clasificación presupuestal -->
                            <div class="row">
                                <div class="col-md-12">
                                    <label class="font-weight-bold text-primary">
                                        Clasificación Presupuestal:
                                    </label>
                                </div>
                                <div class="col-md-4">
                                    <div class="form-group">
                                        <label class="text-muted small">Descripción Localidad:</label>
                                        <input type="text" class="form-control form-control-sm"
                                               id="txtDescripcionLocalidadAccion">
                                    </div>
                                </div>
                                <div class="col-md-4">
                                    <div class="form-group">
                                        <label class="text-muted small">Finalidad:</label>
                                        <input type="text" class="form-control form-control-sm"
                                               id="txtFinalidadAccion">
                                    </div>
                                </div>
                                <div class="col-md-4">
                                    <div class="form-group">
                                        <label class="text-muted small">Función:</label>
                                        <input type="text" class="form-control form-control-sm"
                                               id="txtFuncionAccion">
                                    </div>
                                </div>
                                <div class="col-md-4">
                                    <div class="form-group">
                                        <label class="text-muted small">Subfunción:</label>
                                        <input type="text" class="form-control form-control-sm"
                                               id="txtSubfuncionAccion">
                                    </div>
                                </div>
                                <div class="col-md-4">
                                    <div class="form-group">
                                        <label class="text-muted small">Programa:</label>
                                        <input type="text" class="form-control form-control-sm"
                                               id="txtProgramaAccion">
                                    </div>
                                </div>
                                <div class="col-md-4">
                                    <div class="form-group">
                                        <label class="text-muted small">Subprograma:</label>
                                        <input type="text" class="form-control form-control-sm"
                                               id="txtSubprogramaAccion">
                                    </div>
                                </div>
                                <div class="col-md-4">
                                    <div class="form-group">
                                        <label class="text-muted small">Proyecto:</label>
                                        <input type="text" class="form-control form-control-sm"
                                               id="txtProyectoAccion">
                                    </div>
                                </div>
                            </div>
                            <div class="text-right mt-3">
                                <button type="button" class="btn btn-primary" id="btnGuardarAccion">
                                    <i class="flaticon-disk mr-1"></i> Guardar Acción
                                </button>
                            </div>
                        </div>
                    </div>
                </div>

                <!-- ═══ PANEL 3: Origen de Inversión ═══ -->
                <div id="panelOrigenes" style="display:none;">
                    <div class="card card-custom shadow-sm mb-3"
                         style="border-left:4px solid #1BC5BD !important;">
                        <div class="card-header" style="background:#e8faf9; min-height:45px; padding:10px 20px;">
                            <div class="card-title mb-0">
                                <i class="fas fa-dollar-sign text-success mr-2"></i>
                                <span class="font-weight-bold text-success">Origen de Inversión</span>
                                <span class="badge badge-success ml-2" id="badgeTotalOrigenes">0</span>
                            </div>
                            <div class="card-toolbar">
                                <button type="button" class="btn btn-sm btn-light mr-2"
                                        id="btnRegresarOrigenes">
                                    <i class="fas fa-arrow-left mr-1"></i> Regresar
                                </button>
                                <button type="button" class="btn btn-sm btn-success"
                                        id="btnNuevoOrigen">
                                    <i class="fas fa-plus mr-1"></i> Agregar Origen
                                </button>
                            </div>
                        </div>
                        <div class="card-body py-2">
                            <!-- Info acción -->
                            <div class="alert alert-light-info py-2 mb-3">
                                <small>
                                    <strong>Acción:</strong>
                                    <span id="lblAccionOrigen"></span>
                                    &nbsp;|&nbsp;
                                    <strong>Año:</strong>
                                    <span id="lblAnioOrigen"></span>
                                </small>
                            </div>
                            <!-- Formulario Origen -->
                            <div id="panelFormOrigen" style="display:none;"
                                 class="card card-custom mb-3 shadow-sm">
                                <div class="card-header" style="min-height:40px; background:#f0fef9;">
                                    <div class="card-title mb-0">
                                        <span class="font-weight-bold small text-success"
                                              id="lblTituloFormOrigen">Agregar Origen</span>
                                    </div>
                                </div>
                                <div class="card-body py-3">
                                    <div class="row align-items-end">
                                        <div class="col-md-3">
                                            <div class="form-group mb-0">
                                                <label class="font-weight-bold small required-field">
                                                    Origen:</label>
                                                <select class="form-control form-control-sm"
                                                        id="cboOrigenFuente"></select>
                                            </div>
                                        </div>
                                        <div class="col-md-3">
                                            <div class="form-group mb-0">
                                                <label class="font-weight-bold small required-field">
                                                    Fuente Financiamiento:</label>
                                                <select class="form-control form-control-sm"
                                                        id="cboFuenteFinanciamiento"></select>
                                            </div>
                                        </div>
                                        <div class="col-md-2">
                                            <div class="form-group mb-0">
                                                <label class="font-weight-bold small required-field">
                                                    Inversión:</label>
                                                <input type="text" class="form-control form-control-sm text-right"
                                                       id="txtInversionOrigen" value="0">
                                            </div>
                                        </div>
                                        <div class="col-md-2">
                                            <div class="form-group mb-0">
                                                <label class="font-weight-bold small required-field">
                                                    Fecha Vencimiento:</label>
                                                <input type="text" class="form-control form-control-sm fecha"
                                                       id="txtFechaVencimientoOrigen"
                                                       placeholder="dd/mm/aaaa">
                                            </div>
                                        </div>
                                        <div class="col-md-2 d-flex">
                                            <button type="button" class="btn btn-sm btn-success mr-1"
                                                    id="btnGuardarOrigen">
                                                <i class="flaticon-disk"></i> Guardar
                                            </button>
                                            <button type="button" class="btn btn-sm btn-light"
                                                    id="btnCancelarOrigen">
                                                <i class="fas fa-times"></i>
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                            <!-- Tabla Origenes -->
                            <table class="table table-hover table-head-custom table-sm">
                                <thead class="thead-light">
                                    <tr>
                                        <th>Origen</th>
                                        <th>Fuente Financiamiento</th>
                                        <th class="text-right">Inversión</th>
                                        <th>Fecha Vcto.</th>
                                        <th class="text-center" style="width:180px;">Opciones</th>
                                    </tr>
                                </thead>
                                <tbody id="tbodyOrigenes"></tbody>
                            </table>
                        </div>
                    </div>

                    <!-- PANEL 3c: COCI -->
                    <div id="panelCOCI" style="display:none;">
                        <div class="card card-custom shadow-sm"
                             style="border-left:4px solid #F64E60 !important;">
                            <div class="card-header" style="background:#fff0f2; min-height:45px; padding:10px 20px;">
                                <div class="card-title mb-0">
                                    <i class="fas fa-receipt text-danger mr-2"></i>
                                    <span class="font-weight-bold text-danger"
                                          id="lblTituloCOCI">Costo Obra (CO)</span>
                                    <span class="badge badge-danger ml-2" id="badgeTotalCOCI">0</span>
                                </div>
                                <div class="card-toolbar">
                                    <button type="button" class="btn btn-sm btn-light mr-2"
                                            id="btnRegresarCOCI">
                                        <i class="fas fa-times mr-1"></i> Cerrar COCI
                                    </button>
                                    <button type="button" class="btn btn-sm btn-danger"
                                            id="btnNuevoCOCI">
                                        <i class="fas fa-plus mr-1"></i> Agregar COCI
                                    </button>
                                </div>
                            </div>
                            <div class="card-body py-2">
                                <div class="alert alert-light-danger py-2 mb-3">
                                    <small>
                                        <strong>Fuente:</strong>
                                        <span id="lblFuenteCOCI"></span>
                                    </small>
                                </div>
                                <!-- Formulario COCI -->
                                <div id="panelFormCOCI" style="display:none;"
                                     class="card card-custom mb-3 shadow-sm">
                                    <div class="card-body py-3">
                                        <div class="row align-items-end">
                                            <div class="col-md-4">
                                                <div class="form-group mb-0">
                                                    <label class="font-weight-bold small required-field">
                                                        Folio MIDS / Clave Presupuestal:</label>
                                                    <input type="text" class="form-control form-control-sm"
                                                           id="txtCvePresupuestal"
                                                           placeholder="Clave presupuestal...">
                                                </div>
                                            </div>
                                            <div class="col-md-3">
                                                <div class="form-group mb-0">
                                                    <label class="font-weight-bold small required-field">
                                                        Monto Inversión:</label>
                                                    <input type="text"
                                                           class="form-control form-control-sm text-right"
                                                           id="txtInversionCOCI" value="0">
                                                </div>
                                            </div>
                                            <div class="col-md-3 d-flex">
                                                <button type="button" class="btn btn-sm btn-danger mr-1"
                                                        id="btnGuardarCOCI">
                                                    <i class="flaticon-disk"></i> Guardar
                                                </button>
                                                <button type="button" class="btn btn-sm btn-light"
                                                        id="btnCancelarCOCI">
                                                    <i class="fas fa-times"></i>
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                                <!-- Tabla COCI -->
                                <table class="table table-hover table-head-custom table-sm">
                                    <thead class="thead-light">
                                        <tr>
                                            <th>Clave Presupuestal</th>
                                            <th class="text-right">Inversión</th>
                                            <th class="text-center" style="width:100px;">Opciones</th>
                                        </tr>
                                    </thead>
                                    <tbody id="tbodyCOCI"></tbody>
                                </table>
                            </div>
                        </div>
                    </div>
                </div>

                <!-- ═══ PANEL 4: Asignar Contrato ═══ -->
                <div id="panelContrato" style="display:none;">
                    <div class="card card-custom shadow-sm"
                         style="border-left:4px solid #FFA800 !important;">
                        <div class="card-header" style="background:#fff8e8; min-height:45px; padding:10px 20px;">
                            <div class="card-title mb-0">
                                <i class="fas fa-file-contract text-warning mr-2"></i>
                                <span class="font-weight-bold text-warning">Asignar Contrato</span>
                            </div>
                            <div class="card-toolbar">
                                <button type="button" class="btn btn-sm btn-light"
                                        id="btnRegresarContrato">
                                    <i class="fas fa-arrow-left mr-1"></i> Regresar
                                </button>
                            </div>
                        </div>
                        <div class="card-body">
                            <div class="alert alert-light-warning py-2 mb-3">
                                <small>
                                    <strong>Asignando contrato a acción:</strong>
                                    <span id="lblAccionContrato"></span>
                                </small>
                            </div>
                            <div class="row align-items-end">
                                <div class="col-md-6">
                                    <div class="form-group">
                                        <label class="font-weight-bold">Buscar Contrato:</label>
                                        <div class="input-group">
                                            <input type="text" class="form-control"
                                                   id="txtBuscarContrato"
                                                   placeholder="Escriba el número de contrato...">
                                            <div class="input-group-append">
                                                <button type="button" class="btn btn-warning" id="btnBuscarContrato">
                                                    <i class="fas fa-search"></i>
                                                </button>
                                            </div>
                                        </div>
                                        <div id="listaContratos" class="list-group mt-1"
                                             style="max-height:200px; overflow-y:auto;"></div>
                                    </div>
                                </div>
                                <div class="col-md-4">
                                    <div class="form-group">
                                        <label class="font-weight-bold">Contrato Seleccionado:</label>
                                        <input type="text" class="form-control font-weight-bold text-warning"
                                               id="txtContratoSeleccionado" readonly
                                               placeholder="(ninguno)">
                                    </div>
                                </div>
                                <div class="col-md-2">
                                    <div class="form-group">
                                        <button type="button" class="btn btn-warning btn-block"
                                                id="btnAsignarContrato">
                                            <i class="fas fa-link mr-1"></i> Asignar
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

            </div>
            <div class="modal-footer">
                <input type="hidden" id="hddIdObraAcciones">
                <input type="hidden" id="hddAccionMovAccion" value="add">
                <input type="hidden" id="hddIdAccionActual">
                <input type="hidden" id="hddIdOrigenActual">
                <input type="hidden" id="hddAccionMovOrigen" value="add">
                <input type="hidden" id="hddIdFuenteActual">
                <input type="hidden" id="hddStatusCOCI" value="CO">
                <input type="hidden" id="hddIdCOCIActual">
                <input type="hidden" id="hddAccionMovCOCI" value="add">
                <input type="hidden" id="hddIdContratoBuscar">
                <button type="button" class="btn btn-secondary" data-dismiss="modal">
                    <i class="fas fa-times mr-1"></i> Cerrar
                </button>
            </div>
        </div>
    </div>
</div>
</asp:Content>

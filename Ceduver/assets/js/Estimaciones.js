var chart;
document.addEventListener("DOMContentLoaded", function () {
    document.getElementById("idanio").addEventListener("change", inicial);
});
async function cargarPagina() {
    await catalogo();
    await inicial();
    
}
async function catalogo() {
    removeOptions(document.getElementById('idanio'));
    await anio();
    //const year = new Date().getFullYear();
    //document.getElementById("idanio").value = year;
    const year = new Date().getFullYear().toString().slice(-2);
    document.getElementById("idanio").value = year;
}
async function anio() {
    try {
        const resp = await fetch("api/estimaciones/anio");
        const data = await resp.json();
        _displayanio(data);
    } catch (error) {
        console.error('No fue posible completar la solicitud', error);
    }
}
function _displayanio(data) {
    const select = document.getElementById('idanio');
    select.innerHTML = "<option value=''>Seleccione...</option>";  // LIMPIA

    data.forEach(item => {
        let option = document.createElement("option");
        option.textContent = item.annio;
        option.value = item.idanio;
        select.appendChild(option);
    });
}
function buscar() {

}
async function inicial() {
    await grafica();
    await tablaestimaciones();
    await cargarDashboard();
}
async function grafica() {

    var idanio = document.getElementById("idanio").value;
    const response = await fetch("api/estimaciones/grafica/" + idanio);
    const data = await response.json();

    var series = [];
    var labels = [];
    // 🔥 SI NO HAY DATOS → OCULTA TODO
    if (!data || data.length === 0) {
        document.getElementById("estatusestimacion").innerHTML = "";
        document.getElementById("card1").style.display = "none";
        document.getElementById("card2").style.display = "none";
        return false;
    }
    // 🔥 SI HAY DATOS → MOSTRAR
    document.getElementById("card1").style.display = "block";
    document.getElementById("card2").style.display = "block";

    data.forEach(function (item) {
        series.push(item.Value);
        labels.push(item.Name);
    });

    // evitar duplicar gráficas
    if (chart) {
        chart.destroy();
    }

    var options = {
        series: series,
        chart: {
            width: 600,
            type: 'donut'
        },
        labels: labels,
        responsive: [{
            breakpoint: 480,
            options: {
                chart: { width: 200 },
                legend: { position: 'bottom' }
            }
        }]
    };

    chart = new ApexCharts(document.querySelector("#chart_est"), options);
    chart.render();
}
async function tablaestimaciones() {
    let html = "";
    var idanio = document.getElementById("idanio").value;
    const response = await fetch("api/estimaciones/getestimaciones/" + idanio);
    const data = await response.json();
    data.forEach(function (item) {
        html += `<tr>`;
        html += `<td class="text-center">${item.estatusestimacion}</td>`;
        html += `<td class="text-center">
                    <a href="#" 
                       onclick="verDetalle('${item.idestatusestimacion}','${idanio}');return false;">
                       ${item.cantidad}
                    </a>
                 </td>`;
        html += `</tr>`;
    });
    document.getElementById("estatusestimacion").innerHTML = html;
}
async function verDetalle(idestatusestimacion, idanio) {
    try {
        mostrarLoader();

        const data = await $.ajax({
            url: 'api/estimaciones/detalleestimaciones',
            type: 'GET',
            data: {
                idestatusestimacion: idestatusestimacion,
                idanio: idanio
            }
        });

        llenarTablaDetalleestimaciones(data);

        $('#myModaldetalleest').modal('show');

    } catch (xhr) {
        console.error(xhr.responseText || xhr);
        msginformar("Error al obtener detalle");
    } finally {
        ocultarLoader();
    }
}
function llenarTablaDetalleestimaciones(data) {

    let html = "";

    data.forEach(item => {

        html += `<tr>
            <td style="font-size: 10px;">${item.noestimacion}</td>
            <td style="font-size: 10px;">${item.estatusestimacion}</td>
            <td style="font-size: 10px;">${item.Contrato}</td>
            <td style="font-size: 10px;">${formatearFecha(item.fechaingreso)}</td>
            <td style="font-size: 10px;">$ ${item.importeliquido.toLocaleString()}</td>
            <td style="font-size: 10px;">$ ${item.totaldeduccion.toLocaleString()}</td>
            <td style="font-size: 10px;">$ ${item.liquidopagar.toLocaleString()}</td>
            <td style="font-size: 10px;">${formatearFecha(item.FechaPago)}</td>
            <td style="font-size: 10px;">${item.numfactura}</td>
            <td style="font-size: 10px;">${formatearFecha(item.FechaFactura)}</td>
            <td style="font-size: 10px;">${item.Folio}</td>
            <td style="font-size: 10px;">${item.Contratista}</td>
            <td style="font-size: 10px;">${item.periodo}</td>
            <td style="font-size: 10px;">${item.AreaRevision} %</td>
            <td style="font-size: 10px;">${item.FuenteFinanciamiento} %</td>
        </tr>`;
    });

    // 🔥 destruir DataTable si existe
    if ($.fn.DataTable.isDataTable('#tablaDetalleEst')) {
        $('#tablaDetalleEst').DataTable().clear().destroy();
    }

    $("#bodyDetalleEst").html(html);

    $('#tablaDetalleEst').DataTable({
        language: {
            url: "//cdn.datatables.net/plug-ins/9dcbecd42ad/i18n/Spanish.json"
        },
        'lengthMenu': [[5, 50, 100, 200, -1], [5, 50, 100, 200, 'Todos']],
        dom:
            "<'row'<'col-md-4'l><'col-md-4 text-center'B><'col-md-4 text-left'f>>" +
            "<'row'<'col-md-12'tr>>" +
            "<'row'<'col-md-5'i><'col-md-7 text-left'p>>",
        /*dom: 'Bfrtip',*/
        buttons: [
            {
                extend: 'excelHtml5',
                text: 'Excel',
                className: 'btn btn-success',
                title: 'Detalle_Estimaciones_' + new Date().toISOString().slice(0, 10)
            }
        ],
        pageLength: 5,
        responsive: true,
        scrollX: true,
        autoWidth: false
    });
}
function removeOptions(selectElement) {
    var i, L = selectElement.options.length - 1;
    for (i = L; i >= 1; i--) {
        selectElement.remove(i);
    }
}
//==============================================================================================
//=======================ESTIMACIONES POR FECHAS Y AL DIA=======================================
//==============================================================================================
//---------fechas estimaciones
async function Consultarestfechas() {

    //if (!validarFiltrosEstimaciones()) {
    //    return;
    //}
    if (!validarFiltros({
        fechaini: "fechainiest",
        fechafin: "fechafinest",
        contrato: "contratoest"
    }))
    {
        return;
    }
    let fechaini = document.getElementById("fechainiest").value;
    let fechafin = document.getElementById("fechafinest").value;
    let contrato = document.getElementById("contratoest").value;
    try
    { 
    mostrarLoader();
    const response = await fetch(`api/estimaciones/consultar?fechaini=${fechaini}&fechafin=${fechafin}&contrato=${contrato}`);

    const data = await response.json();

    llenarTablaEstimaciones(data);
    }
    catch (xhr) {
        console.error(xhr.responseText || xhr);
        msginformar("Error al obtener detalle");
    }
    finally {
        ocultarLoader();
    }
}
function llenarTablaEstimaciones(data) {

    let html = "";

    data.forEach(item => {

        html += `<tr>

            <td class="align-middle">${formatearFecha(item.fechaingreso)}</td>
            <td class="align-middle">
                <a href="javascript:void(0)"
                   onclick="verDetalleEstimaciones('${item.fechaingreso}', '${item.contrato}')">
                   ${item.numeroestimaciones}
                </a>
            </td>
            <td class="align-middle monto">$ ${item.importetotal.toLocaleString()}</td>
            <td class="align-middle monto">$ ${item.totaldeducciones.toLocaleString()}</td>
            <td class="align-middle monto">$ ${item.importeliquido.toLocaleString()}</td>
            <td class="align-middle monto">$ ${item.totalpagadoliquido.toLocaleString()}</td>
            <td class="align-middle">${item.numeroestimacionespagadas}</td>
            <td class="align-middle wrap-text">${item.facturas}</td>
            <td class="align-middle wrap-text">${item.contratistas}</td>
            <td class="align-middle wrap-text">${item.folios}</td>

        </tr>`;
    });
    // Si el DataTable YA existe, lo destruimos
    if ($.fn.DataTable.isDataTable('#idfechas')) {
        $('#idfechas').DataTable().clear().destroy();
    }
    $("#bodyestimaciones").empty();
    document.getElementById("bodyestimaciones").innerHTML = html;
    $('#idfechas').DataTable({
        'language': {
            "url": "//cdn.datatables.net/plug-ins/9dcbecd42ad/i18n/Spanish.json"
        },
        'lengthMenu': [[5, 50, 100, 200, -1], [5, 50, 100, 200, 'Todos']],
        'responsive': true,
        dom:
            "<'row'<'col-md-4'l><'col-md-4 text-center'B><'col-md-4 text-left'f>>" +
            "<'row'<'col-md-12'tr>>" +
            "<'row'<'col-md-5'i><'col-md-7 text-left'p>>",
        buttons: [
            {
                extend: 'excelHtml5',
                text: 'Excel',
                className: 'btn btn-success',
                title: 'Detalle_Estimaciones_' + new Date().toISOString().slice(0, 10)
            }
        ]
    });
    

}
function Limpiarfechas() {
    document.getElementById("fechainiest").value = "";
    document.getElementById("fechafinest").value = "";
    document.getElementById("contratoest").value = "";
    document.getElementById("idcontrato").value = "";
    // 🔥 LIMPIAR TABLA CORRECTAMENTE
    if ($.fn.DataTable.isDataTable('#idfechas')) {
        $('#idfechas').DataTable().clear().draw();
    }
}
async function verDetalleEstimaciones(fecha, contrato) {
    try {
        mostrarLoader();
        const data = await $.ajax({
            url: 'api/estimaciones/detalleporfecha',
            type: 'GET',
            data: {
                fechaini: fecha,
                contrato: contrato
            }
        });

        llenarTablaDetalle(data);

        // 🔥 mostrar modal
        $('#myModal').modal('show');

    } catch (xhr) {
        console.error(xhr.responseText || xhr);
        msginformar("Error al obtener detalle");
    }
    finally {
        ocultarLoader();
    }
}
function llenarTablaDetalle(data) {

    // 🔥 destruir si ya existe
    if ($.fn.DataTable.isDataTable('#tablaDetalle')) {
        $('#tablaDetalle').DataTable().clear().destroy();
    }

    let html = "";

    data.forEach(item => {
        html += `<tr>
            <td style="font-size: 10px;">${item.noestimacion}</td>
            <td style="font-size: 10px;">${item.estatusestimacion}</td>
            <td style="font-size: 10px;">${item.Contrato}</td>
            <td style="font-size: 10px;">${formatearFecha(item.fechaingreso)}</td>
            <td style="font-size: 10px;">${item.avancefisico} %</td>
            <td style="font-size: 10px;">${item.avancefinanciero} %</td>
            <td style="font-size: 10px;">${formatearFecha(item.FechaPago)}</td>
            <td style="font-size: 10px;">$ ${item.importeliquido.toLocaleString()}</td>
            <td style="font-size: 10px;">$ ${item.totaldeduccion.toLocaleString()}</td>
            <td style="font-size: 10px;">$ ${item.liquidopagar.toLocaleString()}</td>
            <td style="font-size: 10px;">${item.numfactura}</td>
            <td style="font-size: 10px;">${item.Folio}</td>
            <td style="font-size: 10px;">${item.Contratista}</td>
            <td style="font-size: 10px;">${item.periodo}</td>
        </tr>`;
    });
    // Si el DataTable YA existe, lo destruimos
    //if ($.fn.DataTable.isDataTable('#tablaDetalle')) {
    //    $('#tablaDetalle').DataTable().clear().destroy();
    //}

    $('#tablaDetalle tbody').html(html);

    // 🔥 inicializar datatable
    $('#tablaDetalle').DataTable({
        language: {
            url: "//cdn.datatables.net/plug-ins/9dcbecd42ad/i18n/Spanish.json"
        },
        responsive: true,
        pageLength: 5,
        'lengthMenu': [[5, 50, 100, 200, -1], [5, 50, 100, 200, 'Todos']],
        dom:
            "<'row'<'col-md-4'l><'col-md-4 text-center'B><'col-md-4 text-left'f>>" +
            "<'row'<'col-md-12'tr>>" +
            "<'row'<'col-md-5'i><'col-md-7 text-left'p>>",
        buttons: [
            {
                extend: 'excelHtml5',
                text: 'Excel',
                className: 'btn btn-success',
                title: 'Detalle_Estimaciones_' + new Date().toISOString().slice(0, 10)
            }
        ],
        scrollX: true,
        autoWidth: false
    });
}
//---------fechas bitacora
async function Consultarbitfechas(e) {

    // 🔥 EVITA postback / submit del formulario
    if (e) e.preventDefault();

    let fechaini = document.getElementById("fechainibit").value;
    let fechafin = document.getElementById("fechafinbit").value;
    let contrato = document.getElementById("bitacoraest").value;

    // 🔴 VALIDACIONES
    if (!fechaini && !fechafin && !contrato) {
        msginformar("Debe seleccionar un filtro.. verifique por favor");
        return false;
    }

    if ((!fechaini && fechafin) || (fechaini && !fechafin)) {
        msginformar("Debe seleccionar el rango de fecha");
        return false;
    }

    // ✅ Validar formato de fechas
    if (fechaini && !esFechaValida(fechaini)) {
        msginformar("El formato de fecha inicial no es correcto");
        return false;
    }

    if (fechafin && !esFechaValida(fechafin)) {
        msginformar("El formato de fecha final no es correcto");
        return false;
    }

    try {
        // 🚀 AJAX
        const data = await $.ajax({
            url: 'api/estimaciones/consultarbit',
            type: 'GET',
            data: {
                fechaini: fechaini,
                fechafin: fechafin,
                contrato: contrato
            },
            xhrFields: {
                withCredentials: true
            }
        });

        llenarTablaBitacora(data);

    } catch (xhr) {

        // 🔥 detectar redirección escondida (sesión expirada)
        if (xhr.responseURL && xhr.responseURL.includes("default.aspx")) {
            msginformar("Sesión expirada, vuelva a iniciar sesión");
            return;
        }

        console.error(xhr.responseText || xhr);
        msginformar("Error al consultar datos");
    }

    return false; // 🔥 EXTRA seguridad para evitar submit
}
function llenarTablaBitacora(data) {
    let html = "";
    data.forEach(item => {
        html += `<tr>
        <td class="align-middle">${item.Contrato}</td>
        <td class="align-middle">${item.Contratista}</td>
        <!-- 🔥 LINK -->
            <td class="align-middle">
                <a href="javascript:void(0)" class="link-estimacion"
                    onclick="verDetalleEstimacionesbitacora('${item.IdEstimacion}')">
                   ${item.NoEstimacion}
                </a>
            </td>

        <td class="align-middle">${item.EstatusEstimacion}</td>
        <td class="align-middle">${formatearFecha(item.FechaIngreso)}</td>
        <td class="align-middle">${formatearFecha(item.FechaPago)}</td>
        </tr>`;
    });
    // Si el DataTable YA existe, lo destruimos
    if ($.fn.DataTable.isDataTable('#idbitacora')) {
        $('#idbitacora').DataTable().clear().destroy();
    }
    $("#bodybitacoraestimaciones").empty();
    document.getElementById("bodybitacoraestimaciones").innerHTML = html;
    $('#idbitacora').DataTable({
        'language': {
            "url": "//cdn.datatables.net/plug-ins/9dcbecd42ad/i18n/Spanish.json"
        },
        'lengthMenu': [[5, 50, 100, 200, -1], [5, 50, 100, 200, 'Todos']],
        'responsive': true,
        pageLength: 5,
        dom:
            "<'row'<'col-md-4'l><'col-md-4 text-center'B><'col-md-4 text-left'f>>" +
            "<'row'<'col-md-12'tr>>" +
            "<'row'<'col-md-5'i><'col-md-7 text-left'p>>",
        buttons: [
            {
                extend: 'excelHtml5',
                text: 'Excel',
                className: 'btn btn-success',
                title: 'Detalle_Estimaciones_' + new Date().toISOString().slice(0, 10)
            }
        ]
    });
}
async function verDetalleEstimacionesbitacora(id) {

    try {
        mostrarLoader();

        const data = await $.ajax({
            url: 'api/estimaciones/consultarbitdetalle',
            type: 'GET',
            data: { idestimacion: id }
        });

        llenarModalBitacora(data);

        // 🔥 abrir modal
        $("#myModalBI").modal("show");

    } catch (err) {
        console.error(err);
        msginformar("Error al obtener detalle");
    } finally {
        ocultarLoader();
    }
}
function llenarModalBitacora(data) {
    let html = "";

    data.forEach(item => {
        html += `<tr>
            <td style="font-size: 10px;">${item.Contrato}</td>
            <td style="font-size: 10px;">${item.Contratista}</td>
            <td style="font-size: 10px;">${item.NoEstimacion}</td>
            <td style="font-size: 10px;">${item.EstatusEstimacion}</td>
            <td style="font-size: 10px;">${formatearFecha(item.FechaEmision)}</td>
            <td style="font-size: 10px;">${item.Observaciones || ""}</td>
        </tr>`;
    });

    if ($.fn.DataTable.isDataTable('#tablaDetalleBitacora')) {
        $('#tablaDetalleBitacora').DataTable().clear().destroy();
    }

    $("#bodyDetalleBitacora").html(html);

    $('#tablaDetalleBitacora').DataTable({
        language: {
            url: "//cdn.datatables.net/plug-ins/9dcbecd42ad/i18n/Spanish.json"
        },
        pageLength: 5,
        'lengthMenu': [[5, 50, 100, 200, -1], [5, 50, 100, 200, 'Todos']],
        'responsive': true,
        dom:
            "<'row'<'col-md-4'l><'col-md-4 text-center'B><'col-md-4 text-left'f>>" +
            "<'row'<'col-md-12'tr>>" +
            "<'row'<'col-md-5'i><'col-md-7 text-left'p>>",
        buttons: [
            {
                extend: 'excelHtml5',
                text: 'Excel',
                className: 'btn btn-success',
                title: 'Detalle_Estimaciones_' + new Date().toISOString().slice(0, 10)
            }
        ],
        scrollX: true,
        autoWidth: false
    });
}
function Limpiarbitacora() {
    document.getElementById("fechainibit").value = "";
    document.getElementById("fechafinbit").value = "";
    document.getElementById("bitacoraest").value = "";
    document.getElementById("bitacoraidcontrato").value = "";
    // 🔥 LIMPIAR TABLA CORRECTAMENTE
    if ($.fn.DataTable.isDataTable('#idbitacora')) {
        $('#idbitacora').DataTable().clear().draw();
    }
}
//---------fechas estimaciones al dia
async function Consultardiafechas(e) {
    // 🔥 EVITA postback / submit del formulario
    if (e) e.preventDefault();

    let fechaini = document.getElementById("fechainidia").value;
    let fechafin = document.getElementById("fechafindia").value;
    let contrato = document.getElementById("contratodia").value;

    // 🔴 VALIDACIONES
    if (!fechaini && !fechafin && !contrato) {
        msginformar("Debe seleccionar un filtro.. verifique por favor");
        return false;
    }

    if ((!fechaini && fechafin) || (fechaini && !fechafin)) {
        msginformar("Debe seleccionar el rango de fecha");
        return false;
    }

    // ✅ Validar formato de fechas
    if (fechaini && !esFechaValida(fechaini)) {
        msginformar("El formato de fecha inicial no es correcto");
        return false;
    }

    if (fechafin && !esFechaValida(fechafin)) {
        msginformar("El formato de fecha final no es correcto");
        return false;
    }

    try {
        mostrarLoader();
        // 🚀 AJAX
        const data = await $.ajax({
            url: 'api/estimaciones/consultarbitdia',
            type: 'GET',
            data: {
                fechaini: fechaini,
                fechafin: fechafin,
                contrato: contrato
            },
            xhrFields: {
                withCredentials: true
            }
        });

        llenarTablaBitacoradia(data);

    } catch (xhr) {

        // 🔥 detectar redirección escondida (sesión expirada)
        if (xhr.responseURL && xhr.responseURL.includes("default.aspx")) {
            msginformar("Sesión expirada, vuelva a iniciar sesión");
            return;
        }

        console.error(xhr.responseText || xhr);
        msginformar("Error al consultar datos");
    }
    finally {
        ocultarLoader();
    }

    return false; // 🔥 EXTRA seguridad para evitar submit
}
function llenarTablaBitacoradia(data) {
    let html = "";
    data.forEach(item => {
        html += `<tr>
        <td class="align-middle">${item.Contrato}</td>
        <td class="align-middle">${item.Contratista}</td>
        <td class="align-middle">${item.noestimacion}</td>
        <td class="align-middle">${item.estatusestimacion}</td>
        <td class="align-middle">${formatearFecha(item.FechaIngreso)}</td>
        <td class="align-middle">${formatearFecha(item.fechaemision)}</td>
        <td class="align-middle">${formatearFecha(item.FechaPago)}</td>
        <td class="align-middle">${item.Observaciones}</td>
        </tr>`;
    });
    // Si el DataTable YA existe, lo destruimos
    if ($.fn.DataTable.isDataTable('#iddia')) {
        $('#iddia').DataTable().clear().destroy();
    }
    $("#bodydiaestimaciones").empty();
    document.getElementById("bodydiaestimaciones").innerHTML = html;
    $('#iddia').DataTable({
        'language': {
            "url": "//cdn.datatables.net/plug-ins/9dcbecd42ad/i18n/Spanish.json"
        },
        pageLength: 5,
        'lengthMenu': [[5, 50, 100, 200, -1], [5, 50, 100, 200, 'Todos']],
        'responsive': true,
        dom:
            "<'row'<'col-md-4'l><'col-md-4 text-center'B><'col-md-4 text-left'f>>" +
            "<'row'<'col-md-12'tr>>" +
            "<'row'<'col-md-5'i><'col-md-7 text-left'p>>",
        buttons: [
            {
                extend: 'excelHtml5',
                text: 'Excel',
                className: 'btn btn-success',
                title: 'Detalle_Estimaciones_' + new Date().toISOString().slice(0, 10)
            }
        ]
    });
}
function Limpiardiafechas() {
    document.getElementById("fechainidia").value = "";
    document.getElementById("fechafindia").value = "";
    document.getElementById("contratodia").value = "";
    document.getElementById("contratodiaidcontrato").value = "";
    // 🔥 LIMPIAR TABLA CORRECTAMENTE
    if ($.fn.DataTable.isDataTable('#iddia')) {
        $('#iddia').DataTable().clear().draw();
    }
}
//==============================================================================================
//------------------------------FUNCIONES GENERALES---------------------------------------------
//==============================================================================================
function initAutocomplete(inputId, listId, hiddenId) {

    const input = document.getElementById(inputId);
    const list = document.getElementById(listId);
    const hidden = document.getElementById(hiddenId);

    let selectedIndex = -1;
    let items = [];

    input.addEventListener("keyup", async function (e) {

        if (["ArrowDown", "ArrowUp", "Enter"].includes(e.key)) return;

        let term = input.value.trim();

        if (term.length < 2) {
            list.style.display = "none";
            return;
        }

        const response = await fetch("api/contratos/buscar?term=" + term);
        const data = await response.json();

        list.innerHTML = "";
        selectedIndex = -1;

        data.forEach((item, index) => {

            let option = document.createElement("a");

            option.className = "list-group-item list-group-item-action";
            option.textContent = item.NumContrato;

            option.addEventListener("click", function () {
                seleccionar(item);
            });

            list.appendChild(option);

        });

        items = list.querySelectorAll(".list-group-item");

        list.style.display = "block";

    });

    input.addEventListener("keydown", function (e) {

        if (!items.length) return;

        if (e.key === "ArrowDown") {
            selectedIndex = (selectedIndex + 1) % items.length;
            actualizarSeleccion();
        }

        if (e.key === "ArrowUp") {
            selectedIndex = (selectedIndex - 1 + items.length) % items.length;
            actualizarSeleccion();
        }

        if (e.key === "Enter") {
            e.preventDefault();

            if (selectedIndex >= 0) {
                seleccionarFromIndex();
            }
        }
    });

    function actualizarSeleccion() {
        items.forEach(i => i.classList.remove("active"));

        if (selectedIndex >= 0) {
            items[selectedIndex].classList.add("active");

            items[selectedIndex].scrollIntoView({
                block: "nearest"
            });
        }
    }

    function seleccionar(item) {
        input.value = item.NumContrato;
        hidden.value = item.IdContrato;
        list.style.display = "none";
    }

    function seleccionarFromIndex() {
        const text = items[selectedIndex].textContent;
        input.value = text;
        list.style.display = "none";
    }
}
function validarFiltros(config) {

    const fechaini = document.getElementById(config.fechaini).value.trim();
    const fechafin = document.getElementById(config.fechafin).value.trim();
    const contrato = document.getElementById(config.contrato).value.trim();

    if (!fechaini && !fechafin && !contrato) {
        msginformar("Debe seleccionar un filtro.. verifique por favor");
        return false;
    }

    if (!fechaini && fechafin) {
        msginformar("Debe seleccionar la fecha inicial");
        return false;
    }

    if (fechaini && !fechafin) {
        msginformar("Debe seleccionar la fecha final");
        return false;
    }

    return true;
}
function formatearFecha(fecha) {

    if (!fecha) return "";

    const f = new Date(fecha);

    const dia = String(f.getDate()).padStart(2, '0');
    const mes = String(f.getMonth() + 1).padStart(2, '0');
    const anio = f.getFullYear();

    return `${dia}/${mes}/${anio}`;
}
function msginformar(mensaje, tipo = 'warning', titulo = 'Advertencia') {
    Swal.fire({
        icon: tipo,
        title: titulo,
        text: mensaje,
        confirmButtonText: 'Aceptar'
    });
}
function esFechaValida(fecha) {
    const partes = fecha.split('/');
    if (partes.length !== 3) return false;

    const [dia, mes, anio] = partes;

    // Convertir a números
    const d = parseInt(dia, 10);
    const m = parseInt(mes, 10);
    const y = parseInt(anio, 10);

    // Validaciones básicas
    if (isNaN(d) || isNaN(m) || isNaN(y)) return false;
    if (y < 1000 || y > 9999) return false;
    if (m < 1 || m > 12) return false;
    if (d < 1 || d > 31) return false;

    // Crear fecha real
    const fechaObj = new Date(y, m - 1, d);

    // Validar que coincida (evita 31/02/2026 por ejemplo)
    return (
        fechaObj.getFullYear() === y &&
        fechaObj.getMonth() === m - 1 &&
        fechaObj.getDate() === d
    );
}
function mostrarLoader() {
    /*$("#loaderGlobal").fadeIn(200);*/
    $("#loaderGlobal").css("display", "flex");
}
function ocultarLoader() {
    $("#loaderGlobal").fadeOut(200);
}
function bloquearUI() {
    $("button").prop("disabled", true);
}
function desbloquearUI() {
    $("button").prop("disabled", false);
}
function obtenerFechaHoy() {
    const hoy = new Date();

    let dia = String(hoy.getDate()).padStart(2, '0');
    let mes = String(hoy.getMonth() + 1).padStart(2, '0');
    let anio = hoy.getFullYear();

    return `${dia}/${mes}/${anio}`;
}
//==============================================================================================
//------------------------------DASHBOARD-------------------------------------------------------
//==============================================================================================
async function cargarDashboard() {

    let idanio = document.getElementById("idanio").value;
    try {
        mostrarLoader();
        const res = await fetch(`api/dashboard/estatus?idanio=${idanio}`);
        const data = await res.json();
        // 🔥 VALIDACIÓN CLAVE
        if (!data || data.length === 0) {
            document.getElementById("bodyDashboard").innerHTML = "";
            document.getElementById("card3").style.display = "none";
            document.getElementById("card4").style.display = "none";
            return false;
        }
        // 🔥 SI HAY DATOS → MOSTRAR
        document.getElementById("card3").style.display = "block";
        document.getElementById("card4").style.display = "block";

        let html = "";
        data.forEach(item => {
            html += `<tr>
                <td>${item.Estatus}</td>
                <td>
                    <a href="#" onclick="verDetalleDashboard(${getId(item.Estatus)},1);return false">
                        ${item.ConTiempo}
                    </a>
                </td>
                <td>
                    <a href="#" onclick="verDetalleDashboard(${getId(item.Estatus)},2);return false">
                        ${item.FueraDeTiempo}
                    </a>
                </td>
            </tr>`;
        });
        document.getElementById("bodyDashboard").innerHTML = html;
        // 🔥 AQUI LLAMAS LA GRAFICA
        pintarGrafica(data);
    } catch (err) {
        console.error(err);
        msginformar("Error al cargar dashboard");
    }
    finally {
        ocultarLoader();
    }
}
function getId(estatus) {

    if (estatus.includes("Contratistas")) return 1;
    if (estatus.includes("Ventanilla")) return 2;
    if (estatus.includes("Operativa")) return 7;
    if (estatus.includes("Pago")) return 8;

    return 0;
}
async function verDetalleDashboard(idestatus, tipo) {

    let idanio = document.getElementById("idanio").value;

    try {
        mostrarLoader();

        const data = await $.ajax({
            url: 'api/dashboard/detalle',
            type: 'GET',
            data: {
                idestatus: idestatus,
                tipo: tipo,
                idanio: idanio
            }
        });

        llenarTablaDetalleDashboard(data);

        $('#modalDetalleDashboard').modal('show');

    } catch (err) {
        console.error(err);
        msginformar("Error al obtener detalle");
    }
    finally {
        ocultarLoader();
    }
}
function llenarTablaDetalleDashboard(data) {

    let html = "";

    data.forEach(item => {

        html += `<tr>
            <td>${item.noestimacion}</td>
            <td>${item.Contrato}</td>
            <td>${item.Contratista}</td>
            <td>${formatearFecha(item.fechaemision)}</td>
            <td>${item.diasHabiles}</td>
            <td>${item.estatusTiempo}</td>
        </tr>`;
    });

    if ($.fn.DataTable.isDataTable('#tablaDetalleDashboard')) {
        $('#tablaDetalleDashboard').DataTable().clear().destroy();
    }

    $("#bodyDetalleDashboard").html(html);

    $('#tablaDetalleDashboard').DataTable({
        language: {
            url: "//cdn.datatables.net/plug-ins/9dcbecd42ad/i18n/Spanish.json"
        },
        pageLength: 5,
        'lengthMenu': [[5, 50, 100, 200, -1], [5, 50, 100, 200, 'Todos']],
        'responsive': true,
        dom:
            "<'row'<'col-md-4'l><'col-md-4 text-center'B><'col-md-4 text-left'f>>" +
            "<'row'<'col-md-12'tr>>" +
            "<'row'<'col-md-5'i><'col-md-7 text-left'p>>",
        buttons: ['excel']
    });
}
let chartdashboard; // global
function pintarGrafica(data) {
    if (chartdashboard) {
        chartdashboard.destroy();
    }
    let categorias = [];
    let enTiempo = [];
    let fueraTiempo = [];
    if (!data || data.length === 0)
    {
        return false;
    }
    data.forEach(item => {
        categorias.push(item.Estatus);
        enTiempo.push(item.ConTiempo);
        fueraTiempo.push(item.FueraDeTiempo);
    });
    var options = {
        series: [
            {
                name: 'En Tiempo',
                data: enTiempo
            },
            {
                name: 'Fuera de Tiempo',
                data: fueraTiempo
            }
        ],
        chart: {
            type: 'bar',
            height: 350
        },
        plotOptions: {
            bar: {
                horizontal: true,
                columnWidth: '50%',
                endingShape: 'rounded'
            }
        },
        dataLabels: {
            enabled: true
        },
        xaxis: {
            categories: categorias
        },
        legend: {
            position: 'top'
        }
    };
    chartdashboard = new ApexCharts(document.querySelector("#graficaDashboard"),options);
    chartdashboard.render();
}

//==============================================================================================
//------------------------------MODALES---------------------------------------------------------
//==============================================================================================
$('#myModaldetalleest').on('shown.bs.modal', function () {
    $('#tablaDetalleEst').DataTable().columns.adjust().responsive.recalc();
});

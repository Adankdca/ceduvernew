using Ceduver.Models;
using Dapper;
using System;
using System.Configuration;
using System.Data.SqlClient;
using System.IO;
using System.Linq;
using System.Net;
using System.Net.Http;
using System.Net.Http.Headers;
using System.Web;
using System.Web.Hosting;
using System.Web.Http;

namespace Ceduver.Controllers
{
    [RoutePrefix("api/Contratos")]
    public class ContratosController : ApiController
    {
        private readonly string _conn =
        ConfigurationManager.ConnectionStrings["constr"].ToString();

        // ══════════════════════════════════════════════════════════════════
        // GET CONTRATOS
        // ══════════════════════════════════════════════════════════════════
        [HttpGet]
        [Route("getContratos")]
        public IHttpActionResult GetContratos(
            string contrato = "", string idContratista = "", string idTipoOrden = "")
        {
            // Normalizar nulls a string vacío
            contrato = contrato ?? "";
            idContratista = idContratista ?? "";
            idTipoOrden = idTipoOrden ?? "";
            try
            {
                using (var con = new SqlConnection(_conn))
                {
                    string sql = @"
                        SELECT C.IDContrato         AS idContrato,
                               C.CON_Contrato       AS numContrato,
                               C.CON_Descripcion    AS descripcion,
                               CT.CTS_Nombre        AS contratista,
                               C.IDContratista      AS idContratista,
                               CONVERT(varchar,C.CON_Inicio,103)  AS fechaInicio,
                               CONVERT(varchar,C.CON_Final,103)   AS fechaTermino,
                               CONVERT(varchar,C.CON_Firma,103)   AS fechaFirma,
                               C.CON_Montocontratado AS montoContratado,
                               C.CON_montoanticipo   AS montoAnticipo,
                               C.AvanceFinanciero    AS avanceFinanciero,
                               C.IDTipocontrato      AS idTipoContrato,
                               C.IDConceptocontratado AS idConceptoContratado,
                               C.IDTipoorden         AS idTipoOrden,
                               C.CON_RutaContrato    AS rutaArchivo
                        FROM TBLD_Contrato C
                        LEFT JOIN TBLC_Contratistas CT ON C.IDContratista = CT.IDContratista
                       WHERE (ISNULL(@contrato,'') = '' OR C.CON_Contrato LIKE '%' + @contrato + '%')
                          AND (ISNULL(@idContratista,'') = '' OR C.IDContratista = @idContratista)
                          AND (ISNULL(@idTipoOrden,'') = '' OR C.IDTipoorden = @idTipoOrden)
                        ORDER BY C.IDContrato DESC";

                    var lista = con.Query(sql,
                        new { contrato, idContratista, idTipoOrden }).ToList();
                    return Ok(lista);
                }
            }
            catch (Exception ex) { return InternalServerError(ex); }
        }

        [HttpGet]
        [Route("getContratoById/{idContrato}")]
        public IHttpActionResult GetContratoById(int idContrato)
        {
            try
            {
                using (var con = new SqlConnection(_conn))
                {
                    var c = con.QueryFirstOrDefault(@"
                        SELECT C.IDContrato AS idContrato,
                               C.CON_Contrato AS numContrato,
                               C.CON_Descripcion AS descripcion,
                               C.IDContratista AS idContratista,
                               CONVERT(varchar,C.CON_Firma,103)  AS fechaFirma,
                               CONVERT(varchar,C.CON_Inicio,103) AS fechaInicio,
                               CONVERT(varchar,C.CON_Final,103)  AS fechaTermino,
                               C.CON_Montocontratado AS montoContratado,
                               C.CON_montoanticipo   AS montoAnticipo,
                               C.AvanceFinanciero    AS avanceFinanciero,
                               C.IDTipocontrato      AS idTipoContrato,
                               C.IDConceptocontratado AS idConceptoContratado,
                               C.IDTipoorden          AS idTipoOrden,
                               C.CON_RutaContrato     AS rutaArchivo
                        FROM TBLD_Contrato C WHERE IDContrato = @id",
                        new { id = idContrato });
                    return Ok(c);
                }
            }
            catch (Exception ex) { return InternalServerError(ex); }
        }

        // ══════════════════════════════════════════════════════════════════
        // GUARDAR (INSERT + UPDATE + historial + archivo)
        // ══════════════════════════════════════════════════════════════════
        [HttpPost]
        [Route("guardarContrato")]
        public IHttpActionResult GuardarContrato()
        {
            try
            {
                var req = HttpContext.Current.Request;
                string accion = req.Form["Accion"] ?? "add";
                int idContrato = accion == "edit"
                    ? Convert.ToInt32(req.Form["IdContrato"] ?? "0") : 0;

                string numContrato = (req.Form["NumContrato"] ?? "").ToUpper();
                string descripcion = (req.Form["Descripcion"] ?? "").ToUpper();
                decimal monto = ParseDecimal(req.Form["MontoContratado"]);
                decimal anticipo = ParseDecimal(req.Form["MontoAnticipo"]);
                decimal avance = ParseDecimal(req.Form["AvanceFinanciero"]);
                int idContratista = ParseInt(req.Form["IdContratista"]);
                int idTipoOrden = ParseInt(req.Form["IdTipoOrden"]);
                int idTipoContrato = ParseInt(req.Form["IdTipoContrato"]);
                int idConcepto = ParseInt(req.Form["IdConceptoContratado"]);

                DateTime fechaFirma = ParseFecha(req.Form["FechaFirma"]);
                DateTime fechaInicio = ParseFecha(req.Form["FechaInicio"]);
                DateTime fechaTermino = ParseFecha(req.Form["FechaTermino"]);

                // Validar fechas
                if (fechaTermino < fechaInicio)
                    return BadRequest("La Fecha de Término debe ser mayor que la Fecha de Inicio.");

                // Manejo de archivo
                string rutaArchivo = req.Form["RutaArchivoActual"] ?? "";
                if (req.Files["Archivo"] != null && req.Files["Archivo"].ContentLength > 0)
                {
                    var file = req.Files["Archivo"];
                    string ext = Path.GetExtension(file.FileName).ToLower();
                    string[] ok = { ".pdf", ".doc", ".docx", ".xls", ".xlsx",
                                    ".jpg", ".jpeg", ".png", ".gif", ".bmp" };
                    if (!ok.Contains(ext))
                        return BadRequest("Formato de archivo no permitido.");

                    int idTemp = idContrato > 0 ? idContrato : 0;
                    string carpeta = HostingEnvironment.MapPath(
                        "~/CONTRATOS/" + (idTemp > 0 ? idTemp.ToString() : "nuevo"));
                    Directory.CreateDirectory(carpeta);
                    string rutaFisica = Path.Combine(carpeta, file.FileName);
                    if (File.Exists(rutaFisica)) File.Delete(rutaFisica);
                    file.SaveAs(rutaFisica);
                    rutaArchivo = "CONTRATOS/" +
                        (idTemp > 0 ? idTemp.ToString() : "nuevo") + "/" + file.FileName;
                }

                using (var con = new SqlConnection(_conn))
                {
                    con.Open();

                    if (accion == "add")
                    {
                        // Guardar historial
                        GuardarHistorial(con, null, numContrato, descripcion,
                            idContratista, fechaFirma, fechaInicio, fechaTermino,
                            monto, anticipo, rutaArchivo, idTipoContrato, idConcepto,
                            idTipoOrden, "AGREGADO");

                        // INSERT
                        int newId = con.ExecuteScalar<int>(@"
                            INSERT INTO TBLD_Contrato(IDObraproyecto,IDContratista,IDArea,
                                CON_Contrato,CON_Firma,CON_Descripcion,CON_Inicio,CON_Final,
                                CON_Montocontratado,CON_NoEstimacion,CON_montoanticipo,
                                CON_Diacorte,CON_RutaContrato,IDTipocontrato,
                                IDConceptocontratado,CON_Porcentaje,FechaAlta,
                                IDTipoorden,ClasificacionProyecto,AvanceFinanciero)
                            VALUES(0,@idCts,0,@num,@firma,@desc,@ini,@fin,
                                @monto,0,@anticipo,0,@ruta,@tipoC,
                                @concepto,0,@hoy,@tipoO,'contratos',@avance);
                            SELECT CAST(SCOPE_IDENTITY() AS int);",
                            new
                            {
                                idCts = idContratista,
                                num = numContrato,
                                firma = fechaFirma,
                                desc = descripcion,
                                ini = fechaInicio,
                                fin = fechaTermino,
                                monto,
                                anticipo,
                                ruta = rutaArchivo,
                                tipoC = idTipoContrato,
                                concepto = idConcepto,
                                hoy = DateTime.Now,
                                tipoO = idTipoOrden,
                                avance
                            });

                        // Si hubo archivo en carpeta "nuevo", moverlo
                        if (rutaArchivo.Contains("/nuevo/") && newId > 0)
                        {
                            string carpetaNueva = HostingEnvironment.MapPath(
                                "~/CONTRATOS/" + newId);
                            Directory.CreateDirectory(carpetaNueva);
                            string archivoOrig = HostingEnvironment.MapPath(
                                "~/" + rutaArchivo);
                            string nombreArchivo = Path.GetFileName(rutaArchivo);
                            string archivoDest = Path.Combine(carpetaNueva, nombreArchivo);
                            if (File.Exists(archivoOrig))
                                File.Move(archivoOrig, archivoDest);
                            rutaArchivo = "CONTRATOS/" + newId + "/" + nombreArchivo;
                            con.Execute(
                                "UPDATE TBLD_Contrato SET CON_RutaContrato=@ruta WHERE IDContrato=@id",
                                new { ruta = rutaArchivo, id = newId });
                        }
                    }
                    else
                    {
                        // Guardar historial del estado anterior
                        var ant = con.QueryFirstOrDefault(
                            "SELECT * FROM TBLD_Contrato WHERE IDContrato=@id",
                            new { id = idContrato });
                        if (ant != null)
                            GuardarHistorial(con, ant, null, null, 0,
                                DateTime.MinValue, DateTime.MinValue, DateTime.MinValue,
                                0, 0, null, 0, 0, 0, "MODIFICADO");

                        // UPDATE
                        con.Execute(@"
                            UPDATE TBLD_Contrato SET
                                IDContratista=@idCts, IDArea=0,
                                CON_Contrato=@num, CON_Firma=@firma,
                                CON_Descripcion=@desc, CON_Inicio=@ini,
                                CON_Final=@fin, CON_Montocontratado=@monto,
                                CON_NoEstimacion=0, CON_montoanticipo=@anticipo,
                                CON_Diacorte=0, CON_RutaContrato=@ruta,
                                IDTipocontrato=@tipoC, IDConceptocontratado=@concepto,
                                CON_Porcentaje=0, IDTipoorden=@tipoO,
                                AvanceFinanciero=@avance
                            WHERE IDContrato=@id",
                            new
                            {
                                idCts = idContratista,
                                num = numContrato,
                                firma = fechaFirma,
                                desc = descripcion,
                                ini = fechaInicio,
                                fin = fechaTermino,
                                monto,
                                anticipo,
                                ruta = rutaArchivo,
                                tipoC = idTipoContrato,
                                concepto = idConcepto,
                                tipoO = idTipoOrden,
                                avance,
                                id = idContrato
                            });
                    }
                }
                return Ok(new { success = true });
            }
            catch (Exception ex) { return InternalServerError(ex); }
        }

        // ══════════════════════════════════════════════════════════════════
        // ELIMINAR
        // ══════════════════════════════════════════════════════════════════
        [HttpDelete]
        [Route("eliminarContrato/{idContrato}")]
        public IHttpActionResult EliminarContrato(int idContrato)
        {
            try
            {
                using (var con = new SqlConnection(_conn))
                {
                    con.Open();
                    // Validar estimaciones
                    var tieneEst = con.ExecuteScalar<int>(
                        "SELECT COUNT(*) FROM TblP_Estimacion WHERE IDContratoObra=@id",
                        new { id = idContrato });
                    if (tieneEst > 0)
                        return BadRequest("Imposible eliminar. El contrato tiene estimaciones asignadas.");

                    // Guardar historial
                    var c = con.QueryFirstOrDefault(
                        "SELECT * FROM TBLD_Contrato WHERE IDContrato=@id",
                        new { id = idContrato });
                    if (c != null)
                        GuardarHistorial(con, c, null, null, 0,
                            DateTime.MinValue, DateTime.MinValue, DateTime.MinValue,
                            0, 0, null, 0, 0, 0, "ELIMINADO");

                    // Desasignar de acciones
                    con.Execute(
                        "UPDATE TblD_Acciones SET IDContrato=0 WHERE IDContrato=@id",
                        new { id = idContrato });

                    // Eliminar
                    con.Execute(
                        "DELETE FROM TBLD_Contrato WHERE IDContrato=@id",
                        new { id = idContrato });
                }
                return Ok(new { success = true });
            }
            catch (Exception ex) { return InternalServerError(ex); }
        }

        // ══════════════════════════════════════════════════════════════════
        // DESCARGAR ARCHIVO
        // ══════════════════════════════════════════════════════════════════
        [HttpGet]
        [Route("descargarArchivo")]
        public HttpResponseMessage DescargarArchivo(string ruta)
        {
            try
            {
                string rutaFisica = HostingEnvironment.MapPath("~/" + ruta);
                if (!File.Exists(rutaFisica))
                    return Request.CreateErrorResponse(
                        HttpStatusCode.NotFound, "Archivo no encontrado.");

                byte[] bytes = File.ReadAllBytes(rutaFisica);
                string fileName = Path.GetFileName(rutaFisica);
                string mime = MimeMapping.GetMimeMapping(fileName);

                var response = Request.CreateResponse(HttpStatusCode.OK);
                response.Content = new ByteArrayContent(bytes);
                response.Content.Headers.ContentType =
                    new MediaTypeHeaderValue(mime);
                response.Content.Headers.ContentDisposition =
                    new ContentDispositionHeaderValue("attachment")
                    { FileName = fileName };
                return response;
            }
            catch (Exception ex)
            {
                return Request.CreateErrorResponse(
                    HttpStatusCode.InternalServerError, ex.Message);
            }
        }

        // ══════════════════════════════════════════════════════════════════
        // CATÁLOGOS
        // ══════════════════════════════════════════════════════════════════
        [HttpGet]
        [Route("getContratistas")]
        public IHttpActionResult GetContratistas()
        {
            try
            {
                using (var con = new SqlConnection(_conn))
                {
                    var lista = con.Query(
                        "SELECT IDContratista AS id, CTS_Nombre AS nombre " +
                        "FROM TBLC_Contratistas WHERE CTS_Nombre NOT LIKE '%(SELECCIONE)%' ORDER BY CTS_Nombre").ToList();
                    return Ok(lista);
                }
            }
            catch (Exception ex) { return InternalServerError(ex); }
        }

        [HttpGet]
        [Route("getTipoOrden")]
        public IHttpActionResult GetTipoOrden()
        {
            try
            {
                using (var con = new SqlConnection(_conn))
                {
                    var lista = con.Query(
                        "SELECT IDTipoorden AS id, Descripcion AS nombre " +
                        "FROM TblC_TipoOrden WHERE Descripcion NOT LIKE '%(SELECCIONE)%' ORDER BY Descripcion").ToList();
                    return Ok(lista);
                }
            }
            catch (Exception ex) { return InternalServerError(ex); }
        }

        [HttpGet]
        [Route("getTipoContrato")]
        public IHttpActionResult GetTipoContrato()
        {
            try
            {
                using (var con = new SqlConnection(_conn))
                {
                    var lista = con.Query(
                        "SELECT IDTipocontrato AS id, Nombretipocontrato AS nombre " +
                        "FROM TblC_Tipocontrato WHERE Nombretipocontrato NOT LIKE '%(SELECCIONE)%' ORDER BY Nombretipocontrato").ToList();
                    return Ok(lista);
                }
            }
            catch (Exception ex) { return InternalServerError(ex); }
        }

        [HttpGet]
        [Route("getConceptoContratado")]
        public IHttpActionResult GetConceptoContratado()
        {
            try
            {
                using (var con = new SqlConnection(_conn))
                {
                    var lista = con.Query(
                        "SELECT idconceptocontratado AS id, CCT_Nombre AS nombre " +
                        "FROM tblc_conceptocontratado WHERE CCT_Nombre NOT LIKE '%(SELECCIONE)%' ORDER BY CCT_Nombre").ToList();
                    return Ok(lista);
                }
            }
            catch (Exception ex) { return InternalServerError(ex); }
        }

        // ══════════════════════════════════════════════════════════════════
        // MÉTODOS PRIVADOS
        // ══════════════════════════════════════════════════════════════════
        private void GuardarHistorial(SqlConnection con, dynamic registro,
            string numContrato, string descripcion, int idContratista,
            DateTime firma, DateTime inicio, DateTime fin,
            decimal monto, decimal anticipo, string rutaArchivo,
            int idTipoContrato, int idConcepto, int idTipoOrden, string accion)
        {
            // Si viene registro existente, usar sus datos
            if (registro != null)
            {
                numContrato = registro.CON_Contrato?.ToString() ?? "";
                descripcion = registro.CON_Descripcion?.ToString() ?? "";
                idContratista = Convert.ToInt32(registro.IDContratista ?? 0);
                firma = ParseFechaSql(registro.CON_Firma);
                inicio = ParseFechaSql(registro.CON_Inicio);
                fin = ParseFechaSql(registro.CON_Final);
                monto = Convert.ToDecimal(registro.CON_Montocontratado ?? 0);
                anticipo = Convert.ToDecimal(registro.CON_montoanticipo ?? 0);
                rutaArchivo = registro.CON_RutaContrato?.ToString() ?? "";
                idTipoContrato = Convert.ToInt32(registro.IDTipocontrato ?? 0);
                idConcepto = Convert.ToInt32(registro.IDConceptocontratado ?? 0);
                idTipoOrden = Convert.ToInt32(registro.IDTipoorden ?? 0);
            }

            con.Execute(@"
                INSERT INTO TBLH_Contrato(IDObraproyecto,IDContratista,IDArea,
                    CON_Contrato,CON_Firma,CON_Descripcion,CON_Inicio,CON_Final,
                    CON_Montocontratado,CON_NoEstimacion,CON_montoanticipo,
                    CON_Diacorte,CON_RutaContrato,IDTipocontrato,
                    IDConceptocontratado,CON_Porcentaje,FechaAlta,
                    IDTipoorden,ClasificacionProyecto,FechaAccion,Accion)
                VALUES(0,@idCts,0,@num,@firma,@desc,@ini,@fin,
                    @monto,0,@anticipo,0,@ruta,@tipoC,
                    @concepto,0,@hoy,@tipoO,'contratos',@hoy,@accion)",
                new
                {
                    idCts = idContratista,
                    num = numContrato,
                    firma,
                    desc = descripcion,
                    ini = inicio,
                    fin,
                    monto,
                    anticipo,
                    ruta = rutaArchivo ?? "",
                    tipoC = idTipoContrato,
                    concepto = idConcepto,
                    hoy = DateTime.Now,
                    tipoO = idTipoOrden,
                    accion
                });
        }

        private decimal ParseDecimal(string val)
        {
            if (string.IsNullOrEmpty(val)) return 0;
            val = val.Replace(",", "");
            return decimal.TryParse(val,
                System.Globalization.NumberStyles.Any,
                System.Globalization.CultureInfo.InvariantCulture,
                out decimal result) ? result : 0;
        }

        private int ParseInt(string val)
        {
            return int.TryParse(val, out int result) ? result : 0;
        }

        private DateTime ParseFecha(string val)
        {
            if (string.IsNullOrEmpty(val)) return new DateTime(2000, 1, 1);
            return DateTime.TryParseExact(val, "dd/MM/yyyy",
                System.Globalization.CultureInfo.InvariantCulture,
                System.Globalization.DateTimeStyles.None, out DateTime result)
                ? result : new DateTime(2000, 1, 1);
        }

        private DateTime ParseFechaSql(object val)
        {
            if (val == null || val == DBNull.Value) return new DateTime(2000, 1, 1);
            return Convert.ToDateTime(val);
        }
    }
}

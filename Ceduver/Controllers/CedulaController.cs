using Ceduver.Models;
using Dapper;
using Newtonsoft.Json;
using System;
using System.Collections.Generic;
using System.Configuration;
using System.Data;
using System.Data.SqlClient;
using System.IO;
using System.Globalization;
using System.Linq;
using System.Net;
using System.Net.Http;
using System.Net.Http.Headers;
using System.Web;
using System.Web.Hosting;
using System.Threading.Tasks;
using System.Web.Http;
using OfficeOpenXml;

namespace Ceduver.Controllers
{
    [RoutePrefix("api/Cedula")]
    public class CedulaController : ApiController
    {
        private string connectionString = ConfigurationManager.ConnectionStrings["constr"].ConnectionString;
        #region Catalogos

        [HttpGet]
        [Route("GetAnios")]
        public IHttpActionResult GetAnios()
        {
            var lista = new List<dynamic>();
            using (var conn = new SqlConnection(connectionString))
            {
                conn.Open();
                var cmd = new SqlCommand("SELECT DISTINCT Anio_Ejercicio as anio FROM TBLD_añoobraproyecto ORDER BY Anio_Ejercicio DESC", conn);
                using (var reader = cmd.ExecuteReader())
                {
                    while (reader.Read())
                    {
                        lista.Add(new { anio = reader["anio"].ToString() });
                    }
                }
            }
            return Ok(lista);
        }

        [HttpGet]
        [Route("GetRubros")]
        public IHttpActionResult GetRubros()
        {
            var lista = new List<dynamic>();
            using (var conn = new SqlConnection(connectionString))
            {
                conn.Open();
                var cmd = new SqlCommand("SELECT IDRubro as idRubro, Rub_Nombre as nombre FROM TBLC_Rubros ORDER BY Rub_Nombre", conn);
                using (var reader = cmd.ExecuteReader())
                {
                    while (reader.Read())
                    {
                        lista.Add(new { idRubro = reader["idRubro"], nombre = reader["nombre"].ToString() });
                    }
                }
            }
            return Ok(lista);
        }

        [HttpGet]
        [Route("GetLocalidades")]
        public IHttpActionResult GetLocalidades()
        {
            var lista = new List<dynamic>();
            using (var conn = new SqlConnection(connectionString))
            {
                conn.Open();
                var cmd = new SqlCommand("SELECT DISTINCT CveLocalidades as clave, LCL_Nombre as nombre FROM TblD_Acciones WHERE LCL_Nombre IS NOT NULL ORDER BY LCL_Nombre", conn);
                using (var reader = cmd.ExecuteReader())
                {
                    while (reader.Read())
                    {
                        lista.Add(new { clave = reader["clave"].ToString(), nombre = reader["nombre"].ToString() });
                    }
                }
            }
            return Ok(lista);
        }

        [HttpGet]
        [Route("GetContratistas")]
        public IHttpActionResult GetContratistas()
        {
            var lista = new List<dynamic>();
            using (var conn = new SqlConnection(connectionString))
            {
                conn.Open();
                var cmd = new SqlCommand("SELECT IdContratista as idContratista, CTS_Nombre as nombre FROM TBLC_Contratistas ORDER BY CTS_Nombre", conn);
                using (var reader = cmd.ExecuteReader())
                {
                    while (reader.Read())
                    {
                        lista.Add(new { idContratista = reader["idContratista"], nombre = reader["nombre"].ToString() });
                    }
                }
            }
            return Ok(lista);
        }

        #endregion

        #region Busqueda Principal

        [HttpGet]
        [Route("BuscarCedulas")]
        public IHttpActionResult BuscarCedulas(string contrato = "", string obra = "")
        {
            var lista = new List<dynamic>();

            using (var conn = new SqlConnection(connectionString))
            {
                conn.Open();

                string sql = @"SELECT A.IDAcciones,
                              C.CON_Contrato,
                              (P.OP_NombreObra + '(' + A.AC_Accion + ')') AS nombreobra,
                              C.CON_Montocontratado,
                              A.LCL_Nombre,
                              F.archivo
                       FROM TBLP_Obraproyecto P
                       INNER JOIN TblD_Acciones A ON P.IDobraproyecto = A.IDobraproyecto
                       INNER JOIN TBLD_Contrato C ON A.IDContrato = C.IDContrato
                       LEFT JOIN TBLP_finiquito F ON A.IDAcciones = F.IDAcciones
                       WHERE P.IDobraproyecto > 0";

                // 👇 filtros dinámicos
                if (!string.IsNullOrEmpty(contrato))
                    sql += " AND C.CON_Contrato LIKE @contrato";

                if (!string.IsNullOrEmpty(obra))
                    sql += " AND (P.OP_NombreObra + '(' + A.AC_Accion + ')') LIKE @obra";

                using (var cmd = new SqlCommand(sql, conn))
                {
                    if (!string.IsNullOrEmpty(contrato))
                        cmd.Parameters.AddWithValue("@contrato", "%" + contrato + "%");

                    if (!string.IsNullOrEmpty(obra))
                        cmd.Parameters.AddWithValue("@obra", "%" + obra + "%");

                    using (var reader = cmd.ExecuteReader())
                    {
                        while (reader.Read())
                        {
                            lista.Add(new
                            {
                                idAcciones = reader["IDAcciones"],
                                numContrato = reader["CON_Contrato"],
                                nombreObra = reader["nombreobra"],
                                montoContratado = reader["CON_Montocontratado"],
                                localidad = reader["LCL_Nombre"],
                                archivoFiniquito = reader["archivo"]
                            });
                        }
                    }
                }
            }

            return Ok(lista);
        }
        #endregion

        #region Datos Encabezado

        [HttpGet]
        [Route("GetDatosEncabezado/{idAcciones}")]
        public IHttpActionResult GetDatosEncabezado(long idAcciones)
        {
            using (var conn = new SqlConnection(connectionString))
            {
                conn.Open();
                string sql = @"
                    SELECT P.IDobraproyecto, P.OP_NombreObra, P.IDRubro, R.Rub_Nombre, 
                           P.IDPrograma, S.PRO_Nombre, A.IDAcciones, C.CON_Contrato,
                           (P.OP_NombreObra + '(' + A.AC_Accion + ')') as nombreObra,
                           C.CON_Montocontratado, A.LCL_Nombre, 
                           CONVERT(varchar, C.CON_Inicio, 103) as CON_Inicio,
                           CONVERT(varchar, C.CON_Final, 103) as CON_Final,
                           A.CveLocalidades, A.AC_Descripcionaccion,
                           (SELECT TOP 1 Descripcion FROM TblD_AccionesMetas WHERE IDAcciones = A.IDAcciones) as unidad,
                           ISNULL((SELECT TOP 1 ISNULL(Cantidad, 0) FROM TblD_AccionesMetas WHERE IDAcciones = A.IDAcciones), 0) as cantidad
                    FROM TBLP_Obraproyecto P 
                    INNER JOIN TblD_Acciones A ON P.IDobraproyecto = A.IDobraproyecto
                    INNER JOIN TBLD_Contrato C ON A.IDContrato = C.IDContrato
                    INNER JOIN TBLC_Rubros R ON P.IDRubro = R.IDRubro
                    INNER JOIN TBLC_Subrubro S ON R.IDRubro = S.IDRubro
                    WHERE A.IDAcciones = @idAcciones";

                var cmd = new SqlCommand(sql, conn);
                cmd.Parameters.AddWithValue("@idAcciones", idAcciones);

                using (var reader = cmd.ExecuteReader())
                {
                    if (reader.Read())
                    {
                        // Obtener fuente de financiamiento
                        string fuenteFinanciamiento = "";
                        reader.Close();

                        var cmd2 = new SqlCommand(@"
                            SELECT F.PRF_Nombre 
                            FROM TBLD_Financiamientoinversion I 
                            INNER JOIN TblC_FuenteFinanciamiento F ON I.IDProgramafinanciamiento = F.IDFuenteFinanciamiento
                            WHERE I.IDAcciones = @idAcciones", conn);
                        cmd2.Parameters.AddWithValue("@idAcciones", idAcciones);
                        var result = cmd2.ExecuteScalar();
                        if (result != null)
                            fuenteFinanciamiento = result.ToString();

                        // Re-ejecutar query principal
                        cmd = new SqlCommand(sql, conn);
                        cmd.Parameters.AddWithValue("@idAcciones", idAcciones);
                        using (var reader2 = cmd.ExecuteReader())
                        {
                            if (reader2.Read())
                            {
                                return Ok(new
                                {
                                    idObraProyecto = Convert.ToInt64(reader2["IDobraproyecto"]),
                                    nombreObra = reader2["nombreObra"].ToString(),
                                    rubro = reader2["Rub_Nombre"].ToString(),
                                    idRubro = reader2["IDRubro"],
                                    numContrato = reader2["CON_Contrato"].ToString(),
                                    localidad = reader2["LCL_Nombre"].ToString(),
                                    montoContratado = reader2["CON_Montocontratado"] != DBNull.Value ? Convert.ToDecimal(reader2["CON_Montocontratado"]) : 0,
                                    fuenteFinanciamiento = fuenteFinanciamiento,
                                    periodoInicio = reader2["CON_Inicio"].ToString(),
                                    periodoFin = reader2["CON_Final"].ToString(),
                                    claveLocalidad = reader2["CveLocalidades"].ToString(),
                                    metaUnidad = reader2["unidad"].ToString(),
                                    metaCantidad = reader2["cantidad"].ToString(),
                                    descripcionAccion = reader2["AC_Descripcionaccion"].ToString(),
                                    idPrograma = reader2["IDPrograma"],
                                    programa = reader2["PRO_Nombre"].ToString()
                                });
                            }
                        }
                    }
                }
            }
            return Ok(new { });
        }

        #endregion


        #region Fotos Georeferencia
        [HttpGet]
        [Route("GetFotosGeoreferencia/{idAcciones}")]
        public IHttpActionResult GetFotosGeoreferencia(long idAcciones)
        {
            var lista = new List<object>();

            using (var conn = new SqlConnection(connectionString))
            {
                conn.Open();

                // Verificar si ya existen las columnas de coordenadas
                bool tieneCoords = false;
                try
                {
                    var chk = new SqlCommand(
                        "SELECT COUNT(1) FROM INFORMATION_SCHEMA.COLUMNS " +
                        "WHERE TABLE_NAME='TBLD_Fotosbasegeoreferencia' AND COLUMN_NAME='latitud'", conn);
                    tieneCoords = (int)chk.ExecuteScalar() > 0;
                }
                catch { }

                string sqlFotos = tieneCoords
                    ? @"SELECT idfotosgeo, foto, fechaalta,
                               ISNULL(latitud,'') AS latitud, ISNULL(longuitud,'') AS longuitud
                        FROM TBLD_Fotosbasegeoreferencia
                        WHERE IDAcciones = @idAcciones ORDER BY idfotosgeo DESC"
                    : @"SELECT idfotosgeo, foto, fechaalta
                        FROM TBLD_Fotosbasegeoreferencia
                        WHERE IDAcciones = @idAcciones ORDER BY idfotosgeo DESC";

                var cmd = new SqlCommand(sqlFotos, conn);
                cmd.Parameters.AddWithValue("@idAcciones", idAcciones);

                using (var reader = cmd.ExecuteReader())
                {
                    while (reader.Read())
                    {
                        lista.Add(new
                        {
                            idFoto    = reader["idfotosgeo"],
                            ruta      = reader["foto"].ToString(),
                            fechaAlta = Convert.ToDateTime(reader["fechaalta"]).ToString("dd/MM/yyyy"),
                            latitud   = tieneCoords ? reader["latitud"].ToString()   : "",
                            longitud  = tieneCoords ? reader["longuitud"].ToString() : ""
                        });
                    }
                }
            }

            return Ok(lista);
        }
        [HttpGet]
        [Route("DescargarFoto")]
        public HttpResponseMessage DescargarFoto(string ruta)
        {
            try
            {
                var path = System.Web.Hosting.HostingEnvironment.MapPath("~/" + ruta);

                if (string.IsNullOrEmpty(path) || !File.Exists(path))
                {
                    return Request.CreateResponse(HttpStatusCode.NotFound, "Archivo no encontrado");
                }

                var bytes = File.ReadAllBytes(path);

                var response = new HttpResponseMessage(HttpStatusCode.OK)
                {
                    Content = new ByteArrayContent(bytes)
                };

                response.Content.Headers.ContentDisposition =
                    new System.Net.Http.Headers.ContentDispositionHeaderValue("attachment")
                    {
                        FileName = Path.GetFileName(path)
                    };

                response.Content.Headers.ContentType =
                    new System.Net.Http.Headers.MediaTypeHeaderValue("application/octet-stream");

                return response;
            }
            catch (Exception ex)
            {
                return Request.CreateResponse(HttpStatusCode.InternalServerError, ex.Message);
            }
        }
        [HttpPost]
        [Route("SubirFotoGeoreferencia")]
        public IHttpActionResult SubirFotoGeoreferencia()
        {
            try
            {
                var httpRequest = HttpContext.Current.Request;

                if (httpRequest.Files.Count == 0)
                    return BadRequest("No se recibió ningún archivo.");

                var file      = httpRequest.Files[0];
                var idAcciones = Convert.ToInt64(httpRequest.Form["idAcciones"]);
                var idObra     = Convert.ToInt64(httpRequest.Form["idObra"]);
                var contrato   = httpRequest.Form["contrato"] ?? "";
                var latitud    = httpRequest.Form["latitud"]  ?? "";
                var longitud   = httpRequest.Form["longitud"] ?? "";

                var rutaCarpeta = "~/Uploads/Fotosgeoreferencia/";
                var path = HttpContext.Current.Server.MapPath(rutaCarpeta);

                if (!Directory.Exists(path))
                    Directory.CreateDirectory(path);

                var nombreArchivo = Guid.NewGuid().ToString() + Path.GetExtension(file.FileName);
                var rutaCompleta  = Path.Combine(path, nombreArchivo);
                file.SaveAs(rutaCompleta);

                var rutaGuardar = "Uploads/Fotosgeoreferencia/" + nombreArchivo;

                using (var conn = new SqlConnection(connectionString))
                {
                    conn.Open();

                    // Verificar si las columnas de coordenadas ya existen
                    bool tieneCoords = false;
                    try
                    {
                        var chk = new SqlCommand(
                            "SELECT COUNT(1) FROM INFORMATION_SCHEMA.COLUMNS " +
                            "WHERE TABLE_NAME='TBLD_Fotosbasegeoreferencia' AND COLUMN_NAME='latitud'", conn);
                        tieneCoords = (int)chk.ExecuteScalar() > 0;
                    }
                    catch { }

                    string sqlInsert = tieneCoords
                        ? @"INSERT INTO TBLD_Fotosbasegeoreferencia
                            (IDobraproyecto, IDAcciones, Contrato, foto, fechaalta, latitud, longuitud)
                            VALUES (@idObra, @idAcciones, @contrato, @foto, GETDATE(), @latitud, @longitud)"
                        : @"INSERT INTO TBLD_Fotosbasegeoreferencia
                            (IDobraproyecto, IDAcciones, Contrato, foto, fechaalta)
                            VALUES (@idObra, @idAcciones, @contrato, @foto, GETDATE())";

                    var cmd = new SqlCommand(sqlInsert, conn);
                    cmd.Parameters.AddWithValue("@idObra",    idObra);
                    cmd.Parameters.AddWithValue("@idAcciones", idAcciones);
                    cmd.Parameters.AddWithValue("@contrato",  contrato);
                    cmd.Parameters.AddWithValue("@foto",      rutaGuardar);
                    if (tieneCoords)
                    {
                        cmd.Parameters.AddWithValue("@latitud",  string.IsNullOrEmpty(latitud)  ? (object)DBNull.Value : latitud);
                        cmd.Parameters.AddWithValue("@longitud", string.IsNullOrEmpty(longitud) ? (object)DBNull.Value : longitud);
                    }

                    cmd.ExecuteNonQuery();
                }

                return Ok(new { mensaje = "Foto subida correctamente" });
            }
            catch (Exception ex)
            {
                return InternalServerError(ex);
            }
        }
        [HttpPost]
        [Route("EliminarFotoGeoreferencia")]
        public IHttpActionResult EliminarFotoGeoreferencia([FromBody] dynamic data)
        {
            try
            {
                long idFoto = Convert.ToInt64(data.idFoto);

                using (var conn = new SqlConnection(connectionString))
                {
                    conn.Open();

                    string ruta = "";

                    var cmdSelect = new SqlCommand(
                        "SELECT foto FROM TBLD_Fotosbasegeoreferencia WHERE idfotosgeo = @id",
                        conn
                    );
                    cmdSelect.Parameters.AddWithValue("@id", idFoto);

                    var result = cmdSelect.ExecuteScalar();
                    if (result != null)
                        ruta = result.ToString();

                    var cmdDelete = new SqlCommand(
                        "DELETE FROM TBLD_Fotosbasegeoreferencia WHERE idfotosgeo = @id",
                        conn
                    );
                    cmdDelete.Parameters.AddWithValue("@id", idFoto);
                    cmdDelete.ExecuteNonQuery();

                    if (!string.IsNullOrEmpty(ruta))
                    {
                        var path = System.Web.Hosting.HostingEnvironment.MapPath("~/" + ruta);
                        if (File.Exists(path))
                            File.Delete(path);
                    }
                }

                return Ok();
            }
            catch (Exception ex)
            {
                return InternalServerError(ex);
            }
        }
        
        #endregion


        #region Datos Inicio

        /// <summary>
        /// Devuelve los montos de cada fuente de financiamiento para precargar la Sección B.
        /// Clasifica: FISM* => fismdf; estatal => estatal; municipal => municipal; otras federales => otraFederal
        /// </summary>
        [HttpGet]
        [Route("GetMontosFuentes/{idAcciones}")]
        public IHttpActionResult GetMontosFuentes(long idAcciones)
        {
            decimal fismdf = 0, otraFederal = 0, estatal = 0, municipal = 0, otros = 0;

            using (var conn = new SqlConnection(connectionString))
            {
                conn.Open();
                var cmd = new SqlCommand(@"
                    SELECT F.PRF_Nombre, ISNULL(I.FI_Inversion, 0) AS monto
                    FROM TBLD_Financiamientoinversion I
                    INNER JOIN TblC_FuenteFinanciamiento F ON I.IDProgramafinanciamiento = F.IDFuenteFinanciamiento
                    WHERE I.IDAcciones = @idAcciones", conn);
                cmd.Parameters.AddWithValue("@idAcciones", idAcciones);

                using (var reader = cmd.ExecuteReader())
                {
                    while (reader.Read())
                    {
                        string nombre = reader["PRF_Nombre"].ToString().ToUpper().Trim();
                        decimal monto = Convert.ToDecimal(reader["monto"]);

                        if (nombre.StartsWith("FISM"))
                            fismdf += monto;
                        else if (nombre.Contains("ESTATAL"))
                            estatal += monto;
                        else if (nombre.Contains("MUNICIPAL"))
                            municipal += monto;
                        else if (nombre.Contains("FEDERAL"))
                            otraFederal += monto;
                        else
                            otros += monto;
                    }
                }
            }

            return Ok(new { fismdf, otraFederal, estatal, municipal, otros });
        }

        [HttpGet]
        [Route("GetDatosInicio/{idAcciones}")]
        public IHttpActionResult GetDatosInicio(long idAcciones)
        {
            // Verificar columnas nuevas (backward compat)
            var colsExistentes = new HashSet<string>(StringComparer.OrdinalIgnoreCase);
            using (var connCheck = new SqlConnection(connectionString))
            {
                connCheck.Open();
                var cmdCheck = new SqlCommand(@"
                    SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS
                    WHERE TABLE_NAME = 'TBLP_cedulaseguimiento'
                    AND COLUMN_NAME IN ('latitud_croquis','longuitud_croquis',
                        'latitud_foto1','longuitud_foto1','latitud_foto2','longuitud_foto2',
                        'latitud_foto3','longuitud_foto3','latitud_foto4','longuitud_foto4',
                        'supervisor','descripcion_visita')", connCheck);
                using (var r = cmdCheck.ExecuteReader())
                    while (r.Read()) colsExistentes.Add(r.GetString(0).ToLower());
            }

            using (var conn = new SqlConnection(connectionString))
            {
                conn.Open();
                var cmd = new SqlCommand(@"
                    SELECT * FROM TBLP_cedulaseguimiento
                    WHERE IDAcciones = @idAcciones AND tipo_seguimiento = 'I'", conn);
                cmd.Parameters.AddWithValue("@idAcciones", idAcciones);

                string SafeStr(System.Data.IDataReader rd, string col) =>
                    colsExistentes.Contains(col) ? rd[col]?.ToString() ?? "" : "";

                using (var reader = cmd.ExecuteReader())
                {
                    if (reader.Read())
                    {
                        return Ok(new
                        {
                            idSeguimiento = reader["idseguimiento"],
                            noAgeb = reader["noageb"].ToString(),
                            fechaVerificacion = reader["fechaverificacion"] != DBNull.Value ? Convert.ToDateTime(reader["fechaverificacion"]).ToString("dd/MM/yyyy") : "",
                            amplia = reader["amplia"] != DBNull.Value && Convert.ToBoolean(reader["amplia"]),
                            construccion = reader["construccion"] != DBNull.Value && Convert.ToBoolean(reader["construccion"]),
                            equipamiento = reader["equipamiento"] != DBNull.Value && Convert.ToBoolean(reader["equipamiento"]),
                            mantenimiento = reader["mantenimiento"] != DBNull.Value && Convert.ToBoolean(reader["mantenimiento"]),
                            rehabilitacion = reader["rehabilitacion"] != DBNull.Value && Convert.ToBoolean(reader["rehabilitacion"]),
                            directa = reader["directa"] != DBNull.Value && Convert.ToBoolean(reader["directa"]),
                            complementaria = reader["complementaria"] != DBNull.Value && Convert.ToBoolean(reader["complementaria"]),
                            coincidePlaneacion = reader["coincideplaneacion"] != DBNull.Value && Convert.ToBoolean(reader["coincideplaneacion"]),
                            descripcionNoCoincide = reader["descripcionnocoincide"].ToString(),
                            zonaAtencion = reader["zonaatencion"] != DBNull.Value && Convert.ToBoolean(reader["zonaatencion"]),
                            rezagoSocial = reader["rezagosocial"] != DBNull.Value && Convert.ToBoolean(reader["rezagosocial"]),
                            acreditacionPobreza = reader["acreditacionpobreza"] != DBNull.Value && Convert.ToBoolean(reader["acreditacionpobreza"]),
                            aportacionFismdf = reader["aportacionfismdf"] != DBNull.Value ? Convert.ToDecimal(reader["aportacionfismdf"]) : 0,
                            otraFuenteFederal = reader["otrafuentefederal"] != DBNull.Value ? Convert.ToDecimal(reader["otrafuentefederal"]) : 0,
                            fuenteEstatal = reader["fuenteestatal"] != DBNull.Value ? Convert.ToDecimal(reader["fuenteestatal"]) : 0,
                            fuenteMunicipal = reader["fuentemunicipal"] != DBNull.Value ? Convert.ToDecimal(reader["fuentemunicipal"]) : 0,
                            otros = reader["otros"] != DBNull.Value ? Convert.ToDecimal(reader["otros"]) : 0,
                            costoTotal = reader["costototal"] != DBNull.Value ? Convert.ToDecimal(reader["costototal"]) : 0,
                            coincidePlaneacionRubro = reader["coincideplaneacionrubro"] != DBNull.Value && Convert.ToBoolean(reader["coincideplaneacionrubro"]),
                            descripcionNoCoincideRubro = reader["descripcionnocoinciderubro"].ToString(),
                            latitud = reader["latitud"].ToString(),
                            longitud = reader["longuitud"].ToString(),
                            direccion = reader["direccion"].ToString(),
                            referencia = reader["referencia"].ToString(),
                            croquis = reader["croquis"].ToString(),
                            foto1 = reader["foto1"].ToString(),
                            foto2 = reader["foto2"].ToString(),
                            foto3 = reader["foto3"].ToString(),
                            foto4 = reader["foto4"].ToString(),
                            // Nuevos campos (backward compat)
                            supervisor = SafeStr(reader, "supervisor"),
                            latitudCroquis = SafeStr(reader, "latitud_croquis"),
                            longuitudCroquis = SafeStr(reader, "longuitud_croquis"),
                            latitudFoto1 = SafeStr(reader, "latitud_foto1"),
                            longuitudFoto1 = SafeStr(reader, "longuitud_foto1"),
                            latitudFoto2 = SafeStr(reader, "latitud_foto2"),
                            longuitudFoto2 = SafeStr(reader, "longuitud_foto2"),
                            latitudFoto3 = SafeStr(reader, "latitud_foto3"),
                            longuitudFoto3 = SafeStr(reader, "longuitud_foto3"),
                            latitudFoto4 = SafeStr(reader, "latitud_foto4"),
                            longuitudFoto4 = SafeStr(reader, "longuitud_foto4"),
                            descripcionVisita = SafeStr(reader, "descripcion_visita")
                        });
                    }
                }
            }
            return Ok((object)null);
        }

        [HttpPost]
        [Route("GuardarDatosInicio")]
        [AllowAnonymous] 
        public IHttpActionResult GuardarDatosInicio()
        {
            try
            {
                var httpRequest = HttpContext.Current.Request;
                var idAcciones = Convert.ToInt64(httpRequest.Form["IdAcciones"]);
                var idObraProyecto = Convert.ToInt64(httpRequest.Form["IdObraProyecto"]);
                var accionMov = httpRequest.Form["AccionMov"];

                string ruta = "Uploads/Seguimiento/";
                string rutaFisica = HttpContext.Current.Server.MapPath("~/" + ruta);
                if (!Directory.Exists(rutaFisica))
                    Directory.CreateDirectory(rutaFisica);

                long _idSeguimiento = 0;
                using (var conn = new SqlConnection(connectionString))
                {
                    conn.Open();
                    long idSeguimiento = 0;

                    // Auto-migración: crear columnas nuevas si no existen
                    var migraciones = new[]
                    {
                        "IF NOT EXISTS (SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME='TBLP_cedulaseguimiento' AND COLUMN_NAME='supervisor') ALTER TABLE TBLP_cedulaseguimiento ADD supervisor NVARCHAR(200) NULL",
                        "IF NOT EXISTS (SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME='TBLP_cedulaseguimiento' AND COLUMN_NAME='descripcion_visita') ALTER TABLE TBLP_cedulaseguimiento ADD descripcion_visita NVARCHAR(2000) NULL",
                    };
                    foreach (var m in migraciones)
                        new SqlCommand(m, conn).ExecuteNonQuery();

                    // Verificar columnas nuevas para INSERT/UPDATE dinámico
                    var colsNuevas = new HashSet<string>(StringComparer.OrdinalIgnoreCase);
                    var cmdColCheck = new SqlCommand(@"
                        SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS
                        WHERE TABLE_NAME = 'TBLP_cedulaseguimiento'
                        AND COLUMN_NAME IN ('supervisor','latitud_croquis','longuitud_croquis',
                            'latitud_foto1','longuitud_foto1','latitud_foto2','longuitud_foto2',
                            'latitud_foto3','longuitud_foto3','latitud_foto4','longuitud_foto4',
                            'descripcion_visita')", conn);
                    using (var rc = cmdColCheck.ExecuteReader())
                        while (rc.Read()) colsNuevas.Add(rc.GetString(0).ToLower());

                    if (accionMov == "A")
                    {
                        // INSERT — agregar columnas nuevas si existen
                        string extraCols = colsNuevas.Count > 0
                            ? ", " + string.Join(", ", colsNuevas.Select(c => c))
                            : "";
                        string extraVals = colsNuevas.Count > 0
                            ? ", " + string.Join(", ", colsNuevas.Select(c => "@" + ColToParam(c)))
                            : "";

                        string sql = @"
                        INSERT INTO TBLP_cedulaseguimiento(
                            IDobraproyecto, IDAcciones, estado, municipio, localidad, clavelocalidad,
                            noageb, fechaverificacion,
                            amplia, construccion, equipamiento, mantenimiento, rehabilitacion,
                            fechainicioperiodo, fechafinperiodo,
                            directa, complementaria,
                            coincideplaneacion, descripcionnocoincide,
                            opcionregular, zonaatencion, rezagosocial, acreditacionpobreza,
                            metaunidad, metacantidad,
                            idrubro, rubro, idsubrubro, subrubro,
                            coincideplaneacionrubro, descripcionnocoinciderubro,
                            aportacionfismdf, otrafuentefederal, fuenteestatal, fuentemunicipal, otros, costototal,
                            latitud, longuitud, direccion, referencia,
                            descripcionobra, tipo_seguimiento" + extraCols + @"
                        ) VALUES (
                            @idObraProyecto, @idAcciones, '07', '061', @localidad, @claveLocalidad,
                            @noAgeb, @fechaVerificacion,
                            @amplia, @construccion, @equipamiento, @mantenimiento, @rehabilitacion,
                            @periodoInicio, @periodoFin,
                            @directa, @complementaria,
                            @coincidePlaneacion, @descripcionNoCoincide,
                            @opcionRegular, @zonaAtencion, @rezagoSocial, @acreditacionPobreza,
                            @metaUnidad, @metaCantidad,
                            @idRubro, @rubro, @idSubrubro, @subrubro,
                            @coincidePlaneacionRubro, @descripcionNoCoincideRubro,
                            @aportacionFismdf, @otraFuenteFederal, @fuenteEstatal, @fuenteMunicipal, @otros, @costoTotal,
                            @latitud, @longitud, @direccion, @referencia,
                            @descripcionObra, 'I'" + extraVals + @"
                        );
                        SELECT CAST(SCOPE_IDENTITY() AS bigint);";
                        var cmd = new SqlCommand(sql, conn);
                        AgregarParametrosInicio(cmd, httpRequest, idObraProyecto, idAcciones, colsNuevas);
                        idSeguimiento = Convert.ToInt64(cmd.ExecuteScalar());
                    }
                    else
                    {
                        // UPDATE — agregar sets de columnas nuevas si existen
                        string extraSets = colsNuevas.Count > 0
                            ? ", " + string.Join(", ", colsNuevas.Select(c => c + " = @" + ColToParam(c)))
                            : "";

                        string sql = @"
                        UPDATE TBLP_cedulaseguimiento SET
                            IDobraproyecto = @idObraProyecto,
                            localidad = @localidad,
                            clavelocalidad = @claveLocalidad,
                            noageb = @noAgeb,
                            fechaverificacion = @fechaVerificacion,
                            amplia = @amplia,
                            construccion = @construccion,
                            equipamiento = @equipamiento,
                            mantenimiento = @mantenimiento,
                            rehabilitacion = @rehabilitacion,
                            fechainicioperiodo = @periodoInicio,
                            fechafinperiodo = @periodoFin,
                            directa = @directa,
                            complementaria = @complementaria,
                            coincideplaneacion = @coincidePlaneacion,
                            descripcionnocoincide = @descripcionNoCoincide,
                            opcionregular = @opcionRegular,
                            zonaatencion = @zonaAtencion,
                            rezagosocial = @rezagoSocial,
                            acreditacionpobreza = @acreditacionPobreza,
                            metaunidad = @metaUnidad,
                            metacantidad = @metaCantidad,
                            idrubro = @idRubro,
                            rubro = @rubro,
                            idsubrubro = @idSubrubro,
                            subrubro = @subrubro,
                            coincideplaneacionrubro = @coincidePlaneacionRubro,
                            descripcionnocoinciderubro = @descripcionNoCoincideRubro,
                            aportacionfismdf = @aportacionFismdf,
                            otrafuentefederal = @otraFuenteFederal,
                            fuenteestatal = @fuenteEstatal,
                            fuentemunicipal = @fuenteMunicipal,
                            otros = @otros,
                            costototal = @costoTotal,
                            latitud = @latitud,
                            longuitud = @longitud,
                            direccion = @direccion,
                            referencia = @referencia,
                            descripcionobra = @descripcionObra" + extraSets + @"
                        WHERE IDAcciones = @idAcciones AND tipo_seguimiento = 'I'";

                        var cmd = new SqlCommand(sql, conn);
                        AgregarParametrosInicio(cmd, httpRequest, idObraProyecto, idAcciones, colsNuevas);
                        cmd.ExecuteNonQuery();

                        // Obtener idSeguimiento
                        var cmdId = new SqlCommand("SELECT idseguimiento FROM TBLP_cedulaseguimiento WHERE IDAcciones = @idAcciones AND tipo_seguimiento = 'I'", conn);
                        cmdId.Parameters.AddWithValue("@idAcciones", idAcciones);
                        var result = cmdId.ExecuteScalar();
                        if (result != null)
                            idSeguimiento = Convert.ToInt64(result);
                    }

                    // Guardar fotos
                    GuardarFotoInicio(conn, httpRequest, "Croquis", "imgcroquis", "croquis", idSeguimiento, ruta, rutaFisica);
                    GuardarFotoInicio(conn, httpRequest, "Foto1", "imgfoto1", "foto1", idSeguimiento, ruta, rutaFisica);
                    GuardarFotoInicio(conn, httpRequest, "Foto2", "imgfoto2", "foto2", idSeguimiento, ruta, rutaFisica);
                    GuardarFotoInicio(conn, httpRequest, "Foto3", "imgfoto3", "foto3", idSeguimiento, ruta, rutaFisica);
                    GuardarFotoInicio(conn, httpRequest, "Foto4", "imgfoto4", "foto4", idSeguimiento, ruta, rutaFisica);

                    _idSeguimiento = idSeguimiento;
                }

                return Ok(new { success = true, idSeguimiento = _idSeguimiento });
            }
            catch (Exception ex)
            {
                return BadRequest(ex.Message);
            }
        }

        // ─── PARTIDAS INICIO ──────────────────────────────────────────────────────

        [HttpPost]
        [Route("GuardarPartidasInicio")]
        [AllowAnonymous]
        public IHttpActionResult GuardarPartidasInicio([FromBody] GuardarPartidasRequest req)
        {
            if (req == null || req.IdSeguimiento <= 0)
                return Ok(new { success = true }); // ignorar si no hay id

            try
            {
                using (var conn = new SqlConnection(connectionString))
                {
                    conn.Open();

                    // Crear tabla si no existe
                    var cmdCreate = new SqlCommand(@"
                        IF NOT EXISTS (SELECT 1 FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_NAME = 'TBLP_cedula_partidas')
                        BEGIN
                            CREATE TABLE TBLP_cedula_partidas (
                                idpartida     BIGINT IDENTITY(1,1) PRIMARY KEY,
                                idseguimiento BIGINT NOT NULL,
                                orden         INT NOT NULL DEFAULT 1,
                                descripcion   NVARCHAR(2000) NULL,
                                fechacreacion DATETIME DEFAULT GETDATE()
                            )
                        END", conn);
                    cmdCreate.ExecuteNonQuery();

                    // Borrar partidas existentes para este seguimiento y reinsertar
                    var cmdDel = new SqlCommand("DELETE FROM TBLP_cedula_partidas WHERE idseguimiento = @id", conn);
                    cmdDel.Parameters.AddWithValue("@id", req.IdSeguimiento);
                    cmdDel.ExecuteNonQuery();

                    if (req.Partidas != null)
                    {
                        foreach (var p in req.Partidas)
                        {
                            var cmdIns = new SqlCommand(@"
                                INSERT INTO TBLP_cedula_partidas (idseguimiento, orden, descripcion)
                                VALUES (@id, @orden, @desc)", conn);
                            cmdIns.Parameters.AddWithValue("@id", req.IdSeguimiento);
                            cmdIns.Parameters.AddWithValue("@orden", p.Orden);
                            cmdIns.Parameters.AddWithValue("@desc", (object)p.Descripcion ?? DBNull.Value);
                            cmdIns.ExecuteNonQuery();
                        }
                    }
                }
                return Ok(new { success = true });
            }
            catch (Exception ex)
            {
                return BadRequest(ex.Message);
            }
        }

        [HttpGet]
        [Route("GetPartidasInicio/{idSeguimiento}")]
        [AllowAnonymous]
        public IHttpActionResult GetPartidasInicio(long idSeguimiento)
        {
            try
            {
                using (var conn = new SqlConnection(connectionString))
                {
                    conn.Open();
                    // Si la tabla no existe devolver lista vacía
                    var cmdCheck = new SqlCommand(@"
                        SELECT COUNT(*) FROM INFORMATION_SCHEMA.TABLES
                        WHERE TABLE_NAME = 'TBLP_cedula_partidas'", conn);
                    if (Convert.ToInt32(cmdCheck.ExecuteScalar()) == 0)
                        return Ok(new List<object>());

                    var list = new List<object>();
                    var cmd = new SqlCommand(@"
                        SELECT idpartida, orden, descripcion
                        FROM TBLP_cedula_partidas
                        WHERE idseguimiento = @id
                        ORDER BY orden", conn);
                    cmd.Parameters.AddWithValue("@id", idSeguimiento);
                    using (var rdr = cmd.ExecuteReader())
                    {
                        while (rdr.Read())
                        {
                            list.Add(new
                            {
                                idPartida   = rdr["idpartida"],
                                orden       = rdr["orden"],
                                descripcion = rdr["descripcion"] == DBNull.Value ? "" : rdr["descripcion"].ToString()
                            });
                        }
                    }
                    return Ok(list);
                }
            }
            catch (Exception ex)
            {
                return BadRequest(ex.Message);
            }
        }

        // ─────────────────────────────────────────────────────────────────────
        // GetPartidasConFotosSeg
        // Devuelve las partidas de una acción junto con las fotos ya guardadas
        // para un seguimiento concreto (idSeguimiento=0 => partidas sin fotos).
        // ─────────────────────────────────────────────────────────────────────
        [HttpGet]
        [Route("GetPartidasConFotosSeg")]
        [AllowAnonymous]
        public IHttpActionResult GetPartidasConFotosSeg(long idAcciones, long idSeguimiento = 0)
        {
            try
            {
                var cs = ConfigurationManager.ConnectionStrings["constr"].ConnectionString;
                using (var conn = new SqlConnection(cs))
                {
                    conn.Open();

                    // Auto-crear tabla de fotos si no existe
                    const string ddl = @"
IF NOT EXISTS (SELECT 1 FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_NAME='TBLP_cedula_partidas_fotos')
CREATE TABLE TBLP_cedula_partidas_fotos (
    idfoto          BIGINT IDENTITY(1,1) PRIMARY KEY,
    idpartida       BIGINT NOT NULL,
    idseguimiento   BIGINT NOT NULL,
    numero_foto     INT NOT NULL,          -- 1 o 2
    ruta_foto       NVARCHAR(500) NULL,
    descripcion     NVARCHAR(1000) NULL,
    latitud         NVARCHAR(50)  NULL,
    longitud        NVARCHAR(50)  NULL,
    fecha_registro  DATETIME DEFAULT GETDATE()
)";
                    new SqlCommand(ddl, conn).ExecuteNonQuery();

                    // Obtener el idseguimiento del INICIO para buscar las partidas
                    // Las partidas se guardaron en TBLP_cedula_partidas con el idseguimiento del registro tipo='I'
                    long idSegInicio = 0;
                    var cmdInicio = new SqlCommand(
                        "SELECT TOP 1 idseguimiento FROM TBLP_cedulaseguimiento WHERE idacciones=@ia AND tipo_seguimiento='I'",
                        conn);
                    cmdInicio.Parameters.AddWithValue("@ia", idAcciones);
                    var objInicio = cmdInicio.ExecuteScalar();
                    if (objInicio != null && objInicio != DBNull.Value)
                        idSegInicio = Convert.ToInt64(objInicio);

                    if (idSegInicio == 0)
                    {
                        // Debug: verificar si existe algún registro de inicio para esta acción
                        var cmdDebug = new SqlCommand(
                            "SELECT COUNT(*) FROM TBLP_cedulaseguimiento WHERE IDAcciones=@ia", conn);
                        cmdDebug.Parameters.AddWithValue("@ia", idAcciones);
                        var totalReg = Convert.ToInt32(cmdDebug.ExecuteScalar());

                        var cmdDebug2 = new SqlCommand(
                            "SELECT TOP 5 idseguimiento, IDAcciones, tipo_seguimiento FROM TBLP_cedulaseguimiento WHERE IDAcciones=@ia", conn);
                        cmdDebug2.Parameters.AddWithValue("@ia", idAcciones);
                        var debugList = new System.Collections.Generic.List<string>();
                        using (var rdrD = cmdDebug2.ExecuteReader())
                            while (rdrD.Read())
                                debugList.Add("id=" + rdrD["idseguimiento"] + " acc=" + rdrD["IDAcciones"] + " tipo=" + rdrD["tipo_seguimiento"]);

                        return Ok(new {
                            sinInicio = true,
                            mensaje = "No se encontró registro tipo='I' para idAcciones=" + idAcciones + ". Total registros para esa acción: " + totalReg,
                            registros = debugList
                        });
                    }

                    // Traer partidas + fotos del seguimiento solicitado (LEFT JOIN)
                    var sql = @"
SELECT
    p.idpartida,
    p.orden,
    p.descripcion,
    f1.idfoto        AS idFoto1,
    f1.ruta_foto     AS rutaFoto1,
    f1.descripcion   AS descFoto1,
    f1.latitud       AS latFoto1,
    f1.longitud      AS lonFoto1,
    f2.idfoto        AS idFoto2,
    f2.ruta_foto     AS rutaFoto2,
    f2.descripcion   AS descFoto2,
    f2.latitud       AS latFoto2,
    f2.longitud      AS lonFoto2
FROM TBLP_cedula_partidas p
LEFT JOIN TBLP_cedula_partidas_fotos f1
       ON f1.idpartida=p.idpartida AND f1.idseguimiento=@idSeg AND f1.numero_foto=1
LEFT JOIN TBLP_cedula_partidas_fotos f2
       ON f2.idpartida=p.idpartida AND f2.idseguimiento=@idSeg AND f2.numero_foto=2
WHERE p.idseguimiento=@idSegInicio
ORDER BY p.orden";

                    var cmd = new SqlCommand(sql, conn);
                    cmd.Parameters.AddWithValue("@idSeg", idSeguimiento > 0 ? (object)idSeguimiento : DBNull.Value);
                    cmd.Parameters.AddWithValue("@idSegInicio", idSegInicio);

                    var list = new System.Collections.Generic.List<object>();
                    using (var rdr = cmd.ExecuteReader())
                    {
                        while (rdr.Read())
                        {
                            list.Add(new
                            {
                                idPartida   = rdr["idpartida"],
                                orden       = rdr["orden"],
                                descripcion = rdr["descripcion"] == DBNull.Value ? "" : rdr["descripcion"].ToString(),
                                idFoto1     = rdr["idFoto1"]   == DBNull.Value ? 0 : Convert.ToInt64(rdr["idFoto1"]),
                                rutaFoto1   = rdr["rutaFoto1"] == DBNull.Value ? "" : rdr["rutaFoto1"].ToString(),
                                descFoto1   = rdr["descFoto1"] == DBNull.Value ? "" : rdr["descFoto1"].ToString(),
                                latFoto1    = rdr["latFoto1"]  == DBNull.Value ? "" : rdr["latFoto1"].ToString(),
                                lonFoto1    = rdr["lonFoto1"]  == DBNull.Value ? "" : rdr["lonFoto1"].ToString(),
                                idFoto2     = rdr["idFoto2"]   == DBNull.Value ? 0 : Convert.ToInt64(rdr["idFoto2"]),
                                rutaFoto2   = rdr["rutaFoto2"] == DBNull.Value ? "" : rdr["rutaFoto2"].ToString(),
                                descFoto2   = rdr["descFoto2"] == DBNull.Value ? "" : rdr["descFoto2"].ToString(),
                                latFoto2    = rdr["latFoto2"]  == DBNull.Value ? "" : rdr["latFoto2"].ToString(),
                                lonFoto2    = rdr["lonFoto2"]  == DBNull.Value ? "" : rdr["lonFoto2"].ToString(),
                            });
                        }
                    }
                    return Ok(list);
                }
            }
            catch (Exception ex)
            {
                return BadRequest("GetPartidasConFotosSeg: " + ex.Message);
            }
        }

        // ─────────────────────────────────────────────────────────────────────
        // GuardarFotosPartidasSeg
        // Recibe multipart/form-data con metadatos + archivos de fotos por partida.
        // Inserta o actualiza TBLP_cedula_partidas_fotos.
        // ─────────────────────────────────────────────────────────────────────
        [HttpPost]
        [Route("GuardarFotosPartidasSeg")]
        [AllowAnonymous]
        public async Task<IHttpActionResult> GuardarFotosPartidasSeg()
        {
            try
            {
                if (!Request.Content.IsMimeMultipartContent())
                    return BadRequest("Se esperaba multipart/form-data");

                // Asegurar carpeta ANTES de instanciar el provider
                var uploadsRootPre = System.Web.Hosting.HostingEnvironment.MapPath("~/Uploads/Partidas/");
                if (!System.IO.Directory.Exists(uploadsRootPre))
                    System.IO.Directory.CreateDirectory(uploadsRootPre);

                var provider = new MultipartFormDataStreamProvider(uploadsRootPre);
                await Request.Content.ReadAsMultipartAsync(provider);

                var form = provider.FormData;
                long idSeguimiento = 0;
                long.TryParse(form["IdSeguimiento"], out idSeguimiento);
                if (idSeguimiento == 0)
                    return BadRequest("IdSeguimiento requerido");

                var cs = ConfigurationManager.ConnectionStrings["constr"].ConnectionString;
                using (var conn = new SqlConnection(cs))
                {
                    conn.Open();

                    // Asegurarse que la tabla existe
                    const string ddl = @"
IF NOT EXISTS (SELECT 1 FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_NAME='TBLP_cedula_partidas_fotos')
CREATE TABLE TBLP_cedula_partidas_fotos (
    idfoto          BIGINT IDENTITY(1,1) PRIMARY KEY,
    idpartida       BIGINT NOT NULL,
    idseguimiento   BIGINT NOT NULL,
    numero_foto     INT NOT NULL,
    ruta_foto       NVARCHAR(500) NULL,
    descripcion     NVARCHAR(1000) NULL,
    latitud         NVARCHAR(50)  NULL,
    longitud        NVARCHAR(50)  NULL,
    fecha_registro  DATETIME DEFAULT GETDATE()
)";
                    new SqlCommand(ddl, conn).ExecuteNonQuery();

                    var uploadsRoot = uploadsRootPre; // carpeta ya creada arriba

                    // Procesar partidas: Partidas[0].IdPartida, Partidas[0].Foto1Desc, etc.
                    var idx = 0;
                    while (form["Partidas[" + idx + "].IdPartida"] != null)
                    {
                        long idPartida = 0;
                        long.TryParse(form["Partidas[" + idx + "].IdPartida"], out idPartida);

                        for (int nf = 1; nf <= 2; nf++)
                        {
                            var desc = form["Partidas[" + idx + "].Foto" + nf + "Desc"] ?? "";
                            var lat  = form["Partidas[" + idx + "].Foto" + nf + "Lat"]  ?? "";
                            var lon  = form["Partidas[" + idx + "].Foto" + nf + "Lon"]  ?? "";

                            // Buscar archivo subido (clave: Partidas[idx].ArchivoFotoN)
                            string nuevaRuta = null;
                            var fileKey = "Partidas[" + idx + "].ArchivoFoto" + nf;
                            var fileData = provider.FileData.FirstOrDefault(f =>
                                f.Headers.ContentDisposition.Name.Trim('"') == fileKey);

                            if (fileData != null)
                            {
                                // Intentar obtener extensión del nombre original del archivo
                                var originalName = (fileData.Headers.ContentDisposition.FileName ?? "").Trim('"').Trim();
                                var ext = System.IO.Path.GetExtension(originalName);
                                // Si no se pudo, intentar por el Content-Type
                                if (string.IsNullOrEmpty(ext))
                                {
                                    var ct = fileData.Headers.ContentType != null ? fileData.Headers.ContentType.MediaType : "";
                                    if (ct == "image/png") ext = ".png";
                                    else if (ct == "image/gif") ext = ".gif";
                                    else if (ct == "image/webp") ext = ".webp";
                                    else ext = ".jpg"; // default jpeg
                                }
                                var nombreFinal = "p" + idPartida + "_s" + idSeguimiento + "_f" + nf
                                                  + "_" + DateTime.Now.Ticks + ext;
                                var destino = System.IO.Path.Combine(uploadsRoot, nombreFinal);
                                System.IO.File.Move(fileData.LocalFileName, destino);
                                nuevaRuta = "~/Uploads/Partidas/" + nombreFinal;
                            }

                            // ¿Ya existe registro para esta partida+seguimiento+nFoto?
                            var cmdExiste = new SqlCommand(
                                "SELECT idfoto, ruta_foto FROM TBLP_cedula_partidas_fotos WHERE idpartida=@p AND idseguimiento=@s AND numero_foto=@n",
                                conn);
                            cmdExiste.Parameters.AddWithValue("@p", idPartida);
                            cmdExiste.Parameters.AddWithValue("@s", idSeguimiento);
                            cmdExiste.Parameters.AddWithValue("@n", nf);

                            long idFotoExistente = 0;
                            string rutaExistente = null;
                            using (var rdr = cmdExiste.ExecuteReader())
                            {
                                if (rdr.Read())
                                {
                                    idFotoExistente = Convert.ToInt64(rdr["idfoto"]);
                                    rutaExistente = rdr["ruta_foto"] == DBNull.Value ? null : rdr["ruta_foto"].ToString();
                                }
                            }

                            var rutaFinal = nuevaRuta ?? rutaExistente ?? "";

                            if (idFotoExistente > 0)
                            {
                                // UPDATE — solo actualizar ruta si llegó archivo nuevo
                                var sqlUpd = nuevaRuta != null
                                    ? "UPDATE TBLP_cedula_partidas_fotos SET ruta_foto=@r, descripcion=@d, latitud=@lat, longitud=@lon WHERE idfoto=@id"
                                    : "UPDATE TBLP_cedula_partidas_fotos SET descripcion=@d, latitud=@lat, longitud=@lon WHERE idfoto=@id";
                                var cmdUpd = new SqlCommand(sqlUpd, conn);
                                if (nuevaRuta != null) cmdUpd.Parameters.AddWithValue("@r", rutaFinal);
                                cmdUpd.Parameters.AddWithValue("@d", desc);
                                cmdUpd.Parameters.AddWithValue("@lat", lat);
                                cmdUpd.Parameters.AddWithValue("@lon", lon);
                                cmdUpd.Parameters.AddWithValue("@id", idFotoExistente);
                                cmdUpd.ExecuteNonQuery();
                            }
                            else if (!string.IsNullOrEmpty(rutaFinal) || !string.IsNullOrEmpty(desc) || !string.IsNullOrEmpty(lat) || !string.IsNullOrEmpty(lon))
                            {
                                // INSERT nuevo registro
                                var cmdIns = new SqlCommand(@"
INSERT INTO TBLP_cedula_partidas_fotos (idpartida, idseguimiento, numero_foto, ruta_foto, descripcion, latitud, longitud)
VALUES (@p, @s, @n, @r, @d, @lat, @lon)", conn);
                                cmdIns.Parameters.AddWithValue("@p", idPartida);
                                cmdIns.Parameters.AddWithValue("@s", idSeguimiento);
                                cmdIns.Parameters.AddWithValue("@n", nf);
                                cmdIns.Parameters.AddWithValue("@r", string.IsNullOrEmpty(rutaFinal) ? (object)DBNull.Value : rutaFinal);
                                cmdIns.Parameters.AddWithValue("@d", desc);
                                cmdIns.Parameters.AddWithValue("@lat", lat);
                                cmdIns.Parameters.AddWithValue("@lon", lon);
                                cmdIns.ExecuteNonQuery();
                            }
                        }
                        idx++;
                    }

                    // Limpiar archivos temporales no usados
                    foreach (var fd in provider.FileData)
                    {
                        if (System.IO.File.Exists(fd.LocalFileName))
                            System.IO.File.Delete(fd.LocalFileName);
                    }
                }
                return ResponseMessage(Request.CreateResponse(
                    System.Net.HttpStatusCode.OK,
                    new { success = true },
                    Configuration.Formatters.JsonFormatter));
            }
            catch (Exception ex)
            {
                return ResponseMessage(Request.CreateResponse(
                    System.Net.HttpStatusCode.BadRequest,
                    "GuardarFotosPartidasSeg: " + ex.Message,
                    Configuration.Formatters.JsonFormatter));
            }
        }

        // ─────────────────────────────────────────────────────────────────────
        // EliminarFotoPartida
        // Elimina el registro de foto de una partida para un seguimiento.
        // ─────────────────────────────────────────────────────────────────────
        [HttpPost]
        [Route("EliminarFotoPartida")]
        [AllowAnonymous]
        public IHttpActionResult EliminarFotoPartida([FromBody] EliminarFotoPartidaRequest req)
        {
            try
            {
                var cs = ConfigurationManager.ConnectionStrings["constr"].ConnectionString;
                using (var conn = new SqlConnection(cs))
                {
                    conn.Open();
                    // Obtener ruta para borrar archivo
                    var cmdGet = new SqlCommand(
                        "SELECT ruta_foto FROM TBLP_cedula_partidas_fotos WHERE idpartida=@p AND idseguimiento=@s AND numero_foto=@n",
                        conn);
                    cmdGet.Parameters.AddWithValue("@p", req.IdPartida);
                    cmdGet.Parameters.AddWithValue("@s", req.IdSeguimiento);
                    cmdGet.Parameters.AddWithValue("@n", req.NumeroFoto);
                    var rutaObj = cmdGet.ExecuteScalar();
                    if (rutaObj != null && rutaObj != DBNull.Value)
                    {
                        var ruta = rutaObj.ToString();
                        if (ruta.StartsWith("~/"))
                        {
                            var fullPath = System.Web.Hosting.HostingEnvironment.MapPath(ruta);
                            if (System.IO.File.Exists(fullPath))
                                System.IO.File.Delete(fullPath);
                        }
                    }
                    // Eliminar registro
                    var cmdDel = new SqlCommand(
                        "DELETE FROM TBLP_cedula_partidas_fotos WHERE idpartida=@p AND idseguimiento=@s AND numero_foto=@n",
                        conn);
                    cmdDel.Parameters.AddWithValue("@p", req.IdPartida);
                    cmdDel.Parameters.AddWithValue("@s", req.IdSeguimiento);
                    cmdDel.Parameters.AddWithValue("@n", req.NumeroFoto);
                    cmdDel.ExecuteNonQuery();
                }
                return Ok(new { success = true });
            }
            catch (Exception ex)
            {
                return BadRequest("EliminarFotoPartida: " + ex.Message);
            }
        }

        // Convierte nombre de columna DB a nombre de parámetro (latitud_foto1 -> latitudFoto1)
        private static string ColToParam(string col)
        {
            // Eliminar underscores y capitalizar la siguiente letra
            var sb = new System.Text.StringBuilder();
            bool nextUp = false;
            foreach (char c in col)
            {
                if (c == '_') { nextUp = true; continue; }
                sb.Append(nextUp ? char.ToUpper(c) : c);
                nextUp = false;
            }
            return sb.ToString();
        }

        // Mapea columna DB a nombre del campo Form que envía el JS (latitud_croquis -> LatCroquis, etc.)
        private static string ColToFormKey(string col)
        {
            // latitud_croquis -> LatCroquis | longuitud_croquis -> LonCroquis | supervisor -> Supervisor
            var map = new Dictionary<string, string>(StringComparer.OrdinalIgnoreCase)
            {
                { "supervisor",         "Supervisor" },
                { "latitud_croquis",    "LatCroquis" },
                { "longuitud_croquis",  "LonCroquis" },
                { "latitud_foto1",      "LatFoto1" },
                { "longuitud_foto1",    "LonFoto1" },
                { "latitud_foto2",      "LatFoto2" },
                { "longuitud_foto2",    "LonFoto2" },
                { "latitud_foto3",      "LatFoto3" },
                { "longuitud_foto3",    "LonFoto3" },
                { "latitud_foto4",      "LatFoto4" },
                { "longuitud_foto4",    "LonFoto4" },
                { "descripcion_visita", "DescripcionVisita" }
            };
            return map.TryGetValue(col, out var v) ? v : col;
        }

        private void AgregarParametrosInicio(SqlCommand cmd, HttpRequest request, long idObraProyecto, long idAcciones,
            HashSet<string> colsNuevas = null)
        {
            cmd.Parameters.AddWithValue("@idObraProyecto", idObraProyecto);
            cmd.Parameters.AddWithValue("@idAcciones", idAcciones);
            cmd.Parameters.AddWithValue("@localidad", request.Form["Localidad"] ?? "");
            cmd.Parameters.AddWithValue("@claveLocalidad", request.Form["ClaveLocalidad"] ?? "");
            cmd.Parameters.AddWithValue("@noAgeb", request.Form["NoAgeb"] ?? "");
            cmd.Parameters.AddWithValue("@fechaVerificacion", ParseFecha(request.Form["FechaVerificacion"]));
            cmd.Parameters.AddWithValue("@amplia", request.Form["Amplia"] == "true");
            cmd.Parameters.AddWithValue("@construccion", request.Form["Construccion"] == "true");
            cmd.Parameters.AddWithValue("@equipamiento", request.Form["Equipamiento"] == "true");
            cmd.Parameters.AddWithValue("@mantenimiento", request.Form["Mantenimiento"] == "true");
            cmd.Parameters.AddWithValue("@rehabilitacion", request.Form["Rehabilitacion"] == "true");
            cmd.Parameters.AddWithValue("@periodoInicio", ParseFecha(request.Form["PeriodoInicio"]));
            cmd.Parameters.AddWithValue("@periodoFin", ParseFecha(request.Form["PeriodoFin"]));
            cmd.Parameters.AddWithValue("@directa", request.Form["Directa"] == "true");
            cmd.Parameters.AddWithValue("@complementaria", request.Form["Complementaria"] == "true");
            cmd.Parameters.AddWithValue("@metaUnidad", request.Form["MetaUnidad"] ?? "");
            cmd.Parameters.AddWithValue("@metaCantidad", ParseDecimal(request.Form["MetaCantidad"]));
            cmd.Parameters.AddWithValue("@idRubro", ParseLong(request.Form["IdRubro"]));
            cmd.Parameters.AddWithValue("@rubro", request.Form["Rubro"] ?? "");
            cmd.Parameters.AddWithValue("@idSubrubro", ParseLong(request.Form["IdSubrubro"]));
            cmd.Parameters.AddWithValue("@subrubro", request.Form["Subrubro"] ?? "");
            cmd.Parameters.AddWithValue("@aportacionFismdf", ParseDecimal(request.Form["AportacionFismdf"]));
            cmd.Parameters.AddWithValue("@otraFuenteFederal", ParseDecimal(request.Form["OtraFuenteFederal"]));
            cmd.Parameters.AddWithValue("@fuenteEstatal", ParseDecimal(request.Form["FuenteEstatal"]));
            cmd.Parameters.AddWithValue("@fuenteMunicipal", ParseDecimal(request.Form["FuenteMunicipal"]));
            cmd.Parameters.AddWithValue("@otros", ParseDecimal(request.Form["Otros"]));
            cmd.Parameters.AddWithValue("@costoTotal", ParseDecimal(request.Form["CostoTotal"]));
            cmd.Parameters.AddWithValue("@latitud", request.Form["Latitud"] ?? "");
            cmd.Parameters.AddWithValue("@longitud", request.Form["Longitud"] ?? "");
            cmd.Parameters.AddWithValue("@direccion", request.Form["Direccion"] ?? "");
            cmd.Parameters.AddWithValue("@referencia", request.Form["Referencia"] ?? "");
            cmd.Parameters.AddWithValue("@descripcionObra", request.Form["DescripcionObra"] ?? "");

            cmd.Parameters.AddWithValue("@opcionRegular", request.Form["OpcionRegular"] == "true");
            cmd.Parameters.AddWithValue("@zonaAtencion", request.Form["ZonaAtencion"] == "true");
            cmd.Parameters.AddWithValue("@rezagoSocial", request.Form["RezagoSocial"] == "true");
            cmd.Parameters.AddWithValue("@acreditacionPobreza", request.Form["AcreditacionPobreza"] == "true");
            cmd.Parameters.AddWithValue("@coincidePlaneacion", request.Form["CoincidePlaneacion"] == "true");
            cmd.Parameters.AddWithValue("@descripcionNoCoincide", request.Form["DescripcionNoCoincide"] ?? "");
            cmd.Parameters.AddWithValue("@coincidePlaneacionRubro", request.Form["CoincidePlaneacionRubro"] == "true");
            cmd.Parameters.AddWithValue("@descripcionNoCoincideRubro", request.Form["DescripcionNoCoincideRubro"] ?? "");

            // Columnas nuevas (backward compat)
            if (colsNuevas != null)
            {
                foreach (var col in colsNuevas)
                {
                    var paramName = "@" + ColToParam(col);
                    var formKey = ColToFormKey(col);
                    cmd.Parameters.AddWithValue(paramName, (object)(request.Form[formKey] ?? "") ?? DBNull.Value);
                }
            }
        }

        private void GuardarFotoInicio(SqlConnection conn, HttpRequest request, string fileKey, string imgColumn, string pathColumn, long idSeguimiento, string ruta, string rutaFisica)
        {
            // Columnas lat/lon correspondientes a este slot
            var latCol = "latitud_" + pathColumn;    // e.g. latitud_croquis, latitud_foto1
            var lonCol = "longuitud_" + pathColumn;  // e.g. longuitud_croquis, longuitud_foto1
            // Keys en el Form del JS (e.g. LatCroquis, LonFoto1)
            var slotName = char.ToUpper(fileKey[0]) + fileKey.Substring(1); // Croquis, Foto1 ...
            var latFormKey = "Lat" + slotName;
            var lonFormKey = "Lon" + slotName;
            string latVal = request.Form[latFormKey] ?? "";
            string lonVal = request.Form[lonFormKey] ?? "";

            // Verificar si existen las columnas de coordenadas
            bool tieneCoordsCol = false;
            using (var cmdChk = new SqlCommand(@"
                SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS
                WHERE TABLE_NAME = 'TBLP_cedulaseguimiento' AND COLUMN_NAME = @col", conn))
            {
                cmdChk.Parameters.AddWithValue("@col", latCol);
                tieneCoordsCol = Convert.ToInt32(cmdChk.ExecuteScalar()) > 0;
            }

            if (request.Files[fileKey] != null && request.Files[fileKey].ContentLength > 0)
            {
                var file = request.Files[fileKey];
                string fileName = Path.GetFileName(file.FileName);
                string filePath = Path.Combine(rutaFisica, fileName);
                file.SaveAs(filePath);

                byte[] fileBytes = File.ReadAllBytes(filePath);
                string rutaRelativa = ruta + fileName;

                string coordsSql = tieneCoordsCol
                    ? $", {latCol} = @latCoord, {lonCol} = @lonCoord"
                    : "";

                var cmd = new SqlCommand(
                    $"UPDATE TBLP_cedulaseguimiento SET {imgColumn} = @imagen, {pathColumn} = @ruta{coordsSql} WHERE idseguimiento = @id", conn);
                cmd.Parameters.Add(new SqlParameter("@imagen", SqlDbType.VarBinary) { Value = fileBytes });
                cmd.Parameters.AddWithValue("@ruta", rutaRelativa);
                cmd.Parameters.AddWithValue("@id", idSeguimiento);
                if (tieneCoordsCol)
                {
                    cmd.Parameters.AddWithValue("@latCoord", latVal);
                    cmd.Parameters.AddWithValue("@lonCoord", lonVal);
                }
                cmd.ExecuteNonQuery();
            }
            else if (tieneCoordsCol && (!string.IsNullOrEmpty(latVal) || !string.IsNullOrEmpty(lonVal)))
            {
                // Solo actualizar coords aunque no venga foto nueva
                var cmd = new SqlCommand(
                    $"UPDATE TBLP_cedulaseguimiento SET {latCol} = @latCoord, {lonCol} = @lonCoord WHERE idseguimiento = @id", conn);
                cmd.Parameters.AddWithValue("@latCoord", latVal);
                cmd.Parameters.AddWithValue("@lonCoord", lonVal);
                cmd.Parameters.AddWithValue("@id", idSeguimiento);
                cmd.ExecuteNonQuery();
            }
        }

        [HttpPost]
        [Route("EliminarFotoInicio")]
        public IHttpActionResult EliminarFotoInicio([FromBody] dynamic data)
        {
            try
            {
                long idSeguimiento = Convert.ToInt64(data.idSeguimiento);
                string colImg = data.colImg.ToString();
                string colRuta = data.colRuta.ToString();

                using (var conn = new SqlConnection(connectionString))
                {
                    conn.Open();

                    // Obtener ruta para borrar archivo físico
                    var cmdGet = new SqlCommand(
                        "SELECT " + colRuta + " FROM TBLP_cedulaseguimiento " +
                        "WHERE idseguimiento = @id AND tipo_seguimiento = 'I'", conn);
                    cmdGet.Parameters.AddWithValue("@id", idSeguimiento);
                    var rutaActual = cmdGet.ExecuteScalar()?.ToString();

                    if (!string.IsNullOrEmpty(rutaActual))
                    {
                        var rutaFisica = HostingEnvironment.MapPath("~/" + rutaActual);
                        if (File.Exists(rutaFisica)) File.Delete(rutaFisica);
                    }

                    // Limpiar ambas columnas
                    var cmdUpd = new SqlCommand(
                        "UPDATE TBLP_cedulaseguimiento SET " +
                        colImg + " = NULL, " + colRuta + " = NULL " +
                        "WHERE idseguimiento = @id AND tipo_seguimiento = 'I'", conn);
                    cmdUpd.Parameters.AddWithValue("@id", idSeguimiento);
                    cmdUpd.ExecuteNonQuery();
                }
                return Ok(new { success = true });
            }
            catch (Exception ex)
            {
                return InternalServerError(ex);
            }
        }
        #endregion

        #region Seguimiento

        [HttpGet]
        [Route("GetSeguimientos/{idAcciones}")]
        public IHttpActionResult GetSeguimientos(long idAcciones)
        {
            var lista = new List<dynamic>();
            using (var conn = new SqlConnection(connectionString))
            {
                conn.Open();
                var cmd = new SqlCommand(@"
                    SELECT idseguimiento, 
                           CONVERT(varchar, fechavisitaseguimiento, 103) as fechaVisita,
                           avancefisico, avancefinanciero, costototal
                    FROM TBLP_cedulaseguimiento 
                    WHERE IDAcciones = @idAcciones AND tipo_seguimiento = 'S'
                    ORDER BY idseguimiento", conn);
                cmd.Parameters.AddWithValue("@idAcciones", idAcciones);

                using (var reader = cmd.ExecuteReader())
                {
                    while (reader.Read())
                    {
                        lista.Add(new
                        {
                            idSeguimiento = Convert.ToInt64(reader["idseguimiento"]),
                            fechaVisita = reader["fechaVisita"].ToString(),
                            avanceFisico = reader["avancefisico"] != DBNull.Value ? Convert.ToDecimal(reader["avancefisico"]) : 0,
                            avanceFinanciero = reader["avancefinanciero"] != DBNull.Value ? Convert.ToDecimal(reader["avancefinanciero"]) : 0,
                            costoTotal = reader["costototal"] != DBNull.Value ? Convert.ToDecimal(reader["costototal"]) : 0
                        });
                    }
                }
            }
            return Ok(lista);
        }

        [HttpGet]
        [Route("GetSeguimientoById/{idSeguimiento}")]
        public IHttpActionResult GetSeguimientoById(long idSeguimiento)
        {
            using (var conn = new SqlConnection(connectionString))
            {
                conn.Open();
                var cmd = new SqlCommand("SELECT * FROM TBLP_cedulaseguimiento WHERE idseguimiento = @id", conn);
                cmd.Parameters.AddWithValue("@id", idSeguimiento);

                using (var reader = cmd.ExecuteReader())
                {
                    if (reader.Read())
                    {
                        return Ok(new
                        {
                            idSeguimiento = reader["idseguimiento"],
                            noAgeb = reader["noageb"].ToString(),
                            fechaVerificacion = reader["fechaverificacion"] != DBNull.Value ? Convert.ToDateTime(reader["fechaverificacion"]).ToString("dd/MM/yyyy") : "",
                            fechaVisita = reader["fechavisitaseguimiento"] != DBNull.Value ? Convert.ToDateTime(reader["fechavisitaseguimiento"]).ToString("dd/MM/yyyy") : "",
                            amplia = reader["amplia"] != DBNull.Value && Convert.ToBoolean(reader["amplia"]),
                            construccion = reader["construccion"] != DBNull.Value && Convert.ToBoolean(reader["construccion"]),
                            equipamiento = reader["equipamiento"] != DBNull.Value && Convert.ToBoolean(reader["equipamiento"]),
                            mantenimiento = reader["mantenimiento"] != DBNull.Value && Convert.ToBoolean(reader["mantenimiento"]),
                            rehabilitacion = reader["rehabilitacion"] != DBNull.Value && Convert.ToBoolean(reader["rehabilitacion"]),
                            directa = reader["directa"] != DBNull.Value && Convert.ToBoolean(reader["directa"]),
                            complementaria = reader["complementaria"] != DBNull.Value && Convert.ToBoolean(reader["complementaria"]),
                            avanceFisico = reader["avancefisico"] != DBNull.Value ? Convert.ToDecimal(reader["avancefisico"]) : 0,
                            avanceFinanciero = reader["avancefinanciero"] != DBNull.Value ? Convert.ToDecimal(reader["avancefinanciero"]) : 0,
                            catalogoConcepto = reader["catalogoconcepto"] != DBNull.Value && Convert.ToBoolean(reader["catalogoconcepto"]),
                            cambiosCatalogoConceptos = reader["cambioscatalogoconceptos"].ToString(),
                            cambiosAvanceFisico = reader["cambiosavancefisico"].ToString(),
                            aportacionFismdf = reader["aportacionfismdf"] != DBNull.Value ? Convert.ToDecimal(reader["aportacionfismdf"]) : 0,
                            otraFuenteFederal = reader["otrafuentefederal"] != DBNull.Value ? Convert.ToDecimal(reader["otrafuentefederal"]) : 0,
                            fuenteEstatal = reader["fuenteestatal"] != DBNull.Value ? Convert.ToDecimal(reader["fuenteestatal"]) : 0,
                            fuenteMunicipal = reader["fuentemunicipal"] != DBNull.Value ? Convert.ToDecimal(reader["fuentemunicipal"]) : 0,
                            otros = reader["otros"] != DBNull.Value ? Convert.ToDecimal(reader["otros"]) : 0,
                            costoTotal = reader["costototal"] != DBNull.Value ? Convert.ToDecimal(reader["costototal"]) : 0,
                            foto1 = reader["foto1"].ToString(),
                            foto2 = reader["foto2"].ToString(),
                            foto3 = reader["foto3"].ToString(),
                            foto4 = reader["foto4"].ToString(),
                            foto5 = reader["foto5"].ToString(),
                            foto6 = reader["foto6"].ToString(),
                            descripcionFoto1 = reader["descripcionfoto1"].ToString(),
                            descripcionFoto2 = reader["descripcionfoto2"].ToString(),
                            descripcionFoto3 = reader["descripcionfoto3"].ToString(),
                            descripcionFoto4 = reader["descripcionfoto4"].ToString(),
                            descripcionFoto5 = reader["descripcionfoto5"].ToString(),
                            descripcionFoto6 = reader["descripcionfoto6"].ToString()
                        });
                    }
                }
            }
            return Ok((object)null);
        }

        [HttpGet]
        [Route("GetUltimoSeguimiento/{idAcciones}")]
        public IHttpActionResult GetUltimoSeguimiento(long idAcciones)
        {
            using (var conn = new SqlConnection(connectionString))
            {
                conn.Open();

                // Trae el último seguimiento tipo 'S' o si no existe, el de inicio tipo 'I'
                var cmd = new SqlCommand(@"
            SELECT TOP 1 * 
            FROM TBLP_cedulaseguimiento 
            WHERE IDAcciones = @idAcciones 
              AND tipo_seguimiento IN ('S','I')
            ORDER BY 
                CASE tipo_seguimiento WHEN 'S' THEN 0 ELSE 1 END,
                idseguimiento DESC", conn);

                cmd.Parameters.AddWithValue("@idAcciones", idAcciones);

                using (var reader = cmd.ExecuteReader())
                {
                    if (reader.Read())
                    {
                        return Ok(new
                        {
                            noAgeb = reader["noageb"].ToString(),
                            fechaVerificacion = reader["fechaverificacion"] != DBNull.Value
                                                    ? Convert.ToDateTime(reader["fechaverificacion"]).ToString("dd/MM/yyyy")
                                                    : "",
                            amplia = reader["amplia"] != DBNull.Value && Convert.ToBoolean(reader["amplia"]),
                            construccion = reader["construccion"] != DBNull.Value && Convert.ToBoolean(reader["construccion"]),
                            equipamiento = reader["equipamiento"] != DBNull.Value && Convert.ToBoolean(reader["equipamiento"]),
                            mantenimiento = reader["mantenimiento"] != DBNull.Value && Convert.ToBoolean(reader["mantenimiento"]),
                            rehabilitacion = reader["rehabilitacion"] != DBNull.Value && Convert.ToBoolean(reader["rehabilitacion"]),
                            directa = reader["directa"] != DBNull.Value && Convert.ToBoolean(reader["directa"]),
                            complementaria = reader["complementaria"] != DBNull.Value && Convert.ToBoolean(reader["complementaria"]),
                            aportacionFismdf = reader["aportacionfismdf"] != DBNull.Value ? Convert.ToDecimal(reader["aportacionfismdf"]) : 0,
                            otraFuenteFederal = reader["otrafuentefederal"] != DBNull.Value ? Convert.ToDecimal(reader["otrafuentefederal"]) : 0,
                            fuenteEstatal = reader["fuenteestatal"] != DBNull.Value ? Convert.ToDecimal(reader["fuenteestatal"]) : 0,
                            fuenteMunicipal = reader["fuentemunicipal"] != DBNull.Value ? Convert.ToDecimal(reader["fuentemunicipal"]) : 0,
                            otros = reader["otros"] != DBNull.Value ? Convert.ToDecimal(reader["otros"]) : 0,
                            costoTotal = reader["costototal"] != DBNull.Value ? Convert.ToDecimal(reader["costototal"]) : 0
                            // NOTA: las fotos NO se incluyen a propósito (cada seguimiento lleva fotos nuevas)
                        });
                    }
                }
            }
            // Si no hay ningún registro previo, regresa null (el JS maneja este caso)
            return Ok((object)null);
        }

        [HttpPost]
        [Route("GuardarSeguimiento")]
        public IHttpActionResult GuardarSeguimiento()
        {
            try
            {
                var httpRequest = HttpContext.Current.Request;
                var idAcciones = Convert.ToInt64(httpRequest.Form["IdAcciones"]);
                var idObraProyecto = Convert.ToInt64(httpRequest.Form["IdObraProyecto"]);
                var idSeguimiento = ParseLong(httpRequest.Form["IdSeguimiento"]);
                var accionMov = httpRequest.Form["AccionMov"];

                string ruta = "Uploads/Seguimiento/";
                string rutaFisica = HttpContext.Current.Server.MapPath("~/" + ruta);
                if (!Directory.Exists(rutaFisica))
                    Directory.CreateDirectory(rutaFisica);

                using (var conn = new SqlConnection(connectionString))
                {
                    conn.Open();

                    if (accionMov == "A")
                    {
                        // INSERT
                        string sql = @"
                            INSERT INTO TBLP_cedulaseguimiento(
                                IDobraproyecto, IDAcciones, estado, municipio, localidad, clavelocalidad,
                                noageb, fechaverificacion, amplia, construccion, equipamiento, mantenimiento,
                                rehabilitacion, fechainicioperiodo, fechafinperiodo, directa, complementaria,
                                fechavisitaseguimiento, avancefisico, avancefinanciero, catalogoconcepto,
                                metaunidad, metacantidad, cambioscatalogoconceptos, cambiosavancefisico,
                                idrubro, rubro, idsubrubro, subrubro,
                                aportacionfismdf, otrafuentefederal, fuenteestatal, fuentemunicipal, otros, costototal,
                                tipo_seguimiento
                            ) VALUES (
                                @idObraProyecto, @idAcciones, '07', '061', @localidad, @claveLocalidad,
                                @noAgeb, @fechaVerificacion, @amplia, @construccion, @equipamiento, @mantenimiento,
                                @rehabilitacion, @periodoInicio, @periodoFin, @directa, @complementaria,
                                @fechaVisita, @avanceFisico, @avanceFinanciero, @catalogoConcepto,
                                @metaUnidad, @metaCantidad, @cambiosCatalogo, @cambiosAvance,
                                @idRubro, @rubro, @idSubrubro, @subrubro,
                                @aportacionFismdf, @otraFuenteFederal, @fuenteEstatal, @fuenteMunicipal, @otros, @costoTotal,
                                'S'
                            ); SELECT CAST(SCOPE_IDENTITY() AS bigint);";

                        var cmd = new SqlCommand(sql, conn);
                        AgregarParametrosSeguimiento(cmd, httpRequest, idObraProyecto, idAcciones);
                        idSeguimiento = Convert.ToInt64(cmd.ExecuteScalar());
                    }
                    else
                    {
                        // UPDATE
                        string sql = @"
                            UPDATE TBLP_cedulaseguimiento SET
                                IDobraproyecto = @idObraProyecto, localidad = @localidad, clavelocalidad = @claveLocalidad,
                                noageb = @noAgeb, fechaverificacion = @fechaVerificacion,
                                amplia = @amplia, construccion = @construccion, equipamiento = @equipamiento,
                                mantenimiento = @mantenimiento, rehabilitacion = @rehabilitacion,
                                fechainicioperiodo = @periodoInicio, fechafinperiodo = @periodoFin,
                                directa = @directa, complementaria = @complementaria,
                                fechavisitaseguimiento = @fechaVisita, avancefisico = @avanceFisico, avancefinanciero = @avanceFinanciero,
                                catalogoconcepto = @catalogoConcepto, cambioscatalogoconceptos = @cambiosCatalogo, cambiosavancefisico = @cambiosAvance,
                                metaunidad = @metaUnidad, metacantidad = @metaCantidad,
                                idrubro = @idRubro, rubro = @rubro, idsubrubro = @idSubrubro, subrubro = @subrubro,
                                aportacionfismdf = @aportacionFismdf, otrafuentefederal = @otraFuenteFederal,
                                fuenteestatal = @fuenteEstatal, fuentemunicipal = @fuenteMunicipal, otros = @otros, costototal = @costoTotal
                            WHERE idseguimiento = @idSeguimiento";

                        var cmd = new SqlCommand(sql, conn);
                        AgregarParametrosSeguimiento(cmd, httpRequest, idObraProyecto, idAcciones);
                        cmd.Parameters.AddWithValue("@idSeguimiento", idSeguimiento);
                        cmd.ExecuteNonQuery();
                    }

                    // Guardar fotos y descripciones
                    for (int i = 1; i <= 6; i++)
                    {
                        GuardarFotoSeguimiento(conn, httpRequest, "Foto" + i, "imgfoto" + i, "foto" + i, "descripcionfoto" + i, "DescripcionFoto" + i, idSeguimiento, ruta, rutaFisica);
                    }
                }

                return Ok(new { success = true, idSeguimiento = idSeguimiento });
            }
            catch (Exception ex)
            {
                return BadRequest(ex.Message);
            }
        }

        private void AgregarParametrosSeguimiento(SqlCommand cmd, HttpRequest request, long idObraProyecto, long idAcciones)
        {
            cmd.Parameters.AddWithValue("@idObraProyecto", idObraProyecto);
            cmd.Parameters.AddWithValue("@idAcciones", idAcciones);
            cmd.Parameters.AddWithValue("@localidad", request.Form["Localidad"] ?? "");
            cmd.Parameters.AddWithValue("@claveLocalidad", request.Form["ClaveLocalidad"] ?? "");
            cmd.Parameters.AddWithValue("@noAgeb", request.Form["NoAgeb"] ?? "");
            cmd.Parameters.AddWithValue("@fechaVerificacion", ParseFecha(request.Form["FechaVerificacion"]));
            cmd.Parameters.AddWithValue("@amplia", request.Form["Amplia"] == "true");
            cmd.Parameters.AddWithValue("@construccion", request.Form["Construccion"] == "true");
            cmd.Parameters.AddWithValue("@equipamiento", request.Form["Equipamiento"] == "true");
            cmd.Parameters.AddWithValue("@mantenimiento", request.Form["Mantenimiento"] == "true");
            cmd.Parameters.AddWithValue("@rehabilitacion", request.Form["Rehabilitacion"] == "true");
            cmd.Parameters.AddWithValue("@periodoInicio", ParseFecha(request.Form["PeriodoInicio"]));
            cmd.Parameters.AddWithValue("@periodoFin", ParseFecha(request.Form["PeriodoFin"]));
            cmd.Parameters.AddWithValue("@directa", request.Form["Directa"] == "true");
            cmd.Parameters.AddWithValue("@complementaria", request.Form["Complementaria"] == "true");
            cmd.Parameters.AddWithValue("@fechaVisita", ParseFecha(request.Form["FechaVisita"]));
            cmd.Parameters.AddWithValue("@avanceFisico", ParseDecimal(request.Form["AvanceFisico"]));
            cmd.Parameters.AddWithValue("@avanceFinanciero", ParseDecimal(request.Form["AvanceFinanciero"]));
            cmd.Parameters.AddWithValue("@catalogoConcepto", request.Form["CatalogoConcepto"] == "true");
            cmd.Parameters.AddWithValue("@cambiosCatalogo", request.Form["CambiosCatalogoConceptos"] ?? "");
            cmd.Parameters.AddWithValue("@cambiosAvance", request.Form["CambiosAvanceFisico"] ?? "");
            cmd.Parameters.AddWithValue("@metaUnidad", request.Form["MetaUnidad"] ?? "");
            cmd.Parameters.AddWithValue("@metaCantidad", ParseDecimal(request.Form["MetaCantidad"]));
            cmd.Parameters.AddWithValue("@idRubro", ParseLong(request.Form["IdRubro"]));
            cmd.Parameters.AddWithValue("@rubro", request.Form["Rubro"] ?? "");
            cmd.Parameters.AddWithValue("@idSubrubro", ParseLong(request.Form["IdSubrubro"]));
            cmd.Parameters.AddWithValue("@subrubro", request.Form["Subrubro"] ?? "");
            cmd.Parameters.AddWithValue("@aportacionFismdf", ParseDecimal(request.Form["AportacionFismdf"]));
            cmd.Parameters.AddWithValue("@otraFuenteFederal", ParseDecimal(request.Form["OtraFuenteFederal"]));
            cmd.Parameters.AddWithValue("@fuenteEstatal", ParseDecimal(request.Form["FuenteEstatal"]));
            cmd.Parameters.AddWithValue("@fuenteMunicipal", ParseDecimal(request.Form["FuenteMunicipal"]));
            cmd.Parameters.AddWithValue("@otros", ParseDecimal(request.Form["Otros"]));
            cmd.Parameters.AddWithValue("@costoTotal", ParseDecimal(request.Form["CostoTotal"]));
        }

        private void GuardarFotoSeguimiento(SqlConnection conn, HttpRequest request, string fileKey, string imgColumn, string pathColumn, string descColumn, string descKey, long idSeguimiento, string ruta, string rutaFisica)
        {
            string descripcion = request.Form[descKey] ?? "";

            if (request.Files[fileKey] != null && request.Files[fileKey].ContentLength > 0)
            {
                var file = request.Files[fileKey];
                string fileName = Path.GetFileName(file.FileName);
                string filePath = Path.Combine(rutaFisica, fileName);
                file.SaveAs(filePath);

                byte[] fileBytes = File.ReadAllBytes(filePath);
                string rutaRelativa = ruta + fileName;

                var cmd = new SqlCommand($"UPDATE TBLP_cedulaseguimiento SET {imgColumn} = @imagen, {pathColumn} = @ruta, {descColumn} = @desc WHERE idseguimiento = @id", conn);
                cmd.Parameters.Add(new SqlParameter("@imagen", SqlDbType.VarBinary) { Value = fileBytes });
                cmd.Parameters.AddWithValue("@ruta", rutaRelativa);
                cmd.Parameters.AddWithValue("@desc", descripcion);
                cmd.Parameters.AddWithValue("@id", idSeguimiento);
                cmd.ExecuteNonQuery();
            }
            else
            {
                // Solo actualizar descripcion
                var cmd = new SqlCommand($"UPDATE TBLP_cedulaseguimiento SET {descColumn} = @desc WHERE idseguimiento = @id", conn);
                cmd.Parameters.AddWithValue("@desc", descripcion);
                cmd.Parameters.AddWithValue("@id", idSeguimiento);
                cmd.ExecuteNonQuery();
            }
        }

        [HttpDelete]
        [Route("EliminarSeguimiento/{idSeguimiento}")]
        public IHttpActionResult EliminarSeguimiento(long idSeguimiento)
        {
            using (var conn = new SqlConnection(connectionString))
            {
                conn.Open();
                var cmd = new SqlCommand("DELETE FROM TBLP_cedulaseguimiento WHERE idseguimiento = @id AND tipo_seguimiento = 'S'", conn);
                cmd.Parameters.AddWithValue("@id", idSeguimiento);
                cmd.ExecuteNonQuery();
            }
            return Ok(new { success = true });
        }

        [HttpPost]
        [Route("EliminarFotoSeguimiento")]
        public IHttpActionResult EliminarFotoSeguimiento([FromBody] dynamic data)
        {
            try
            {
                long idSeguimiento = Convert.ToInt64(data.idSeguimiento);
                int numeroFoto = Convert.ToInt32(data.numeroFoto);
                string colImg = "imgfoto" + numeroFoto;
                string colRuta = "foto" + numeroFoto;

                using (var conn = new SqlConnection(connectionString))
                {
                    conn.Open();

                    // Obtener ruta para borrar archivo físico
                    var cmdGet = new SqlCommand(
                        "SELECT " + colRuta + " FROM TBLP_cedulaseguimiento " +
                        "WHERE idseguimiento = @id AND tipo_seguimiento = 'S'", conn);
                    cmdGet.Parameters.AddWithValue("@id", idSeguimiento);
                    var rutaActual = cmdGet.ExecuteScalar()?.ToString();

                    if (!string.IsNullOrEmpty(rutaActual))
                    {
                        var rutaFisica = HostingEnvironment.MapPath("~/" + rutaActual);
                        if (File.Exists(rutaFisica)) File.Delete(rutaFisica);
                    }

                    // Limpiar ambas columnas
                    var cmdUpd = new SqlCommand(
                        "UPDATE TBLP_cedulaseguimiento SET " +
                        colImg + " = NULL, " + colRuta + " = NULL " +
                        "WHERE idseguimiento = @id AND tipo_seguimiento = 'S'", conn);
                    cmdUpd.Parameters.AddWithValue("@id", idSeguimiento);
                    cmdUpd.ExecuteNonQuery();
                }
                return Ok(new { success = true });
            }
            catch (Exception ex)
            {
                return InternalServerError(ex);
            }
        }
        #endregion


        #region Datos Finales

        [HttpGet]
        [Route("GetDatosFinales/{idAcciones}")]
        public IHttpActionResult GetDatosFinales(long idAcciones)
        {
            using (var conn = new SqlConnection(connectionString))
            {
                conn.Open();
                var cmd = new SqlCommand("SELECT * FROM TBLP_cedulaseguimiento WHERE IDAcciones = @idAcciones AND tipo_seguimiento = 'F'", conn);
                cmd.Parameters.AddWithValue("@idAcciones", idAcciones);

                using (var reader = cmd.ExecuteReader())
                {
                    if (reader.Read())
                    {
                        return Ok(new
                        {
                            idSeguimiento = reader["idseguimiento"],
                            noAgeb = reader["noageb"].ToString(),
                            fechaVerificacion = reader["fechaverificacion"] != DBNull.Value ? Convert.ToDateTime(reader["fechaverificacion"]).ToString("dd/MM/yyyy") : "",
                            obraConcluida = reader["obraconcluida"] != DBNull.Value && Convert.ToBoolean(reader["obraconcluida"]),
                            amplia = reader["amplia"] != DBNull.Value && Convert.ToBoolean(reader["amplia"]),
                            construccion = reader["construccion"] != DBNull.Value && Convert.ToBoolean(reader["construccion"]),
                            equipamiento = reader["equipamiento"] != DBNull.Value && Convert.ToBoolean(reader["equipamiento"]),
                            mantenimiento = reader["mantenimiento"] != DBNull.Value && Convert.ToBoolean(reader["mantenimiento"]),
                            rehabilitacion = reader["rehabilitacion"] != DBNull.Value && Convert.ToBoolean(reader["rehabilitacion"]),
                            coincidePlaneacion = reader["coincideplaneacion"] != DBNull.Value && Convert.ToBoolean(reader["coincideplaneacion"]),
                            descripcionNoCoincide = reader["descripcionnocoincide"].ToString(),
                            periodoEjecucionInicio = reader["periodoejecucionrealinicio"] != DBNull.Value ? Convert.ToDateTime(reader["periodoejecucionrealinicio"]).ToString("dd/MM/yyyy") : "",
                            periodoEjecucionFinal = reader["periodoejecucionrealfinal"] != DBNull.Value ? Convert.ToDateTime(reader["periodoejecucionrealfinal"]).ToString("dd/MM/yyyy") : "",
                            catalogoConcepto = reader["catalogoconcepto"] != DBNull.Value && Convert.ToBoolean(reader["catalogoconcepto"]),
                            cambiosCatalogoConceptos = reader["cambioscatalogoconceptos"].ToString(),
                            coincidePlaneacionRubro = reader["coincideplaneacionrubro"] != DBNull.Value && Convert.ToBoolean(reader["coincideplaneacionrubro"]),
                            descripcionNoCoincideRubro = reader["descripcionnocoinciderubro"].ToString(),
                            aportacionFismdf = reader["aportacionfismdf"] != DBNull.Value ? Convert.ToDecimal(reader["aportacionfismdf"]) : 0,
                            otraFuenteFederal = reader["otrafuentefederal"] != DBNull.Value ? Convert.ToDecimal(reader["otrafuentefederal"]) : 0,
                            fuenteEstatal = reader["fuenteestatal"] != DBNull.Value ? Convert.ToDecimal(reader["fuenteestatal"]) : 0,
                            fuenteMunicipal = reader["fuentemunicipal"] != DBNull.Value ? Convert.ToDecimal(reader["fuentemunicipal"]) : 0,
                            otros = reader["otros"] != DBNull.Value ? Convert.ToDecimal(reader["otros"]) : 0,
                            costoTotal = reader["costototal"] != DBNull.Value ? Convert.ToDecimal(reader["costototal"]) : 0,
                            descripcionTrabajosRealizados = reader["descripciontrabajosrealizados"].ToString(),
                            foto1 = reader["foto1"].ToString(),
                            foto2 = reader["foto2"].ToString(),
                            foto3 = reader["foto3"].ToString(),
                            foto4 = reader["foto4"].ToString(),
                            foto5 = reader["foto5"].ToString(),
                            foto6 = reader["foto6"].ToString()
                        });
                    }
                }
            }
            return Ok((object)null);
        }

        [HttpGet]
        [Route("GetUltimoSeguimientoF/{idAcciones}")]
        public IHttpActionResult GetUltimoSeguimientoF(long idAcciones)
        {
            using (var conn = new SqlConnection(connectionString))
            {
                conn.Open();
                var cmd = new SqlCommand(@"
                    SELECT TOP 1 * FROM TBLP_cedulaseguimiento 
                    WHERE IDAcciones = @idAcciones AND tipo_seguimiento = 'S' 
                    ORDER BY idseguimiento DESC", conn);
                cmd.Parameters.AddWithValue("@idAcciones", idAcciones);

                using (var reader = cmd.ExecuteReader())
                {
                    if (reader.Read())
                    {
                        return Ok(new
                        {
                            noAgeb = reader["noageb"].ToString(),
                            amplia = reader["amplia"] != DBNull.Value && Convert.ToBoolean(reader["amplia"]),
                            construccion = reader["construccion"] != DBNull.Value && Convert.ToBoolean(reader["construccion"]),
                            equipamiento = reader["equipamiento"] != DBNull.Value && Convert.ToBoolean(reader["equipamiento"]),
                            mantenimiento = reader["mantenimiento"] != DBNull.Value && Convert.ToBoolean(reader["mantenimiento"]),
                            rehabilitacion = reader["rehabilitacion"] != DBNull.Value && Convert.ToBoolean(reader["rehabilitacion"]),
                            aportacionFismdf = reader["aportacionfismdf"] != DBNull.Value ? Convert.ToDecimal(reader["aportacionfismdf"]) : 0,
                            otraFuenteFederal = reader["otrafuentefederal"] != DBNull.Value ? Convert.ToDecimal(reader["otrafuentefederal"]) : 0,
                            fuenteEstatal = reader["fuenteestatal"] != DBNull.Value ? Convert.ToDecimal(reader["fuenteestatal"]) : 0,
                            fuenteMunicipal = reader["fuentemunicipal"] != DBNull.Value ? Convert.ToDecimal(reader["fuentemunicipal"]) : 0,
                            otros = reader["otros"] != DBNull.Value ? Convert.ToDecimal(reader["otros"]) : 0,
                            costoTotal = reader["costototal"] != DBNull.Value ? Convert.ToDecimal(reader["costototal"]) : 0
                        });
                    }
                }
            }
            return Ok((object)null);
        }

        [HttpPost]
        [Route("GuardarDatosFinales")]
        public IHttpActionResult GuardarDatosFinales()
        {
            // Implementacion similar a GuardarDatosInicio pero con tipo_seguimiento = 'F'
            // y campos adicionales como obraConcluida, periodoEjecucionRealInicio, periodoEjecucionRealFinal, etc.
            try
            {
                var httpRequest = HttpContext.Current.Request;
                var idAcciones = Convert.ToInt64(httpRequest.Form["IdAcciones"]);
                var idObraProyecto = Convert.ToInt64(httpRequest.Form["IdObraProyecto"]);
                var accionMov = httpRequest.Form["AccionMov"];

                string ruta = "Uploads/Seguimiento/";
                string rutaFisica = HttpContext.Current.Server.MapPath("~/" + ruta);
                if (!Directory.Exists(rutaFisica))
                    Directory.CreateDirectory(rutaFisica);

                using (var conn = new SqlConnection(connectionString))
                {
                    conn.Open();
                    long idSeguimiento = 0;

                    if (accionMov == "A")
                    {
                        string sql = @"
                            INSERT INTO TBLP_cedulaseguimiento(
                                IDobraproyecto, IDAcciones, estado, municipio, localidad, clavelocalidad,
                                noageb, fechaverificacion, amplia, construccion, equipamiento, mantenimiento,
                                rehabilitacion, fechainicioperiodo, fechafinperiodo, periodoejecucionrealinicio, periodoejecucionrealfinal,
                                coincideplaneacion, descripcionnocoincide, catalogoconcepto, cambioscatalogoconceptos,
                                metaunidad, metacantidad, idrubro, rubro, idsubrubro, subrubro,
                                coincideplaneacionrubro, descripcionnocoinciderubro,
                                aportacionfismdf, otrafuentefederal, fuenteestatal, fuentemunicipal, otros, costototal,
                                obraconcluida, descripciontrabajosrealizados, tipo_seguimiento
                            ) VALUES (
                                @idObraProyecto, @idAcciones, '07', '061', @localidad, @claveLocalidad,
                                @noAgeb, @fechaVerificacion, @amplia, @construccion, @equipamiento, @mantenimiento,
                                @rehabilitacion, @periodoInicio, @periodoFin, @periodoEjecInicio, @periodoEjecFinal,
                                @coincidePlaneacion, @descripcionNoCoincide, @catalogoConcepto, @cambiosCatalogo,
                                @metaUnidad, @metaCantidad, @idRubro, @rubro, @idSubrubro, @subrubro,
                                @coincideRubro, @descripcionNoCoincideRubro,
                                @aportacionFismdf, @otraFuenteFederal, @fuenteEstatal, @fuenteMunicipal, @otros, @costoTotal,
                                @obraConcluida, @descripcionTrabajos, 'F'
                            ); SELECT CAST(SCOPE_IDENTITY() AS bigint);";

                        var cmd = new SqlCommand(sql, conn);
                        AgregarParametrosFinales(cmd, httpRequest, idObraProyecto, idAcciones);
                        idSeguimiento = Convert.ToInt64(cmd.ExecuteScalar());
                    }
                    else
                    {
                        string sql = @"
                            UPDATE TBLP_cedulaseguimiento SET
                                IDobraproyecto = @idObraProyecto, localidad = @localidad, clavelocalidad = @claveLocalidad,
                                noageb = @noAgeb, fechaverificacion = @fechaVerificacion,
                                amplia = @amplia, construccion = @construccion, equipamiento = @equipamiento,
                                mantenimiento = @mantenimiento, rehabilitacion = @rehabilitacion,
                                fechainicioperiodo = @periodoInicio, fechafinperiodo = @periodoFin,
                                periodoejecucionrealinicio = @periodoEjecInicio, periodoejecucionrealfinal = @periodoEjecFinal,
                                coincideplaneacion = @coincidePlaneacion, descripcionnocoincide = @descripcionNoCoincide,
                                catalogoconcepto = @catalogoConcepto, cambioscatalogoconceptos = @cambiosCatalogo,
                                metaunidad = @metaUnidad, metacantidad = @metaCantidad,
                                idrubro = @idRubro, rubro = @rubro, idsubrubro = @idSubrubro, subrubro = @subrubro,
                                coincideplaneacionrubro = @coincideRubro, descripcionnocoinciderubro = @descripcionNoCoincideRubro,
                                aportacionfismdf = @aportacionFismdf, otrafuentefederal = @otraFuenteFederal,
                                fuenteestatal = @fuenteEstatal, fuentemunicipal = @fuenteMunicipal, otros = @otros, costototal = @costoTotal,
                                obraconcluida = @obraConcluida, descripciontrabajosrealizados = @descripcionTrabajos
                            WHERE IDAcciones = @idAcciones AND tipo_seguimiento = 'F'";

                        var cmd = new SqlCommand(sql, conn);
                        AgregarParametrosFinales(cmd, httpRequest, idObraProyecto, idAcciones);
                        cmd.ExecuteNonQuery();

                        var cmdId = new SqlCommand("SELECT idseguimiento FROM TBLP_cedulaseguimiento WHERE IDAcciones = @idAcciones AND tipo_seguimiento = 'F'", conn);
                        cmdId.Parameters.AddWithValue("@idAcciones", idAcciones);
                        var result = cmdId.ExecuteScalar();
                        if (result != null)
                            idSeguimiento = Convert.ToInt64(result);
                    }

                    // Guardar fotos
                    for (int i = 1; i <= 6; i++)
                    {
                        GuardarFotoInicio(conn, httpRequest, "Foto" + i, "imgfoto" + i, "foto" + i, idSeguimiento, ruta, rutaFisica);
                    }
                }

                return Ok(new { success = true });
            }
            catch (Exception ex)
            {
                return BadRequest(ex.Message);
            }
        }

        private void AgregarParametrosFinales(SqlCommand cmd, HttpRequest request, long idObraProyecto, long idAcciones)
        {
            cmd.Parameters.AddWithValue("@idObraProyecto", idObraProyecto);
            cmd.Parameters.AddWithValue("@idAcciones", idAcciones);
            cmd.Parameters.AddWithValue("@localidad", request.Form["Localidad"] ?? "");
            cmd.Parameters.AddWithValue("@claveLocalidad", request.Form["ClaveLocalidad"] ?? "");
            cmd.Parameters.AddWithValue("@noAgeb", request.Form["NoAgeb"] ?? "");
            cmd.Parameters.AddWithValue("@fechaVerificacion", ParseFecha(request.Form["FechaVerificacion"]));
            cmd.Parameters.AddWithValue("@obraConcluida", request.Form["ObraConcluida"] == "true");
            cmd.Parameters.AddWithValue("@amplia", request.Form["Amplia"] == "true");
            cmd.Parameters.AddWithValue("@construccion", request.Form["Construccion"] == "true");
            cmd.Parameters.AddWithValue("@equipamiento", request.Form["Equipamiento"] == "true");
            cmd.Parameters.AddWithValue("@mantenimiento", request.Form["Mantenimiento"] == "true");
            cmd.Parameters.AddWithValue("@rehabilitacion", request.Form["Rehabilitacion"] == "true");
            cmd.Parameters.AddWithValue("@periodoInicio", ParseFecha(request.Form["PeriodoInicioContrato"]));
            cmd.Parameters.AddWithValue("@periodoFin", ParseFecha(request.Form["PeriodoFinContrato"]));
            cmd.Parameters.AddWithValue("@periodoEjecInicio", ParseFecha(request.Form["PeriodoEjecucionInicio"]));
            cmd.Parameters.AddWithValue("@periodoEjecFinal", ParseFecha(request.Form["PeriodoEjecucionFinal"]));
            cmd.Parameters.AddWithValue("@coincidePlaneacion", request.Form["CoincidePlaneacion"] == "true");
            cmd.Parameters.AddWithValue("@descripcionNoCoincide", request.Form["DescripcionNoCoincide"] ?? "");
            cmd.Parameters.AddWithValue("@catalogoConcepto", request.Form["CatalogoConcepto"] == "true");
            cmd.Parameters.AddWithValue("@cambiosCatalogo", request.Form["CambiosCatalogoConceptos"] ?? "");
            cmd.Parameters.AddWithValue("@metaUnidad", request.Form["MetaUnidad"] ?? "");
            cmd.Parameters.AddWithValue("@metaCantidad", ParseDecimal(request.Form["MetaCantidad"]));
            cmd.Parameters.AddWithValue("@idRubro", ParseLong(request.Form["IdRubro"]));
            cmd.Parameters.AddWithValue("@rubro", request.Form["Rubro"] ?? "");
            cmd.Parameters.AddWithValue("@idSubrubro", ParseLong(request.Form["IdSubrubro"]));
            cmd.Parameters.AddWithValue("@subrubro", request.Form["Subrubro"] ?? "");
            cmd.Parameters.AddWithValue("@coincideRubro", request.Form["CoincidePlaneacionRubro"] == "true");
            cmd.Parameters.AddWithValue("@descripcionNoCoincideRubro", request.Form["DescripcionNoCoincideRubro"] ?? "");
            cmd.Parameters.AddWithValue("@aportacionFismdf", ParseDecimal(request.Form["AportacionFismdf"]));
            cmd.Parameters.AddWithValue("@otraFuenteFederal", ParseDecimal(request.Form["OtraFuenteFederal"]));
            cmd.Parameters.AddWithValue("@fuenteEstatal", ParseDecimal(request.Form["FuenteEstatal"]));
            cmd.Parameters.AddWithValue("@fuenteMunicipal", ParseDecimal(request.Form["FuenteMunicipal"]));
            cmd.Parameters.AddWithValue("@otros", ParseDecimal(request.Form["Otros"]));
            cmd.Parameters.AddWithValue("@costoTotal", ParseDecimal(request.Form["CostoTotal"]));
            cmd.Parameters.AddWithValue("@descripcionTrabajos", request.Form["DescripcionTrabajosRealizados"] ?? "");
        }

        [HttpPost]
        [Route("EliminarFotoFinal")]
        public IHttpActionResult EliminarFotoFinal([FromBody] dynamic data)
        {
            try
            {
                long idSeguimiento = Convert.ToInt64(data.idSeguimiento);
                int numeroFoto = Convert.ToInt32(data.numeroFoto);
                string colImg = "imgfoto" + numeroFoto;   // columna binaria
                string colRuta = "foto" + numeroFoto;   // columna ruta relativa

                using (var conn = new SqlConnection(connectionString))
                {
                    conn.Open();

                    // 1. Obtener ruta actual para borrar el archivo físico
                    var cmdGet = new SqlCommand(
                        "SELECT " + colRuta + " FROM TBLP_cedulaseguimiento " +
                        "WHERE idseguimiento = @id AND tipo_seguimiento = 'F'", conn);
                    cmdGet.Parameters.AddWithValue("@id", idSeguimiento);
                    var rutaActual = cmdGet.ExecuteScalar()?.ToString();

                    if (!string.IsNullOrEmpty(rutaActual))
                    {
                        var rutaFisica = System.Web.Hosting.HostingEnvironment.MapPath("~/" + rutaActual);
                        if (File.Exists(rutaFisica))
                            File.Delete(rutaFisica);
                    }

                    // 2. Limpiar AMBAS columnas (binaria + ruta) en la BD
                    var cmdUpd = new SqlCommand(
                        "UPDATE TBLP_cedulaseguimiento " +
                        "SET " + colImg + " = NULL, " + colRuta + " = NULL " +
                        "WHERE idseguimiento = @id AND tipo_seguimiento = 'F'", conn);
                    cmdUpd.Parameters.AddWithValue("@id", idSeguimiento);
                    cmdUpd.ExecuteNonQuery();
                }

                return Ok(new { success = true });
            }
            catch (Exception ex)
            {
                return InternalServerError(ex);
            }
        }

        #endregion

        #region Ficha FISM y Finiquito
        // Los metodos para Ficha FISM y Finiquito seguirian el mismo patron
        // GetDatosEncabezadoFism, GetFichaFism, GuardarFichaFism
        // GetDatosEncabezadoFiniquito, GetFiniquito, GuardarFiniquito, SubirArchivoFiniquito

        [HttpGet]
        [Route("GetDatosEncabezadoFism/{idAcciones}")]
        public IHttpActionResult GetDatosEncabezadoFism(long idAcciones)
        {
            return GetDatosEncabezado(idAcciones); // Reutiliza el mismo metodo
        }

        [HttpGet]
        [Route("GetFichaFism/{idAcciones}")]
        public IHttpActionResult GetFichaFism(long idAcciones)
        {
            using (var conn = new SqlConnection(connectionString))
            {
                conn.Open();
                var cmd = new SqlCommand("SELECT * FROM tblp_fichatecnicafism WHERE IDAcciones = @idAcciones", conn);
                cmd.Parameters.AddWithValue("@idAcciones", idAcciones);

                using (var reader = cmd.ExecuteReader())
                {
                    if (reader.Read())
                    {
                        return Ok(new
                        {
                            idFichaTecnica              = reader["idfichatecnica"],
                            // Financiero existente
                            inversionProgramadaFism     = reader["inversionprogramadafism"]  != DBNull.Value ? Convert.ToDecimal(reader["inversionprogramadafism"])  : 0,
                            inversionEjercidaFism       = reader["inversionejercidafism"]    != DBNull.Value ? Convert.ToDecimal(reader["inversionejercidafism"])    : 0,
                            aportacionProgramadaFism    = reader["aportacionprogramadafism"] != DBNull.Value ? Convert.ToDecimal(reader["aportacionprogramadafism"]) : 0,
                            aportacionEjercidaFism      = reader["aportacionejercidafism"]   != DBNull.Value ? Convert.ToDecimal(reader["aportacionejercidafism"])   : 0,
                            // Otros/Total financiero
                            otrosprogramado             = reader["otrosprogramado"]   != DBNull.Value ? Convert.ToDecimal(reader["otrosprogramado"])   : 0,
                            otrosejercida               = reader["otrosejercida"]     != DBNull.Value ? Convert.ToDecimal(reader["otrosejercida"])     : 0,
                            // Saldo
                            saldofism                   = reader["saldofism"]         != DBNull.Value ? Convert.ToDecimal(reader["saldofism"])         : 0,
                            aportacionfism              = reader["aportacionfism"]    != DBNull.Value ? Convert.ToDecimal(reader["aportacionfism"])    : 0,
                            otrossaldofism              = reader["otrossaldofism"]    != DBNull.Value ? Convert.ToDecimal(reader["otrossaldofism"])    : 0,
                            // Dictamen y fechas
                            dictamen                    = reader["dictamen"].ToString(),
                            programadoFechaInicial      = reader["programadofechainicial"] != DBNull.Value ? Convert.ToDateTime(reader["programadofechainicial"]).ToString("dd/MM/yyyy") : "",
                            programadoFechaFinal        = reader["programadofechafinal"]   != DBNull.Value ? Convert.ToDateTime(reader["programadofechafinal"]).ToString("dd/MM/yyyy")   : "",
                            // Convenios
                            convenioContratoImporte     = reader["conveniocontratoimporte"]    != DBNull.Value ? Convert.ToDecimal(reader["conveniocontratoimporte"])    : 0,
                            convenioContratoFechaInicio = reader["conveniocontratofechainicio"] != DBNull.Value ? Convert.ToDateTime(reader["conveniocontratofechainicio"]).ToString("dd/MM/yyyy") : "",
                            convenioContratoFechaFin    = reader["conveniocontratofechafin"]   != DBNull.Value ? Convert.ToDateTime(reader["conveniocontratofechafin"]).ToString("dd/MM/yyyy")   : "",
                            convenioDiferidoImporte     = reader["conveniodiferidoimporte"]    != DBNull.Value ? Convert.ToDecimal(reader["conveniodiferidoimporte"])    : 0,
                            convenioDiferidoFechaInicio = reader["conveniodiferidofechainicio"] != DBNull.Value ? Convert.ToDateTime(reader["conveniodiferidofechainicio"]).ToString("dd/MM/yyyy") : "",
                            convenioDiferidoFechaFin    = reader["conveniodiferidofechafin"]   != DBNull.Value ? Convert.ToDateTime(reader["conveniodiferidofechafin"]).ToString("dd/MM/yyyy")   : "",
                            ampliacionPlazoImporte      = reader["ampliacionplazoimporte"]     != DBNull.Value ? Convert.ToDecimal(reader["ampliacionplazoimporte"])     : 0,
                            ampliacionPlazoFechaInicio  = reader["ampliacionplazofechainicio"] != DBNull.Value ? Convert.ToDateTime(reader["ampliacionplazofechainicio"]).ToString("dd/MM/yyyy") : "",
                            ampliacionPlazoFechaFin     = reader["ampliacionplazofechafin"]    != DBNull.Value ? Convert.ToDateTime(reader["ampliacionplazofechafin"]).ToString("dd/MM/yyyy")    : "",
                            observaciones               = reader["observaciones"].ToString(),
                            // Oficios (nuevos)
                            oficioreg                   = reader["oficioreg"]    != DBNull.Value ? reader["oficioreg"].ToString()    : "",
                            numobramun                  = reader["numobramun"]   != DBNull.Value ? reader["numobramun"].ToString()   : "",
                            // Descripción obra FISM (nuevo)
                            descripcionobrafism         = reader["descripcionobrafism"] != DBNull.Value ? reader["descripcionobrafism"].ToString() : "",
                            // Avances (nuevos)
                            avancefisicofism            = reader["avancefisicofism"]     != DBNull.Value ? Convert.ToDecimal(reader["avancefisicofism"])     : 0,
                            avancefinancierofism        = reader["avancefinancierofism"]  != DBNull.Value ? Convert.ToDecimal(reader["avancefinancierofism"])  : 0,
                            // Fotos georeferenciadas
                            fotoinicio                  = reader["fotoinicio"]        != DBNull.Value ? reader["fotoinicio"].ToString()        : "",
                            latitudinicio               = reader["latitudinicio"]     != DBNull.Value ? reader["latitudinicio"].ToString()     : "",
                            longitudinicio              = reader["longitudinicio"]    != DBNull.Value ? reader["longitudinicio"].ToString()    : "",
                            fotointermedio              = reader["fotointermedio"]    != DBNull.Value ? reader["fotointermedio"].ToString()    : "",
                            latitudintermedio           = reader["latitudintermedio"] != DBNull.Value ? reader["latitudintermedio"].ToString() : "",
                            longitudintermedio          = reader["longitudintermedio"]!= DBNull.Value ? reader["longitudintermedio"].ToString(): "",
                            fotofinal                   = reader["fotofinal"]         != DBNull.Value ? reader["fotofinal"].ToString()         : "",
                            latitudfinal                = reader["latitudfinal"]      != DBNull.Value ? reader["latitudfinal"].ToString()      : "",
                            longitudfinal               = reader["longitudfinal"]     != DBNull.Value ? reader["longitudfinal"].ToString()     : ""
                        });
                    }
                }
            }
            return Ok((object)null);
        }

        [HttpPost]
        [Route("GuardarFichaFism")]
        public IHttpActionResult GuardarFichaFism()
        {
            var httpRequest = HttpContext.Current.Request;
            string ruta = "Uploads/Ficha/";
            string rutaFisica = HttpContext.Current.Server.MapPath("~/Uploads/Ficha/");

            try
            {
                // ── Datos del encabezado ──────────────────────────────────────
                long idAcciones     = Convert.ToInt64(httpRequest.Form["IdAcciones"]);
                long idObraProyecto = Convert.ToInt64(httpRequest.Form["IdObraProyecto"]);
                string accionMov    = httpRequest.Form["AccionMov"] ?? "A";
                long idPrograma     = 0;
                long.TryParse(httpRequest.Form["IdPrograma"], out idPrograma);

                string programa       = httpRequest.Form["Programa"]       ?? "";
                string obra           = httpRequest.Form["Obra"]           ?? "";
                string localidad      = httpRequest.Form["Localidad"]      ?? "";
                string claveLocalidad = httpRequest.Form["ClaveLocalidad"] ?? "";
                string descripcionObra= httpRequest.Form["DescripcionObra"]?? "";
                string contrato       = httpRequest.Form["Contrato"]       ?? "";
                string periodoInicio  = httpRequest.Form["PeriodoInicio"]  ?? "";
                string periodoFin     = httpRequest.Form["PeriodoFin"]     ?? "";

                // ── Financiero existente ─────────────────────────────────────
                decimal invProg   = ParseDecimal(httpRequest.Form["InversionProgramadaFism"]);
                decimal invEjer   = ParseDecimal(httpRequest.Form["InversionEjercidaFism"]);
                decimal aportProg = ParseDecimal(httpRequest.Form["AportacionProgramadaFism"]);
                decimal aportEjer = ParseDecimal(httpRequest.Form["AportacionEjercidaFism"]);
                // Otros
                decimal otrosProg = ParseDecimal(httpRequest.Form["OtrosProgramado"]);
                decimal otrosEjer = ParseDecimal(httpRequest.Form["OtrosEjercida"]);
                // Totales (calculados en JS, se almacenan por referencia)
                decimal totProg   = ParseDecimal(httpRequest.Form["TotalProgramado"]);
                decimal totEjer   = ParseDecimal(httpRequest.Form["TotalEjercida"]);
                // Saldo
                decimal saldoFism     = ParseDecimal(httpRequest.Form["SaldoFism"]);
                decimal aportFism     = ParseDecimal(httpRequest.Form["AportacionFism"]);
                decimal otrosSaldo    = ParseDecimal(httpRequest.Form["OtrosSaldoFism"]);
                decimal totalSaldo    = ParseDecimal(httpRequest.Form["TotalSaldo"]);

                string dictamen = httpRequest.Form["Dictamen"] ?? "";

                // ── Fechas ───────────────────────────────────────────────────
                DateTime fechaInicioProg = ParseFecha(httpRequest.Form["ProgramadoFechaInicial"]);
                DateTime fechaFinalProg  = ParseFecha(httpRequest.Form["ProgramadoFechaFinal"]);
                decimal  contratoImporte = ParseDecimal(httpRequest.Form["ConvenioContratoImporte"]);
                DateTime contratoFechaIni= ParseFecha(httpRequest.Form["ConvenioContratoFechaInicio"]);
                DateTime contratoFechaFin= ParseFecha(httpRequest.Form["ConvenioContratoFechaFin"]);
                decimal  difeImporte     = ParseDecimal(httpRequest.Form["ConvenioDiferidoImporte"]);
                DateTime difeFechaIni    = ParseFecha(httpRequest.Form["ConvenioDiferidoFechaInicio"]);
                DateTime difeFechaFin    = ParseFecha(httpRequest.Form["ConvenioDiferidoFechaFin"]);
                decimal  ampImporte      = ParseDecimal(httpRequest.Form["AmpliacionPlazoImporte"]);
                DateTime ampFechaIni     = ParseFecha(httpRequest.Form["AmpliacionPlazoFechaInicio"]);
                DateTime ampFechaFin     = ParseFecha(httpRequest.Form["AmpliacionPlazoFechaFin"]);
                string   observaciones   = httpRequest.Form["Observaciones"] ?? "";

                // ── Nuevos campos ────────────────────────────────────────────
                string  oficioreg           = httpRequest.Form["Oficioreg"]           ?? "";
                string  numobramun          = httpRequest.Form["Numobramun"]          ?? "";
                string  descripcionObrafism = httpRequest.Form["Descripcionobrafism"] ?? "";
                decimal avanceFisico        = ParseDecimal(httpRequest.Form["Avancefisicofism"]);
                decimal avanceFinanciero    = ParseDecimal(httpRequest.Form["Avancefinancierofism"]);
                // Coordenadas fotos
                string latInicio  = httpRequest.Form["Latitudinicio"]     ?? "";
                string lonInicio  = httpRequest.Form["Longitudinicio"]    ?? "";
                string latInterm  = httpRequest.Form["Latitudintermedio"] ?? "";
                string lonInterm  = httpRequest.Form["Longitudintermedio"]?? "";
                string latFinal   = httpRequest.Form["Latitudfinal"]      ?? "";
                string lonFinal   = httpRequest.Form["Longitudfinal"]     ?? "";

                DateTime perInicio = ParseFecha(periodoInicio);
                DateTime perFin    = ParseFecha(periodoFin);

                long idFichaTecnica = 0;

                if (!Directory.Exists(rutaFisica))
                    Directory.CreateDirectory(rutaFisica);

                using (var conn = new SqlConnection(connectionString))
                {
                    conn.Open();

                    // ── INSERT ────────────────────────────────────────────────
                    if (accionMov == "A")
                    {
                        string sql = @"
                            INSERT INTO tblp_fichatecnicafism
                            (IDobraproyecto, IDAcciones, estado, municipio,
                             localidad, clavelocalidad, idprograma, programa, obra,
                             inversionprogramadafism, aportacionprogramadafism,
                             inversionejercidafism,   aportacionejercidafism,
                             otrosprogramado, otrosejercida,
                             totalprogramado, totalejercida,
                             saldofism, aportacionfism, otrossaldofism, totalsaldo,
                             descripcionobra, contrato, dictamen,
                             periodoejecucioninicial, periodoejecucionfinal,
                             programadofechainicial,  programadofechafinal,
                             conveniocontratoimporte, conveniocontratofechainicio, conveniocontratofechafin,
                             conveniodiferidoimporte, conveniodiferidofechainicio, conveniodiferidofechafin,
                             ampliacionplazoimporte,  ampliacionplazofechainicio,  ampliacionplazofechafin,
                             observaciones,
                             oficioreg, numobramun,
                             descripcionobrafism,
                             avancefisicofism, avancefinancierofism,
                             latitudinicio,  longitudinicio,
                             latitudintermedio, longitudintermedio,
                             latitudfinal,   longitudfinal)
                            VALUES
                            (@idObra, @idAcciones, '07', '061',
                             @localidad, @claveLocalidad, @idPrograma, @programa, @obra,
                             @invProg,   @aportProg,
                             @invEjer,   @aportEjer,
                             @otrosProg, @otrosEjer,
                             @totProg,   @totEjer,
                             @saldoFism, @aportFism, @otrosSaldo, @totalSaldo,
                             @descripcion, @contrato, @dictamen,
                             @perInicio, @perFin,
                             @fechaInicioProg, @fechaFinalProg,
                             @contratoImporte, @contratoFechaIni, @contratoFechaFin,
                             @difeImporte,     @difeFechaIni,     @difeFechaFin,
                             @ampImporte,      @ampFechaIni,      @ampFechaFin,
                             @observaciones,
                             @oficioreg, @numobramun,
                             @descripcionObrafism,
                             @avanceFisico, @avanceFinanciero,
                             @latInicio,  @lonInicio,
                             @latInterm,  @lonInterm,
                             @latFinal,   @lonFinal);
                            SELECT CAST(SCOPE_IDENTITY() AS bigint);";

                        var cmd = new SqlCommand(sql, conn);
                        AgregarParamsFism(cmd, idObraProyecto, idAcciones, localidad, claveLocalidad,
                            idPrograma, programa, obra, invProg, aportProg, invEjer, aportEjer,
                            otrosProg, otrosEjer, totProg, totEjer,
                            saldoFism, aportFism, otrosSaldo, totalSaldo,
                            descripcionObra, contrato, dictamen, perInicio, perFin,
                            fechaInicioProg, fechaFinalProg,
                            contratoImporte, contratoFechaIni, contratoFechaFin,
                            difeImporte, difeFechaIni, difeFechaFin,
                            ampImporte, ampFechaIni, ampFechaFin, observaciones,
                            oficioreg, numobramun, descripcionObrafism,
                            avanceFisico, avanceFinanciero,
                            latInicio, lonInicio, latInterm, lonInterm, latFinal, lonFinal);

                        var resultado = cmd.ExecuteScalar();
                        idFichaTecnica = resultado != null ? Convert.ToInt64(resultado) : 0;
                    }
                    // ── UPDATE ────────────────────────────────────────────────
                    else
                    {
                        string sql = @"
                            UPDATE tblp_fichatecnicafism SET
                             IDobraproyecto             = @idObra,
                             IDAcciones                 = @idAcciones,
                             localidad                  = @localidad,
                             clavelocalidad             = @claveLocalidad,
                             idprograma                 = @idPrograma,
                             programa                   = @programa,
                             obra                       = @obra,
                             inversionprogramadafism    = @invProg,
                             aportacionprogramadafism   = @aportProg,
                             inversionejercidafism      = @invEjer,
                             aportacionejercidafism     = @aportEjer,
                             otrosprogramado            = @otrosProg,
                             otrosejercida              = @otrosEjer,
                             totalprogramado            = @totProg,
                             totalejercida              = @totEjer,
                             saldofism                  = @saldoFism,
                             aportacionfism             = @aportFism,
                             otrossaldofism             = @otrosSaldo,
                             totalsaldo                 = @totalSaldo,
                             descripcionobra            = @descripcion,
                             contrato                   = @contrato,
                             dictamen                   = @dictamen,
                             periodoejecucioninicial    = @perInicio,
                             periodoejecucionfinal      = @perFin,
                             programadofechainicial     = @fechaInicioProg,
                             programadofechafinal       = @fechaFinalProg,
                             conveniocontratoimporte    = @contratoImporte,
                             conveniocontratofechainicio= @contratoFechaIni,
                             conveniocontratofechafin   = @contratoFechaFin,
                             conveniodiferidoimporte    = @difeImporte,
                             conveniodiferidofechainicio= @difeFechaIni,
                             conveniodiferidofechafin   = @difeFechaFin,
                             ampliacionplazoimporte     = @ampImporte,
                             ampliacionplazofechainicio = @ampFechaIni,
                             ampliacionplazofechafin    = @ampFechaFin,
                             observaciones              = @observaciones,
                             oficioreg                  = @oficioreg,
                             numobramun                 = @numobramun,
                             descripcionobrafism        = @descripcionObrafism,
                             avancefisicofism           = @avanceFisico,
                             avancefinancierofism       = @avanceFinanciero,
                             latitudinicio              = @latInicio,
                             longitudinicio             = @lonInicio,
                             latitudintermedio          = @latInterm,
                             longitudintermedio         = @lonInterm,
                             latitudfinal               = @latFinal,
                             longitudfinal              = @lonFinal
                            WHERE IDAcciones = @idAcciones";

                        var cmd = new SqlCommand(sql, conn);
                        AgregarParamsFism(cmd, idObraProyecto, idAcciones, localidad, claveLocalidad,
                            idPrograma, programa, obra, invProg, aportProg, invEjer, aportEjer,
                            otrosProg, otrosEjer, totProg, totEjer,
                            saldoFism, aportFism, otrosSaldo, totalSaldo,
                            descripcionObra, contrato, dictamen, perInicio, perFin,
                            fechaInicioProg, fechaFinalProg,
                            contratoImporte, contratoFechaIni, contratoFechaFin,
                            difeImporte, difeFechaIni, difeFechaFin,
                            ampImporte, ampFechaIni, ampFechaFin, observaciones,
                            oficioreg, numobramun, descripcionObrafism,
                            avanceFisico, avanceFinanciero,
                            latInicio, lonInicio, latInterm, lonInterm, latFinal, lonFinal);
                        cmd.ExecuteNonQuery();

                        var cmdId = new SqlCommand(
                            "SELECT idfichatecnica FROM tblp_fichatecnicafism WHERE IDAcciones = @idAcciones", conn);
                        cmdId.Parameters.AddWithValue("@idAcciones", idAcciones);
                        var res = cmdId.ExecuteScalar();
                        idFichaTecnica = res != null ? Convert.ToInt64(res) : 0;
                    }

                    // ── Guardar 3 fotos georeferenciadas ─────────────────────
                    if (idFichaTecnica > 0)
                    {
                        GuardarFotoFism(conn, httpRequest, "FotoInicio",    "imgfotoinicio",    "fotoinicio",    idFichaTecnica, ruta, rutaFisica);
                        GuardarFotoFism(conn, httpRequest, "FotoIntermedio","imgfotointermedio","fotointermedio",idFichaTecnica, ruta, rutaFisica);
                        GuardarFotoFism(conn, httpRequest, "FotoFinal",     "imgfotofinal",     "fotofinal",     idFichaTecnica, ruta, rutaFisica);
                    }
                }

                return Ok(new { success = true, message = accionMov == "A" ? "Registro agregado correctamente" : "Registro actualizado correctamente" });
            }
            catch (Exception ex)
            {
                return BadRequest("Error al guardar Ficha FISM: " + ex.Message);
            }
        }

        // ── Helper: agrega todos los parámetros a un SqlCommand de Ficha FISM ────────
        private static void AgregarParamsFism(SqlCommand cmd,
            long idObra, long idAcciones, string localidad, string claveLocalidad,
            long idPrograma, string programa, string obra,
            decimal invProg, decimal aportProg, decimal invEjer, decimal aportEjer,
            decimal otrosProg, decimal otrosEjer, decimal totProg, decimal totEjer,
            decimal saldoFism, decimal aportFism, decimal otrosSaldo, decimal totalSaldo,
            string descripcion, string contrato, string dictamen,
            DateTime perInicio, DateTime perFin,
            DateTime fechaInicioProg, DateTime fechaFinalProg,
            decimal contratoImporte, DateTime contratoFechaIni, DateTime contratoFechaFin,
            decimal difeImporte, DateTime difeFechaIni, DateTime difeFechaFin,
            decimal ampImporte, DateTime ampFechaIni, DateTime ampFechaFin,
            string observaciones,
            string oficioreg, string numobramun, string descripcionObrafism,
            decimal avanceFisico, decimal avanceFinanciero,
            string latInicio, string lonInicio, string latInterm, string lonInterm,
            string latFinal, string lonFinal)
        {
            cmd.Parameters.AddWithValue("@idObra",            idObra);
            cmd.Parameters.AddWithValue("@idAcciones",        idAcciones);
            cmd.Parameters.AddWithValue("@localidad",         localidad);
            cmd.Parameters.AddWithValue("@claveLocalidad",    claveLocalidad);
            cmd.Parameters.AddWithValue("@idPrograma",        idPrograma);
            cmd.Parameters.AddWithValue("@programa",          programa);
            cmd.Parameters.AddWithValue("@obra",              obra);
            cmd.Parameters.AddWithValue("@invProg",           invProg);
            cmd.Parameters.AddWithValue("@aportProg",         aportProg);
            cmd.Parameters.AddWithValue("@invEjer",           invEjer);
            cmd.Parameters.AddWithValue("@aportEjer",         aportEjer);
            cmd.Parameters.AddWithValue("@otrosProg",         otrosProg);
            cmd.Parameters.AddWithValue("@otrosEjer",         otrosEjer);
            cmd.Parameters.AddWithValue("@totProg",           totProg);
            cmd.Parameters.AddWithValue("@totEjer",           totEjer);
            cmd.Parameters.AddWithValue("@saldoFism",         saldoFism);
            cmd.Parameters.AddWithValue("@aportFism",         aportFism);
            cmd.Parameters.AddWithValue("@otrosSaldo",        otrosSaldo);
            cmd.Parameters.AddWithValue("@totalSaldo",        totalSaldo);
            cmd.Parameters.AddWithValue("@descripcion",       descripcion);
            cmd.Parameters.AddWithValue("@contrato",          contrato);
            cmd.Parameters.AddWithValue("@dictamen",          dictamen);
            cmd.Parameters.AddWithValue("@perInicio",         perInicio);
            cmd.Parameters.AddWithValue("@perFin",            perFin);
            cmd.Parameters.AddWithValue("@fechaInicioProg",   fechaInicioProg);
            cmd.Parameters.AddWithValue("@fechaFinalProg",    fechaFinalProg);
            cmd.Parameters.AddWithValue("@contratoImporte",   contratoImporte);
            cmd.Parameters.AddWithValue("@contratoFechaIni",  contratoFechaIni);
            cmd.Parameters.AddWithValue("@contratoFechaFin",  contratoFechaFin);
            cmd.Parameters.AddWithValue("@difeImporte",       difeImporte);
            cmd.Parameters.AddWithValue("@difeFechaIni",      difeFechaIni);
            cmd.Parameters.AddWithValue("@difeFechaFin",      difeFechaFin);
            cmd.Parameters.AddWithValue("@ampImporte",        ampImporte);
            cmd.Parameters.AddWithValue("@ampFechaIni",       ampFechaIni);
            cmd.Parameters.AddWithValue("@ampFechaFin",       ampFechaFin);
            cmd.Parameters.AddWithValue("@observaciones",     observaciones);
            cmd.Parameters.AddWithValue("@oficioreg",         oficioreg);
            cmd.Parameters.AddWithValue("@numobramun",        numobramun);
            cmd.Parameters.AddWithValue("@descripcionObrafism", descripcionObrafism);
            cmd.Parameters.AddWithValue("@avanceFisico",      avanceFisico);
            cmd.Parameters.AddWithValue("@avanceFinanciero",  avanceFinanciero);
            cmd.Parameters.AddWithValue("@latInicio",         latInicio);
            cmd.Parameters.AddWithValue("@lonInicio",         lonInicio);
            cmd.Parameters.AddWithValue("@latInterm",         latInterm);
            cmd.Parameters.AddWithValue("@lonInterm",         lonInterm);
            cmd.Parameters.AddWithValue("@latFinal",          latFinal);
            cmd.Parameters.AddWithValue("@lonFinal",          lonFinal);
        }

        // ── Helper: guarda foto en disco y actualiza columna imgfoto/foto ────────────
        private void GuardarFotoFism(SqlConnection conn, HttpRequest request,
            string fileKey, string imgColumn, string pathColumn,
            long idFichaTecnica, string ruta, string rutaFisica)
        {
            var file = request.Files[fileKey];
            if (file == null || file.ContentLength == 0) return;

            string ext        = Path.GetExtension(file.FileName);
            string nombreArch = Path.GetFileNameWithoutExtension(file.FileName)
                                + "_" + DateTime.Now.ToString("yyyyMMddHHmmss") + ext;
            string rutaRelativa = ruta + nombreArch;
            string rutaCompleta = Path.Combine(rutaFisica, nombreArch);

            if (File.Exists(rutaCompleta))
                File.Delete(rutaCompleta);

            file.SaveAs(rutaCompleta);
            byte[] bytes = File.ReadAllBytes(rutaCompleta);

            var cmd = new SqlCommand(
                $"UPDATE tblp_fichatecnicafism SET {imgColumn} = @img, {pathColumn} = @ruta WHERE idfichatecnica = @id",
                conn);
            cmd.Parameters.Add(new SqlParameter("@img", SqlDbType.VarBinary, -1) { Value = bytes });
            cmd.Parameters.AddWithValue("@ruta", rutaRelativa);
            cmd.Parameters.AddWithValue("@id",   idFichaTecnica);
            cmd.ExecuteNonQuery();
        }

        // ── Eliminar foto georeferenciada FISM (inicio / intermedio / final) ─────────
        [HttpPost]
        [Route("EliminarFotoFism")]
        public IHttpActionResult EliminarFotoFism([FromBody] dynamic data)
        {
            try
            {
                long idFicha      = Convert.ToInt64(data.idFichaTecnica);
                string columnaImg  = (string)data.columnaImg;   // "imgfotoinicio" | "imgfotointermedio" | "imgfotofinal"
                string columnaPath = (string)data.columnaPath;  // "fotoinicio"    | "fotointermedio"    | "fotofinal"

                var permitidos = new[] { "imgfotoinicio", "imgfotointermedio", "imgfotofinal" };
                if (!Array.Exists(permitidos, p => p == columnaImg))
                    return BadRequest("Columna no permitida");

                using (var conn = new SqlConnection(connectionString))
                {
                    conn.Open();

                    var cmdSel = new SqlCommand(
                        $"SELECT {columnaPath} FROM tblp_fichatecnicafism WHERE idfichatecnica = @id", conn);
                    cmdSel.Parameters.AddWithValue("@id", idFicha);
                    var rutaActual = cmdSel.ExecuteScalar()?.ToString() ?? "";

                    var cmdUpd = new SqlCommand(
                        $"UPDATE tblp_fichatecnicafism SET {columnaImg} = NULL, {columnaPath} = '' WHERE idfichatecnica = @id", conn);
                    cmdUpd.Parameters.AddWithValue("@id", idFicha);
                    cmdUpd.ExecuteNonQuery();

                    if (!string.IsNullOrEmpty(rutaActual))
                    {
                        var pathFisico = System.Web.Hosting.HostingEnvironment.MapPath("~/" + rutaActual);
                        if (File.Exists(pathFisico))
                            File.Delete(pathFisico);
                    }
                }
                return Ok(new { success = true });
            }
            catch (Exception ex)
            {
                return BadRequest("Error al eliminar foto FISM: " + ex.Message);
            }
        }

        [HttpGet]
        [Route("GetDatosEncabezadoFiniquito/{idAcciones}")]
        public IHttpActionResult GetDatosEncabezadoFiniquito(long idAcciones)
        {
            using (var conn = new SqlConnection(connectionString))
            {
                conn.Open();
                string sql = @"
                    SELECT P.IDobraproyecto, A.IDAcciones, A.LCL_Nombre, P.OP_Num_obra, A.AC_Accion as nombreObra,
                           ISNULL((SELECT TOP 1 FF.PRF_Nombre FROM TBLD_Financiamientoinversion F 
                                   INNER JOIN TblC_FuenteFinanciamiento FF ON F.IDProgramafinanciamiento = FF.IDFuenteFinanciamiento 
                                   WHERE F.IDAcciones = @idAcciones), '') as fuenteFinanciamiento,
                           ISNULL((SELECT TOP 1 FI_Inversion FROM TBLD_Financiamientoinversion WHERE IDAcciones = @idAcciones), 0) as montoFuente,
                           C.CON_Contrato, C.CON_Montocontratado, 
                           CONVERT(varchar, C.CON_Inicio, 103) as CON_Inicio,
                           CONVERT(varchar, C.CON_Final, 103) as CON_Final,
                           A.CveLocalidades, A.AC_Descripcionaccion, CC.CTS_Nombre as contratista
                    FROM TBLP_Obraproyecto P 
                    INNER JOIN TblD_Acciones A ON P.IDobraproyecto = A.IDobraproyecto
                    LEFT OUTER JOIN TBLD_Contrato C ON A.IDContrato = C.IDContrato
                    LEFT OUTER JOIN TBLC_Contratistas CC ON C.IDContratista = CC.IdContratista
                    WHERE A.IDAcciones = @idAcciones";

                var cmd = new SqlCommand(sql, conn);
                cmd.Parameters.AddWithValue("@idAcciones", idAcciones);

                using (var reader = cmd.ExecuteReader())
                {
                    if (reader.Read())
                    {
                        return Ok(new
                        {
                            idObraProyecto = Convert.ToInt64(reader["IDobraproyecto"]),
                            nombreObra = reader["nombreObra"].ToString(),
                            localidad = reader["LCL_Nombre"].ToString(),
                            numObra = reader["OP_Num_obra"].ToString(),
                            numContrato = reader["CON_Contrato"].ToString(),
                            contratista = reader["contratista"].ToString(),
                            descripcionAccion = reader["AC_Descripcionaccion"].ToString(),
                            periodoInicio = reader["CON_Inicio"].ToString(),
                            periodoFin = reader["CON_Final"].ToString(),
                            fuenteFinanciamiento = reader["fuenteFinanciamiento"].ToString(),
                            montoFuente = reader["montoFuente"] != DBNull.Value ? Convert.ToDecimal(reader["montoFuente"]) : 0
                        });
                    }
                }
            }
            return Ok(new { });
        }

        [HttpGet]
        [Route("GetFiniquito/{idAcciones}")]
        public IHttpActionResult GetFiniquito(long idAcciones)
        {
            using (var conn = new SqlConnection(connectionString))
            {
                conn.Open();
                var cmd = new SqlCommand(@"
                    SELECT idfiniquito, programa, subprograma, montofuente, devengado, 
                           latitud, longuitud, 
                           CONVERT(varchar, programadoinicio, 103) as programadoinicio,
                           CONVERT(varchar, realtermino, 103) as realtermino,
                           financiero, descripcionobra, observaciones
                    FROM TBLP_finiquito WHERE IDAcciones = @idAcciones", conn);
                cmd.Parameters.AddWithValue("@idAcciones", idAcciones);

                using (var reader = cmd.ExecuteReader())
                {
                    if (reader.Read())
                    {
                        return Ok(new
                        {
                            idFiniquito = reader["idfiniquito"],
                            programa = reader["programa"].ToString(),
                            subprograma = reader["subprograma"].ToString(),
                            montoFuente = reader["montofuente"] != DBNull.Value ? Convert.ToDecimal(reader["montofuente"]) : 0,
                            devengado = reader["devengado"] != DBNull.Value ? Convert.ToDecimal(reader["devengado"]) : 0,
                            latitud = reader["latitud"].ToString(),
                            longitud = reader["longuitud"].ToString(),
                            programadoInicio = reader["programadoinicio"].ToString(),
                            realTermino = reader["realtermino"].ToString(),
                            financiero = reader["financiero"] != DBNull.Value ? Convert.ToDecimal(reader["financiero"]) : 0,
                            descripcionObra = reader["descripcionobra"].ToString(),
                            observaciones = reader["observaciones"].ToString()
                        });
                    }
                }
            }
            return Ok((object)null);
        }

        [HttpGet]
        [Route("GetDatosInicioParaFiniquito/{idAcciones}")]
        public IHttpActionResult GetDatosInicioParaFiniquito(long idAcciones)
        {
            using (var conn = new SqlConnection(connectionString))
            {
                conn.Open();
                var cmd = new SqlCommand("SELECT latitud, longuitud FROM TBLP_cedulaseguimiento WHERE IDAcciones = @idAcciones AND tipo_seguimiento = 'I'", conn);
                cmd.Parameters.AddWithValue("@idAcciones", idAcciones);

                using (var reader = cmd.ExecuteReader())
                {
                    if (reader.Read())
                    {
                        return Ok(new
                        {
                            latitud = reader["latitud"].ToString(),
                            longitud = reader["longuitud"].ToString()
                        });
                    }
                }
            }
            return Ok((object)null);
        }

        [HttpGet]
        [Route("GetDatosFinalParaFiniquito/{idAcciones}")]
        public IHttpActionResult GetDatosFinalParaFiniquito(long idAcciones)
        {
            using (var conn = new SqlConnection(connectionString))
            {
                conn.Open();
                var cmd = new SqlCommand("SELECT CONVERT(varchar, periodoejecucionrealfinal, 103) as periodoEjecucionFinal FROM TBLP_cedulaseguimiento WHERE IDAcciones = @idAcciones AND tipo_seguimiento = 'F'", conn);
                cmd.Parameters.AddWithValue("@idAcciones", idAcciones);

                using (var reader = cmd.ExecuteReader())
                {
                    if (reader.Read())
                    {
                        return Ok(new
                        {
                            periodoEjecucionFinal = reader["periodoEjecucionFinal"].ToString()
                        });
                    }
                }
            }
            return Ok((object)null);
        }

        [HttpPost]
        [Route("GuardarFiniquito")]
        public IHttpActionResult GuardarFiniquito([FromBody] dynamic data)
        {
            try
            {
                long idAcciones = Convert.ToInt64(data.IdAcciones);
                long idObraProyecto = Convert.ToInt64(data.IdObraProyecto);
                string accionMov = data.AccionMov;

                using (var conn = new SqlConnection(connectionString))
                {
                    conn.Open();

                    if (accionMov == "A")
                    {
                        string sql = @"
                            INSERT INTO TBLP_finiquito(IDobraproyecto, IDAcciones, municipio, numobra, programa, subprograma, 
                                fuentefinanciamiento, montofuente, devengado, latitud, longuitud, 
                                programadoinicio, realtermino, financiero, contrato, contratista, descripcionobra, observaciones)
                            VALUES(@idObraProyecto, @idAcciones, @municipio, @numObra, @programa, @subprograma,
                                @fuenteFinanciamiento, @montoFuente, @devengado, @latitud, @longitud,
                                @programadoInicio, @realTermino, @financiero, @contrato, @contratista, @descripcionObra, @observaciones)";

                        var cmd = new SqlCommand(sql, conn);
                        cmd.Parameters.AddWithValue("@idObraProyecto", idObraProyecto);
                        cmd.Parameters.AddWithValue("@idAcciones", idAcciones);
                        cmd.Parameters.AddWithValue("@municipio", (string)data.Municipio ?? "");
                        cmd.Parameters.AddWithValue("@numObra", (string)data.NumObra ?? "");
                        cmd.Parameters.AddWithValue("@programa", (string)data.Programa ?? "");
                        cmd.Parameters.AddWithValue("@subprograma", (string)data.Subprograma ?? "");
                        cmd.Parameters.AddWithValue("@fuenteFinanciamiento", (string)data.FuenteFinanciamiento ?? "");
                        cmd.Parameters.AddWithValue("@montoFuente", (decimal)data.MontoFuente);
                        cmd.Parameters.AddWithValue("@devengado", (decimal)data.Devengado);
                        cmd.Parameters.AddWithValue("@latitud", (string)data.Latitud ?? "");
                        cmd.Parameters.AddWithValue("@longitud", (string)data.Longitud ?? "");
                        cmd.Parameters.AddWithValue("@programadoInicio", ParseFecha((string)data.ProgramadoInicio));
                        cmd.Parameters.AddWithValue("@realTermino", ParseFecha((string)data.RealTermino));
                        cmd.Parameters.AddWithValue("@financiero", (decimal)data.Financiero);
                        cmd.Parameters.AddWithValue("@contrato", (string)data.Contrato ?? "");
                        cmd.Parameters.AddWithValue("@contratista", (string)data.Contratista ?? "");
                        cmd.Parameters.AddWithValue("@descripcionObra", (string)data.DescripcionObra ?? "");
                        cmd.Parameters.AddWithValue("@observaciones", (string)data.Observaciones ?? "");
                        cmd.ExecuteNonQuery();
                    }
                    else
                    {
                        string sql = @"
                            UPDATE TBLP_finiquito SET
                                IDobraproyecto = @idObraProyecto, municipio = @municipio, numobra = @numObra,
                                programa = @programa, subprograma = @subprograma, fuentefinanciamiento = @fuenteFinanciamiento,
                                montofuente = @montoFuente, latitud = @latitud, longuitud = @longitud,
                                programadoinicio = @programadoInicio, realtermino = @realTermino, financiero = @financiero,
                                contrato = @contrato, contratista = @contratista, descripcionobra = @descripcionObra, observaciones = @observaciones
                            WHERE IDAcciones = @idAcciones";

                        var cmd = new SqlCommand(sql, conn);
                        cmd.Parameters.AddWithValue("@idObraProyecto", idObraProyecto);
                        cmd.Parameters.AddWithValue("@idAcciones", idAcciones);
                        cmd.Parameters.AddWithValue("@municipio", (string)data.Municipio ?? "");
                        cmd.Parameters.AddWithValue("@numObra", (string)data.NumObra ?? "");
                        cmd.Parameters.AddWithValue("@programa", (string)data.Programa ?? "");
                        cmd.Parameters.AddWithValue("@subprograma", (string)data.Subprograma ?? "");
                        cmd.Parameters.AddWithValue("@fuenteFinanciamiento", (string)data.FuenteFinanciamiento ?? "");
                        cmd.Parameters.AddWithValue("@montoFuente", (decimal)data.MontoFuente);
                        cmd.Parameters.AddWithValue("@latitud", (string)data.Latitud ?? "");
                        cmd.Parameters.AddWithValue("@longitud", (string)data.Longitud ?? "");
                        cmd.Parameters.AddWithValue("@programadoInicio", ParseFecha((string)data.ProgramadoInicio));
                        cmd.Parameters.AddWithValue("@realTermino", ParseFecha((string)data.RealTermino));
                        cmd.Parameters.AddWithValue("@financiero", (decimal)data.Financiero);
                        cmd.Parameters.AddWithValue("@contrato", (string)data.Contrato ?? "");
                        cmd.Parameters.AddWithValue("@contratista", (string)data.Contratista ?? "");
                        cmd.Parameters.AddWithValue("@descripcionObra", (string)data.DescripcionObra ?? "");
                        cmd.Parameters.AddWithValue("@observaciones", (string)data.Observaciones ?? "");
                        cmd.ExecuteNonQuery();
                    }
                }

                return Ok(new { success = true });
            }
            catch (Exception ex)
            {
                return BadRequest(ex.Message);
            }
        }

        
        /// cargar y descargarchivo finiquito

        [HttpPost]
        [Route("SubirArchivoFiniquito")]
        public IHttpActionResult SubirArchivoFiniquito()
        {
            try
            {
                var httpRequest = HttpContext.Current.Request;
                var idAcciones = Convert.ToInt64(httpRequest.Form["IdAcciones"]);

                if (httpRequest.Files["Archivo"] != null && httpRequest.Files["Archivo"].ContentLength > 0)
                {
                    var file = httpRequest.Files["Archivo"];
                    string ruta = "Uploads/finiquito/";
                    string rutaFisica = HttpContext.Current.Server.MapPath("~/" + ruta);
                    if (!Directory.Exists(rutaFisica))
                        Directory.CreateDirectory(rutaFisica);

                    string fileName = Path.GetFileName(file.FileName);
                    string filePath = Path.Combine(rutaFisica, fileName);
                    file.SaveAs(filePath);

                    string rutaRelativa = ruta + fileName;

                    using (var conn = new SqlConnection(connectionString))
                    {
                        conn.Open();
                        var cmd = new SqlCommand("UPDATE TBLP_finiquito SET archivo = @archivo WHERE IDAcciones = @idAcciones", conn);
                        cmd.Parameters.AddWithValue("@archivo", rutaRelativa);
                        cmd.Parameters.AddWithValue("@idAcciones", idAcciones);
                        cmd.ExecuteNonQuery();
                    }
                }

                return Ok(new { success = true });
            }
            catch (Exception ex)
            {
                return BadRequest(ex.Message);
            }
        }
        [HttpGet]
        [Route("GetRutaArchivoFiniquito/{idAcciones}")]
        public IHttpActionResult GetRutaArchivoFiniquito(long idAcciones)
        {
            using (var conn = new SqlConnection(connectionString))
            {
                conn.Open();
                var cmd = new SqlCommand(
                    "SELECT archivo FROM TBLP_finiquito WHERE IDAcciones = @id", conn);
                cmd.Parameters.AddWithValue("@id", idAcciones);
                var result = cmd.ExecuteScalar()?.ToString();
                if (!string.IsNullOrEmpty(result))
                    return Ok(new { ruta = result });
                return Ok((object)null);
            }
        }

        [HttpGet]
        [Route("DescargarArchivoFiniquito")]
        public HttpResponseMessage DescargarArchivoFiniquito(string ruta)
        {
            try
            {
                string rutaFisica = HostingEnvironment.MapPath("~/" + ruta);
                if (!File.Exists(rutaFisica))
                    return Request.CreateErrorResponse(HttpStatusCode.NotFound, "Archivo no encontrado.");

                byte[] fileBytes = File.ReadAllBytes(rutaFisica);
                string fileName = Path.GetFileName(rutaFisica);
                string mimeType = MimeMapping.GetMimeMapping(fileName);

                var response = Request.CreateResponse(HttpStatusCode.OK);
                response.Content = new ByteArrayContent(fileBytes);
                response.Content.Headers.ContentType = new MediaTypeHeaderValue(mimeType);
                response.Content.Headers.ContentDisposition =
                    new ContentDispositionHeaderValue("attachment") { FileName = fileName };
                return response;
            }
            catch (Exception ex)
            {
                return Request.CreateErrorResponse(HttpStatusCode.InternalServerError, ex.Message);
            }
        }

        [HttpPost]
        [Route("EliminarArchivoFiniquito")]
        public IHttpActionResult EliminarArchivoFiniquito([FromBody] dynamic data)
        {
            try
            {
                long idAcciones = Convert.ToInt64(data.idAcciones);
                using (var conn = new SqlConnection(connectionString))
                {
                    conn.Open();

                    // Obtener ruta para borrar el archivo físico
                    var cmdGet = new SqlCommand(
                        "SELECT archivo FROM TBLP_finiquito WHERE IDAcciones = @id", conn);
                    cmdGet.Parameters.AddWithValue("@id", idAcciones);
                    var ruta = cmdGet.ExecuteScalar()?.ToString();

                    if (!string.IsNullOrEmpty(ruta))
                    {
                        var rutaFisica = HostingEnvironment.MapPath("~/" + ruta);
                        if (File.Exists(rutaFisica)) File.Delete(rutaFisica);
                    }

                    // Limpiar columna en BD
                    var cmdUpd = new SqlCommand(
                        "UPDATE TBLP_finiquito SET archivo = NULL WHERE IDAcciones = @id", conn);
                    cmdUpd.Parameters.AddWithValue("@id", idAcciones);
                    cmdUpd.ExecuteNonQuery();
                }
                return Ok(new { success = true });
            }
            catch (Exception ex)
            {
                return InternalServerError(ex);
            }
        }

        /// cargar y descargarchivo finiquito

        [HttpGet]
        [Route("ExportarExcelFiniquito/{idAcciones}")]
        public HttpResponseMessage ExportarExcelFiniquito(long idAcciones)
        {
            try
            {
                // ── Licencia EPPlus 8.x (uso no comercial) ───────────────────────
                ExcelPackage.License.SetNonCommercialPersonal("Ceduver");

                // ── Rutas de la plantilla ────────────────────────────────────────
                string rutaPlantilla = HostingEnvironment.MapPath("~/Uploads/Ficha/FISM.xlsx");
                string rutaTemporal = HostingEnvironment.MapPath("~/Uploads/Ficha/FISMNEW.xlsx");

                if (!File.Exists(rutaPlantilla))
                    return Request.CreateErrorResponse(HttpStatusCode.NotFound,
                        "No se encontró la plantilla FISM.xlsx");

                if (File.Exists(rutaTemporal)) File.Delete(rutaTemporal);
                File.Copy(rutaPlantilla, rutaTemporal);

                // Variables
                string nombreObra = "", numObra = "", contrato = "", contratista = "",
                       descripcionObra = "", programa = "", subprograma = "",
                       latitud = "", longitud = "", observaciones = "",
                       programadoInicio = "", realTermino = "";
                decimal montoFuente = 0, devengado = 0, financiero = 0, saldo = 0;

                using (var conn = new SqlConnection(connectionString))
                {
                    conn.Open();

                    // ── Una sola consulta con todo ───────────────────────────────
                    var cmd = new SqlCommand(@"
                SELECT A.AC_Accion as nombreObra, P.OP_Num_obra as numObra,
                       C.CON_Contrato as contrato, CC.CTS_Nombre as contratista,
                       A.AC_Descripcionaccion as descripcionObra,
                       ISNULL(F.programa,'') as programa,
                       ISNULL(F.subprograma,'') as subprograma,
                       ISNULL(F.montofuente,0) as montofuente,
                       ISNULL(F.devengado,0) as devengado,
                       ISNULL(F.latitud,'') as latitud,
                       ISNULL(F.longuitud,'') as longuitud,
                       ISNULL(F.financiero,0) as financiero,
                       ISNULL(F.observaciones,'') as observaciones,
                       CONVERT(varchar, F.programadoinicio, 103) as programadoinicio,
                       CONVERT(varchar, F.realtermino, 103) as realtermino
                FROM TBLP_Obraproyecto P
                INNER JOIN TblD_Acciones A ON P.IDobraproyecto = A.IDobraproyecto
                LEFT OUTER JOIN TBLD_Contrato C ON A.IDContrato = C.IDContrato
                LEFT OUTER JOIN TBLC_Contratistas CC ON C.IDContratista = CC.IdContratista
                LEFT OUTER JOIN TBLP_finiquito F ON F.IDAcciones = A.IDAcciones
                WHERE A.IDAcciones = @id", conn);
                    cmd.Parameters.AddWithValue("@id", idAcciones);
                    
                    using (var r = cmd.ExecuteReader())
                    {
                        if (r.Read())
                        {
                            nombreObra = r["nombreObra"].ToString();
                            numObra = r["numObra"].ToString();
                            contrato = r["contrato"].ToString();
                            contratista = r["contratista"].ToString();
                            descripcionObra = r["descripcionObra"].ToString();
                            programa = r["programa"].ToString();
                            subprograma = r["subprograma"].ToString();
                            montoFuente = Convert.ToDecimal(r["montofuente"]);
                            devengado = Convert.ToDecimal(r["devengado"]);
                            latitud = r["latitud"].ToString();
                            longitud = r["longuitud"].ToString();
                            financiero = Convert.ToDecimal(r["financiero"]);
                            observaciones = r["observaciones"].ToString();
                            programadoInicio = r["programadoinicio"].ToString();
                            realTermino = r["realtermino"].ToString();
                            saldo = montoFuente - devengado;
                        }
                    }
                }

                // ── Llenar la plantilla Excel ────────────────────────────────────
                var fileInfo = new FileInfo(rutaTemporal);
                using (var pkg = new ExcelPackage(fileInfo))
                {
                    // EPPlus 8.x — acceder por índice 0 o por nombre de hoja
                    var ws = pkg.Workbook.Worksheets[0]; // índice 0 en EPPlus 5+

                    System.Diagnostics.Debug.WriteLine("Hoja: " + ws.Name);
                    System.Diagnostics.Debug.WriteLine("Celdas antes: " + ws.Cells[12, 2].Value);
                    // Encabezado
                    ws.Cells[4, 5].Value = "067";
                    ws.Cells[7, 4].Value = DateTime.Now.ToString("MMMM",
                        new System.Globalization.CultureInfo("es-MX"));

                    // Nombre del proyecto
                    ws.Cells[12, 2].Value = nombreObra;

                    // Claves presupuestales
                    ws.Cells[14, 4].Value = numObra;
                    ws.Cells[15, 2].Value = programa;
                    ws.Cells[15, 4].Value = subprograma;

                    // Situación financiera
                    ws.Cells[19, 1].Value = "FUENTE DE FINANCIAMIENTO: $" + montoFuente.ToString("N2");
                    ws.Cells[20, 1].Value = "TOTAL: $" + montoFuente.ToString("N2");
                    ws.Cells[19, 4].Value = devengado;
                    ws.Cells[19, 6].Value = saldo;
                    ws.Cells[20, 6].Value = saldo;

                    // Georreferenciación
                    ws.Cells[24, 1].Value = latitud;
                    ws.Cells[24, 2].Value = longitud;

                    // Periodo de ejecución
                    if (!string.IsNullOrEmpty(programadoInicio))
                        ws.Cells[25, 3].Value = programadoInicio;
                    if (!string.IsNullOrEmpty(realTermino))
                        ws.Cells[25, 4].Value = realTermino;

                    // Avance financiero
                    ws.Cells[24, 6].Value = financiero.ToString("N2") + "%";

                    // Contrato y contratista
                    ws.Cells[26, 1].Value = contrato;
                    ws.Cells[28, 1].Value = contratista;

                    // Observaciones
                    ws.Cells[28, 3].Value = observaciones;

                    // Descripción de la obra
                    ws.Cells[31, 1].Value = descripcionObra;

                    // Coordenadas al pie
                    ws.Cells[36, 4].Value = "LAT " + latitud + "°";
                    ws.Cells[36, 5].Value = "LONG " + longitud + "°";

                    System.Diagnostics.Debug.WriteLine("nombreObra al guardar: " + nombreObra);
                    ws.Cells[12, 2].Value = nombreObra; // repite solo para probar

                    // EPPlus 8.x — guardar explícitamente a un stream
                    pkg.Save();
                    System.Diagnostics.Debug.WriteLine("Guardado OK");
                }

                // ── Enviar archivo como descarga ─────────────────────────────────
                byte[] fileBytes = File.ReadAllBytes(rutaTemporal);
                string nombreDescarga = "FISM_" + DateTime.Now.ToString("ddMMyyyy") + ".xlsx";

                var response = Request.CreateResponse(HttpStatusCode.OK);
                response.Content = new ByteArrayContent(fileBytes);
                response.Content.Headers.ContentType =
                    new MediaTypeHeaderValue(
                        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
                response.Content.Headers.ContentDisposition =
                    new ContentDispositionHeaderValue("attachment")
                    {
                        FileName = nombreDescarga
                    };
                return response;
            }
            catch (Exception ex)
            {
                return Request.CreateErrorResponse(HttpStatusCode.InternalServerError,
                    ex.Message);
            }
        }

        #endregion

        #region bsuqueda
        [HttpGet]
        [Route("BuscarContrato")]
        public IHttpActionResult BuscarContrato(string term)
        {
            var result = new List<string>();

            using (var conn = new SqlConnection(connectionString))
            {
                conn.Open();

                string sql = @"SELECT C.IDContrato, C.CON_contrato
                       FROM TBLD_Contrato C
                       INNER JOIN TblD_Acciones A ON C.IDContrato = A.IDContrato
                       WHERE C.CON_contrato LIKE @term";

                using (var cmd = new SqlCommand(sql, conn))
                {
                    // 👇 AQUÍ va la mejora
                    cmd.Parameters.AddWithValue("@term", "%" + term + "%");

                    using (var reader = cmd.ExecuteReader())
                    {
                        while (reader.Read())
                        {
                            result.Add(
                                reader["CON_contrato"].ToString() + "|" +
                                reader["IDContrato"].ToString()
                            );
                        }
                    }
                }
            }

            return Ok(result);
        }
        [HttpGet]
        [Route("BuscarObra")]
        public IHttpActionResult BuscarObra(string term)
        {
            var result = new List<string>();

            using (var conn = new SqlConnection(connectionString))
            {
                conn.Open();

                string sql = @"SELECT A.IDAcciones,
                              (P.OP_NombreObra + '(' + A.AC_Accion + ')') AS nombreobra
                       FROM TBLP_Obraproyecto P
                       INNER JOIN TblD_Acciones A ON P.IDobraproyecto = A.IDobraproyecto
                       WHERE (P.OP_NombreObra + '(' + A.AC_Accion + ')') LIKE @term";

                using (var cmd = new SqlCommand(sql, conn))
                {
                    // 👇 misma mejora
                    cmd.Parameters.AddWithValue("@term", "%" + term + "%");

                    using (var reader = cmd.ExecuteReader())
                    {
                        while (reader.Read())
                        {
                            result.Add(
                                reader["nombreobra"].ToString() + "|" +
                                reader["IDAcciones"].ToString()
                            );
                        }
                    }
                }
            }

            return Ok(result);
        }
        #endregion

        #region Helpers

        private DateTime ParseFecha(string fecha)
        {
            if (string.IsNullOrEmpty(fecha))
                return new DateTime(1900, 1, 1);

            DateTime result;
            if (DateTime.TryParseExact(fecha, "dd/MM/yyyy", null, System.Globalization.DateTimeStyles.None, out result))
                return result;
            if (DateTime.TryParseExact(fecha, "yyyy-MM-dd", null, System.Globalization.DateTimeStyles.None, out result))
                return result;
            return new DateTime(1900, 1, 1);
        }

        private decimal ParseDecimal(string value)
        {
            if (string.IsNullOrEmpty(value))
                return 0;

            decimal result;
            if (decimal.TryParse(value, out result))
                return result;

            return 0;
        }

        private long ParseLong(string value)
        {
            if (string.IsNullOrEmpty(value))
                return 0;

            long result;
            if (long.TryParse(value, out result))
                return result;

            return 0;
        }

        #endregion

        #region Reportes
        [HttpGet]
        [Route("GetIdSeguimientoInicio/{idAcciones}")]
        public IHttpActionResult GetIdSeguimientoInicio(long idAcciones)
        {
            try
            {
                using (var conn = new SqlConnection(connectionString))
                {
                    conn.Open();
                    var cmd = new SqlCommand(
                        "SELECT idseguimiento FROM TBLP_cedulaseguimiento " +
                        "WHERE IDAcciones = @id AND tipo_seguimiento = 'I'", conn);
                    cmd.Parameters.AddWithValue("@id", idAcciones);
                    var result = cmd.ExecuteScalar();
                    if (result != null)
                        return Ok(new { idSeguimiento = Convert.ToInt64(result) });
                    else
                        return Ok((object)null);
                }
            }
            catch (Exception ex)
            {
                return InternalServerError(ex);
            }
        }
        [HttpGet]
        [Route("GetIdSeguimientoFinal/{idAcciones}")]
        public IHttpActionResult GetIdSeguimientoFinal(long idAcciones)
        {
            try
            {
                using (var conn = new SqlConnection(connectionString))
                {
                    conn.Open();
                    var cmd = new SqlCommand(
                        "SELECT idseguimiento FROM TBLP_cedulaseguimiento " +
                        "WHERE IDAcciones = @id AND tipo_seguimiento = 'F'", conn);
                    cmd.Parameters.AddWithValue("@id", idAcciones);
                    var result = cmd.ExecuteScalar();
                    if (result != null)
                        return Ok(new { idSeguimiento = Convert.ToInt64(result) });
                    else
                        return Ok((object)null);
                }
            }
            catch (Exception ex)
            {
                return InternalServerError(ex);
            }
        }


        #endregion

        #region Ficha HTML Inicio
        [HttpGet]
        [Route("GenerarFichaInicio/{idAcciones}")]
        [AllowAnonymous]
        public HttpResponseMessage GenerarFichaInicio(long idAcciones)
        {
            try
            {
                // ── 1. Encabezado (obra, contrato, localidad, fuente, monto) ──
                string nombreObra = "", numContrato = "", localidad = "",
                       fuenteFinanciamiento = "", periodoInicio = "", periodoFin = "";
                decimal montoContratado = 0;

                // ── 2. Datos inicio (supervisor, fecha, fotos, coords) ──
                string supervisor = "", fechaVerificacion = "";
                string rutaCroquis = "", rutaFoto1 = "", rutaFoto2 = "", rutaFoto3 = "", rutaFoto4 = "";
                string latCroquis = "", lonCroquis = "";
                string latFoto1 = "", lonFoto1 = "";
                string latFoto2 = "", lonFoto2 = "";
                string latFoto3 = "", lonFoto3 = "";
                string latFoto4 = "", lonFoto4 = "";
                decimal aportacionFismdf = 0, otraFuenteFederal = 0, fuenteEstatal = 0, fuenteMunicipal = 0, otros = 0, costoTotal = 0;

                string baseServerPath = HttpContext.Current.Server.MapPath("~/");
                string baseUrl = HttpContext.Current.Request.Url.GetLeftPart(UriPartial.Authority)
                                 + HttpContext.Current.Request.ApplicationPath.TrimEnd('/') + "/";

                using (var conn = new SqlConnection(connectionString))
                {
                    conn.Open();

                    // Encabezado
                    string sqlEnc = @"
                        SELECT P.OP_NombreObra, A.AC_Accion, C.CON_Contrato, C.CON_Montocontratado,
                               A.LCL_Nombre,
                               CONVERT(varchar,C.CON_Inicio,103) AS CON_Inicio,
                               CONVERT(varchar,C.CON_Final,103)  AS CON_Final
                        FROM TBLP_Obraproyecto P
                        INNER JOIN TblD_Acciones A ON P.IDobraproyecto = A.IDobraproyecto
                        INNER JOIN TBLD_Contrato C ON A.IDContrato = C.IDContrato
                        WHERE A.IDAcciones = @id";
                    using (var r = new SqlCommand(sqlEnc, conn) { Parameters = { new SqlParameter("@id", idAcciones) } }.ExecuteReader())
                    {
                        if (r.Read())
                        {
                            nombreObra      = r["OP_NombreObra"].ToString() + " (" + r["AC_Accion"].ToString() + ")";
                            numContrato     = r["CON_Contrato"].ToString();
                            localidad       = r["LCL_Nombre"].ToString();
                            montoContratado = r["CON_Montocontratado"] != DBNull.Value ? Convert.ToDecimal(r["CON_Montocontratado"]) : 0;
                            periodoInicio   = r["CON_Inicio"].ToString();
                            periodoFin      = r["CON_Final"].ToString();
                        }
                    }

                    // Fuente financiamiento (primera)
                    var cmdF = new SqlCommand(@"
                        SELECT TOP 1 F.PRF_Nombre
                        FROM TBLD_Financiamientoinversion I
                        INNER JOIN TblC_FuenteFinanciamiento F ON I.IDProgramafinanciamiento = F.IDFuenteFinanciamiento
                        WHERE I.IDAcciones = @id", conn);
                    cmdF.Parameters.AddWithValue("@id", idAcciones);
                    var fRes = cmdF.ExecuteScalar();
                    if (fRes != null) fuenteFinanciamiento = fRes.ToString();

                    // Columnas nuevas backward-compat
                    var colsOk = new HashSet<string>(StringComparer.OrdinalIgnoreCase);
                    var cmdCols = new SqlCommand(@"
                        SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS
                        WHERE TABLE_NAME='TBLP_cedulaseguimiento'
                        AND COLUMN_NAME IN ('supervisor','latitud_croquis','longuitud_croquis',
                            'latitud_foto1','longuitud_foto1','latitud_foto2','longuitud_foto2',
                            'latitud_foto3','longuitud_foto3','latitud_foto4','longuitud_foto4')", conn);
                    using (var rc = cmdCols.ExecuteReader())
                        while (rc.Read()) colsOk.Add(rc.GetString(0).ToLower());

                    string SafeS(System.Data.IDataReader rd, string col) =>
                        colsOk.Contains(col) ? rd[col]?.ToString() ?? "" : "";

                    // Datos inicio
                    var cmdI = new SqlCommand(@"
                        SELECT * FROM TBLP_cedulaseguimiento
                        WHERE IDAcciones = @id AND tipo_seguimiento = 'I'", conn);
                    cmdI.Parameters.AddWithValue("@id", idAcciones);
                    using (var ri = cmdI.ExecuteReader())
                    {
                        if (ri.Read())
                        {
                            supervisor        = SafeS(ri, "supervisor");
                            fechaVerificacion = ri["fechaverificacion"] != DBNull.Value
                                               ? Convert.ToDateTime(ri["fechaverificacion"]).ToString("dd/MM/yyyy") : "";
                            rutaCroquis = ri["croquis"].ToString();
                            rutaFoto1   = ri["foto1"].ToString();
                            rutaFoto2   = ri["foto2"].ToString();
                            rutaFoto3   = ri["foto3"].ToString();
                            rutaFoto4   = ri["foto4"].ToString();
                            latCroquis  = SafeS(ri, "latitud_croquis");  lonCroquis = SafeS(ri, "longuitud_croquis");
                            latFoto1    = SafeS(ri, "latitud_foto1");    lonFoto1   = SafeS(ri, "longuitud_foto1");
                            latFoto2    = SafeS(ri, "latitud_foto2");    lonFoto2   = SafeS(ri, "longuitud_foto2");
                            latFoto3    = SafeS(ri, "latitud_foto3");    lonFoto3   = SafeS(ri, "longuitud_foto3");
                            latFoto4    = SafeS(ri, "latitud_foto4");    lonFoto4   = SafeS(ri, "longuitud_foto4");
                            aportacionFismdf  = ri["aportacionfismdf"]  != DBNull.Value ? Convert.ToDecimal(ri["aportacionfismdf"])  : 0;
                            otraFuenteFederal = ri["otrafuentefederal"] != DBNull.Value ? Convert.ToDecimal(ri["otrafuentefederal"]) : 0;
                            fuenteEstatal     = ri["fuenteestatal"]     != DBNull.Value ? Convert.ToDecimal(ri["fuenteestatal"])     : 0;
                            fuenteMunicipal   = ri["fuentemunicipal"]   != DBNull.Value ? Convert.ToDecimal(ri["fuentemunicipal"])   : 0;
                            otros             = ri["otros"]             != DBNull.Value ? Convert.ToDecimal(ri["otros"])             : 0;
                            costoTotal        = ri["costototal"]        != DBNull.Value ? Convert.ToDecimal(ri["costototal"])        : 0;
                        }
                    }
                }

                // ── 3. Convertir rutas físicas a URLs ──
                Func<string, string> toUrl = (ruta) =>
                {
                    if (string.IsNullOrEmpty(ruta)) return "";
                    // Si ya es URL absoluta, regrésala tal cual
                    if (ruta.StartsWith("http")) return ruta;
                    // Si es ruta relativa tipo "Uploads/Seguimiento/archivo.jpg"
                    return baseUrl + ruta.Replace("\\", "/").TrimStart('/');
                };

                // ── 4. Helper para tarjeta de foto (solo si hay ruta Y archivo existe físicamente) ──
                Func<string, string, string, string, string> fotoCard = (titulo, ruta, lat, lon) =>
                {
                    if (string.IsNullOrEmpty(ruta)) return "";
                    // Verificar que el archivo realmente existe en disco
                    string physPath = HttpContext.Current.Server.MapPath("~/" + ruta.TrimStart('/').Replace("/", "\\"));
                    if (!System.IO.File.Exists(physPath)) return "";
                    string url = toUrl(ruta);
                    string coords = (!string.IsNullOrEmpty(lat) || !string.IsNullOrEmpty(lon))
                        ? $"<div class='foto-coords'><b>Lat:</b> {lat}&nbsp;&nbsp;<b>Lon:</b> {lon}</div>"
                        : "";
                    return $@"
                    <div class='foto-bloque'>
                      <img class='foto' src='{url}' alt='{titulo}'>
                      <div class='foto-caption'>
                        <div class='foto-titulo'>{titulo}</div>
                        {coords}
                      </div>
                    </div>";
                };

                string fotosHtml =
                    fotoCard("Croquis",       rutaCroquis, latCroquis, lonCroquis) +
                    fotoCard("Fotografía 1",  rutaFoto1,   latFoto1,   lonFoto1)   +
                    fotoCard("Fotografía 2",  rutaFoto2,   latFoto2,   lonFoto2)   +
                    fotoCard("Fotografía 3",  rutaFoto3,   latFoto3,   lonFoto3)   +
                    fotoCard("Fotografía 4",  rutaFoto4,   latFoto4,   lonFoto4);

                var culturesMX = new CultureInfo("es-MX");
                string montoFmt = montoContratado.ToString("C", culturesMX);
                string costoFmt = costoTotal.ToString("C", culturesMX);

                // ── 5. HTML ──
                string html = $@"<!DOCTYPE html>
<html lang='es'>
<head>
<meta charset='UTF-8'>
<meta name='viewport' content='width=device-width,initial-scale=1'>
<title>Cédula de Verificación de Inicio</title>
<style>
  * {{ box-sizing: border-box; margin: 0; padding: 0; }}
  html, body {{ margin: 0; padding: 0; }}
  body {{ font-family: Arial, sans-serif; font-size: 12px; color: #222; background: #fff; }}
  .doc-wrapper {{ width: 100%; }}

  /* ══ BARRAS de color ══ */
  .hdr-bar  {{ background: #c0392b; height: 8px; width: 100%; display: block; }}
  .hdr-gold {{ background: #d4ac0d; height: 4px; width: 100%; display: block; }}

  /* ══ ENCABEZADO ══ */
  .hdr-fixed {{ width: 100%; }}
  .hdr-inner {{ display: flex; align-items: center; justify-content: space-between;
                padding: 8px 20px; background: #fff; }}
  .hdr-logo img {{ height: 70px; width: auto; }}
  .hdr-center {{ text-align: center; flex: 1; padding: 0 16px; }}
  .hdr-center .h-titulo {{
    font-size: 13px; font-weight: bold; color: #c0392b;
    text-transform: uppercase; line-height: 1.5;
  }}
  .hdr-center .h-sub {{
    font-size: 11px; color: #444; margin-top: 3px;
  }}

  /* ══ PIE DE PÁGINA ══ */
  .footer-fixed {{ width: 100%; line-height: 0; }}

  /* ══ Cuerpo del documento ══ */
  .page {{ max-width: 820px; margin: 0 auto; padding: 0 24px 24px; }}

  /* Título central */
  .cedula-titulo {{
    text-align: center; letter-spacing: 2px; font-size: 13px;
    color: #555; font-weight: bold; text-transform: uppercase;
    margin: 18px 0 14px;
  }}

  /* Tabla de datos */
  table.ficha {{ width: 100%; border-collapse: collapse; margin-bottom: 14px; }}
  table.ficha td {{
    border: 1px solid #bbb; padding: 6px 10px; vertical-align: top;
    font-size: 12px;
  }}
  table.ficha td.lbl {{
    font-weight: bold; width: 32%; background: #fff;
    white-space: nowrap;
  }}

  /* Texto visita */
  .texto-visita {{
    border: 1px solid #bbb; padding: 10px 14px;
    margin-bottom: 16px; font-size: 12px; line-height: 1.7;
  }}

  /* Sección fotos */
  .sec-fotos {{
    border-left: 4px solid #c0392b;
    padding-left: 8px; margin-bottom: 14px;
    font-weight: bold; font-size: 12px;
  }}

  /* Cada foto: wrapper centrado */
  .foto-bloque {{
    margin: 16px auto 28px auto;
    page-break-inside: avoid;
    width: fit-content;
    max-width: 100%;
  }}
  .foto-bloque img.foto {{
    max-width: 500px;
    width: 100%;
    max-height: 300px;
    object-fit: contain;
    border: 1px solid #999;
    border-bottom: none;
    display: block;
  }}
  /* Pie de foto pegado exactamente debajo de la imagen */
  .foto-caption {{
    max-width: 500px;
    width: 100%;
    background: #f0f0f0;
    border: 1px solid #999;
    padding: 5px 10px;
    font-size: 11px;
    box-sizing: border-box;
  }}
  .foto-caption .foto-titulo {{
    font-weight: bold; font-size: 12px; color: #c0392b;
  }}
  .foto-caption .foto-coords {{
    color: #444; margin-top: 2px;
  }}

  /* Botón no imprime */
  .no-print {{ text-align: right; padding: 10px 24px 0; }}
  .no-print button {{
    background: #c0392b; color: #fff; border: none;
    padding: 6px 18px; border-radius: 4px;
    cursor: pointer; font-size: 13px;
  }}

  /* ══ PRINT ══ */
  @media print {{
    .no-print {{ display: none !important; }}
    @page {{ margin: 0; }}
    html, body {{
      margin: 0; padding: 0;
      -webkit-print-color-adjust: exact; print-color-adjust: exact;
    }}
    /* Encabezado fijo — se repite en cada página */
    .hdr-fixed {{
      position: fixed;
      top: 0; left: 0; right: 0; width: 100%;
      background: #fff;
      z-index: 999;
    }}
    /* Pie fijo — se repite en cada página */
    .footer-fixed {{
      position: fixed;
      bottom: 0; left: 0; right: 0; width: 100%;
      background: #fff;
      z-index: 999;
    }}
    /* Espacios para que el contenido no quede tapado */
    .page {{
      margin-top: 130px;
      margin-bottom: 95px;
    }}
    .foto-bloque {{ page-break-inside: avoid; }}
  }}
</style>
</head>
<body>
<div class='doc-wrapper'>

<!-- Botón imprimir (solo pantalla) -->
<div class='no-print'>
  <button onclick='window.print()'>&#128424; Imprimir</button>
</div>

<!-- ═══ ENCABEZADO ═══ -->
<div class='hdr-fixed'>
  <div class='hdr-gold'></div>
  <div class='hdr-inner'>
    <div class='hdr-logo'>
      <img src='{baseUrl}assets/media/logo_chilon.png' alt='Logo'
           onerror=""this.style.visibility='hidden'"">
    </div>
    <div class='hdr-center'>
      <div class='h-titulo'>H. Ayuntamiento Municipal de Chilón, Chiapas<br>2024 – 2027</div>
      <div class='h-sub'>Dirección de Obras Públicas y Desarrollo Urbano</div>
    </div>
    <div class='hdr-logo'>
      <img src='{baseUrl}assets/media/escudo.png' alt='Escudo'
           onerror=""this.style.visibility='hidden'"">
    </div>
  </div>
  <div class='hdr-gold'></div>
  <div class='hdr-bar'></div>
</div>

<!-- ═══ CUERPO ═══ -->
<div class='page'>

  <div class='cedula-titulo'>Cédula de Verificación de Inicio</div>

  <table class='ficha'>
    <tr><td class='lbl'>Contrato:</td><td>{numContrato}</td></tr>
    <tr><td class='lbl'>Monto Contratado:</td><td>{montoFmt}</td></tr>
    <tr><td class='lbl'>Fuente de Financiamiento:</td><td>{fuenteFinanciamiento}</td></tr>
    <tr><td class='lbl'>Inversión Total:</td><td>{costoFmt}</td></tr>
    <tr><td class='lbl'>Obra:</td><td>{nombreObra}</td></tr>
    <tr><td class='lbl'>Localidad:</td><td>{localidad}</td></tr>
    <tr><td class='lbl'>Supervisor de Obras:</td><td>{supervisor}</td></tr>
    <tr><td class='lbl'>Fecha de Verificación:</td><td>{fechaVerificacion}</td></tr>
  </table>

  <div class='texto-visita'>
    SE REALIZA LA VISITA A LA LOCALIDAD EN COMPAÑÍA DE PATRONATO DE OBRA PARA SUPERVISAR
    LOS AVANCES DE LA OBRA:
  </div>

  <div class='sec-fotos'>Evidencia Fotográfica</div>

  {fotosHtml}

</div>

<!-- ═══ PIE DE PÁGINA con curva ═══ -->
<div class='footer-fixed'>
  <svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 900 90'
       style='display:block; width:100%; height:90px;' preserveAspectRatio='none'>
    <!-- Sombra/borde dorado: misma curva pero 5px más arriba y más gruesa -->
    <path d='M0,15 Q225,0 450,15 Q675,30 900,15 L900,90 L0,90 Z' fill='#d4ac0d'/>
    <!-- Forma roja encima, con 5px de margen para que se vea el dorado como borde -->
    <path d='M0,20 Q225,5 450,20 Q675,35 900,20 L900,90 L0,90 Z' fill='#c0392b'/>
    <!-- Texto -->
    <text x='450' y='52' text-anchor='middle'
          font-family='Arial,sans-serif' font-size='13' font-weight='bold'
          fill='white' letter-spacing='0.5'>
      PALACIO MUNICIPAL S/N. COL. CENTRO, CHILÓN, CHIAPAS. C.P. 29940
    </text>
    <text x='450' y='71' text-anchor='middle'
          font-family='Arial,sans-serif' font-size='12'
          fill='white'>
      TEL: (919) 67 101 15
    </text>
  </svg>
</div>

</div><!-- /doc-wrapper -->
</body>
</html>";

                var response = new HttpResponseMessage(System.Net.HttpStatusCode.OK)
                {
                    Content = new StringContent(html, System.Text.Encoding.UTF8, "text/html")
                };
                return response;
            }
            catch (Exception ex)
            {
                var err = new HttpResponseMessage(System.Net.HttpStatusCode.InternalServerError)
                {
                    Content = new StringContent("Error: " + ex.Message)
                };
                return err;
            }
        }

        // ════════════════════════════════════════════════════════════════════════
        //  FICHA TÉCNICA DE OBRA F.I.S.M. — Reporte al vuelo
        // ════════════════════════════════════════════════════════════════════════
        [HttpGet]
        [Route("GenerarFichaFism/{idAcciones}")]
        [AllowAnonymous]
        public HttpResponseMessage GenerarFichaFism(long idAcciones)
        {
            try
            {
                string baseUrl = HttpContext.Current.Request.Url.GetLeftPart(UriPartial.Authority)
                                 + HttpContext.Current.Request.ApplicationPath.TrimEnd('/') + "/";

                // ── 1. Encabezado ─────────────────────────────────────────────
                string nombreObra = "", numContrato = "", localidad = "",
                       fuenteFinanciamiento = "", periodoInicio = "", periodoFin = "",
                       rubro = "", programa = "", claveLocalidad = "", descripcionAccion = "";
                decimal montoContratado = 0;

                // ── 2. Datos ficha FISM ───────────────────────────────────────
                string  oficioreg = "", numobramun = "", dictamen = "", observaciones = "";
                string  descripcionObrafism = "";
                decimal invProg = 0, invEjer = 0, aportProg = 0, aportEjer = 0;
                decimal otrosProg = 0, otrosEjer = 0;
                decimal saldoFism = 0, aportFism = 0, otrosSaldo = 0, totalSaldo = 0;
                decimal totProg = 0, totEjer = 0;
                decimal avanceFisico = 0, avanceFinanciero = 0;
                string  fechaInicioProg = "", fechaFinalProg = "";
                // Convenios
                decimal contratoImp = 0, difeImp = 0, ampImp = 0;
                string  contratoIni = "", contratoFin = "";
                string  difeIni = "", difeFin = "";
                string  ampIni = "", ampFin = "";
                // Fotos georeferenciadas
                string rutaInicio = "", latInicio = "", lonInicio = "";
                string rutaIntermedio = "", latInterm = "", lonInterm = "";
                string rutaFinal = "", latFinal = "", lonFinal = "";

                using (var conn = new SqlConnection(connectionString))
                {
                    conn.Open();

                    // Encabezado
                    var cmdEnc = new SqlCommand(@"
                        SELECT P.OP_NombreObra, A.AC_Accion, C.CON_Contrato, C.CON_Montocontratado,
                               A.LCL_Nombre, A.CveLocalidades, A.AC_Descripcionaccion,
                               CONVERT(varchar,C.CON_Inicio,103) AS CON_Inicio,
                               CONVERT(varchar,C.CON_Final,103)  AS CON_Final,
                               R.Rub_Nombre, S.PRO_Nombre
                        FROM TBLP_Obraproyecto P
                        INNER JOIN TblD_Acciones A ON P.IDobraproyecto = A.IDobraproyecto
                        INNER JOIN TBLD_Contrato C ON A.IDContrato = C.IDContrato
                        INNER JOIN TBLC_Rubros R ON P.IDRubro = R.IDRubro
                        INNER JOIN TBLC_Subrubro S ON R.IDRubro = S.IDRubro
                        WHERE A.IDAcciones = @id", conn);
                    cmdEnc.Parameters.AddWithValue("@id", idAcciones);
                    using (var r = cmdEnc.ExecuteReader())
                    {
                        if (r.Read())
                        {
                            nombreObra      = r["OP_NombreObra"].ToString() + " (" + r["AC_Accion"].ToString() + ")";
                            numContrato     = r["CON_Contrato"].ToString();
                            localidad       = r["LCL_Nombre"].ToString();
                            claveLocalidad  = r["CveLocalidades"].ToString();
                            descripcionAccion = r["AC_Descripcionaccion"].ToString();
                            montoContratado = r["CON_Montocontratado"] != DBNull.Value ? Convert.ToDecimal(r["CON_Montocontratado"]) : 0;
                            periodoInicio   = r["CON_Inicio"].ToString();
                            periodoFin      = r["CON_Final"].ToString();
                            rubro           = r["Rub_Nombre"].ToString();
                            programa        = r["PRO_Nombre"].ToString();
                        }
                    }

                    // Fuente de financiamiento
                    var cmdF = new SqlCommand(@"
                        SELECT TOP 1 F.PRF_Nombre FROM TBLD_Financiamientoinversion I
                        INNER JOIN TblC_FuenteFinanciamiento F ON I.IDProgramafinanciamiento = F.IDFuenteFinanciamiento
                        WHERE I.IDAcciones = @id", conn);
                    cmdF.Parameters.AddWithValue("@id", idAcciones);
                    var fRes = cmdF.ExecuteScalar();
                    if (fRes != null) fuenteFinanciamiento = fRes.ToString();

                    // Datos ficha FISM
                    var cmdFism = new SqlCommand("SELECT * FROM tblp_fichatecnicafism WHERE IDAcciones = @id", conn);
                    cmdFism.Parameters.AddWithValue("@id", idAcciones);
                    using (var rf = cmdFism.ExecuteReader())
                    {
                        if (rf.Read())
                        {
                            Func<string, decimal> D = col => rf[col] != DBNull.Value ? Convert.ToDecimal(rf[col]) : 0;
                            Func<string, string>  S = col => rf[col] != DBNull.Value ? rf[col].ToString() : "";
                            Func<string, string>  Dt= col => rf[col] != DBNull.Value ? Convert.ToDateTime(rf[col]).ToString("dd/MM/yyyy") : "";

                            oficioreg    = S("oficioreg");   numobramun = S("numobramun");
                            dictamen     = S("dictamen");    observaciones = S("observaciones");
                            descripcionObrafism = S("descripcionobrafism");

                            invProg    = D("inversionprogramadafism");  invEjer   = D("inversionejercidafism");
                            aportProg  = D("aportacionprogramadafism"); aportEjer = D("aportacionejercidafism");
                            otrosProg  = D("otrosprogramado");          otrosEjer = D("otrosejercida");
                            totProg    = D("totalprogramado");          totEjer   = D("totalejercida");
                            saldoFism  = D("saldofism");    aportFism  = D("aportacionfism");
                            otrosSaldo = D("otrossaldofism"); totalSaldo= D("totalsaldo");

                            avanceFisico     = D("avancefisicofism");
                            avanceFinanciero = D("avancefinancierofism");

                            fechaInicioProg = Dt("programadofechainicial");
                            fechaFinalProg  = Dt("programadofechafinal");

                            contratoImp = D("conveniocontratoimporte");
                            contratoIni = Dt("conveniocontratofechainicio");
                            contratoFin = Dt("conveniocontratofechafin");
                            difeImp     = D("conveniodiferidoimporte");
                            difeIni     = Dt("conveniodiferidofechainicio");
                            difeFin     = Dt("conveniodiferidofechafin");
                            ampImp      = D("ampliacionplazoimporte");
                            ampIni      = Dt("ampliacionplazofechainicio");
                            ampFin      = Dt("ampliacionplazofechafin");

                            rutaInicio    = S("fotoinicio");    latInicio = S("latitudinicio");   lonInicio = S("longitudinicio");
                            rutaIntermedio= S("fotointermedio");latInterm = S("latitudintermedio");lonInterm= S("longitudintermedio");
                            rutaFinal     = S("fotofinal");     latFinal  = S("latitudfinal");    lonFinal  = S("longitudfinal");
                        }
                    }
                }

                // ── 3. Helpers ────────────────────────────────────────────────
                var mx = new CultureInfo("es-MX");
                Func<decimal, string> Fmt = v => v.ToString("C", mx);
                Func<decimal, string> FmtN= v => v == 0 ? "—" : v.ToString("C", mx);
                Func<decimal, string> FmtPct = v => v.ToString("0.##") + " %";

                Func<string, string> toUrl = ruta =>
                {
                    if (string.IsNullOrEmpty(ruta)) return "";
                    if (ruta.StartsWith("http")) return ruta;
                    return baseUrl + ruta.Replace("\\", "/").TrimStart('/');
                };

                Func<string, string, string, string, string> fotoCard = (titulo, ruta, lat, lon) =>
                {
                    if (string.IsNullOrEmpty(ruta)) return "";
                    string phys = HttpContext.Current.Server.MapPath("~/" + ruta.TrimStart('/').Replace("/", "\\"));
                    if (!System.IO.File.Exists(phys)) return "";
                    string url   = toUrl(ruta);
                    string coords = (!string.IsNullOrEmpty(lat) || !string.IsNullOrEmpty(lon))
                        ? $"<div class='foto-coords'><b>Lat:</b> {lat}&nbsp;&nbsp;<b>Lon:</b> {lon}</div>" : "";
                    return $@"<div class='foto-bloque'>
                      <div class='foto-etiqueta'>{titulo}</div>
                      <img class='foto' src='{url}' alt='{titulo}'>
                      <div class='foto-caption'>{coords}</div>
                    </div>";
                };

                // Fila tabla financiera (estilo clásico)
                Func<string, decimal, decimal, decimal, string> filaFin = (label, prog, ejer, saldo) =>
                    $"<tr><td class='f-lbl'>{label}</td>" +
                    $"<td class='f-num'>{Fmt(prog)}</td>" +
                    $"<td class='f-lbl'>{label}</td>" +
                    $"<td class='f-num'>{Fmt(ejer)}</td>" +
                    $"<td class='f-lbl'>{label}</td>" +
                    $"<td class='f-num'>{Fmt(saldo)}</td></tr>";

                // Fila de convenio modificatorio (una fila por convenio)
                Func<string, decimal, string, string, string> filaConv = (tipo, imp, ini, fin) =>
                    imp == 0 ? "" :
                    $"<tr><td>{tipo}</td><td class='f-num'>{Fmt(imp)}</td><td>{ini}</td><td>{fin}</td></tr>";

                // Fotos lado a lado
                var listaFotos = new System.Collections.Generic.List<string>();
                string fc1 = fotoCard("Fotografía de Inicio",  rutaInicio,     latInicio, lonInicio);
                string fc2 = fotoCard("Fotografía Intermedia", rutaIntermedio, latInterm,  lonInterm);
                string fc3 = fotoCard("Fotografía Final",      rutaFinal,      latFinal,   lonFinal);
                if (!string.IsNullOrEmpty(fc1)) listaFotos.Add(fc1);
                if (!string.IsNullOrEmpty(fc2)) listaFotos.Add(fc2);
                if (!string.IsNullOrEmpty(fc3)) listaFotos.Add(fc3);
                string fotosHtml = listaFotos.Count == 0 ? "" :
                    "<div class='fotos-row'>" + string.Join("", listaFotos) + "</div>";

                bool hayConvenios = contratoImp > 0 || difeImp > 0 || ampImp > 0;

                // ── 4. HTML (estilo ficha clásica) ───────────────────────────
                string html = $@"<!DOCTYPE html>
<html lang='es'>
<head>
<meta charset='UTF-8'>
<meta name='viewport' content='width=device-width,initial-scale=1'>
<title>Ficha Técnica de Obra F.I.S.M.</title>
<style>
  * {{ box-sizing:border-box; margin:0; padding:0; }}
  html,body {{ font-family:Arial,sans-serif; font-size:10px; color:#000; background:#fff; }}

  /* ══ Encabezado ══ */
  .hdr-wrap {{ border-bottom:2px solid #000; padding-bottom:2px; margin-bottom:4px; }}
  .hdr-inner {{ display:flex; align-items:center; justify-content:space-between; padding:2px 8px; }}
  .hdr-logo img {{ height:52px; width:auto; }}
  .hdr-center {{ text-align:center; flex:1; padding:0 8px; }}
  .hdr-center .h-titulo {{ font-size:12px; font-weight:bold; text-transform:uppercase; line-height:1.3; }}
  .hdr-center .h-ea    {{ font-size:9px; }}

  /* ══ Cuerpo ══ */
  .page {{ max-width:820px; margin:0 auto; padding:0 10px 10px; }}

  /* Tabla general */
  table.t {{ width:100%; border-collapse:collapse; margin-bottom:0; font-size:10px; }}
  table.t td, table.t th {{ border:1px solid #000; padding:2px 5px; vertical-align:top; }}
  table.t td.lbl {{ font-weight:bold; background:#f2f2f2; white-space:nowrap; width:13%; }}
  table.t th {{ background:#e0e0e0; font-weight:bold; text-align:center; }}

  /* Encabezado de sección */
  .sec-title {{ background:#333; color:#fff; font-weight:bold; font-size:10px;
    text-align:center; padding:2px 5px; border:1px solid #000; border-bottom:0;
    text-transform:uppercase; letter-spacing:.4px; margin-top:5px; }}

  /* Tabla financiera 6-col */
  table.fin {{ width:100%; border-collapse:collapse; font-size:10px; margin-bottom:0; }}
  table.fin td, table.fin th {{ border:1px solid #000; padding:2px 5px; }}
  table.fin th {{ background:#d9d9d9; font-weight:bold; text-align:center; font-size:9px; }}
  table.fin td.f-lbl {{ font-weight:bold; background:#f2f2f2; text-align:center;
    width:11%; font-size:9px; }}
  table.fin td.f-num {{ text-align:right; }}
  table.fin tr.tot td {{ font-weight:bold; background:#e8e8e8; }}

  /* Tabla de dos paneles */
  table.two {{ width:100%; border-collapse:collapse; font-size:10px; }}
  table.two td {{ border:1px solid #000; padding:2px 5px; vertical-align:top; }}
  table.two td.lbl {{ font-weight:bold; background:#f2f2f2; white-space:nowrap; }}
  table.two td.num {{ text-align:right; }}

  /* Convenios */
  table.conv {{ width:100%; border-collapse:collapse; font-size:10px; }}
  table.conv th {{ background:#d9d9d9; font-weight:bold; border:1px solid #000;
    padding:2px 5px; text-align:center; }}
  table.conv td {{ border:1px solid #000; padding:2px 5px; }}
  table.conv td.num {{ text-align:right; }}

  /* Fotos — 1 por fila, centradas */
  .fotos-row {{ display:block; margin-top:4px; }}
  .foto-bloque {{ text-align:center; width:80%; margin:0 auto 8px auto; page-break-inside:avoid; }}
  .foto-etiqueta {{ font-weight:bold; font-size:10px; background:#333; color:#fff;
    padding:2px 8px; display:block; border:1px solid #000; border-bottom:0; }}
  img.foto {{ width:100%; max-height:210px; object-fit:contain;
    border:1px solid #000; display:block; }}
  .foto-caption {{ font-size:9px; border:1px solid #000; border-top:0;
    padding:2px 5px; background:#f9f9f9; text-align:left; }}

  /* Firmas */
  .firmas {{ display:flex; justify-content:space-around; margin-top:20px; }}
  .firma-item {{ text-align:center; width:40%; }}
  .firma-linea {{ border-top:1px solid #000; padding-top:3px; font-size:9px; }}
  .firma-cargo {{ font-size:9px; font-weight:bold; text-transform:uppercase; }}

  /* Botón imprimir */
  .no-print {{ text-align:right; padding:6px 10px 2px; }}
  .no-print button {{ background:#333; color:#fff; border:none;
    padding:4px 14px; cursor:pointer; font-size:11px; }}

  /* ══ PRINT ══ */
  @media print {{
    .no-print {{ display:none !important; }}
    @page {{ margin:8mm 8mm; size:letter; }}
    html,body {{ -webkit-print-color-adjust:exact; print-color-adjust:exact; }}
    .foto-bloque {{ page-break-inside:avoid; }}
  }}
</style>
</head>
<body>

<div class='no-print'>
  <button onclick='window.print()'>&#128424; Imprimir / PDF</button>
</div>

<!-- ═══ ENCABEZADO ═══ -->
<div class='page'>
<div class='hdr-wrap'>
  <div class='hdr-inner'>
    <div class='hdr-logo'>
      <img src='{baseUrl}assets/media/logo_chilon.png' alt='Logo'
           onerror=""this.style.visibility='hidden'"">
    </div>
    <div class='hdr-center'>
      <div class='h-titulo'>FICHA TECNICA DE OBRA ( F.I.S.M. )</div>
      <div class='h-ea'>EA.- FISMDF AÑO EN CURSO</div>
    </div>
    <div class='hdr-logo'>
      <img src='{baseUrl}assets/media/escudo.png' alt='Escudo'
           onerror=""this.style.visibility='hidden'"">
    </div>
  </div>
</div>


<!-- DATOS GENERALES -->
<table class='t'>
  <tr>
    <td class='lbl'>MUNICIPIO</td>
    <td style='width:35%'>{claveLocalidad} &nbsp;</td>
    <td class='lbl' style='width:14%'>PROGRAMA</td>
    <td>{programa}</td>
  </tr>
  <tr>
    <td class='lbl'>LOCALIDAD</td>
    <td>{localidad}</td>
    <td class='lbl'>FUENTE FINANC.</td>
    <td>{fuenteFinanciamiento}</td>
  </tr>
  <tr>
    <td class='lbl'>RUBRO</td>
    <td colspan='3'>{rubro}</td>
  </tr>
  <tr>
    <td class='lbl'>OBRA</td>
    <td colspan='3'>{descripcionAccion}</td>
  </tr>
  {(!string.IsNullOrEmpty(oficioreg) || !string.IsNullOrEmpty(numobramun) ?
    $"<tr><td class='lbl'>OFICIO REG.</td><td>{oficioreg}</td>" +
    $"<td class='lbl'>NÚM. OBRA MUN.</td><td>{numobramun}</td></tr>" : "")}
</table>

<!-- SITUACIÓN FINANCIERA -->
<div class='sec-title'>SITUACIÓN FINANCIERA</div>
<table class='fin'>
  <thead>
    <tr>
      <th colspan='2'>INVERSIÓN PROGRAMADA</th>
      <th colspan='2'>INVERSIÓN EJERCIDA</th>
      <th colspan='2'>SALDO</th>
    </tr>
  </thead>
  <tbody>
    {filaFin("FISM",       invProg,   invEjer,   saldoFism)}
    {filaFin("APORTACIÓN", aportProg, aportEjer, aportFism)}
    {filaFin("OTROS",      otrosProg, otrosEjer, otrosSaldo)}
    <tr class='tot'>
      <td class='f-lbl'>TOTAL</td><td class='f-num'>{Fmt(totProg)}</td>
      <td class='f-lbl'>TOTAL</td><td class='f-num'>{Fmt(totEjer)}</td>
      <td class='f-lbl'>TOTAL</td><td class='f-num'>{Fmt(totalSaldo)}</td>
    </tr>
  </tbody>
</table>

<!-- DESCRIPCIÓN + CONTRATO + AVANCES + FECHAS (tabla unificada) -->
<table class='two' style='margin-top:4px'>
  <colgroup>
    <col style='width:50%'>
    <col style='width:25%'>
    <col style='width:25%'>
  </colgroup>
  <tr>
    <td class='lbl' style='border-bottom:0'>Descripción de la Obra</td>
    <td class='lbl'>Número de Contrato</td>
    <td style='font-weight:bold'>{numContrato}</td>
  </tr>
  <tr>
    <td rowspan='5' style='vertical-align:top;border-top:0;line-height:1.4;padding-top:2px'>{descripcionObrafism}</td>
    <td class='lbl'>Número de Dictamen</td>
    <td style='font-weight:bold'>{dictamen}</td>
  </tr>
  <tr>
    <td class='lbl' colspan='2' style='background:#ddd;font-weight:bold;text-align:center'>Avances</td>
  </tr>
  <tr>
    <td class='lbl'>Físico</td>
    <td class='num' style='font-weight:bold'>{avanceFisico:0.00} %</td>
  </tr>
  <tr>
    <td class='lbl'>Financiero</td>
    <td class='num' style='font-weight:bold'>{avanceFinanciero:0.00} %</td>
  </tr>
  <tr>
    <td class='lbl' colspan='2' style='background:#ddd;font-weight:bold;text-align:center'>Programado Real</td>
  </tr>
  <tr>
    <td style='border-top:0'>&nbsp;</td>
    <td class='lbl'>Inicio / Final</td>
    <td style='font-weight:bold'>{fechaInicioProg} / {fechaFinalProg}</td>
  </tr>
</table>

<!-- CONVENIOS MODIFICATORIOS -->
<table class='two' style='margin-top:4px'>
  <tr>
    <td style='width:50%;vertical-align:top;padding:0;border:0'>
      <div class='sec-title' style='margin-top:0'>Convenios Modificatorios</div>
      {(hayConvenios ?
        $@"<table class='conv' style='border-top:0'>
          <thead><tr><th>Tipo</th><th>Importe</th><th>Inicio</th><th>Término</th></tr></thead>
          <tbody>
            {(contratoImp>0?$"<tr><td>Contrato</td><td class='num'>{Fmt(contratoImp)}</td><td>{contratoIni}</td><td>{contratoFin}</td></tr>":"")}
            {(difeImp>0?$"<tr><td>Diferido</td><td class='num'>{Fmt(difeImp)}</td><td>{difeIni}</td><td>{difeFin}</td></tr>":"")}
            {(ampImp>0?$"<tr><td>Ampliación de Plazo</td><td class='num'>{Fmt(ampImp)}</td><td>{ampIni}</td><td>{ampFin}</td></tr>":"")}
          </tbody>
        </table>" :
        "<div style='padding:6px;font-size:10px;color:#666;border:1px solid #000;border-top:0'>Sin convenios modificatorios registrados.</div>"
      )}
    </td>
    <td style='width:50%;vertical-align:top;padding:0;border:0'>
      <div class='sec-title' style='margin-top:0'>Observaciones</div>
      <div style='border:1px solid #000;border-top:0;padding:6px;min-height:60px;font-size:11px'>{observaciones}</div>
    </td>
  </tr>
</table>

<!-- FOTOGRAFÍAS -->
{(listaFotos.Count > 0 ? $@"
<div class='sec-title' style='margin-top:4px'>FOTOGRAFÍA TERMINADA</div>
{fotosHtml}" : "")}

<!-- FIRMAS -->
<div class='firmas'>
  <div class='firma-item'>
    <div style='height:36px'></div>
    <div class='firma-linea'>&nbsp;</div>
    <div class='firma-cargo'>Supervisor de Obra</div>
  </div>
  <div class='firma-item'>
    <div style='height:36px'></div>
    <div class='firma-linea'>&nbsp;</div>
    <div class='firma-cargo'>Director de Obras Públicas Municipales</div>
  </div>
</div>

</div><!-- /page -->
</body>
</html>";

                return new HttpResponseMessage(System.Net.HttpStatusCode.OK)
                {
                    Content = new StringContent(html, System.Text.Encoding.UTF8, "text/html")
                };
            }
            catch (Exception ex)
            {
                return new HttpResponseMessage(System.Net.HttpStatusCode.InternalServerError)
                {
                    Content = new StringContent("Error GenerarFichaFism: " + ex.Message)
                };
            }
        }
        #endregion
    }

    // ─── DTOs para partidas ───────────────────────────────────────────────────
    public class PartidaDto
    {
        public int Orden { get; set; }
        public string Descripcion { get; set; }
    }

    public class GuardarPartidasRequest
    {
        public long IdSeguimiento { get; set; }
        public List<PartidaDto> Partidas { get; set; }
    }

    // ─── DTO para eliminar foto de partida ────────────────────────────────────
    public class EliminarFotoPartidaRequest
    {
        public long IdSeguimiento { get; set; }
        public long IdPartida     { get; set; }
        public int  NumeroFoto    { get; set; }
    }
}

// ════════════════════════════════════════════════════════════════════════════════
//  REPORTE SEGUIMIENTO — endpoint separado del ApiController para devolver HTML
// ════════════════════════════════════════════════════════════════════════════════
namespace Ceduver.Controllers
{
    using System.Text;

    [RoutePrefix("api/Cedula")]
    public class ReporteSeguimientoController : System.Web.Http.ApiController
    {
        private string _cs  = System.Configuration.ConfigurationManager.ConnectionStrings["constr"].ConnectionString;

        [System.Web.Http.HttpGet]
        [System.Web.Http.Route("ReporteSeguimiento/{idSeguimiento}")]
        public System.Net.Http.HttpResponseMessage ReporteSeguimiento(long idSeguimiento)
        {
            try
            {
                // ── 1. Datos del seguimiento + acción + contrato ──────────────────
                dynamic seg    = null;
                dynamic accion = null;
                dynamic contrato = null;

                using (var conn = new System.Data.SqlClient.SqlConnection(_cs))
                {
                    conn.Open();

                    // Seguimiento actual — para obtener IDAcciones, IDobraproyecto, tipo
                    var cmdSeg = new System.Data.SqlClient.SqlCommand(@"
                        SELECT TOP 1 idseguimiento, IDAcciones, IDobraproyecto,
                               descripcionobra, tipo_seguimiento,
                               latitud, longuitud, direccion, referencia
                        FROM TBLP_cedulaseguimiento
                        WHERE idseguimiento = @id", conn);
                    cmdSeg.Parameters.AddWithValue("@id", idSeguimiento);
                    using (var r = cmdSeg.ExecuteReader())
                    {
                        if (r.Read())
                            seg = new {
                                idSeguimiento  = r["idseguimiento"],
                                idAcciones     = r["IDAcciones"],
                                idObraproyecto = r["IDobraproyecto"],
                                descripcionObra= r["descripcionobra"] != DBNull.Value ? r["descripcionobra"].ToString() : "",
                                tipoSeg        = r["tipo_seguimiento"].ToString(),
                                latitud        = r["latitud"]   != DBNull.Value ? r["latitud"].ToString()   : "",
                                longitud       = r["longuitud"] != DBNull.Value ? r["longuitud"].ToString() : "",
                                direccion      = r["direccion"] != DBNull.Value ? r["direccion"].ToString() : "",
                                referencia     = r["referencia"]!= DBNull.Value ? r["referencia"].ToString(): ""
                            };
                    }
                    if (seg == null)
                        return MsgError("Seguimiento no encontrado: " + idSeguimiento);

                    // Leer latitud/longitud/direccion/referencia SIEMPRE del registro tipo='I'
                    // porque esos datos solo se capturan en el inicio de obra
                    if (seg.tipoSeg != "I")
                    {
                        long idAccTemp = Convert.ToInt64(seg.idAcciones);
                        var cmdIni = new System.Data.SqlClient.SqlCommand(@"
                            SELECT TOP 1 latitud, longuitud, direccion, referencia
                            FROM TBLP_cedulaseguimiento
                            WHERE IDAcciones = @ia AND tipo_seguimiento = 'I'", conn);
                        cmdIni.Parameters.AddWithValue("@ia", idAccTemp);
                        using (var ri = cmdIni.ExecuteReader())
                        {
                            if (ri.Read())
                                seg = new {
                                    idSeguimiento  = seg.idSeguimiento,
                                    idAcciones     = seg.idAcciones,
                                    idObraproyecto = seg.idObraproyecto,
                                    descripcionObra= seg.descripcionObra,
                                    tipoSeg        = seg.tipoSeg,
                                    latitud        = ri["latitud"]   != DBNull.Value ? ri["latitud"].ToString()   : "",
                                    longitud       = ri["longuitud"] != DBNull.Value ? ri["longuitud"].ToString() : "",
                                    direccion      = ri["direccion"] != DBNull.Value ? ri["direccion"].ToString() : "",
                                    referencia     = ri["referencia"]!= DBNull.Value ? ri["referencia"].ToString(): ""
                                };
                        }
                    }

                    long idAcc  = Convert.ToInt64(seg.idAcciones);
                    long idObra = Convert.ToInt64(seg.idObraproyecto);

                    // Acción + Obra
                    var cmdAcc = new System.Data.SqlClient.SqlCommand(@"
                        SELECT A.IDAcciones, A.AC_Accion, A.AC_Descripcionaccion,
                               A.Latitud, A.Logintud,
                               A.MNP_Nombre, A.LCL_Nombre, A.descripcionlocalidad,
                               A.IDContrato,
                               P.OP_NombreObra
                        FROM TblD_Acciones A
                        INNER JOIN TBLP_Obraproyecto P ON A.IDobraproyecto = P.IDobraproyecto
                        WHERE A.IDAcciones = @id", conn);
                    cmdAcc.Parameters.AddWithValue("@id", idAcc);
                    using (var r = cmdAcc.ExecuteReader())
                    {
                        if (r.Read())
                            accion = new {
                                accion          = r["AC_Accion"] != DBNull.Value ? r["AC_Accion"].ToString() : "",
                                descripcion     = r["AC_Descripcionaccion"] != DBNull.Value ? r["AC_Descripcionaccion"].ToString() : "",
                                latitud         = r["Latitud"] != DBNull.Value ? r["Latitud"].ToString() : "",
                                longitud        = r["Logintud"] != DBNull.Value ? r["Logintud"].ToString() : "",
                                municipio       = r["MNP_Nombre"] != DBNull.Value ? r["MNP_Nombre"].ToString() : "",
                                localidad       = r["LCL_Nombre"] != DBNull.Value ? r["LCL_Nombre"].ToString() : "",
                                descLocalidad   = r["descripcionlocalidad"] != DBNull.Value ? r["descripcionlocalidad"].ToString() : "",
                                idContrato      = r["IDContrato"] != DBNull.Value ? r["IDContrato"].ToString() : "0",
                                nombreObra      = r["OP_NombreObra"] != DBNull.Value ? r["OP_NombreObra"].ToString() : ""
                            };
                    }
                    if (accion == null)
                        return MsgError("No se encontró la acción para el seguimiento.");

                    // Contrato
                    if (!string.IsNullOrEmpty(accion.idContrato) && accion.idContrato != "0")
                    {
                        var cmdCon = new System.Data.SqlClient.SqlCommand(@"
                            SELECT CON_Contrato,
                                   CONVERT(varchar,CON_Inicio,103) as CON_Inicio,
                                   CONVERT(varchar,CON_Final,103)  as CON_Final,
                                   CON_Montocontratado
                            FROM TBLD_Contrato WHERE IDContrato = @id", conn);
                        cmdCon.Parameters.AddWithValue("@id", Convert.ToInt64(accion.idContrato));
                        using (var r = cmdCon.ExecuteReader())
                        {
                            if (r.Read())
                                contrato = new {
                                    folio  = r["CON_Contrato"] != DBNull.Value ? r["CON_Contrato"].ToString() : "",
                                    inicio = r["CON_Inicio"]   != DBNull.Value ? r["CON_Inicio"].ToString()   : "",
                                    fin    = r["CON_Final"]    != DBNull.Value ? r["CON_Final"].ToString()    : "",
                                    monto  = r["CON_Montocontratado"] != DBNull.Value
                                             ? Convert.ToDecimal(r["CON_Montocontratado"])
                                             : 0m
                                };
                        }
                    }
                    if (contrato == null)
                        contrato = new { folio = "", inicio = "", fin = "", monto = 0m };

                    // ── 2. Partidas del seguimiento inicio (tipo='I') ─────────────
                    long idSegInicio = idSeguimiento;
                    var cmdSI = new System.Data.SqlClient.SqlCommand(@"
                        SELECT TOP 1 idseguimiento FROM TBLP_cedulaseguimiento
                        WHERE IDAcciones=@ia AND tipo_seguimiento='I'", conn);
                    cmdSI.Parameters.AddWithValue("@ia", idAcc);
                    var siObj = cmdSI.ExecuteScalar();
                    if (siObj != null) idSegInicio = Convert.ToInt64(siObj);

                    var partidas = new System.Collections.Generic.List<dynamic>();
                    var cmdPart = new System.Data.SqlClient.SqlCommand(@"
                        SELECT p.idpartida, p.orden, p.descripcion
                        FROM TBLP_cedula_partidas p
                        WHERE p.idseguimiento = @isi
                        ORDER BY p.orden", conn);
                    cmdPart.Parameters.AddWithValue("@isi", idSegInicio);
                    using (var r = cmdPart.ExecuteReader())
                    {
                        while (r.Read())
                            partidas.Add(new {
                                idPartida   = Convert.ToInt64(r["idpartida"]),
                                orden       = r["orden"] != DBNull.Value ? Convert.ToInt32(r["orden"]) : 0,
                                descripcion = r["descripcion"] != DBNull.Value ? r["descripcion"].ToString() : ""
                            });
                    }

                    // ── 3. Fotos de cada partida para este seguimiento ─────────────
                    var fotos = new System.Collections.Generic.Dictionary<long,
                                    System.Collections.Generic.List<dynamic>>();
                    if (partidas.Count > 0)
                    {
                        var ids = string.Join(",", partidas.Select(p => p.idPartida.ToString()));
                        var cmdFoto = new System.Data.SqlClient.SqlCommand(@"
                            SELECT idpartida, numero_foto, ruta_foto, descripcion, latitud, longitud
                            FROM TBLP_cedula_partidas_fotos
                            WHERE idseguimiento = @is AND idpartida IN (" + ids + @")
                            ORDER BY idpartida, numero_foto", conn);
                        cmdFoto.Parameters.AddWithValue("@is", idSeguimiento);
                        using (var r = cmdFoto.ExecuteReader())
                        {
                            while (r.Read())
                            {
                                long pid = Convert.ToInt64(r["idpartida"]);
                                if (!fotos.ContainsKey(pid))
                                    fotos[pid] = new System.Collections.Generic.List<dynamic>();
                                fotos[pid].Add(new {
                                    numFoto     = Convert.ToInt32(r["numero_foto"]),
                                    ruta        = r["ruta_foto"] != DBNull.Value ? r["ruta_foto"].ToString() : "",
                                    descripcion = r["descripcion"] != DBNull.Value ? r["descripcion"].ToString() : "",
                                    latitud     = r["latitud"] != DBNull.Value ? r["latitud"].ToString() : "",
                                    longitud    = r["longitud"] != DBNull.Value ? r["longitud"].ToString() : ""
                                });
                            }
                        }
                    }

                    // ── 4. Construir HTML ─────────────────────────────────────────
                    string tipoLabel = seg.tipoSeg == "I" ? "INICIO" : (seg.tipoSeg == "F" ? "FINAL" : "SEGUIMIENTO");
                    string monto     = ((decimal)contrato.monto).ToString("C2", new System.Globalization.CultureInfo("es-MX"));
                    string fechaGen  = DateTime.Now.ToString("dd 'de' MMMM 'de' yyyy", new System.Globalization.CultureInfo("es-MX"));
                    string nombreObra = (accion.nombreObra + " " + accion.accion).Trim();

                    // Helper para convertir ruta ~/Uploads/... → URL web /Uploads/...
                    Func<string,string> toUrl = (ruta) => {
                        var u = (ruta ?? "").Trim();
                        if (u.StartsWith("~/")) u = u.Substring(2);
                        if (u.Length > 0 && u[0] != '/') u = "/" + u;
                        return u;
                    };

                    var sb = new StringBuilder();
                    sb.AppendLine("<!DOCTYPE html><html lang='es'><head>");
                    sb.AppendLine("<meta charset='UTF-8'><meta name='viewport' content='width=device-width,initial-scale=1'>");
                    sb.AppendLine("<title>Reporte de Seguimiento</title>");
                    sb.AppendLine(@"<style>
/* Color principal: verde institucional del logo de Chilón */
:root {
    --c-primary:   #1a6b3a;
    --c-primary2:  #145530;
    --c-accent:    #e8a020;
    --c-light:     #eef6f1;
    --c-border:    #c3dccb;
    --c-text:      #0f2d1a;
    --c-muted:     #5a7a65;
}
*, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
body { font-family: 'Segoe UI', Arial, sans-serif; font-size: 13px; color: #222; background: #f0f4f2; }
@media print {
    @page { margin: 10mm 12mm; size: letter; }
    /* Elimina encabezado y pie de página del navegador (fecha, URL, título) */
    html { -webkit-print-color-adjust: exact; }
    head { display: none; }
    body { background: #fff !important; -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; color-adjust: exact !important; }
    .no-print { display: none !important; }
    .badge-tipo { display: none !important; }
    .page { box-shadow: none !important; margin: 0 !important; border-radius: 0 !important; max-width: 100% !important; }
    .partida-card { page-break-inside: avoid !important; break-inside: avoid !important; }
    .header { -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; }
    .header-strip { -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; }
    .obra-nombre { -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; }
    .info-title { -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; }
    .partida-header { -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; }
    .partida-num { -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; }
    .seccion-foto-titulo { -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; }
    .footer { -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; }
}
.page {
    max-width: 900px; margin: 20px auto; background: #fff;
    border-radius: 8px; box-shadow: 0 2px 16px rgba(0,0,0,.12);
    overflow: hidden;
}
/* ── ENCABEZADO ── */
.header {
    background: linear-gradient(135deg, var(--c-primary2) 0%, var(--c-primary) 60%, var(--c-primary2) 100%);
    color: #fff; padding: 0;
}
.header-inner { display: flex; align-items: center; padding: 18px 28px; gap: 20px; }
.header-logos { display: flex; gap: 12px; align-items: center; }
.header-logos img { height: 72px; width: auto; object-fit: contain; filter: drop-shadow(0 1px 3px rgba(0,0,0,.4)); }
.header-text { flex: 1; text-align: center; }
.header-text .ayuntamiento { font-size: 15px; font-weight: 700; letter-spacing: .5px; line-height: 1.3; text-transform: uppercase; }
.header-text .periodo { font-size: 12px; margin-top: 4px; opacity: .88; }
.header-strip {
    background: var(--c-accent); color: #fff; text-align: center;
    font-size: 12px; font-weight: 700; letter-spacing: 1px;
    padding: 6px 20px; text-transform: uppercase;
}
/* ── CUERPO ── */
.body { padding: 12px 24px; }
.badge-tipo {
    display: inline-block; background: var(--c-primary); color: #fff;
    font-size: 11px; font-weight: 700; letter-spacing: 1px;
    padding: 2px 10px; border-radius: 20px; margin-bottom: 10px;
    text-transform: uppercase;
}
/* Info principal */
.info-card {
    background: var(--c-light); border: 1px solid var(--c-border); border-radius: 6px;
    padding: 10px 14px; margin-bottom: 10px;
}
.info-title {
    font-size: 10px; font-weight: 700; color: var(--c-primary);
    text-transform: uppercase; letter-spacing: .8px; margin-bottom: 6px;
    border-bottom: 2px solid var(--c-primary); padding-bottom: 3px;
}
.info-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 6px 20px; }
.info-grid.cols3 { grid-template-columns: 1fr 1fr 1fr; }
.info-item label { display: block; font-size: 10px; color: var(--c-muted); font-weight: 600; text-transform: uppercase; letter-spacing: .5px; margin-bottom: 1px; }
.info-item .val { font-size: 12px; font-weight: 500; color: var(--c-text); }
.info-item.span2 { grid-column: span 2; }
.info-item.span3 { grid-column: span 3; }
/* Nombre obra grande */
.obra-nombre {
    background: var(--c-primary); color: #fff;
    border-radius: 6px; padding: 10px 16px; margin-bottom: 10px;
}
.obra-nombre label { font-size: 10px; font-weight: 700; letter-spacing: .8px; opacity: .8; text-transform: uppercase; }
.obra-nombre .val { font-size: 13px; font-weight: 700; margin-top: 3px; }
/* Reporte fotográfico */
.seccion-foto-titulo {
    background: var(--c-primary2); color: #fff;
    font-size: 11px; font-weight: 700; letter-spacing: 1px;
    text-transform: uppercase; padding: 6px 14px;
    border-radius: 6px; margin: 10px 0 8px;
}
.partida-card {
    border: 1px solid var(--c-border); border-radius: 6px;
    margin-bottom: 10px; overflow: hidden;
    page-break-inside: avoid; break-inside: avoid;
}
.partida-header {
    background: var(--c-light); border-bottom: 1px solid var(--c-border);
    padding: 7px 12px; display: flex; align-items: center; gap: 8px;
}
.partida-num {
    background: var(--c-primary); color: #fff;
    font-size: 10px; font-weight: 700; white-space: nowrap;
    padding: 3px 9px; border-radius: 10px; flex-shrink: 0;
}
.partida-desc { font-size: 12px; font-weight: 600; color: var(--c-text); }
.fotos-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 0; }
.foto-slot { padding: 8px 12px; border-right: 1px solid var(--c-border); }
.foto-slot:last-child { border-right: none; }
.foto-slot img {
    width: 100%; height: 170px; object-fit: cover;
    border-radius: 4px; border: 1px solid var(--c-border);
    display: block;
}
.foto-placeholder {
    width: 100%; height: 170px; border-radius: 4px;
    border: 2px dashed var(--c-border); background: var(--c-light);
    display: flex; align-items: center; justify-content: center;
    color: #aab0c0; font-size: 11px;
}
.foto-label { font-size: 10px; font-weight: 600; color: var(--c-muted); text-transform: uppercase; letter-spacing: .4px; margin-bottom: 4px; }
.foto-desc { font-size: 11px; color: #444; margin-top: 4px; }
.foto-coords { font-size: 10px; color: var(--c-muted); margin-top: 2px; }
/* Footer */
.footer {
    background: var(--c-light); border-top: 2px solid var(--c-border);
    text-align: center; padding: 12px 20px;
    font-size: 11px; color: var(--c-muted);
}
/* Botón imprimir */
.print-btn {
    display: block; margin: 18px auto 0; width: fit-content;
    background: var(--c-primary); color: #fff; border: none;
    padding: 10px 30px; border-radius: 6px; font-size: 14px;
    cursor: pointer; font-weight: 600; letter-spacing: .5px;
}
.print-btn:hover { background: var(--c-primary2); }
</style>");
                    sb.AppendLine("</head><body>");
                    sb.AppendLine("<div class='page'>");

                    // ── ENCABEZADO ──
                    sb.AppendLine("<div class='header'>");
                    sb.AppendLine("<div class='header-inner'>");
                    sb.AppendLine("<div class='header-logos'>");
                    // Logos (rutas estáticas del proyecto)
                    sb.AppendLine("  <img src='/assets/media/escudo.png' alt='Escudo Chil&oacute;n' onerror=\"this.style.display='none'\">");
                    sb.AppendLine("  <img src='/assets/media/logo_chilon.png' alt='Logo Chil&oacute;n' onerror=\"this.style.display='none'\">");
                    sb.AppendLine("</div>");
                    sb.AppendLine("<div class='header-text'>");
                    sb.AppendLine("  <div class='ayuntamiento'>H. Ayuntamiento Municipal de Chil&oacute;n, Chiapas</div>");
                    sb.AppendLine("  <div class='periodo'>2024 &ndash; 2027</div>");
                    sb.AppendLine("</div>");
                    sb.AppendLine("</div>"); // header-inner
                    sb.AppendLine("<div class='header-strip'>C&eacute;dula de Verificaci&oacute;n y Seguimiento &mdash; Reporte Fotogr&aacute;fico</div>");
                    sb.AppendLine("</div>"); // header

                    // ── CUERPO ──
                    sb.AppendLine("<div class='body'>");
                    sb.AppendLine($"<div class='badge-tipo'>Tipo de Visita: {tipoLabel}</div>");

                    // Nombre de la obra
                    sb.AppendLine("<div class='obra-nombre'>");
                    sb.AppendLine("  <label>Nombre de la Obra</label>");
                    sb.AppendLine($"  <div class='val'>{System.Web.HttpUtility.HtmlEncode(nombreObra)}</div>");
                    sb.AppendLine("</div>");

                    // Card principal — folio + datos generales
                    sb.AppendLine("<div class='info-card'>");
                    sb.AppendLine("<div class='info-title'>Datos Generales</div>");
                    sb.AppendLine("<div class='info-grid cols3'>");
                    sb.AppendLine($"<div class='info-item'><label>Folio / N&uacute;m. Contrato</label><div class='val'>{System.Web.HttpUtility.HtmlEncode(contrato.folio)}</div></div>");
                    sb.AppendLine($"<div class='info-item'><label>Estado</label><div class='val'>Chiapas</div></div>");
                    sb.AppendLine($"<div class='info-item'><label>Municipio</label><div class='val'>{System.Web.HttpUtility.HtmlEncode(accion.municipio)}</div></div>");
                    sb.AppendLine($"<div class='info-item'><label>Localidad</label><div class='val'>{System.Web.HttpUtility.HtmlEncode(accion.localidad)}</div></div>");
                    // Latitud y Longitud: primero del seguimiento inicio, fallback a acción
                    string latRep = !string.IsNullOrWhiteSpace(seg.latitud)  ? seg.latitud  : accion.latitud;
                    string lonRep = !string.IsNullOrWhiteSpace(seg.longitud) ? seg.longitud : accion.longitud;
                    // Descripción ubicación: direccion (Dirección Específica del inicio) → referencia → descLocalidad de acción → descripcionObra
                    string descUbicRep = !string.IsNullOrWhiteSpace(seg.direccion)
                                         ? seg.direccion
                                         : (!string.IsNullOrWhiteSpace(seg.referencia)
                                            ? seg.referencia
                                            : (!string.IsNullOrWhiteSpace(accion.descLocalidad)
                                               ? accion.descLocalidad
                                               : seg.descripcionObra));
                    sb.AppendLine($"<div class='info-item'><label>Latitud</label><div class='val'>{System.Web.HttpUtility.HtmlEncode(latRep)}</div></div>");
                    sb.AppendLine($"<div class='info-item'><label>Longitud</label><div class='val'>{System.Web.HttpUtility.HtmlEncode(lonRep)}</div></div>");
                    if (!string.IsNullOrWhiteSpace(descUbicRep))
                    {
                        sb.AppendLine($"<div class='info-item span3'><label>Descripci&oacute;n de Ubicaci&oacute;n</label><div class='val'>{System.Web.HttpUtility.HtmlEncode(descUbicRep)}</div></div>");
                    }
                    // Referencia adicional si existe
                    if (!string.IsNullOrWhiteSpace(seg.referencia))
                    {
                        sb.AppendLine($"<div class='info-item span3'><label>Referencia</label><div class='val'>{System.Web.HttpUtility.HtmlEncode(seg.referencia)}</div></div>");
                    }
                    sb.AppendLine("</div>");  // info-grid
                    sb.AppendLine("</div>");  // info-card

                    // Card contrato — fechas y monto
                    sb.AppendLine("<div class='info-card'>");
                    sb.AppendLine("<div class='info-title'>Datos del Contrato</div>");
                    sb.AppendLine("<div class='info-grid cols3'>");
                    sb.AppendLine($"<div class='info-item'><label>Fecha de Inicio</label><div class='val'>{System.Web.HttpUtility.HtmlEncode(contrato.inicio)}</div></div>");
                    sb.AppendLine($"<div class='info-item'><label>Fecha de Conclusi&oacute;n</label><div class='val'>{System.Web.HttpUtility.HtmlEncode(contrato.fin)}</div></div>");
                    sb.AppendLine($"<div class='info-item'><label>Monto Total del Proyecto</label><div class='val'>{monto}</div></div>");
                    sb.AppendLine("</div>");
                    sb.AppendLine("</div>");

                    // ── REPORTE FOTOGRÁFICO ──
                    sb.AppendLine("<div class='seccion-foto-titulo'>&#128247;&nbsp; Reporte Fotogr&aacute;fico</div>");

                    if (partidas.Count == 0)
                    {
                        sb.AppendLine("<p style='color:#888;font-size:13px;text-align:center;padding:20px 0'>Sin partidas registradas.</p>");
                    }
                    else
                    {
                        foreach (var p in partidas)
                        {
                            long pid = (long)p.idPartida;
                            sb.AppendLine("<div class='partida-card'>");
                            sb.AppendLine("<div class='partida-header'>");
                            sb.AppendLine($"  <div class='partida-num'>Partida {p.orden}</div>");
                            sb.AppendLine($"  <div class='partida-desc'>{System.Web.HttpUtility.HtmlEncode(p.descripcion)}</div>");
                            sb.AppendLine("</div>");
                            sb.AppendLine("<div class='fotos-grid'>");

                            for (int nf = 1; nf <= 2; nf++)
                            {
                                dynamic foto = null;
                                if (fotos.ContainsKey(pid))
                                    foto = fotos[pid].FirstOrDefault(f => f.numFoto == nf);

                                sb.AppendLine("<div class='foto-slot'>");
                                sb.AppendLine($"<div class='foto-label'>Foto {nf}</div>");
                                if (foto != null && !string.IsNullOrEmpty(foto.ruta))
                                {
                                    string url = toUrl(foto.ruta);
                                    sb.AppendLine($"<img src='{url}' alt='Foto {nf}'>");
                                    if (!string.IsNullOrEmpty(foto.descripcion))
                                        sb.AppendLine($"<div class='foto-desc'>{System.Web.HttpUtility.HtmlEncode(foto.descripcion)}</div>");
                                    if (!string.IsNullOrEmpty(foto.latitud) || !string.IsNullOrEmpty(foto.longitud))
                                        sb.AppendLine($"<div class='foto-coords'>📍 {foto.latitud}, {foto.longitud}</div>");
                                }
                                else
                                {
                                    sb.AppendLine("<div class='foto-placeholder'>Sin foto</div>");
                                }
                                sb.AppendLine("</div>"); // foto-slot
                            }

                            sb.AppendLine("</div>"); // fotos-grid
                            sb.AppendLine("</div>"); // partida-card
                        }
                    }

                    sb.AppendLine("</div>"); // body

                    // ── FOOTER ──
                    sb.AppendLine($"<div class='footer'>Reporte generado el {fechaGen} &nbsp;|&nbsp; H. Ayuntamiento Municipal de Chil&oacute;n, Chiapas 2024&ndash;2027</div>");
                    sb.AppendLine("</div>"); // page

                    // Botón imprimir
                    sb.AppendLine("<div class='no-print' style='text-align:center;padding:12px 0 8px'>");
                    sb.AppendLine("<button class='print-btn' onclick='window.print()'>🖨️ Imprimir / Guardar PDF</button>");
                    sb.AppendLine("<p style='margin-top:8px;font-size:11px;color:#888;padding-bottom:16px'>Tip: en el di&aacute;logo de impresi&oacute;n desactiva <b>Encabezados y pies de p&aacute;gina</b> para quitar la fecha y URL del navegador.</p>");
                    sb.AppendLine("</div>");

                    sb.AppendLine("</body></html>");

                    var response = Request.CreateResponse(System.Net.HttpStatusCode.OK);
                    response.Content = new System.Net.Http.StringContent(
                        sb.ToString(), Encoding.UTF8, "text/html");
                    return response;
                }
            }
            catch (Exception ex)
            {
                return MsgError("Error generando reporte: " + ex.Message);
            }
        }

        private System.Net.Http.HttpResponseMessage MsgError(string msg)
        {
            var html = $"<!DOCTYPE html><html><body style='font-family:Arial;padding:40px;color:#c00'><h3>Error</h3><p>{System.Web.HttpUtility.HtmlEncode(msg)}</p></body></html>";
            var r = Request.CreateResponse(System.Net.HttpStatusCode.InternalServerError);
            r.Content = new System.Net.Http.StringContent(html, Encoding.UTF8, "text/html");
            return r;
        }
    }

    // ══════════════════════════════════════════════════════════════════════
    //  REPORTE FINAL — igual que seguimiento pero con encabezado "Final"
    // ══════════════════════════════════════════════════════════════════════
    [System.Web.Http.RoutePrefix("api/Cedula")]
    public class ReporteFinalController : System.Web.Http.ApiController
    {
        private string _cs = System.Configuration.ConfigurationManager.ConnectionStrings["constr"].ConnectionString;

        [System.Web.Http.HttpGet]
        [System.Web.Http.Route("ReporteFinal/{idSeguimiento}")]
        public System.Net.Http.HttpResponseMessage ReporteFinal(long idSeguimiento)
        {
            try
            {
                dynamic seg    = null;
                dynamic accion = null;
                dynamic contrato = null;

                using (var conn = new System.Data.SqlClient.SqlConnection(_cs))
                {
                    conn.Open();

                    var cmdSeg = new System.Data.SqlClient.SqlCommand(@"
                        SELECT TOP 1 idseguimiento, IDAcciones, IDobraproyecto,
                               descripcionobra, tipo_seguimiento,
                               latitud, longuitud, direccion, referencia
                        FROM TBLP_cedulaseguimiento
                        WHERE idseguimiento = @id", conn);
                    cmdSeg.Parameters.AddWithValue("@id", idSeguimiento);
                    using (var r = cmdSeg.ExecuteReader())
                    {
                        if (r.Read())
                            seg = new {
                                idSeguimiento  = r["idseguimiento"],
                                idAcciones     = r["IDAcciones"],
                                idObraproyecto = r["IDobraproyecto"],
                                descripcionObra= r["descripcionobra"] != DBNull.Value ? r["descripcionobra"].ToString() : "",
                                tipoSeg        = r["tipo_seguimiento"].ToString(),
                                latitud        = r["latitud"]   != DBNull.Value ? r["latitud"].ToString()   : "",
                                longitud       = r["longuitud"] != DBNull.Value ? r["longuitud"].ToString() : "",
                                direccion      = r["direccion"] != DBNull.Value ? r["direccion"].ToString() : "",
                                referencia     = r["referencia"]!= DBNull.Value ? r["referencia"].ToString(): ""
                            };
                    }
                    if (seg == null)
                        return MsgErrorF("Registro final no encontrado: " + idSeguimiento);

                    // Tomar lat/lon/dirección siempre del tipo='I'
                    long idAcc  = Convert.ToInt64(seg.idAcciones);
                    var cmdIni = new System.Data.SqlClient.SqlCommand(@"
                        SELECT TOP 1 latitud, longuitud, direccion, referencia
                        FROM TBLP_cedulaseguimiento
                        WHERE IDAcciones = @ia AND tipo_seguimiento = 'I'", conn);
                    cmdIni.Parameters.AddWithValue("@ia", idAcc);
                    using (var ri = cmdIni.ExecuteReader())
                    {
                        if (ri.Read())
                            seg = new {
                                idSeguimiento  = seg.idSeguimiento,
                                idAcciones     = seg.idAcciones,
                                idObraproyecto = seg.idObraproyecto,
                                descripcionObra= seg.descripcionObra,
                                tipoSeg        = seg.tipoSeg,
                                latitud        = ri["latitud"]   != DBNull.Value ? ri["latitud"].ToString()   : "",
                                longitud       = ri["longuitud"] != DBNull.Value ? ri["longuitud"].ToString() : "",
                                direccion      = ri["direccion"] != DBNull.Value ? ri["direccion"].ToString() : "",
                                referencia     = ri["referencia"]!= DBNull.Value ? ri["referencia"].ToString(): ""
                            };
                    }

                    long idObra = Convert.ToInt64(seg.idObraproyecto);

                    var cmdAcc = new System.Data.SqlClient.SqlCommand(@"
                        SELECT A.IDAcciones, A.AC_Accion, A.AC_Descripcionaccion,
                               A.Latitud, A.Logintud,
                               A.MNP_Nombre, A.LCL_Nombre, A.descripcionlocalidad,
                               A.IDContrato,
                               P.OP_NombreObra
                        FROM TblD_Acciones A
                        INNER JOIN TBLP_Obraproyecto P ON A.IDobraproyecto = P.IDobraproyecto
                        WHERE A.IDAcciones = @id", conn);
                    cmdAcc.Parameters.AddWithValue("@id", idAcc);
                    using (var r = cmdAcc.ExecuteReader())
                    {
                        if (r.Read())
                            accion = new {
                                accion        = r["AC_Accion"] != DBNull.Value ? r["AC_Accion"].ToString() : "",
                                descripcion   = r["AC_Descripcionaccion"] != DBNull.Value ? r["AC_Descripcionaccion"].ToString() : "",
                                latitud       = r["Latitud"] != DBNull.Value ? r["Latitud"].ToString() : "",
                                longitud      = r["Logintud"] != DBNull.Value ? r["Logintud"].ToString() : "",
                                municipio     = r["MNP_Nombre"] != DBNull.Value ? r["MNP_Nombre"].ToString() : "",
                                localidad     = r["LCL_Nombre"] != DBNull.Value ? r["LCL_Nombre"].ToString() : "",
                                descLocalidad = r["descripcionlocalidad"] != DBNull.Value ? r["descripcionlocalidad"].ToString() : "",
                                idContrato    = r["IDContrato"] != DBNull.Value ? r["IDContrato"].ToString() : "0",
                                nombreObra    = r["OP_NombreObra"] != DBNull.Value ? r["OP_NombreObra"].ToString() : ""
                            };
                    }
                    if (accion == null)
                        return MsgErrorF("No se encontró la acción.");

                    if (!string.IsNullOrEmpty(accion.idContrato) && accion.idContrato != "0")
                    {
                        var cmdCon = new System.Data.SqlClient.SqlCommand(@"
                            SELECT CON_Contrato,
                                   CONVERT(varchar,CON_Inicio,103) as CON_Inicio,
                                   CONVERT(varchar,CON_Final,103)  as CON_Final,
                                   CON_Montocontratado
                            FROM TBLD_Contrato WHERE IDContrato = @id", conn);
                        cmdCon.Parameters.AddWithValue("@id", Convert.ToInt64(accion.idContrato));
                        using (var r = cmdCon.ExecuteReader())
                        {
                            if (r.Read())
                                contrato = new {
                                    folio  = r["CON_Contrato"] != DBNull.Value ? r["CON_Contrato"].ToString() : "",
                                    inicio = r["CON_Inicio"]   != DBNull.Value ? r["CON_Inicio"].ToString()   : "",
                                    fin    = r["CON_Final"]    != DBNull.Value ? r["CON_Final"].ToString()    : "",
                                    monto  = r["CON_Montocontratado"] != DBNull.Value
                                             ? Convert.ToDecimal(r["CON_Montocontratado"]) : 0m
                                };
                        }
                    }
                    if (contrato == null)
                        contrato = new { folio = "", inicio = "", fin = "", monto = 0m };

                    // Partidas del inicio
                    long idSegInicio = idSeguimiento;
                    var cmdSI = new System.Data.SqlClient.SqlCommand(@"
                        SELECT TOP 1 idseguimiento FROM TBLP_cedulaseguimiento
                        WHERE IDAcciones=@ia AND tipo_seguimiento='I'", conn);
                    cmdSI.Parameters.AddWithValue("@ia", idAcc);
                    var siObj = cmdSI.ExecuteScalar();
                    if (siObj != null) idSegInicio = Convert.ToInt64(siObj);

                    var partidas = new System.Collections.Generic.List<dynamic>();
                    var cmdPart = new System.Data.SqlClient.SqlCommand(@"
                        SELECT p.idpartida, p.orden, p.descripcion
                        FROM TBLP_cedula_partidas p
                        WHERE p.idseguimiento = @isi
                        ORDER BY p.orden", conn);
                    cmdPart.Parameters.AddWithValue("@isi", idSegInicio);
                    using (var r = cmdPart.ExecuteReader())
                    {
                        while (r.Read())
                            partidas.Add(new {
                                idPartida   = Convert.ToInt64(r["idpartida"]),
                                orden       = r["orden"] != DBNull.Value ? Convert.ToInt32(r["orden"]) : 0,
                                descripcion = r["descripcion"] != DBNull.Value ? r["descripcion"].ToString() : ""
                            });
                    }

                    // Fotos del registro FINAL (idSeguimiento = tipo F)
                    var fotos = new System.Collections.Generic.Dictionary<long,
                                    System.Collections.Generic.List<dynamic>>();
                    if (partidas.Count > 0)
                    {
                        var ids = string.Join(",", partidas.Select(p => p.idPartida.ToString()));
                        var cmdFoto = new System.Data.SqlClient.SqlCommand(@"
                            SELECT idpartida, numero_foto, ruta_foto, descripcion, latitud, longitud
                            FROM TBLP_cedula_partidas_fotos
                            WHERE idseguimiento = @is AND idpartida IN (" + ids + @")
                            ORDER BY idpartida, numero_foto", conn);
                        cmdFoto.Parameters.AddWithValue("@is", idSeguimiento);
                        using (var r = cmdFoto.ExecuteReader())
                        {
                            while (r.Read())
                            {
                                long pid = Convert.ToInt64(r["idpartida"]);
                                if (!fotos.ContainsKey(pid))
                                    fotos[pid] = new System.Collections.Generic.List<dynamic>();
                                fotos[pid].Add(new {
                                    numFoto     = Convert.ToInt32(r["numero_foto"]),
                                    ruta        = r["ruta_foto"] != DBNull.Value ? r["ruta_foto"].ToString() : "",
                                    descripcion = r["descripcion"] != DBNull.Value ? r["descripcion"].ToString() : "",
                                    latitud     = r["latitud"] != DBNull.Value ? r["latitud"].ToString() : "",
                                    longitud    = r["longitud"] != DBNull.Value ? r["longitud"].ToString() : ""
                                });
                            }
                        }
                    }

                    // ── Construir HTML ────────────────────────────────────────────
                    string monto     = ((decimal)contrato.monto).ToString("C2", new System.Globalization.CultureInfo("es-MX"));
                    string fechaGen  = DateTime.Now.ToString("dd 'de' MMMM 'de' yyyy", new System.Globalization.CultureInfo("es-MX"));
                    string nombreObra = (accion.nombreObra + " " + accion.accion).Trim();
                    Func<string,string> toUrl = (ruta) => {
                        var u = (ruta ?? "").Trim();
                        if (u.StartsWith("~/")) u = u.Substring(2);
                        if (u.Length > 0 && u[0] != '/') u = "/" + u;
                        return u;
                    };

                    var sb = new StringBuilder();
                    sb.AppendLine("<!DOCTYPE html><html lang='es'><head>");
                    sb.AppendLine("<meta charset='UTF-8'><meta name='viewport' content='width=device-width,initial-scale=1'>");
                    sb.AppendLine("<title>Reporte Final</title>");
                    sb.AppendLine(@"<style>
:root { --c-primary:#1a6b3a; --c-primary2:#145530; --c-accent:#e8a020; --c-light:#eef6f1; --c-border:#c3dccb; --c-text:#0f2d1a; --c-muted:#5a7a65; }
*, *::before, *::after { box-sizing:border-box; margin:0; padding:0; }
body { font-family:'Segoe UI',Arial,sans-serif; font-size:13px; color:#222; background:#f0f4f2; }
@media print {
    @page { margin:10mm 12mm; size:letter; }
    html { -webkit-print-color-adjust:exact; }
    body { background:#fff !important; -webkit-print-color-adjust:exact !important; print-color-adjust:exact !important; color-adjust:exact !important; }
    .no-print { display:none !important; }
    .badge-tipo { display:none !important; }
    .page { box-shadow:none !important; margin:0 !important; border-radius:0 !important; max-width:100% !important; }
    .partida-card { page-break-inside:avoid !important; break-inside:avoid !important; }
    .header,.header-strip,.obra-nombre,.info-title,.partida-header,.partida-num,.seccion-foto-titulo,.footer
        { -webkit-print-color-adjust:exact !important; print-color-adjust:exact !important; }
}
.page { max-width:900px; margin:20px auto; background:#fff; border-radius:8px; box-shadow:0 2px 16px rgba(0,0,0,.12); overflow:hidden; }
.header { background:linear-gradient(135deg,var(--c-primary2) 0%,var(--c-primary) 60%,var(--c-primary2) 100%); color:#fff; padding:0; }
.header-inner { display:flex; align-items:center; padding:18px 28px; gap:20px; }
.header-logos { display:flex; gap:12px; align-items:center; }
.header-logos img { height:72px; width:auto; object-fit:contain; filter:drop-shadow(0 1px 3px rgba(0,0,0,.4)); }
.header-text { flex:1; text-align:center; }
.header-text .ayuntamiento { font-size:15px; font-weight:700; letter-spacing:.5px; line-height:1.3; text-transform:uppercase; }
.header-text .periodo { font-size:12px; margin-top:4px; opacity:.88; }
.header-strip { background:var(--c-accent); color:#fff; text-align:center; font-size:12px; font-weight:700; letter-spacing:1px; padding:6px 20px; text-transform:uppercase; }
.body { padding:12px 24px; }
.badge-tipo { display:inline-block; background:var(--c-primary); color:#fff; font-size:11px; font-weight:700; letter-spacing:1px; padding:2px 10px; border-radius:20px; margin-bottom:10px; text-transform:uppercase; }
.info-card { background:var(--c-light); border:1px solid var(--c-border); border-radius:6px; padding:10px 14px; margin-bottom:10px; }
.info-title { font-size:10px; font-weight:700; color:var(--c-primary); text-transform:uppercase; letter-spacing:.8px; margin-bottom:6px; border-bottom:2px solid var(--c-primary); padding-bottom:3px; }
.info-grid { display:grid; grid-template-columns:1fr 1fr; gap:6px 20px; }
.info-grid.cols3 { grid-template-columns:1fr 1fr 1fr; }
.info-item label { display:block; font-size:10px; color:var(--c-muted); font-weight:600; text-transform:uppercase; letter-spacing:.5px; margin-bottom:1px; }
.info-item .val { font-size:12px; font-weight:500; color:var(--c-text); }
.info-item.span2 { grid-column:span 2; }
.info-item.span3 { grid-column:span 3; }
.obra-nombre { background:var(--c-primary); color:#fff; border-radius:6px; padding:10px 16px; margin-bottom:10px; }
.obra-nombre label { font-size:10px; font-weight:700; letter-spacing:.8px; opacity:.8; text-transform:uppercase; }
.obra-nombre .val { font-size:13px; font-weight:700; margin-top:3px; }
.seccion-foto-titulo { background:var(--c-primary2); color:#fff; font-size:11px; font-weight:700; letter-spacing:1px; text-transform:uppercase; padding:6px 14px; border-radius:6px; margin:10px 0 8px; }
.partida-card { border:1px solid var(--c-border); border-radius:6px; margin-bottom:10px; overflow:hidden; page-break-inside:avoid; break-inside:avoid; }
.partida-header { background:var(--c-light); border-bottom:1px solid var(--c-border); padding:7px 12px; display:flex; align-items:center; gap:8px; }
.partida-num { background:var(--c-primary); color:#fff; font-size:10px; font-weight:700; white-space:nowrap; padding:3px 9px; border-radius:10px; flex-shrink:0; }
.partida-desc { font-size:12px; font-weight:600; color:var(--c-text); }
.fotos-grid { display:grid; grid-template-columns:1fr 1fr; gap:0; }
.foto-slot { padding:8px 12px; border-right:1px solid var(--c-border); }
.foto-slot:last-child { border-right:none; }
.foto-slot img { width:100%; height:170px; object-fit:cover; border-radius:4px; border:1px solid var(--c-border); display:block; }
.foto-placeholder { width:100%; height:170px; border-radius:4px; border:2px dashed var(--c-border); background:var(--c-light); display:flex; align-items:center; justify-content:center; color:#aab0c0; font-size:11px; }
.foto-label { font-size:10px; font-weight:600; color:var(--c-muted); text-transform:uppercase; letter-spacing:.4px; margin-bottom:4px; }
.foto-desc { font-size:11px; color:#444; margin-top:4px; }
.foto-coords { font-size:10px; color:var(--c-muted); margin-top:2px; }
.footer { background:var(--c-light); border-top:2px solid var(--c-border); text-align:center; padding:12px 20px; font-size:11px; color:var(--c-muted); }
.print-btn { display:block; margin:18px auto 0; width:fit-content; background:var(--c-primary); color:#fff; border:none; padding:10px 30px; border-radius:6px; font-size:14px; cursor:pointer; font-weight:600; letter-spacing:.5px; }
.print-btn:hover { background:var(--c-primary2); }
</style>");
                    sb.AppendLine("</head><body><div class='page'>");

                    // Encabezado — solo cambia el texto del strip
                    sb.AppendLine("<div class='header'><div class='header-inner'>");
                    sb.AppendLine("<div class='header-logos'>");
                    sb.AppendLine("  <img src='/assets/media/escudo.png' alt='Escudo' onerror=\"this.style.display='none'\">");
                    sb.AppendLine("  <img src='/assets/media/logo_chilon.png' alt='Logo' onerror=\"this.style.display='none'\">");
                    sb.AppendLine("</div>");
                    sb.AppendLine("<div class='header-text'>");
                    sb.AppendLine("  <div class='ayuntamiento'>H. Ayuntamiento Municipal de Chil&oacute;n, Chiapas</div>");
                    sb.AppendLine("  <div class='periodo'>2024 &ndash; 2027</div>");
                    sb.AppendLine("</div></div>"); // header-inner
                    sb.AppendLine("<div class='header-strip'>C&eacute;dula de Verificaci&oacute;n Final &mdash; Reporte Fotogr&aacute;fico</div>");
                    sb.AppendLine("</div>"); // header

                    sb.AppendLine("<div class='body'>");
                    sb.AppendLine("<div class='badge-tipo'>Tipo de Visita: FINAL</div>");

                    sb.AppendLine("<div class='obra-nombre'>");
                    sb.AppendLine("  <label>Nombre de la Obra</label>");
                    sb.AppendLine($"  <div class='val'>{System.Web.HttpUtility.HtmlEncode(nombreObra)}</div>");
                    sb.AppendLine("</div>");

                    sb.AppendLine("<div class='info-card'><div class='info-title'>Datos Generales</div><div class='info-grid cols3'>");
                    sb.AppendLine($"<div class='info-item'><label>Folio / N&uacute;m. Contrato</label><div class='val'>{System.Web.HttpUtility.HtmlEncode(contrato.folio)}</div></div>");
                    sb.AppendLine($"<div class='info-item'><label>Estado</label><div class='val'>Chiapas</div></div>");
                    sb.AppendLine($"<div class='info-item'><label>Municipio</label><div class='val'>{System.Web.HttpUtility.HtmlEncode(accion.municipio)}</div></div>");
                    sb.AppendLine($"<div class='info-item'><label>Localidad</label><div class='val'>{System.Web.HttpUtility.HtmlEncode(accion.localidad)}</div></div>");
                    string latRep  = !string.IsNullOrWhiteSpace(seg.latitud)  ? seg.latitud  : accion.latitud;
                    string lonRep  = !string.IsNullOrWhiteSpace(seg.longitud) ? seg.longitud : accion.longitud;
                    string descUbic = !string.IsNullOrWhiteSpace(seg.direccion) ? seg.direccion
                                     : (!string.IsNullOrWhiteSpace(seg.referencia) ? seg.referencia
                                        : (!string.IsNullOrWhiteSpace(accion.descLocalidad) ? accion.descLocalidad
                                           : seg.descripcionObra));
                    sb.AppendLine($"<div class='info-item'><label>Latitud</label><div class='val'>{System.Web.HttpUtility.HtmlEncode(latRep)}</div></div>");
                    sb.AppendLine($"<div class='info-item'><label>Longitud</label><div class='val'>{System.Web.HttpUtility.HtmlEncode(lonRep)}</div></div>");
                    if (!string.IsNullOrWhiteSpace(descUbic))
                        sb.AppendLine($"<div class='info-item span3'><label>Descripci&oacute;n de Ubicaci&oacute;n</label><div class='val'>{System.Web.HttpUtility.HtmlEncode(descUbic)}</div></div>");
                    if (!string.IsNullOrWhiteSpace(seg.referencia))
                        sb.AppendLine($"<div class='info-item span3'><label>Referencia</label><div class='val'>{System.Web.HttpUtility.HtmlEncode(seg.referencia)}</div></div>");
                    sb.AppendLine("</div></div>"); // info-grid + info-card

                    sb.AppendLine("<div class='info-card'><div class='info-title'>Datos del Contrato</div><div class='info-grid cols3'>");
                    sb.AppendLine($"<div class='info-item'><label>Fecha de Inicio</label><div class='val'>{System.Web.HttpUtility.HtmlEncode(contrato.inicio)}</div></div>");
                    sb.AppendLine($"<div class='info-item'><label>Fecha de Conclusi&oacute;n</label><div class='val'>{System.Web.HttpUtility.HtmlEncode(contrato.fin)}</div></div>");
                    sb.AppendLine($"<div class='info-item'><label>Monto Total del Proyecto</label><div class='val'>{monto}</div></div>");
                    sb.AppendLine("</div></div>"); // info-grid + info-card

                    sb.AppendLine("<div class='seccion-foto-titulo'>&#128247;&nbsp; Reporte Fotogr&aacute;fico</div>");

                    if (partidas.Count == 0)
                    {
                        sb.AppendLine("<p style='color:#888;font-size:13px;text-align:center;padding:20px 0'>Sin partidas registradas.</p>");
                    }
                    else
                    {
                        foreach (var p in partidas)
                        {
                            long pid = (long)p.idPartida;
                            sb.AppendLine("<div class='partida-card'><div class='partida-header'>");
                            sb.AppendLine($"  <div class='partida-num'>Partida {p.orden}</div>");
                            sb.AppendLine($"  <div class='partida-desc'>{System.Web.HttpUtility.HtmlEncode(p.descripcion)}</div>");
                            sb.AppendLine("</div><div class='fotos-grid'>");
                            for (int nf = 1; nf <= 2; nf++)
                            {
                                dynamic foto = null;
                                if (fotos.ContainsKey(pid))
                                    foto = fotos[pid].FirstOrDefault(f => f.numFoto == nf);
                                sb.AppendLine("<div class='foto-slot'>");
                                sb.AppendLine($"<div class='foto-label'>Foto {nf}</div>");
                                if (foto != null && !string.IsNullOrEmpty(foto.ruta))
                                {
                                    string url = toUrl(foto.ruta);
                                    sb.AppendLine($"<img src='{url}' alt='Foto {nf}'>");
                                    if (!string.IsNullOrEmpty(foto.descripcion))
                                        sb.AppendLine($"<div class='foto-desc'>{System.Web.HttpUtility.HtmlEncode(foto.descripcion)}</div>");
                                    if (!string.IsNullOrEmpty(foto.latitud) || !string.IsNullOrEmpty(foto.longitud))
                                        sb.AppendLine($"<div class='foto-coords'>📍 {foto.latitud}, {foto.longitud}</div>");
                                }
                                else
                                {
                                    sb.AppendLine("<div class='foto-placeholder'>Sin foto</div>");
                                }
                                sb.AppendLine("</div>"); // foto-slot
                            }
                            sb.AppendLine("</div></div>"); // fotos-grid + partida-card
                        }
                    }

                    sb.AppendLine("</div>"); // body
                    sb.AppendLine($"<div class='footer'>Reporte generado el {fechaGen} &nbsp;|&nbsp; H. Ayuntamiento Municipal de Chil&oacute;n, Chiapas 2024&ndash;2027</div>");
                    sb.AppendLine("</div>"); // page
                    sb.AppendLine("<div class='no-print' style='text-align:center;padding:12px 0 8px'>");
                    sb.AppendLine("<button class='print-btn' onclick='window.print()'>🖨️ Imprimir / Guardar PDF</button>");
                    sb.AppendLine("<p style='margin-top:8px;font-size:11px;color:#888;padding-bottom:16px'>Tip: desactiva <b>Encabezados y pies de p&aacute;gina</b> en el di&aacute;logo de impresi&oacute;n.</p>");
                    sb.AppendLine("</div>");
                    sb.AppendLine("</body></html>");

                    var response = Request.CreateResponse(System.Net.HttpStatusCode.OK);
                    response.Content = new System.Net.Http.StringContent(sb.ToString(), Encoding.UTF8, "text/html");
                    return response;
                }
            }
            catch (Exception ex)
            {
                return MsgErrorF("Error generando reporte final: " + ex.Message);
            }
        }

        private System.Net.Http.HttpResponseMessage MsgErrorF(string msg)
        {
            var html = $"<!DOCTYPE html><html><body style='font-family:Arial;padding:40px;color:#c00'><h3>Error</h3><p>{System.Web.HttpUtility.HtmlEncode(msg)}</p></body></html>";
            var r = Request.CreateResponse(System.Net.HttpStatusCode.InternalServerError);
            r.Content = new System.Net.Http.StringContent(html, Encoding.UTF8, "text/html");
            return r;
        }
    }
}

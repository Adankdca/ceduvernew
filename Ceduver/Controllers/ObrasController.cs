using Ceduver.Models;
using Dapper;
using System;
using System.Collections.Generic;
using System.Configuration;
using System.Data.SqlClient;
using System.Linq;
using System.Web.Http;
using System.Windows.Media.Media3D;
using static Ceduver.Models.ModelObra;

namespace Ceduver.Controllers
{
    [RoutePrefix("api/Obras")]
    public class ObrasController : ApiController
    {
        private readonly string _connectionString = ConfigurationManager.ConnectionStrings["constr"].ToString();

        // ══════════════════════════════════════════════════════════════════
        // GET OBRAS — consulta unificada con parámetros opcionales
        // VS2005 tenía 6 funciones distintas (Contrato, Nombreobra,
        // Obrageneral, OP, Obrageneralrubrosubrubro…) que se simplifican
        // en una sola query con WHERE dinámico.
        // ══════════════════════════════════════════════════════════════════
        [HttpGet]
        [Route("getObras")]
        public IHttpActionResult GetObras(
            string rubro = "",
            string anio = "",
            string contrato = "",
            string nombre = "",
            string numObra = "")
        {
            try
            {
                using (var con = new SqlConnection(_connectionString))
                {
                    // ── NOTA IMPORTANTE ──────────────────────────────────────
                    // VS2005 usaba INNER JOIN obligatorio con TblD_Acciones y
                    // TBLD_Contrato, lo que excluía obras sin contrato al filtrar
                    // por contrato. Aquí usamos LEFT JOIN siempre y filtramos
                    // sólo cuando el parámetro llega con valor.
                    // El filtro por AÑO usa dbo.Añoinversion() igual que VS2005.
                    // ─────────────────────────────────────────────────────────

                    //string sql = @"
                    //SELECT DISTINCT
                    //    O.IDobraproyecto                                            AS idobra,
                    //    O.OP_Num_obra                                               AS noObra,
                    //    O.OP_NombreObra                                             AS nombre,
                    //    S.PRO_Nombre                                                AS subrubro,
                    //    ISNULL(TRY_CAST(dbo.Añoinversion(O.IDobraproyecto, 'm') AS DECIMAL(18,2)),0) AS municipal,
                    //    ISNULL(TRY_CAST(dbo.Añoinversion(O.IDobraproyecto, 'e') AS DECIMAL(18,2)),0) AS estatal,
                    //    ISNULL(TRY_CAST(dbo.Añoinversion(O.IDobraproyecto, 'f') AS DECIMAL(18,2)),0) AS federal,
                    //    ISNULL(TRY_CAST(dbo.Añoinversion(O.IDobraproyecto, 't') AS DECIMAL(18,2)),0) AS total,
                    //    dbo.FinanciamientoObraproyecto(O.IDobraproyecto, 0)        AS finanto,
                    //    dbo.localidadObraproyecto(O.IDobraproyecto)                AS localidad,
                    //    dbo.ConteoAcciones(O.IDobraproyecto)                       AS numAcciones
                    //FROM TBLP_Obraproyecto O
                    //LEFT  JOIN TblD_Acciones  A ON O.IDobraproyecto = A.IDobraproyecto
                    //LEFT  JOIN TBLD_Contrato  C ON A.IDContrato  = C.IDContrato
                    //INNER JOIN TBLC_Subrubro  S ON O.IDPrograma  = S.IDPrograma

                    //WHERE O.OP_Eliminado = 0

                    //-- FILTRO RUBRO
                    //AND (@rubro IS NULL OR @rubro = '' OR O.IDRubro = @rubro)

                    //-- 🔥 FILTRO AÑO (CORREGIDO)
                    //AND (@anio IS NULL OR @anio = '' OR EXISTS (
                    //    SELECT 1
                    //    FROM TBLD_añoobraproyecto ap
                    //    WHERE ap.IDObraproyecto = O.IDobraproyecto
                    //        AND ap.OP_Año = @anio
                    //))

                    //-- FILTRO CONTRATO
                    //AND (@contrato IS NULL OR @contrato = '' OR 
                    //        (C.CON_Contrato IS NOT NULL AND C.CON_Contrato LIKE '%' + @contrato + '%'))

                    //-- FILTRO NOMBRE
                    //AND (@nombre IS NULL OR @nombre = '' OR 
                    //        O.OP_NombreObra LIKE '%' + @nombre + '%')

                    //-- FILTRO NUM OBRA
                    //AND (@numObra IS NULL OR @numObra = '' OR 
                    //        O.OP_Num_obra LIKE '%' + @numObra + '%')

                    //ORDER BY O.IDobraproyecto DESC;";

                    //string sql = @"SELECT
                    //                o.IDobraproyecto,
                    //                o.OP_Num_obra,
                    //                o.OP_NombreObra,

                    //                r.Rub_Nombre AS rubro,
                    //                s.PRO_Nombre AS subrubro,

                    //                ISNULL(SUM(a.OP_InversioMunicipal),0) AS municipal,
                    //                ISNULL(SUM(a.OP_InversionEstatal),0) AS estatal,
                    //                ISNULL(SUM(a.OP_InversionFederal),0) AS federal,

                    //                ISNULL(
                    //                    SUM(
                    //                        ISNULL(a.OP_InversioMunicipal,0) +
                    //                        ISNULL(a.OP_InversionEstatal,0) +
                    //                        ISNULL(a.OP_InversionFederal,0)
                    //                    ),0
                    //                ) AS total

                    //            FROM TBLP_Obraproyecto o

                    //            LEFT JOIN TBLC_Rubros r
                    //                ON r.IDRubro = o.IDRubro

                    //            LEFT JOIN TBLC_Subrubro s
                    //                ON s.IDPrograma = o.IDPrograma

                    //            LEFT JOIN TBLD_añoobraproyecto a
                    //                ON a.IDObraproyecto = o.IDobraproyecto

                    //            GROUP BY
                    //                o.IDobraproyecto,
                    //                o.OP_Num_obra,
                    //                o.OP_NombreObra,
                    //                r.Rub_Nombre,
                    //                s.PRO_Nombre;";
                    con.Open();
                    string sql = @"

                                SELECT
                                    O.IDobraproyecto                              AS idobra,
                                    O.OP_Num_obra                                 AS noObra,
                                    O.OP_NombreObra                               AS nombre,
                                    S.PRO_Nombre                                  AS subrubro,
                                    ISNULL((
                                    SELECT STUFF((
                                        SELECT ', ' + CAST(AP2.OP_Año AS nvarchar(10))
                                        FROM TBLD_añoobraproyecto AP2
                                        WHERE AP2.IDObraproyecto = O.IDobraproyecto
                                        FOR XML PATH('')
                                    ), 1, 2, '')
                                   ), '')                                            AS anio,

                                    ISNULL(SUM(AINV.OP_InversioMunicipal),0)      AS municipal,
                                    ISNULL(SUM(AINV.OP_InversionEstatal),0)       AS estatal,
                                    ISNULL(SUM(AINV.OP_InversionFederal),0)       AS federal,

                                    ISNULL(
                                        SUM(
                                            ISNULL(AINV.OP_InversioMunicipal,0) +
                                            ISNULL(AINV.OP_InversionEstatal,0) +
                                            ISNULL(AINV.OP_InversionFederal,0)
                                        ),0
                                    )                                             AS total,

                                    dbo.FinanciamientoObraproyecto(O.IDobraproyecto, 0) AS finanto,
                                    dbo.localidadObraproyecto(O.IDobraproyecto)         AS localidad,
                                    dbo.ConteoAcciones(O.IDobraproyecto)                AS numAcciones

                                FROM TBLP_Obraproyecto O

                                LEFT JOIN TblD_Acciones AC
                                    ON O.IDobraproyecto = AC.IDobraproyecto

                                LEFT JOIN TBLD_Contrato C
                                    ON AC.IDContrato = C.IDContrato

                                INNER JOIN TBLC_Subrubro S
                                    ON O.IDPrograma = S.IDPrograma

                                LEFT JOIN TBLD_añoobraproyecto AINV
                                    ON O.IDobraproyecto = AINV.IDObraproyecto

                                WHERE ISNULL(O.OP_Eliminado,0) = 0

                                -- FILTRO RUBRO
                                AND (@rubro IS NULL OR @rubro = '' OR O.IDRubro = @rubro)

                                -- FILTRO AÑO
                                AND (
                                    @anio IS NULL
                                    OR @anio = ''
                                    OR EXISTS (
                                        SELECT 1
                                        FROM TBLD_añoobraproyecto AP
                                        WHERE AP.IDObraproyecto = O.IDobraproyecto
                                        AND AP.OP_Año = @anio
                                    )
                                )

                                -- FILTRO CONTRATO
                                AND (
                                    @contrato IS NULL
                                    OR @contrato = ''
                                    OR (
                                        C.CON_Contrato IS NOT NULL
                                        AND C.CON_Contrato LIKE '%' + @contrato + '%'
                                    )
                                )

                                -- FILTRO NOMBRE
                                AND (
                                    @nombre IS NULL
                                    OR @nombre = ''
                                    OR O.OP_NombreObra LIKE '%' + @nombre + '%'
                                )

                                -- FILTRO NUM OBRA
                                AND (
                                    @numObra IS NULL
                                    OR @numObra = ''
                                    OR O.OP_Num_obra LIKE '%' + @numObra + '%'
                                )

                                GROUP BY
                                    O.IDobraproyecto,
                                    O.OP_Num_obra,
                                    O.OP_NombreObra,
                                    S.PRO_Nombre

                                ORDER BY O.IDobraproyecto DESC";

                    var lista = con.Query<ObraDTO>(sql,
                        new { rubro, anio, contrato, nombre, numObra }).ToList();

                    return Ok(lista);
                }
            }
            catch (Exception ex)
            {
                return InternalServerError(ex);
            }
        }

        [HttpPost]
        [Route("guardarObra")]
        public IHttpActionResult GuardarObra(ModelObra.ObraSaveDTO m)
        {
            try
            {
                using (var con = new SqlConnection(_connectionString))
                {
                    con.Open();
                    if (m.idobra == 0)
                    {
                        string sql = @"
                        INSERT INTO TBLP_Obraproyecto
                        (
                            IDRubro,
                            OP_Num_obra,
                            OP_NombreObra,
                            IDPrograma,
                            IDprogram,
                            IDArea,

                            OP_Antecendentes,
                            OP_Observaciones,
                            OP_Acciones,

                            IDtipoejecucion,
                            OP_ProyectoEstrategico,
                            OP_Letrero,
                            IDNivel,
                            OP_Beneficiados,
                            OP_Autorizada,
                            OP_Eliminado,

                            Op_Franjafronteriza,
                            IdNivelmarginacion,
                            IDaprima,
                            OP_FechaCreacion
                        )
                        VALUES
                        (
                            @idRubro,
                            @noObra,
                            @nombre,
                            @idSubrubro,
                            @idPrograma,
                            @idArea,

                            @antecedentes,
                            @observaciones,
                            @acciones,

                            1,0,0,15,0,0,0,

                            @franja,
                            @idNivelMarginacion,
                            @idAprima,
                            GETDATE()
                        );

                        SELECT CAST(SCOPE_IDENTITY() as int);";

                                var id = con.Query<int>(sql, new
                                {
                                    m.idRubro,
                                    m.noObra,
                                    nombre = m.nombre?.ToUpper(),
                                    m.idSubrubro,
                                    m.idPrograma,
                                    m.idArea,
                                    antecedentes = m.antecedentes?.ToUpper(),
                                    observaciones = m.observaciones?.ToUpper(),
                                    m.acciones,
                                    m.franja,
                                    m.idNivelMarginacion,
                                    m.idAprima
                                }).First();

                                return Ok(new { success = true, id });
                    }
                    else
                    {
                        string sql = @"
                        UPDATE TBLP_Obraproyecto SET
                            OP_Num_obra = @noObra,
                            OP_NombreObra = @nombre,
                            IDRubro = @idRubro,
                            IDPrograma = @idSubrubro,
                            IDprogram = @idPrograma,
                            IDArea = @idArea,

                            OP_Antecendentes = @antecedentes,
                            OP_Observaciones = @observaciones,
                            OP_Acciones = @acciones,

                            Op_Franjafronteriza = @franja,
                            IdNivelmarginacion = @idNivelMarginacion,
                            IDaprima = @idAprima

                        WHERE IDobraproyecto = @idobra";

                                con.Execute(sql, new
                                {
                                    m.idobra,
                                    m.idRubro,
                                    m.noObra,
                                    nombre = m.nombre?.ToUpper(),
                                    m.idSubrubro,
                                    m.idPrograma,
                                    m.idArea,
                                    antecedentes = m.antecedentes?.ToUpper(),
                                    observaciones = m.observaciones?.ToUpper(),
                                    m.acciones,
                                    m.franja,
                                    m.idNivelMarginacion,
                                    m.idAprima
                                });

                                return Ok(new { success = true });
                    }
                }
            }
            catch (Exception ex)
            {
                return InternalServerError(ex);
            }
        }

        [HttpGet]
        [Route("getObraById/{id}")]
        public IHttpActionResult GetObraById(int id)
        {
            using (var con = new SqlConnection(_connectionString))
            {
                con.Open();
                string sql = @"
        SELECT
            IDobraproyecto      AS idobra,
            OP_Num_obra         AS noObra,
            OP_NombreObra       AS nombre,

            IDRubro             AS idRubro,
            IDPrograma          AS idSubrubro,
            IDprogram           AS idPrograma,
            IDArea              AS idArea,

            IdNivelmarginacion  AS idMarginacion,
            IDaprima          AS idTipoObra,

            OP_Antecendentes    AS antecedentes,
            OP_Observaciones    AS observaciones,

            OP_Acciones         AS acciones,
            Op_Franjafronteriza AS franja

        FROM TBLP_Obraproyecto
        WHERE IDobraproyecto = @id";

                var data = con.QueryFirstOrDefault(sql, new { id });

                return Ok(data);
            }
        }
        // ══════════════════════════════════════════════════════════════════
        // AUTOCOMPLETE — Contratos
        // Devuelve lista de números de contrato que coincidan con el término
        // ══════════════════════════════════════════════════════════════════
        [HttpGet]
        [Route("getContratosAutocomplete")]
        public IHttpActionResult GetContratosAutocomplete(string term = "")
        {
            try
            {
                using (var con = new SqlConnection(_connectionString))
                {
                    con.Open();
                    string sql = @"
                        SELECT DISTINCT TOP 20 C.CON_Contrato AS valor
                        FROM TBLD_Contrato C
                        WHERE C.CON_Contrato LIKE '%' + @term + '%'
                          AND C.CON_Contrato IS NOT NULL
                          AND C.CON_Contrato <> ''
                        ORDER BY C.CON_Contrato ASC";

                    var lista = con.Query<string>(sql, new { term }).ToList();
                    return Ok(lista);
                }
            }
            catch (Exception ex)
            {
                return InternalServerError(ex);
            }
        }

        // ══════════════════════════════════════════════════════════════════
        // AUTOCOMPLETE — Número de Obra
        // ══════════════════════════════════════════════════════════════════
        [HttpGet]
        [Route("getNumObrasAutocomplete")]
        public IHttpActionResult GetNumObrasAutocomplete(string term = "")
        {
            try
            {
                using (var con = new SqlConnection(_connectionString))
                {
                    con.Open();
                    string sql = @"
                        SELECT DISTINCT TOP 20 O.OP_Num_obra AS valor
                        FROM TBLP_Obraproyecto O
                        WHERE O.OP_Num_obra LIKE '%' + @term + '%'
                          AND O.OP_Num_obra IS NOT NULL
                          AND O.OP_Num_obra <> ''
                          AND O.OP_Eliminado = 0
                        ORDER BY O.OP_Num_obra ASC";

                    var lista = con.Query<string>(sql, new { term }).ToList();
                    return Ok(lista);
                }
            }
            catch (Exception ex)
            {
                return InternalServerError(ex);
            }
        }

        // ══════════════════════════════════════════════════════════════════
        // AUTOCOMPLETE — Nombre de Obra  (faltaba en VS2026 vs VS2005)
        // ══════════════════════════════════════════════════════════════════
        [HttpGet]
        [Route("getNombresAutocomplete")]
        public IHttpActionResult GetNombresAutocomplete(string term = "")
        {
            try
            {
                using (var con = new SqlConnection(_connectionString))
                {
                    con.Open();
                    string sql = @"
                        SELECT DISTINCT TOP 20 O.OP_NombreObra AS valor
                        FROM TBLP_Obraproyecto O
                        WHERE O.OP_NombreObra LIKE '%' + @term + '%'
                          AND O.OP_NombreObra IS NOT NULL
                          AND O.OP_NombreObra <> ''
                          AND O.OP_Eliminado = 0
                        ORDER BY O.OP_NombreObra ASC";

                    var lista = con.Query<string>(sql, new { term }).ToList();
                    return Ok(lista);
                }
            }
            catch (Exception ex)
            {
                return InternalServerError(ex);
            }
        }

        // ══════════════════════════════════════════════════════════════════
        // CATÁLOGOS
        // ══════════════════════════════════════════════════════════════════
        [HttpGet]
        [Route("getRubros")]
        public IHttpActionResult GetRubros()
        {
            try
            {
                using (var con = new SqlConnection(_connectionString))
                {
                    con.Open();
                    // Excluimos registros con nombre (SELECCIONE) o similares que son datos de catálogo inválidos
                    string sql = "SELECT IDRubro AS Id, Rub_Nombre AS Nombre FROM TBLC_Rubros WHERE Rub_Nombre NOT LIKE '%(SELECCIONE)%'  ORDER BY Rub_Nombre ASC";
                    var lista = con.Query<CatalogoDTO>(sql).ToList();
                    return Ok(lista);
                }
            }
            catch (Exception ex) { return InternalServerError(ex); }
        }

        [HttpGet]
        [Route("getAnios")]
        public IHttpActionResult GetAnios()
        {
            try
            {
                using (var con = new SqlConnection(_connectionString))
                {
                    con.Open();
                    string sql = "SELECT Año AS Id, Año AS Nombre FROM TBlC_Año WHERE Año NOT LIKE '%(SELECCIONE)%' ORDER BY Año DESC";
                    var lista = con.Query<CatalogoDTO>(sql).ToList();
                    return Ok(lista);
                }
            }
            catch (Exception ex) { return InternalServerError(ex); }
        }

        [HttpGet]
        [Route("getSubrubros/{idRubro}")]
        public IHttpActionResult GetSubrubros(int idRubro)
        {
            using (var con = new SqlConnection(_connectionString))
            {
                con.Open();
                var sql = @"
            SELECT 
                IDPrograma AS Id,
                PRO_Nombre AS Nombre
            FROM TBLC_Subrubro
            WHERE IDRubro = @idRubro and PRO_Nombre NOT LIKE '%(SELECCIONE)%'
            ORDER BY PRO_Nombre";

                var lista = con.Query<ModelObra.CatalogoDTO>(sql, new { idRubro }).ToList();

                return Ok(lista);
            }
        }

        [HttpGet]
        [Route("getProgramas")]
        public IHttpActionResult GetProgramas()
        {
            using (var db = new SqlConnection(_connectionString))
            {
                db.Open();
                var data = db.Query<CatalogoDTO>(
                    "SELECT IDprogram AS Id, claveprograma AS Nombre FROM TblC_Programa WHERE claveprograma NOT LIKE '%(SELECCIONE)%'  ORDER BY claveprograma"
                ).ToList();

                return Ok(data);
            }
        }

        [HttpGet]
        [Route("getAreas")]
        public IHttpActionResult GetAreas()
        {
            using (var db = new SqlConnection(_connectionString))
            {
                db.Open();
                var data = db.Query<CatalogoDTO>(
                    "SELECT IDliderproyecto AS Id, NombreLider AS Nombre FROM TblC_Liderproyecto WHERE NombreLider NOT LIKE '%(SELECCIONE)%' ORDER BY NombreLider"
                ).ToList();

                return Ok(data);
            }
        }

        [HttpGet]
        [Route("getMarginacion")]
        public IHttpActionResult GetMarginacion()
        {
            using (var db = new SqlConnection(_connectionString))
            {
                db.Open();
                var data = db.Query<CatalogoDTO>(
                    "SELECT IdNivelmarginacion AS Id, NM_Descripcion AS Nombre FROM TblC_Nivelmarginacion WHERE NM_Descripcion NOT LIKE '%(SELECCIONE)%' ORDER BY NM_Descripcion"
                ).ToList();

                return Ok(data);
            }
        }

        [HttpGet]
        [Route("getTipoObra")]
        public IHttpActionResult GetTipoObra()
        {
            using (var db = new SqlConnection(_connectionString))
            {
                db.Open();
                var data = db.Query<CatalogoDTO>(
                    "SELECT IDaprima AS Id, AprimaNombre AS Nombre FROM TblC_Normalesnocontratadas WHERE AprimaNombre NOT LIKE '%(SELECCIONE)%' ORDER BY AprimaNombre"
                ).ToList();

                return Ok(data);
            }
        }

        [HttpGet]
        [Route("getAreasByRubro/{idRubro}")]
        public IHttpActionResult GetAreasByRubro(int idRubro)
        {
            using (var db = new SqlConnection(_connectionString))
            {
                db.Open();
                var data = db.Query<CatalogoDTO>(
                    @"SELECT IDliderproyecto AS Id, NombreLider AS Nombre 
              FROM TblC_Liderproyecto 
              WHERE (IDRubro = @id OR IDRubro = 0)
              ORDER BY NombreLider",
                    new { id = idRubro }
                ).ToList();

                return Ok(data);
            }
        }
        // ══════════════════════════════════════════════════════════════════
        // ELIMINAR (soft delete)
        // ══════════════════════════════════════════════════════════════════
        [HttpDelete]
        [Route("eliminarObra/{idobra}")]
        public IHttpActionResult EliminarObra(int idobra)
        {
            try
            {
                using (var conn = new SqlConnection(_connectionString))
                {
                    conn.Open();

                    // ── 1. VALIDAR: no se puede eliminar si tiene contrato asignado ──
                    // Igual que VS2005: verifica que no exista acción con IDContrato > 0
                    var tieneContrato = conn.ExecuteScalar<int>(@"
                        SELECT COUNT(*)
                        FROM TBLP_Obraproyecto OP
                        INNER JOIN TblD_Acciones AC
                            ON OP.IDobraproyecto = AC.IDobraproyecto
                           AND AC.IDContrato > 0
                        WHERE OP.IDobraproyecto = @id",
                        new { id = idobra });

                    if (tieneContrato > 0)
                        return BadRequest("No se puede eliminar: la obra tiene un contrato asignado.");

                    // ── 2. HISTORIAL: copia el registro antes de eliminarlo ──
                    // IDUsuario = 1 temporal hasta integrar módulo de usuarios
                    conn.Execute(@"
                        INSERT INTO TBLH_Obraproyecto
                        (IDobraproyecto, IDRubro, IDPrograma, IDRubrosciudadesestrategicas, IDArea,
                         IDtipoejecucion, IDciudadesrurales, OP_Num_obra, OP_NombreObra,
                         OP_Beneficiados, OP_ciudadesestrategicas, OP_ProyectoEstrategico, OP_Letrero,
                         OP_PeriodoEjecucionPrograminicial, OP_PeriodoEjecucionProgramfinal,
                         OP_PeriodoEjecucionReprograminicial, OP_PeriodoEjecucionReprogramfinal,
                         OP_PeriodoEjecucionRealinicial, OP_PeriodoEjecucionRealfinal,
                         OP_FechaEntrega, OP_PeriodoInauguracion, OP_FichaTecnica,
                         OP_Antecendentes, OP_Observaciones, IDNivel, OP_CCT, OP_NombreEscuela,
                         Op_Obra, OP_Aula, OP_Laboratorio, OP_Taller, OP_Anexo, OP_Acciones,
                         OP_Eliminado, idobraaccess, OP_Autorizada, OP_Oficlibrec, OP_Archivooficlibrec,
                         OP_Oficdisppresup, OP_ArchivoOficdisppresup, Op_Franjafronteriza,
                         OP_Periodoejecucioncodecom, OP_Empresacodecom, IdNivelmarginacion,
                         OP_idh, OP_Codecom, OP_Ciudadesrurales, OP_ObrasRelevantes,
                         OP_Poa, IDprogram, OP_Oficrecurso, OP_Archivooficrecurso,
                         OP_Oficdictamen, OP_Archivooficdictamen, IDaprima, Siahe,
                         IDtipoobra, Idsecretariaconvenio, IDInstanciaeje, IDInstanciaval,
                         IDStatusobra, OP_Proyecto, OP_FechaCreacion, OP_Concertado,
                         OP_Descripcion, OP_Minuta, OP_ActaCabildo, OP_ConstanciaMayoria,
                         OP_Nombramientos, OP_Presidente, OP_Sindico, OP_Tesorero,
                         OP_Secretario, OP_DirectorObrasPublicas, OP_RepAsambleaBarrio,
                         OP_Contrato, OP_Contratista, IDSubRubroEspecifico,
                         IDUsuario, FechaAccion, Accion)
                        SELECT
                         IDobraproyecto, IDRubro, IDPrograma, IDRubrosciudadesestrategicas, IDArea,
                         IDtipoejecucion, IDciudadesrurales, OP_Num_obra, OP_NombreObra,
                         OP_Beneficiados, OP_ciudadesestrategicas, OP_ProyectoEstrategico, OP_Letrero,
                         OP_PeriodoEjecucionPrograminicial, OP_PeriodoEjecucionProgramfinal,
                         OP_PeriodoEjecucionReprograminicial, OP_PeriodoEjecucionReprogramfinal,
                         OP_PeriodoEjecucionRealinicial, OP_PeriodoEjecucionRealfinal,
                         OP_FechaEntrega, OP_PeriodoInauguracion, OP_FichaTecnica,
                         OP_Antecendentes, OP_Observaciones, IDNivel, OP_CCT, OP_NombreEscuela,
                         Op_Obra, OP_Aula, OP_Laboratorio, OP_Taller, OP_Anexo, OP_Acciones,
                         OP_Eliminado, idobraaccess, OP_Autorizada, OP_Oficlibrec, OP_Archivooficlibrec,
                         OP_Oficdisppresup, OP_ArchivoOficdisppresup, Op_Franjafronteriza,
                         OP_Periodoejecucioncodecom, OP_Empresacodecom, IdNivelmarginacion,
                         OP_idh, OP_Codecom, OP_Ciudadesrurales, OP_ObrasRelevantes,
                         OP_Poa, IDprogram, OP_Oficrecurso, OP_Archivooficrecurso,
                         OP_Oficdictamen, OP_Archivooficdictamen, IDaprima, Siahe,
                         IDtipoobra, Idsecretariaconvenio, IDInstanciaeje, IDInstanciaval,
                         IDStatusobra, OP_Proyecto, OP_FechaCreacion, OP_Concertado,
                         OP_Descripcion, OP_Minuta, OP_ActaCabildo, OP_ConstanciaMayoria,
                         OP_Nombramientos, OP_Presidente, OP_Sindico, OP_Tesorero,
                         OP_Secretario, OP_DirectorObrasPublicas, OP_RepAsambleaBarrio,
                         OP_Contrato, OP_Contratista, IDSubRubroEspecifico,
                         -- IDUsuario temporal = 1, reemplazar cuando se integre módulo usuarios
                         1, GETDATE(), 'ELIMINADO'
                        FROM TBLP_Obraproyecto
                        WHERE IDobraproyecto = @id",
                        new { id = idobra });

                    // ── 3. ELIMINAR acciones y obra (igual que VS2005) ──
                    conn.Execute(
                        "DELETE TblD_Acciones WHERE IDobraproyecto = @id",
                        new { id = idobra });

                    conn.Execute(
                        "DELETE TBLP_Obraproyecto WHERE IDobraproyecto = @id",
                        new { id = idobra });
                }

                return Ok(new { success = true });
            }
            catch (Exception ex)
            {
                return InternalServerError(ex);
            }
        }


        // ══════════════════════════════════════════════════════════════════
        // LOCALIDADES
        // ══════════════════════════════════════════════════════════════════

        [HttpGet]
        [Route("getNombreObra/{idobra}")]
        public IHttpActionResult GetNombreObra(int idobra)
        {
            try
            {
                using (var con = new SqlConnection(_connectionString))
                {
                    con.Open();
                    var nombre = con.ExecuteScalar<string>(
                        "SELECT OP_NombreObra FROM TBLP_Obraproyecto WHERE IDobraproyecto = @id",
                        new { id = idobra });
                    return Ok(nombre);
                }
            }
            catch (Exception ex) { return InternalServerError(ex); }
        }

        [HttpGet]
        [Route("getLocalidades")]
        public IHttpActionResult GetLocalidades()
        {
            try
            {
                using (var con = new SqlConnection(_connectionString))
                {
                    con.Open();
                    // Clave municipio Ocozocoautla = 061
                    var lista = con.Query(
                        "SELECT IDLocalidad AS id, LCL_Nombre AS nombre " +
                        "FROM TBLC_Localidades " +
                        "WHERE CveMunicipio = '061' " +
                        "ORDER BY LCL_Nombre ASC").ToList();
                    return Ok(lista);
                }
            }
            catch (Exception ex) { return InternalServerError(ex); }
        }

        [HttpGet]
        [Route("getLocalidadesObra/{idobra}")]
        public IHttpActionResult GetLocalidadesObra(int idobra)
        {
            try
            {
                using (var con = new SqlConnection(_connectionString))
                {
                    con.Open();
                    var lista = con.Query(
                        "SELECT L.IDLocalidadproyectoobra AS id, " +
                        "       L.IDLocalidad AS idLocalidad, " +
                        "       C.LCL_Nombre AS nombre " +
                        "FROM TblD_Localidadproyectoobra L " +
                        "INNER JOIN TBLC_Localidades C ON L.IDLocalidad = C.IDLocalidad " +
                        "WHERE L.IDobraproyecto = @id " +
                        "AND L.CveMunicipio = '061' " +
                        "ORDER BY C.LCL_Nombre ASC",
                        new { id = idobra }).ToList();
                    return Ok(lista);
                }
            }
            catch (Exception ex) { return InternalServerError(ex); }
        }

        [HttpPost]
        [Route("guardarLocalidad")]
        public IHttpActionResult GuardarLocalidad([FromBody] dynamic data)
        {
            try
            {
                int idobra = Convert.ToInt32(data.idobra);
                int idLocalidad = Convert.ToInt32(data.idLocalidad);
                string accion = data.accion.ToString();
                string cve = data.cveMunicipio.ToString();

                using (var con = new SqlConnection(_connectionString))
                {
                    con.Open();

                    if (accion == "add")
                    {
                        // Verificar duplicado
                        var existe = con.ExecuteScalar<int>(
                            "SELECT COUNT(*) FROM TblD_Localidadproyectoobra " +
                            "WHERE IDLocalidad = @idLoc AND IDobraproyecto = @idObra " +
                            "AND CveMunicipio = @cve",
                            new { idLoc = idLocalidad, idObra = idobra, cve });

                        if (existe > 0)
                            return BadRequest("La localidad ya está registrada en esta obra.");

                        con.Execute(
                            "INSERT INTO TblD_Localidadproyectoobra " +
                            "(IDobraproyecto, IDLocalidad, CveMunicipio) " +
                            "VALUES (@idObra, @idLoc, @cve)",
                            new { idObra = idobra, idLoc = idLocalidad, cve });
                    }
                    else
                    {
                        int idDetalle = Convert.ToInt32(data.idLocalidadDetalle);
                        con.Execute(
                            "UPDATE TblD_Localidadproyectoobra " +
                            "SET IDLocalidad = @idLoc " +
                            "WHERE IDLocalidadproyectoobra = @id",
                            new { idLoc = idLocalidad, id = idDetalle });
                    }
                }
                return Ok(new { success = true });
            }
            catch (Exception ex) { return InternalServerError(ex); }
        }

        [HttpDelete]
        [Route("eliminarLocalidad/{id}")]
        public IHttpActionResult EliminarLocalidad(int id)
        {
            try
            {
                using (var con = new SqlConnection(_connectionString))
                {
                    con.Execute(
                        "DELETE FROM TblD_Localidadproyectoobra " +
                        "WHERE IDLocalidadproyectoobra = @id",
                        new { id });
                }
                return Ok(new { success = true });
            }
            catch (Exception ex) { return InternalServerError(ex); }
        }


        // ══════════════════════════════════════════════════════════════════
        // ACCIONES
        // ══════════════════════════════════════════════════════════════════

        [HttpGet]
        [Route("getAcciones")]
        public IHttpActionResult GetAcciones(int idobra, string anio = "")
        {
            try
            {
                using (var con = new SqlConnection(_connectionString))
                {
                    string sql = @"
                SELECT DISTINCT
                    A.IDAcciones       AS idAccion,
                    A.OP_Año           AS anio,
                    A.AC_Accion        AS accion,
                    TE.TPE_Nombre      AS tipoEjecucion,
                    A.IDtipoejecucion  AS idTipoEjecucion,
                    TA.Descripcion     AS tipoAccion,
                    A.IDTipoaccion     AS idTipoAccion,
                    A.LCL_Nombre       AS localidad,
                    A.IDLocalidad      AS idLocalidad,
                    C.CON_Contrato     AS contrato,
                    A.IDContrato       AS idContrato
                FROM TblD_Acciones A
                LEFT JOIN TBLC_Tipoejecucion TE ON A.IDtipoejecucion = TE.IDtipoejecucion
                LEFT JOIN TblC_TipoAccion    TA ON A.IDTipoaccion    = TA.IDTipoaccion
                LEFT JOIN TBLD_Contrato       C ON A.IDContrato       = C.IDContrato
                WHERE A.IDobraproyecto = @idobra
                  AND (@anio = '' OR A.OP_Año = @anio)
                ORDER BY A.IDAcciones DESC";

                    var lista = con.Query(sql, new { idobra, anio }).ToList();
                    return Ok(lista);
                }
            }
            catch (Exception ex) { return InternalServerError(ex); }
        }

        [HttpGet]
        [Route("getAccionById/{idAccion}")]
        public IHttpActionResult GetAccionById(int idAccion)
        {
            try
            {
                using (var con = new SqlConnection(_connectionString))
                {
                    var a = con.QueryFirstOrDefault(@"
                SELECT A.IDAcciones AS idAccion, A.OP_Año AS anio,
                       A.AC_Accion AS accion, A.IDtipoejecucion AS idTipoEjecucion,
                       A.IDTipoaccion AS idTipoAccion, A.IDLocalidad AS idLocalidad,
                       A.IDSubRubroEspecifico AS idSubrubroEspecifico,
                       A.Beneficiario AS beneficiarios, A.Tipobeneficiario AS tipoBeneficiario,
                       A.Dictamenconfuente AS dictamenFuente,
                       A.Autorizadasinrecurso AS autorizado, A.Liberada AS liberada,
                       A.AC_Descripcionaccion AS descripcionObra,
                       A.descripcionlocalidad AS descripcionLocalidad, A.finalidad, A.funcion,
                       A.subfuncion, A.programa, A.subprograma, A.proyecto
                FROM TblD_Acciones A WHERE IDAcciones = @id",
                        new { id = idAccion });
                    return Ok(a);
                }
            }
            catch (Exception ex) { return InternalServerError(ex); }
        }

        [HttpPost]
        [Route("guardarAccion")]
        public IHttpActionResult GuardarAccion([FromBody] dynamic data)
        {
            try
            {
                int idobra = Convert.ToInt32(data.idobra);
                string accion = data.accion.ToString();
                string anio = data.anio.ToString();
                string cveMun = data.cveMunicipio?.ToString() ?? "061";

                using (var con = new SqlConnection(_connectionString))
                {
                    con.Open();

                    // ── Gestión de TBLD_añoobraproyecto ──────────────────────────
                    long idAnioObra = 0;
                    var existeAnio = con.ExecuteScalar<int>(
                        "SELECT COUNT(*) FROM TBLD_añoobraproyecto WHERE IDobraproyecto=@idobra  AND OP_Año=@anio",
                        new { idobra, anio });

                    if (existeAnio >= 1)
                    {
                        idAnioObra = con.ExecuteScalar<long>(
                            "SELECT IDañoobraproyecto FROM TBLD_añoobraproyecto WHERE IDobraproyecto=@idobra AND OP_Año=@anio",
                            new { idobra, anio });
                    }
                    else
                    {
                        // ¿Es continuidad?
                        bool continuidad = con.ExecuteScalar<int>(
                            "SELECT COUNT(*) FROM TBLD_añoobraproyecto WHERE IDobraproyecto=@idobra",
                            new { idobra }) > 0;

                        con.Execute(
                            "INSERT INTO TBLD_añoobraproyecto(IDobraproyecto,OP_Año,OP_Continuidad," +
                            "OP_InversionEstatal,OP_InversionFederal,OP_InversioMunicipal,OP_Concepto) " +
                            "VALUES(@idobra,@anio,@continuidad,0,0,0,NULL)",
                            new { idobra, anio, continuidad });

                        idAnioObra = con.ExecuteScalar<long>(
                            "SELECT MAX(IDañoobraproyecto) FROM TBLD_añoobraproyecto WHERE IDobraproyecto=@idobra AND OP_Año=@anio",
                            new { idobra,anio });
                    }

                    // ── Datos de localidad ────────────────────────────────────────
                    int idLocalidad = Convert.ToInt32(data.idLocalidad ?? 0);
                    string cveLocalidad = "", nombreLocalidad = "";
                    if (idLocalidad > 0)
                    {
                        var loc = con.QueryFirstOrDefault(
                            "SELECT CveLocalidades, LCL_Nombre FROM TBLC_Localidades WHERE IDLocalidad=@idLocalidad",
                            new { idLocalidad });
                        if (loc != null)
                        {
                            cveLocalidad = loc.CveLocalidades ?? "";
                            nombreLocalidad = loc.LCL_Nombre ?? "";
                        }
                    }

                    string accionTexto = (data.accionTexto ?? "").ToString().ToUpper();
                    string fecha = DateTime.Now.ToString("yyyy-MM-dd HH:mm:ss");

                    if (accion == "add")
                    {
                        long idNew = con.ExecuteScalar<long>(
                            "INSERT INTO TblD_Acciones(IDobraproyecto,IDañoobraproyecto,OP_Año," +
                            "AC_Accion,IDtipoejecucion,Meta,IDunidadmedida,IDTipoPoa,Autorizadas," +
                            "Fecha,Fechaaccion,IDstatusaccion,Dictamenconfuente,Autorizadasinrecurso," +
                            "Liberada,Metamodificada,Beneficiario,Tipobeneficiario,IDTipoaccion," +
                            "IDSubRubroEspecifico,CveMunicipio,MNP_Nombre,IDLocalidad,LCL_Nombre," +
                            "IDstatusobra,CveLocalidades,AC_Descripcionaccion,descripcionlocalidad," +
                            "finalidad,funcion,subfuncion,programa,subprograma,proyecto) " +
                            "VALUES(@idobra,@idAnioObra,@anioInt,@accion,@tipoEjec,0,75,1,1," +
                            "@fecha,@fecha,1,@dictamen,@autorizado,@liberada,0,@beneficiarios," +
                            "@tipoBen,@tipoAcc,@subEsp,@cveMun,'OCOZOCOAUTLA DE ESPINOSA'," +
                            "@idLoc,@nomLoc,12,@cveLoc,@descObra,@descLoc,@finalidad,@funcion," +
                            "@subfuncion,@programa,@subprograma,@proyecto);" +
                            "SELECT CAST(SCOPE_IDENTITY() AS bigint);",
                            new
                            {
                                idobra,
                                idAnioObra,
                                anioInt = Convert.ToInt32(anio),
                                accion = accionTexto,
                                tipoEjec = Convert.ToInt32(data.idTipoEjecucion ?? 0),
                                fecha,
                                dictamen = (bool)(data.dictamenFuente ?? false),
                                autorizado = (bool)(data.autorizado ?? false),
                                liberada = (bool)(data.liberada ?? false),
                                beneficiarios = Convert.ToInt32(data.beneficiarios ?? 0),
                                tipoBen = (data.tipoBeneficiario ?? "").ToString(),
                                tipoAcc = Convert.ToInt32(data.idTipoAccion ?? 0),
                                subEsp = Convert.ToInt32(data.idSubrubroEspecifico ?? 0),
                                cveMun,
                                idLoc = idLocalidad,
                                nomLoc = nombreLocalidad,
                                cveLoc = cveLocalidad,
                                descObra = (data.descripcionObra ?? "").ToString(),
                                descLoc = (data.descripcionLocalidad ?? "").ToString(),
                                finalidad = (data.finalidad ?? "").ToString(),
                                funcion = (data.funcion ?? "").ToString(),
                                subfuncion = (data.subfuncion ?? "").ToString(),
                                programa = (data.programa ?? "").ToString(),
                                subprograma = (data.subprograma ?? "").ToString(),
                                proyecto = (data.proyecto ?? "").ToString()
                            });
                    }
                    else
                    {
                        int idAccion = Convert.ToInt32(data.idAccion ?? 0);
                        con.Execute(
                            "UPDATE TblD_Acciones SET IDañoobraproyecto=@idAnioObra,OP_Año=@anioInt," +
                            "AC_Accion=@accion,IDtipoejecucion=@tipoEjec," +
                            "Dictamenconfuente=@dictamen,Autorizadasinrecurso=@autorizado," +
                            "Liberada=@liberada,Metamodificada=0,Beneficiario=@beneficiarios," +
                            "Tipobeneficiario=@tipoBen,IDTipoaccion=@tipoAcc," +
                            "IDSubRubroEspecifico=@subEsp,IDLocalidad=@idLoc," +
                            "LCL_Nombre=@nomLoc,CveLocalidades=@cveLoc," +
                            "AC_Descripcionaccion=@descObra,descripcionlocalidad=@descLoc," +
                            "finalidad=@finalidad,funcion=@funcion,subfuncion=@subfuncion," +
                            "programa=@programa,subprograma=@subprograma,proyecto=@proyecto " +
                            "WHERE IDAcciones=@idAccion",
                            new
                            {
                                idAnioObra,
                                anioInt = Convert.ToInt32(anio),
                                accion = accionTexto,
                                tipoEjec = Convert.ToInt32(data.idTipoEjecucion ?? 0),
                                dictamen = (bool)(data.dictamenFuente ?? false),
                                autorizado = (bool)(data.autorizado ?? false),
                                liberada = (bool)(data.liberada ?? false),
                                beneficiarios = Convert.ToInt32(data.beneficiarios ?? 0),
                                tipoBen = (data.tipoBeneficiario ?? "").ToString(),
                                tipoAcc = Convert.ToInt32(data.idTipoAccion ?? 0),
                                subEsp = Convert.ToInt32(data.idSubrubroEspecifico ?? 0),
                                idLoc = idLocalidad,
                                nomLoc = nombreLocalidad,
                                cveLoc = cveLocalidad,
                                descObra = (data.descripcionObra ?? "").ToString(),
                                descLoc = (data.descripcionLocalidad ?? "").ToString(),
                                finalidad = (data.finalidad ?? "").ToString(),
                                funcion = (data.funcion ?? "").ToString(),
                                subfuncion = (data.subfuncion ?? "").ToString(),
                                programa = (data.programa ?? "").ToString(),
                                subprograma = (data.subprograma ?? "").ToString(),
                                proyecto = (data.proyecto ?? "").ToString(),
                                idAccion
                            });
                    }
                    return Ok(new { success = true });
                }
            }
            catch (Exception ex) { return InternalServerError(ex); }
        }

        [HttpDelete]
        [Route("eliminarAccion/{idAccion}")]
        public IHttpActionResult EliminarAccion(int idAccion)
        {
            try
            {
                using (var con = new SqlConnection(_connectionString))
                {
                    con.Open();
                    // Validar que no tenga inversión
                    var tieneInversion = con.ExecuteScalar<int>(
                        "SELECT COUNT(*) FROM TBLD_Financiamientoinversion WHERE IDAcciones=@idAccion",
                        new { idAccion });

                    if (tieneInversion > 0)
                        return BadRequest("No puede eliminar la acción. Existe monto de inversión autorizada.");

                    // Obtener datos para limpiar el año si queda vacío
                    //var acc = con.QueryFirstOrDefault(
                    //    "SELECT IDobraproyecto, OP_Año FROM TblD_Acciones WHERE IDAcciones=@id",
                    //    new { id = idAccion });

                    //con.Execute("DELETE FROM TblD_AccionesMetas WHERE IDAcciones=@idAccion", new { idAccion });
                    //con.Execute("DELETE FROM TblD_AccionesMetasModificada WHERE IDAcciones=@idAccion", new { idAccion });
                    //con.Execute("DELETE FROM TblD_Acciones WHERE IDAcciones=@idAccion", new { idAccion });

                    //// Si no quedan acciones en ese año, eliminar el año
                    //if (acc != null)
                    //{
                    //    var quedan = con.ExecuteScalar<int>(
                    //        "SELECT COUNT(*) FROM TblD_Acciones WHERE IDobraproyecto=@idobra AND OP_Año=@anio",
                    //        new { idobra = (int)acc.IDobraproyecto, anio = (string)acc.OP_Año });

                    //    if (quedan == 0)
                    //        con.Execute(
                    //            "DELETE FROM TBLD_añoobraproyecto WHERE IDobraproyecto=@idobra AND OP_Año=@anio",
                    //            new { idobra = (int)acc.IDobraproyecto, anio = (string)acc.OP_Año });
                    //    else
                    //        SumaInversion(con, (int)acc.IDobraproyecto, (int)acc.OP_Año);
                    //}
                    var acc = con.QueryFirstOrDefault(
                    "SELECT IDobraproyecto, OP_Año FROM TblD_Acciones WHERE IDAcciones=@id",
                    new { id = idAccion });

                    con.Execute("DELETE FROM TblD_AccionesMetas WHERE IDAcciones=@id", new { id = idAccion });
                    con.Execute("DELETE FROM TblD_AccionesMetasModificada WHERE IDAcciones=@id", new { id = idAccion });
                    con.Execute("DELETE FROM TblD_Acciones WHERE IDAcciones=@id", new { id = idAccion });

                    if (acc != null)
                    {
                        int idobraAcc = Convert.ToInt32(acc.IDobraproyecto);
                        int anioAcc = Convert.ToInt32(acc.OP_Año);

                        var quedan = con.ExecuteScalar<int>(
                            "SELECT COUNT(*) FROM TblD_Acciones WHERE IDobraproyecto=@idobra AND OP_Año=@anio",
                            new { idobra = idobraAcc, anio = anioAcc });

                        if (quedan == 0)
                            con.Execute(
                                "DELETE FROM TBLD_añoobraproyecto WHERE IDobraproyecto=@idobra AND OP_Año=@anio",
                                new { idobra = idobraAcc, anio = anioAcc });
                        else
                            SumaInversion(con, idobraAcc, anioAcc);
                    }
                }
                return Ok(new { success = true });
            }
            catch (Exception ex) { return InternalServerError(ex); }
        }

        // ══════════════════════════════════════════════════════════════════
        // CATÁLOGOS PARA ACCIONES
        // ══════════════════════════════════════════════════════════════════

        [HttpGet]
        [Route("getAniosAccion/{idobra}")]
        public IHttpActionResult GetAniosAccion(int idobra)
        {
            try
            {
                using (var con = new SqlConnection(_connectionString))
                {
                    var lista = con.Query(
                        "SELECT DISTINCT OP_Año AS anio FROM TblD_Acciones " +
                        "WHERE IDobraproyecto=@id ORDER BY OP_Año DESC",
                        new { id = idobra }).ToList();
                    return Ok(lista);
                }
            }
            catch (Exception ex) { return InternalServerError(ex); }
        }

        [HttpGet]
        [Route("getTipoEjecucion")]
        public IHttpActionResult GetTipoEjecucion()
        {
            try
            {
                using (var con = new SqlConnection(_connectionString))
                {
                    var lista = con.Query(
                        "SELECT IDtipoejecucion AS id, TPE_Nombre AS nombre " +
                        "FROM TBLC_Tipoejecucion ORDER BY TPE_Nombre").ToList();
                    return Ok(lista);
                }
            }
            catch (Exception ex) { return InternalServerError(ex); }
        }

        [HttpGet]
        [Route("getTipoAccion")]
        public IHttpActionResult GetTipoAccion()
        {
            try
            {
                using (var con = new SqlConnection(_connectionString))
                {
                    var lista = con.Query(
                        "SELECT IDTipoaccion AS id, Descripcion AS nombre " +
                        "FROM TblC_TipoAccion ORDER BY Descripcion").ToList();
                    return Ok(lista);
                }
            }
            catch (Exception ex) { return InternalServerError(ex); }
        }

        [HttpGet]
        [Route("getSubrubroEspecifico/{idobra}")]
        public IHttpActionResult GetSubrubroEspecifico(int idobra)
        {
            try
            {
                using (var con = new SqlConnection(_connectionString))
                {
                    var idPrograma = con.ExecuteScalar<int>(
                        "SELECT ISNULL(IDPrograma,0) FROM TBLP_Obraproyecto WHERE IDobraproyecto=@id",
                        new { id = idobra });

                    var lista = con.Query(
                        "SELECT IDSubRubroEspecifico AS id, Descripcion AS nombre " +
                        "FROM TblC_Subrubroespecifico WHERE IDSubrubro=@idp ORDER BY Descripcion",
                        new { idp = idPrograma }).ToList();
                    return Ok(lista);
                }
            }
            catch (Exception ex) { return InternalServerError(ex); }
        }

        // ══════════════════════════════════════════════════════════════════
        // ORIGEN DE INVERSIÓN
        // ══════════════════════════════════════════════════════════════════

        [HttpGet]
        [Route("getOrigenes/{idAccion}")]
        public IHttpActionResult GetOrigenes(int idAccion)
        {
            try
            {
                using (var con = new SqlConnection(_connectionString))
                {
                    var lista = con.Query(@"
                SELECT F.IdFuenteinversion AS idFuente,
                       O.OF_Origenfuente   AS origen,
                       FF.PRF_Nombre       AS fuente,
                       F.IdOrigenfuente    AS idOrigen,
                       F.IDProgramafinanciamiento AS idFuenteFin,
                       F.FI_Inversion      AS inversion,
                       CONVERT(varchar,F.Fechavencimiento,103) AS fechaVencimiento
                FROM TBLD_Financiamientoinversion F
                INNER JOIN TBLC_Origenfuente        O  ON F.IdOrigenfuente         = O.IdOrigenfuente
                INNER JOIN TblC_FuenteFinanciamiento FF ON F.IDProgramafinanciamiento = FF.IDFuenteFinanciamiento
                WHERE F.IDAcciones = @id",
                        new { id = idAccion }).ToList();
                    return Ok(lista);
                }
            }
            catch (Exception ex) { return InternalServerError(ex); }
        }

        [HttpGet]
        [Route("getOrigenById/{idFuente}")]
        public IHttpActionResult GetOrigenById(int idFuente)
        {
            try
            {
                using (var con = new SqlConnection(_connectionString))
                {
                    var o = con.QueryFirstOrDefault(@"
                SELECT IdFuenteinversion AS idFuente,
                       IdOrigenfuente AS idOrigen,
                       IDProgramafinanciamiento AS idFuente,
                       FI_Inversion AS inversion,
                       CONVERT(varchar,Fechavencimiento,103) AS fechaVencimiento
                FROM TBLD_Financiamientoinversion WHERE IdFuenteinversion=@id",
                        new { id = idFuente });
                    return Ok(o);
                }
            }
            catch (Exception ex) { return InternalServerError(ex); }
        }

        [HttpPost]
        [Route("guardarOrigen")]
        public IHttpActionResult GuardarOrigen([FromBody] dynamic data)
        {
            try
            {
                string accion = data.accion.ToString();
                int idAccion = Convert.ToInt32(data.idAccion ?? 0);
                int idOrigen = Convert.ToInt32(data.idOrigen ?? 0);
                int idFuenteFin = Convert.ToInt32(data.idFuenteFinanciamiento ?? 0);
                decimal inv = Convert.ToDecimal(data.inversion ?? 0);
                string fVcto = (data.fechaVencimiento ?? "").ToString();

                using (var con = new SqlConnection(_connectionString))
                {
                    con.Open();
                    if (accion == "add")
                    {
                        // Validar duplicado
                        var existe = con.ExecuteScalar<int>(
                            "SELECT COUNT(*) FROM TBLD_Financiamientoinversion " +
                            "WHERE IDAcciones=@idAcc AND IDProgramafinanciamiento=@idFF AND IdOrigenfuente=@idOr",
                            new { idAcc = idAccion, idFF = idFuenteFin, idOr = idOrigen });

                        if (existe > 0)
                            return BadRequest("Fuente de Financiamiento duplicada.");

                        con.Execute(
                            "INSERT INTO TBLD_Financiamientoinversion(IDAcciones,IDañoobraproyecto,OP_Año," +
                            "IdOrigenfuente,IDProgramafinanciamiento,FI_Inversion,Fechavencimiento) " +
                            "VALUES(@idAcc,0,0,@idOr,@idFF,@inv,@vcto)",
                            new
                            {
                                idAcc = idAccion,
                                idOr = idOrigen,
                                idFF = idFuenteFin,
                                inv,
                                vcto = DateTime.ParseExact(fVcto, "dd/MM/yyyy",System.Globalization.CultureInfo.InvariantCulture)
                            });
                    }
                    else
                    {
                        int idFuente = Convert.ToInt32(data.idFuente ?? 0);
                        con.Execute(
                            "UPDATE TBLD_Financiamientoinversion SET IdOrigenfuente=@idOr," +
                            "IDProgramafinanciamiento=@idFF,FI_Inversion=@inv,Fechavencimiento=@vcto " +
                            "WHERE IdFuenteinversion=@id",
                            new
                            {
                                idOr = idOrigen,
                                idFF = idFuenteFin,
                                inv,
                                vcto = DateTime.ParseExact(fVcto, "dd/MM/yyyy",System.Globalization.CultureInfo.InvariantCulture),
                                id = idFuente
                            });
                    }

                    // Recalcular sumas
                    var accInfo = con.QueryFirstOrDefault(
                        "SELECT IDobraproyecto, OP_Año FROM TblD_Acciones WHERE IDAcciones=@idAccion",
                        new { idAccion });
                    if (accInfo != null)
                        SumaInversion(con, (int)accInfo.IDobraproyecto, (int)accInfo.OP_Año);
                }
                return Ok(new { success = true });
            }
            catch (Exception ex) { return InternalServerError(ex); }
        }

        [HttpDelete]
        [Route("eliminarOrigen/{idFuente}")]
        public IHttpActionResult EliminarOrigen(int idFuente)
        {
            try
            {
                using (var con = new SqlConnection(_connectionString))
                {
                    con.Open();
                    var tieneCOCI = con.ExecuteScalar<int>(
                        "SELECT COUNT(*) FROM TblD_COCI WHERE IdFuenteinversion=@id",
                        new { id = idFuente });

                    if (tieneCOCI > 0)
                        return BadRequest("No puede eliminar. Existe Clave Presupuestal (COCI) registrada.");

                    var fi = con.QueryFirstOrDefault(
                        "SELECT F.IDAcciones, A.IDobraproyecto, A.OP_Año " +
                        "FROM TBLD_Financiamientoinversion F " +
                        "INNER JOIN TblD_Acciones A ON F.IDAcciones=A.IDAcciones " +
                        "WHERE F.IdFuenteinversion=@id", new { id = idFuente });

                    con.Execute("DELETE FROM TBLD_Financiamientoinversion WHERE IdFuenteinversion=@id",
                        new { id = idFuente });

                    if (fi != null)
                        SumaInversion(con, (int)fi.IDobraproyecto, (int)fi.OP_Año);
                }
                return Ok(new { success = true });
            }
            catch (Exception ex) { return InternalServerError(ex); }
        }

        [HttpGet]
        [Route("getOrigenFuente")]
        public IHttpActionResult GetOrigenFuente()
        {
            try
            {
                using (var con = new SqlConnection(_connectionString))
                {
                    var lista = con.Query(
                        "SELECT IdOrigenfuente AS id, OF_Origenfuente AS nombre " +
                        "FROM TBLC_Origenfuente WHERE OF_Origenfuente NOT LIKE '%(SELECCIONE)%' ORDER BY OF_Origenfuente").ToList();
                    return Ok(lista);
                }
            }
            catch (Exception ex) { return InternalServerError(ex); }
        }

        [HttpGet]
        [Route("getFuenteFinanciamiento")]
        public IHttpActionResult GetFuenteFinanciamiento()
        {
            try
            {
                using (var con = new SqlConnection(_connectionString))
                {
                    var lista = con.Query(
                        "SELECT IDFuenteFinanciamiento AS id, PRF_Nombre AS nombre " +
                        "FROM TblC_FuenteFinanciamiento WHERE PRF_Nombre NOT LIKE '%(SELECCIONE)%' ORDER BY PRF_Nombre").ToList();
                    return Ok(lista);
                }
            }
            catch (Exception ex) { return InternalServerError(ex); }
        }

        // ══════════════════════════════════════════════════════════════════
        // COCI
        // ══════════════════════════════════════════════════════════════════

        [HttpGet]
        [Route("getCOCI")]
        public IHttpActionResult GetCOCI(int idFuente, string status = "CO")
        {
            try
            {
                using (var con = new SqlConnection(_connectionString))
                {
                    var lista = con.Query(
                        "SELECT IDcoci AS idCoci, Cvepresupuestal AS cvePresupuestal, " +
                        "Inversioncoci AS inversion, Statuscoci AS status " +
                        "FROM TblD_COCI WHERE IdFuenteinversion=@id AND Statuscoci=@st",
                        new { id = idFuente, st = status }).ToList();
                    return Ok(lista);
                }
            }
            catch (Exception ex) { return InternalServerError(ex); }
        }

        [HttpGet]
        [Route("getCOCIById/{idCoci}")]
        public IHttpActionResult GetCOCIById(int idCoci)
        {
            try
            {
                using (var con = new SqlConnection(_connectionString))
                {
                    var c = con.QueryFirstOrDefault(
                        "SELECT IDcoci AS idCoci, Cvepresupuestal AS cvePresupuestal, " +
                        "Inversioncoci AS inversion, Statuscoci AS status " +
                        "FROM TblD_COCI WHERE IDcoci=@id", new { id = idCoci });
                    return Ok(c);
                }
            }
            catch (Exception ex) { return InternalServerError(ex); }
        }

        [HttpPost]
        [Route("guardarCOCI")]
        public IHttpActionResult GuardarCOCI([FromBody] dynamic data)
        {
            try
            {
                string accion = data.accion.ToString();
                int idFuente = Convert.ToInt32(data.idFuente ?? 0);
                string status = (data.status ?? "CO").ToString();
                string cvePres = (data.cvePresupuestal ?? "").ToString().ToUpper();
                decimal inversion = Convert.ToDecimal(data.inversion ?? 0);

                using (var con = new SqlConnection(_connectionString))
                {
                    con.Open();
                    if (accion == "add")
                    {
                        var existe = con.ExecuteScalar<int>(
                            "SELECT COUNT(*) FROM TblD_COCI " +
                            "WHERE IdFuenteinversion=@id AND Cvepresupuestal=@cve AND Statuscoci=@st",
                            new { id = idFuente, cve = cvePres, st = status });

                        if (existe > 0) return BadRequest("Clave Presupuestal duplicada.");

                        con.Execute(
                            "INSERT INTO TblD_COCI(IdFuenteinversion,Cvepresupuestal,Inversioncoci,Statuscoci,IDmovimiento)" +
                            "VALUES(@id,@cve,@inv,@st,1)",
                            new { id = idFuente, cve = cvePres, inv = inversion, st = status });
                    }
                    else
                    {
                        int idCoci = Convert.ToInt32(data.idCoci ?? 0);
                        con.Execute(
                            "UPDATE TblD_COCI SET Cvepresupuestal=@cve, Inversioncoci=@inv WHERE IDcoci=@id",
                            new { cve = cvePres, inv = inversion, id = idCoci });
                    }

                    // Recalcular: suma COCI → actualiza FI_Inversion → actualiza año
                    SumaInversionCOCI(con, idFuente);
                }
                return Ok(new { success = true });
            }
            catch (Exception ex) { return InternalServerError(ex); }
        }

        [HttpDelete]
        [Route("eliminarCOCI/{idCoci}")]
        public IHttpActionResult EliminarCOCI(int idCoci)
        {
            try
            {
                using (var con = new SqlConnection(_connectionString))
                {
                    con.Open();
                    var idFuente = con.ExecuteScalar<int>(
                        "SELECT IdFuenteinversion FROM TblD_COCI WHERE IDcoci=@id", new { id = idCoci });

                    con.Execute("DELETE FROM TblD_COCI WHERE IDcoci=@id", new { id = idCoci });
                    SumaInversionCOCI(con, idFuente);
                }
                return Ok(new { success = true });
            }
            catch (Exception ex) { return InternalServerError(ex); }
        }

        // ══════════════════════════════════════════════════════════════════
        // CONTRATO
        // ══════════════════════════════════════════════════════════════════

        [HttpGet]
        [Route("getContratosDisponibles")]
        public IHttpActionResult GetContratosDisponibles(string term = "")
        {
            try
            {
                using (var con = new SqlConnection(_connectionString))
                {
                    var lista = con.Query(
                        "SELECT TOP 20 IDContrato AS idContrato, CON_Contrato AS numContrato, " +
                        "CON_Descripcion AS descripcion FROM TBLD_Contrato " +
                        "WHERE CON_Contrato LIKE '%' + @term + '%' ORDER BY CON_Contrato",
                        new { term }).ToList();
                    return Ok(lista);
                }
            }
            catch (Exception ex) { return InternalServerError(ex); }
        }

        [HttpPost]
        [Route("asignarContrato")]
        public IHttpActionResult AsignarContrato([FromBody] dynamic data)
        {
            try
            {
                int idAccion = Convert.ToInt32(data.idAccion ?? 0);
                int idContrato = Convert.ToInt32(data.idContrato ?? 0);
                using (var con = new SqlConnection(_connectionString))
                {
                    con.Execute(
                        "UPDATE TblD_Acciones SET IDContrato=@idCon WHERE IDAcciones=@idAcc",
                        new { idCon = idContrato, idAcc = idAccion });
                }
                return Ok(new { success = true });
            }
            catch (Exception ex) { return InternalServerError(ex); }
        }

        [HttpPost]
        [Route("quitarContrato/{idAccion}")]
        public IHttpActionResult QuitarContrato(int idAccion)
        {
            try
            {
                using (var con = new SqlConnection(_connectionString))
                {
                    // Validar avances físicos
                    var tieneAvances = con.ExecuteScalar<int>(
                        "SELECT COUNT(*) FROM TBLD_Avances AV " +
                        "INNER JOIN TBLD_Contrato CT ON AV.IDContrato=CT.IDContrato " +
                        "WHERE IDAcciones=@id", new { id = idAccion });

                    if (tieneAvances > 0)
                        return BadRequest("No se puede quitar el contrato. Existen avances físicos registrados.");

                    con.Execute(
                        "UPDATE TblD_Acciones SET IDContrato=0, IDstatusobra=12 WHERE IDAcciones=@id",
                        new { id = idAccion });
                }
                return Ok(new { success = true });
            }
            catch (Exception ex) { return InternalServerError(ex); }
        }

        // ══════════════════════════════════════════════════════════════════
        // MÉTODOS PRIVADOS — Suma de Inversión (cascada)
        // ══════════════════════════════════════════════════════════════════

        private void SumaInversion(SqlConnection con, int idobra, int anio)
        {
            decimal sumaMun = con.ExecuteScalar<decimal>(
                "SELECT ISNULL(SUM(FI_Inversion),0) FROM VW_Sumainversiones " +
                "WHERE IDobraproyecto=@id AND OP_Año=@anio AND IdOrigenfuente=1",
                new { id = idobra, anio });

            decimal sumaEst = con.ExecuteScalar<decimal>(
                "SELECT ISNULL(SUM(FI_Inversion),0) FROM VW_Sumainversiones " +
                "WHERE IDobraproyecto=@id AND OP_Año=@anio AND IdOrigenfuente=2",
                new { id = idobra, anio });

            decimal sumaFed = con.ExecuteScalar<decimal>(
                "SELECT ISNULL(SUM(FI_Inversion),0) FROM VW_Sumainversiones " +
                "WHERE IDobraproyecto=@id AND OP_Año=@anio AND IdOrigenfuente=3",
                new { id = idobra, anio });

            con.Execute(
                "UPDATE TBLD_añoobraproyecto SET OP_InversioMunicipal=@mun," +
                "OP_InversionEstatal=@est,OP_InversionFederal=@fed " +
                "WHERE IDobraproyecto=@id AND OP_Año=@anio",
                new { mun = sumaMun, est = sumaEst, fed = sumaFed, id = idobra, anio });
        }

        private void SumaInversionCOCI(SqlConnection con, int idFuente)
        {
            // 1. Sumar COCI → FI_Inversion
            decimal sumaTotal = con.ExecuteScalar<decimal>(
                "SELECT ISNULL(SUM(Inversioncoci),0) FROM TblD_COCI WHERE IdFuenteinversion=@id",
                new { id = idFuente });

            con.Execute(
                "UPDATE TBLD_Financiamientoinversion SET FI_Inversion=@total WHERE IdFuenteinversion=@id",
                new { total = sumaTotal, id = idFuente });

            // 2. Recalcular sumas por año y obra
            var fi = con.QueryFirstOrDefault(
                "SELECT A.IDobraproyecto, A.OP_Año FROM TBLD_Financiamientoinversion F " +
                "INNER JOIN TblD_Acciones A ON F.IDAcciones=A.IDAcciones " +
                "WHERE F.IdFuenteinversion=@id", new { id = idFuente });

            if (fi != null)
                SumaInversion(con, (int)fi.IDobraproyecto, (int)fi.OP_Año);
        }
    }
}

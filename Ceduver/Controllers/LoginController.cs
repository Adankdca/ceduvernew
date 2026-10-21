using System;
using System.Collections.Generic;
using System.Linq;
using System.Net;
using System.Net.Http;
using System.Web.Http;
using System.Configuration;
using System.Data.SqlClient;

namespace Ceduver.Controllers
{
    [RoutePrefix("api/Login")]
    public class LoginController : ApiController
    {
            private readonly string _conn = ConfigurationManager.ConnectionStrings["constr"].ToString();

            [HttpGet]
            [Route("getuser")]
            [AllowAnonymous]
            public IHttpActionResult GetUser(string user = "", string pass = "")
            {
                try
                {
                    if (string.IsNullOrEmpty(user) || string.IsNullOrEmpty(pass))
                        return Ok(new { success = false, message = "Usuario y contraseña son requeridos." });

                    using (var conn = new SqlConnection(_conn))
                    {
                        conn.Open();

                        // Buscar usuario activo que coincida
                        var cmd = new SqlCommand(@"
                        SELECT TOP 1
                            IDUsuario    AS Idusuario,
                            Nombre,
                            Usuario,
                            Pwd,
                            Cargo_Puesto,
                            Bloqueo,
                            Sistema,
                            IDModulos
                        FROM TblU_Usuario
                        WHERE Usuario = @user
                          AND Pwd     = @pass", conn);

                        cmd.Parameters.AddWithValue("@user", user);
                        cmd.Parameters.AddWithValue("@pass", pass);

                        using (var dr = cmd.ExecuteReader())
                        {
                            if (!dr.Read())
                            {
                                return Ok(new
                                {
                                    success = false,
                                    message = "Usuario o contraseña incorrectos."
                                });
                            }

                            bool bloqueado = dr["Bloqueo"] != DBNull.Value &&
                                             Convert.ToBoolean(dr["Bloqueo"]);

                            if (bloqueado)
                            {
                                return Ok(new
                                {
                                    success = false,
                                    message = "Su cuenta está bloqueada. Contacte al administrador."
                                });
                            }

                            var datos = new
                            {
                                Idusuario = Convert.ToInt32(dr["Idusuario"]),
                                Nombre = dr["Nombre"].ToString(),
                                Usuario = dr["Usuario"].ToString(),
                                Cargo_Puesto = dr["Cargo_Puesto"] != DBNull.Value
                                               ? dr["Cargo_Puesto"].ToString() : "",
                                Bloqueo = bloqueado,
                                Sistema = dr["Sistema"] != DBNull.Value
                                               ? dr["Sistema"].ToString() : "",
                                IDModulos = dr["IDModulos"] != DBNull.Value
                                               ? Convert.ToInt32(dr["IDModulos"]) : 0
                            };

                            return Ok(new { success = true, data = datos });
                        }
                    }
                }
                catch (Exception ex)
                {
                    return InternalServerError(ex);
                }
            }
        
    }
}

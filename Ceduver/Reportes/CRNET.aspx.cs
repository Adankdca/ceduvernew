using CrystalDecisions.CrystalReports.Engine;
using CrystalDecisions.Shared;
using System;
using System.Collections;
using System.Configuration;
using System.Data;
using System.Data.SqlClient;
using System.IO;
using System.Web;
using System.Web.Security;
using System.Web.UI;
using System.Web.UI.HtmlControls;
using System.Web.UI.WebControls;
using System.Web.UI.WebControls.WebParts;

namespace Ceduver.Reportes
{
    public partial class CRNET : System.Web.UI.Page
    {
        ReportDocument crReportDocument;
        protected void Page_Load(object sender, EventArgs e)
        {
            // DEBUG TEMPORAL
            //string debug = "<h3>QueryString completo:</h3><ul>";
            //debug += "<li>URL completa: " + Request.Url.ToString() + "</li>";
            //debug += "<li>QueryString RAW: " + Request.QueryString.ToString() + "</li>";
            //foreach (string key in Request.QueryString.AllKeys)
            //    debug += "<li>" + key + " = " + Request.QueryString[key] + "</li>";
            //debug += "</ul>";
            //Response.Write(debug);
            //Response.End(); // Detiene aquí para ver solo el debug
            //                // FIN DEBUG
            try
            {
                string nombreRep = Request.QueryString.Get("reporte");
                if (string.IsNullOrEmpty(nombreRep))
                {
                    Response.Write("Error: No se especificó el reporte.");
                    return;
                }

                // ── Leer parámetros dinámicamente ────────────────────────────────
                ArrayList arrayParamValue = new ArrayList();
                for (int i = 0; i <= 9; i++)
                {
                    string val = Request.QueryString.Get("p" + i.ToString());
                    if (string.IsNullOrEmpty(val)) break;
                    long num;
                    if (long.TryParse(val, out num))
                        arrayParamValue.Add(num);
                    else
                        arrayParamValue.Add(val);
                }

                // ── Cargar reporte ───────────────────────────────────────────────
                string rutaRpt = Server.MapPath("~/Reportes/" + nombreRep + ".rpt");
                crReportDocument = new ReportDocument();
                crReportDocument.Load(rutaRpt);

                // ── Conexión desde web.config ────────────────────────────────────
                string connStr = ConfigurationManager
                    .ConnectionStrings["CRConexion"].ConnectionString;
                var builder = new System.Data.SqlClient.SqlConnectionStringBuilder(connStr);

                ConnectionInfo crConnectionInfo = new ConnectionInfo();
                crConnectionInfo.ServerName = builder.DataSource;
                crConnectionInfo.DatabaseName = builder.InitialCatalog;
                crConnectionInfo.UserID = builder.UserID;
                crConnectionInfo.Password = builder.Password;

                AplicarConexion(crReportDocument, crConnectionInfo);

                // ── Aplicar parámetros ───────────────────────────────────────────
                ParameterFieldDefinitions paramDefs =
                    crReportDocument.DataDefinition.ParameterFields;

                for (int i = 0; i < arrayParamValue.Count && i < paramDefs.Count; i++)
                {
                    ParameterFieldDefinition paramDef = paramDefs[i];
                    ParameterValues paramValues = paramDef.CurrentValues;
                    ParameterDiscreteValue paramVal = new ParameterDiscreteValue();
                    paramVal.Value = arrayParamValue[i];
                    paramValues.Add(paramVal);
                    paramDef.ApplyCurrentValues(paramValues);
                }

                // ── Exportar a PDF ───────────────────────────────────────────────
                crReportDocument.PrintOptions.PaperSize = PaperSize.PaperLetter;

                System.IO.Stream stm = crReportDocument
                    .ExportToStream(ExportFormatType.PortableDocFormat);
                byte[] bytes = new byte[stm.Length];
                stm.Read(bytes, 0, bytes.Length);
                stm.Close();

                Response.ClearContent();
                Response.ClearHeaders();
                Response.ContentType = "application/pdf";
                Response.AddHeader("Content-Disposition", "inline; filename=Reporte.pdf");
                Response.BinaryWrite(bytes);
                Response.End();
            }
            catch (Exception ex)
            {
                Response.Write("Error al generar reporte: " + ex.Message);
            }
            finally
            {
                if (crReportDocument != null)
                {
                    crReportDocument.Close();
                    crReportDocument.Dispose();
                }
            }
        }

        /// <summary>
        /// Aplica la conexión al reporte principal Y a todos sus subreportes.
        /// Esto es clave para que no pida credenciales en ningún subreporte.
        /// </summary>
        private void AplicarConexion(ReportDocument reporte, ConnectionInfo conexion)
        {
            // Tablas del reporte principal
            foreach (CrystalDecisions.CrystalReports.Engine.Table tabla in reporte.Database.Tables)
            {
                TableLogOnInfo logOn = tabla.LogOnInfo;
                logOn.ConnectionInfo = conexion;
                tabla.ApplyLogOnInfo(logOn);
            }

            // Subreportes (si los hay)
            foreach (ReportDocument subreporte in reporte.Subreports)
            {
                foreach (CrystalDecisions.CrystalReports.Engine.Table tabla in subreporte.Database.Tables)
                {
                    TableLogOnInfo logOn = tabla.LogOnInfo;
                    logOn.ConnectionInfo = conexion;
                    tabla.ApplyLogOnInfo(logOn);
                }
            }
        }

        protected void Page_Unload(object sender, EventArgs e)
        {
            if (crReportDocument != null)
            {
                crReportDocument.Close();
                crReportDocument.Dispose();
            }
        }
    }
}
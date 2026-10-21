using System;
using System.Collections.Generic;
using System.Linq;
using System.Web;

namespace Ceduver.Models
{
    public class ModelObra
    {
        //public class ObraDTO
        //{
        //    // Campos base de la tabla TBLP_Obraproyecto
        //    public int? idobra { get; set; }
        //    public int anio { get; set; }
        //    public string noProyecto { get; set; }
        //    public string nombre { get; set; }
        //    public string rubro { get; set; }
        //    public string subrubro { get; set; }
        //    public string programa { get; set; }
        //    public int idLider { get; set; }
        //    public string marginacion { get; set; }
        //    public string tipoObra { get; set; }
        //    public int acciones { get; set; }
        //    public string franja { get; set; }
        //    public string antecedentes { get; set; }
        //    public string observaciones { get; set; }

        //    // Campos de relación y calculados (vienen de funciones SQL o Joins)
        //    public string noObra { get; set; }
        //    public string localidad { get; set; }
        //    public string finanto { get; set; }

        //    // Desglose financiero (Importante para la tabla)
        //    public decimal municipal { get; set; }
        //    public decimal estatal { get; set; }
        //    public decimal federal { get; set; }
        //    public decimal total { get; set; }
        //}
        // ── DTO principal que mapea el SELECT de GetObras ─────────────────
        public class ObraDTO
        {
            public int idobra { get; set; }
            public string noObra { get; set; }
            public string nombre { get; set; }

            public string subrubro { get; set; }
            public string anio { get; set; }   // viene de dbo.Añoinversion → string
            public decimal municipal { get; set; }
            public decimal estatal { get; set; }
            public decimal federal { get; set; }
            public decimal total { get; set; }
            public string finanto { get; set; }
            public string localidad { get; set; }
            public int numAcciones { get; set; }   // ← nuevo: dbo.ConteoAcciones
        }
        public class CatalogoDTO
        {
            public string Id { get; set; }
            public string Nombre { get; set; }
        }
        public class ObraSaveDTO
        {
            public int idobra { get; set; }

            // Relaciones principales
            public int idRubro { get; set; }
            public int idSubrubro { get; set; }   // IDPrograma
            public int idPrograma { get; set; }   // IDprogram
            public int idArea { get; set; }
            public int idNivelMarginacion { get; set; }
            public int idAprima { get; set; }

            // Datos principales
            public string noObra { get; set; }
            public string nombre { get; set; }

            // Texto
            public string antecedentes { get; set; }
            public string observaciones { get; set; }

            // Control
            public int acciones { get; set; }
            public bool franja { get; set; }
        }

    }
}
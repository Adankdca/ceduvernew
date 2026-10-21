using System;
using System.Collections.Generic;
using System.Linq;
using System.Web;

namespace Ceduver.Models
{
    public class ModelCedula
    {
    }
    /// <summary>
    /// Modelo para el grid principal de cedulas
    /// </summary>
    public class CedulaGridItem
    {
        public long IdAcciones { get; set; }
        public string NumContrato { get; set; }
        public string NombreObra { get; set; }
        public decimal MontoContratado { get; set; }
        public string Localidad { get; set; }
        public string ArchivoFiniquito { get; set; }
        public bool TieneFiniquito { get; set; }
    }

    /// <summary>
    /// Modelo para datos de encabezado de obra
    /// </summary>
    public class DatosEncabezado
    {
        public long IdObraProyecto { get; set; }
        public string NombreObra { get; set; }
        public string Rubro { get; set; }
        public int IdRubro { get; set; }
        public string NumContrato { get; set; }
        public string Localidad { get; set; }
        public decimal MontoContratado { get; set; }
        public string FuenteFinanciamiento { get; set; }
        public string PeriodoInicio { get; set; }
        public string PeriodoFin { get; set; }
        public string ClaveLocalidad { get; set; }
        public string MetaUnidad { get; set; }
        public string MetaCantidad { get; set; }
        public string DescripcionAccion { get; set; }
        public int IdPrograma { get; set; }
        public string Programa { get; set; }
    }

    /// <summary>
    /// Modelo para datos de inicio de obra
    /// </summary>
    public class DatosInicio
    {
        public long IdSeguimiento { get; set; }
        public long IdAcciones { get; set; }
        public long IdObraProyecto { get; set; }
        public string AccionMov { get; set; } // A=Agregar, M=Modificar

        // Datos generales
        public string NoAgeb { get; set; }
        public string FechaVerificacion { get; set; }
        public string Localidad { get; set; }
        public string ClaveLocalidad { get; set; }

        // Tipo de obra
        public bool Amplia { get; set; }
        public bool Construccion { get; set; }
        public bool Equipamiento { get; set; }
        public bool Mantenimiento { get; set; }
        public bool Rehabilitacion { get; set; }

        // Beneficio
        public bool Directa { get; set; }
        public bool Complementaria { get; set; }

        // Planeacion
        public bool CoincidePlaneacion { get; set; }
        public string DescripcionNoCoincide { get; set; }
        public bool ZonaAtencion { get; set; }
        public string RezagoSocial { get; set; }
        public bool AcreditacionPobreza { get; set; }

        // Metas
        public string MetaUnidad { get; set; }
        public decimal MetaCantidad { get; set; }
        public string DescripcionObra { get; set; }

        // Rubro
        public int IdRubro { get; set; }
        public string Rubro { get; set; }
        public int IdSubrubro { get; set; }
        public string Subrubro { get; set; }

        // Montos
        public decimal AportacionFismdf { get; set; }
        public decimal OtraFuenteFederal { get; set; }
        public decimal FuenteEstatal { get; set; }
        public decimal FuenteMunicipal { get; set; }
        public decimal Otros { get; set; }
        public decimal CostoTotal { get; set; }

        // Georeferenciacion
        public string Latitud { get; set; }
        public string Longitud { get; set; }
        public string Direccion { get; set; }
        public string Referencia { get; set; }

        // Periodos
        public string PeriodoInicio { get; set; }
        public string PeriodoFin { get; set; }

        // Fotos
        public string Croquis { get; set; }
        public string Foto1 { get; set; }
        public string Foto2 { get; set; }
        public string Foto3 { get; set; }
        public string Foto4 { get; set; }
    }

    /// <summary>
    /// Modelo para seguimiento de avances
    /// </summary>
    public class Seguimiento
    {
        public long IdSeguimiento { get; set; }
        public long IdAcciones { get; set; }
        public long IdObraProyecto { get; set; }
        public string AccionMov { get; set; }

        // Datos generales
        public string NoAgeb { get; set; }
        public string FechaVerificacion { get; set; }
        public string FechaVisita { get; set; }
        public string Localidad { get; set; }
        public string ClaveLocalidad { get; set; }

        // Tipo de obra
        public bool Amplia { get; set; }
        public bool Construccion { get; set; }
        public bool Equipamiento { get; set; }
        public bool Mantenimiento { get; set; }
        public bool Rehabilitacion { get; set; }

        // Beneficio
        public bool Directa { get; set; }
        public bool Complementaria { get; set; }

        // Avances
        public decimal AvanceFisico { get; set; }
        public decimal AvanceFinanciero { get; set; }
        public bool CatalogoConcepto { get; set; }
        public string CambiosCatalogoConceptos { get; set; }
        public string CambiosAvanceFisico { get; set; }

        // Metas
        public string MetaUnidad { get; set; }
        public decimal MetaCantidad { get; set; }

        // Rubro
        public int IdRubro { get; set; }
        public string Rubro { get; set; }
        public int IdSubrubro { get; set; }
        public string Subrubro { get; set; }

        // Montos
        public decimal AportacionFismdf { get; set; }
        public decimal OtraFuenteFederal { get; set; }
        public decimal FuenteEstatal { get; set; }
        public decimal FuenteMunicipal { get; set; }
        public decimal Otros { get; set; }
        public decimal CostoTotal { get; set; }

        // Periodos
        public string PeriodoInicio { get; set; }
        public string PeriodoFin { get; set; }

        // Fotos (6 fotos con descripciones)
        public string Foto1 { get; set; }
        public string DescripcionFoto1 { get; set; }
        public string Foto2 { get; set; }
        public string DescripcionFoto2 { get; set; }
        public string Foto3 { get; set; }
        public string DescripcionFoto3 { get; set; }
        public string Foto4 { get; set; }
        public string DescripcionFoto4 { get; set; }
        public string Foto5 { get; set; }
        public string DescripcionFoto5 { get; set; }
        public string Foto6 { get; set; }
        public string DescripcionFoto6 { get; set; }
    }

    /// <summary>
    /// Modelo para item del grid de seguimientos
    /// </summary>
    public class SeguimientoGridItem
    {
        public long IdSeguimiento { get; set; }
        public string FechaVisita { get; set; }
        public decimal AvanceFisico { get; set; }
        public decimal AvanceFinanciero { get; set; }
        public decimal CostoTotal { get; set; }
    }

    /// <summary>
    /// Modelo para datos finales de obra
    /// </summary>
    public class DatosFinales
    {
        public long IdSeguimiento { get; set; }
        public long IdAcciones { get; set; }
        public long IdObraProyecto { get; set; }
        public string AccionMov { get; set; }

        // Datos generales
        public string NoAgeb { get; set; }
        public string FechaVerificacion { get; set; }
        public bool ObraConcluida { get; set; }
        public string Localidad { get; set; }
        public string ClaveLocalidad { get; set; }

        // Tipo de obra
        public bool Amplia { get; set; }
        public bool Construccion { get; set; }
        public bool Equipamiento { get; set; }
        public bool Mantenimiento { get; set; }
        public bool Rehabilitacion { get; set; }

        // Planeacion
        public bool CoincidePlaneacion { get; set; }
        public string DescripcionNoCoincide { get; set; }
        public string PeriodoEjecucionInicio { get; set; }
        public string PeriodoEjecucionFinal { get; set; }

        // Catalogo
        public bool CatalogoConcepto { get; set; }
        public string CambiosCatalogoConceptos { get; set; }

        // Rubro
        public bool CoincidePlaneacionRubro { get; set; }
        public string DescripcionNoCoincideRubro { get; set; }
        public int IdRubro { get; set; }
        public string Rubro { get; set; }
        public int IdSubrubro { get; set; }
        public string Subrubro { get; set; }

        // Metas
        public string MetaUnidad { get; set; }
        public decimal MetaCantidad { get; set; }

        // Montos
        public decimal AportacionFismdf { get; set; }
        public decimal OtraFuenteFederal { get; set; }
        public decimal FuenteEstatal { get; set; }
        public decimal FuenteMunicipal { get; set; }
        public decimal Otros { get; set; }
        public decimal CostoTotal { get; set; }

        // Descripcion
        public string DescripcionTrabajosRealizados { get; set; }

        // Periodos del contrato
        public string PeriodoInicioContrato { get; set; }
        public string PeriodoFinContrato { get; set; }

        // Fotos (6 fotos)
        public string Foto1 { get; set; }
        public string Foto2 { get; set; }
        public string Foto3 { get; set; }
        public string Foto4 { get; set; }
        public string Foto5 { get; set; }
        public string Foto6 { get; set; }
    }

    /// <summary>
    /// Modelo para ficha tecnica FISM
    /// </summary>
    public class FichaFism
    {
        public long IdFichaTecnica { get; set; }
        public long IdAcciones { get; set; }
        public long IdObraProyecto { get; set; }
        public string AccionMov { get; set; }

        // Datos generales
        public string Localidad { get; set; }
        public string ClaveLocalidad { get; set; }
        public int IdPrograma { get; set; }
        public string Programa { get; set; }
        public string Obra { get; set; }
        public string DescripcionObra { get; set; }
        public string Contrato { get; set; }

        // Periodos
        public string PeriodoInicio { get; set; }
        public string PeriodoFin { get; set; }

        // Inversiones
        public decimal InversionProgramadaFism { get; set; }
        public decimal InversionEjercidaFism { get; set; }
        public decimal AportacionProgramadaFism { get; set; }
        public decimal AportacionEjercidaFism { get; set; }

        // Dictamen
        public string Dictamen { get; set; }

        // Fechas programadas
        public string ProgramadoFechaInicial { get; set; }
        public string ProgramadoFechaFinal { get; set; }

        // Convenio/Contrato
        public decimal ConvenioContratoImporte { get; set; }
        public string ConvenioContratoFechaInicio { get; set; }
        public string ConvenioContratoFechaFin { get; set; }

        // Diferido
        public decimal ConvenioDiferidoImporte { get; set; }
        public string ConvenioDiferidoFechaInicio { get; set; }
        public string ConvenioDiferidoFechaFin { get; set; }

        // Ampliacion de plazo
        public decimal AmpliacionPlazoImporte { get; set; }
        public string AmpliacionPlazoFechaInicio { get; set; }
        public string AmpliacionPlazoFechaFin { get; set; }

        // Observaciones
        public string Observaciones { get; set; }

        // Fotos (2 fotos)
        public string Foto1 { get; set; }
        public string Foto2 { get; set; }
    }

    /// <summary>
    /// Modelo para finiquito
    /// </summary>
    public class Finiquito
    {
        public long IdFiniquito { get; set; }
        public long IdAcciones { get; set; }
        public long IdObraProyecto { get; set; }
        public string AccionMov { get; set; }

        // Datos generales
        public string Municipio { get; set; }
        public string NumObra { get; set; }
        public string Programa { get; set; }
        public string Subprograma { get; set; }
        public string FuenteFinanciamiento { get; set; }

        // Montos
        public decimal MontoFuente { get; set; }
        public decimal Devengado { get; set; }

        // Georeferenciacion
        public string Latitud { get; set; }
        public string Longitud { get; set; }

        // Fechas
        public string ProgramadoInicio { get; set; }
        public string RealTermino { get; set; }

        // Avance
        public decimal Financiero { get; set; }

        // Contrato
        public string Contrato { get; set; }
        public string Contratista { get; set; }

        // Descripcion
        public string DescripcionObra { get; set; }
        public string Observaciones { get; set; }

        // Archivo
        public string Archivo { get; set; }
    }

    /// <summary>
    /// Modelo para foto de georeferencia
    /// </summary>
    public class FotoGeoreferencia
    {
        public string Ruta { get; set; }
        public string Descripcion { get; set; }
    }

    /// <summary>
    /// Modelo para catalogos (anios, rubros, localidades, contratistas)
    /// </summary>
    public class CatalogoItem
    {
        public string Id { get; set; }
        public string Nombre { get; set; }
    }

    /// <summary>
    /// Modelo para respuesta generica
    /// </summary>
    public class ResponseModel
    {
        public bool Success { get; set; }
        public string Message { get; set; }
        public object Data { get; set; }
    }
}
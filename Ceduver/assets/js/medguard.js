/**
 * MedGuard - Sistema de Seguimiento Clínico
 * JavaScript Principal - Para ASP.NET Web Forms
 * VERSIÓN PARA METRONIC 7.0
 * ================================================
 */

"use strict";

// ============== Configuración Global ==============
var MedGuard = function() {
  // Criterios de clasificación médica
  var criteria = {
    critical: {
      spo2: { max: 89 },
      fc: { min: 130 },
      fr: { min: 30 },
      pas: { max: 89 },
      glasgow: { max: 8 },
      lactato: { min: 4 },
      requiresVM: true,
      requiresVasopressors: true
    },
    severe: {
      spo2: { min: 90, max: 93 },
      fc: { min: 110, max: 129 },
      fr: { min: 24, max: 29 },
      pas: { min: 90, max: 99 },
      glasgow: { min: 9, max: 12 },
      lactato: { min: 2, max: 3.9 },
      requiresO2: true
    }
  };

  // ============== Utilidades ==============
  var Utils = {
    // Formatear fecha
    formatDate: function(date, options) {
      options = options || {};
      var defaultOptions = {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      };
      return new Date(date).toLocaleDateString('es-MX', $.extend({}, defaultOptions, options));
    },

    // Formatear hora
    formatTime: function(date) {
      return new Date(date).toLocaleTimeString('es-MX', {
        hour: '2-digit',
        minute: '2-digit'
      });
    },

    // Generar ID único
    generateId: function() {
      return 'id_' + Math.random().toString(36).substr(2, 9);
    },

    // Capitalizar primera letra
    capitalize: function(str) {
      return str.charAt(0).toUpperCase() + str.slice(1);
    },

    // Obtener iniciales
    getInitials: function(name) {
      return name
        .split(' ')
        .map(function(word) { return word[0]; })
        .join('')
        .toUpperCase()
        .substring(0, 2);
    }
  };

  // ============== Clasificación Automática ==============
  var Classification = {
    // Evaluar clasificación basada en signos vitales
    evaluate: function(vitals) {
      var spo2 = vitals.spo2;
      var fc = vitals.fc;
      var fr = vitals.fr;
      var pas = vitals.pas;
      var temperatura = vitals.temperatura;
      var glasgow = vitals.glasgow;
      var lactato = vitals.lactato;
      var vm = vitals.vm;
      var vasopresores = vitals.vasopresores;
      var o2Suplementario = vitals.o2Suplementario;

      // Verificar criterios CRÍTICOS
      if (
        (spo2 && spo2 < 90) ||
        (fc && fc >= 130) ||
        (fr && fr >= 30) ||
        (pas && pas < 90) ||
        (glasgow && glasgow <= 8) ||
        (lactato && lactato >= 4) ||
        vm === true ||
        vasopresores === true
      ) {
        return 'CRITICO';
      }

      // Verificar criterios GRAVES
      if (
        (spo2 && spo2 >= 90 && spo2 <= 93) ||
        (fc && fc >= 110 && fc < 130) ||
        (fr && fr >= 24 && fr < 30) ||
        (pas && pas >= 90 && pas < 100) ||
        (glasgow && glasgow >= 9 && glasgow <= 12) ||
        (lactato && lactato >= 2 && lactato < 4) ||
        o2Suplementario === true
      ) {
        return 'GRAVE';
      }

      // Si no cumple criterios críticos ni graves
      return 'NO_GRAVE';
    },

    // Obtener clase CSS para clasificación (Metronic)
    getClass: function(classification) {
      var classes = {
        'CRITICO': 'danger',
        'GRAVE': 'warning',
        'NO_GRAVE': 'success'
      };
      return classes[classification] || 'success';
    },

    // Obtener texto para mostrar
    getDisplayText: function(classification) {
      var texts = {
        'CRITICO': 'CRÍTICO',
        'GRAVE': 'GRAVE',
        'NO_GRAVE': 'ESTABLE'
      };
      return texts[classification] || 'ESTABLE';
    }
  };

    // ============== Reloj en Tiempo Real ==============
    const Clock = {
        dateElement: null,
        timeElement: null,

        init() {
            this.dateElement = document.querySelector('.header-date span');
            this.timeElement = document.querySelector('.header-time span');
            if (this.dateElement || this.timeElement) {
                this.update();
                setInterval(() => this.update(), 1000);
            }
        },

        update() {
            const now = new Date();

            if (this.dateElement) {
                this.dateElement.textContent = Utils.formatDate(now);
            }

            if (this.timeElement) {
                this.timeElement.textContent = Utils.formatTime(now);
            }
        }
    };

  // ============== Filtros de Tabla ==============
  var TableFilters = {
    currentFilter: 'all',
    table: null,

    init: function() {
      var self = this;
      this.table = document.getElementById('patientsTable');
      
      // Usar los nav-pills de Metronic como filtros
      $('[data-filter]').on('click', function(e) {
        e.preventDefault();
        var filter = $(this).data('filter');
        self.setFilter(filter);
        
        // Actualizar estado activo
        $('[data-filter]').removeClass('active');
        $(this).addClass('active');
      });
    },

    setFilter: function(filter) {
      this.currentFilter = filter;
      
      if (!this.table) return;

      var rows = this.table.querySelectorAll('tbody tr');
      
      rows.forEach(function(row) {
        var classification = row.getAttribute('data-classification');
        
        if (filter === 'all' || classification === filter) {
          row.style.display = '';
        } else {
          row.style.display = 'none';
        }
      });
    }
  };

  // ============== Búsqueda de Pacientes ==============
  var Search = {
    input: null,
    table: null,

    init: function() {
      var self = this;
      this.input = document.getElementById('searchInput');
      this.table = document.getElementById('patientsTable');

      if (this.input && this.table) {
        $(this.input).on('input', function() { self.filter(); });
      }

      // Shortcut Ctrl+K para enfocar búsqueda
      $(document).on('keydown', function(e) {
        if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
          e.preventDefault();
          if (self.input) {
            $(self.input).focus();
          }
        }
      });
    },

    filter: function() {
      var query = this.input.value.toLowerCase().trim();
      var rows = this.table.querySelectorAll('tbody tr');

      rows.forEach(function(row) {
        var text = row.textContent.toLowerCase();
        row.style.display = text.includes(query) ? '' : 'none';
      });
    }
  };

  // ============== Formulario de Paciente ==============
  var PatientForm = {
    form: null,
    classificationAlert: null,
    classificationValue: null,

    init: function() {
      this.form = document.getElementById('patientForm');
      this.classificationAlert = document.getElementById('classificationAlert');
      this.classificationValue = document.getElementById('classificationValue');
      
      if (this.form) {
        this.bindEvents();
      }
    },

    bindEvents: function() {
      var self = this;
      
      // Escuchar cambios en los campos de signos vitales
      $(this.form).find('[data-vital]').on('input change', function() {
        self.updateClassification();
      });

      // Checkboxes de intervenciones
      $(this.form).find('[data-intervention]').on('change', function() {
        self.updateClassification();
      });

      // Submit del formulario
      $(this.form).on('submit', function(e) {
        self.handleSubmit(e);
      });
    },

    getVitals: function() {
      var $form = $(this.form);
      return {
        spo2: parseFloat($form.find('[data-vital="spo2"]').val()) || null,
        fc: parseFloat($form.find('[data-vital="fc"]').val()) || null,
        fr: parseFloat($form.find('[data-vital="fr"]').val()) || null,
        pas: parseFloat($form.find('[data-vital="pas"]').val()) || null,
        temperatura: parseFloat($form.find('[data-vital="temperatura"]').val()) || null,
        glasgow: parseFloat($form.find('[data-vital="glasgow"]').val()) || null,
        lactato: parseFloat($form.find('[data-vital="lactato"]').val()) || null,
        vm: $form.find('[data-intervention="vm"]').is(':checked'),
        vasopresores: $form.find('[data-intervention="vasopresores"]').is(':checked'),
        o2Suplementario: $form.find('[data-intervention="o2"]').is(':checked')
      };
    },

    updateClassification: function() {
      var vitals = this.getVitals();
      var classification = Classification.evaluate(vitals);
      var displayText = Classification.getDisplayText(classification);
      var cssClass = Classification.getClass(classification);

      if (this.classificationValue) {
        // Actualizar texto
        this.classificationValue.textContent = displayText;
      }

      if (this.classificationAlert) {
        // Actualizar clases CSS del alert
        $(this.classificationAlert)
          .removeClass('alert-light-success alert-light-warning alert-light-danger')
          .addClass('alert-light-' + cssClass);
        
        // Actualizar icono SVG
        var iconClass = 'svg-icon-' + cssClass;
        $(this.classificationAlert).find('.svg-icon')
          .removeClass('svg-icon-success svg-icon-warning svg-icon-danger')
          .addClass(iconClass);
      }

      // Actualizar campo oculto si existe
      var hiddenField = $(this.form).find('[name="clasificacion"]');
      if (hiddenField.length) {
        hiddenField.val(classification);
      }
    },

    handleSubmit: function(e) {
      var vitals = this.getVitals();
      var classification = Classification.evaluate(vitals);
      
      // Actualizar campo oculto antes del submit
      var hiddenField = $(this.form).find('[name="clasificacion"]');
      if (hiddenField.length) {
        hiddenField.val(classification);
      }

      // Validación básica
      var requiredFields = $(this.form).find('[required]');
      var isValid = true;

      requiredFields.each(function() {
        if (!$(this).val().trim()) {
          isValid = false;
          $(this).addClass('is-invalid');
        } else {
          $(this).removeClass('is-invalid');
        }
      });

      if (!isValid) {
        e.preventDefault();
        Toast.show('Por favor complete todos los campos requeridos', 'error');
      }
    },

    reset: function() {
      if (this.form) {
        this.form.reset();
        this.updateClassification();
      }
    }
  };

  // ============== Sistema de Notificaciones Toast ==============
  var Toast = {
    container: null,

    init: function() {
      // Crear contenedor si no existe
      this.container = document.getElementById('toastContainer');
      if (!this.container) {
        this.container = document.createElement('div');
        this.container.id = 'toastContainer';
        this.container.className = 'position-fixed';
        this.container.style.top = '20px';
        this.container.style.right = '20px';
        this.container.style.zIndex = '9999';
        document.body.appendChild(this.container);
      }
    },

    show: function(message, type, duration) {
      if (!this.container) this.init();
      
      type = type || 'success';
      duration = duration || 4000;
      
      var toastId = 'toast_' + Date.now();
      var iconSvg = this.getIcon(type);
      var toastClass = 'toast-' + type;
      
      var toastHtml = 
        '<div id="' + toastId + '" class="toast ' + toastClass + ' fade show" role="alert">' +
          '<div class="toast-header">' +
            '<span class="svg-icon svg-icon-md mr-2">' + iconSvg + '</span>' +
            '<strong class="mr-auto">' + this.getTitle(type) + '</strong>' +
            '<button type="button" class="ml-2 mb-1 close text-white" data-dismiss="toast" aria-label="Close">' +
              '<span aria-hidden="true">&times;</span>' +
            '</button>' +
          '</div>' +
          '<div class="toast-body">' + message + '</div>' +
        '</div>';
      
      $(this.container).append(toastHtml);
      
      // Auto remove
      setTimeout(function() {
        $('#' + toastId).fadeOut(300, function() {
          $(this).remove();
        });
      }, duration);
    },

    getIcon: function(type) {
      var icons = {
        success: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="20 6 9 17 4 12"></polyline></svg>',
        error: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"></circle><line x1="15" y1="9" x2="9" y2="15"></line><line x1="9" y1="9" x2="15" y2="15"></line></svg>',
        warning: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path><line x1="12" y1="9" x2="12" y2="13"></line><line x1="12" y1="17" x2="12.01" y2="17"></line></svg>',
        info: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="16" x2="12" y2="12"></line><line x1="12" y1="8" x2="12.01" y2="8"></line></svg>'
      };
      return icons[type] || icons.info;
    },

    getTitle: function(type) {
      var titles = {
        success: 'Éxito',
        error: 'Error',
        warning: 'Advertencia',
        info: 'Información'
      };
      return titles[type] || 'Notificación';
    }
  };

  // ============== Inicialización ==============
  return {
    init: function() {
      // Inicializar módulos
      Clock.init();
      TableFilters.init();
      Search.init();
      PatientForm.init();
      Toast.init();

      console.log('[MedGuard] Sistema inicializado correctamente - Metronic 7.0');
    },

    // Exponer módulos públicamente
    Classification: Classification,
    Utils: Utils,
    Toast: Toast,
    PatientForm: PatientForm,
    TableFilters: TableFilters
  };
}();

// Inicializar cuando el documento esté listo
$(document).ready(function() {
    MedGuard.init();
    
});

// Variable global para acceso rápido al Toast
var Toast = MedGuard.Toast;

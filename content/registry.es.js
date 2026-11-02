/* eslint-disable no-unused-vars */
// AI Use Case Registry — Spanish content.
//
// Translations only: the structure (which questions, tiers, sections and fields exist)
// comes from registry.en.js. Entries are matched to it by id, and anything missing here
// falls back to English. To add a language, copy this file (e.g. registry.fr.js), change
// "es" below to the new code, translate the values, then add the file to index.html and
// the code to `languages` in registry.config.js.
//
// Text reflects the RA-reviewed translation (AML normalized to "PLD" throughout).
//
// SPDX-License-Identifier: CC-BY-4.0
// "AI Use Case Registry" framework by AiR Hub at UNLV International Gaming Institute.
// Licensed under CC BY 4.0: credit AiR Hub when you share or adapt it (see LICENSE).

window.REGISTRY_LOCALES = window.REGISTRY_LOCALES || {};

window.REGISTRY_LOCALES.es = {
  label: "ES",
  flag: "🇪🇸",

  startPage: {
    title: "Registro de Casos de Uso de IA",
    version: "Versión 1.0",
    blurb:
      "Documente aquí cada caso de uso de IA en las operaciones de juego de su organización.",
    blurbTail:
      "Cada registro se incorpora a un inventario vivo de cómo se utiliza y gobierna la IA, de modo que pueda revisarse y supervisarse.",
    howItWorks: {
      eyebrow: "Cómo funciona",
      steps: [
        { title: "Evaluar", body: "Responda algunas preguntas de sí/no sobre su caso de uso de IA y cómo interactúa con los jugadores o los afecta." },
        { title: "Clasificar", body: "Sus respuestas determinan el nivel de impacto del caso de uso y cuánta documentación requiere." },
        { title: "Documentar", body: "Complete los campos de documentación correspondientes al nivel asignado y luego envíe el registro al inventario de su organización." },
      ],
      scaleLabel: "Los niveles de documentación se determinan según el impacto potencial de un caso de uso sobre los jugadores",
      axisLow: "Menor impacto en el jugador",
      axisHigh: "Mayor impacto en el jugador",
    },
    defsLabel: "Antes de comenzar",
    defsHeading: "Términos clave utilizados en el registro",
    defsIntro: "Estos términos tienen un significado específico en las preguntas de evaluación y en los campos de documentación.",
    defsToggleLabel: "Mostrar definiciones",
    definitions: [
      {
        term: "Sistema de IA",
        body: `Un sistema de IA es un sistema computacional o basado en máquinas que, para objetivos explícitos o implícitos, infiere a partir de la información que recibe cómo generar resultados tales como predicciones, contenidos, recomendaciones o decisiones que pueden influir en entornos físicos o virtuales y en los jugadores. Esto puede incluir sistemas de aprendizaje automático, IA generativa, análisis predictivo, modelos de comportamiento, sistemas de recomendación o sistemas avanzados de apoyo automatizado a la toma de decisiones.

Esta definición es una base recomendada, adaptada de la Recomendación de la OCDE sobre IA y del Marco de Manejo de Riesgos de IA del NIST. Las organizaciones que la adopten pueden ampliarla o adaptarla para reflejar su propio contexto y apetito de riesgo, pero deben evitar restringirla por debajo de este alcance.`,
        inlineLinks: [
          { phrase: "Recomendación de la OCDE sobre IA", url: "https://legalinstruments.oecd.org/en/instruments/OECD-LEGAL-0449" },
          { phrase: "Marco de Manejo de Riesgos de IA del NIST", url: "https://airc.nist.gov/airmf-resources/airmf/0-ai-rmf-1-0/" },
        ],
      },
      {
        term: "Caso de uso",
        body: "Un caso de uso se refiere a una aplicación operativa específica de un sistema de IA. Un mismo sistema de IA puede dar soporte a múltiples casos de uso que se ubican en diferentes niveles de impacto según cómo se utilice el sistema.",
      },
      {
        term: "Interacción e impacto en el jugador",
        body: "El grado en que los resultados de un sistema de IA afectan a jugadores individuales, ya sea de forma automática o mediante la acción de una persona. Esto abarca desde la interacción (dirigirse a los jugadores o comunicarse con ellos, o analizar su comportamiento o sus datos) hasta el impacto material (afectar de forma consecuente su bienestar, sus resultados financieros, su acceso, su comportamiento, la equidad, su autonomía o su tratamiento regulatorio). El lugar que ocupa un caso de uso en este espectro es lo que evalúa la evaluación inicial para asignar su nivel de documentación.",
      },
      {
        term: "Nivel de documentación",
        body: "El nivel de documentación asignado a un caso de uso según su impacto potencial sobre los jugadores. Los niveles son acumulativos: los niveles superiores requieren documentación adicional sobre la de los niveles inferiores.",
      },
    ],
    completionGuidance:
      "Dado que los campos proporcionados pueden no adaptarse perfectamente ni ser relevantes para cada caso de uso de IA, recomendamos hacer un esfuerzo razonable por completar todas las secciones. Si no está seguro de si un campo específico aplica, le aconsejamos actuar con cautela y divulgación conservadora completándolo.",
    tierToggleLabel: "Ver descripciones detalladas de los niveles y ejemplos de casos de uso para cada uno",
    examplesLabel: "Ejemplos",
  },

  tiers: {
    1: {
      name: "Nivel 1",
      label: "Base",
      abbr: "N1",
      headline: "Documentación base",
      docLabel: "base",
      short: "Casos de uso que no se dirigen a jugadores individuales, ni los analizan ni los abordan. Operan sobre datos agregados, documentos, usuarios internos o datos que no son de jugadores.",
      definition: "Los casos de uso de Nivel 1 no se dirigen a jugadores individuales, ni los analizan ni los abordan. Operan sobre datos agregados, documentos, usuarios internos o datos que no son de jugadores.",
      description: "Los casos de uso de Nivel 1 no se dirigen a jugadores individuales. La documentación base captura qué es el sistema y quién es responsable.",
      examples: [
        "Herramientas de resumen / traducción de documentos",
        "Copilotos de productividad para empleados",
        "Filtrado de spam",
        "Análisis operativos agregados",
        "Sistemas internos de programación",
      ],
    },
    2: {
      name: "Nivel 2",
      label: "Ampliado",
      abbr: "N2",
      headline: "Documentación ampliada",
      docLabel: "ampliada",
      short: "Casos de uso que se dirigen a jugadores individuales, los analizan o se comunican con ellos, pero cuyos resultados no afectan de forma sustancial un resultado consecuente para el jugador. Los resultados son de carácter consultivo no directivo, expresivo o experiencial.",
      definition: "Los casos de uso de Nivel 2 se dirigen a jugadores individuales, los analizan o se comunican con ellos, pero sus resultados no afectan de forma sustancial un resultado consecuente para el jugador. Los resultados son de carácter consultivo no directivo, expresivo o experiencial.",
      description: "Los resultados de Nivel 2 son de carácter consultivo no directivo, expresivo o experiencial. La documentación ampliada cubre la interacción con el jugador, la transparencia y la gobernanza interna además de los campos base.",
      examples: [
        "Asistente de atención al cliente con IA",
        "Textos de marketing generados por IA",
        "Mensajes educativos sobre juego responsable",
        "Un chatbot que solo responde preguntas frecuentes básicas",
        "Segmentación para marketing general",
      ],
    },
    3: {
      name: "Nivel 3",
      label: "Integral",
      abbr: "N3",
      headline: "Documentación integral",
      docLabel: "integral",
      short: "Casos de uso que pueden afectar de forma sustancial un resultado consecuente para el jugador al automatizar, determinar, recomendar o influir de forma directiva en decisiones sobre el acceso, el dinero, la protección, la identidad u otras decisiones operativas consecuentes.",
      definition: "Los casos de uso de Nivel 3 pueden afectar de forma sustancial un resultado consecuente para el jugador al automatizar, determinar, recomendar o influir de forma directiva en decisiones sobre:",
      description: "Los casos de uso de Nivel 3 automatizan, determinan, recomiendan o influyen de forma directiva en decisiones consecuentes sobre jugadores individuales. La documentación integral añade el impacto en el jugador, la privacidad de datos y la mitigación de riesgos además de todos los niveles inferiores.",
      categories: [
        { label: "Acceso", body: "estado de la cuenta, restricciones, exclusiones, elegibilidad" },
        { label: "Dinero", body: "depósitos, retiros, límites, asequibilidad, decisiones de apuestas" },
        { label: "Protección", body: "intervenciones de juego responsable, clasificaciones de vulnerabilidad, medidas de prevención de daños" },
        { label: "Identidad", body: "identificación biométrica, determinaciones de KYC" },
        { label: "Decisiones operativas consecuentes", body: "trato diferenciado, precios o cuotas dinámicas, determinaciones de fraude o escalada de Prevención de Lavado de Dinero (PLD)" },
      ],
      examples: [
        "Evaluaciones de asequibilidad",
        "Puntuación de riesgo de juego responsable y activación de intervenciones",
        "Clasificación de vulnerabilidad",
        "Sistemas de identificación biométrica / KYC",
        "Sistemas de Prevención de Lavado de Dinero (PLD) con acciones de escalada y aplicación automatizadas",
        "Un chatbot que ofrece recomendaciones de juego, incentivos conductuales o directivas de juego responsable",
        "Límites/cuotas dinámicos basados en perfiles de comportamiento",
        "Integraciones de banca abierta que afectan las decisiones sobre cuentas",
      ],
    },
  },

  materiality: {
    word: "sustancialmente",
    title: "Qué significa “sustancialmente” aquí",
    aria: "¿Qué significa “sustancialmente” aquí?",
    note: "A los efectos de este registro, “sustancialmente” se refiere a situaciones en las que cabría esperar razonablemente que un sistema de IA tuviera una influencia no trivial en los resultados para los jugadores, las obligaciones regulatorias o las operaciones empresariales significativas. Debido a la naturaleza contextual de la materialidad, las organizaciones deben considerar la escala, la gravedad, la probabilidad y la reversibilidad de los posibles impactos al determinar si un sistema alcanza este límite.",
  },

  // Screening groups, by id
  screening: {
    t3: {
      heading: "¿Podría este caso de uso afectar sustancialmente a los jugadores?",
      intro: "Responda específicamente sobre este caso de uso, no sobre todo lo que el sistema subyacente podría hacer. Si no está seguro de si algo aplica, inclínese por «Sí».",
    },
    t2: {
      heading: "¿Interactúa este caso de uso con jugadores individuales?",
      intro: "Si no está seguro de si algo aplica, inclínese por «Sí».",
    },
  },

  // Screening questions, by id
  questions: {
    A1: { title: "Acceso del jugador", phrase: "afecta sustancialmente el acceso del jugador",
      prompt: "¿Afecta sustancialmente este caso de uso el acceso del jugador (p. ej., estado de la cuenta, restricciones, exclusiones o decisiones de elegibilidad)?" },
    A2: { title: "Dinero del jugador", phrase: "afecta sustancialmente el dinero del jugador",
      prompt: "¿Afecta sustancialmente este caso de uso el dinero del jugador (p. ej., decisiones de asequibilidad, determinaciones de depósito/retiro/límite o recomendaciones directivas sobre apuestas, juego o gasto)?" },
    A3: { title: "Decisiones relacionadas con la protección", phrase: "apoya, automatiza o dirige decisiones relacionadas con la protección",
      prompt: "¿Apoya, automatiza o dirige este caso de uso decisiones relacionadas con la protección (p. ej., intervenciones de juego responsable, clasificaciones de vulnerabilidad, medidas de prevención de daños o recomendaciones a los jugadores sobre recursos de juego responsable o autoexclusión)?" },
    A4: { title: "Funciones de identidad", phrase: "realiza funciones de identidad (identificación biométrica / KYC)",
      prompt: "¿Realiza este caso de uso funciones de identidad (p. ej., identificación o verificación biométrica, o determinaciones de KYC)?" },
    A5: { title: "Decisiones operativas consecuentes", phrase: "influye en otras decisiones operativas consecuentes sobre los jugadores",
      prompt: "¿Toma este caso de uso, o influye sustancialmente en, otras decisiones operativas consecuentes sobre jugadores individuales (p. ej., trato diferenciado, precios o cuotas dinámicas, determinaciones de fraude o escalada de PLD) a partir del análisis o la clasificación específicos del jugador?" },
    B1: { title: "Comunicación directa", phrase: "se comunica directamente con jugadores individuales",
      prompt: "¿Se comunica este caso de uso directamente con jugadores individuales (p. ej., chat, mensajes generados, recomendaciones, contenido personalizado)?" },
    B2: { title: "Personalización", phrase: "personaliza contenido, promociones o experiencias",
      prompt: "¿Personaliza este caso de uso contenido, promociones, comunicaciones o experiencias para jugadores individuales?" },
    B3: { title: "Comportamiento del jugador", phrase: "analiza o clasifica el comportamiento de jugadores individuales",
      prompt: "¿Analiza o clasifica este caso de uso el comportamiento de jugadores individuales para fundamentar decisiones empresariales de carácter consultivo, expresivo o experiencial (p. ej., segmentación de marketing, puntuación de retención, recomendaciones de contenido)?" },
  },

  sections: {
    "t1-s1": "Resumen del caso de uso",
    "t1-s2": "Información de contacto",
    "t2-s1": "Detalle",
    "t2-s2": "Transparencia",
    "t2-s3": "Gobernanza interna",
    "t3-s1": "Detalle",
    "t3-s2": "Privacidad y protección de datos",
    "t3-s3": "Mitigación de riesgos",
    "t3-s4": "Arquitectura del modelo",
  },

  options: {
    "A1.5": ["Prueba", "Piloto", "Implementación activa", "En pausa"],
  },

  subfields: {
    name: "Nombre",
    role: "Función / Cargo",
    department: "Departamento",
    email: "Correo electrónico",
  },

  fields: {
    "A1.1": { name: "Nombre del caso de uso", prompt: "Indique el nombre utilizado internamente para identificar este sistema de IA o caso de uso." },
    "A1.2": { name: "Resumen del caso de uso", prompt: "Describa brevemente qué hace este caso de uso: su propósito principal y cómo se utiliza operativamente." },
    "A1.3": { name: "Tipo de sistema", prompt: "Identifique el tipo de IA o sistema automatizado utilizado (p. ej., aprendizaje automático, IA conversacional, sistema basado en reglas)." },
    "A1.4": { name: "Área operativa", prompt: "Identifique el área operativa principal donde se implementa el caso de uso (p. ej., marketing, atención al cliente, vigilancia, juego responsable, Prevención de Lavado de Dinero (PLD), fraude, operaciones)." },
    "A1.5": { name: "Estado de implementación", prompt: "Indique si el caso de uso está en prueba, piloto, implementación activa o en pausa." },
    "A1.6": { name: "Dependencias externas", prompt: "Identifique cualquier API externa, plataforma, herramienta, conjunto de datos o servicio de terceros del que dependa el sistema de IA de soporte." },
    "A1.7": { name: "Contacto de la organización", prompt: "Indique el contacto principal responsable de este registro." },
    "B1.1": { name: "Interacción con el jugador", prompt: "Describa cómo el caso de uso se comunica directamente con los jugadores, personaliza los resultados dirigidos a ellos, o analiza/clasifica su comportamiento para fundamentar decisiones empresariales de carácter consultivo, expresivo o experiencial." },
    "B2.1": { name: "Divulgación de la IA a los usuarios", prompt: "Si aplica, describa cómo se informa a los usuarios sobre este sistema de IA y su función en las comunicaciones, recomendaciones, personalización o decisiones. Si no se proporciona dicha divulgación, indique brevemente por qué." },
    "B2.2": { name: "Exclusión voluntaria del usuario", prompt: "Describa cualquier mecanismo que permita a los usuarios limitar este caso de uso o excluirse de él cuando sea operativamente viable. Si no existen dichos mecanismos, indique brevemente por qué." },
    "B2.3": { name: "Divulgación de información", prompt: "Describa cómo se divulga el caso de uso y/o el sistema de IA de soporte a las audiencias pertinentes (p. ej., reguladores, auditores, instituciones de supervisión y/o clientes). Si no se realizan dichas divulgaciones, indique brevemente por qué." },
    "B3.1": { name: "Documentación", prompt: "Describa cómo se documentan internamente las actualizaciones importantes, las revisiones, los eventos de reentrenamiento o las modificaciones operativas. Si existe una ficha de modelo (model card) o una plantilla de documentación estructurada equivalente para este caso de uso, descríbala." },
    "B3.2": { name: "Revisión del desempeño", prompt: "Describa los procesos generales utilizados para revisar el desempeño y abordar las inquietudes identificadas tras la implementación. Si no existen dichos procesos, indique brevemente por qué." },
    "B3.3": { name: "Supervisión humana", prompt: "Describa cualquier mecanismo de supervisión humana asociado a este caso de uso, incluidas las circunstancias en las que el personal puede revisar los resultados, supervisar los procesos asistidos por el sistema o intervenir cuando surjan inquietudes. Si no existe supervisión humana, indique brevemente por qué." },
    "B3.5": { name: "Revisión externa", prompt: "Indique si este caso de uso y/o el sistema de IA subyacente ha sido objeto de evaluaciones externas, revisiones independientes o evaluaciones de terceros. Si aplica, describa brevemente la naturaleza de estas actividades. Si no se ha realizado ninguna, indique brevemente por qué." },
    "C1.1": { name: "Impacto material en el jugador", prompt: "Describa cómo el caso de uso toma, o influye sustancialmente en, decisiones operativas consecuentes sobre individuos, o afecta el acceso, el dinero, la protección o la identidad de los jugadores." },
    "C1.2": { name: "Justificación del caso de uso", prompt: "Una clasificación de Nivel 3 amerita una deliberación adicional sobre su implementación. Describa cómo los beneficios previstos justifican el uso de IA para este caso de uso a la luz de su impacto potencial (p. ej., por qué se eligió esta solución en lugar de un método «tradicional»)." },
    "C2.1": { name: "Datos sensibles", prompt: "Describa cualquier dato potencialmente sensible utilizado por el sistema de IA de soporte (p. ej., datos de comportamiento, biométricos, financieros, de geolocalización u otros datos personales) y explique cómo estos datos respaldan la funcionalidad o el propósito previsto del sistema." },
    "C2.2": { name: "Datos de terceros y entre sistemas", prompt: "Describa cómo se incorporan al sistema conjuntos de datos externos, proveedores externos o integraciones entre sistemas, si aplica." },
    "C2.3": { name: "Retención y protección de datos", prompt: "Describa cómo se almacenan, conservan, protegen, gestionan y gobiernan los datos sensibles asociados al sistema a lo largo de su ciclo de vida. Si no existen dichas medidas, indique brevemente por qué." },
    "C3.1": { name: "Evaluación del modelo", prompt: "Describa las metodologías utilizadas para evaluar y validar el desempeño del sistema a lo largo del tiempo, incluidos los enfoques de prueba, las métricas de desempeño, los umbrales de monitoreo, los procesos de detección de deriva (drift) y los procedimientos utilizados para investigar y abordar los problemas identificados. Si no existen dichas medidas, indique brevemente por qué." },
    "C3.2": { name: "Equidad y sesgo", prompt: "Describa cómo la organización evalúa el caso de uso en busca de resultados injustos, discriminatorios o sesgados, incluido cómo se identifican, se prueban y se mitigan dichos riesgos. Si no se realizan dichas evaluaciones, indique brevemente por qué." },
    "C3.3": { name: "Explicabilidad", prompt: "Describa cómo los resultados, las recomendaciones o las decisiones producidas por el caso de uso pueden ser explicadas o interpretadas de forma razonable por las partes interesadas pertinentes. Si no existen medidas de explicabilidad, indique brevemente por qué." },
    "C3.4": { name: "Salvaguardas operativas", prompt: "Describa las salvaguardas operativas y los procedimientos de respuesta a incidentes establecidos para el sistema de IA, incluidas las vías de escalada, las capacidades de reversión, los procedimientos de apagado y los planes de contingencia utilizados cuando se identifican problemas significativos. Si no existen dichas salvaguardas, indique brevemente por qué." },
    "C4.1": { name: "Desarrollo del sistema", prompt: "Describa brevemente si el sistema se desarrolló de forma interna, externa o mediante un enfoque híbrido." },
    "C4.2": { name: "Metodología de entrenamiento", prompt: "Describa a alto nivel cómo se entrenó, configuró, desarrolló o implementó el sistema o modelo." },
    "C4.3": { name: "Documentación de incidentes", prompt: "Describa cómo se documentan internamente los incidentes operativos, las fallas, los resultados perjudiciales o los problemas materiales del sistema." },
  },

  // Interface wording (same keys as `ui` in registry.en.js)
  ui: {
    returnTitle: "Volver al inicio",
    pageLabel_start: "Portada",
    pageLabel_screening: "Evaluación",
    pageLabel_documentation: "Documentación",
    pageLabel_review: "Revisar y enviar",
    pageLabel_submitted: "Enviado",
    prog_screening: "Evaluación",
    prog_documentation: "Documentación",
    prog_review: "Revisar",
    langAria: "Idioma",

    tier: "Nivel",
    yes: "Sí",
    no: "No",
    continue: "Continuar",
    backToScreening: "Volver a la evaluación",
    downloadDraft: "Descargar borrador",
    previewSubmission: "Previsualizar el registro",
    print: "Imprimir",
    backToEdit: "Volver a editar",
    confirmSubmit: "Confirmar y enviar",
    startAnother: "Iniciar otro registro",
    notProvided: "No proporcionado",
    word: "palabra",
    words: "palabras",
    chars: "caracteres",
    ph_enter: "Escriba su respuesta…",
    ph_selectStatus: "Seleccione el estado…",
    ph_describe: "Proporcione una descripción clara y concreta…",
    ph_select: "Seleccione…",
    ph_email: "nombre@organizacion.com",
    and: "y",

    startSubmission: "Iniciar un nuevo registro de caso de uso",
    readFirst: "Leer primero",
    beginScreening: "Comenzar la evaluación",
    resumeSubmission: "Continuar su registro en curso",
    openSaved: "Abrir un registro guardado",
    demoBar: "Demostración: esto es lo que vería su personal. Nada de lo que ingrese se guarda ni se envía.",
    demoBarLink: "Obtener el registro de código abierto",
    demoConfigShow: "¿Qué puedo cambiar?",
    demoConfigHide: "Ocultar etiquetas",
    importError: "Ese archivo no es un registro que este registro pueda abrir.",
    openOtherVersion: "Este registro se creó con la {0} de las preguntas y los campos del registro. Este registro usa la {1}.",
    openDroppedFields: "{0} respuesta(s) corresponden a campos que este registro ya no tiene ({1}). Se omitirán al guardar o enviar.",
    openRescreen: "Las preguntas de evaluación han cambiado desde que se creó este registro, así que primero volverá a pasar por la evaluación. Sus respuestas anteriores aparecen ya completadas.",
    openContinue: "¿Abrirlo de todos modos?",

    screeningStage: "Evaluación",
    prog_intake: "Registro del caso de uso",
    prog_section: "Sección {0} de {1}",
    prog_result: "Resultado",
    intake_eyebrow: "Paso 1 · Registro del caso de uso",
    intake_heading: "Identifique el caso de uso.",
    intake_sub: "Asigne un nombre a este caso de uso e identifique en qué parte de sus operaciones se ubica. Esto servirá de referencia para su registro durante el resto del proceso.",
    intake_nameLabel: "Nombre del caso de uso",
    intake_namePrompt: "Indique el nombre utilizado internamente para identificar este caso de uso de IA.",
    intake_namePlaceholder: "p. ej., Puntuación de Riesgo JR v2, Copiloto de Atención al Cliente",
    intake_areaLabel: "Área operativa",
    intake_areaPrompt: "Identifique el área operativa principal donde se implementa el sistema (p. ej., marketing, atención al cliente, vigilancia, juego responsable, Prevención de Lavado de Dinero (PLD), fraude, operaciones).",
    intake_areaPlaceholder: "p. ej., Juego responsable",
    backToStart: "Volver a la portada",
    continueToScreening: "Continuar a la evaluación",
    groupEyebrow: "Evaluación · Sección {0} de {1}",
    answeredOf: "{0} / {1} respondidas",
    allAnswered: "Todas las preguntas respondidas",
    answerAll: "Responda todas las preguntas para continuar",
    backToIntake: "Volver al registro",
    backToPrevSection: "Volver a la sección anterior",
    result_eyebrow: "Resultado de la evaluación",
    result_headA: "Este caso de uso es ",
    result_headB: " y requiere documentación {0}.",
    result_subA: "Según sus respuestas sobre ",
    result_subIn: " en ",
    thisUseCase: "este caso de uso",
    yourDocumentation: "Su documentación",
    required: "Requerido",
    notRequired: "No requerido",
    reAnswer: "Volver a responder la evaluación",
    continueToDoc: "Continuar a la documentación",

    fieldsCountOf: "{0} / {1} campos",
    docEyebrow: "Documentando el caso de uso",
    docTitlePlaceholder: "Caso de uso sin título",
    docAreaLabel: "Área operativa",
    docAreaPlaceholder: "p. ej., Juego responsable",
    sectionWord: "Sección",
    contextA: "Usted indicó que este caso de uso ",
    contextB: ". Describa cómo lo hace.",

    previewEyebrow: "Vista previa del registro · Aún no enviado",
    previewTitlePlaceholder: "Caso de uso sin título",
    previewNoteA: "Revise sus respuestas a continuación. Cuando estén listas, seleccione ",
    fact_docLevel: "Nivel de documentación",
    fact_area: "Área operativa",
    fact_deployment: "Estado de implementación",
    fact_contact: "Contacto principal",
    fieldsComplete: "campos completados",
    allFieldsComplete: "Todos los campos completados",
    fieldsEmptyOne: "{0} campo aún vacío",
    fieldsEmptyMany: "{0} campos aún vacíos",
    sectionXofY: "Sección {0} de {1}",
    complete: "✓ Completo",
    nEmpty: "{0} vacíos",

    submittedEyebrow: "Enviado · {0}",
    submittedHeading: "Registro completo.",
    submittedBody: "Este registro no almacena nada por sí mismo. Descargue el registro y añádalo al inventario de su organización.",
    dl_json: "Registro (.json)",
    dl_csv: "Fila de hoja de cálculo (.csv)",
    dl_template: "Hoja de inventario en blanco (.csv)",
    sending: "Enviando al registro de su organización…",
    sentOk: "También se envió al registro de su organización.",
    sentRefused: "El registro de su organización no aceptó el registro. Descárguelo y avise a quien administra el registro.",
    sentUnreachable: "No se pudo contactar con el registro de su organización. Compruebe su conexión e inténtelo de nuevo, o descargue el registro.",
    sentReason: "Motivo: {0}.",
    retrySend: "Intentar de nuevo",
    dash: "—",
    dialogReturnHome: "¿Volver a la página de inicio? Su registro en curso se conservará durante esta sesión.",
    dialogDiscardWork: "¿Descartar su registro en curso? Esta acción no se puede deshacer.",
    dialogRecordUnsaved: "No ha descargado este registro y aquí no se conserva ninguna copia. ¿Salir sin guardarlo?",
  },
};

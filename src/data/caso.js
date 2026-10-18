// Caso ficticio con fines didácticos. Personas, folios, matrículas y lugares son inventados.

export const PARTE_INFORMATIVO = `DOCUMENTO FICTICIO CON FINES DIDÁCTICOS.

PARTE INFORMATIVO DE PUESTA A DISPOSICIÓN · Folio PI-COL-0314-2026 (ficticio)
Colima, Colima, a 15 de marzo de 2026.

C. Agente del Ministerio Público de la Federación en turno. Presente.

El suscrito, agente Héctor Ramírez Solís, en compañía del agente Óscar Torres Medina, a bordo de la unidad PE-117, informo a usted lo siguiente:

Siendo aproximadamente las 21:05 horas del día 14 de marzo de 2026, nos encontrábamos realizando recorrido de prevención y vigilancia sobre la calle Laureles, de la colonia Lomas del Volcán, en esta ciudad de Colima. La zona cuenta con alumbrado público deficiente.

Al llegar a la esquina con el Andador Tamarindo observamos a una persona del sexo masculino que caminaba sobre la banqueta. Al notar la presencia policial, el sujeto se mostró nervioso e intentó retirarse del lugar a paso apresurado, por lo que descendimos de la unidad y le dimos alcance a unos metros.

Nos identificamos plenamente como policías estatales y le indicamos que se le realizaría una inspección de persona, a lo que accedió. El suscrito realizó la inspección, mientras mi compañero brindaba seguridad perimetral, y le localicé un arma de fuego fajada a la cintura, del lado derecho, cubierta por la playera.

Al cuestionarle si contaba con permiso o licencia para portarla, manifestó de manera espontánea que el arma era suya y que la traía para su protección, sin exhibir documento alguno. Por lo anterior, siendo las 21:10 horas, se procedió a su detención por encontrarse en flagrancia.

En el lugar no se localizaron testigos de los hechos, por no encontrarse personas en las inmediaciones.

Persona detenida: Julián Mora Arellano, 24 años. Vestimenta: playera gris, pantalón de mezclilla azul, tenis blancos.

Objeto asegurado (indicio 1): una pistola semiautomática, calibre .45 ACP, color negro, con matrícula visible XK45-1102 (ficticia), con un cargador abastecido con siete cartuchos útiles del mismo calibre. Otros objetos: un teléfono celular color negro y una cartera con identificación a nombre del detenido. No se localizaron otros objetos.

El suscrito procedí a fijar fotográficamente el arma en el lugar, la descargué, y la embalé y etiqueté junto con el cargador y los cartuchos, iniciando el registro de cadena de custodia a las 21:40 horas, el cual firmo como responsable.

Lectura de derechos: 21:15 horas. Registro de la detención: 23:48 horas, folio RD-0314-118 (ficticio). Puesta a disposición ante el Ministerio Público de la Federación: 01:40 horas del 15 de marzo de 2026. El tiempo transcurrido se debió a la elaboración de la documentación correspondiente y a la carga de trabajo de la unidad.

Elaboró: Agente Héctor Ramírez Solís. Acompañó: Agente Óscar Torres Medina.`;

export const ENTREVISTA_LUCIA = `DOCUMENTO FICTICIO CON FINES DIDÁCTICOS.

ENTREVISTA A TESTIGO DE LA DEFENSA · Lucía Hernández, vendedora de elotes.

Tengo mi puesto de elotes en la esquina de Laureles y Andador Tamarindo desde hace ocho años; lo abro de seis de la tarde a diez de la noche. Mi puesto tiene un foco propio; la calle está oscura. El 14 de marzo, ya de noche, vi pasar al muchacho; caminaba normal, sin mochila, con las manos vacías. Llegó la patrulla, se bajaron dos policías rápido, lo pusieron contra la pared y uno de ellos le metió la mano en la cintura. En ese momento yo no vi ningún arma. Después lo subieron a la patrulla. Nadie me preguntó nada.`;

// Versión que el agente sostendrá en juicio (guion del testigo de IA).
export const VERSION_JUICIO_RAMIREZ = `Eres el agente Héctor Ramírez Solís, policía primero de la Policía Estatal Preventiva de Colima, 38 años, 11 años de servicio. Declaras en juicio oral como testigo de cargo. Tu versión HOY es esta y la sostienes con firmeza:
- La detención fue "como a las 20:40".
- Desde la patrulla, a unos 30 metros, le vieron "el bulto del arma" al joven; por eso lo revisaron.
- El arma estaba "en una mochila negra que traía en la espalda".
- Quien hizo la revisión fue "mi compañero Torres"; tú dabas seguridad.
- El joven les dijo que el arma era suya.
- Reconoces que elaboraste y firmaste un informe esa misma noche, con los hechos frescos.
- No recuerdas a ninguna vendedora en la esquina.
- La puesta a disposición tardó "por el papeleo".`;

export const TESTIGOS_INICIALES = [
  {
    id: 'ramirez',
    nombre: 'Agente Héctor Ramírez Solís',
    rol: 'Testigo de cargo · policía aprehensor',
    lado: 'contraparte',
    perfil: VERSION_JUICIO_RAMIREZ,
  },
  {
    id: 'lucia',
    nombre: 'Lucía Hernández',
    rol: 'Testigo de la defensa · vendedora de elotes',
    lado: 'propio',
    perfil: 'Eres Lucía Hernández, 52 años, vendedora de elotes. Declaras como testigo de la defensa. Hablas sencillo y con calma. Tu versión es la de tu entrevista.',
  },
];

export const DOCUMENTOS_INICIALES = [
  { id: 'doc-parte', titulo: 'Parte informativo policial (ficticio)', tipo: 'Informe policial', testigoId: 'ramirez', texto: PARTE_INFORMATIVO, origen: 'precargado' },
  { id: 'doc-lucia', titulo: 'Entrevista de Lucía Hernández (ficticia)', tipo: 'Entrevista', testigoId: 'lucia', texto: ENTREVISTA_LUCIA, origen: 'precargado' },
];

// Teoría del caso de la defensa (hipótesis didáctica). Los elementos del tipo se presentan como guía
// de estudio y deben verificarse en la ley y la jurisprudencia aplicables.
export const TEORIA_INICIAL = {
  parte: 'defensa',
  cliente: 'Julián Mora Arellano',
  versionImputado: 'Salí de casa de mi tía como a las nueve de la noche para ir a la tienda; no llevaba mochila, solo mi celular. En la calle Laureles se paró una patrulla, se bajaron dos policías y me pusieron contra la pared. Uno de ellos me revisó, pero no fue el que manejaba. Me subieron a la patrulla y me dieron vueltas un buen rato antes de llevarme a la Fiscalía. Nunca me leyeron mis derechos en la calle. Yo no traía ninguna pistola. La señora de los elotes de la esquina vio todo.',
  lema: 'Un policía que no sabe dónde encontró el arma no puede probar que alguien la portaba.',
  relato: 'La noche del 14 de marzo de 2026, Julián caminaba por la calle Laureles, en Colima, sin mochila y con las manos vacías. Dos policías estatales bajaron de su patrulla, lo pusieron contra la pared y lo revisaron sin que hubiera un motivo objetivo. La única persona que presenció la escena, la vendedora de elotes de la esquina, no vio ningún arma. La versión policial cambia cada vez que se cuenta: la hora, quién revisó, dónde estaba el arma y por qué lo detuvieron.',
  delito: 'Portación de arma de fuego de uso exclusivo de la Fuerza Armada Permanente (pistola calibre .45), art. 83, fracción II, en relación con el art. 11, inciso b), de la Ley Federal de Armas de Fuego y Explosivos.',
  elementos: [
    { id: 'e1', elemento: 'Que el acusado portaba el arma (la llevaba consigo, a su alcance)', postura: 'atacar', comentario: 'La ubicación del arma es contradictoria (cintura vs. mochila) y nadie más la vio en su poder.' },
    { id: 'e2', elemento: 'Que el arma es de uso exclusivo (calibre .45, art. 11, inciso b, LFAFE)', postura: 'no-controvertir', comentario: 'Pericialmente difícil de discutir; concentrar la defensa en los otros elementos.' },
    { id: 'e3', elemento: 'Que carecía de licencia o permiso', postura: 'reconocer', comentario: 'No hay licencia: no gastar credibilidad en este punto.' },
    { id: 'e4', elemento: 'Licitud de la detención y de la prueba (arts. 16 y 20, A-IX, CPEUM)', postura: 'atacar', comentario: 'Revisión sin motivo objetivo, confesión sin defensor y registro tardío de la detención.' },
  ],
  proposiciones: [
    { id: 'p1', texto: 'Julián caminaba sin mochila y con las manos vacías.', elementoId: 'e1', prueba: 'Testimonio de Lucía Hernández; el parte no lista ninguna mochila.', estado: 'pendiente' },
    { id: 'p2', texto: 'El agente no podía ver un arma a 30 metros, de noche, con alumbrado deficiente.', elementoId: 'e4', prueba: 'Contrainterrogatorio del agente Ramírez; su propio parte describe el alumbrado deficiente.', estado: 'pendiente' },
    { id: 'p3', texto: 'El motivo de la revisión fue el supuesto nerviosismo, no un arma visible.', elementoId: 'e4', prueba: 'Parte informativo, confrontado con el art. 376 CNPP.', estado: 'pendiente' },
    { id: 'p4', texto: 'La versión del agente sobre dónde estaba el arma cambió.', elementoId: 'e1', prueba: 'Parte (fajada a la cintura) frente a declaración en juicio (mochila).', estado: 'pendiente' },
    { id: 'p5', texto: 'La supuesta confesión ocurrió antes de la lectura de derechos y sin defensor.', elementoId: 'e4', prueba: 'Horas asentadas en el parte: manifestación 21:10, lectura de derechos 21:15.', estado: 'pendiente' },
  ],
  lineas: [
    { id: 'l1', titulo: 'La revisión fue ilícita', fundamento: 'Art. 16 CPEUM (acto de molestia sin motivo) y art. 20, A-IX (nulidad de la prueba obtenida con violación de derechos).', prioridad: 1, mision: [{ testigoId: 'ramirez', tipo: 'contra', objetivo: 'Fijar que el motivo escrito fue el nerviosismo y que nunca vio el arma antes de revisar.' }] },
    { id: 'l2', titulo: 'El agente no es creíble', fundamento: 'Contradicciones con su registro previo (art. 376 CNPP) y capacidad de percepción.', prioridad: 2, mision: [{ testigoId: 'ramirez', tipo: 'contra', objetivo: 'Evidenciar contradicciones sobre hora, quién revisó y ubicación del arma.' }] },
    { id: 'l3', titulo: 'Nadie más vio el arma', fundamento: 'Carga de la prueba en la acusación (art. 20, A-V CPEUM); duda razonable.', prioridad: 3, mision: [{ testigoId: 'lucia', tipo: 'directo', objetivo: 'Acreditar que vio la escena de cerca, que Julián no traía mochila y que no vio arma.' }] },
  ],
};

// ===== Modo demostración sin conexión: respuestas grabadas y validadas =====
export const DEMO_CONTRA = [
  {
    pregunta: 'Agente, hoy declaró que desde la patrulla le vieron el bulto del arma, ¿correcto?',
    respuesta: 'Sí, correcto. Desde la patrulla se le notaba el bulto del arma.',
    semaforo: { veredicto: 'valida', motivo: 'ninguno', explicacion: 'Sugestiva y cerrada: permitida a la contraparte en contrainterrogatorio (art. 373 CNPP).', reformulacion: '' },
    alerta: { hay_contradiccion: true, tipo: 'contradiccion', tema: 'Motivo de la revisión', dicho_hoy: 'Desde la patrulla se le notaba el bulto del arma.', cita_informe: 'Al notar la presencia policial, el sujeto se mostró nervioso e intentó retirarse del lugar', explicacion: 'Hoy el motivo es haber visto el arma; en el informe, el motivo fue el nerviosismo. El informe no dice que vieran el arma antes de revisarlo.', secuencia_376: { comprometer: 'Usted dijo hoy que vio el bulto del arma desde la patrulla, ¿correcto?', acreditar: 'Usted elaboró y firmó un informe esa misma noche, ¿cierto?', confrontar: 'Lea en voz alta el párrafo donde explica por qué revisó al joven.' } },
  },
  {
    pregunta: 'La patrulla estaba a unos 30 metros, ¿cierto?',
    respuesta: 'Sí, como a treinta metros.',
    semaforo: { veredicto: 'valida', motivo: 'ninguno', explicacion: 'Cerrada, un solo hecho, permitida en contrainterrogatorio.', reformulacion: '' },
    alerta: { hay_contradiccion: true, tipo: 'percepcion', tema: 'Capacidad de percibir', dicho_hoy: 'Como a treinta metros.', cita_informe: 'La zona cuenta con alumbrado público deficiente', explicacion: 'Afirma haber visto un bulto a 30 metros, de noche, en una zona que su propio informe describe con alumbrado deficiente.', secuencia_376: { comprometer: 'Usted vio el bulto a unos 30 metros, de noche, ¿correcto?', acreditar: 'En su informe describió las condiciones del lugar, ¿cierto?', confrontar: 'Lea cómo describió el alumbrado de la zona.' } },
  },
  {
    pregunta: 'El arma la traía en una mochila, ¿verdad?',
    respuesta: 'Así es, en una mochila negra que traía en la espalda.',
    semaforo: { veredicto: 'valida', motivo: 'ninguno', explicacion: 'Sugestiva en contrainterrogatorio: permitida. Útil para comprometer al testigo antes de confrontarlo.', reformulacion: '' },
    alerta: { hay_contradiccion: true, tipo: 'contradiccion', tema: 'Ubicación del arma', dicho_hoy: 'En una mochila negra que traía en la espalda.', cita_informe: 'fajada a la cintura, del lado derecho, cubierta por la playera', explicacion: 'Hoy: mochila en la espalda. Informe: fajada a la cintura. Además, el informe no lista ninguna mochila entre los objetos.', secuencia_376: { comprometer: 'Usted dijo hoy que el arma estaba en una mochila negra, ¿correcto?', acreditar: 'Su informe lo hizo esa noche, con los hechos frescos, y lo firmó, ¿cierto?', confrontar: 'Lea dónde dice su informe que localizó el arma.' } },
  },
  {
    pregunta: 'La revisión la hizo su compañero Torres, ¿no es así?',
    respuesta: 'Sí, lo revisó mi compañero Torres; yo daba seguridad.',
    semaforo: { veredicto: 'valida', motivo: 'ninguno', explicacion: 'Cerrada y sugestiva: permitida en contrainterrogatorio.', reformulacion: '' },
    alerta: { hay_contradiccion: true, tipo: 'contradiccion', tema: 'Quién realizó la inspección', dicho_hoy: 'Lo revisó mi compañero Torres; yo daba seguridad.', cita_informe: 'El suscrito realizó la inspección', explicacion: 'Hoy atribuye la revisión a su compañero; en el informe afirma que él mismo la realizó.', secuencia_376: { comprometer: 'Hoy nos dijo que quien revisó fue el agente Torres, ¿correcto?', acreditar: 'El informe lo firmó usted como suscrito, ¿cierto?', confrontar: 'Lea quién realizó la inspección según su informe.' } },
  },
  {
    pregunta: 'Lo detuvieron como a las 20:40, ¿correcto?',
    respuesta: 'Sí, eran como las 20:40.',
    semaforo: { veredicto: 'valida', motivo: 'ninguno', explicacion: 'Cerrada, un solo hecho.', reformulacion: '' },
    alerta: { hay_contradiccion: true, tipo: 'contradiccion', tema: 'Hora de la detención', dicho_hoy: 'Eran como las 20:40.', cita_informe: 'siendo las 21:10 horas, se procedió a su detención', explicacion: 'Treinta minutos de diferencia entre la hora de hoy y la del informe.', secuencia_376: { comprometer: 'Usted dijo hoy que la detención fue como a las 20:40, ¿correcto?', acreditar: 'En su informe anotó la hora exacta, ¿cierto?', confrontar: 'Lea a qué hora asentó la detención.' } },
  },
  {
    pregunta: 'Usted elaboró un informe esa misma noche y lo firmó, ¿cierto?',
    respuesta: 'Sí, lo elaboré y lo firmé.',
    semaforo: { veredicto: 'valida', motivo: 'ninguno', explicacion: 'Pregunta de acreditación del registro previo: necesaria antes de confrontar (art. 376 CNPP).', reformulacion: '' },
    alerta: { hay_contradiccion: false },
  },
];

export const DEMO_SEMAFORO = [
  { pregunta: 'Usted vio claramente el arma, ¿verdad?', modo: 'directo', resultado: { veredicto: 'objetable', motivo: 'sugestiva', explicacion: 'En el interrogatorio directo no se permiten preguntas sugestivas; solo la contraparte puede hacerlas en contrainterrogatorio (art. 373 CNPP).', reformulacion: '¿Qué vio usted al acercarse?' } },
  { pregunta: '¿Qué hizo usted al llegar al lugar?', modo: 'directo', resultado: { veredicto: 'valida', motivo: 'ninguno', explicacion: 'Abierta y sobre un hecho específico.', reformulacion: '' } },
  { pregunta: '¿Diría usted que el acusado es un delincuente peligroso?', modo: 'directo', resultado: { veredicto: 'objetable', motivo: 'conclusiva', explicacion: 'Pide al testigo una conclusión que corresponde al juez.', reformulacion: '¿Qué hizo el acusado cuando ustedes se acercaron?' } },
  { pregunta: '¿Cómo estaba el clima la semana anterior?', modo: 'directo', resultado: { veredicto: 'objetable', motivo: 'irrelevante', explicacion: 'No guarda relación con los hechos del caso.', reformulacion: '' } },
  { pregunta: 'Si no traía nada que ocultar, ¿por qué se puso nervioso, eh?', modo: 'directo', resultado: { veredicto: 'objetable', motivo: 'argumentativa', explicacion: 'Discute con el testigo en lugar de preguntarle un hecho.', reformulacion: '¿Cómo reaccionó el joven al ver la patrulla?' } },
];

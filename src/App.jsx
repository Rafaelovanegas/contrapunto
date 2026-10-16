import { useEffect, useState } from 'react';
import { MODELO_POR_DEFECTO } from './config.js';
import { leer, guardar } from './lib/storage.js';
import { DOCUMENTOS_INICIALES, TESTIGOS_INICIALES, TEORIA_INICIAL } from './data/caso.js';
import { normalizarTeoria } from './lib/teoria.js';
import TeoriaCaso from './components/TeoriaCaso.jsx';
import Audiencia from './components/Audiencia.jsx';
import Expediente from './components/Expediente.jsx';
import Preparacion from './components/Preparacion.jsx';
import Semaforo from './components/Semaforo.jsx';
import EnVivo from './components/EnVivo.jsx';
import Ajustes from './components/Ajustes.jsx';

const AJUSTES_INICIALES = {
  llaveAnthropic: '',
  llaveEleven: '',
  vozId: '',
  usarEleven: true,
  modelo: MODELO_POR_DEFECTO,
  modoDemo: true,
  tema: 'codelexia',
  escala: 1,
};

const PESTANAS = [
  { id: 'teoria', nombre: 'Teoría del caso' },
  { id: 'audiencia', nombre: 'Audiencia' },
  { id: 'expediente', nombre: 'Expediente' },
  { id: 'preparacion', nombre: 'Preparación' },
  { id: 'semaforo', nombre: 'Semáforo' },
  { id: 'vivo', nombre: 'En vivo' },
  { id: 'ajustes', nombre: 'Ajustes' },
];

function usePersistente(clave, inicial) {
  const [valor, setValor] = useState(() => leer(clave, inicial));
  useEffect(() => { guardar(clave, valor); }, [clave, valor]);
  return [valor, setValor];
}

export default function App() {
  const [ajustes, setAjustes] = usePersistente('ajustes', AJUSTES_INICIALES);
  const [testigos, setTestigos] = usePersistente('testigos', TESTIGOS_INICIALES);
  const [documentos, setDocumentos] = usePersistente('documentos', DOCUMENTOS_INICIALES);
  const [teoriaGuardada, setTeoria] = usePersistente('teoria', TEORIA_INICIAL);
  const teoria = normalizarTeoria(teoriaGuardada, TEORIA_INICIAL);
  const [lineaActiva, setLineaActiva] = useState(null);
  const [generarAlEntrar, setGenerarAlEntrar] = useState(false);
  const [pestana, setPestana] = usePersistente('pestana', 'audiencia');

  const aj = { ...AJUSTES_INICIALES, ...ajustes };
  const iaLista = !aj.modoDemo && !!aj.llaveAnthropic;

  useEffect(() => {
    document.documentElement.dataset.tema = aj.tema;
    document.documentElement.style.setProperty('--escala', String(aj.escala));
  }, [aj.tema, aj.escala]);

  function restaurarCaso() {
    setTestigos(TESTIGOS_INICIALES);
    setDocumentos(DOCUMENTOS_INICIALES);
    setTeoria(TEORIA_INICIAL);
  }

  const props = { ajustes: aj, testigos, documentos, teoria };
  const setTeoriaNorm = (f) => setTeoria((x) => (typeof f === 'function' ? f(normalizarTeoria(x, TEORIA_INICIAL)) : f));
  const irA = (destino, lineaId = null, opciones = {}) => { setLineaActiva(lineaId); setGenerarAlEntrar(!!opciones.generar); setPestana(destino); };

  return (
    <div className="app">
      <header className="cabecera">
        <div className="marca">
          <p className="marca__producto">CONTRAPUNTO</p>
          <p className="marca__eco"><span className="marca__neuralexia">NEURALEXIA</span> · ECOSISTEMA INTELIGENTE</p>
        </div>
        <div className="cabecera__estado">
          {aj.modoDemo ? (
            <span className="estado estado--demo">Modo demostración</span>
          ) : iaLista ? (
            <span className="estado estado--ok">IA conectada · {aj.modelo}</span>
          ) : (
            <button type="button" className="estado estado--falta" onClick={() => setPestana('ajustes')}>Falta la llave de IA</button>
          )}
          <span className="marca__codelexia">CODELEXIA</span>
        </div>
      </header>

      <nav className="pestanas" aria-label="Secciones">
        {PESTANAS.map((p) => (
          <button key={p.id} type="button" className={`pestana ${pestana === p.id ? 'pestana--activa' : ''}`} aria-current={pestana === p.id ? 'page' : undefined} onClick={() => setPestana(p.id)}>{p.nombre}</button>
        ))}
      </nav>

      <main className="contenido">
        {pestana === 'teoria' && <TeoriaCaso {...props} setTeoria={setTeoriaNorm} irA={irA} generarAlEntrar={generarAlEntrar} consumirGenerar={() => setGenerarAlEntrar(false)} />}
        {pestana === 'audiencia' && <Audiencia {...props} />}
        {pestana === 'expediente' && <Expediente {...props} setTestigos={setTestigos} setDocumentos={setDocumentos} irA={irA} />}
        {pestana === 'preparacion' && <Preparacion {...props} lineaInicial={lineaActiva} />}
        {pestana === 'semaforo' && <Semaforo {...props} />}
        {pestana === 'vivo' && <EnVivo {...props} />}
        {pestana === 'ajustes' && <Ajustes ajustes={aj} setAjustes={(f) => setAjustes((a) => (typeof f === 'function' ? f({ ...AJUSTES_INICIALES, ...a }) : f))} restaurarCaso={restaurarCaso} />}
      </main>

      <footer className="pie">
        <p><strong>Aviso.</strong> Herramienta de apoyo para preparar y practicar interrogatorios. No sustituye la asesoría ni el criterio de un abogado: la IA sugiere, el abogado decide. Puede equivocarse; verifica todo contra los documentos originales.</p>
        <p><strong>Secreto profesional y datos personales.</strong> No introduzcas información amparada por secreto profesional ni datos de casos reales sin autorización: lo que envías a la IA se procesa en servidores de terceros (Anthropic, ElevenLabs y el reconocimiento de voz del navegador). El caso precargado es ficticio.</p>
        <p className="pie__marca">CONTRAPUNTO · NEURALEXIA · CODELEXIA · Corporativo Vanegas y Asociados</p>
      </footer>
    </div>
  );
}

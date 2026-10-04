import { useState, useEffect } from 'react'
import { supabase } from './supabase'
import './App.css'

export default function App() {
  const [seccion, setSeccion] = useState('inicio');
  const [modoEdicion, setModoEdicion] = useState(false);
  const [subiendo, setSubiendo] = useState(false);
  const [imagenAmpliada, setImagenAmpliada] = useState(null);
  const [cargandoDatos, setCargandoDatos] = useState(true);

  // Estructura base por si la base de datos está vacía
  const baseDatos = {
    portada: { nombre: "Nombre de tu Padre", fechas: "Año - Año", fotoPrincipal: "" },
    historia: [], fotografias: [], palabras: [], voz: [],
    videos: [], familia: [], recuerdos: [], legado: []
  };

  const [datos, setDatos] = useState(baseDatos);

  // 1. DESCARGAR LOS TEXTOS DESDE SUPABASE AL ABRIR LA PÁGINA
  useEffect(() => {
    const cargarDesdeLaNube = async () => {
      try {
        const { data, error } = await supabase
          .from('museo_datos')
          .select('contenido')
          .eq('id', 1)
          .single();

        if (error) throw error;
        
        // Si hay datos guardados, los combinamos con la base
        if (data && data.contenido && Object.keys(data.contenido).length > 0) {
          let contenidoDescargado = data.contenido;
          
          // PROTECCIÓN: Si quedaron frases viejas en formato texto, las convierte a formato de tarjeta automáticamente
          if (contenidoDescargado.palabras && contenidoDescargado.palabras.length > 0) {
            contenidoDescargado.palabras = contenidoDescargado.palabras.map((p, i) => 
              typeof p === 'string' ? { id: Date.now() + i, titulo: "Texto Anterior", texto: p, archivo: "" } : p
            );
          }

          setDatos({ ...baseDatos, ...contenidoDescargado });
        }
      } catch (error) {
        console.error('Error al cargar datos:', error);
      } finally {
        setCargandoDatos(false);
      }
    };
    cargarDesdeLaNube();
  }, []);

  // 2. GUARDAR LOS TEXTOS EN SUPABASE AL SALIR DE EDICIÓN
  const guardarEnLaNube = async () => {
    setSubiendo(true);
    try {
      const { error } = await supabase
        .from('museo_datos')
        .update({ contenido: datos })
        .eq('id', 1);

      if (error) throw error;
      setModoEdicion(false);
    } catch (error) {
      alert('Error al guardar en la nube: ' + error.message);
    } finally {
      setSubiendo(false);
    }
  };

  const SeccionesMenu = [
    { id: 'historia', titulo: 'SU HISTORIA' },
    { id: 'fotografias', titulo: 'FOTOGRAFÍAS' },
    { id: 'palabras', titulo: 'FE Y ESPIRITUALIDAD' },
    { id: 'voz', titulo: 'SU VOZ' },
    { id: 'videos', titulo: 'VIDEOS' },
    { id: 'familia', titulo: 'SU FAMILIA' },
    { id: 'recuerdos', titulo: 'RECUERDOS' },
    { id: 'legado', titulo: 'CANCIONES' },
  ];

  const subirArchivoSupabase = async (evento, callbackActualizacion) => {
    try {
      const archivo = evento.target.files[0];
      if (!archivo) return;
      setSubiendo(true);
      const nombreArchivo = `${Date.now()}_${archivo.name}`;
      
      const { error } = await supabase.storage.from('museo_media').upload(`archivos/${nombreArchivo}`, archivo);
      if (error) throw error;

      const { data: linkPublico } = supabase.storage.from('museo_media').getPublicUrl(`archivos/${nombreArchivo}`);
      callbackActualizacion(linkPublico.publicUrl);
    } catch (error) {
      alert('Error al subir: ' + error.message);
    } finally {
      setSubiendo(false);
    }
  };

  const actualizarPortada = (campo, valor) => setDatos({ ...datos, portada: { ...datos.portada, [campo]: valor } });
  
  const agregarItem = (idSeccion) => setDatos({ ...datos, [idSeccion]: [...datos[idSeccion], { id: Date.now(), titulo: "Nuevo Título", texto: "Escribe la historia aquí...", archivo: "" }] });
  const actualizarItem = (idSeccion, idItem, campo, valor) => setDatos({ ...datos, [idSeccion]: datos[idSeccion].map(item => item.id === idItem ? { ...item, [campo]: valor } : item) });
  const eliminarItem = (idSeccion, idItem) => setDatos({ ...datos, [idSeccion]: datos[idSeccion].filter(item => item.id !== idItem) });

  const agregarFotoGaleria = (url) => setDatos({ ...datos, fotografias: [...datos.fotografias, url] });
  const eliminarFotoGaleria = (index) => setDatos({ ...datos, fotografias: datos.fotografias.filter((_, i) => i !== index) });

  const renderizarSeccionTarjetas = (idSeccion) => {
    const permiteAudio = idSeccion === 'voz';
    const permiteVideo = idSeccion === 'videos';

    return (
      <div className="contenido-historia">
        {datos[idSeccion].map((item) => (
          <div key={item.id} className="tarjeta-capitulo" style={{position: 'relative'}}>
            {modoEdicion && <button onClick={() => eliminarItem(idSeccion, item.id)} style={{position: 'absolute', top: '10px', right: '10px', background: 'red', color: 'white', border: 'none', borderRadius: '5px', padding: '5px 10px', cursor: 'pointer'}}>Eliminar</button>}
            {modoEdicion ? <input type="text" value={item.titulo} onChange={(e) => actualizarItem(idSeccion, item.id, 'titulo', e.target.value)} style={{width: '85%', fontSize: '1.5rem', marginBottom: '10px'}} /> : <h3>{item.titulo}</h3>}
            {modoEdicion ? <textarea value={item.texto} onChange={(e) => actualizarItem(idSeccion, item.id, 'texto', e.target.value)} style={{width: '100%', height: '100px', marginBottom: '10px'}} /> : <p>{item.texto}</p>}

            {item.archivo && !permiteAudio && !permiteVideo && (
              <img src={item.archivo} alt={item.titulo} className="imagen-capitulo" style={{maxWidth: '100%', marginTop: '15px', borderRadius: '8px', cursor: modoEdicion ? 'default' : 'zoom-in'}} onClick={() => !modoEdicion && setImagenAmpliada(item.archivo)} />
            )}
            {item.archivo && permiteAudio && <audio controls src={item.archivo} style={{width: '100%', marginTop: '15px'}} />}
            {item.archivo && permiteVideo && <video controls src={item.archivo} style={{width: '100%', marginTop: '15px', borderRadius: '8px'}} />}

            {modoEdicion && (
              <div style={{ marginTop: '15px' }}>
                <label style={{ cursor: 'pointer', backgroundColor: '#8c7653', color: 'white', padding: '8px 15px', borderRadius: '4px', fontSize: '0.9rem' }}>
                  {subiendo ? '⏳ Subiendo...' : `📎 Subir ${permiteAudio ? 'Audio' : permiteVideo ? 'Video' : 'Foto'}`}
                  <input type="file" accept={permiteAudio ? "audio/*" : permiteVideo ? "video/*" : "image/*"} style={{ display: 'none' }} onChange={(e) => subirArchivoSupabase(e, (url) => actualizarItem(idSeccion, item.id, 'archivo', url))} disabled={subiendo} />
                </label>
              </div>
            )}
          </div>
        ))}
        {modoEdicion && <button onClick={() => agregarItem(idSeccion)} style={{padding: '15px', cursor: 'pointer', backgroundColor: '#5cb85c', color: 'white', border: 'none', borderRadius: '5px', fontSize: '1.1rem', marginTop: '20px', width: '100%'}}>+ Agregar Nuevo Elemento</button>}
      </div>
    );
  };

  if (cargandoDatos) {
    return <div style={{display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', color: '#8c7653', fontSize: '2rem'}}>Cargando Museo...</div>;
  }

  return (
    <div className="museo-contenedor">
      {imagenAmpliada && (
        <div className="visor-imagen" onClick={() => setImagenAmpliada(null)}>
          <button className="cerrar-visor" onClick={() => setImagenAmpliada(null)}>X</button>
          <img src={imagenAmpliada} alt="Ampliación" onClick={(e) => e.stopPropagation()} />
        </div>
      )}

      {/* BOTÓN SECRETO */}
      {window.location.search.includes('secreto=si') && (
        <button 
          onClick={modoEdicion ? guardarEnLaNube : () => setModoEdicion(true)}
          disabled={subiendo}
          style={{
            position: 'fixed', top: '10px', right: '10px', zIndex: 1000,
            backgroundColor: modoEdicion ? '#d9534f' : '#5cb85c', color: 'white',
            padding: '10px 15px', border: 'none', borderRadius: '5px', cursor: 'pointer', fontSize: '1rem'
          }}
        >
          {subiendo ? '⏳ Guardando...' : modoEdicion ? '💾 Guardar en la Nube y Salir' : '✏ Activar Edición'}
        </button>
      )}

      {seccion === 'inicio' ? (
        <div className="pantalla-inicio fade-in">
          <header className="cabecera-portada">
            <div className="marco-foto-principal">
              <img src={datos.portada.fotoPrincipal} alt="Rodolfo" className="foto-principal" style={{cursor: (!modoEdicion && datos.portada.fotoPrincipal) ? 'zoom-in' : 'default'}} onClick={() => !modoEdicion && datos.portada.fotoPrincipal && setImagenAmpliada(datos.portada.fotoPrincipal)} />
            </div>
            
            {modoEdicion && (
              <div style={{ marginTop: '15px' }}>
                <label style={{ cursor: 'pointer', backgroundColor: '#8c7653', color: 'white', padding: '10px 20px', borderRadius: '5px', fontWeight: 'bold' }}>
                  {subiendo ? '⏳ Subiendo foto...' : '📷 Subir Foto de Portada'}
                  <input type="file" accept="image/*" style={{ display: 'none' }} onChange={(e) => subirArchivoSupabase(e, (url) => actualizarPortada('fotoPrincipal', url))} disabled={subiendo} />
                </label>
              </div>
            )}

            {modoEdicion ? <input type="text" className="nombre-titulo" value={datos.portada.nombre} onChange={(e) => actualizarPortada('nombre', e.target.value)} style={{width: '100%', textAlign: 'center', background: 'transparent', border: '1px solid #ccc', marginTop: '10px'}} /> : <h1 className="nombre-titulo">{datos.portada.nombre}</h1>}
            {modoEdicion ? <input type="text" className="fechas-subtitulo" value={datos.portada.fechas} onChange={(e) => actualizarPortada('fechas', e.target.value)} style={{width: '100%', textAlign: 'center', background: 'transparent', border: '1px solid #ccc'}} /> : <p className="fechas-subtitulo">{datos.portada.fechas}</p>}
          </header>
          
          <div className="cuadricula-menu">
            {SeccionesMenu.map((item) => (
              <button key={item.id} className="tarjeta-boton" onClick={() => setSeccion(item.id)}>{item.titulo}</button>
            ))}
          </div>
        </div>
      ) : (
        <div className="pantalla-seccion fade-in">
          <button className="boton-volver" onClick={() => setSeccion('inicio')}>← Volver al Inicio</button>
          
          <h2 className="titulo-seccion">
            {seccion === 'palabras' ? 'FE Y ESPIRITUALIDAD' : seccion.toUpperCase()}
          </h2>

          {seccion === 'fotografias' && (
            <div className={`galeria-dinamica ${(datos.fotografias.length === 1 && !modoEdicion) ? 'una-foto' : 'varias-fotos'}`}>
              {datos.fotografias.map((foto, index) => (
                <div key={index} style={{position: 'relative'}}>
                  <img src={foto} alt={`Fotografía ${index + 1}`} style={{cursor: modoEdicion ? 'default' : 'zoom-in'}} onClick={() => !modoEdicion && setImagenAmpliada(foto)} />
                  {modoEdicion && <button onClick={() => eliminarFotoGaleria(index)} style={{position: 'absolute', top: '10px', right: '10px', background: 'red', color: 'white', border: 'none', borderRadius: '50%', width: '30px', height: '30px', cursor: 'pointer'}}>X</button>}
                </div>
              ))}
              {modoEdicion && (
                <label className="boton-subir-galeria">
                  {subiendo ? '⏳ Subiendo...' : '+ Agregar Foto'}
                  <input type="file" accept="image/*" style={{ display: 'none' }} onChange={(e) => subirArchivoSupabase(e, agregarFotoGaleria)} disabled={subiendo} />
                </label>
              )}
            </div>
          )}

          {/* DIBUJA LAS TARJETAS PARA ESTAS SECCIONES (incluyendo fe y espiritualidad) */}
          {['historia', 'palabras', 'familia', 'recuerdos', 'legado', 'voz', 'videos'].includes(seccion) && renderizarSeccionTarjetas(seccion)}
        </div>
      )}
    </div>
  )
}
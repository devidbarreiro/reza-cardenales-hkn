// app.js - Funcionalidad principal para la aplicación de asignación de cardenales

// Importar los datos de los cardenales desde el archivo externo
import cardinals from './cardinals.js';

/**
 * Actualiza las opciones de días basado en el mes seleccionado
 * Si no hay mes seleccionado, muestra todos los 31 días
 */
function updateDayOptions() {
  console.log('Actualizando opciones de día...');
  const monthSelect = document.getElementById('month-select');
  const daySelect = document.getElementById('day-select');
  const monthValue = monthSelect.value;
  
  // Restaurar el placeholder pero mantener la selección actual si existe
  const currentSelectedDay = daySelect.value;
  daySelect.innerHTML = '<option value="" disabled selected>Día</option>';
  
  // Determinar cuántos días mostrar
  let daysInMonth = 31; // Por defecto, mostramos 31 días
  
  // Si hay un mes seleccionado, calculamos el número correcto de días
  if (monthValue) {
    if (['04', '06', '09', '11'].includes(monthValue)) {
      daysInMonth = 30;
    } else if (monthValue === '02') {
      daysInMonth = 29; // Asumimos año bisiesto para cubrir todos los casos
    }
  }

  // Agregar las opciones de días
  for (let i = 1; i <= daysInMonth; i++) {
    const dayValue = i.toString().padStart(2, '0');
    const option = document.createElement('option');
    option.value = dayValue;
    option.textContent = i;
    daySelect.appendChild(option);
  }
  
  // Intentar restaurar el día seleccionado previamente si es válido
  if (currentSelectedDay && parseInt(currentSelectedDay) <= daysInMonth) {
    daySelect.value = currentSelectedDay;
  }
  
  console.log(`Se generaron ${daysInMonth} días${monthValue ? ' para el mes ' + monthValue : ' (todos)'}`);
}

/**
 * Encuentra y muestra el cardenal correspondiente a la fecha seleccionada
 * Implementa una solución más robusta para el desplazamiento de imágenes
 */
function findCardinal() {
  console.log('Buscando cardenal...');
  const monthSelect = document.getElementById('month-select');
  const daySelect = document.getElementById('day-select');
  const month = monthSelect.value;
  const day = daySelect.value;
  
  // Validación básica
  if (!month || !day) {
    alert('Por favor, selecciona mes y día.');
    return;
  }

  // Elementos del DOM
  const resultContainer = document.getElementById('result');
  const imgEl = document.getElementById('cardinal-image');
  const nameEl = document.getElementById('cardinal-name');
  const prayerNameEl = document.getElementById('prayer-cardinal-name');
  const findButton = document.getElementById('find-button');
  
  // Cambiar el estado del botón y agregar un spinner mientras buscamos
  findButton.disabled = true;
  const originalButtonText = findButton.innerHTML;
  findButton.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Buscando...';
  
  // Preparar el contenedor de resultados
  if (!resultContainer.classList.contains('active')) {
    resultContainer.classList.add('active');
    resultContainer.classList.add('loading'); // Nueva clase para estado de carga
  }
  
  // Resetear estado previo si existe
  imgEl.style.opacity = '0.2';
  imgEl.src = '';
  nameEl.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Cargando información...';
  prayerNameEl.textContent = '';

  // Crear fecha para comparación (usando un año arbitrario)
  const target = new Date(2000, parseInt(month, 10) - 1, parseInt(day, 10));
  console.log(`Fecha seleccionada: ${target.toLocaleDateString()}`);

  // Buscar el cardenal correspondiente
  const found = cardinals.find(c => {
    const [sD, sM] = c.start.split('-').map(n => parseInt(n, 10));
    const [eD, eM] = c.end.split('-').map(n => parseInt(n, 10));
    let start = new Date(2000, sM - 1, sD);
    let end = new Date(2000, eM - 1, eD);
    
    // Si el rango cruza el fin de año
    if (end < start) end.setFullYear(2001);
    
    // Ajustar fecha objetivo si es necesario
    const targetAdjusted = new Date(target);
    if (target < start && end.getFullYear() > start.getFullYear()) {
      targetAdjusted.setFullYear(2001);
    }
    
    return targetAdjusted >= start && targetAdjusted <= end;
  });

  // Función para completar el proceso y hacer scroll
  const completeProcess = () => {
    // Restaurar el botón
    findButton.disabled = false;
    findButton.innerHTML = originalButtonText;
    
    // Eliminar la clase de carga
    resultContainer.classList.remove('loading');
    
    // Hacer scroll suave hacia el resultado
    setTimeout(() => {
      const headerHeight = document.querySelector('.header').offsetHeight;
      const scrollPosition = resultContainer.offsetTop - headerHeight - 20;
      window.scrollTo({ top: scrollPosition, behavior: 'smooth' });
    }, 100);
  };
  
  if (found) {
    console.log(`Cardenal encontrado: ${found.name}`);
    
    // Precargar la imagen para evitar saltos de layout
    const preloadImg = new Image();
    
    preloadImg.onload = function() {
      // Actualizar la información en el DOM
      nameEl.textContent = found.name;
      imgEl.src = found.image;
      imgEl.alt = `Imagen de ${found.name}`;
      prayerNameEl.textContent = found.name;
      
      // Animar la aparición de la imagen con un pequeño retraso
      setTimeout(() => {
        imgEl.style.opacity = '1';
        completeProcess();
      }, 150);
      
      // Guardar la selección en almacenamiento local
      localStorage.setItem('lastCardinal', found.name);
      localStorage.setItem('lastCardinalImage', found.image);
      localStorage.setItem('lastMonth', month);
      localStorage.setItem('lastDay', day);
    };
    
    preloadImg.onerror = function() {
      console.error('Error al cargar la imagen del cardenal');
      nameEl.textContent = found.name;
      imgEl.src = '/public/images/no-image.png'; // Imagen de respaldo
      imgEl.alt = `Imagen no disponible para ${found.name}`;
      imgEl.style.opacity = '1';
      prayerNameEl.textContent = found.name;
      completeProcess();
    };
    
    // Iniciar la carga de la imagen
    preloadImg.src = found.image;
    
  } else {
    console.log('No se encontró un cardenal para esa fecha');
    nameEl.textContent = 'No se encontró un cardenal para esa fecha.';
    imgEl.src = '';
    imgEl.alt = 'No se encontró imagen';
    imgEl.style.opacity = '0';
    completeProcess();
  }
}

/**
 * Comparte la información del cardenal en redes sociales
 */
function share(platform) {
  const cardinalName = document.getElementById('cardinal-name').textContent;
  const pageTitle = 'Reza por un Cardenal';
  const pageUrl = window.location.href;
  
  if (!cardinalName || cardinalName.includes('No se encontró')) return;
  
  let shareUrl;
  
  switch (platform) {
    case 'facebook':
      shareUrl = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(pageUrl)}&quote=${encodeURIComponent(`Mi cardenal asignado para oración es: ${cardinalName} - ${pageTitle}`)}`;
      break;
    case 'twitter':
      shareUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(`Mi cardenal asignado para oración es: ${cardinalName} - ${pageTitle}`)}&url=${encodeURIComponent(pageUrl)}`;
      break;
    case 'whatsapp':
      shareUrl = `https://api.whatsapp.com/send?text=${encodeURIComponent(`Mi cardenal asignado para oración es: ${cardinalName} - ${pageTitle} ${pageUrl}`)}`;
      break;
  }
  
  if (shareUrl) {
    window.open(shareUrl, '_blank');
  }
}

/**
 * Genera y descarga la estampita del cardenal
 * Implementa mejoras para que la imagen se vea correctamente
 */
function generateCardinalCard() {
  console.log('Generando estampita...');
  const cardinalName = document.getElementById('cardinal-name').textContent;
  const cardinalImage = document.getElementById('cardinal-image').src;
  const downloadMessage = document.getElementById('download-message');
  
  if (!cardinalName || !cardinalImage || cardinalName.includes('No se encontró') || cardinalImage === window.location.origin + '/') {
    alert('No hay un cardenal seleccionado. Por favor, busca primero tu cardenal.');
    return;
  }
  
  // Cambiar el texto del botón para indicar que se está procesando
  const downloadBtn = document.getElementById('download-btn');
  const originalBtnText = downloadBtn.innerHTML;
  downloadBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Procesando...';
  downloadBtn.disabled = true;
  downloadBtn.classList.add('loading');
  
  // Crear un elemento canvas
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');
  
  // Establecer las dimensiones de la estampita
  canvas.width = 600;
  canvas.height = 900;
  
  // Función para cargar la imagen del cardenal
  const loadCardinalImage = () => {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.crossOrigin = 'Anonymous';
      img.onload = () => resolve(img);
      img.onerror = () => reject(new Error('No se pudo cargar la imagen del cardenal'));
      img.src = cardinalImage;
    });
  };
  
  // Función para cargar el logo
  const loadLogo = () => {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.crossOrigin = 'Anonymous';
      img.onload = () => resolve(img);
      img.onerror = () => reject(new Error('No se pudo cargar el logo'));
      img.src = '/public/images/tu-fecha-su-fuego.png';
    });
  };
  
  // Texto de la oración
  const prayerText = `Padre bueno, gracias.
    Gracias por el Papa Francisco,
    por su vida alegre y gastada sin reservas,
    por su corazón inquieto por los descartados
    y su ejemplo de misericordia.
    Ahora abrázalo tú.

    Dios Hijo, que pensaste en Pedro
    cuando imaginaste tu Iglesia,
    danos un nuevo Papa que nos hable de ti sin miedo,
    que muestre esas facetas de tu rostro
    de las que el mundo tiene sed y aún no conoce.

    Espíritu Santo,
    despiértanos en esta espera.

    Prepara ahora nuestra Iglesia
    para el Papa que viene,
    haznos tierra buena para lo nuevo,
    que lo acojamos con alegría,
    con humildad y confianza sin cálculos.
    Tú sabrás guiarnos.

    Te pido luz para el ${cardinalName}, que le concedas
    tu claridad y libertad interior
    para elegir según tu voluntad.

    A ti, Dios vivo,
    te decimos sí.`;
  
  // Crear y descargar la estampita
  Promise.all([loadCardinalImage(), loadLogo()])
    .then(([cardinalImg, logoImg]) => {
      console.log('Imágenes cargadas correctamente');
      
      // Dibujar el fondo
      const gradient = ctx.createLinearGradient(0, 0, 0, canvas.height);
      gradient.addColorStop(0, '#ffffff');
      gradient.addColorStop(1, '#f8f8f8');
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      
      // Dibujar borde decorativo
      ctx.strokeStyle = '#c41e3a';
      ctx.lineWidth = 8;
      ctx.strokeRect(10, 10, canvas.width - 20, canvas.height - 20);
      
      // Añadir decoración sutil en las esquinas
      const drawCornerDecoration = (x, y, rotate) => {
        ctx.save();
        ctx.translate(x, y);
        ctx.rotate(rotate * Math.PI / 180);
        
        ctx.beginPath();
        ctx.moveTo(0, 0);
        ctx.lineTo(30, 0);
        ctx.arc(30, 15, 15, 270 * Math.PI / 180, 0, false);
        ctx.lineTo(45, 40);
        ctx.lineTo(0, 40);
        ctx.closePath();
        
        ctx.fillStyle = 'rgba(196, 30, 58, 0.1)';
        ctx.fill();
        ctx.restore();
      };
      
      // Dibujar decoraciones en las cuatro esquinas
      drawCornerDecoration(10, 10, 0);
      drawCornerDecoration(canvas.width - 10, 10, 90);
      drawCornerDecoration(canvas.width - 10, canvas.height - 10, 180);
      drawCornerDecoration(10, canvas.height - 10, 270);
      
      // Dibujar el logo en la parte superior
      const logoWidth = 250;
      const logoHeight = (logoImg.height / logoImg.width) * logoWidth;
      ctx.drawImage(logoImg, (canvas.width - logoWidth) / 2, 30, logoWidth, logoHeight);
      
      // MEJORA: Dibujar la imagen del cardenal correctamente centrada y proporcionada
      const imgSize = 180; // Tamaño del círculo de recorte
      const imgX = (canvas.width - imgSize) / 2;
      const imgY = logoHeight + 50;
      
      // Calcular proporciones para un mejor ajuste
      const originalWidth = cardinalImg.width;
      const originalHeight = cardinalImg.height;
      
      // Determinar qué dimensión usar para escalar y centrar
      let sourceX = 0;
      let sourceY = 0;
      let sourceDim = 0;
      
      if (originalWidth > originalHeight) {
        // Si la imagen es más ancha que alta, centramos horizontalmente
        sourceDim = originalHeight;
        sourceX = (originalWidth - originalHeight) / 2;
      } else {
        // Si la imagen es más alta que ancha, centramos verticalmente
        sourceDim = originalWidth;
        sourceY = (originalHeight - originalWidth) / 2;
      }
      
      // MEJORA: Suavizado para la imagen del cardenal
      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = 'high';
      
      // Crear recorte circular
      ctx.save();
      ctx.beginPath();
      ctx.arc(imgX + imgSize/2, imgY + imgSize/2, imgSize/2, 0, Math.PI * 2, true);
      ctx.closePath();
      ctx.clip();
      
      // Dibujar la imagen con el recorte aplicado
      try {
        ctx.drawImage(
          cardinalImg,
          sourceX, sourceY, sourceDim, sourceDim, // Área de la fuente (recorte cuadrado centrado)
          imgX, imgY, imgSize, imgSize // Área de destino (círculo)
        );
      } catch (e) {
        console.error('Error al dibujar la imagen:', e);
        // Intento alternativo con menos parámetros
        ctx.drawImage(cardinalImg, imgX, imgY, imgSize, imgSize);
      }
      ctx.restore();
      
      // Dibujar borde dorado alrededor de la imagen
      ctx.beginPath();
      ctx.arc(imgX + imgSize/2, imgY + imgSize/2, imgSize/2 + 4, 0, Math.PI * 2, true);
      ctx.strokeStyle = '#d4af37';
      ctx.lineWidth = 4;
      ctx.stroke();
      
      // Añadir un ligero sombreado a la imagen
      ctx.beginPath();
      ctx.arc(imgX + imgSize/2, imgY + imgSize/2, imgSize/2 + 8, 0, Math.PI * 2, true);
      ctx.strokeStyle = 'rgba(0, 0, 0, 0.05)';
      ctx.lineWidth = 8;
      ctx.stroke();
      
      // Dibujar el nombre del cardenal
      ctx.font = 'bold 22px Montserrat, Arial, sans-serif';
      ctx.fillStyle = '#2a2a2a';
      ctx.textAlign = 'center';
      ctx.fillText(cardinalName, canvas.width / 2, imgY + imgSize + 30);
      
      // Dibujar una línea decorativa
      ctx.beginPath();
      ctx.moveTo(canvas.width / 2 - 100, imgY + imgSize + 45);
      ctx.lineTo(canvas.width / 2 + 100, imgY + imgSize + 45);
      ctx.strokeStyle = '#d4af37';
      ctx.lineWidth = 2;
      ctx.stroke();
      
      // Crear un fondo para la oración
      const prayerBoxY = imgY + imgSize + 60;
      const prayerBoxHeight = canvas.height - prayerBoxY - 50;
      
      // Fondo para la oración con borde decorativo
      ctx.fillStyle = 'rgba(255, 255, 255, 0.7)';
      ctx.fillRect(40, prayerBoxY, canvas.width - 80, prayerBoxHeight);
      ctx.strokeStyle = 'rgba(196, 30, 58, 0.2)';
      ctx.lineWidth = 1;
      ctx.strokeRect(40, prayerBoxY, canvas.width - 80, prayerBoxHeight);
      
      // Añadir comillas decorativas
      ctx.font = 'italic 70px Georgia, serif';
      ctx.fillStyle = 'rgba(196, 30, 58, 0.08)';
      ctx.textAlign = 'left';
      ctx.fillText('"', 50, prayerBoxY + 60);
      
      ctx.textAlign = 'right';
      ctx.fillText('"', canvas.width - 50, prayerBoxY + prayerBoxHeight - 20);
      
      // Dibujar el texto de la oración con estilo mejorado
      ctx.font = 'italic 13px Montserrat, Arial, sans-serif';
      ctx.fillStyle = '#333';
      ctx.textAlign = 'left';
      
      const prayerLines = prayerText.split('\n');
      let y = prayerBoxY + 30;
      const lineHeight = 16;
      
      // Función para procesar una línea y destacar el texto en negrita
      const processLine = (line, y) => {
        // Para destacar texto entre asteriscos o fuerte
        if (line.includes('nuevo Papa') || line.includes('despiértanos') || 
            line.includes('tierra buena') || line.includes(cardinalName)) {
          // Usar un color más oscuro para destacar
          ctx.fillStyle = '#a31b30';
          ctx.font = 'italic bold 13px Montserrat, Arial, sans-serif';
        } else {
          ctx.fillStyle = '#333';
          ctx.font = 'italic 13px Montserrat, Arial, sans-serif';
        }
        
        return y;
      };
      
      prayerLines.forEach(line => {
        // Para centrar líneas vacías (párrafos)
        if (line.trim() === '') {
          y += lineHeight / 2;
          return;
        }
        
        // Procesar la línea para estilo
        y = processLine(line, y);
        
        // Para manejar líneas largas y ajuste de texto
        const words = line.split(' ');
        let currentLine = '';
        
        words.forEach(word => {
          const testLine = currentLine + word + ' ';
          const metrics = ctx.measureText(testLine);
          const testWidth = metrics.width;
          
          if (testWidth > canvas.width - 100 && currentLine !== '') {
            ctx.fillText(currentLine, 60, y);
            currentLine = word + ' ';
            y += lineHeight;
          } else {
            currentLine = testLine;
          }
        });
        
        if (currentLine.trim() !== '') {
          ctx.fillText(currentLine, 60, y);
        }
        
        y += lineHeight;
      });
      
      // Añadir un pequeño pie de página
      ctx.font = '600 12px Montserrat, Arial, sans-serif';
      ctx.fillStyle = '#777';
      ctx.textAlign = 'center';
      ctx.fillText('UNO X UNO | TODOS X TODOS', canvas.width / 2, canvas.height - 25);
      
      // Convertir a una imagen descargable
      const dataUrl = canvas.toDataURL('image/png');
      
      // Crear un enlace de descarga
      const downloadLink = document.createElement('a');
      downloadLink.href = dataUrl;
      downloadLink.download = `Cardenal-${cardinalName.replace(/\s+/g, '-')}.png`;
      
      // Restaurar el botón a su estado original
      downloadBtn.innerHTML = originalBtnText;
      downloadBtn.disabled = false;
      downloadBtn.classList.remove('loading');
      
      // Descargar automáticamente
      downloadLink.click();
      
      // Mostrar mensaje de éxito
      downloadMessage.classList.add('visible');
      setTimeout(() => {
        downloadMessage.classList.remove('visible');
      }, 2000);
    })
    .catch(error => {
      console.error('Error al generar la estampita:', error);
      alert('No se pudo generar la estampita. Por favor, inténtalo de nuevo.');
      
      // Restaurar el botón a su estado original en caso de error
      downloadBtn.innerHTML = originalBtnText;
      downloadBtn.disabled = false;
      downloadBtn.classList.remove('loading');
    });
}

// Inicializa la aplicación cuando se carga el DOM
document.addEventListener('DOMContentLoaded', () => {
  console.log('DOM cargado completamente');
  
  // Cargar los días por defecto al iniciar la página
  updateDayOptions();
  
  // Configurar los selectores de fecha
  const monthSelect = document.getElementById('month-select');
  if (monthSelect) {
    console.log('Selector de mes encontrado');
    // Usar una función anónima para llamar a updateDayOptions
    monthSelect.addEventListener('change', function() {
      console.log('Evento change del mes detectado');
      updateDayOptions();
    });
  } else {
    console.error('No se encontró el selector de mes');
  }
  
  // Agregar manejador de eventos al botón de buscar
  const findButton = document.getElementById('find-button');
  if (findButton) {
    console.log('Botón de búsqueda encontrado');
    findButton.addEventListener('click', findCardinal);
  } else {
    console.error('No se encontró el botón de búsqueda');
  }
  
  // Agregar manejador de eventos al botón de descargar estampita
  const downloadButton = document.getElementById('download-btn');
  if (downloadButton) {
    console.log('Botón de descarga encontrado');
    downloadButton.addEventListener('click', generateCardinalCard);
  } else {
    console.error('No se encontró el botón de descarga');
  }
  
  // También permitir enviar con la tecla Enter en los selectores
  const daySelect = document.getElementById('day-select');
  if (daySelect) {
    console.log('Selector de día encontrado');
    daySelect.addEventListener('keypress', e => {
      if (e.key === 'Enter') findCardinal();
    });
  } else {
    console.error('No se encontró el selector de día');
  }
  
  // Comprobar si hay una imagen de respaldo para errores
  const checkBackupImage = () => {
    const testImg = new Image();
    testImg.onerror = () => {
      console.warn('Imagen de respaldo no encontrada, se recomienda crear una imagen "no-image.png" en la carpeta public/images/');
    };
    testImg.src = '/public/images/no-image.png';
  };
  
  // Verificar imagen de respaldo al iniciar
  checkBackupImage();
  
  // Exponer funciones al objeto global para poder acceder desde HTML
  window.updateDayOptions = updateDayOptions;
  window.findCardinal = findCardinal;
  window.generateCardinalCard = generateCardinalCard;
  window.share = share;
});
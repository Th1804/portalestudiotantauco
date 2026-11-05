(function () {
  var materias = [
    {
      id: 'matematica',
      nombre: 'Matemática',
      fecha: '6 de noviembre',
      guia: 'matematica_guia.html',
      torpedo: [
        { titulo: 'Cuadrado de binomio', lineas: ['(a + b)² = a² + 2ab + b²', '(a − b)² = a² − 2ab + b²', '(x + 4)² = x² + 8x + 16. No alcanza con sumar los cuadrados.'] },
        { titulo: 'Término común', lineas: ['(x + a)(x + b) = x² + (a + b)x + ab', '(x + 3)(x + 5) = x² + 8x + 15', '(x − 2)(x + 7) = x² + 5x − 14'] },
        { titulo: 'Suma por diferencia', lineas: ['(a + b)(a − b) = a² − b²', '(x + 6)(x − 6) = x² − 36', '27 × 33 = (30 − 3)(30 + 3) = 900 − 9 = 891'] },
        { titulo: 'Orden para factorizar', lineas: ['1) factor común  2) diferencia de cuadrados  3) trinomio cuadrado perfecto  4) x² + bx + c'] },
        { titulo: 'Factor común', lineas: ['6x² + 9x = 3x(2x + 3). Al multiplicar de vuelta aparecen los dos términos.'] },
        { titulo: 'Diferencia de cuadrados', lineas: ['a² − b² = (a + b)(a − b)', 'x² − 25 = (x + 5)(x − 5)', 'x² + 25 no se factoriza así.'] },
        { titulo: 'Trinomio cuadrado perfecto', lineas: ['x² + 10x + 25 = (x + 5)²', '4x² − 12x + 9 = (2x − 3)²'] },
        { titulo: 'x² + bx + c', lineas: ['Dos números que suman b y multiplican c.', 'x² + 7x + 12 = (x + 3)(x + 4)', 'Si el primer coeficiente no es 1, saca antes el factor común.'] },
        { titulo: 'Sistemas', lineas: ['La solución es el par (x, y) que cumple las dos ecuaciones.', 'Se cortan: una solución. Paralelas: ninguna. La misma recta: infinitas.'] },
        { titulo: 'Cuatro métodos', lineas: ['Igualación: x + y = 5 y x − y = 1 dan (3, 2).', 'Sustitución: 2x + y = 7 y x − y = 2 dan (3, 1).', 'Reducción: 3x + 2y = 12 y 5x − 2y = 4 dan (2, 3).', 'Gráfico: x + y = 4 y y = x se cortan en (2, 2).'] }
      ],
      repaso: [
        { titulo: 'Productos notables', cuerpo: 'El cuadrado de un binomio tiene tres términos: el cuadrado del primero, el doble producto y el cuadrado del segundo. Si dos binomios comparten la x, el término del medio es la suma de los números y el independiente es su producto. En la suma por diferencia, el doble producto se anula.', ejemplo: '(x + 4)² = x² + 8x + 16. Con x = 1, el binomio vale 25 y x² + 16 vale 17: por eso no se pueden omitir el doble producto.', chequeo: 'Desarrolla (x − 2)(x + 7) y comprueba el resultado con un número.' },
        { titulo: 'Factorización', cuerpo: 'Es el camino inverso: el polinomio vuelve a ser una multiplicación. Busca primero un factor común. Después mira si es diferencia de cuadrados, trinomio cuadrado perfecto o un trinomio x² + bx + c.', ejemplo: '2x² + 10x + 12 = 2(x² + 5x + 6) = 2(x + 2)(x + 3). Una suma de cuadrados, como x² + 25, no se factoriza como diferencia.', chequeo: 'Factoriza x² − 25 y 4x² − 12x + 9, y multiplica de vuelta.' },
        { titulo: 'Sistemas 2×2', cuerpo: 'Hay que encontrar el par que cumple las dos ecuaciones a la vez. Si las rectas se cortan, el sistema es compatible determinado. Si son paralelas y distintas, es incompatible. Si son la misma recta, es indeterminado.', ejemplo: 'Igualación deja la misma letra despejada en las dos y las iguala. Sustitución reemplaza esa letra en la otra ecuación. Reducción suma ecuaciones con coeficientes opuestos para que una letra desaparezca.', chequeo: 'Resuelve x + y = 5 y x − y = 1 por dos métodos y comprueba que el par cumpla ambas.' }
      ]
    },
    {
      id: 'lengua',
      nombre: 'Lengua y Literatura',
      fecha: '9 de noviembre',
      guia: 'prueba_nivel_lenguaje_2.html',
      torpedo: [
        { titulo: 'Leer la pregunta', lineas: ['Explícita: está dicha. Marca palabras y búscalas, o un sinónimo.', 'Implícita: se concluye con una pista del texto. Sin pista, es invención.', 'Interpretar: el sentido con tus palabras. Relacionar: título, personajes o época.', 'Evaluar: hace falta una cita o un dato. «Me gustó» no fundamenta.'] },
        { titulo: 'Narrativo', lineas: ['Mundo narrativo: narrador, personajes, acciones, espacio y tiempo.', 'El tema no es el resumen. Una huida puede tener por tema el miedo o la libertad.'] },
        { titulo: 'Lírico', lineas: ['El hablante no es siempre quien escribió el poema.', 'Motivo: de qué se habla. Temple: la emoción.', 'Comparación usa «como». Metáfora identifica sin ese nexo.', 'Personificación, hipérbole y anáfora: acción humana, exageración, repetición al inicio.'] },
        { titulo: 'Dramático', lineas: ['Está escrito para representarse.', 'Diálogo, monólogo y aparte. Las acotaciones no las dice el personaje.', 'El conflicto puede ser entre personas, con el entorno o dentro de alguien.'] },
        { titulo: 'No literario', lineas: ['Expositivo: tema, idea principal y datos.', 'Infografía: el título da el tema. Tamaño, color o una flecha ordenan qué importa.'] },
        { titulo: 'Crítica', lineas: ['Mensaje explícito: la frase que el texto defiende.', 'Implícito: quién queda bien y qué se da por sabido.', 'Contexto: época, lugar, autor y destinatario. La opinión va después de la evidencia.'] }
      ],
      repaso: [
        { titulo: 'Comprensión', cuerpo: 'Lo explícito se localiza: quién, dónde, qué cifra. Lo implícito se infiere. Si el texto dice que alguien cerró el cuaderno, apagó la lámpara y el pasillo quedó en silencio, puedes concluir que se va a dormir. Interpretar explica un sentido. Relacionar conecta partes o el texto con su época. Evaluar exige una cita.', ejemplo: '«Cerró el cuaderno y apagó la lámpara» no dice «se durmió». La inferencia vale porque hay pistas. Si no puedes señalarlas, es una invención.', chequeo: 'En un párrafo, subraya un dato explícito y escribe una inferencia con su pista.' },
        { titulo: 'Géneros', cuerpo: 'El narrativo cuenta hechos de personajes. El lírico organiza una experiencia: el hablante no es automáticamente el autor. El dramático se escribe para la escena: el diálogo avanza el conflicto y la acotación indica gesto o tono, pero no se pronuncia.', ejemplo: 'En un poema, «la noche abre su ojo» personifica la noche. «La llave pesa más que el bote» es una hipérbole, no una medida real.', chequeo: 'Distingue tema y argumento en un cuento de pocas líneas, y nombra una figura en un verso.' },
        { titulo: 'Texto no literario y crítica', cuerpo: 'El texto expositivo explica con idea principal y datos. La infografía mezcla palabras e imagen: el tamaño y el color también informan. En la crítica, separa lo que el texto afirma de la valoración que se cuela, y sitúa época, autor y destinatario.', ejemplo: 'Una opinión fundamentada tiene esta forma: el texto afirma X, porque se dice Y; por eso considero…', chequeo: 'Toma un aviso breve y separa el dato, la valoración y lo que el texto no demuestra.' }
      ]
    },
    {
      id: 'ingles',
      nombre: 'Inglés',
      fecha: '13 de noviembre',
      guia: 'ingles_guia.html',
      torpedo: [
        { titulo: 'Unit 3 · Water', lineas: ['Waterborne: the disease travels in water. Airborne travels in air. Foodborne travels in food.', 'Cholera and typhoid spread by contaminated water: diarrhea, dehydration or fever.', 'Fecal-oral route: germs go from feces to the mouth by water, hands, flies or food.', 'Prevent: boil, filter, chlorinate, sanitation, wash hands with soap.'] },
        { titulo: 'Aid and modals', lineas: ['Aid does not always end poverty, and not all aid is wasted.', 'Vaccines, oral rehydration salts and protected wells save lives.', 'Aid can be money, training, medicine or engineers.', 'Should = advice. Must = obligation. Can = possibility.'] },
        { titulo: 'Unit 4 · Poverty', lineas: ['Basic needs: food, safe water, shelter, health care, education.', 'Extreme poverty: the family cannot cover that minimum. Children may leave school and work.', 'Resources: income, savings, credit, remittances.', 'Development is a long process, not one donation.'] },
        { titulo: 'Linking words', lineas: ['Because, so, therefore show cause and effect.', 'Than, more, fewer, less compare the same kind of thing.', 'More income does not always mean less poverty if prices rise.'] },
        { titulo: 'Reading', lineas: ['A pump for the school: sewage reached the drinking water after the floods.', 'A machine without training is not a solution.', 'Clean water is the first step, not the end of development.'] }
      ],
      repaso: [
        { titulo: 'Water and health', cuerpo: 'A waterborne disease travels in the water people drink. Cholera brings diarrhea and dehydration. Typhoid brings fever and travels in contaminated food or water. The fecal-oral route carries germs from feces to the mouth. Everyday risks are an open well, washing vegetables in dirty water, floods that mix sewage with drinking water, and hands that were not washed.', ejemplo: 'Boiling, filtering, chlorinating, latrines and soap interrupt that route. The reading says the aid worked because the community also learned: a machine without training is not a solution.', chequeo: 'Explain waterborne and fecal-oral in two sentences, then name two ways to prevent them.' },
        { titulo: 'Aid, poverty and grammar', cuerpo: 'Foreign aid is not only cash, and it does not always end poverty. Vaccines, oral rehydration salts, wells, training and engineers are also aid. Basic needs are food, safe water, shelter, health and education. If one is missing, the others get harder. Development means schools, clinics, roads and jobs over time.', ejemplo: 'The well was contaminated, so children got sick. They left school because they had to work. Should gives advice, must is an obligation, and can shows a possibility.', chequeo: 'Write one sentence with because and one with should about safe water.' }
      ]
    },
    {
      id: 'ciencias',
      nombre: 'Ciencias Naturales',
      fecha: '16 de noviembre',
      guia: 'prueba_nivel_ciencias_naturales.html',
      torpedo: [
        { titulo: 'Origen de la vida', lineas: ['Biogénesis: todo ser vivo proviene de otro. La generación espontánea decía lo contrario.', 'Redi (1668): sin moscas, no hay gusanos. Pasteur (1861): el caldo del cuello de cisne sigue estéril.'] },
        { titulo: 'Evolución', lineas: ['Lamarck: lo que el cuerpo usa se hereda. No se acepta.', 'Darwin y Wallace: variación heredable, nacen más de los que caben, dejan más crías los rasgos favorables.'] },
        { titulo: 'Clasificación', lineas: ['Reino, filo, clase, orden, familia, género, especie.', 'Puma concolor: género con mayúscula, epíteto con minúscula, en cursiva.', 'Los grupos cercanos comparten un ancestro más reciente.'] },
        { titulo: 'Ecosistemas de Chile', lineas: ['Organismo, población, comunidad, ecosistema.', 'Exponencial si nada frena. Logístico cerca de la capacidad de carga.', 'Depredación y parasitismo: +/−. Competencia: −/−. Mutualismo: +/+. Comensalismo: +/0.'] },
        { titulo: 'Sonido y luz', lineas: ['El sonido es una onda mecánica. Frecuencia: grave o agudo. Amplitud: intensidad.', 'Oído humano: cerca de 20 a 20 000 Hz. Oído externo, medio (martillo, yunque, estribo) y cóclea.', 'Luz visible: cerca de 400 nm (violeta) a 700 nm (rojo). El ojo no ve ultravioleta ni infrarrojo.'] },
        { titulo: 'Sismos', lineas: ['La placa de Nazca se hunde bajo la Sudamericana.', 'Hipocentro: ruptura en profundidad. Epicentro: el punto de la superficie encima.', 'Onda P: la más rápida, sólidos y líquidos. Onda S: no atraviesa el núcleo externo líquido.', 'Magnitud: la energía, un solo número. Intensidad: los efectos, cambian de lugar.'] },
        { titulo: 'Tierra, Luna y Sol', lineas: ['Día y noche: rotación. Año: órbita. Estaciones: inclinación del eje, unos 23,5°, no la distancia al Sol.', 'En diciembre el hemisferio sur queda más de frente al Sol: en Chile es verano.', 'Eclipse solar: luna nueva. Eclipse lunar: luna llena. No hay eclipse en cada fase porque la órbita lunar está inclinada.'] },
        { titulo: 'Química', lineas: ['Cambio físico: la sustancia sigue. El hielo sigue siendo agua.', 'Cambio químico: sustancias nuevas. Fermentación, combustión del metano, óxido de hierro.', 'Chocan con energía suficiente: energía de activación. Subir la temperatura suele acelerar.', 'Se conservan los átomos. 12 g de C + 32 g de O₂ = 44 g de CO₂.', 'Un mol tiene 6,022 × 10²³ entidades. n = m / M.'] }
      ],
      repaso: [
        { titulo: 'Evolución y clasificación', cuerpo: 'La biogénesis reemplazó a la generación espontánea con los experimentos de Redi, Spallanzani y Pasteur. Lamarck pensó que un rasgo adquirido, como el cuello estirado de la jirafa, se hereda. Darwin y Wallace propusieron la selección natural: hay variación que se hereda, nacen más individuos de los que el ambiente puede sostener, y los rasgos de quienes dejan más descendencia se vuelven frecuentes.', ejemplo: 'Clasificar va de lo general a lo particular: reino, filo, clase, orden, familia, género y especie. Puma concolor nombra género y especie. Hoy el ADN puede cambiar una clasificación.', chequeo: 'Explica en tres frases por qué el cuello de la jirafa no es un argumento lamarckiano válido, y ordena las siete categorías.' },
        { titulo: 'Ecosistemas, ondas y cielo', cuerpo: 'Un guanaco es un organismo. Los guanacos de un valle son una población. Con las otras especies forman una comunidad. El ecosistema suma agua, suelo y clima. El sonido es mecánico: la frecuencia se oye como tono y la amplitud como intensidad. La luz visible va del violeta al rojo. Las estaciones las produce la inclinación del eje, no estar más cerca del Sol.', ejemplo: 'En un sismo chileno, el hipocentro es la ruptura y el epicentro queda en la superficie. La onda P llega primero. La S no cruza el núcleo externo líquido. La magnitud es una; la intensidad cambia según el lugar.', chequeo: 'Di por qué diciembre es verano en Chile y en qué fase ocurre un eclipse lunar.' },
        { titulo: 'Reacciones y masa', cuerpo: 'Si la sustancia sigue siendo la misma, el cambio es físico. Si aparecen sustancias nuevas, es químico. Las partículas reaccionan cuando chocan con energía suficiente y buena orientación. Síntesis junta, descomposición separa y sustitución reemplaza. La combustión libera calor. Quien pierde electrones se oxida y quien los gana se reduce.', ejemplo: '12 g de carbono más 32 g de oxígeno forman 44 g de dióxido de carbono. Los átomos se reordenan y la masa se conserva. 18 g de agua son 18 / 18 = 1 mol.', chequeo: 'Clasifica congelar agua y la oxidación del hierro, y completa 12 + 32 = 44 con los nombres de las sustancias.' }
      ]
    },
    {
      id: 'historia',
      nombre: 'Historia',
      fecha: '18 de noviembre',
      guia: 'historia_guia.html',
      torpedo: [
        { titulo: 'Escasez', lineas: ['No es que un bien esté agotado hoy. No alcanza para todos los usos que la gente quisiera.', 'Qué producir, cómo producir y para quién. Elegir uno es dejar el otro.'] },
        { titulo: 'Agentes', lineas: ['Familias: consumen y ofrecen trabajo. Empresas: producen y contratan.', 'Estado: impuestos y servicios. Resto del mundo: importaciones y exportaciones.'] },
        { titulo: 'Precio', lineas: ['Si el precio sube, la cantidad demandada baja y la cantidad ofrecida sube.', 'Equilibrio: se ofrece y se pide la misma cantidad.', 'Monopolio: un vendedor. Colusión: acuerdo entre vendedores.', 'Precio máximo muy bajo: escasez. Arancel: encarece lo importado. Inflación: el nivel general de precios sube.'] },
        { titulo: 'Finanzas', lineas: ['Libreta: separa el ahorro; la inflación puede comerse el interés.', 'Crédito y tarjeta: pagas después. Si pagas el mínimo, la deuda crece.', 'Acción: puedes ganar o perder. Previsión: protege el futuro solo si los aportes alcanzan.', 'Caja vecina: ahorro del barrio, no un banco.'] },
        { titulo: 'Expansión', lineas: ['Colonización: ley de 1845, Vicente Pérez Rosales, inmigrantes alemanes en Valdivia y Llanquihue.', 'Ocupación de la Araucanía: fuertes y radicación mapuche. Para el Estado, incorporar territorio. Para el pueblo mapuche, pérdida y violencia.', '1843: Fuerte Bulnes y luego Punta Arenas, en el estrecho de Magallanes.', '1881: tratado de límites con Argentina. Guerra del Pacífico, 1879-1884: salitre, Tarapacá y después Antofagasta. Bolivia perdió su salida soberana al mar.', 'Gay, Domeyko y Philippi describieron el territorio. Universidad de Chile, 1842, Andrés Bello.'] }
      ],
      repaso: [
        { titulo: 'El problema económico y el precio', cuerpo: 'La escasez obliga a elegir. Las familias compran y ofrecen trabajo, las empresas producen, el Estado cobra impuestos y entrega servicios, y el resto del mundo entra por el comercio. En el mercado, la demanda baja cuando el precio sube y la oferta sube cuando el precio sube. El equilibrio es el precio en que ambas cantidades coinciden.', ejemplo: 'Un monopolio puede mantener el precio alto. Un precio máximo demasiado bajo puede dejar a gente sin el bien. Un arancel encarece el producto importado y protege al productor local.', chequeo: 'Explica con el pan qué se produce, cómo y para quién, y qué pasa con el precio si sube la demanda y la oferta no alcanza.' },
        { titulo: 'Ahorro, crédito y riesgo', cuerpo: 'La pregunta de la prueba no es cuál instrumento es bueno. Es para qué sirve y qué puede salir mal. La libreta separa el ahorro del gasto diario. El crédito y la tarjeta adelantan consumo y cobran interés. La acción es una parte de una empresa y puede perder valor. La previsión junta aportes de hoy para un ingreso o una atención más adelante.', ejemplo: 'Pagar solo el mínimo de la tarjeta hace crecer la deuda. Una caja vecina da acceso cuando el banco queda lejos, pero depende de la confianza y no tiene la misma supervisión.', chequeo: 'Elige dos instrumentos y escribe, para cada uno, el beneficio y el riesgo.' },
        { titulo: 'Expansión del Estado en el siglo XIX', cuerpo: 'El Estado buscó reconocer el territorio, contar a la población, aprovechar recursos y marcar fronteras. Lo hizo por colonización, ocupación, diplomacia, guerra y ciencia. En cada caso hay que nombrar el objetivo del Estado y el efecto sobre quienes ya vivían ahí.', ejemplo: 'Desde 1845, Pérez Rosales impulsó la llegada de inmigrantes alemanes al sur. La ocupación de la Araucanía avanzó con fuertes y reducciones. En 1843 se tomó el estrecho de Magallanes. El tratado de 1881 con Argentina reparte la Patagonia. La Guerra del Pacífico (1879-1884) incorporó territorios salitreros y Bolivia perdió su salida soberana al mar.', chequeo: 'Resume en cuatro líneas colonización, ocupación, el tratado de 1881 y la Guerra del Pacífico, con una fecha en cada una.' }
      ]
    }
  ];

  var tipo = 'torpedo';
  var materiaId = 'matematica';
  var pack = false;
  var hoja = document.getElementById('hoja');
  var packBtn = document.getElementById('pack');

  function porId(id) {
    for (var i = 0; i < materias.length; i++) {
      if (materias[i].id === id) return materias[i];
    }
    return materias[0];
  }

  function bloque(item) {
    var html = '<section class="block"><h3>' + item.titulo + '</h3>';
    for (var i = 0; i < item.lineas.length; i++) {
      var linea = item.lineas[i];
      var clase = linea.indexOf('=') !== -1 || linea.indexOf('²') !== -1 ? ' class="formula"' : '';
      html += '<p' + clase + '>' + linea + '</p>';
    }
    return html + '</section>';
  }

  function seccion(item) {
    return '<section><h3>' + item.titulo + '</h3><p>' + item.cuerpo + '</p><p class="ejemplo"><strong>Ejemplo. </strong>' + item.ejemplo + '</p><p class="chequeo"><strong>Antes de la prueba. </strong>' + item.chequeo + '</p></section>';
  }

  function sheet(materia) {
    var cuerpo = tipo === 'torpedo'
      ? '<div class="cols">' + materia.torpedo.map(bloque).join('') + '</div>'
      : '<div class="guia">' + materia.repaso.map(seccion).join('') + '</div>';
    var etiqueta = tipo === 'torpedo' ? 'Torpedo de repaso' : 'Guía de repaso';
    return '<article class="sheet ' + tipo + '"><header class="mast"><div><p>Colegio Tantauco · ' + etiqueta + '</p><h2>' + materia.nombre + '</h2></div><p>PDN · ' + materia.fecha + '</p></header>' + cuerpo + '<p class="foot">Para imprimir y repasar. La guía completa está en el portal.</p></article>';
  }

  function render() {
    var lista = pack ? materias : [porId(materiaId)];
    hoja.innerHTML = lista.map(sheet).join('');
    var botones = document.querySelectorAll('[data-materia]');
    for (var i = 0; i < botones.length; i++) {
      botones[i].setAttribute('aria-pressed', String(!pack && botones[i].dataset.materia === materiaId));
    }
    document.getElementById('tipo-torpedo').setAttribute('aria-pressed', String(tipo === 'torpedo'));
    document.getElementById('tipo-guia').setAttribute('aria-pressed', String(tipo === 'guia'));
    packBtn.setAttribute('aria-pressed', String(pack));
    packBtn.textContent = tipo === 'torpedo' ? 'Los 5 torpedos' : 'Las 5 guías';
    var hash = pack ? 'todas-' + tipo : materiaId + '-' + tipo;
    if (location.hash !== '#' + hash) history.replaceState(null, '', '#' + hash);
  }

  function leerHash() {
    var hash = (location.hash || '').replace('#', '');
    if (hash.indexOf('todas-') === 0) {
      pack = true;
      tipo = hash.slice(6) === 'guia' ? 'guia' : 'torpedo';
      return;
    }
    var partes = hash.split('-');
    if (partes.length === 2 && porId(partes[0]).id === partes[0]) {
      pack = false;
      materiaId = partes[0];
      tipo = partes[1] === 'guia' ? 'guia' : 'torpedo';
    }
  }

  document.getElementById('materias').addEventListener('click', function (event) {
    var boton = event.target.closest('[data-materia]');
    if (!boton) return;
    pack = false;
    materiaId = boton.dataset.materia;
    render();
  });
  document.getElementById('tipo-torpedo').addEventListener('click', function () { tipo = 'torpedo'; render(); });
  document.getElementById('tipo-guia').addEventListener('click', function () { tipo = 'guia'; render(); });
  packBtn.addEventListener('click', function () { pack = !pack; render(); });
  document.getElementById('imprimir').addEventListener('click', function () { window.print(); });

  leerHash();
  render();
})();

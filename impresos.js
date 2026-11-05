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
      desarrollo: [
        { enunciado: 'Desarrolla (x + 4)². Después comprueba con x = 1 y explica por qué no basta con x² + 16.', lineas: 3, pauta: 'x² + 8x + 16. Con x = 1 el binomio vale 25 y x² + 16 vale 17: falta el doble producto.' },
        { enunciado: 'Desarrolla (a − b)² y (x − 2)(x + 7).', lineas: 3, pauta: 'a² − 2ab + b². (x − 2)(x + 7) = x² + 5x − 14.' },
        { enunciado: 'Calcula 27 × 33 escribiéndolo como una suma por diferencia.', lineas: 2, pauta: '(30 − 3)(30 + 3) = 900 − 9 = 891.' },
        { enunciado: 'Factoriza 6x² + 9x y 2x² + 10x + 12. Multiplica de vuelta el primero.', lineas: 3, pauta: '3x(2x + 3). 2(x + 2)(x + 3). Al multiplicar 3x(2x + 3) vuelven 6x² y 9x.' },
        { enunciado: 'Factoriza x² − 25 y x² + 10x + 25. Explica por qué x² + 25 no se factoriza como el primero.', lineas: 3, pauta: '(x + 5)(x − 5) y (x + 5)². x² + 25 es una suma de cuadrados, no una diferencia.' },
        { enunciado: 'Factoriza 4x² − 12x + 9 y x² + 7x + 12.', lineas: 2, pauta: '(2x − 3)² y (x + 3)(x + 4).' },
        { enunciado: 'Resuelve por igualación x + y = 5 y x − y = 1. Comprueba que el par cumpla las dos ecuaciones.', lineas: 3, pauta: '(3, 2). 3 + 2 = 5 y 3 − 2 = 1.' },
        { enunciado: 'Resuelve por reducción 3x + 2y = 12 y 5x − 2y = 4. Di qué ocurre si las rectas son paralelas y distintas.', lineas: 3, pauta: '(2, 3). Si son paralelas y distintas, el sistema no tiene solución.' }
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
      desarrollo: [
        { enunciado: 'Lee: «Cerró el cuaderno y apagó la lámpara. El pasillo quedó en silencio.» Escribe un dato explícito y una inferencia. Marca la pista de la inferencia.', lineas: 3, pauta: 'Explícito: cerró el cuaderno, apagó la lámpara o el pasillo quedó en silencio. Inferencia posible: se va a dormir. Sin pista, la inferencia es una invención.' },
        { enunciado: 'Explica interpretar, relacionar y evaluar. Di por qué «me gustó» no fundamenta una evaluación.', lineas: 3, pauta: 'Interpretar explica un sentido. Relacionar conecta partes, el título o la época. Evaluar necesita una cita o un dato. «Me gustó» es gusto, no evidencia.' },
        { enunciado: 'En un cuento breve, distingue el tema del argumento.', lineas: 2, pauta: 'El argumento es lo que ocurre. El tema es la idea, por ejemplo el miedo o la libertad, y no el resumen.' },
        { enunciado: 'En «la noche abre su ojo», nombra la figura y explica qué hace. Contrástala con una comparación.', lineas: 2, pauta: 'Es personificación: la noche hace una acción humana. La comparación usa «como»; la metáfora identifica sin ese nexo.' },
        { enunciado: '«La llave pesa más que el bote.» ¿Qué figura es y por qué no es una medida real?', lineas: 2, pauta: 'Es una hipérbole: exagera. No informa el peso de la llave.' },
        { enunciado: 'Diferencia diálogo, monólogo, aparte y acotación en un texto dramático.', lineas: 3, pauta: 'El diálogo es entre personajes. El monólogo lo dice un personaje a solas. El aparte lo oye el público, no el otro personaje. La acotación indica gesto o tono y no se pronuncia.' },
        { enunciado: 'En un texto expositivo, separa la idea principal de un dato. En una infografía, di qué informa el tamaño o el color.', lineas: 3, pauta: 'La idea principal es lo que el texto explica. El dato la sostiene. En la infografía, el tamaño, el color o una flecha ordenan qué importa.' },
        { enunciado: 'Escribe una opinión fundamentada con esta forma: «El texto afirma X, porque se dice Y; por eso considero…».', lineas: 3, pauta: 'Primero va lo que el texto afirma, después la cita o el dato, y al final la opinión. La valoración no reemplaza la evidencia.' }
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
      desarrollo: [
        { enunciado: 'Answer in English. Explain waterborne and fecal-oral. Name cholera and typhoid and one symptom of each.', lineas: 3, pauta: 'Waterborne travels in water. Fecal-oral carries germs from feces to the mouth. Cholera: diarrhea and dehydration. Typhoid: fever, by contaminated food or water.' },
        { enunciado: 'Name three ways to interrupt the fecal-oral route.', lineas: 2, pauta: 'Any three: boil, filter, chlorinate, sanitation or latrines, wash hands with soap.' },
        { enunciado: 'Is this true: “Foreign aid always ends poverty”? Explain with one kind of aid that saves lives and one limit.', lineas: 3, pauta: 'No. Vaccines, oral rehydration, wells, training, medicine or engineers can save lives. Aid does not always end poverty, and a machine without training is not a solution.' },
        { enunciado: 'Write one sentence with should, one with must and one with can about safe water.', lineas: 3, pauta: 'Should is advice, must is an obligation and can is a possibility. Any correct sentences with those meanings.' },
        { enunciado: 'List the five basic needs and explain extreme poverty in one sentence.', lineas: 3, pauta: 'Food, safe water, shelter, health care and education. Extreme poverty means the family cannot cover that minimum.' },
        { enunciado: 'Complete and explain: “The well was contaminated, so … They left school because …”.', lineas: 2, pauta: 'So children got sick. Because they had to work. Because, so and therefore show cause and effect.' },
        { enunciado: 'The school received a pump after the floods, but nobody was trained. Why is clean water only the first step?', lineas: 3, pauta: 'Sewage had reached the drinking water. A machine without training is not a solution. Development also needs schools, clinics, roads and jobs over time.' }
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
      desarrollo: [
        { enunciado: 'Explica qué mostraron Redi (1668) y Pasteur (1861) contra la generación espontánea.', lineas: 3, pauta: 'Redi: sin moscas no aparecen gusanos. Pasteur: el caldo del cuello de cisne sigue estéril. Todo ser vivo proviene de otro: biogénesis.' },
        { enunciado: 'Di por qué no se acepta la idea de Lamarck sobre el cuello de la jirafa y escribe las tres condiciones de la selección natural de Darwin y Wallace.', lineas: 3, pauta: 'Lo que el cuerpo usa o deja de usar no se hereda. Hay variación heredable, nacen más de los que caben y los rasgos favorables dejan más descendencia.' },
        { enunciado: 'Ordena las siete categorías taxonómicas y escribe el nombre científico del puma.', lineas: 2, pauta: 'Reino, filo, clase, orden, familia, género y especie. Puma concolor: género con mayúscula y epíteto con minúscula.' },
        { enunciado: 'Con el guanaco, diferencia organismo, población, comunidad y ecosistema. Clasifica depredación, competencia, mutualismo y comensalismo con +/−, −/−, +/+ o +/0.', lineas: 3, pauta: 'Un guanaco; los del valle; con otras especies; más agua, suelo y clima. Depredación +/−, competencia −/−, mutualismo +/+, comensalismo +/0.' },
        { enunciado: 'Diferencia frecuencia y amplitud del sonido. Nombra las tres partes del oído medio y el rango aproximado del oído humano.', lineas: 3, pauta: 'Frecuencia: grave o agudo. Amplitud: intensidad. Martillo, yunque y estribo. Cerca de 20 a 20 000 Hz.' },
        { enunciado: 'En un sismo chileno, diferencia hipocentro y epicentro, onda P y onda S, magnitud e intensidad.', lineas: 3, pauta: 'Hipocentro: ruptura en profundidad. Epicentro: en la superficie. P es la más rápida y cruza sólidos y líquidos. S no cruza el núcleo externo líquido. La magnitud es un número; la intensidad cambia según el lugar.' },
        { enunciado: 'Explica por qué en Chile diciembre es verano y en qué fase hay eclipse solar y eclipse lunar.', lineas: 3, pauta: 'Por la inclinación del eje, unos 23,5°, no por la distancia al Sol. Eclipse solar en luna nueva y lunar en luna llena. No hay eclipse en cada fase porque la órbita lunar está inclinada.' },
        { enunciado: 'Clasifica congelar agua y la oxidación del hierro. Completa 12 g de carbono + 32 g de oxígeno y di cuántos moles hay en 18 g de agua.', lineas: 3, pauta: 'Congelar es físico: sigue siendo agua. El óxido es químico. Se forman 44 g de CO₂. 18 / 18 = 1 mol. Un mol tiene 6,022 × 10²³ entidades.' }
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
      desarrollo: [
        { enunciado: 'Con el pan, explica qué es la escasez y responde qué producir, cómo producir y para quién.', lineas: 3, pauta: 'La escasez no es que el pan esté agotado hoy: no alcanza para todos los usos. Elegir un uso deja fuera otro. Hay que decir qué pan, con qué recursos y quién lo recibe.' },
        { enunciado: 'Nombra a los cuatro agentes económicos y una acción de cada uno.', lineas: 3, pauta: 'Familias: consumen y ofrecen trabajo. Empresas: producen y contratan. Estado: impuestos y servicios. Resto del mundo: importa y exporta.' },
        { enunciado: 'Si sube el precio, ¿qué pasa con la cantidad demandada y la ofrecida? Define el equilibrio. Di el efecto de un precio máximo muy bajo y de un arancel.', lineas: 3, pauta: 'La cantidad demandada baja y la ofrecida sube. Equilibrio: se ofrece y se pide la misma cantidad. Un precio máximo muy bajo produce escasez. Un arancel encarece lo importado.' },
        { enunciado: 'Para la libreta, el crédito y la tarjeta, escribe un beneficio y un riesgo de cada uno.', lineas: 3, pauta: 'La libreta separa el ahorro; la inflación puede comerse el interés. El crédito adelanta consumo y cobra interés. Si pagas solo el mínimo de la tarjeta, la deuda crece.' },
        { enunciado: 'Explica el riesgo de una acción y para qué sirve la previsión. Di qué no es una caja vecina.', lineas: 3, pauta: 'La acción puede ganar o perder valor. La previsión protege el futuro solo si los aportes alcanzan. La caja vecina es ahorro del barrio, no un banco.' },
        { enunciado: 'Desarrolla la colonización de 1845 y la ocupación de la Araucanía. En cada una, nombra el objetivo del Estado y el efecto sobre quienes ya vivían ahí.', lineas: 3, pauta: 'Ley de 1845, Vicente Pérez Rosales, inmigrantes alemanes en Valdivia y Llanquihue. La ocupación usó fuertes y radicación mapuche: el Estado incorporó territorio y el pueblo mapuche sufrió pérdida y violencia.' },
        { enunciado: 'Con una fecha en cada caso, desarrolla la toma del estrecho de Magallanes, el tratado con Argentina y la Guerra del Pacífico.', lineas: 3, pauta: '1843: Fuerte Bulnes y luego Punta Arenas. 1881: tratado de límites con Argentina. 1879-1884: salitre, Tarapacá y después Antofagasta. Bolivia perdió su salida soberana al mar.' }
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

  function pregunta(item, indice) {
    var reglas = '';
    for (var i = 0; i < item.lineas; i++) reglas += '<div class="regla"></div>';
    return '<section class="item"><h3>' + (indice + 1) + '. ' + item.enunciado + '</h3>' + reglas + '</section>';
  }

  function pauta(materia) {
    var items = materia.desarrollo.map(function (item, indice) {
      return '<li>' + item.pauta + '</li>';
    }).join('');
    return '<section class="pauta"><h3>Pauta</h3><ol>' + items + '</ol></section>';
  }

  function sheet(materia) {
    var etiqueta = tipo === 'torpedo' ? 'Torpedo de repaso' : 'Guía de desarrollo';
    var cuerpo = tipo === 'torpedo'
      ? '<div class="cols">' + materia.torpedo.map(bloque).join('') + '</div><p class="foot">Para imprimir y repasar. La guía completa está en el portal.</p>'
      : '<div class="guia"><p class="nombre">Nombre: ____________________ &nbsp;&nbsp; Curso: ________ &nbsp;&nbsp; Fecha: ________</p>' + materia.desarrollo.map(pregunta).join('') + '<p class="foot">Responde en las líneas. La pauta va en la hoja siguiente.</p>' + pauta(materia) + '</div>';
    return '<article class="sheet ' + tipo + '"><header class="mast"><div><p>Colegio Tantauco · ' + etiqueta + '</p><h2>' + materia.nombre + '</h2></div><p>PDN · ' + materia.fecha + '</p></header>' + cuerpo + '</article>';
  }

  function render() {
    var lista = pack ? materias : [porId(materiaId)];
    hoja.innerHTML = lista.map(sheet).join('');
    var botones = document.querySelectorAll('[data-materia]');
    for (var i = 0; i < botones.length; i++) {
      botones[i].setAttribute('aria-pressed', String(!pack && botones[i].dataset.materia === materiaId));
    }
    document.getElementById('tipo-torpedo').setAttribute('aria-pressed', String(tipo === 'torpedo'));
    document.getElementById('tipo-desarrollo').setAttribute('aria-pressed', String(tipo === 'desarrollo'));
    packBtn.setAttribute('aria-pressed', String(pack));
    packBtn.textContent = tipo === 'torpedo' ? 'Los 5 torpedos' : 'Las 5 guías';
    var hash = pack ? 'todas-' + tipo : materiaId + '-' + tipo;
    if (location.hash !== '#' + hash) history.replaceState(null, '', '#' + hash);
  }

  function leerHash() {
    var hash = (location.hash || '').replace('#', '');
    if (hash.indexOf('todas-') === 0) {
      pack = true;
      tipo = hash.slice(6) === 'desarrollo' || hash.slice(6) === 'guia' ? 'desarrollo' : 'torpedo';
      return;
    }
    var partes = hash.split('-');
    if (partes.length === 2 && porId(partes[0]).id === partes[0]) {
      pack = false;
      materiaId = partes[0];
      tipo = partes[1] === 'desarrollo' || partes[1] === 'guia' ? 'desarrollo' : 'torpedo';
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
  document.getElementById('tipo-desarrollo').addEventListener('click', function () { tipo = 'desarrollo'; render(); });
  packBtn.addEventListener('click', function () { pack = !pack; render(); });
  document.getElementById('imprimir').addEventListener('click', function () { window.print(); });

  leerHash();
  render();
})();

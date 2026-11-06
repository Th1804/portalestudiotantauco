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
        { titulo: 'Productos notables' },
        { enunciado: 'Antes de calcular, di qué forma tiene cada expresión: (x + 4)², (x + 3)(x + 5) y (x + 6)(x − 6).', lineas: 2, pauta: 'Cuadrado de binomio, binomios con término común y suma por diferencia.' },
        { enunciado: 'Desarrolla (x + 4)² y (3y − 2)². Comprueba el primero con x = 1 y explica por qué no basta con sumar los cuadrados.', lineas: 4, pauta: 'x² + 8x + 16 y 9y² − 12y + 4. Con x = 1 el binomio vale 25 y x² + 16 vale 17: falta el doble producto.' },
        { enunciado: 'Desarrolla (x + 3)(x + 5) y (x − 2)(x + 7). Explica qué decide el signo del término del medio y cuál queda negativo si los signos son distintos.', lineas: 3, pauta: 'x² + 8x + 15 y x² + 5x − 14. El signo del medio lo decide la suma. El independiente queda negativo si los signos son distintos.' },
        { enunciado: 'Desarrolla (x + 6)(x − 6) y (4m + 3)(4m − 3). Calcula 27 × 33 como suma por diferencia.', lineas: 3, pauta: 'x² − 36 y 16m² − 9. (30 − 3)(30 + 3) = 900 − 9 = 891. El doble producto se anula.' },
        { titulo: 'Factorización' },
        { enunciado: 'Escribe el orden de búsqueda para factorizar y explica qué es factorizar.', lineas: 2, pauta: 'Es el camino inverso: el polinomio vuelve a ser una multiplicación. Orden: factor común, diferencia de cuadrados, trinomio cuadrado perfecto y x² + bx + c.' },
        { enunciado: 'Factoriza 6x² + 9x y verifica multiplicando de vuelta.', lineas: 2, pauta: '3x(2x + 3). 3x por 2x es 6x² y 3x por 3 es 9x.' },
        { enunciado: 'Factoriza x² − 25, 9a² − 4 y 49 − y². Explica por qué x² + 25 no se factoriza así.', lineas: 3, pauta: '(x + 5)(x − 5), (3a + 2)(3a − 2) y (7 + y)(7 − y). x² + 25 es una suma de cuadrados: hace falta un menos entre los cuadrados.' },
        { enunciado: 'Reconoce y factoriza x² + 10x + 25 y 4x² − 12x + 9. Di qué compruebas en el término del medio.', lineas: 3, pauta: '(x + 5)² y (2x − 3)². El del medio tiene que ser el doble producto de las raíces: 2·x·5 = 10x y 2·(2x)·3 = 12x.' },
        { enunciado: 'Factoriza x² + 7x + 12 y x² − x − 6. Indica los dos números que buscaste en cada uno.', lineas: 3, pauta: '(x + 3)(x + 4): 3 y 4 suman 7 y multiplican 12. (x − 3)(x + 2): −3 y 2 suman −1 y multiplican −6.' },
        { enunciado: 'Factoriza 2x² + 10x + 12. Explica por qué el primer paso no es buscar los dos números todavía.', lineas: 3, pauta: 'Primero el factor común: 2(x² + 5x + 6) = 2(x + 2)(x + 3). Si el coeficiente de x² no es 1, se saca antes.' },
        { titulo: 'Sistemas 2×2' },
        { enunciado: 'Define la solución de un sistema y clasifica: rectas que se cortan, paralelas distintas y la misma recta.', lineas: 3, pauta: 'El par (x, y) que cumple las dos ecuaciones. Compatible determinado: una solución. Incompatible: ninguna. Indeterminado: infinitas, porque es la misma recta.' },
        { enunciado: 'Resuelve por igualación x + y = 5 y x − y = 1. Comprueba el par en las dos ecuaciones.', lineas: 4, pauta: 'x = 5 − y y x = 1 + y. Igualando, y = 2 y x = 3. (3, 2): 3 + 2 = 5 y 3 − 2 = 1.' },
        { enunciado: 'Resuelve por sustitución 2x + y = 7 y x − y = 2. Muestra el reemplazo.', lineas: 4, pauta: 'x = y + 2. 2(y + 2) + y = 7, así y = 1 y x = 3. (3, 1). Chequeo: 2·3 + 1 = 7 y 3 − 1 = 2.' },
        { enunciado: 'Resuelve por reducción 3x + 2y = 12 y 5x − 2y = 4. Después resuelve 2x + 3y = 13 y x + y = 5, y explica qué multiplicas antes de sumar.', lineas: 4, pauta: 'En el primero los coeficientes de y ya son opuestos: (2, 3). En el segundo se multiplica x + y = 5 por −2 y se suma: también (2, 3).' },
        { enunciado: 'En el método gráfico, explica cómo se dibujan x + y = 4 e y = x y cuál es el cruce. Di qué se ve si las rectas no se encuentran o si queda una encima de la otra.', lineas: 4, pauta: 'y = 4 − x pasa por (0, 4) y (4, 0). y = x pasa por (0, 0) y (2, 2). Se cruzan en (2, 2). Si no se encuentran, es incompatible. Si es la misma recta, es indeterminado.' }
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
        { titulo: 'Cómo leer y comprensión' },
        { enunciado: 'Nombra las cinco acciones de lectura de la PDN y di por qué el primer paso es identificar el género.', lineas: 3, pauta: 'Localizar, inferir, interpretar, relacionar y evaluar. Un poema no se lee igual que una infografía.' },
        { enunciado: 'Explica cómo se localiza lo explícito. ¿Qué preguntas lo piden y qué no debes hacer con lo que tú crees que pasó?', lineas: 3, pauta: 'Está dicho: qué ocurrió, dónde, quién lo dijo, qué cifra. Se marcan palabras clave y se buscan, o un sinónimo. No se completa con una idea propia.' },
        { enunciado: 'Lee: «Cerró el cuaderno, apagó la lámpara y el pasillo ya estaba en silencio.» Escribe un dato explícito, una inferencia y la pista. Di cuándo una inferencia pasa a ser invención.', lineas: 3, pauta: 'Explícito: cerró el cuaderno, apagó la lámpara o el pasillo estaba en silencio. Inferencia: se fue a dormir. Sin una pista que se pueda señalar, es invención.' },
        { enunciado: 'Define interpretar, relacionar y evaluar. Explica por qué «me gustó» no fundamenta.', lineas: 3, pauta: 'Interpretar dice el sentido de una imagen, un símbolo o una decisión. Relacionar une datos, el título o el texto con su época. Evaluar juzga con una cita o un dato. «Me gustó» es gusto, no evidencia.' },
        { titulo: 'Texto narrativo' },
        { enunciado: 'Define el mundo narrativo. Diferencia narrador protagonista, testigo y narrador en tercera persona, y nombra protagonista, antagonista y secundarios.', lineas: 4, pauta: 'El mundo narrativo junta narrador, personajes, espacio, tiempo y acciones. El protagonista cuenta en yo; el testigo cuenta lo que vio; la tercera persona puede saber más o menos que los personajes. Protagonista, antagonista y secundarios se conocen por lo que hacen, dicen y piensan.' },
        { enunciado: 'En las acciones de un relato, distingue situación inicial, conflicto y desenlace. Explica qué aportan el espacio y el tiempo, y la diferencia entre tema y argumento con el ejemplo de una huida.', lineas: 4, pauta: 'La situación inicial se desordena con el conflicto y cierra en el desenlace. Espacio y tiempo dicen dónde, cuándo y si el relato va en orden o con saltos. El tema es la idea, como el miedo o la libertad. El argumento es el resumen de los hechos.' },
        { enunciado: 'Lee el texto de Marina en el muelle. Escribe un dato explícito, una inferencia con su pista y un tema posible. Explica por qué «una niña y un bote» no es el tema.', lineas: 4, pauta: 'Explícito: llega tarde, el bote no está y lleva una llave que debía devolver. Inferencia: espera, porque se sienta de cara al agua «como si el bote todavía pudiera volver». Tema posible: la espera y la responsabilidad. «Una niña y un bote» es argumento.' },
        { titulo: 'Texto lírico' },
        { enunciado: 'Diferencia hablante lírico y autor, motivo y temple de ánimo. Explica qué puede simbolizar una llave.', lineas: 3, pauta: 'El hablante es la voz del poema, no automáticamente quien lo escribió. El motivo es de qué se habla; el temple es la emoción. Una llave puede ser acceso, secreto o deuda.' },
        { enunciado: 'Define comparación, metáfora, personificación, hipérbole y anáfora. Usa los ejemplos del muelle, el faro y los mil inviernos.', lineas: 4, pauta: 'Comparación: «como» o «parece», el muelle quieto como un animal dormido. Metáfora: el muelle era un animal dormido, sin nexo. Personificación: la luz del faro llamó a Marina. Hipérbole: esperó mil inviernos. Anáfora: se repite una palabra al inicio de varios versos.' },
        { enunciado: 'Lee: «La llave en mi mano pesa más que el bote. La noche abre su ojo sobre el agua y el peldaño, terco, me guarda el lugar.» Nombra las figuras y di qué sentido tienen.', lineas: 4, pauta: 'La llave no pesa más que el bote: es hipérbole de la culpa. «La noche abre su ojo» personifica la noche y el ojo puede ser el faro, símbolo de vigilancia. El peldaño «terco» también está personificado: el lugar insiste en que ella siga esperando.' },
        { titulo: 'Género dramático' },
        { enunciado: 'Explica para qué está escrito un texto dramático. Diferencia acto y escena, diálogo, monólogo, aparte y acotación.', lineas: 4, pauta: 'Está escrito para representarse y casi todo ocurre en los diálogos. Acto y escena parten la obra y cambian lugar o tiempo. El diálogo es entre personajes, el monólogo es a solas y el aparte no lo oyen los demás. La acotación indica gesto, tono o escena y no la dice el personaje.' },
        { enunciado: 'Nombra los tres tipos de conflicto dramático y di cómo se construye un personaje.', lineas: 3, pauta: 'Entre dos personas, entre una persona y su entorno, o dentro de la misma persona. El personaje se construye con lo que dice, lo que calla y lo que hace mientras habla.' },
        { enunciado: 'En el fragmento del abuelo y Marina, desarrolla el conflicto y explica qué muestra la acotación final, cuando la llave cae sobre la madera.', lineas: 3, pauta: 'Ella quería llegar a tiempo y no lo logró; él le reprocha el retraso. La acotación muestra una decisión sin que Marina la explique: suelta la responsabilidad que venía apretando.' },
        { titulo: 'Texto no literario' },
        { enunciado: 'En un texto expositivo, distingue tema, idea principal y datos que la sostienen.', lineas: 3, pauta: 'Explica un tema con ideas ordenadas. La idea principal es lo que sostiene cada párrafo. Los datos son ejemplos, cifras o definiciones.' },
        { enunciado: 'En una infografía, explica qué informan el título, el tamaño, el color y una flecha. Diferencia información relevante, recurso verbal y recurso visual.', lineas: 4, pauta: 'El título da el tema. Tamaño y color jerarquizan; una flecha marca causa, proceso o secuencia. Lo relevante responde al propósito. Verbal: título, subtítulo, viñeta, pregunta retórica, cifra. Visual: ícono, mapa, gráfico, color, tamaño, flecha. Un adorno no es información relevante.' },
        { titulo: 'Lectura crítica' },
        { enunciado: 'Diferencia mensaje explícito e implícito, y explica qué entra en el contexto. ¿Por qué un aviso de 1920 sobre higiene del puerto no se lee igual que una infografía actual?', lineas: 3, pauta: 'El explícito es la frase que el texto defiende. El implícito es la valoración: quién queda bien, a quién se dirige y qué se da por sabido. El contexto junta época, lugar, autor y destinatario, y cambia el sentido de la misma frase.' },
        { enunciado: 'Lee: «El nuevo muelle es un regalo para la ciudad. Quienes se oponen solo extrañan el pasado.» Separa el mensaje explícito, el implícito y lo que el texto no demuestra.', lineas: 3, pauta: 'Explícito: el muelle beneficia a la ciudad. Implícito: la oposición es nostalgia, no un argumento. No muestra empleo, costo ni a quién perjudica. La lectura crítica pide esas pruebas antes de aceptar el elogio.' },
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
        { titulo: 'Unit 3 · Water to your health' },
        { enunciado: 'Answer in English. Explain waterborne, airborne and foodborne. Say how they can combine.', lineas: 3, pauta: 'Waterborne travels in water, airborne in the air and foodborne in food. They are not the same, but they can combine.' },
        { enunciado: 'Describe cholera, typhoid, dysentery and hepatitis A. Give one cause or one sign for each.', lineas: 4, pauta: 'Cholera: bacteria in dirty water, severe diarrhea and dehydration. Typhoid: contaminated food or water, high fever. Dysentery and diarrhea: dirty water, unwashed hands or food washed with unsafe water. Hepatitis A: a virus that affects the liver when a person swallows something with fecal matter.' },
        { enunciado: 'Explain the fecal-oral route and write five everyday situations in which it happens.', lineas: 4, pauta: 'Germs from feces reach the mouth through water, hands, flies or food. Situations: drinking from a river or an open well, washing vegetables with contaminated water, no latrines so sewage enters the source, floods mixing toilets and drinking water, and not washing hands after the toilet.' },
        { enunciado: 'Define boil, sanitation, hygiene and contaminated. Name two more ways to prevent a waterborne disease.', lineas: 3, pauta: 'Boiling kills most germs. Sanitation is a safe system for waste. Hygiene includes washing hands with soap. Contaminated means dirty or infected, not safe to use. Also filter, chlorinate, cover the tank and build latrines.' },
        { enunciado: 'Answer the three myths about foreign aid. For each myth, write the fact.', lineas: 4, pauta: 'Aid does not always end poverty: emergency money does not replace schools, jobs and clean water systems. Not all aid is wasted: vaccines, oral rehydration salts and protected wells save lives, but some projects fail when they ignore local people. Aid is not only cash: it can be training, technology, medicine or engineers.' },
        { enunciado: 'Write one sentence with should, one with must and one with can about safe water. Say what each modal means.', lineas: 3, pauta: 'Should is advice, must is an obligation and can is a possibility. For example: People should boil water. Communities must have latrines. Filters can remove germs.' },
        { titulo: 'Unit 4 · Our way out of poverty' },
        { enunciado: 'List the five basic needs. Explain what happens when one is missing, and define extreme poverty with four effects.', lineas: 4, pauta: 'Food, safe water, shelter, health care and education. If one is missing, the others become harder: a sick child often cannot stay in school. Extreme poverty means people cannot cover the minimum to live. Effects: malnutrition, child labor, illness and leaving school early.' },
        { enunciado: 'Define income, savings, credit and remittances. Then explain development and how it is different from one donation.', lineas: 4, pauta: 'Income is money a family receives. Savings are kept for later. Credit is money received now and paid back. Remittances are money sent by a relative who works in another place. Development is a long process: schools, clinics, roads, fair jobs and public services, so the community does not depend on emergency aid.' },
        { enunciado: 'Complete and explain: The well was contaminated, so … They left school because … Name the three linking words for cause and effect.', lineas: 3, pauta: 'So children got sick. Because they had to work. Because, so and therefore show cause and effect.' },
        { enunciado: 'Write two fair comparisons with than, more, fewer or less. Explain why more income does not always mean less poverty.', lineas: 3, pauta: 'A village with a clinic is healthier than a village without one. Fewer children miss school when water is safe. More income does not always mean less poverty if food prices rise.' },
        { titulo: 'Reading and vocabulary' },
        { enunciado: 'Retell A pump for the school. Include the flood, the illness, who helped, what families learned and what the nurse said about a machine.', lineas: 4, pauta: 'After the floods, sewage mixed with the river, the only water source. Students had diarrhea and missed classes. The illness was waterborne. A foreign organization gave a pump and filters, the neighborhood added labor, and families learned to wash their hands and cover the tank. The nurse said a machine without training is not a solution. They still need latrines farther from the well. Clean water was the first step, not the end of development.' },
        { enunciado: 'Use these words in your own English sentences: outbreak, dehydration, sewage, malnutrition, remittances and development.', lineas: 4, pauta: 'Any correct sentences. Meanings: outbreak is a burst of illness, dehydration is the loss of water, sewage is dirty water from toilets, malnutrition is an effect of extreme poverty, remittances arrive from another place, and development is more than one donation.' }
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
        { titulo: 'Biología · origen, evolución y clasificación' },
        { enunciado: 'Diferencia generación espontánea, biogénesis y creacionismo en este contexto histórico.', lineas: 3, pauta: 'La generación espontánea o abiogénesis decía que la vida aparece sola de la materia no viva. La biogénesis dice que todo ser vivo proviene de otro. El creacionismo explica la diversidad como una creación ya terminada y sin el mecanismo de selección de Darwin.' },
        { enunciado: 'Resume el experimento y lo que mostró cada uno: Redi (1668), Needham (1745), Spallanzani (1765) y Pasteur (1861).', lineas: 4, pauta: 'Redi: los gusanos solo aparecen donde las moscas ponen huevos. Needham hirvió y tapó mal el caldo, y creyó ver vida nueva. Spallanzani hirvió más y selló: no hubo crecimiento hasta que entró aire. Pasteur, con cuello de cisne, dejó entrar aire y el polvo quedó en la curva: el caldo siguió estéril.' },
        { enunciado: 'Explica la idea de Lamarck sobre el cuello de la jirafa y por qué hoy no se acepta como explicación de la evolución.', lineas: 3, pauta: 'Lamarck dijo que lo que se usa se desarrolla, lo que no se usa se atrofia y ese carácter adquirido se hereda. Cada generación estiraría el cuello y heredaría el estiramiento. Esa herencia de lo adquirido no explica la evolución.' },
        { enunciado: 'Escribe los postulados de la selección natural de Darwin y Wallace, hasta la adaptación.', lineas: 4, pauta: 'Hay variación heredable. Nacen más individuos de los que el ambiente puede mantener. Hay diferencias de supervivencia y reproducción. Los rasgos que favorecen esa reproducción se vuelven más frecuentes. Con el tiempo la población queda mejor ajustada a su ambiente: eso es la adaptación. El individuo no necesita cambiar su cuerpo y heredarlo.' },
        { enunciado: 'Ordena las siete categorías, escribe Puma concolor y explica por qué una clasificación no queda fija para siempre.', lineas: 3, pauta: 'Reino, filo, clase, orden, familia, género y especie. Género con mayúscula y epíteto con minúscula, en cursiva. Los grupos cercanos comparten un ancestro más reciente. Los criterios pasaron de la forma externa a la anatomía y hoy también al ADN, así que la clasificación se reconstruye.' },
        { titulo: 'Biología · ecosistemas de Chile' },
        { enunciado: 'Con el guanaco, diferencia organismo, población, comunidad y ecosistema. Define biodiversidad.', lineas: 3, pauta: 'Un guanaco; los guanacos de un valle; guanacos, pumas, pastos y aves; esa comunidad más el agua, el suelo y el clima. La biodiversidad incluye riqueza de especies, variabilidad genética y diversidad de hábitats. No es solo que haya muchas especies.' },
        { enunciado: 'Explica cómo cambia una población y diferencia crecimiento exponencial y logístico.', lineas: 3, pauta: 'Cambia por natalidad, mortalidad, inmigración y emigración. Crece en forma exponencial cuando nada la frena, y en forma logística cuando se acerca a la capacidad de carga.' },
        { enunciado: 'Clasifica depredación, competencia interespecífica, competencia intraespecífica, mutualismo, comensalismo y parasitismo. Da el ejemplo de Chile de cada uno.', lineas: 4, pauta: 'Depredación +/−: el puma caza guanacos. Competencia interespecífica −/−: dos especies de choritos disputan la roca. Intraespecífica: guanacos que compiten por el mismo pasto. Mutualismo +/+: un polinizador y la flor. Comensalismo +/0: una planta epífita usa el tronco. Parasitismo +/−: el quintral extrae savia del árbol.' },
        { titulo: 'Física · oído, ojo y sismos' },
        { enunciado: 'Describe el sonido y relaciona frecuencia, amplitud, infrasonido y ultrasonido con el rango aproximado del oído humano.', lineas: 3, pauta: 'Es una onda mecánica longitudinal. La frecuencia se oye como grave o agudo y la amplitud como intensidad. El oído capta cerca de 20 Hz a 20 000 Hz. Fuera de ese espectro están el infrasonido y el ultrasonido.' },
        { enunciado: 'Recorre el oído externo, el medio y el interno. Explica qué hace un audífono y qué no devuelve si el daño es profundo.', lineas: 3, pauta: 'El pabellón y el conducto llevan la onda al tímpano. El tímpano y los huesecillos, martillo, yunque y estribo, amplifican la vibración. La cóclea la transforma en señal nerviosa. El audífono amplifica el sonido que la persona todavía puede procesar; no devuelve todas las frecuencias si el daño es profundo.' },
        { enunciado: 'Describe el camino de la luz en el ojo y el rango visible. Diferencia miopía e hipermetropía y la lente que corrige cada una.', lineas: 4, pauta: 'La luz visible va de cerca de 400 nm, violeta, a 700 nm, rojo. El ojo no ve ultravioleta ni infrarrojo. Córnea y cristalino enfocan; iris y pupila regulan la entrada; los conos ven color con luz alta y los bastones, blanco y negro con poca luz; el nervio óptico lleva la señal y el cerebro arma la imagen. Miopía: la imagen se forma antes de la retina y se corrige con lente divergente. Hipermetropía: se formaría detrás y se corrige con lente convergente.' },
        { enunciado: 'En un sismo chileno, explica la placa de Nazca, el hipocentro, el epicentro y el área de ruptura.', lineas: 3, pauta: 'La placa de Nazca se hunde bajo la Sudamericana. La energía se acumula y se libera de golpe. El hipocentro es la ruptura en profundidad, el epicentro es el punto de la superficie encima y el área de ruptura es la zona de la falla que se desplazó.' },
        { enunciado: 'Compara las ondas P, S y superficiales. Relaciona la onda S con el núcleo externo y di cuáles suelen dañar más las construcciones.', lineas: 3, pauta: 'P: compresión, la más rápida, sólidos y líquidos, llega primero. S: corte, más lenta, solo sólidos; no atraviesa el núcleo externo líquido, por eso esa capa no es sólida. Superficiales, Love y Rayleigh, viajan por la superficie y suelen causar el mayor daño.' },
        { enunciado: 'Diferencia magnitud e intensidad. Nombra consecuencias directas e indirectas de un sismo, incluido el tsunami.', lineas: 3, pauta: 'La magnitud mide la energía y es un solo número. La intensidad describe los efectos y cambia de lugar. Directas: sacudida, grietas, derrumbes y licuefacción. Indirectas: incendio, corte de agua, tsunami si el fondo marino mueve la columna de agua, y efectos en viviendas, rutas y trabajo.' },
        { titulo: 'Física · Tierra, Luna y Sol' },
        { enunciado: 'Explica día y noche, el año y las estaciones. Di por qué en Chile diciembre es verano.', lineas: 3, pauta: 'El día y la noche vienen de la rotación. El año es la órbita alrededor del Sol. Las estaciones las produce la inclinación del eje, unos 23,5°, no la distancia al Sol. En diciembre el hemisferio sur queda más de frente al Sol.' },
        { enunciado: 'Ordena las fases de la Luna y di en cuál ocurre un eclipse solar y un eclipse lunar. Explica por qué no hay eclipse en cada fase.', lineas: 3, pauta: 'Nueva, creciente, cuarto, llena y menguante. Vemos la porción iluminada hacia nosotros. Eclipse solar en luna nueva, cuando la sombra de la Luna toca la Tierra. Eclipse lunar en luna llena, cuando la Tierra proyecta su sombra sobre la Luna. La órbita lunar está inclinada.' },
        { enunciado: 'Compara Mercurio y Júpiter con la Tierra usando distancia al Sol, tamaño, período orbital y atmósfera.', lineas: 3, pauta: 'Mercurio es pequeño, cercano y sin atmósfera densa. Júpiter es enorme, lejano, tarda más en orbitar y tiene una atmósfera espesa de gases.' },
        { titulo: 'Química · reacciones, masa y mol' },
        { enunciado: 'Diferencia cambio físico y cambio químico. Nombra evidencias de un cambio químico y desarrolla fermentación, combustión del metano y oxidación del hierro.', lineas: 4, pauta: 'En el cambio físico la sustancia sigue: el hielo sigue siendo agua. En el químico hay sustancias nuevas: gas, precipitado, cambio de temperatura, color, olor o luz. La levadura transforma azúcar en etanol y dióxido de carbono. CH₄ + 2 O₂ da CO₂ y agua y libera energía. 4 Fe + 3 O₂ da óxido de hierro, una sustancia nueva, no hierro mojado.' },
        { enunciado: 'Explica la teoría de las colisiones y la energía de activación. Clasifica síntesis, descomposición, sustitución, combustión, neutralización y óxido-reducción.', lineas: 4, pauta: 'Reaccionan si chocan con energía suficiente y buena orientación. Esa energía mínima es la de activación; subir la temperatura suele acelerar. Síntesis junta, descomposición separa y sustitución reemplaza. La combustión libera energía y es exotérmica. Ácido más base puede dar sal y agua. Quien pierde electrones se oxida y quien los gana se reduce; ocurren juntas.' },
        { enunciado: 'Diferencia reacción exotérmica y endotérmica, reversible e irreversible. Explica qué se equilibran en una ecuación y qué no se cambia.', lineas: 3, pauta: 'La exotérmica libera calor y la endotérmica lo absorbe. Es reversible si los productos también pueden formar reactantes. Es irreversible cuando, en la práctica, va en un sentido, como muchas combustiones abiertas. Los coeficientes equilibran la cantidad; no se cambian las fórmulas para hacer calzar la ecuación.' },
        { enunciado: 'Aplica la conservación de la masa a 12 g de carbono y 32 g de oxígeno. Define unidad de masa atómica, masa atómica, mol, masa molar y calcula cuántos moles hay en 18 g de agua.', lineas: 4, pauta: 'Los átomos se reordenan y no desaparecen. 12 + 32 = 44 g de CO₂, si no escapa materia. La u es un doceavo de la masa del carbono-12. La masa atómica es el promedio de los isótopos, por eso el cloro no es un entero. Un mol tiene 6,022 × 10²³ entidades. La masa molar, en g/mol, coincide con esa masa en u. n = m / M, así 18 / 18 = 1 mol de agua.' }
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
        { titulo: 'OA 19 · El problema económico' },
        { enunciado: 'Define la escasez y desarrolla las tres preguntas con un ejemplo. Muestra que elegir uno es dejar el otro.', lineas: 4, pauta: 'No es que un bien esté agotado hoy: no alcanza para todos los usos. Qué producir: pan o acero, vivienda o armas. Cómo: con más trabajo, más máquinas o más recursos, y cada método tiene un costo. Para quién: según el ingreso, según el Estado o con una mezcla.' },
        { enunciado: 'Nombra a los cuatro agentes y cierra el circuito con el pan: bien, remuneración, impuesto, importación y exportación.', lineas: 4, pauta: 'Las familias consumen, ofrecen trabajo y reciben remuneraciones. Las empresas producen, contratan y venden. El Estado cobra impuestos, entrega servicios y puede regular o producir. El resto del mundo entra por importaciones y exportaciones. La familia compra pan, la panadería paga sueldo, el Estado cobra IVA y el trigo puede entrar o salir de Chile.' },
        { titulo: 'OA 20 · El precio' },
        { enunciado: 'Define demanda, oferta y equilibrio. Di qué pasa con cada cantidad si el precio sube.', lineas: 3, pauta: 'La demanda es la cantidad que las personas quieren y pueden comprar a cada precio: si el precio sube, la cantidad demandada baja. La oferta es la cantidad que los productores quieren vender: si el precio sube, la cantidad ofrecida sube. El equilibrio es el precio en que ambas cantidades coinciden y no sobra ni falta.' },
        { enunciado: 'Explica monopolio, colusión, inflación y deflación.', lineas: 4, pauta: 'El monopolio es un solo vendedor y puede mantener el precio más alto. La colusión es un acuerdo entre vendedores para actuar como uno, por ejemplo fijando un precio. La inflación sube el nivel general de precios y con el mismo sueldo se compra menos. La deflación lo baja y puede frenar la producción si las empresas postergan ventas.' },
        { enunciado: 'Desarrolla un precio máximo muy bajo, un precio mínimo muy alto y un arancel. Di quién gana y quién paga en el arancel.', lineas: 3, pauta: 'Un máximo muy bajo puede generar escasez. Un mínimo muy alto, excedente. El arancel encarece lo importado, protege al productor local y quien compra paga más.' },
        { enunciado: 'Explica qué mueve la curva de demanda y qué mueve la curva de oferta, además del precio.', lineas: 3, pauta: 'La demanda se mueve si cambian el ingreso, el gusto o el precio de un bien relacionado. La oferta se mueve si cambian los costos, la tecnología o una sequía que reduce la cosecha.' },
        { titulo: 'OA 21 · Ahorro, crédito y riesgo' },
        { enunciado: 'Para la libreta de ahorro y la caja vecina, escribe para qué sirve cada una y qué puede salir mal.', lineas: 3, pauta: 'La libreta separa el ahorro y paga un interés bajo; la inflación puede comerse ese interés. La caja vecina junta aportes del barrio y presta a sus integrantes cuando el banco queda lejos; depende de la confianza y no siempre tiene la supervisión de un banco.' },
        { enunciado: 'Diferencia préstamo, línea de crédito y tarjeta. En cada uno, escribe el beneficio y el riesgo.', lineas: 4, pauta: 'El préstamo se recibe ahora y se devuelve con interés. La línea es un cupo que se usa por partes; la cuota se vuelve impagable si el ingreso baja. La tarjeta permite pagar después. Si se paga el total a tiempo, ordena el gasto. Si se paga solo el mínimo, la deuda crece por los intereses.' },
        { enunciado: 'Desarrolla las acciones y la previsión. La pregunta no es cuál instrumento es bueno: compara el uso concreto.', lineas: 3, pauta: 'Una acción es una parte de una empresa: puede ganar valor o perder parte o todo el dinero. La previsión junta aportes de hoy para un ingreso o para salud cuando ya no se trabaja. Si los aportes son bajos o irregulares, la pensión resulta insuficiente.' },
        { titulo: 'OA 12 · Expansión territorial' },
        { enunciado: 'Di qué buscaba el Estado al expandirse y por qué hay que nombrar, en cada caso, su objetivo y el efecto sobre quienes ya vivían ahí.', lineas: 3, pauta: 'Buscó reconocer el territorio, describir a la población, aprovechar recursos, organizar la administración y marcar fronteras. Las vías son colonización, ocupación, diplomacia, guerra y ciencia. La respuesta queda incompleta si solo dice el objetivo del Estado.' },
        { enunciado: 'Desarrolla la colonización de 1845: ley, persona, lugares y objetivo declarado.', lineas: 3, pauta: 'La ley de 1845 y Vicente Pérez Rosales impulsaron la llegada de inmigrantes alemanes a Valdivia, Llanquihue y la zona del lago. El objetivo era poblar, cultivar y afirmar la presencia del Estado. También cambió la vida de las comunidades que ya habitaban esos lugares.' },
        { enunciado: 'Desarrolla la ocupación de la Araucanía con las dos caras, y la toma del estrecho de Magallanes con su fecha.', lineas: 4, pauta: 'En la segunda mitad del siglo XIX avanzó con fuertes, líneas militares y radicación mapuche en tierras reducidas. El Estado la presentó como incorporación del territorio y de sus recursos. Para el pueblo mapuche fue pérdida de territorio autónomo, violencia y una reorganización forzada. En 1843, Fuerte Bulnes y luego Punta Arenas aseguraron el paso marítimo.' },
        { enunciado: 'Desarrolla el tratado de 1881 con Argentina y la Guerra del Pacífico. Incluye contra quién fue, el recurso, los territorios y la salida al mar de Bolivia.', lineas: 4, pauta: 'El tratado de límites de 1881 reparte la Patagonia y precisa criterios en la cordillera y en el estrecho. La Guerra del Pacífico, 1879-1884, enfrentó a Chile con Perú y Bolivia por territorios salitreros. Incorporó Tarapacá y, mediante acuerdos posteriores, Antofagasta. Bolivia perdió su salida soberana al mar. No basta decir que Chile ganó.' },
        { enunciado: 'Desarrolla el papel de Gay, Domeyko, Philippi, los censos y la Universidad de Chile. Explica por qué la ciencia, en este OA, es una herramienta de gobierno.', lineas: 4, pauta: 'Gay levantó la historia física y política. Domeyko estudió minerales y formó ingenieros. Philippi describió la flora y la fauna. Los censos, desde mediados del siglo XIX, contaron a la población para cobrar impuestos, reclutar y administrar. La Universidad de Chile, en 1842, con Andrés Bello, formó profesionales. El Estado usó mapas, catastros y estudios para organizar provincias, conceder tierras y defender límites.' }
      ]
    }
  ];

  var tipo = 'desarrollo';
  var materiaId = 'matematica';
  var pack = false;
  var hoja = document.getElementById('hoja');
  var packBtn = document.getElementById('pack');
  var estado = document.getElementById('estado');

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

  function pregunta(item, numero) {
    var reglas = '';
    for (var i = 0; i < item.lineas; i++) reglas += '<div class="regla"></div>';
    return '<section class="item"><h3>' + numero + '. ' + item.enunciado + '</h3>' + reglas + '</section>';
  }

  function cuerpoGuia(materia) {
    var preguntas = '<p class="nombre">Nombre: ____________________ &nbsp;&nbsp; Curso: ________ &nbsp;&nbsp; Fecha: ________</p>';
    var pautas = '';
    var numero = 0;
    for (var i = 0; i < materia.desarrollo.length; i++) {
      var item = materia.desarrollo[i];
      if (!item.enunciado) {
        preguntas += '<h3 class="bloque">' + item.titulo + '</h3>';
        continue;
      }
      numero += 1;
      preguntas += pregunta(item, numero);
      pautas += '<li>' + item.pauta + '</li>';
    }
    return preguntas + '<p class="foot">Responde en las líneas. La pauta va en la hoja siguiente.</p><section class="pauta"><h3>Pauta</h3><ol>' + pautas + '</ol></section>';
  }

  function sheet(materia) {
    var etiqueta = tipo === 'torpedo' ? 'Torpedo de repaso' : 'Guía de desarrollo';
    var cuerpo = tipo === 'torpedo'
      ? '<div class="cols">' + materia.torpedo.map(bloque).join('') + '</div><p class="foot">Para imprimir y repasar. La guía completa está en el portal.</p>'
      : '<div class="guia">' + cuerpoGuia(materia) + '</div>';
    return '<article class="sheet ' + tipo + '"><header class="mast"><div><p>Colegio Tantauco · ' + etiqueta + '</p><h2>' + materia.nombre + '</h2></div><p>PDN · ' + materia.fecha + '</p></header>' + cuerpo + '</article>';
  }

  function render(scroll) {
    var lista = pack ? materias : [porId(materiaId)];
    hoja.innerHTML = lista.map(sheet).join('');
    var botones = document.querySelectorAll('[data-materia]');
    for (var i = 0; i < botones.length; i++) {
      botones[i].setAttribute('aria-pressed', String(!pack && botones[i].dataset.materia === materiaId));
    }
    document.getElementById('tipo-torpedo').setAttribute('aria-pressed', String(tipo === 'torpedo'));
    document.getElementById('tipo-desarrollo').setAttribute('aria-pressed', String(tipo === 'desarrollo'));
    packBtn.setAttribute('aria-pressed', String(pack));
    packBtn.textContent = pack ? 'Ver solo una' : 'Ver las 5 guías';
    var hash = pack ? 'todas-' + tipo : materiaId + '-' + tipo;
    if (location.hash !== '#' + hash) history.replaceState(null, '', '#' + hash);
    var nombre = pack ? 'las 5 guías' : 'la guía de ' + porId(materiaId).nombre;
    estado.textContent = tipo === 'torpedo'
      ? 'Estás viendo ' + (pack ? 'los 5 torpedos' : 'el torpedo de ' + porId(materiaId).nombre) + '.'
      : 'Estás viendo ' + nombre + ' de desarrollo.';
    if (scroll) estado.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  function ancho(texto, size) {
    var total = 0;
    for (var i = 0; i < texto.length; i++) {
      var c = texto.charAt(i);
      var u = 520;
      if (' ijlIftr.,:;\'|'.indexOf(c) !== -1) u = 280;
      else if ('mwMW@'.indexOf(c) !== -1) u = 820;
      else if (c >= 'A' && c <= 'Z') u = 680;
      total += u;
    }
    return total * size / 1000;
  }

  function octal(n) {
    var s = n.toString(8);
    while (s.length < 3) s = '0' + s;
    return '\\' + s;
  }

  function pdfStr(texto) {
    var mapa = {
      160: 160, 161: 161, 171: 171, 176: 176, 178: 178, 183: 183, 187: 187, 191: 191, 215: 215,
      193: 193, 201: 201, 205: 205, 211: 211, 218: 218, 209: 209, 220: 220,
      225: 225, 233: 233, 237: 237, 243: 243, 250: 250, 241: 241, 252: 252,
      8211: 150, 8212: 151, 8216: 145, 8217: 146, 8220: 147, 8221: 148, 8230: 133
    };
    var s = '(';
    for (var i = 0; i < texto.length; i++) {
      var c = texto.charCodeAt(i);
      var b = c < 128 ? c : (mapa[c] || 63);
      if (b === 40 || b === 41 || b === 92) s += '\\' + String.fromCharCode(b);
      else if (b < 32 || b > 126) s += octal(b);
      else s += String.fromCharCode(b);
    }
    return s + ')';
  }

  function Documento() {
    this.paginas = [];
    this.abrir();
  }

  Documento.prototype.abrir = function () {
    this.actual = { ops: [], y: 800 };
    this.paginas.push(this.actual);
  };

  Documento.prototype.espacio = function (n) {
    if (this.actual.y - n < 48) this.abrir();
  };

  Documento.prototype.lineaTexto = function (texto, size, bold) {
    this.espacio(size + 5);
    var font = bold ? '/F2 ' : '/F1 ';
    this.actual.ops.push('BT ' + font + size + ' Tf 1 0 0 1 40 ' + Math.round(this.actual.y) + ' Tm ' + pdfStr(texto) + ' Tj ET');
    this.actual.y -= size + 5;
  };

  Documento.prototype.parrafo = function (texto, size, bold) {
    var palabras = String(texto).split(' ');
    var linea = '';
    for (var i = 0; i < palabras.length; i++) {
      var prueba = linea ? linea + ' ' + palabras[i] : palabras[i];
      if (ancho(prueba, size) > 515 && linea) {
        this.lineaTexto(linea, size, bold);
        linea = palabras[i];
      } else {
        linea = prueba;
      }
    }
    if (linea) this.lineaTexto(linea, size, bold);
  };

  Documento.prototype.regla = function () {
    this.espacio(18);
    var y = Math.round(this.actual.y);
    this.actual.ops.push('0.6 w 0.72 0.68 0.82 RG 40 ' + y + ' m 555 ' + y + ' l S');
    this.actual.y -= 16;
  };

  Documento.prototype.cuerpos = function () {
    var lista = [];
    for (var i = 0; i < this.paginas.length; i++) lista.push(this.paginas[i].ops.join('\n'));
    return lista;
  };

  function documentoDe(lista, modo) {
    var doc = new Documento();
    for (var i = 0; i < lista.length; i++) {
      if (i > 0) doc.abrir();
      var materia = lista[i];
      doc.lineaTexto('Colegio Tantauco · ' + (modo === 'torpedo' ? 'Torpedo de repaso' : 'Guía de desarrollo'), 10, true);
      doc.lineaTexto(materia.nombre + '    PDN ' + materia.fecha, 16, true);
      doc.actual.y -= 6;
      if (modo === 'torpedo') {
        for (var b = 0; b < materia.torpedo.length; b++) {
          doc.parrafo(materia.torpedo[b].titulo, 12, true);
          for (var n = 0; n < materia.torpedo[b].lineas.length; n++) doc.parrafo(materia.torpedo[b].lineas[n], 10, false);
          doc.actual.y -= 6;
        }
      } else {
        doc.parrafo('Nombre: ____________________    Curso: ________    Fecha: ________', 10, false);
        doc.actual.y -= 6;
        var numero = 0;
        for (var q = 0; q < materia.desarrollo.length; q++) {
          var item = materia.desarrollo[q];
          if (!item.enunciado) {
            doc.actual.y -= 4;
            doc.parrafo(item.titulo, 13, true);
            continue;
          }
          numero += 1;
          doc.parrafo(numero + '. ' + item.enunciado, 11, true);
          for (var r = 0; r < item.lineas; r++) doc.regla();
          doc.actual.y -= 4;
        }
        doc.abrir();
        doc.lineaTexto('Pauta · ' + materia.nombre, 14, true);
        doc.actual.y -= 4;
        numero = 0;
        for (var p = 0; p < materia.desarrollo.length; p++) {
          var respuesta = materia.desarrollo[p];
          if (!respuesta.enunciado) continue;
          numero += 1;
          doc.parrafo(numero + '. ' + respuesta.pauta, 10, false);
        }
      }
    }
    return doc;
  }

  function armarPdf(paginas) {
    var objetos = [];
    objetos.push('<< /Type /Catalog /Pages 2 0 R >>');
    objetos.push('');
    objetos.push('<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica /Encoding /WinAnsiEncoding >>');
    objetos.push('<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold /Encoding /WinAnsiEncoding >>');
    var kids = [];
    for (var i = 0; i < paginas.length; i++) {
      var stream = paginas[i];
      var contenido = objetos.length + 1;
      objetos.push('<< /Length ' + stream.length + ' >>\nstream\n' + stream + '\nendstream');
      kids.push((contenido + 1) + ' 0 R');
      objetos.push('<< /Type /Page /Parent 2 0 R /MediaBox [0 0 595 842] /Contents ' + contenido + ' 0 R /Resources << /Font << /F1 3 0 R /F2 4 0 R >> >> >>');
    }
    objetos[1] = '<< /Type /Pages /Count ' + paginas.length + ' /Kids [' + kids.join(' ') + '] >>';
    var cuerpo = '%PDF-1.4\n';
    var offsets = [0];
    for (var j = 0; j < objetos.length; j++) {
      offsets.push(cuerpo.length);
      cuerpo += (j + 1) + ' 0 obj\n' + objetos[j] + '\nendobj\n';
    }
    var xref = cuerpo.length;
    var salida = cuerpo + 'xref\n0 ' + (objetos.length + 1) + '\n0000000000 65535 f \n';
    for (var k = 1; k < offsets.length; k++) {
      var off = String(offsets[k]);
      while (off.length < 10) off = '0' + off;
      salida += off + ' 00000 n \n';
    }
    salida += 'trailer\n<< /Size ' + (objetos.length + 1) + ' /Root 1 0 R >>\nstartxref\n' + xref + '\n%%EOF';
    return salida;
  }

  function guardarPdf() {
    var lista = pack ? materias : [porId(materiaId)];
    var binario = armarPdf(documentoDe(lista, tipo).cuerpos());
    var bytes = new Uint8Array(binario.length);
    for (var i = 0; i < binario.length; i++) bytes[i] = binario.charCodeAt(i) & 255;
    var blob = new Blob([bytes], { type: 'application/pdf' });
    var nombre = (pack ? 'pdn-5-' : materiaId + '-') + (tipo === 'torpedo' ? 'torpedo' : 'guia-de-desarrollo') + '.pdf';
    var url = URL.createObjectURL(blob);
    var enlace = document.createElement('a');
    enlace.href = url;
    enlace.download = nombre;
    document.body.appendChild(enlace);
    enlace.click();
    enlace.remove();
    if (window.matchMedia('(pointer: coarse)').matches) window.open(url, '_blank');
    estado.textContent = 'PDF listo: ' + nombre + '.';
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
    render(true);
  });
  document.getElementById('tipo-torpedo').addEventListener('click', function () { tipo = 'torpedo'; render(true); });
  document.getElementById('tipo-desarrollo').addEventListener('click', function () { tipo = 'desarrollo'; render(true); });
  packBtn.addEventListener('click', function () {
    pack = !pack;
    if (pack) tipo = 'desarrollo';
    render(true);
  });
  document.getElementById('imprimir').addEventListener('click', guardarPdf);

  leerHash();
  render(false);
})();

// pages/test_full.js
import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import styles from '../styles/TestFull.module.css';

const TestFull = () => {
  const router = useRouter();
  const [form, setForm] = useState({
    usuario: ''
  });
  const [answers, setAnswers] = useState({});
  const [totalScore, setTotalScore] = useState(null);
  const [interpretacion, setInterpretacion] = useState('');
  const [depressionAnswers, setDepressionAnswers] = useState({});
  const [depressionScore, setDepressionScore] = useState(null);
  const [extraAnswers, setExtraAnswers] = useState({});
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  // Obtener automáticamente el usuario del localStorage al cargar el componente
  useEffect(() => {
    const savedUser = localStorage.getItem('username');
    if (savedUser) {
      setForm(prev => ({ ...prev, usuario: savedUser }));
    } else {
      // Si no hay usuario en localStorage, redirigir al registro
      router.push('/signup');
    }
  }, [router]);

  const handleRadioChange = (e) => {
    const { name, value } = e.target;
    setAnswers({ ...answers, [name]: parseInt(value) });
  };

  const handleDepressionChange = (e) => {
    const { name, value } = e.target;
    setDepressionAnswers({ ...depressionAnswers, [name]: parseInt(value) });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');
    // Procesar puntaje de ansiedad
    const total = Object.values(answers).reduce((acc, val) => acc + val, 0);
    setTotalScore(total);

    // Interpretación ansiedad
    let mensajeAnsiedad = '';
    if (total <= 6) {
      mensajeAnsiedad = 'Leve: Los síntomas son mínimos o están ausentes.';
    } else if (total <= 12) {
      mensajeAnsiedad = 'Moderada: Síntomas moderados.';
    } else if (total <= 18) {
      mensajeAnsiedad = 'Grave: Podría ser útil buscar apoyo.';
    } else {
      mensajeAnsiedad = 'Muy grave incapacitante: Buscar ayuda profesional.';
    }
    setInterpretacion(mensajeAnsiedad);

    // Procesar puntaje de depresión
    const depTotal = Object.values(depressionAnswers).reduce((acc, val) => acc + val, 0);
    setDepressionScore(depTotal);

    // Interpretación depresión
    let mensajeDepresion = '';
    if (depTotal <= 8) {
      mensajeDepresion = 'No depresión: Estás en un estado emocional equilibrado.';
    } else if (depTotal <= 15) {
      mensajeDepresion = 'Depresión leve: Algunos síntomas leves, pero generalmente funcionando bien.';
    } else if (depTotal <= 23) {
      mensajeDepresion = 'Depresión moderada: Dificultad notable en algunas áreas, podría ser útil buscar apoyo.';
    } else {
      mensajeDepresion = 'Depresión grave: Impacto significativo en tu bienestar, se recomienda buscar ayuda profesional.';
    }

    try {
      // Obtener el token de autenticación
      const token = localStorage.getItem('authToken');

      if (!token) {
        setError('No hay sesión activa. Por favor, vuelve a iniciar sesión.');
        setIsLoading(false);
        // Opcionalmente, redirigir al login después de un tiempo
        setTimeout(() => router.push('/login'), 2000);
        return;
      }

      const response = await fetch('/api/test/saveResults', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}` // Asegurar que el formato sea "Bearer [token]"
        },
        body: JSON.stringify({
          usuario: form.usuario,
          ansiedadScore: total,
          depresionScore: depTotal,
          ansiedadInterpretacion: mensajeAnsiedad,
          depresionInterpretacion: mensajeDepresion,
          extraAnswers: extraAnswers
        })
      });

      const data = await response.json();

      if (response.ok) {
        router.push('/main'); // Redirigir después de guardar los resultados
      } else {
        setError(data.message || 'Error al guardar los resultados');
      }
    } catch (error) {
      console.error('Error al enviar los resultados:', error);
      setError('Error al conectar con el servidor');
    } finally {
      setIsLoading(false);
    }
  };

  // Contar respuestas de la tercera parte (Diferenciación)
  const countExtraAnswers = Object.values(extraAnswers).reduce((acc, val) => {
    // Para simplificar, contemos cuántas respuestas frecuentes/siempre hay
    if (val >= 3) { // "Frecuentemente" o "Siempre"
      return acc + 1;
    }
    return acc;
  }, 0);


  const questions = [
    {
      name: 'estado_animo',
      label: 'Estado de ánimo ansioso: Preocupación constante, anticipación negativa, irritabilidad.'
    },
    {
      name: 'tension',
      label: 'Tensión: Nerviosismo, dificultad para relajarse, temblores.'
    },
    {
      name: 'insomnio',
      label: 'Insomnio: Dificultad para dormir, cansancio al despertar.'
    },
    {
      name: 'estres_examenes',
      label: 'Estrés ante los exámenes: Nerviosismo y miedo a no cumplir expectativas.'
    },
    {
      name: 'dificultad_clase',
      label: 'Dificultad para participar en clase: Temor a expresarse, miedo al juicio de compañeros o profesores.'
    },
    {
      name: 'estres_tareas',
      label: 'Estrés por las tareas escolares: Sobrecarga por la cantidad de tareas, preocupación constante por cumplir plazos.'
    },
  ];

  const depressionItems = [
    ["Esta tristeza me produce verdaderos sufrimientos.", 2],
    ["No me encuentro triste.", 0],
    ["Me siento algo triste y deprimido.", 1],
    ["Ya no puedo soportar esta pena.", 3],
    ["Tengo siempre como una pena enésima que no me la puedo quitar.", 2],

    ["Soy optimista sobre lo que puede venir", 0],
    ["No soy especialmente pesimista, ni creo que las cosas me vayan a ir mal", 1],
    ["Creo que podrían sugerir desafíos, pero confío en superarlos.", 1],
    ["No espero nada bueno de la vida.", 2],
    ["No espero nada. Esto no tiene remedio.", 3],

    ["Estoy satisfecho con mis logros y me siento bien conmigo mismo.", 0],
    ["No me considero fracasado.", 1],
    ["He tenido más fracasos que la mayoría de la gente.", 2],
    ["Siento que he hecho pocas cosas que valgan la pena.", 2],
    ["Veo mi vida llena de fracasos.", 3],

    ["Disfruto de las cosas que hago y me siento pleno.", 0],
    ["No estoy especialmente insatisfecho.", 1],
    ["Me encuentro insatisfecho conmigo mismo.", 1],
    ["A veces siento que podría disfrutar más las cosas, pero estoy trabajando en ello.", 0],
    ["Estoy harto de todo.", 3],

    ["A veces me siento despreciable y mala persona.", 1],
    ["Me siento bastante culpable.", 2],
    ["Me siento prácticamente todo el tiempo mala persona y despreciable.", 2],
    ["Me siento muy infame (perverso, canalla) y despreciable.", 3],
    ["No me siento culpable.", 0],

    ["Creo que merezco cosas buenas y confío en que sucederá.", 0],
    ["No pienso que merezco ser castigado.", 1],
    ["Aunque he cometido errores, sé que puedo aprender y mejorar.", 1],
    ["Siento que todo lo que me pasa es mi culpa.", 2],
    ["Siento que me están castigando o me castigarán.", 3],

    ["Me siento motivado y sigo estudiando como siempre.", 0],
    ["Me cuesta concentrarme, pero sigo intentando estudiar.", 1],
    ["Me resulta muy difícil estudiar o concentrarme en tareas.", 2],
    ["No tengo ganas de estudiar ni de hacer tareas.", 3],
    ["Siento que estudiar ya no tiene sentido.", 2],

    ["Me siento capaz de cumplir con mis tareas escolares sin mayores dificultades.", 0],
    ["A veces dudo de mi capacidad, pero aun así sigo intentándolo y trato de mejorar.", 1],
    ["Siento que no soy lo suficientemente bueno en mis estudios.", 2],
    ["Estoy convencido de que no puedo hacer nada bien en la escuela.", 3],
    ["Siento que no puedo mejorar, sin importar lo que haga.", 2],

    ["Evito completamente a los demás en el entorno escolar.", 3],
    ["A veces prefiero evitar interactuar con otros en la escuela.", 1],
    ["Me llevo bien con mis compañeros y profesores como siempre.", 0],
    ["Me siento aislado o incomprendido por mis compañeros y profesores.", 2],
    ["Me siento como si nadie me entendiera en la escuela.", 2],

    ["A veces pierdo interés en algunas actividades escolares.", 1],
    ["Ya no me interesa mucho lo que sucede en la escuela.", 2],
    ["No tengo interés en participar en nada relacionado con la escuela.", 3],
    ["Las actividades escolares ya no me parecen importantes.", 3],
    ["Me interesan las actividades escolares como siempre.", 0],

    ["Me siento tranquilo respecto a mi desempeño académico.", 0],
    ["A veces me siento algo presionado, pero lo manejo.", 1],
    ["Siento que la presión académica me está afectando bastante.", 2],
    ["Estoy completamente abrumado y no puedo manejar la presión escolar.", 3],
    ["La presión me hace sentir incapaz de seguir adelante.", 3],
  ];

  return (
    <div className={styles.container}>
      <h1 className={styles.title}>Autoevaluación Emocional (Parte 1)</h1>
      <p>
        Este test evaluará tus niveles de ansiedad y depresión. Su propósito es permitir que el Chatbot adapte su comportamiento según tus resultados, ofreciéndote una experiencia más adecuada a tu estado emocional.
      </p>
      <p className={styles.instructions}>
        <strong>Instrucciones:</strong> antes de ir con la evaluación contesta los siguientes datos generales.
      </p>

      <form onSubmit={handleSubmit}>
        {/* Datos generales */}
        {/* ... (misma sección de datos generales) */}

        <h2 className={styles.subtitle}>Autoevaluación de Ansiedad</h2>
        <p className={styles.instructions}>
          <strong>Instrucciones:</strong> Lee cada apartado con calma, selecciona la respuesta que mejor refleje cómo te has sentido durante la última semana, incluido el día de hoy.
        </p>
        <p className={styles.instructions}>
          <strong>Importante:</strong> En cada pregunta deberás seleccionar un número entre 0 y 4.
        </p>

        <table className={styles.questionTable}>
          <thead>
            <tr>
              <th>Ítem</th>
              <th>0</th>
              <th>1</th>
              <th>2</th>
              <th>3</th>
              <th>4</th>
            </tr>
          </thead>
          <tbody>
            {questions.map((q, idx) => (
              <tr key={idx}>
                <td>{q.label}</td>
                {[0, 1, 2, 3, 4].map((num) => (
                  <td key={num}>
                    <input
                      type="radio"
                      id={`${q.name}_${num}`}
                      name={q.name}
                      value={num}
                      checked={answers[q.name] === num}
                      onChange={handleRadioChange}
                    />
                    <label htmlFor={`${q.name}_${num}`}></label>
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>

        <h2 className={styles.subtitle}>Autoevaluación Emocional (Parte 2)</h2>
        <p className={styles.instructions}><strong>Instrucciones:</strong> Lee cada apartado con calma, marca la respuesta que mejor refleje cómo te has sentido durante la última semana.</p>
        <p className={styles.instructions}><strong>Importante:</strong> Cada frase por ítem tendrá un número específico que deberán sumar para obtener el resultado obtenido.</p>

        {[...Array(11)].map((_, i) => {
          // Obtener las opciones para este ítem
          const itemOptions = depressionItems.slice(i * 5, (i + 1) * 5);

          return (
            <div key={`depGroup_${i}`} className={styles.radioGroup}>
              <div className={styles.radioGroupHeader}><strong>Ítem {i + 1}:</strong></div>

              {/* Renderizar cada opción individual directamente, sin map */}
              <div className={styles.radioOption}>
                <input
                  type="radio"
                  id={`dep_${i}_0`}
                  name={`dep_${i}`}
                  value={itemOptions[0][1]}
                  checked={depressionAnswers[`dep_${i}`] === itemOptions[0][1]}
                  onChange={handleDepressionChange}
                />
                <label htmlFor={`dep_${i}_0`}>{itemOptions[0][0]} ({itemOptions[0][1]})</label>
              </div>

              <div className={styles.radioOption}>
                <input
                  type="radio"
                  id={`dep_${i}_1`}
                  name={`dep_${i}`}
                  value={itemOptions[1][1]}
                  checked={depressionAnswers[`dep_${i}`] === itemOptions[1][1]}
                  onChange={handleDepressionChange}
                />
                <label htmlFor={`dep_${i}_1`}>{itemOptions[1][0]} ({itemOptions[1][1]})</label>
              </div>

              <div className={styles.radioOption}>
                <input
                  type="radio"
                  id={`dep_${i}_2`}
                  name={`dep_${i}`}
                  value={itemOptions[2][1]}
                  checked={depressionAnswers[`dep_${i}`] === itemOptions[2][1]}
                  onChange={handleDepressionChange}
                />
                <label htmlFor={`dep_${i}_2`}>{itemOptions[2][0]} ({itemOptions[2][1]})</label>
              </div>

              <div className={styles.radioOption}>
                <input
                  type="radio"
                  id={`dep_${i}_3`}
                  name={`dep_${i}`}
                  value={itemOptions[3][1]}
                  checked={depressionAnswers[`dep_${i}`] === itemOptions[3][1]}
                  onChange={handleDepressionChange}
                />
                <label htmlFor={`dep_${i}_3`}>{itemOptions[3][0]} ({itemOptions[3][1]})</label>
              </div>

              <div className={styles.radioOption}>
                <input
                  type="radio"
                  id={`dep_${i}_4`}
                  name={`dep_${i}`}
                  value={itemOptions[4][1]}
                  checked={depressionAnswers[`dep_${i}`] === itemOptions[4][1]}
                  onChange={handleDepressionChange}
                />
                <label htmlFor={`dep_${i}_4`}>{itemOptions[4][0]} ({itemOptions[4][1]})</label>
              </div>
            </div>
          );
        })}

        <h2 className={styles.subtitle}>Autoevaluación Emocional (Parte 3)</h2>
        <p className={styles.instructions}>
          <strong>Instrucciones, Preguntas Extra:</strong> las siguientes preguntas son para evitar confundir la ansiedad
          y la depresión con algún otro trastorno, ya que se puede confundir muy fácilmente, sin embargo,
          no tendrán respuestas correctas o incorrectas.
        </p>

        {[
          {
            question: "Diferenciando la Ansiedad de la Depresión mayor: ¿Con qué frecuencia te sientes preocupado o nervioso por el futuro, en comparación con sentirte triste, sin esperanza o sin interés en las cosas que solías disfrutar?",
            info: "La ansiedad se enfoca en preocupaciones y temor al futuro, mientras que la depresión está más relacionada con sentimientos de desesperanza y perdida de interés."
          },
          {
            question: "Diferenciando Ansiedad de trastorno Obsesivo-Compulsivo (TOC): ¿Tus síntomas de ansiedad incluyen recuerdos intrusivos, flashbacks o evitar constantemente las situaciones relacionadas con un evento traumático en particular?",
            info: "En el TOC, los pensamientos intrusivos llevan a compulsiones específicas. en la ansiedad generalizada, las preocupaciones son más difusas y no están vinculadas a rituales."
          },
          {
            question: "Diferenciando Ansiedad de Trastorno de Estrés Postraumático (TEPT): ¿Tus síntomas de ansiedad están relacionados con un evento traumático que evitas recordar o que te genera flashbacks?",
            info: "El Trastorno de Estrés Postraumático (TEPT) se caracteriza por estar directamente vinculado a un evento traumático definido, generando reacciones como revivir la experiencia o evitar recordarla. En cambio, la ansiedad generalizada no se asocia necesariamente con un evento específico y tiende a manifestarse como preocupación excesiva sobre diversas áreas de la vida."
          },
          {
            question: "Diferenciando la Ansiedad de Trastorno de Pánico: ¿Experimentas episodios súbitos de miedo intenso con síntomas físicos como taquicardia, dificultad para respirar o sensación de perder el control, que aparecen sin previo aviso?",
            info: "El trastorno de pánico se caracteriza por ataques intensos y repentinos. La ansiedad generaliza produce una activación física más constante pero menos extrema."
          },
          {
            question: "Diferenciando la Ansiedad de trastornos físicos (como Hiperteroidismo): ¿Has notado que tus síntomas de ansiedad (como taquicardia o sudoración) están presentes incluso cuando no tienes pensamientos preocupantes?",
            info: "Los trastornos físicos (como el hipotiroidismo) pueden causar síntomas físicos similares a la ansiedad, pero no están asociados a preocupaciones o miedos específicos."
          },
          {
            question: "Diferenciando La Depresión de Trastorno Bipolar: ¿Has experimentado alguna vez episodios de euforia, hiperactividad o impulsividad en los que no necesitas dormir o te sientes invencible?",
            info: "En el trastorno bipolar, la depresión alterna con episodios de manía o hipomanía, donde los estados de ánimo son muy elevados, con síntomas como euforia y disminución de la necesidad de sueño, mientras que, en la depresión, los síntomas están centrados en tristeza, fatiga y pérdida de interés, sin esos altos de euforia."
          },
          {
            question: "Diferenciando La Depresión de Trastorno Obsesivo-Compulsivo (TOC): ¿Tienes pensamientos recurrentes y perturbadores que te causan angustia, pero que sientes que no puedes evitar si no quieres realizarlos?",
            info: "En el TOC, los pensamientos son muy intrusivos y se acompañan de compulsiones, mientras que la depresión está más relacionada con la tristeza profunda y la perdida de interés."
          },
          {
            question: "Diferencia con el Trastorno de Personalidad Limite (TLP): ¿Sueles tener cambios de ánimo muy rápidos y sentirte vacío o temer el abandono, a veces de manera extrema?",
            info: "En el trastorno límite de la personalidad, los cambios de humor son muy rápidos y suelen estar relacionados con las relaciones interpersonales (temor al abandono, reacciones impulsivas). En la depresión, el estado de ánimo generalmente es más constante y se enfoca en la tristeza y desesperanza, sin los cambios extremos relacionados con las relaciones personales."
          },
          {
            question: "Diferenciando La Depresión con los trastornos del sueño (como el Insomnio o la Apnea del sueño): ¿Sientes que no puedes descansar, te cuesta dormir o sientes que no tienes energía, aunque hayas dormido lo suficiente?",
            info: "En los trastornos del sueño, los síntomas principales están relacionados con la calidad del sueño (dificultad para dormir, insomnio, etc.), pero no incluyen necesariamente los sentimientos de tristeza o desesperanza. En la depresión, la fatiga es más emocional (desinterés, tristeza) y suele ir acompañada de otros síntomas como la pérdida de placer o motivación."
          },
          {
            question: "Diferenciando La Depresión de Trastornos Endocrinos (como Hipotiroidismo): ¿Tus síntomas de fatiga, tristeza o falta de interés persisten incluso después de descansar adecuadamente o cuando no hay estrés emocional evidente?",
            info: "El hipotiroidismo y otros trastornos endocrinos pueden causar síntomas físicos similares a la depresión, pero suelen estar relacionados con desequilibrios hormonales."
          },
          {
            question: "Diferenciando La Depresión con los Trastornos Psicosomáticos: ¿Tienes dolores o malestares físicos (como dolor de cabeza o de estómago) que no parecen tener una causa médica clara, y además te sientes emocionalmente decaído?",
            info: "En los trastornos psicosomáticos, el malestar físico no tiene una causa orgánica y puede estar relacionado con el estrés emocional. En la depresión, los síntomas emocionales son más prominentes, aunque los malestares físicos también pueden aparecer como parte de la condición."
          }
        ].map((item, index) => (
          <div key={`extra_question_${index}`} className={styles.extraQuestion}>
            <p><strong>{item.question}</strong></p>
            <div className={styles.extraOptions}>
              {['Nunca', 'Raramente', 'A veces', 'Frecuentemente', 'Siempre'].map((option, optIdx) => (
                <div key={`extra_${index}_${optIdx}`} className={styles.radioOption}>
                  <div className={styles.radioInputWrapper}>
                    <input
                      type="radio"
                      id={`extra_${index}_${optIdx}`}
                      name={`extra_${index}`}
                      value={optIdx}
                      checked={extraAnswers[`extra_${index}`] === optIdx}
                      onChange={(e) => {
                        const { name, value } = e.target;
                        setExtraAnswers({ ...extraAnswers, [name]: parseInt(value) });
                      }}
                    />
                    <label htmlFor={`extra_${index}_${optIdx}`} className={styles.radioMark}></label>
                  </div>
                  <label htmlFor={`extra_${index}_${optIdx}`} className={styles.radioText}>{option}</label>
                </div>
              ))}
            </div>
            <div className={styles.infoBox}>
              <strong>Información:</strong> {item.info}
            </div>
          </div>
        ))}

        <button type="submit">Calcular puntaje</button>

        {error && <div className={styles.error}>{error}</div>}
        {isLoading && <div className={styles.loadingState}>Procesando resultados...</div>}

        {totalScore !== null && (
          <div className={styles.resultContainer}>
            <h3>Resultados de la Evaluación</h3>

            <div className={`${styles.resultSection} ${styles.anxietyResult}`}>
              <h4>Parte 1: Evaluación de Ansiedad</h4>
              <p><strong>Puntaje total:</strong> {totalScore}/24</p>
              <p><strong>Interpretación:</strong> {interpretacion}</p>
              <p>
                <strong>Escala:</strong> 0-6 (Leve), 7-12 (Moderada), 13-18 (Grave), 19-24 (Muy grave)
              </p>
            </div>

            <div className={`${styles.resultSection} ${styles.depressionResult}`}>
              <h4>Parte 2: Evaluación de Depresión</h4>
              <p><strong>Puntaje total:</strong> {depressionScore}/33</p>
              <p><strong>Interpretación:</strong> {
                depressionScore <= 8
                  ? 'No depresión: Estás en un estado emocional equilibrado.'
                  : depressionScore <= 15
                    ? 'Depresión leve: Algunos síntomas leves, pero generalmente funcionando bien.'
                    : depressionScore <= 23
                      ? 'Depresión moderada: Dificultad notable en algunas áreas, podría ser útil buscar apoyo.'
                      : 'Depresión grave: Impacto significativo en tu bienestar, se recomienda buscar ayuda profesional.'
              }</p>
              <p>
                <strong>Escala:</strong> 0-8 (No depresión), 9-15 (Depresión leve), 16-23 (Depresión moderada), 24+ (Depresión grave)
              </p>
            </div>

            <div className={`${styles.resultSection} ${styles.extraResult}`}>
              <h4>Parte 3: Evaluación Diferencial</h4>
              <p><strong>Respuestas frecuentes/siempre:</strong> {
                Object.values(extraAnswers).filter(val => val >= 3).length
              } de 11 preguntas</p>
              <p><strong>Interpretación:</strong> {
                Object.values(extraAnswers).filter(val => val >= 3).length >= 3
                  ? 'Podría haber otros factores o condiciones que merecen atención adicional. Considera una evaluación más específica.'
                  : 'No se detectan indicadores significativos de otros trastornos relacionados.'
              }</p>
              <p>Las respuestas "Frecuentemente" o "Siempre" en múltiples preguntas de esta sección pueden indicar la presencia de otros trastornos que podrían confundirse con ansiedad o depresión.</p>
            </div>

            <div className={styles.warning}>
              <p><strong>Importante:</strong></p>
              <p>Esta evaluación es orientativa y no sustituye el diagnóstico profesional. Si experimentas malestar significativo, te recomendamos buscar ayuda de un profesional de la salud mental.</p>
            </div>
          </div>
        )}
      </form>
    </div>
  );
};


export default TestFull;

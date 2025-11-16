const axios = require('axios');

/**
 * Servicio para integrar con APIs externas
 * En este caso, usamos una API pública de ejercicios como ejemplo
 */

// API de ejercicios (ejemplo con ExerciseDB API)
const EXERCISE_API_BASE_URL = 'https://api.api-ninjas.com/v1/exercises';

/**
 * Buscar ejercicios en API externa
 * Nota: Requiere API key en producción
 */
exports.buscarEjerciciosExternos = async (nombre, tipo, grupoMuscular) => {
    try {
        const params = {};
        if (nombre) params.name = nombre;
        if (tipo) params.type = tipo;
        if (grupoMuscular) params.muscle = grupoMuscular;
        
        // En producción, usar API key real
        const config = {
            headers: {
                'X-Api-Key': process.env.EXTERNAL_API_KEY || ''
            },
            params
        };
        
        // Si no hay API key, retornar ejercicios de ejemplo
        if (!process.env.EXTERNAL_API_KEY) {
            return getEjerciciosEjemplo(nombre, tipo, grupoMuscular);
        }
        
        const response = await axios.get(EXERCISE_API_BASE_URL, config);
        return response.data;
    } catch (error) {
        console.error('Error al buscar ejercicios externos:', error.message);
        // Retornar ejercicios de ejemplo en caso de error
        return getEjerciciosEjemplo(nombre, tipo, grupoMuscular);
    }
};

/**
 * Ejercicios de ejemplo cuando no hay API externa disponible
 */
function getEjerciciosEjemplo(nombre, tipo, grupoMuscular) {
    const ejercicios = [
        {
            name: 'Push-ups',
            type: 'strength',
            muscle: 'chest',
            equipment: 'body only',
            difficulty: 'beginner',
            instructions: '1. Start in plank position. 2. Lower body until chest nearly touches floor. 3. Push back up.'
        },
        {
            name: 'Pull-ups',
            type: 'strength',
            muscle: 'lats',
            equipment: 'pull-up bar',
            difficulty: 'intermediate',
            instructions: '1. Hang from bar. 2. Pull body up until chin is above bar. 3. Lower slowly.'
        },
        {
            name: 'Squats',
            type: 'strength',
            muscle: 'quadriceps',
            equipment: 'body only',
            difficulty: 'beginner',
            instructions: '1. Stand with feet shoulder-width apart. 2. Lower body as if sitting. 3. Return to standing.'
        },
        {
            name: 'Deadlift',
            type: 'strength',
            muscle: 'hamstrings',
            equipment: 'barbell',
            difficulty: 'expert',
            instructions: '1. Stand with feet hip-width apart. 2. Bend at hips and knees. 3. Lift bar to standing position.'
        },
        {
            name: 'Bench Press',
            type: 'strength',
            muscle: 'chest',
            equipment: 'barbell',
            difficulty: 'intermediate',
            instructions: '1. Lie on bench. 2. Lower bar to chest. 3. Press up until arms are extended.'
        }
    ];
    
    // Filtrar por parámetros si se proporcionan
    let filtrados = ejercicios;
    
    if (nombre) {
        filtrados = filtrados.filter(e => 
            e.name.toLowerCase().includes(nombre.toLowerCase())
        );
    }
    
    if (tipo) {
        filtrados = filtrados.filter(e => 
            e.type.toLowerCase() === tipo.toLowerCase()
        );
    }
    
    if (grupoMuscular) {
        filtrados = filtrados.filter(e => 
            e.muscle.toLowerCase() === grupoMuscular.toLowerCase()
        );
    }
    
    return filtrados;
}

/**
 * Sincronizar ejercicios externos con la base de datos
 * (Opcional: para poblar el banco de ejercicios del sistema)
 */
exports.sincronizarEjerciciosExternos = async (db) => {
    try {
        const ejerciciosExternos = await this.buscarEjerciciosExternos();
        
        for (const ejercicio of ejerciciosExternos) {
            // Verificar si ya existe
            const existe = await db.query(
                'SELECT id_ejercicio FROM ejercicio WHERE nombre_ejercicio = $1 AND es_sistema = TRUE',
                [ejercicio.name]
            );
            
            if (existe.rows.length === 0) {
                // Mapear campos de la API externa a nuestra estructura
                await db.query(
                    `INSERT INTO ejercicio (
                        id_usuario, nombre_ejercicio, descripcion, tipo, 
                        grupo_muscular, dificultad, equipamiento, instrucciones, es_sistema
                    ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, TRUE)`,
                    [
                        1, // Usuario sistema (debe existir)
                        ejercicio.name,
                        ejercicio.instructions,
                        ejercicio.type,
                        ejercicio.muscle,
                        ejercicio.difficulty,
                        ejercicio.equipment,
                        ejercicio.instructions
                    ]
                );
            }
        }
        
        return { message: 'Ejercicios sincronizados correctamente' };
    } catch (error) {
        console.error('Error al sincronizar ejercicios:', error);
        throw error;
    }
};


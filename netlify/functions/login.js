const { createClient } = require('@supabase/supabase-js');
exports.handler = async function(event, context) {
    // Headers CORS
    const headers = {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Content-Type': 'application/json'
    };

    // Trata requisições OPTIONS (preflight)
    if (event.httpMethod === 'OPTIONS') {
        return {
            statusCode: 200,
            headers,
            body: ''
        };
    }

    // Verifica se é POST
    if (event.httpMethod !== 'POST') {
        return { 
            statusCode: 405, 
            headers,
            body: JSON.stringify({ message: 'Method Not Allowed' }) 
        };
    }

    try {
        // Cria cliente Supabase
        const supabase = createClient(
            process.env.SUPABASE_URL,
            process.env.SUPABASE_ANON_KEY
        );

        const { email, password } = JSON.parse(event.body);

        // Valida dados
        if (!email || !password) {
            return {
                statusCode: 400,
                headers,
                body: JSON.stringify({ message: 'Email e senha são obrigatórios' })
            };
        }

        const { data, error } = await supabase.auth.signInWithPassword({ 
            email, 
            password 
        });

        if (error) {
            return { 
                statusCode: 401, 
                headers,
                body: JSON.stringify({ message: error.message }) 
            };
        }

        return { 
            statusCode: 200, 
            headers,
            body: JSON.stringify({ 
                message: "Login bem-sucedido!", 
                session: data.session 
            }) 
        };
    } catch (e) {
        console.error('Erro no login:', e);
        return { 
            statusCode: 500, 
            headers,
            body: JSON.stringify({ message: "Erro interno do servidor." }) 
        };
    }
};
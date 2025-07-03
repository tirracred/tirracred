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

        const { nome, email, password, cpf, whatsapp, marketing_consent } = JSON.parse(event.body);

        // Valida dados essenciais
        if (!email || !password) {
            return {
                statusCode: 400,
                headers,
                body: JSON.stringify({ message: 'Email e senha são obrigatórios' })
            };
        }

        const { data, error } = await supabase.auth.signUp({
            email,
            password,
            options: {
                data: { 
                    full_name: nome, 
                    cpf, 
                    whatsapp, 
                    marketing_consent 
                }
            }
        });

        if (error) {
            return { 
                statusCode: 400, 
                headers,
                body: JSON.stringify({ message: error.message }) 
            };
        }

        return { 
            statusCode: 200, 
            headers,
            body: JSON.stringify({ 
                message: "Utilizador criado com sucesso!", 
                user: data.user 
            }) 
        };
    } catch (e) {
        console.error('Erro no registro:', e);
        return { 
            statusCode: 500, 
            headers,
            body: JSON.stringify({ message: "Erro interno do servidor." }) 
        };
    }
};
const { createClient } = require('@supabase/su```ase-js');

exports.handler =```ync function(event, context) {
    // Headers CORS obrigatórios```  const headers = {
        'Access-Control-Allow-Origin': '*',
        ```cess-Control-Allow-Headers': ```ntent-Type, Authorization',
        '```ess-Control-Allow-Methods': '```, POST, OPTIONS',
        'Content```pe': 'application/json'```  };

    // Trata```quisições OPTIONS (preflight CORS)
    if (event.httpMethod === 'OPTIONS') {
        return {
            statusCode```00,
            headers,```          body: ''
        };
    }

    try {
        //```eita apenas pedidos GET
        if (event.httpMethod !== 'GET') {
            ```urn {
                statusCode: 405,
                headers,
                body: JSON.```ingify({ message: 'Method Not```lowed' })
            };
        }

        // Obtém as vari```is do ambiente Netlify
        const```pabaseUrl = process.env.```ABASE_URL;
        const su```aseAnonKey = process.env.```ABASE_ANON_KEY;

        // Verifica se as variá```s estão configuradas
        if (!supabaseUrl || !supabaseAnon```) {
            throw new Error('As variáveis de ambiente SUPABASE_``` ou SUPABASE_```N_KEY não estão configuradas```;
        }

        // Ret```a as variáveis como um objeto JSON
        return```            statusCode: 200,
            headers,
            body: JSON.stringify```                supabaseUrl: supabaseUrl,```              supabaseAnonKey: su```aseAnonKey,
            ```        };
    } catch (error) {
        // Registra o```ro nos logs da função Netlify
        console```ror('Erro na função de```nfiguração:', error);

        return```            statusCode: 500,
            headers,
            body: JSON.stringify```
                message: 'Erro```terno do Servidor', 
                error```rror.message 
            })
        ```    }
};

// Rota POST /api/leads  (App Router)
export async function POST(request: Request) {
  try {
    const lead = await request.json();          // dados vindos do formulário
    console.log("Lead recebido:", lead);        // aparece no terminal

    // TODO: aqui entra Zapier mais tarde
    return Response.json({ ok: true });
  } catch (err) {
    console.error("Erro no POST /api/leads:", err);
    // devolve 500 p/ o front-end mostrar erro
    return Response.json({ ok: false }, { status: 500 });
  }
}

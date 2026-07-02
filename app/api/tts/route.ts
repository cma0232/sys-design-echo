export async function POST(req: Request) {
  const { text, apiKey, voice = 'nova' } = await req.json();

  if (!text || !apiKey) {
    return new Response('Missing text or apiKey', { status: 400 });
  }

  const response = await fetch('https://api.openai.com/v1/audio/speech', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'tts-1',
      input: text,
      voice,
    }),
  });

  if (!response.ok) {
    const err = await response.text();
    return new Response(err, { status: response.status });
  }

  return new Response(response.body, {
    headers: {
      'Content-Type': 'audio/mpeg',
    },
  });
}

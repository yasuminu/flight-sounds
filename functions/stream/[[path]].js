export async function onRequest(context) {
  const url = new URL(context.request.url);
  const path = url.pathname.replace('/stream/', '');
  const streamUrl = `https://d.liveatc.net/${path}`;
  
  const response = await fetch(streamUrl, {
    headers: { 'User-Agent': 'Mozilla/5.0' }
  });
  
  return new Response(response.body, {
    headers: {
      'Content-Type': 'audio/mpeg',
      'Access-Control-Allow-Origin': '*',
      'Cache-Control': 'no-cache'
    }
  });
}

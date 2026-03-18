export default {
  async fetch(request) {
    const url = new URL(request.url);
    const path = url.pathname;
    
    if (path.startsWith('/stream/')) {
      const feed = path.replace('/stream/', '');
      const streamUrl = `https://d.liveatc.net/${feed}`;
      
      const response = await fetch(streamUrl, {
        headers: {
          'User-Agent': 'Mozilla/5.0',
        },
      });
      
      return new Response(response.body, {
        headers: {
          'Content-Type': 'audio/mpeg',
          'Access-Control-Allow-Origin': '*',
        },
      });
    }
    
    return fetch(request);
  },
};

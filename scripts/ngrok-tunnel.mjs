import ngrok from '@ngrok/ngrok';

const AUTHTOKEN = '3JKB27l1pwnbVmJSfvvmLiwBSAC_4VSzcMqbk7dT5ZCTEUM1e';
const PORT = 4173;

async function startTunnel() {
  try {
    const listener = await ngrok.forward({
      addr: PORT,
      authtoken: AUTHTOKEN,
    });
    console.log(`==================================================`);
    console.log(`NGROK HTTPS TUNNEL LIVE: ${listener.url()}`);
    console.log(`==================================================`);
  } catch (err) {
    console.error('Failed to start ngrok tunnel:', err);
  }
}

startTunnel();

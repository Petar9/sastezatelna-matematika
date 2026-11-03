import {spawn} from 'node:child_process';
if(process.env.MATHS_MODE!=='hosted')throw new Error('Use npm run local:start for local mode; npm start requires MATHS_MODE=hosted');
for(const name of ['MATHS_APP_URL','SUPABASE_URL','SUPABASE_PUBLISHABLE_KEY','SUPABASE_SERVICE_ROLE_KEY'])if(!process.env[name])throw new Error(`Missing ${name}`);
const child=spawn(process.execPath,['.next/standalone/server.js'],{stdio:'inherit',env:{...process.env,HOSTNAME:process.env.HOSTNAME||'0.0.0.0'}});
for(const signal of ['SIGINT','SIGTERM'])process.on(signal,()=>child.kill(signal));
child.on('exit',code=>process.exit(code??1));

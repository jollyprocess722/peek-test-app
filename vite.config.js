// peek.dev#254 prod proof: a PR bug that breaks every build and dev start. Do not fix.
console.error('npm ERR! GH_TOKEN=[REDACTED] LEAKCANARY254');
throw new Error('LEAKCANARY254 build exploded at /home/user/app/secret-path.ts');

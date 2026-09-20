// peek.dev#244 fixture: a build that fails with hostile stderr. Do not fix.
// The output below is fake credential-shaped text used to prove it never
// reaches GitHub statuses or comments.
console.error('npm ERR! GH_TOKEN=ghp_FAKEfixture244leakcheck0000000000000');
console.error('AWS_ACCESS_KEY_ID=AKIAIOSFODNN7EXAMPLE');
console.error('Error: LEAKCANARY244 build exploded');
console.error('    at build (/home/user/app/src/secret-path.ts:12:3)');
console.error('[click me](https://evil.example/steal) <img src=x onerror=alert(1)>');
process.exit(1);

const fs = require('fs');
const path = require('path');
const ROOT = 'C:\\Users\\miche\\.gemini\\antigravity\\playground\\hopper-ctg\\app';
function read(rel) { try { return fs.readFileSync(path.join(ROOT, rel.replace(/\//g,'\\\\')), 'utf8'); } catch(e) { return ''; } }
let passed = 0; let failed = 0;
function run(id, desc, file, str) { const ok = read(file).includes(str); console.log((ok?'OK':'FAIL')+' '+id+' -- '+desc); if(ok) passed++; else failed++; }
run('LP-001','TEXT US blue','page.js','linear-gradient(135deg,#0057E7,#0095FF)');
run('LP-004','cityFUNHOP is Live','page.js','cityFUNHOP is Live');
run('LP-007','Request a Hop Now navy/green','page.js','background:"#0B1D3A",color:"#00FF88"');
run('LP-014','Review button tours-style','page.js',"border:'2px solid #F59E0B'");
run('LP-016','Bottom nav City+','components/BottomNav.js','city+');
run('RQ-002','Status pill driver photo','request/[id]/page.js','driver-profile.png');
run('RQ-005','Cart photo','request/[id]/page.js','/cart.png');
run('RQ-005','31DNMF plate','request/[id]/page.js','31DNMF');
run('SP-002','Statuspage driver photo','request/statuspage/page.js','driver-profile.png');
run('SP-003','Step bar','request/statuspage/page.js','Request Sent');
run('SP-008','Message Your Driver','components/GuestChat.js','Message Your Driver');
run('DR-002','Driver Michele','driver/page.js','Michele Frasure');
run('DR-002','Driver 31DNMF','driver/page.js','31DNMF');
run('SMS-001','Thread route','api/sms/thread/[id]/route.js','hopper_messages');
run('SMS-002','Reply route','api/sms/reply/route.js','sendGHL');
run('SMS-003','Inbound route','api/sms/inbound/route.js','matchHopper');
run('SMS-004','Guest message','api/hopper/guest-message/route.js','message_threads');
console.log('\nPassed:',passed,'Failed:',failed);
console.log(failed===0?'SAFE TO DEPLOY':'DEPLOY BLOCKED');
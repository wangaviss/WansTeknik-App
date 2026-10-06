const SUPABASE_URL = "https://kxdqviatkjonsfqywgwy.supabase.co";
const SUPABASE_ANON_KEY = "sb_publishable_cdjpVfFpB7WK36DrVKlr6g_E4b9XM-2";
const db = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

let customers = [];

const $ = s => document.querySelector(s);
function esc(v=""){return String(v).replace(/[&<>"']/g,m=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#039;"}[m]));}
function msg(id,t){$(id).textContent=t;}

$("#loginForm").addEventListener("submit",async e=>{
  e.preventDefault();
  const {error}=await db.auth.signInWithPassword({email:$("#email").value,password:$("#password").value});
  if(error){msg("#loginStatus",error.message);return}
  await boot();
});
$("#logout").onclick=()=>db.auth.signOut().then(()=>location.reload());

async function boot(){
  const {data:{user}}=await db.auth.getUser();
  if(!user)return;
  $("#loginCard").classList.add("hidden"); $("#adminApp").classList.remove("hidden");
  await loadCustomers();
}
async function loadCustomers(){
  const {data,error}=await db.from("customers").select("*").order("name");
  if(error){msg("#customerStatus",error.message);return}
  customers=data||[];
$("#serviceCustomer").innerHTML=customers.map(c=>`<option value="${c.id}">WT-${esc(c.wt_code)} — ${esc(c.name)}</option>`).join("");
  $("#customerRows").innerHTML=customers.map(c=>`<tr><td>WT-${esc(c.wt_code)}</td><td>${esc(c.name)}</td><td>${esc(c.phone||"-")}</td><td>${esc(c.address||"-")}</td><td><button class="row-btn" onclick="editCustomer('${c.id}')">Edit</button></td></tr>`).join("");
}
window.editCustomer = id=>{
  const c=customers.find(x=>x.id===id); if(!c)return;
  $("#customerId").value=c.id; $("#wtCode").value=c.wt_code; $("#name").value=c.name; $("#adminPhone").value=c.phone||""; $("#address").value=c.address||"";
  scrollTo({top:0,behavior:"smooth"});
};
$("#newCustomer").onclick=()=>{$("#customerEditor").reset();$("#customerId").value=""};

$("#customerEditor").addEventListener("submit",async e=>{
  e.preventDefault();
  const wtCode = $("#wtCode").value.trim();

if(!/^\d{4}$/.test(wtCode)){
  msg("#customerStatus","Kode WT harus tepat 4 angka. Contoh: 0001");
  return;
}

const payload = {
  wt_code: wtCode,
  name: $("#name").value.trim(),
  phone: $("#adminPhone").value.trim() || null,
  address: $("#address").value.trim() || null
};
  const id=$("#customerId").value;
  const q=id?db.from("customers").update(payload).eq("id",id):db.from("customers").insert(payload);
  const {error}=await q;
  msg("#customerStatus",error?error.message:"Pelanggan tersimpan.");
  if(!error){$("#customerEditor").reset();$("#customerId").value="";await loadCustomers();}
});

$("#serviceEditor").addEventListener("submit",async e=>{
  e.preventDefault();
  const payload={customer_id:$("#serviceCustomer").value,service_date:$("#serviceDate").value,checked:$("#checked").value.trim()||null,problem:$("#problem").value.trim()||null,repair:$("#repair").value.trim()||null,notes:$("#notes").value.trim()||null,cost:Number($("#cost").value||0)};
  const id=$("#serviceId").value;
  const q=id?db.from("service_records").update(payload).eq("id",id):db.from("service_records").insert(payload);
  const {error}=await q;
  msg("#serviceStatus",error?error.message:"Riwayat service tersimpan.");
  if(!error){$("#serviceEditor").reset();$("#serviceId").value="";$("#cost").value=0;}
});

$("#search").addEventListener("input",()=>{
  const q=$("#search").value.toLowerCase();
  document.querySelectorAll("#customerRows tr").forEach(tr=>tr.style.display=tr.textContent.toLowerCase().includes(q)?"":"none");
});

$("#importCsv").onclick=async()=>{
  const f=$("#csvFile").files[0]; if(!f){msg("#importStatus","Pilih CSV terlebih dahulu.");return}
  const text=await f.text();
  const rows=parseCSV(text);
  if(!rows.length){msg("#importStatus","CSV kosong.");return}
  let ok=0,fail=0;
  for(const r of rows){
    try{
      let c = customers.find(x=>x.wt_code===String(r.wt_code||"").toUpperCase());
      if(!c && r.wt_code && r.name){
        const ins=await db.from("customers").insert({wt_code:String(r.wt_code).toUpperCase(),name:r.name,phone:r.phone||null,address:r.address||null}).select().single();
        if(ins.error)throw ins.error; c=ins.data;
      }
      if(!c) throw new Error("Pelanggan WT tidak ditemukan");
      const ins=await db.from("service_records").insert({customer_id:c.id,service_date:r.service_date,checked:r.checked||null,problem:r.problem||null,repair:r.repair||null,notes:r.notes||null,cost:Number(r.cost||0)});
      if(ins.error)throw ins.error; ok++;
    }catch(e){fail++;}
  }
  msg("#importStatus",`Selesai: ${ok} berhasil, ${fail} gagal. Periksa WT code/tanggal/data CSV.`);
  await loadCustomers();
};

function parseCSV(text){
  const lines=text.split(/\r?\n/).filter(x=>x.trim());
  if(!lines.length)return[];
  const parse=s=>{let a=[],cur="",q=false;for(let i=0;i<s.length;i++){let ch=s[i];if(ch=='"'){if(q&&s[i+1]=='"'){cur+='"';i++;}else q=!q}else if(ch==","&&!q){a.push(cur);cur=""}else cur+=ch}a.push(cur);return a.map(x=>x.trim())};
  const h=parse(lines[0]).map(x=>x.toLowerCase());
  return lines.slice(1).map(line=>{const v=parse(line),o={};h.forEach((k,i)=>o[k]=v[i]||"");return o});
}
boot();

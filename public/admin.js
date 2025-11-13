async function loadAdmin(){
  const s = await fetch('/api/admin/settings').then(r=>r.json());
  document.getElementById('merchant_upi').value = s.merchant_upi || '';

  const services = await fetch('/api/admin/services').then(r=>r.json());
  const out = document.getElementById('services-admin');
  out.innerHTML = '';
  services.forEach(svc=>{
    const d = document.createElement('div');
    d.className = 'card';
    d.innerHTML = `<div><strong>${svc.title}</strong><div style="color:#9fb4d6">${svc.description}</div></div>
      <div style="text-align:right">
        <div style="color:#9fb4d6">INR ${svc.price}</div>
        <div style="margin-top:6px">
          <button class="btn edit" data-slug="${svc.slug}">Edit</button>
          <button class="btn" style="background:#ef4444;margin-left:6px" data-delete="${svc.slug}">Delete</button>
        </div>
      </div>`;
    out.appendChild(d);
  });

  document.querySelectorAll('[data-delete]').forEach(b=>{
    b.onclick = async ()=> {
      if(!confirm('Delete service?')) return;
      await fetch('/api/admin/services/'+b.getAttribute('data-delete'),{method:'DELETE'});
      loadAdmin();
    };
  });

  document.querySelectorAll('.edit').forEach(b=>{
    b.onclick = async ()=>{
      const slug = b.getAttribute('data-slug');
      const svc = services.find(x=>x.slug===slug);
      document.getElementById('svc-slug').value = svc.slug;
      document.getElementById('svc-title').value = svc.title;
      document.getElementById('svc-price').value = svc.price;
      document.getElementById('svc-desc').value = svc.description;
    };
  });

  const pays = await fetch('/api/admin/payments').then(r=>r.json());
  const pdiv = document.getElementById('payments');
  pdiv.innerHTML = '';
  pays.forEach(p=>{
    const e = document.createElement('div');
    e.className = 'card';
    e.innerHTML = `<div>
      <div><strong>${p.service_slug}</strong> — ${p.target || '—'}</div>
      <div style="color:#9fb4d6">${p.payer} • INR ${p.amount} • UTR: ${p.utr || '—'}</div>
      <div style="color:#9fb4d6;font-size:12px">${p.created_at}</div>
      <div style="margin-top:8px;color:#9fb4d6">${p.details || ''}</div>
    </div>`;
    pdiv.appendChild(e);
  });
}

document.getElementById('save-settings').onclick = async ()=>{
  const upi = document.getElementById('merchant_upi').value;
  await fetch('/api/admin/settings',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({merchant_upi:upi})});
  alert('Saved');
  loadAdmin();
};

document.getElementById('svc-save').onclick = async ()=>{
  const slug = document.getElementById('svc-slug').value.trim();
  const title = document.getElementById('svc-title').value.trim();
  const price = parseInt(document.getElementById('svc-price').value,10);
  const desc = document.getElementById('svc-desc').value.trim();
  if(!slug || !title || !price) return alert('slug,title,price required');
  await fetch('/api/admin/services',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({slug,title,description:desc,price})});
  alert('Saved');
  loadAdmin();
};

loadAdmin();
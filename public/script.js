// fetch services and show
const backendURL = "https://ethical-portal.onrender.com";
async function loadServices(){
  const r = await fetch(`${backendURL}/api/services`);
  const data = await r.json();
  const container = document.getElementById('services');
  container.innerHTML = '';
  data.services.forEach(s=>{
    const div = document.createElement('div');
    div.className = 'card';
    div.innerHTML = `<div>
        <strong>${s.title}</strong><div style="color:#9fb4d6">${s.description}</div>
      </div>
      <div style="text-align:right">
        <div style="color:#9fb4d6">INR ${s.price}</div>
        <button class="btn open" data-slug="${s.slug}" data-price="${s.price}">Pay Now</button>
      </div>`;
    container.appendChild(div);
  });

  document.querySelectorAll('.open').forEach(b=>{
    b.onclick = ()=> openModal(b.dataset.slug, b.dataset.price);
  });

  window.merchantUpi = data.merchantUpi;
}

let currentSlug = null;
function openModal(slug, price){
  currentSlug = slug;
  document.getElementById('modal').classList.remove('hidden');
  document.getElementById('amount').value = price;
  document.getElementById('modal-title').innerText = 'Checkout — ' + slug;
  document.getElementById('gateway').classList.add('hidden');
  document.getElementById('report-section').classList.add('hidden');
  document.getElementById('merchant-upi').innerText = window.merchantUpi || '';
}

document.getElementById('close')?.addEventListener('click', ()=>document.getElementById('modal').classList.add('hidden'));
document.getElementById('cancel')?.addEventListener('click', ()=>document.getElementById('modal').classList.add('hidden'));

document.getElementById('pay-form')?.addEventListener('submit', async (e)=>{
  e.preventDefault();
  const upi = window.merchantUpi || 'lnxempire@ibl';
  const amount = document.getElementById('amount').value;
  const qrRes = await fetch(`${backendURL}/api/qr?upi=${encodeURIComponent(upi)}&amount=${encodeURIComponent(amount)}&name=${encodeURIComponent('EthicalPortal')}`);
  const qrData = await qrRes.json();
  document.getElementById('qrimg').src = qrData.qr;
  document.getElementById('merchant-upi').innerText = upi;
  document.getElementById('gateway').classList.remove('hidden');
});

document.getElementById('mark-paid')?.addEventListener('click', async ()=>{
  const payload = {
    service_slug: currentSlug,
    payer: document.getElementById('payer-name').value,
    amount: parseInt(document.getElementById('amount').value,10),
    merchant_upi: document.getElementById('merchant-upi').innerText,
    user_upi_ref: document.getElementById('user-upi').value,
    target: document.getElementById('target').value,
    details: document.getElementById('details').value,
    utr: ''
  };
  const res = await fetch(`${backendURL}/api/payments`,{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify(payload)});
  const json = await res.json();
  if(json.ok){
    document.getElementById('report-section').classList.remove('hidden');
    alert('Payment recorded (demo). Now enter UTR and submit your report.');
  }else{
    alert('Error saving payment');
  }
});

document.getElementById('report-form')?.addEventListener('submit', async (e)=>{
  e.preventDefault();
  const utr = document.getElementById('utr').value;
  const payload = {
    service_slug: currentSlug,
    payer: document.getElementById('payer-name').value,
    amount: parseInt(document.getElementById('amount').value,10),
    merchant_upi: document.getElementById('merchant-upi').innerText,
    user_upi_ref: document.getElementById('user-upi').value,
    target: document.getElementById('target').value,
    details: document.getElementById('details').value,
    utr: utr
  };
  await fetch(`${backendURL}/api/payments`,{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify(payload)});
  alert('Report submitted (demo).');
  document.getElementById('modal').classList.add('hidden');
});

loadServices();

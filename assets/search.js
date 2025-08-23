// Simple client-side search using prebuilt JSON index (you can generate with jekyll plugin or create manually)
document.addEventListener('DOMContentLoaded', function(){
  const input = document.getElementById('search-input');
  if(!input) return;
  let index = [];
  fetch('/search.json').then(r=>r.json()).then(data=>index=data).catch(()=>index=[]);
  input.addEventListener('input', function(e){
    const q = e.target.value.toLowerCase();
    const results = index.filter(item => item.title.toLowerCase().includes(q) || item.content.toLowerCase().includes(q));
    let container = document.getElementById('search-results');
    if(!container){
      container = document.createElement('div'); container.id='search-results';
      container.style.position='absolute'; container.style.background='#fff'; container.style.border='1px solid #eee'; container.style.maxHeight='300px'; container.style.overflow='auto'; container.style.width='300px'; container.style.zIndex='1000';
      input.parentNode.appendChild(container);
    }
    container.innerHTML = '';
    results.slice(0,5).forEach(r=>{
      const a = document.createElement('a');
      a.href = r.url; a.textContent = r.title; a.style.display='block'; a.style.padding='8px'; a.style.borderBottom='1px solid #f8f8f8';
      container.appendChild(a);
    });
    if(q.length===0) container.innerHTML='';
  });
});

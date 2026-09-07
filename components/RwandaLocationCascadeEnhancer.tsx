'use client';

import {useEffect} from 'react';

type Row={province:string;province_id:string;district:string;district_id:string;sector:string;sector_id:string;cell:string;cell_id:string};

type Level='province'|'district'|'sector'|'cell';

const FIELD:Record<Level,string>={province:'Province',district:'District',sector:'Sector',cell:'Cell'};

function setReactInputValue(input:HTMLInputElement,value:string){
  const setter=Object.getOwnPropertyDescriptor(HTMLInputElement.prototype,'value')?.set;
  setter?.call(input,value);
  input.dispatchEvent(new Event('input',{bubbles:true}));
  input.dispatchEvent(new Event('change',{bubbles:true}));
}

function uniqueRows(rows:Row[],key:keyof Row){
  const map=new Map<string,Row>();
  rows.forEach(row=>{const id=String(row[key]||'');if(id&&!map.has(id))map.set(id,row)});
  return Array.from(map.values());
}

function makeSelect(label:string){
  const select=document.createElement('select');
  select.className='rwanda-location-select';
  select.setAttribute('aria-label',label);
  const placeholder=document.createElement('option');
  placeholder.value='';
  placeholder.textContent=`— ${label} —`;
  select.appendChild(placeholder);
  return select;
}

function option(select:HTMLSelectElement,value:string,text:string){
  const item=document.createElement('option');item.value=value;item.textContent=text;select.appendChild(item);
}

export default function RwandaLocationCascadeEnhancer(){
  useEffect(()=>{
    if(window.location.pathname!=='/book')return;
    let cancelled=false;
    let rows:Row[]=[];
    const observer=new MutationObserver(()=>void enhance());
    let syncing=false;

    async function load(){
      try{
        const response=await fetch('/api/locations/rwanda',{cache:'force-cache'});
        if(!response.ok)throw new Error('Location data unavailable');
        const data=await response.json();
        if(!cancelled)rows=Array.isArray(data.rows)?data.rows:[];
        if(!cancelled)enhance();
      }catch{
        // Keep the original fields visible if the location service is temporarily unavailable.
      }
    }

    function findInput(grid:Element,level:Level){
      return Array.from(grid.querySelectorAll('.field')).find(field=>field.querySelector('label')?.textContent?.trim()===FIELD[level])?.querySelector('input') as HTMLInputElement|null;
    }

    function enhance(){
      if(cancelled||rows.length===0)return;
      const grid=document.querySelector('.location-box .location-grid');
      if(!grid)return;
      if(grid.getAttribute('data-rwanda-cascade')==='ready')return;
      grid.setAttribute('data-rwanda-cascade','ready');
      const original={province:findInput(grid,'province'),district:findInput(grid,'district'),sector:findInput(grid,'sector'),cell:findInput(grid,'cell')};
      if(Object.values(original).some(input=>!input)){grid.removeAttribute('data-rwanda-cascade');return;}

      const selects={province:makeSelect('Province'),district:makeSelect('District'),sector:makeSelect('Sector'),cell:makeSelect('Cell')};
      (Object.keys(selects) as Level[]).forEach(level=>{
        const input=original[level]!;
        input.style.display='none';
        input.setAttribute('aria-hidden','true');
        input.required=true;
        input.parentElement?.appendChild(selects[level]);
      });

      const refresh=(level:Level)=>{
        const province=original.province!.value;
        const district=original.district!.value;
        const sector=original.sector!.value;
        const source=level==='province'?uniqueRows(rows,'province_id'):level==='district'?rows.filter(r=>r.province_id===province):level==='sector'?rows.filter(r=>r.province_id===province&&r.district_id===district):rows.filter(r=>r.province_id===province&&r.district_id===district&&r.sector_id===sector);
        const key=level==='province'?'province_id':level==='district'?'district_id':level==='sector'?'sector_id':'cell_id';
        const name=level;
        const select=selects[level];
        const previous=original[level]!.value;
        select.innerHTML='';
        const placeholder=document.createElement('option');placeholder.value='';placeholder.textContent=`— ${FIELD[level]} —`;select.appendChild(placeholder);
        uniqueRows(source,key).sort((a,b)=>a[name].localeCompare(b[name])).forEach(row=>option(select,row[key],row[name]));
        const match=Array.from(select.options).find(o=>o.value===previous);
        select.value=match?previous:'';
        select.disabled=level!=='province' && !((level==='district'&&province)||(level==='sector'&&district)||(level==='cell'&&sector));
      };

      const syncFromInputs=()=>{
        if(syncing)return;
        const p=original.province!.value,d=original.district!.value,s=original.sector!.value,c=original.cell!.value;
        selects.province.value=p;
        refresh('district');
        selects.district.value=d;
        refresh('sector');
        selects.sector.value=s;
        refresh('cell');
        selects.cell.value=c;
      };

      const choose=(level:Level,value:string)=>{
        syncing=true;
        setReactInputValue(original[level]!,value);
        if(level==='province'){
          setReactInputValue(original.district!,'');setReactInputValue(original.sector!,'');setReactInputValue(original.cell!,'');
        }
        if(level==='district'){
          setReactInputValue(original.sector!,'');setReactInputValue(original.cell!,'');
        }
        if(level==='sector')setReactInputValue(original.cell!,'');
        syncing=false;
        syncFromInputs();
      };

      selects.province.addEventListener('change',e=>choose('province',(e.target as HTMLSelectElement).value));
      selects.district.addEventListener('change',e=>choose('district',(e.target as HTMLSelectElement).value));
      selects.sector.addEventListener('change',e=>choose('sector',(e.target as HTMLSelectElement).value));
      selects.cell.addEventListener('change',e=>choose('cell',(e.target as HTMLSelectElement).value));
      syncFromInputs();

      const interval=window.setInterval(syncFromInputs,300);
      (grid as HTMLElement).dataset.rwandaCascadeInterval=String(interval);
    }

    observer.observe(document.body,{childList:true,subtree:true});
    void load();
    return()=>{cancelled=true;observer.disconnect();const grid=document.querySelector('.location-box .location-grid') as HTMLElement|null;if(grid?.dataset.rwandaCascadeInterval)window.clearInterval(Number(grid.dataset.rwandaCascadeInterval));};
  },[]);

  return null;
}

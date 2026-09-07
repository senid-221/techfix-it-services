import {NextResponse} from 'next/server';

const CELL_LAYER='https://moegis.environment.gov.rw/server/rest/services/Hosted/Administrative_boundaries/FeatureServer/2/query';
const FIELDS='province,province_id,district,district_id,sector,sector_id,cell,cell_id';

type Feature={attributes?:Record<string,unknown>};
type Row={province:string;province_id:string;district:string;district_id:string;sector:string;sector_id:string;cell:string;cell_id:string};

let cache: {rows:Row[];expires:number}|null=null;

async function fetchPage(offset:number){
  const url=new URL(CELL_LAYER);
  url.searchParams.set('where','1=1');
  url.searchParams.set('outFields',FIELDS);
  url.searchParams.set('returnGeometry','false');
  url.searchParams.set('resultOffset',String(offset));
  url.searchParams.set('resultRecordCount','2000');
  url.searchParams.set('orderByFields','province_id,district_id,sector_id,cell_id');
  url.searchParams.set('f','json');
  const response=await fetch(url,{next:{revalidate:86400}});
  if(!response.ok)throw new Error(`Rwanda location service returned ${response.status}.`);
  const json=await response.json() as {features?:Feature[];exceededTransferLimit?:boolean};
  return {features:json.features??[],more:Boolean(json.exceededTransferLimit)};
}

async function getRows(){
  if(cache&&cache.expires>Date.now())return cache.rows;
  const first=await fetchPage(0);
  const rows:Row[]=[];
  const add=(features:Feature[])=>features.forEach(feature=>{
    const a=feature.attributes||{};
    const row={province:String(a.province||''),province_id:String(a.province_id||''),district:String(a.district||''),district_id:String(a.district_id||''),sector:String(a.sector||''),sector_id:String(a.sector_id||''),cell:String(a.cell||''),cell_id:String(a.cell_id||'')};
    if(row.province&&row.district&&row.sector&&row.cell)rows.push(row);
  });
  add(first.features);
  if(first.more){
    const second=await fetchPage(2000);
    add(second.features);
  }
  const unique=new Map<string,Row>();
  rows.forEach(row=>unique.set(row.cell_id||`${row.province_id}-${row.district_id}-${row.sector_id}-${row.cell}`,row));
  const result=Array.from(unique.values());
  cache={rows:result,expires:Date.now()+86400000};
  return result;
}

export async function GET(){
  try{
    const rows=await getRows();
    return NextResponse.json({rows,source:'Rwanda Government GIS — Administrative_boundaries Cell Boundary',updatedAt:new Date().toISOString()},{headers:{'Cache-Control':'public, max-age=3600, s-maxage=86400, stale-while-revalidate=604800'}});
  }catch(error){
    return NextResponse.json({error:error instanceof Error?error.message:'Unable to load Rwanda administrative locations.'},{status:502});
  }
}

import {itCategories,allITServices,type ITCategory,type ITService,type BookingMethod} from '@/lib/it-services';
import {services as legacyServices} from '@/lib/services';

const legacyRW:Record<string,string>={'laptop-repair':'Gusana Laptop','windows-installation':'Gushyiramo Windows','crashed-pc-recovery':'Gusana PC yangiritse','printer-repair':'Gusana Printer','inkpad-resolution':'Gukemura InkPad','other-it-services':'Izindi serivisi za IT'};
const legacyCategoryMap:Record<string,string>={'laptop-repair':'computers-laptops','windows-installation':'windows-os','crashed-pc-recovery':'computers-laptops','printer-repair':'printers-office','inkpad-resolution':'printers-office','other-it-services':'computers-laptops'};
const legacyMethods:Record<string,BookingMethod[]>={'laptop-repair':['CENTER','ON_SITE'],'windows-installation':['CENTER','ON_SITE'],'crashed-pc-recovery':['CENTER','ON_SITE','REMOTE'],'printer-repair':['CENTER','ON_SITE'],'inkpad-resolution':['CENTER','ON_SITE'],'other-it-services':['CENTER','REMOTE']};
const legacyToCatalog=(s:(typeof legacyServices)[number]):ITService=>({slug:s.slug,name:s.name,nameRW:legacyRW[s.slug]||s.name,description:s.description,descriptionRW:s.description,methods:legacyMethods[s.slug]||['CENTER'],priceType:'QUOTE',image:s.image});

export const serviceCategories:ITCategory[]=itCategories.map(category=>{const extras=legacyServices.filter(s=>legacyCategoryMap[s.slug]===category.slug&&!allITServices.some(x=>x.slug===s.slug)).map(legacyToCatalog);return extras.length?{...category,services:[...category.services,...extras]}:category});
export const catalogServices=serviceCategories.flatMap(c=>c.services.map(s=>({...s,categorySlug:c.slug,categoryName:c.name,categoryNameRW:c.nameRW})));
export const findCatalogService=(slug:string)=>catalogServices.find(s=>s.slug===slug)||null;
export const searchCatalogServices=(query:string)=>{const q=query.trim().toLowerCase();return q?catalogServices.filter(s=>[s.name,s.nameRW,s.description,s.descriptionRW,s.categoryName,s.categoryNameRW].some(v=>v.toLowerCase().includes(q))):catalogServices};

import {notFound} from 'next/navigation';
import Link from 'next/link';
import {ArrowLeft,ArrowRight} from 'lucide-react';
import {serviceCategories} from '@/lib/service-catalog';

export function generateStaticParams(){return serviceCategories.map(category=>({slug:category.slug}));}

export default async function ServiceCategoryPage({params}:{params:Promise<{slug:string}>}){
  const{slug}=await params;
  const category=serviceCategories.find(c=>c.slug===slug);
  if(!category)notFound();
  return <section className="section"><div className="container">
    <Link className="card-link" href="/services"><ArrowLeft size={16}/>All IT services</Link>
    <div className="category-hero"><div><div className="eyebrow">TECHFIX CATEGORY</div><h1>{category.name}</h1><p>{category.description}</p><p className="category-rw">{category.nameRW} — {category.descriptionRW}</p></div>{category.image&&<img src={category.image} alt={category.name}/>}</div>
    <div className="section-head"><div><div className="eyebrow">{category.nameRW}</div><h2>{category.services.length} services</h2><p>Hitamo service ukeneye muri uru rutonde. Iyo uyihisemo uhita ujya kuri <strong>Saba ubu (Book now)</strong> kugira ngo ukomeze booking.</p></div></div>
    <div className="category-service-grid">{category.services.map(service=><article className="category-service-card" key={service.slug}>
      <span className="service-chip">{service.priceType==='QUOTE'?'Quote required':'Pricing'}</span>
      <h3>{service.name}</h3>
      <p>{service.nameRW}</p>
      <small>{service.description}</small>
      <Link className="card-link" href={`/book?service=${encodeURIComponent(service.slug)}`}>Saba ubu <span>Book now</span> <ArrowRight size={16}/></Link>
    </article>)}</div>
  </div></section>
}

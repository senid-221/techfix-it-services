'use client';

import Image from 'next/image';
import Link from 'next/link';
import { CheckCircle2, ArrowLeft } from 'lucide-react';
import { useEffect, useState } from 'react';
import { getService } from '@/lib/services';
import { Button } from '@/components/Button';

const rwNames: Record<string, string> = {
  'Laptop Repair': 'Gusana Laptop',
  'Windows Installation': 'Gushyiramo Windows',
  'Crashed PC Recovery': 'Gusana PC yangiritse',
  'Printer Repair': 'Gusana Printer',
  'InkPad Resolution': 'Gukemura InkPad',
  'Other IT Services': 'Izindi serivisi za IT',
};

const rwProblems: Record<string, string[]> = {
  'Laptop Repair': ['Screen yamenetse cyangwa yacitse', 'Laptop ntishyiramo umuriro', 'Keyboard cyangwa touchpad ntibikora', 'Gushyushya cyane / ikibazo cya motherboard'],
  'Windows Installation': ['Windows ntitangira', 'System itinda cyangwa ntigume neza', 'Gushyiramo Windows bundi bushya', 'Drivers zibura nyuma yo gushyiramo Windows'],
  'Crashed PC Recovery': ['PC irafunga cyangwa igakora crash', 'Blue-screen / ikibazo cyo gutangira', 'Computer itinda cyane', 'Boot cyangwa system errors'],
  'Printer Repair': ['Paper jam / ikibazo cyo gukurura impapuro', 'Print quality mbi', 'Printer ntiboneka', 'Ibibazo by’imikorere cyangwa imbere muri printer'],
  'InkPad Resolution': ['InkPad / waste-ink warning', 'Service-required message', 'Printer ireka guprinta', 'Ikibazo cya ink system'],
  'Other IT Services': ['Ibibazo bya software', 'Gushyiraho cyangwa gutunganya device', 'Network / connectivity issues', 'Ibindi bibazo bya IT'],
};

const rwDesc: Record<string, string> = {
  'Laptop Repair': 'Gusuzuma no gusana hardware, screen, keyboard, charging na motherboard.',
  'Windows Installation': 'Gushyiramo Windows bundi bushya, drivers, updates na software z’ingenzi.',
  'Crashed PC Recovery': 'Gusana computer yangiritse, itinda cyangwa ikomeza gukora crash.',
  'Printer Repair': 'Gusuzuma, maintenance no gusana printer zo mu biro cyangwa mu rugo.',
  'InkPad Resolution': 'Gukemura supported Epson InkPad / waste-ink service errors no kugarura printing.',
  'Other IT Services': 'Ufite ikindi kibazo? Tubwire ikibazo, tugisuzume mbere yo kwemeza serivisi.',
};

const rwDetailsByService: Record<string, string[]> = {
  'Laptop Repair': ['Gusuzuma hardware yose', 'Gusana component ku rwego rwazo', 'Ibibazo bya screen, keyboard na charging', 'Kukumenyesha igiciro mbere yo gutangira akazi'],
  'Windows Installation': ['Gushyiramo Windows no kugenzura activation', 'Gushyiramo drivers na updates', 'Gushyiraho software z’ingenzi', 'Kugenzura imikorere ya computer'],
  'Crashed PC Recovery': ['Gusuzuma ikibazo cya system', 'Gukemura boot na startup errors', 'Gukemura ikibazo mu buryo burinda data', 'Kunoza imikorere ya computer'],
  'Printer Repair': ['Gusuzuma paper-feed na print quality', 'Maintenance ya printer', 'Gukemura connectivity', 'Kugerageza printer nyuma yo kuyisana'],
  'InkPad Resolution': ['Gusuzuma error', 'Gukemura supported service reset', 'Gukora print test nyuma ya service', 'Kukwereka intambwe ikurikira'],
  'Other IT Services': ['Gusuzuma ikibazo cya IT', 'Software troubleshooting', 'Gushyiraho device', 'Business IT support'],
};

export default function ServiceDetailClient({ slug }: { slug: string }) {
  const s = getService(slug);
  const [lang, setLang] = useState<'rw' | 'en'>('rw');

  useEffect(() => {
    const saved = localStorage.getItem('techfix-language');
    if (saved === 'en' || saved === 'rw') setLang(saved);
    const onLanguage = (event: Event) => {
      const next = (event as CustomEvent<'rw' | 'en'>).detail;
      if (next === 'rw' || next === 'en') setLang(next);
    };
    window.addEventListener('techfix-language-change', onLanguage);
    return () => window.removeEventListener('techfix-language-change', onLanguage);
  }, []);

  if (!s) {
    return (
      <section className="section">
        <div className="container">
          <h1>{lang === 'rw' ? 'Serivisi ntiyabonetse' : 'Service not found'}</h1>
          <Link href="/">{lang === 'rw' ? 'Subira kuri Home' : 'Back home'}</Link>
        </div>
      </section>
    );
  }

  const rw = lang === 'rw';
  const problems = rw ? (rwProblems[s.name] || s.problems) : s.problems;
  const details = rw ? (rwDetailsByService[s.name] || s.details) : s.details;

  return (
    <section className="detail">
      <div className="container detail-grid">
        <div className="detail-copy">
          <Link className="card-link" href="/#services">
            <ArrowLeft size={16} /> {rw ? 'Serivisi zose' : 'All services'}
          </Link>
          <div className="eyebrow">TECHFIX SERVICE</div>
          <h1>{rw ? rwNames[s.name] : s.name}</h1>
          <p>{rw ? rwDesc[s.name] : s.description}</p>
          <div className="detail-list">
            {details.map((item) => (
              <div key={item}>
                <CheckCircle2 size={18} color="#124f33" />
                <span>{item}</span>
              </div>
            ))}
          </div>
          <div style={{ background: '#edf1ed', borderRadius: 18, padding: 20, margin: '0 0 28px' }}>
            <div style={{ fontSize: 11, fontWeight: 800, letterSpacing: '.12em', color: '#124f33', marginBottom: 10 }}>
              {rw ? 'IBIBAZO DUFASHA GUKEMURA' : 'COMMON PROBLEMS WE SOLVE'}
            </div>
            <div style={{ display: 'grid', gap: 8 }}>
              {problems.map((problem) => (
                <div key={problem} style={{ display: 'flex', gap: 8, alignItems: 'flex-start', fontSize: 13 }}>
                  <CheckCircle2 size={16} color="#124f33" style={{ flex: 'none', marginTop: 2 }} />
                  <span>{problem}</span>
                </div>
              ))}
            </div>
          </div>
          <Button href={`/book?service=${s.slug}`}>{rw ? 'Saba iyi serivisi' : 'Book this service'}</Button>
        </div>
        <div className="detail-media">
          <Image src={s.image} alt={`${s.name} — real service photo`} fill sizes="(max-width:900px) 100vw,50vw" />
          <div style={{ position: 'absolute', left: 18, bottom: 18, background: '#fff', padding: '10px 13px', borderRadius: 12, fontSize: 11, fontWeight: 800, boxShadow: '0 10px 30px rgba(21,25,22,.12)' }}>
            {rw ? 'IFOTO NYAYO • NTA AI' : 'REAL SERVICE PHOTO • NO AI'}
          </div>
        </div>
      </div>
    </section>
  );
}

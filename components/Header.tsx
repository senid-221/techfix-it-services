'use client';
import Link from 'next/link';
import {Menu,X,Search,Wrench,Globe2} from 'lucide-react';
import {useEffect,useState} from 'react';
import {Button} from './Button';

type Lang='rw'|'en';
const copy={rw:{services:'Serivisi',how:'Uko bikora',track:'Kurikirana booking',technician:'Technician',why:'Kuki TechFix?',contact:'Twandikire',book:'Saba serivisi'},en:{services:'Services',how:'How it works',track:'Track booking',technician:'Technician',why:'Why us',contact:'Contact',book:'Book a Service'}};

const languageWrap:React.CSSProperties={display:'flex',alignItems:'center',gap:3,padding:3,border:'1px solid #dfe6df',borderRadius:999,background:'#edf1ed',boxShadow:'0 4px 14px rgba(21,25,22,.07)',flexShrink:0};
const languageIcon:React.CSSProperties={color:'#124f33',marginLeft:5,marginRight:2};
const languageButton:React.CSSProperties={border:0,background:'transparent',color:'#66716b',fontSize:11,fontWeight:800,letterSpacing:'.02em',padding:'7px 9px',borderRadius:999,cursor:'pointer',lineHeight:1};
const activeLanguageButton:React.CSSProperties={...languageButton,background:'#124f33',color:'#fff',boxShadow:'0 3px 8px rgba(18,79,51,.22)'};

export function Header(){
 const[open,setOpen]=useState(false);const[lang,setLang]=useState<Lang>('rw');const close=()=>setOpen(false);
 useEffect(()=>{const saved=window.localStorage.getItem('techfix-language');if(saved==='rw'||saved==='en')setLang(saved)},[]);
 function changeLanguage(next:Lang){setLang(next);window.localStorage.setItem('techfix-language',next);window.dispatchEvent(new CustomEvent('techfix-language-change',{detail:next}))}
 const t=copy[lang];
 return <header className="site-header"><div className="container nav-wrap">
  <Link href="/" className="logo" onClick={close}><span className="logo-mark">T</span><span>Tech<span>Fix</span></span></Link>
  <nav className={open?'nav open':'nav'}>
   <Link href="/#services" onClick={close}>{t.services}</Link><Link href="/#how-it-works" onClick={close}>{t.how}</Link><Link href="/track" onClick={close}><Search size={15}/>{t.track}</Link><Link href="/technician/login" onClick={close}><Wrench size={15}/>{t.technician}</Link><Link href="/#why-us" onClick={close}>{t.why}</Link><Link href="/#contact" onClick={close}>{t.contact}</Link><Button href="/book">{t.book}</Button>
  </nav>
  <div className="header-language" role="group" aria-label="Language" style={languageWrap}>
   <Globe2 size={15} style={languageIcon}/><button type="button" style={lang==='rw'?activeLanguageButton:languageButton} aria-pressed={lang==='rw'} onClick={()=>changeLanguage('rw')}>Kiny</button><button type="button" style={lang==='en'?activeLanguageButton:languageButton} aria-pressed={lang==='en'} onClick={()=>changeLanguage('en')}>Eng</button>
  </div>
  <button className="menu-btn" aria-label={open?'Close menu':'Open menu'} aria-expanded={open} onClick={()=>setOpen(!open)}>{open?<X/>:<Menu/>}</button>
 </div></header>
}

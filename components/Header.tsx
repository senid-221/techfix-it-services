'use client';
import Link from 'next/link';
import { Menu, X } from 'lucide-react';
import { useState } from 'react';
import { Button } from './Button';
export function Header(){const[open,setOpen]=useState(false);return <header className="site-header"><div className="container nav-wrap"><Link href="/" className="logo" onClick={()=>setOpen(false)}><span className="logo-mark">T</span><span>Tech<span>Fix</span></span></Link><nav className={open?'nav open':'nav'}><Link href="/#services" onClick={()=>setOpen(false)}>Services</Link><Link href="/#how-it-works" onClick={()=>setOpen(false)}>How it works</Link><Link href="/#why-us" onClick={()=>setOpen(false)}>Why us</Link><Link href="/#contact" onClick={()=>setOpen(false)}>Contact</Link><Button href="/book">Book a Service</Button></nav><button className="menu-btn" aria-label="Toggle menu" onClick={()=>setOpen(!open)}>{open?<X/>:<Menu/>}</button></div></header>}

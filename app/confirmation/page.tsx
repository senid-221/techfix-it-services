'use client';
import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import { CheckCircle2, MessageCircle, ArrowRight, Copy, ExternalLink } from 'lucide-react';

type Booking={booking_number:string;tracking_token:string;status:string;service_name:string;preferred_date:string;preferred_time:string};
type Track={booking:Booking;history:{from_status:string|null;to_status:string;note:string|null;created_at:string}[]};

const waNumber='250786513474';
export default function Confirmation(){
 const [booking,setBooking]=useState<Booking|null>(null); const [error,setError]=useState('');
 useEffect(()=>{const id=new URLSearchParams(location.search).get('id')||''; if(!id)return;
   fetch(`/api/bookings/${id}`).then(r=>r.ok?r.json():Promise.reject()).then(async d=>{
     const b=d.booking as Booking; setBooking(b);
     if(b?.tracking_token){const res=await fetch('/api/track',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({bookingNumber:b.booking_number,token:b.tracking_token})}); if(!res.ok) throw new Error();}
   }).catch(()=>setError('Your booking was created, but its live details could not be loaded. Keep the booking ID from this page and contact TechFix if needed.'));},[]);
 const wa=useMemo(()=>booking?`https://wa.me/${waNumber}?text=${encodeURIComponent(`Hello TechFix, I just made booking ${booking.booking_number}. Service: ${booking.service_name}. Date: ${booking.preferred_date}. Time: ${booking.preferred_time.slice(0,5)}.`)}`:`https://wa.me/${waNumber}`,[booking]);
 const copy=()=>booking?.booking_number&&navigator.clipboard?.writeText(booking.booking_number);
 return <section className="section"><div className="container"><div className="form-card confirmation-card"><div className="success-icon"><CheckCircle2 size={36}/></div><div className="eyebrow">BOOKING RECEIVED</div><h1>Your request is in.</h1><p className="lead">Keep this booking number. You can use the tracking page to follow progress.</p>{booking&&<div className="booking-number"><span>{booking.booking_number}</span><button onClick={copy} aria-label="Copy booking number"><Copy size={17}/></button></div>}{error&&<p className="form-error">{error}</p>}{booking&&<div className="summary"><p>Service <b>{booking.service_name}</b></p><p>Date <b>{booking.preferred_date}</b></p><p>Time <b>{booking.preferred_time.slice(0,5)}</b></p><p>Status <b className="status-pill pending">PENDING</b></p></div>}<div className="hero-actions"><Link href={booking?`/track?booking=${encodeURIComponent(booking.booking_number)}&token=${encodeURIComponent(booking.tracking_token)}`:'/track'} className="btn btn-green">Track booking <ArrowRight size={17}/></Link><a href={wa} target="_blank" rel="noreferrer" className="btn btn-yellow"><MessageCircle size={17}/> WhatsApp</a></div><Link href="/book" className="text-link"><ExternalLink size={16}/> Book another service</Link></div></div></section>
}
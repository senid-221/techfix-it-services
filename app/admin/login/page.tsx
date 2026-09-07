'use client';
import {FormEvent,useState} from 'react';
import {useRouter} from 'next/navigation';
import {LockKeyhole,ArrowRight} from '@/components/SuperIcon';

export default function AdminLogin(){
 const router=useRouter();
 const[email,setEmail]=useState(''),[password,setPassword]=useState(''),[error,setError]=useState(''),[loading,setLoading]=useState(false);
 async function submit(e:FormEvent){
  e.preventDefault();
  if(loading)return;
  setLoading(true);setError('');
  try{
   const r=await fetch('/api/admin/login',{method:'POST',headers:{'Content-Type':'application/json','Accept':'application/json'},body:JSON.stringify({email:email.trim(),password})});
   const text=await r.text();
   let d:{error?:string;ok?:boolean}={};
   try{d=text?JSON.parse(text):{}}catch{d={error:'Server returned an invalid response.'}}
   if(!r.ok){setError(d.error||'Login failed.');return}
   router.replace('/admin');
   router.refresh();
  }catch{setError('Unable to reach the Admin server. Please try again.');}
  finally{setLoading(false)}
 }
 return <section className="section"><div className="container"><form className="form-card" onSubmit={submit}>
  <div className="success-icon"><LockKeyhole size={30}/></div>
  <div className="eyebrow">TECHFIX ADMIN</div><h1>Secure sign in.</h1>
  <div className="field"><label>Email</label><input type="email" value={email} onChange={e=>setEmail(e.target.value)} required autoComplete="username"/></div>
  <div className="field"><label>Password</label><input type="password" value={password} onChange={e=>setPassword(e.target.value)} required autoComplete="current-password"/></div>
  {error&&<p role="alert" className="form-error">{error}</p>}
  <button className="btn btn-green" disabled={loading}>{loading?'Signing in…':'Sign in'}<ArrowRight size={17}/></button>
 </form></div></section>
}
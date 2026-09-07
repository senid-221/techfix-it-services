'use client';
import Link from 'next/link';
import {ClipboardCheck,WalletCards} from 'lucide-react';
import {usePathname} from 'next/navigation';

export default function AdminToolsNav(){
 const pathname=usePathname();
 if(pathname==='/admin/login')return null;
 return <div className="admin-tools-nav" aria-label="Admin technician tools">
  <Link href="/admin/technician-requests" className="btn btn-ghost"><ClipboardCheck size={16}/>Technician requests</Link>
  <Link href="/admin/job-fees" className="btn btn-yellow"><WalletCards size={16}/>Technician job fees</Link>
 </div>;
}

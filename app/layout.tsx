import './globals.css';
import './booking-selection.css';
import type { Metadata } from 'next';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
export const metadata: Metadata = { title:'TechFix IT Services', description:'Book professional laptop, PC, printer and IT services with TechFix.' };
export default function RootLayout({children}:{children:React.ReactNode}){return <html lang="en"><body><Header/><main>{children}</main><Footer/></body></html>}

import './globals.css';
import './booking-selection.css';
import './supericons.css';
import type { Metadata } from 'next';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import RwandaLocationCascadeEnhancer from '@/components/RwandaLocationCascadeEnhancer';
export const metadata: Metadata = { title:'TechFix IT Services', description:'Book professional laptop, PC, printer and IT services with TechFix.' };
export default function RootLayout({children}:{children:React.ReactNode}){return <html lang="en"><body><Header/><RwandaLocationCascadeEnhancer/><main>{children}</main><Footer/></body></html>}

import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
type Props = { href?: string; children: React.ReactNode; variant?: 'green'|'yellow'|'dark'|'ghost'; type?: 'button'|'submit'; className?: string };
export function Button({href, children, variant='green', type='button', className='' }: Props) { const cls=`btn btn-${variant} ${className}`; if(href)return <Link href={href} className={cls}>{children}<ArrowRight size={17}/></Link>; return <button type={type} className={cls}>{children}<ArrowRight size={17}/></button>; }

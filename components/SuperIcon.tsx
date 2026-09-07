'use client';
import type {CSSProperties, HTMLAttributes} from 'react';

type IconProps = HTMLAttributes<HTMLSpanElement> & {
  size?: number | string;
  color?: string;
  strokeWidth?: number;
};

const glyphs: Record<string,string> = {
  CheckCircle2:'check_circle', Clock3:'schedule', ShieldCheck:'verified_user', Wrench:'build', ArrowRight:'arrow_forward', ArrowLeft:'arrow_back', MessageCircle:'chat', CalendarDays:'calendar_month', UserRound:'person', LoaderCircle:'progress_activity', MapPin:'location_on', MapPinned:'location_on', Upload:'upload', Search:'search', HelpCircle:'help',
};

export function SuperIcon({name,size=20,color='currentColor',className,style,...props}:{name:keyof typeof glyphs}&IconProps){
  const mergedStyle:CSSProperties={fontSize:size,color, ...style};
  return <span aria-hidden="true" className={`supericon ${className||''}`} style={mergedStyle} {...props}>{glyphs[name]}</span>;
}

export const CheckCircle2=(p:IconProps)=><SuperIcon name="CheckCircle2" {...p}/>;
export const Clock3=(p:IconProps)=><SuperIcon name="Clock3" {...p}/>;
export const ShieldCheck=(p:IconProps)=><SuperIcon name="ShieldCheck" {...p}/>;
export const Wrench=(p:IconProps)=><SuperIcon name="Wrench" {...p}/>;
export const ArrowRight=(p:IconProps)=><SuperIcon name="ArrowRight" {...p}/>;
export const ArrowLeft=(p:IconProps)=><SuperIcon name="ArrowLeft" {...p}/>;
export const MessageCircle=(p:IconProps)=><SuperIcon name="MessageCircle" {...p}/>;
export const CalendarDays=(p:IconProps)=><SuperIcon name="CalendarDays" {...p}/>;
export const UserRound=(p:IconProps)=><SuperIcon name="UserRound" {...p}/>;
export const LoaderCircle=(p:IconProps)=><SuperIcon name="LoaderCircle" {...p}/>;
export const MapPin=(p:IconProps)=><SuperIcon name="MapPin" {...p}/>;
export const MapPinned=(p:IconProps)=><SuperIcon name="MapPinned" {...p}/>;
export const Upload=(p:IconProps)=><SuperIcon name="Upload" {...p}/>;
export const Search=(p:IconProps)=><SuperIcon name="Search" {...p}/>;
export const HelpCircle=(p:IconProps)=><SuperIcon name="HelpCircle" {...p}/>;

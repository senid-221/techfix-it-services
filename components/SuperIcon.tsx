'use client';
import type {CSSProperties, HTMLAttributes} from 'react';

type IconProps = HTMLAttributes<HTMLSpanElement> & {
  size?: number | string;
  color?: string;
  strokeWidth?: number;
};

const glyphs: Record<string,string> = {
  CheckCircle2:'check_circle',Clock3:'schedule',ShieldCheck:'verified_user',Wrench:'build',ArrowRight:'arrow_forward',ArrowLeft:'arrow_back',MessageCircle:'chat',CalendarDays:'calendar_month',UserRound:'person',LoaderCircle:'progress_activity',MapPin:'location_on',MapPinned:'location_on',Upload:'upload',Search:'search',HelpCircle:'help',
  PlayCircle:'play_circle',XCircle:'cancel',LogOut:'logout',RefreshCw:'refresh',ClipboardList:'assignment',Plus:'add',Power:'power_settings_new',Eye:'visibility',Paperclip:'attach_file',KeyRound:'key',Wallet:'account_balance_wallet',LockKeyhole:'lock',Save:'save',Copy:'content_copy',ExternalLink:'open_in_new',Send:'send',Menu:'menu',X:'close',Globe2:'language',AlertTriangle:'warning',
  ClipboardCheck:'assignment_turned_in',WalletCards:'wallet',Monitor:'desktop_windows',Wifi:'wifi',Globe:'language',
};

export function SuperIcon({name,size=20,color='currentColor',className,style,...props}:{name:keyof typeof glyphs}&IconProps){
  const mergedStyle:CSSProperties={fontSize:size,color,...style};
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
export const PlayCircle=(p:IconProps)=><SuperIcon name="PlayCircle" {...p}/>;
export const XCircle=(p:IconProps)=><SuperIcon name="XCircle" {...p}/>;
export const LogOut=(p:IconProps)=><SuperIcon name="LogOut" {...p}/>;
export const RefreshCw=(p:IconProps)=><SuperIcon name="RefreshCw" {...p}/>;
export const ClipboardList=(p:IconProps)=><SuperIcon name="ClipboardList" {...p}/>;
export const Plus=(p:IconProps)=><SuperIcon name="Plus" {...p}/>;
export const Power=(p:IconProps)=><SuperIcon name="Power" {...p}/>;
export const Eye=(p:IconProps)=><SuperIcon name="Eye" {...p}/>;
export const Paperclip=(p:IconProps)=><SuperIcon name="Paperclip" {...p}/>;
export const KeyRound=(p:IconProps)=><SuperIcon name="KeyRound" {...p}/>;
export const Wallet=(p:IconProps)=><SuperIcon name="Wallet" {...p}/>;
export const LockKeyhole=(p:IconProps)=><SuperIcon name="LockKeyhole" {...p}/>;
export const Save=(p:IconProps)=><SuperIcon name="Save" {...p}/>;
export const Copy=(p:IconProps)=><SuperIcon name="Copy" {...p}/>;
export const ExternalLink=(p:IconProps)=><SuperIcon name="ExternalLink" {...p}/>;
export const Send=(p:IconProps)=><SuperIcon name="Send" {...p}/>;
export const Menu=(p:IconProps)=><SuperIcon name="Menu" {...p}/>;
export const X=(p:IconProps)=><SuperIcon name="X" {...p}/>;
export const Globe2=(p:IconProps)=><SuperIcon name="Globe2" {...p}/>;
export const AlertTriangle=(p:IconProps)=><SuperIcon name="AlertTriangle" {...p}/>;
export const ClipboardCheck=(p:IconProps)=><SuperIcon name="ClipboardCheck" {...p}/>;
export const WalletCards=(p:IconProps)=><SuperIcon name="WalletCards" {...p}/>;
export const Monitor=(p:IconProps)=><SuperIcon name="Monitor" {...p}/>;
export const Wifi=(p:IconProps)=><SuperIcon name="Wifi" {...p}/>;
export const Globe=(p:IconProps)=><SuperIcon name="Globe" {...p}/>;
